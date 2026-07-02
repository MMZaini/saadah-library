'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { alKafiApi, Hadith } from '@/lib/api'
import { withBasePath } from '@/lib/assets'
import { hadithLocationLabel } from '@/lib/utils'
import { useHadithChapterPosition } from '@/lib/use-hadith-position'
import HadithCard from '@/components/HadithCard'
import { useChapter } from '@/lib/chapter-context'
import { usePageSearch } from '@/lib/search-context'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Loader2 } from 'lucide-react'

// Canonical Al-Kāfi hadith route. Al-Kāfi hadith ids restart at 1 in every
// volume, so the volume must be in the URL to identify a hadith unambiguously.
// The volume is known here, so we fetch only that one volume (~6 MB) rather
// than scanning all eight. The legacy /al-kafi/hadith/[hadithId] route is kept
// for older links and resolves to the lowest-numbered matching volume.
export default function AlKafiVolumeHadithPage() {
  const router = useRouter()
  const params = useParams()
  const { setChapterInfo } = useChapter()

  const volumeNumber = parseInt(params.volumeId as string)
  const hadithId = parseInt(params.hadithId as string)

  const [hadith, setHadith] = useState<Hadith | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const chapterPosition = useHadithChapterPosition(hadith)

  const { query } = usePageSearch({
    placeholder: 'Search within this hadith…',
    resetKey: `${volumeNumber}/${hadithId}`,
  })

  useEffect(() => {
    const loadHadith = async () => {
      if (Number.isNaN(volumeNumber) || Number.isNaN(hadithId)) {
        setError('Hadith not found')
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      try {
        const hadiths = await alKafiApi.getVolumeHadiths(volumeNumber)
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
  }, [volumeNumber, hadithId, setChapterInfo])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [hadithId, volumeNumber])

  const handleBackClick = () => {
    if (
      hadith?.volume &&
      hadith?.categoryId &&
      hadith?.chapterInCategoryId !== null &&
      hadith?.chapterInCategoryId !== undefined
    ) {
      router.push(
        withBasePath(
          `/al-kafi/volume/${hadith.volume}/chapter/${hadith.categoryId}/${hadith.chapterInCategoryId}`,
        ),
      )
    } else {
      router.push(withBasePath('/al-kafi'))
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
            Back to Al-Kāfi
          </button>

          <div className="flex min-h-[50vh] items-center justify-center">
            <div className="text-center">
              <h1 className="mb-2 text-xl font-bold text-foreground">
                {error || 'Hadith Not Found'}
              </h1>
              <p className="mb-5 text-sm text-foreground-muted">
                The requested hadith could not be found.
              </p>
              <Button onClick={handleBackClick}>Return to Al-Kāfi</Button>
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
          <h1 className="text-xl font-bold text-foreground">Al-Kāfi Hadith #{hadith.id}</h1>
          <p className="mt-1 text-sm text-foreground-muted">{hadithLocationLabel(hadith)}</p>
          {chapterPosition && (
            <p className="mt-0.5 text-xs text-foreground-faint">
              Hadith {chapterPosition.index} of {chapterPosition.total} in this chapter · #
              {hadith.id} in volume numbering
            </p>
          )}
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
