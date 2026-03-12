'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { bookApi, Hadith } from '@/lib/api'
import HadithCard from '@/components/HadithCard'
import { useChapter } from '@/lib/chapter-context'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Loader2 } from 'lucide-react'

export default function GenericChapterDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { setChapterInfo } = useChapter()

  const bookId = params.bookId as string
  const categoryId = params.categoryId as string
  const chapterInCategoryId = parseInt(params.chapterInCategoryId as string)

  const [hadiths, setHadiths] = useState<Hadith[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [chapterInfo, setLocalChapterInfo] = useState<{
    category: string
    chapter: string
    hadithCount: number
  } | null>(null)

  useEffect(() => {
    const loadChapter = async () => {
      setLoading(true)
      setError(null)

      try {
        const allHadiths = await bookApi.getBookHadiths(bookId)
        const chapterHadiths = allHadiths.filter(
          (h) => h.categoryId === categoryId && h.chapterInCategoryId === chapterInCategoryId,
        )

        if (chapterHadiths.length === 0) {
          setError('No hadiths found for this chapter')
          return
        }

        const first = chapterHadiths[0]
        const info = {
          category: first.category || 'Unknown',
          chapter: first.chapter || 'Unknown',
          hadithCount: chapterHadiths.length,
        }
        setLocalChapterInfo(info)
        setChapterInfo({
          volumeId: first.volume || 0,
          category: info.category,
          chapter: info.chapter,
          hadithCount: info.hadithCount,
        })

        chapterHadiths.sort((a, b) => a.id - b.id)
        setHadiths(chapterHadiths)
      } catch {
        setError('Failed to load chapter content')
      } finally {
        setLoading(false)
      }
    }

    if (bookId && categoryId && !isNaN(chapterInCategoryId)) loadChapter()

    return () => setChapterInfo(null)
  }, [bookId, categoryId, chapterInCategoryId, setChapterInfo])

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
        {chapterInfo && (
          <div className="mb-6 rounded-lg border border-border bg-surface-1 p-5">
            <h2 className="text-xl font-bold text-foreground">{chapterInfo.chapter}</h2>
            <p className="mt-1 text-sm text-foreground-muted">Category: {chapterInfo.category}</p>
            <div className="mt-2 flex gap-1.5">
              <Badge variant="secondary">{chapterInfo.hadithCount} Hadiths</Badge>
            </div>
          </div>
        )}

        <div className="space-y-5">
          {hadiths.map((h, idx) => (
            <div key={h._id || h.id || idx} className="relative">
              <div className="absolute -left-3 top-5 flex h-6 w-6 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-foreground">
                {idx + 1}
              </div>
              <div className="ml-6">
                <HadithCard hadith={h} />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 border-t border-border pt-6">
          <Button variant="outline" onClick={() => router.push('/')}>
            <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
            Back
          </Button>
        </div>
      </div>
    </main>
  )
}
