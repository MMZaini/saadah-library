'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { alKafiApi, Hadith } from '@/lib/api'
import { removeHarakat } from '@/lib/utils'
import HadithCard from '@/components/HadithCard'
import GradingFilter, { classifyHadith } from '@/components/GradingFilter'
import ChapterNavigation from '@/components/ChapterNavigation'
import { useChapter } from '@/lib/chapter-context'
import { useChapterNavigation } from '@/lib/use-chapter-navigation'
import { usePageSearch } from '@/lib/search-context'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Loader2 } from 'lucide-react'

export default function ChapterDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { setChapterInfo } = useChapter()

  const volumeId = parseInt(params.volumeId as string)
  const categoryId = params.categoryId as string
  const chapterInCategoryId = parseInt(params.chapterInCategoryId as string)

  const [hadiths, setHadiths] = useState<Hadith[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [gradingFilter, setGradingFilter] = useState<Set<'sahih' | 'hasan' | 'daif' | 'other'>>(
    new Set(),
  )

  const { query: searchQuery } = usePageSearch({
    placeholder: 'Filter this chapter…',
    resetKey: `${volumeId}/${categoryId}/${chapterInCategoryId}`,
  })
  const [chapterInfo, setLocalChapterInfo] = useState<{
    category: string
    chapter: string
    hadithCount: number
  } | null>(null)

  const chapterNav = useChapterNavigation(
    `Al-Kafi-Volume-${volumeId}-Kulayni`,
    categoryId,
    chapterInCategoryId,
  )

  useEffect(() => {
    const loadChapterHadiths = async () => {
      setLoading(true)
      setError(null)

      try {
        const allHadiths = await alKafiApi.getVolumeHadiths(volumeId)
        const chapterHadiths = allHadiths.filter(
          (hadith) =>
            hadith.categoryId === categoryId && hadith.chapterInCategoryId === chapterInCategoryId,
        )

        if (chapterHadiths.length === 0) {
          setError('No hadiths found for this chapter')
          return
        }

        const firstHadith = chapterHadiths[0]
        const info = {
          category: firstHadith.category || 'Unknown Category',
          chapter: firstHadith.chapter || 'Unknown Chapter',
          hadithCount: chapterHadiths.length,
        }

        setLocalChapterInfo(info)
        setChapterInfo({
          volumeId,
          category: info.category,
          chapter: info.chapter,
          hadithCount: info.hadithCount,
        })

        const sortedHadiths = chapterHadiths.sort((a, b) => a.id - b.id)
        setHadiths(sortedHadiths)
        setGradingFilter(new Set())
      } catch {
        setError('Failed to load chapter hadiths')
      } finally {
        setLoading(false)
      }
    }

    if (
      volumeId &&
      categoryId &&
      chapterInCategoryId !== null &&
      chapterInCategoryId !== undefined
    ) {
      loadChapterHadiths()
    }

    return () => setChapterInfo(null)
  }, [volumeId, categoryId, chapterInCategoryId, setChapterInfo])

  const filteredHadiths = useMemo(() => {
    let result = hadiths
    if (gradingFilter.size > 0) {
      result = result.filter((h) => {
        const cat = classifyHadith(h)
        return cat === 'all' || gradingFilter.has(cat as 'sahih' | 'hasan' | 'daif' | 'other')
      })
    }
    const q = searchQuery.trim().toLowerCase()
    if (q) {
      const qNoHarakat = removeHarakat(q)
      result = result.filter((h) => {
        const english = (h.englishText || h.thaqalaynMatn || '').toLowerCase()
        const arabic = h.arabicText || ''
        const arabicNorm = removeHarakat(arabic).toLowerCase()
        return (
          english.includes(q) || arabic.toLowerCase().includes(q) || arabicNorm.includes(qNoHarakat)
        )
      })
    }
    return result
  }, [hadiths, gradingFilter, searchQuery])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [volumeId, categoryId, chapterInCategoryId])

  if (loading) {
    return (
      <main className="min-h-screen">
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-foreground-muted" />
          <span className="ml-3 text-sm text-foreground-muted">Loading chapter…</span>
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
        {/* Chapter header */}
        {chapterInfo && (
          <div className="mb-6 rounded-lg border border-border bg-surface-1 p-5">
            <h2 className="text-xl font-bold text-foreground">{chapterInfo.chapter}</h2>
            <p className="mt-1 text-sm text-foreground-muted">Category: {chapterInfo.category}</p>
            <div className="mt-2 flex gap-1.5">
              <Badge variant="secondary">Volume {volumeId}</Badge>
              <Badge variant="secondary">{chapterInfo.hadithCount} Hadiths</Badge>
            </div>
          </div>
        )}

        {/* Grading filter + active search summary (the query comes from the TopBar) */}
        {hadiths.length > 0 && (
          <div className="mb-5 space-y-3">
            <GradingFilter hadiths={hadiths} selected={gradingFilter} onChange={setGradingFilter} />
            {searchQuery.trim() && (
              <p className="text-xs text-foreground-muted">
                <span className="font-medium text-accent">{filteredHadiths.length}</span> of{' '}
                {hadiths.length} match &ldquo;{searchQuery}&rdquo;
              </p>
            )}
          </div>
        )}

        {/* Hadiths */}
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

        {/* Chapter navigation + back */}
        <div className="mt-10 space-y-6 border-t border-border pt-6">
          <ChapterNavigation
            prev={chapterNav.prev}
            next={chapterNav.next}
            buildHref={(catId, chId) => `/al-kafi/volume/${volumeId}/chapter/${catId}/${chId}`}
          />
          <Button variant="outline" onClick={() => router.push('/al-kafi')}>
            <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
            Back to Al-Kāfi Explorer
          </Button>
        </div>
      </div>
    </main>
  )
}
