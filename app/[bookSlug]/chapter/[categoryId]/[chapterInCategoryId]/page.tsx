'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { bookApi, Hadith } from '@/lib/api'
import { getBookConfig, getBookIdFromUrlSlug } from '@/lib/books-config'
import { withBasePath } from '@/lib/assets'
import { removeHarakat } from '@/lib/utils'
import { recordChapterVisit } from '@/lib/reading-history'
import { useIncrementalList } from '@/lib/use-incremental-list'
import HadithCard from '@/components/HadithCard'
import ChapterNavigation from '@/components/ChapterNavigation'
import ScrollToTopButton from '@/components/ScrollToTopButton'
import { useChapter } from '@/lib/chapter-context'
import { useChapterNavigation } from '@/lib/use-chapter-navigation'
import { usePageSearch } from '@/lib/search-context'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Loader2 } from 'lucide-react'

export default function GenericChapterDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { setChapterInfo } = useChapter()

  const bookSlug = params.bookSlug as string
  const bookId = getBookIdFromUrlSlug(bookSlug)
  const categoryId = params.categoryId as string
  const chapterInCategoryId = parseInt(params.chapterInCategoryId as string)

  const [hadiths, setHadiths] = useState<Hadith[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { query: searchQuery } = usePageSearch({
    placeholder: 'Search this chapter…',
    resetKey: `${bookSlug}/${categoryId}/${chapterInCategoryId}`,
  })
  const [chapterInfo, setLocalChapterInfo] = useState<{
    category: string
    chapter: string
    hadithCount: number
  } | null>(null)

  const chapterNav = useChapterNavigation(bookId, categoryId, chapterInCategoryId)

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
        recordChapterVisit({
          path: `/${bookSlug}/chapter/${categoryId}/${chapterInCategoryId}`,
          bookTitle: getBookConfig(bookId)?.englishName || first.book || bookId,
          chapter: info.chapter,
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
  }, [bookId, bookSlug, categoryId, chapterInCategoryId, setChapterInfo])

  const filteredHadiths = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return hadiths
    const qNoHarakat = removeHarakat(q)
    return hadiths.filter((h) => {
      const english = (h.englishText || h.thaqalaynMatn || '').toLowerCase()
      const arabic = h.arabicText || ''
      const arabicNorm = removeHarakat(arabic).toLowerCase()
      return (
        english.includes(q) || arabic.toLowerCase().includes(q) || arabicNorm.includes(qNoHarakat)
      )
    })
  }, [hadiths, searchQuery])

  // Long chapters render incrementally — mounting hundreds of cards at once
  // makes the initial paint and every reflow expensive.
  const { visibleItems, hasMore, remainingCount, sentinelRef, showAll } =
    useIncrementalList(filteredHadiths)

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

  const displayBookTitle = getBookConfig(bookId)?.englishName || bookSlug?.replace(/-/g, ' ')

  if (error) {
    return (
      <main className="min-h-screen">
        <div className="hadith-reading-container mx-auto max-w-5xl px-4 py-8 sm:px-6">
          <div className="border-destructive/30 bg-destructive/10 rounded-lg border p-4">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen">
      <div className="hadith-reading-container mx-auto max-w-5xl px-4 py-8 sm:px-6">
        {/* Chapter header */}
        {chapterInfo && (
          <div className="mb-6 rounded-lg border border-border bg-surface-1 p-5">
            <h2 className="text-xl font-bold text-foreground">{chapterInfo.chapter}</h2>
            {chapterInfo.category !== chapterInfo.chapter && (
              <p className="mt-1 text-sm text-foreground-muted">Category: {chapterInfo.category}</p>
            )}
            <div className="mt-2 flex gap-1.5">
              <Badge variant="secondary">{chapterInfo.hadithCount} Hadiths</Badge>
            </div>
          </div>
        )}

        {/* Active search summary (the query comes from the TopBar) */}
        {hadiths.length > 0 && searchQuery.trim() && (
          <div className="mb-5">
            <p className="text-xs text-foreground-muted">
              <span className="font-medium text-accent">{filteredHadiths.length}</span> of{' '}
              {hadiths.length} match &ldquo;{searchQuery}&rdquo;
            </p>
          </div>
        )}

        {/* Hadiths */}
        <div className="space-y-5">
          {visibleItems.map((h, idx) => (
            <div key={h._id || h.id || idx} className="relative">
              <div className="absolute -left-3 top-5 flex h-6 w-6 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-foreground">
                {idx + 1}
              </div>
              <div className="ml-6">
                <HadithCard hadith={h} highlightQuery={searchQuery} />
              </div>
            </div>
          ))}
        </div>

        {hasMore && (
          <div ref={sentinelRef} className="flex justify-center py-6">
            <Button variant="outline" size="sm" onClick={showAll}>
              Show all ({remainingCount} more)
            </Button>
          </div>
        )}

        {/* Chapter navigation + back */}
        <div className="mt-10 space-y-6 border-t border-border pt-6">
          <ChapterNavigation
            prev={chapterNav.prev}
            next={chapterNav.next}
            buildHref={(catId, chId) => `/${bookSlug}/chapter/${catId}/${chId}`}
          />
          <Button variant="outline" onClick={() => router.push(withBasePath(`/${bookSlug}`))}>
            <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
            Back to {displayBookTitle}
          </Button>
        </div>
      </div>
      <ScrollToTopButton />
    </main>
  )
}
