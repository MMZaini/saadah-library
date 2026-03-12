'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { thaqalaynApi, Hadith } from '@/lib/api'
import HadithCard from '@/components/HadithCard'
import { useChapter } from '@/lib/chapter-context'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Loader2 } from 'lucide-react'

export default function HadithPage() {
  const router = useRouter()
  const params = useParams()
  const { setChapterInfo } = useChapter()

  const hadithId = parseInt(params.hadithId as string)

  const [hadith, setHadith] = useState<Hadith | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadHadith = async () => {
      setLoading(true)
      setError(null)

      try {
        let foundHadith: Hadith | null = null

        const uyunVolumes = [
          'Uyun-akhbar-al-Rida-Volume-1-Saduq',
          'Uyun-akhbar-al-Rida-Volume-2-Saduq',
        ]

        for (const volumeBookId of uyunVolumes) {
          try {
            const volumeHadiths = await thaqalaynApi.getBookHadiths(volumeBookId)
            foundHadith = volumeHadiths.find((h) => h.id === hadithId) || null
            if (foundHadith) break
          } catch {
            continue
          }
        }

        if (!foundHadith) {
          setError('Hadith not found')
          return
        }

        setHadith(foundHadith)
        setChapterInfo({
          volumeId: foundHadith.volume,
          category: foundHadith.category || 'Unknown Category',
          chapter: foundHadith.chapter || 'Unknown Chapter',
          hadithCount: 1,
          categoryId: foundHadith.categoryId,
          chapterInCategoryId: foundHadith.chapterInCategoryId,
        })
      } catch {
        setError('Failed to load hadith')
      } finally {
        setLoading(false)
      }
    }

    if (hadithId) loadHadith()

    return () => setChapterInfo(null)
  }, [hadithId, setChapterInfo])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [hadithId])

  const handleBackClick = () => {
    if (
      hadith?.volume &&
      hadith?.categoryId &&
      hadith?.chapterInCategoryId !== null &&
      hadith?.chapterInCategoryId !== undefined
    ) {
      router.push(
        `/Uyun-akhbar-al-Rida/volume/${hadith.volume}/chapter/${hadith.categoryId}/${hadith.chapterInCategoryId}`,
      )
    } else {
      router.push('/Uyun-akhbar-al-Rida')
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
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
          <button
            onClick={handleBackClick}
            className="mb-6 flex items-center gap-1.5 text-sm text-foreground-muted transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to ʿUyūn akhbār al-Riḍā
          </button>

          <div className="flex min-h-[50vh] items-center justify-center">
            <div className="text-center">
              <h1 className="mb-2 text-xl font-bold text-foreground">
                {error || 'Hadith Not Found'}
              </h1>
              <p className="mb-5 text-sm text-foreground-muted">
                The requested hadith could not be found.
              </p>
              <Button onClick={handleBackClick}>Return to ʿUyūn akhbār al-Riḍā</Button>
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <button
          onClick={handleBackClick}
          className="mb-6 flex items-center gap-1.5 text-sm text-foreground-muted transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Chapter
        </button>

        <div className="mb-6 text-center">
          <h1 className="text-xl font-bold text-foreground">
            ʿUyūn akhbār al-Riḍā Hadith #{hadith.id}
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
            <HadithCard hadith={hadith} showViewChapter={false} />
          </div>
        </div>
      </div>
    </main>
  )
}
