'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { bookApi, Hadith } from '@/lib/api'
import { getBookConfig, getBookIdFromUrlSlug } from '@/lib/books-config'
import { removeHarakat } from '@/lib/utils'
import HadithCard from '@/components/HadithCard'
import ChapterSearch from '@/components/ChapterSearch'
import GradingFilter, { classifyHadith } from '@/components/GradingFilter'
import { useChapter } from '@/lib/chapter-context'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Loader2 } from 'lucide-react'

function resolveVolumeBookId(bookId: string, volumeParam: string): string {
  const config = getBookConfig(bookId)
  if (!config?.hasMultipleVolumes || !config.volumes?.length) return bookId

  const byExact = config.volumes.find((volumeId) => volumeId === volumeParam)
  if (byExact) return byExact

  const volumeNumber = Number(volumeParam)
  if (Number.isFinite(volumeNumber)) {
    const byNumber = config.volumes.find((volumeId) =>
      volumeId.includes(`-Volume-${volumeNumber}-`),
    )
    if (byNumber) return byNumber
  }

  return config.volumes[0]
}

export default function GenericVolumeChapterPage() {
  const router = useRouter()
  const params = useParams()
  const { setChapterInfo } = useChapter()

  const bookSlug = params.bookSlug as string
  const baseBookId = getBookIdFromUrlSlug(bookSlug)
  const volumeParam = params.volumeId as string
  const volumeBookId = resolveVolumeBookId(baseBookId, volumeParam)
  const categoryId = params.categoryId as string
  const chapterInCategoryId = parseInt(params.chapterInCategoryId as string)

  const [hadiths, setHadiths] = useState<Hadith[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [gradingFilter, setGradingFilter] = useState<Set<'sahih' | 'hasan' | 'daif' | 'other'>>(
    new Set(),
  )
  const [chapterInfo, setLocalChapterInfo] = useState<{
    category: string
    chapter: string
    hadithCount: number
    volume: number
  } | null>(null)

  useEffect(() => {
    const loadChapter = async () => {
      setLoading(true)
      setError(null)

      try {
        const allHadiths = await bookApi.getBookHadiths(volumeBookId)
        const chapterHadiths = allHadiths.filter(
          (hadith) =>
            hadith.categoryId === categoryId && hadith.chapterInCategoryId === chapterInCategoryId,
        )

        if (chapterHadiths.length === 0) {
          setError('No hadiths found for this chapter')
          return
        }

        chapterHadiths.sort((a, b) => a.id - b.id)
        const first = chapterHadiths[0]
        const info = {
          category: first.category || 'Unknown',
          chapter: first.chapter || 'Unknown',
          hadithCount: chapterHadiths.length,
          volume: first.volume || Number(volumeParam) || 0,
        }

        setHadiths(chapterHadiths)
        setSearchQuery('')
        setGradingFilter(new Set())
        setLocalChapterInfo(info)
        setChapterInfo({
          volumeId: info.volume,
          category: info.category,
          chapter: info.chapter,
          hadithCount: info.hadithCount,
          categoryId: first.categoryId,
          chapterInCategoryId: first.chapterInCategoryId,
        })
      } catch {
        setError('Failed to load chapter content')
      } finally {
        setLoading(false)
      }
    }

    if (volumeBookId && categoryId && !Number.isNaN(chapterInCategoryId)) loadChapter()

    return () => setChapterInfo(null)
  }, [volumeBookId, volumeParam, categoryId, chapterInCategoryId, setChapterInfo])

  const filteredHadiths = useMemo(() => {
    let result = hadiths
    if (gradingFilter.size > 0) {
      result = result.filter((hadith) => {
        const category = classifyHadith(hadith)
        return (
          category === 'all' || gradingFilter.has(category as 'sahih' | 'hasan' | 'daif' | 'other')
        )
      })
    }

    const q = searchQuery.trim().toLowerCase()
    if (!q) return result

    const qNoHarakat = removeHarakat(q)
    return result.filter((hadith) => {
      const english = (hadith.englishText || hadith.thaqalaynMatn || '').toLowerCase()
      const arabic = hadith.arabicText || ''
      const arabicNorm = removeHarakat(arabic).toLowerCase()
      return (
        english.includes(q) || arabic.toLowerCase().includes(q) || arabicNorm.includes(qNoHarakat)
      )
    })
  }, [hadiths, gradingFilter, searchQuery])

  if (loading) {
    return (
      <main className="min-h-screen">
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-foreground-muted" />
          <span className="ml-3 text-sm text-foreground-muted">Loading chapter...</span>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="min-h-screen">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
          <div className="border-destructive/30 bg-destructive/10 rounded-lg border p-4">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        {chapterInfo && (
          <div className="mb-6 rounded-lg border border-border bg-surface-1 p-5">
            <h2 className="text-xl font-bold text-foreground">{chapterInfo.chapter}</h2>
            <p className="mt-1 text-sm text-foreground-muted">Category: {chapterInfo.category}</p>
            <div className="mt-2 flex gap-1.5">
              <Badge variant="secondary">Volume {chapterInfo.volume}</Badge>
              <Badge variant="secondary">{chapterInfo.hadithCount} Hadiths</Badge>
            </div>
          </div>
        )}

        {hadiths.length > 0 && (
          <div className="mb-5 space-y-3">
            <ChapterSearch
              value={searchQuery}
              onChange={setSearchQuery}
              resultCount={filteredHadiths.length}
              totalCount={hadiths.length}
            />
            <GradingFilter hadiths={hadiths} selected={gradingFilter} onChange={setGradingFilter} />
          </div>
        )}

        <div className="space-y-5">
          {filteredHadiths.map((hadith, index) => (
            <div key={hadith._id || hadith.id || index} className="relative">
              <div className="absolute -left-3 top-5 flex h-6 w-6 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-foreground">
                {index + 1}
              </div>
              <div className="ml-6">
                <HadithCard hadith={hadith} highlightQuery={searchQuery} />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 border-t border-border pt-6">
          <Button variant="outline" onClick={() => router.push(`/${bookSlug}`)}>
            <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
            Back to Explorer
          </Button>
        </div>
      </div>
    </main>
  )
}
