'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { bookApi, Hadith } from '@/lib/api'
import { getBookIdFromUrlSlug } from '@/lib/books-config'
import HadithCard from '@/components/HadithCard'
import { IconArrowLeft } from '@/components/Icons'
import { useSettings } from '@/lib/settings-context'
import { useChapter } from '@/lib/chapter-context'

export default function GenericChapterDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { settings } = useSettings()
  const { setChapterInfo } = useChapter()

  const bookSlug = params.bookSlug as string
  const bookId = getBookIdFromUrlSlug(bookSlug)
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

        // sort by id
        chapterHadiths.sort((a, b) => a.id - b.id)
        setHadiths(chapterHadiths)
      } catch (err) {
        // Failed to load chapter content
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
      <main className="min-h-screen" data-theme={settings.theme}>
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="border-theme rounded-xl border bg-card p-12 shadow-soft">
            <div className="flex items-center justify-center">
              <div className="border-accent-primary h-8 w-8 animate-spin rounded-full border-b-2" />
              <span className="text-secondary ml-3">Loading chapter hadiths...</span>
            </div>
          </div>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="min-h-screen" data-theme={settings.theme}>
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="rounded-xl border border-red-200/60 bg-red-50/80 p-6 shadow-soft dark:border-red-800/30 dark:bg-red-900/20">
            <p className="text-red-800 dark:text-red-300">{error}</p>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen" data-theme={settings.theme}>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {chapterInfo && (
          <div className="border-theme mb-6 rounded-xl border bg-card p-6 shadow-soft">
            <h2 className="text-2xl font-bold">{chapterInfo.chapter}</h2>
            <p className="text-sm text-muted">Category: {chapterInfo.category}</p>
          </div>
        )}

        <div className="space-y-6">
          {hadiths.map((h, idx) => (
            <div key={h._id || h.id || idx} className="relative">
              <div className="bg-accent-primary shadow-medium absolute -left-4 top-6 flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white">
                {idx + 1}
              </div>
              <div className="ml-8">
                <HadithCard hadith={h} />
              </div>
            </div>
          ))}
        </div>

        <div className="border-theme mt-12 border-t pt-8">
          <button
            onClick={() => router.push('/')}
            className="border-theme hover:bg-hover-color text-primary inline-flex items-center gap-2 rounded-lg border bg-card px-4 py-2"
          >
            <IconArrowLeft className="h-4 w-4" />
            Back
          </button>
        </div>
      </div>
    </main>
  )
}
