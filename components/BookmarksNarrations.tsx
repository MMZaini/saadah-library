'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import Link from 'next/link'
import { useBookmarks } from '@/lib/bookmarks-context'
import { thaqalaynApi, Hadith } from '@/lib/api'
import { withBasePath } from '@/lib/assets'
import BookmarkCard from '@/components/BookmarkCard'
import BookmarkedHadithCard from '@/components/BookmarkedHadithCard'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Bookmark, Search, Loader2, StickyNote, ChevronDown, Check } from 'lucide-react'

const bookmarkKey = (bookId: string | undefined, id: number) => `${bookId ?? ''}::${id}`

const FILTER_OPTIONS = [
  { value: 'both' as const, label: 'Both' },
  { value: 'hadith' as const, label: 'Hadith' },
  { value: 'notes' as const, label: 'Notes' },
]

interface BookmarksNarrationsProps {
  searchQuery: string
  onClearSearch: () => void
}

export default function BookmarksNarrations({
  searchQuery,
  onClearSearch,
}: BookmarksNarrationsProps) {
  const { bookmarks, bookmarkCount } = useBookmarks()
  // Loaded full hadiths keyed by bookId::id. Kept across bookmark changes so
  // removing (or annotating) one bookmark doesn't refetch — and re-flash —
  // the whole list.
  const [hadithsByKey, setHadithsByKey] = useState<Record<string, Hadith>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchFilter, setSearchFilter] = useState<'both' | 'hadith' | 'notes'>('both')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [globalNotesVisible, setGlobalNotesVisible] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Identity of the bookmark set — notes edits and reorderings don't change it.
  const bookmarkIdentityKey = useMemo(
    () =>
      bookmarks
        .map((bookmark) => bookmarkKey(bookmark.bookId, bookmark.id))
        .sort()
        .join('|'),
    [bookmarks],
  )

  useEffect(() => {
    let cancelled = false

    const wanted = bookmarks.filter((bookmark) => Boolean(bookmark.bookId))
    const missing = wanted.filter(
      (bookmark) => !(bookmarkKey(bookmark.bookId, bookmark.id) in hadithsByKey),
    )

    // Legacy bookmarks without a bookId can't be located without scanning the
    // whole corpus; they render from their stored preview instead.
    const unresolvable = bookmarks.length - wanted.length

    if (missing.length === 0) {
      setError(
        unresolvable > 0
          ? `${unresolvable} older bookmark(s) could not be matched to a book; showing saved previews.`
          : null,
      )
      return
    }

    const fetchMissing = async () => {
      setLoading(true)
      setError(null)

      const fetched = await Promise.all(
        missing.map(async (bookmark) => {
          try {
            const hadith = await thaqalaynApi.getSpecificHadith(bookmark.bookId, bookmark.id)
            return [bookmarkKey(bookmark.bookId, bookmark.id), hadith] as const
          } catch {
            return null
          }
        }),
      )

      if (cancelled) return

      const additions = fetched.filter((entry): entry is [string, Hadith] => entry !== null)
      if (additions.length > 0) {
        setHadithsByKey((prev) => ({ ...prev, ...Object.fromEntries(additions) }))
      }

      const failed = missing.length - additions.length
      if (failed > 0) {
        setError(`Could not load ${failed} bookmark(s). They may no longer exist.`)
      } else if (unresolvable > 0) {
        setError(
          `${unresolvable} older bookmark(s) could not be matched to a book; showing saved previews.`,
        )
      }
      setLoading(false)
    }

    fetchMissing()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookmarkIdentityKey])

  const fullHadiths = useMemo(
    () =>
      bookmarks
        .map((bookmark) => hadithsByKey[bookmarkKey(bookmark.bookId, bookmark.id)])
        .filter((hadith): hadith is Hadith => Boolean(hadith)),
    [bookmarks, hadithsByKey],
  )

  const filteredBookmarks = bookmarks.filter((bookmark) => {
    if (!searchQuery.trim()) return true
    const query = searchQuery.toLowerCase()
    // Match on bookId + id: hadith IDs repeat across books, so id alone collides.
    const fullHadith = fullHadiths.find((h) => h.id === bookmark.id && h.bookId === bookmark.bookId)

    switch (searchFilter) {
      case 'hadith':
        if (fullHadith) {
          return (
            fullHadith.englishText?.toLowerCase().includes(query) ||
            fullHadith.arabicText?.toLowerCase().includes(query) ||
            fullHadith.category?.toLowerCase().includes(query) ||
            fullHadith.chapter?.toLowerCase().includes(query) ||
            fullHadith.book?.toLowerCase().includes(query) ||
            fullHadith.author?.toLowerCase().includes(query) ||
            fullHadith.translator?.toLowerCase().includes(query) ||
            fullHadith.majlisiGrading?.toLowerCase().includes(query) ||
            fullHadith.mohseniGrading?.toLowerCase().includes(query) ||
            fullHadith.behbudiGrading?.toLowerCase().includes(query)
          )
        }
        return (
          bookmark.preview.toLowerCase().includes(query) ||
          bookmark.arabicPreview?.toLowerCase().includes(query) ||
          bookmark.category.toLowerCase().includes(query) ||
          bookmark.chapter.toLowerCase().includes(query) ||
          bookmark.book.toLowerCase().includes(query)
        )
      case 'notes':
        return bookmark.notes?.toLowerCase().includes(query) || false
      default: {
        const hadithMatch = fullHadith
          ? fullHadith.englishText?.toLowerCase().includes(query) ||
            fullHadith.arabicText?.toLowerCase().includes(query) ||
            fullHadith.category?.toLowerCase().includes(query) ||
            fullHadith.chapter?.toLowerCase().includes(query) ||
            fullHadith.book?.toLowerCase().includes(query) ||
            fullHadith.author?.toLowerCase().includes(query) ||
            fullHadith.translator?.toLowerCase().includes(query) ||
            fullHadith.majlisiGrading?.toLowerCase().includes(query) ||
            fullHadith.mohseniGrading?.toLowerCase().includes(query) ||
            fullHadith.behbudiGrading?.toLowerCase().includes(query)
          : bookmark.preview.toLowerCase().includes(query) ||
            bookmark.arabicPreview?.toLowerCase().includes(query) ||
            bookmark.category.toLowerCase().includes(query) ||
            bookmark.chapter.toLowerCase().includes(query) ||
            bookmark.book.toLowerCase().includes(query)
        const notesMatch = bookmark.notes?.toLowerCase().includes(query)
        return hadithMatch || notesMatch
      }
    }
  })

  const filteredFullHadiths = fullHadiths.filter((hadith) =>
    filteredBookmarks.some(
      (bookmark) => bookmark.id === hadith.id && bookmark.bookId === hadith.bookId,
    ),
  )

  if (bookmarkCount === 0) {
    return (
      <div className="py-16 text-center">
        <Bookmark className="mx-auto mb-3 h-12 w-12 text-foreground-faint" />
        <h2 className="mb-1 text-lg font-semibold text-foreground">No bookmarked narrations yet</h2>
        <p className="mb-5 text-sm text-foreground-muted">
          Start bookmarking your favorite hadiths to see them here.
        </p>
        <Button asChild>
          <Link href={withBasePath('/')}>Browse Hadiths</Link>
        </Button>
      </div>
    )
  }

  // Full-screen spinner only on the initial load; later fetches (e.g. an
  // import adding new bookmarks) keep the existing list on screen.
  if (loading && fullHadiths.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-foreground-muted" />
        <span className="ml-3 text-sm text-foreground-muted">Loading narrations…</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-foreground-muted">Search in:</span>
          <div className="relative min-w-[130px]" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex w-full items-center justify-between rounded-lg border border-border bg-surface-1 px-3.5 py-2.5 text-sm text-foreground transition-colors hover:bg-surface-2"
            >
              <span>{FILTER_OPTIONS.find((opt) => opt.value === searchFilter)?.label}</span>
              <ChevronDown
                className={cn(
                  'ml-2 h-3.5 w-3.5 text-foreground-muted transition-transform',
                  isDropdownOpen && 'rotate-180',
                )}
              />
            </button>

            {isDropdownOpen && (
              <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-lg border border-border bg-surface-1 shadow-lg">
                {FILTER_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      setSearchFilter(option.value)
                      setIsDropdownOpen(false)
                    }}
                    className={cn(
                      'flex w-full items-center justify-between px-3.5 py-2.5 text-left text-sm transition-colors',
                      searchFilter === option.value
                        ? 'bg-accent text-accent-foreground'
                        : 'text-foreground hover:bg-surface-2',
                    )}
                  >
                    <span>{option.label}</span>
                    {searchFilter === option.value && <Check className="h-3.5 w-3.5" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <Button
          variant={globalNotesVisible ? 'default' : 'outline'}
          size="sm"
          onClick={() => setGlobalNotesVisible(!globalNotesVisible)}
        >
          <StickyNote className="mr-1.5 h-3.5 w-3.5" />
          {globalNotesVisible ? 'Hide All Notes' : 'Show All Notes'}
        </Button>
      </div>

      {/* Search results info */}
      {searchQuery.trim() && (
        <p className="text-xs text-foreground-muted">
          {filteredBookmarks.length === bookmarkCount
            ? `Showing all ${bookmarkCount} narrations`
            : `Found ${filteredBookmarks.length} of ${bookmarkCount} narrations`}
        </p>
      )}

      {/* Error */}
      {error && (
        <div className="border-destructive/30 bg-destructive/10 rounded-lg border p-3">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {filteredBookmarks.length === 0 && searchQuery.trim() ? (
        <div className="py-16 text-center">
          <Search className="mx-auto mb-3 h-12 w-12 text-foreground-faint" />
          <h2 className="mb-1 text-lg font-semibold text-foreground">No results found</h2>
          <p className="mb-4 text-sm text-foreground-muted">
            No narrations match your search criteria.
          </p>
          <Button variant="ghost" onClick={onClearSearch}>
            Clear search
          </Button>
        </div>
      ) : (
        <>
          {/* Full hadith cards */}
          {filteredFullHadiths.length > 0 && (
            <div className="space-y-5">
              {filteredFullHadiths.map((hadith, idx) => {
                const bookmark = filteredBookmarks.find(
                  (b) => b.id === hadith.id && b.bookId === hadith.bookId,
                )
                return bookmark ? (
                  <div key={hadith.bookId + ':' + hadith.id} className="relative">
                    <div className="absolute -left-3 top-5 flex h-6 w-6 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-foreground">
                      {idx + 1}
                    </div>
                    <div className="ml-6">
                      <BookmarkedHadithCard
                        hadith={hadith}
                        bookmark={bookmark}
                        showViewChapter={false}
                        globalNotesVisible={globalNotesVisible}
                      />
                    </div>
                  </div>
                ) : null
              })}
            </div>
          )}

          {/* Preview cards for bookmarks whose full content isn't available
              (legacy entries without a bookId, or failed loads) — previously a
              mixed list silently hid these. */}
          {(() => {
            const previewBookmarks = filteredBookmarks.filter(
              (bookmark) => !hadithsByKey[bookmarkKey(bookmark.bookId, bookmark.id)],
            )
            if (previewBookmarks.length === 0) return null
            return (
              <div className={cn('space-y-4', filteredFullHadiths.length > 0 && 'mt-6')}>
                <p className="text-xs text-foreground-muted">
                  {filteredFullHadiths.length > 0
                    ? 'Saved previews (full content unavailable for these):'
                    : 'Full content could not be loaded. Here are your bookmark previews:'}
                </p>
                {previewBookmarks.map((bookmark) => (
                  <BookmarkCard key={bookmark.bookId + ':' + bookmark.id} bookmark={bookmark} />
                ))}
              </div>
            )
          })()}
        </>
      )}
    </div>
  )
}
