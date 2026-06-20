'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { bookApi, Hadith } from '@/lib/api'
import { getBookConfig, getBookIdFromUrlSlug } from '@/lib/books-config'
import HadithCard from '@/components/HadithCard'
import { useChapter } from '@/lib/chapter-context'
import { usePageSearch } from '@/lib/search-context'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Loader2 } from 'lucide-react'

// Resolve the runtime volume bookId for a multi-volume book from the URL's
// volume segment (mirrors the volume/chapter route's resolver).
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

// Canonical hadith route for multi-volume books (e.g. Man lā yaḥḍuruh, ʿUyūn).
// Hadith ids restart at 1 per volume, so the volume must be in the URL to
// identify a hadith unambiguously; the volume is known here, so we fetch only
// that one volume. The legacy /[bookSlug]/hadith/[hadithId] route remains for
// older links and single-volume books.
export default function GenericVolumeHadithPage() {
  const router = useRouter()
  const params = useParams()
  const { setChapterInfo } = useChapter()

  const urlSlug = params?.bookSlug as string
  const baseBookId = getBookIdFromUrlSlug(urlSlug)
  const volumeParam = params.volumeId as string
  const volumeBookId = resolveVolumeBookId(baseBookId, volumeParam)
  const hadithId = parseInt(params.hadithId as string)

  const [hadith, setHadith] = useState<Hadith | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { query } = usePageSearch({
    placeholder: 'Search within this hadith…',
    resetKey: `${volumeBookId}/${hadithId}`,
  })

  useEffect(() => {
    const loadHadith = async () => {
      if (!volumeBookId || Number.isNaN(hadithId)) {
        setError('Hadith not found')
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      try {
        const hadiths = await bookApi.getBookHadiths(volumeBookId)
        const found = hadiths.find((h) => h.id === hadithId) ?? null

        if (!found) {
          setError('Hadith not found')
          return
        }

        setHadith(found)
        setChapterInfo({
          volumeId: found.volume,
          category: found.category || 'Unknown Category',
          chapter: found.chapter || 'Unknown Chapter',
          hadithCount: 1,
          categoryId: found.categoryId,
          chapterInCategoryId: found.chapterInCategoryId,
        })
      } catch {
        setError('Failed to load hadith')
      } finally {
        setLoading(false)
      }
    }

    loadHadith()

    return () => setChapterInfo(null)
  }, [volumeBookId, hadithId, setChapterInfo])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [hadithId, volumeBookId])

  const displayBookTitle =
    getBookConfig(baseBookId || '')?.englishName || urlSlug?.replace(/-/g, ' ') || 'Book'

  const handleBackClick = () => {
    if (
      hadith?.volume &&
      hadith?.categoryId &&
      hadith?.chapterInCategoryId !== null &&
      hadith?.chapterInCategoryId !== undefined
    ) {
      router.push(
        `/${urlSlug}/volume/${hadith.volume}/chapter/${hadith.categoryId}/${hadith.chapterInCategoryId}`,
      )
    } else {
      router.push(`/${urlSlug}`)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen">
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-foreground-muted" />
        </div>
      </main>
    )
  }

  if (error || !hadith) {
    return (
      <main className="min-h-screen">
        <div className="hadith-reading-container mx-auto max-w-4xl px-4 py-8 sm:px-6">
          <button
            onClick={handleBackClick}
            className="mb-6 flex items-center gap-1.5 text-sm text-foreground-muted transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to {displayBookTitle}
          </button>

          <div className="flex min-h-[50vh] items-center justify-center">
            <div className="text-center">
              <h1 className="mb-2 text-xl font-bold text-foreground">
                {error || 'Hadith Not Found'}
              </h1>
              <p className="mb-5 text-sm text-foreground-muted">
                The requested hadith could not be found.
              </p>
              <Button onClick={handleBackClick}>Return to {displayBookTitle}</Button>
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen">
      <div className="hadith-reading-container mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <button
          onClick={handleBackClick}
          className="mb-6 flex items-center gap-1.5 text-sm text-foreground-muted transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Chapter
        </button>

        <div className="mb-6 text-center">
          <h1 className="text-xl font-bold text-foreground">
            {displayBookTitle} Hadith #{hadith.id}
          </h1>
          <p className="mt-1 text-sm text-foreground-muted">
            Volume {hadith.volume} · {hadith.category} · {hadith.chapter}
          </p>
        </div>

        <div className="relative">
          <div className="absolute -left-3 top-5 flex h-6 w-6 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-foreground">
            1
          </div>
          <div className="ml-6">
            <HadithCard hadith={hadith} showViewChapter={false} highlightQuery={query} />
          </div>
        </div>
      </div>
    </main>
  )
}
