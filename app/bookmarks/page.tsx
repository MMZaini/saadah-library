'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useBookmarks } from '@/lib/bookmarks-context'
import { thaqalaynApi, Hadith } from '@/lib/api'
import { getBookConfig, getBookUrlSlug } from '@/lib/books-config'
import HadithCard from '@/components/HadithCard'
import BookmarkCard from '@/components/BookmarkCard'
import BookmarkedHadithCard from '@/components/BookmarkedHadithCard'
import { useSettings } from '@/lib/settings-context'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Bookmark,
  Search,
  Loader2,
  Download,
  Upload,
  RefreshCw,
  StickyNote,
  ChevronDown,
  Check,
} from 'lucide-react'

const FILTER_OPTIONS = [
  { value: 'both' as const, label: 'Both' },
  { value: 'hadith' as const, label: 'Hadith' },
  { value: 'notes' as const, label: 'Notes' },
]

export default function BookmarksPage() {
  const { bookmarks, bookmarkCount, addBookmark, removeBookmark, importBookmarks } = useBookmarks()
  const { settings } = useSettings()
  const [fullHadiths, setFullHadiths] = useState<Hadith[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchFilter, setSearchFilter] = useState<'both' | 'hadith' | 'notes'>('both')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [globalNotesVisible, setGlobalNotesVisible] = useState(false)
  const [importMessage, setImportMessage] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleExportBookmarks = () => {
    try {
      const exportBookmarks = bookmarks.map((bookmark) => ({
        id: bookmark.id,
        bookId: bookmark.bookId,
        book: bookmark.book,
        category: bookmark.category,
        chapter: bookmark.chapter,
        volume: bookmark.volume,
        timestamp: bookmark.timestamp,
        notes: bookmark.notes || '',
      }))

      const exportData = { version: '1.0', bookmarks: exportBookmarks }
      const dataStr = JSON.stringify(exportData, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)

      const link = document.createElement('a')
      link.href = url
      link.download = `saadah-bookmarks-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Failed to export bookmarks:', err)
      setError('Failed to export bookmarks. Please try again.')
    }
  }

  const handleImportBookmarks = () => {
    fileInputRef.current?.click()
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const result = e.target?.result as string
        const data = JSON.parse(result)

        if (!data.bookmarks || !Array.isArray(data.bookmarks)) {
          throw new Error('Invalid bookmark file format')
        }

        const { imported, duplicates } = importBookmarks(data.bookmarks)

        let message = `Successfully imported ${imported} bookmark${imported !== 1 ? 's' : ''}.`
        if (duplicates > 0) {
          message += ` ${duplicates} duplicate${duplicates !== 1 ? 's' : ''} were skipped.`
        }

        setImportMessage(message)
        setTimeout(() => setImportMessage(null), 5000)
      } catch (err) {
        console.error('Failed to import bookmarks:', err)
        setError('Failed to import bookmarks. Please check the file format and try again.')
      }
    }

    reader.readAsText(file)
    event.target.value = ''
  }

  useEffect(() => {
    if (bookmarks.length === 0) {
      setFullHadiths([])
      return
    }

    const fetchHadiths = async () => {
      setLoading(true)
      setError(null)

      try {
        const hadithPromises = bookmarks.map(async (bookmark) => {
          try {
            if (bookmark.bookId) {
              return await thaqalaynApi.getSpecificHadith(bookmark.bookId, bookmark.id)
            } else {
              const searchResult = await thaqalaynApi.searchAllBooks(`#${bookmark.id}`)
              return searchResult.results.find((h) => h.id === bookmark.id) || null
            }
          } catch {
            return null
          }
        })

        const results = await Promise.all(hadithPromises)
        const validHadiths = results.filter((h: Hadith | null): h is Hadith => h !== null)
        setFullHadiths(validHadiths)

        if (validHadiths.length < bookmarks.length) {
          setError(
            `Could not load ${bookmarks.length - validHadiths.length} bookmark(s). They may no longer exist.`,
          )
        }
      } catch {
        setError('Failed to load bookmarks. Please check your connection and try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchHadiths()
  }, [bookmarks])

  const filteredBookmarks = bookmarks.filter((bookmark) => {
    if (!searchQuery.trim()) return true
    const query = searchQuery.toLowerCase()
    const fullHadith = fullHadiths.find((h) => h.id === bookmark.id)

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
    filteredBookmarks.some((bookmark) => bookmark.id === hadith.id),
  )

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex items-center gap-3">
          <Bookmark className="h-5 w-5 text-bookmark" />
          <h1 className="text-xl font-bold text-foreground">Bookmarks</h1>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-foreground-muted" />
          <span className="ml-3 text-sm text-foreground-muted">Loading bookmarks…</span>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <Bookmark className="h-5 w-5 text-bookmark" />
        <h1 className="text-xl font-bold text-foreground">Bookmarks</h1>
        {bookmarkCount > 0 && <Badge variant="secondary">{bookmarkCount}</Badge>}
      </div>

      {/* Action buttons */}
      <div className="mb-6 flex flex-wrap gap-2">
        {bookmarkCount > 0 && (
          <Button
            variant={globalNotesVisible ? 'default' : 'outline'}
            size="sm"
            onClick={() => setGlobalNotesVisible(!globalNotesVisible)}
          >
            <StickyNote className="mr-1.5 h-3.5 w-3.5" />
            {globalNotesVisible ? 'Hide All Notes' : 'Show All Notes'}
          </Button>
        )}

        <Button variant="outline" size="sm" onClick={handleImportBookmarks}>
          <Upload className="mr-1.5 h-3.5 w-3.5" />
          Import
        </Button>
        <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
          <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
          Refresh
        </Button>
        {bookmarkCount > 0 && (
          <Button variant="outline" size="sm" onClick={handleExportBookmarks}>
            <Download className="mr-1.5 h-3.5 w-3.5" />
            Export
          </Button>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Search */}
      {bookmarkCount > 0 && (
        <div className="mb-6 flex flex-col gap-3 sm:flex-row">
          <div className="flex flex-1 items-center gap-3 rounded-lg border border-border bg-surface-1 px-3.5 py-2.5">
            <Search className="h-4 w-4 shrink-0 text-foreground-faint" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-foreground-faint"
              placeholder="Search through your bookmarks…"
            />
          </div>

          {/* Filter dropdown */}
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

          {searchQuery.trim() && (
            <p className="self-center text-xs text-foreground-muted sm:hidden">
              {filteredBookmarks.length === bookmarkCount
                ? `Showing all ${bookmarkCount} bookmarks`
                : `Found ${filteredBookmarks.length} of ${bookmarkCount}`}
            </p>
          )}
        </div>
      )}

      {/* Search results info (desktop) */}
      {searchQuery.trim() && (
        <p className="mb-4 hidden text-xs text-foreground-muted sm:block">
          {filteredBookmarks.length === bookmarkCount
            ? `Showing all ${bookmarkCount} bookmarks`
            : `Found ${filteredBookmarks.length} of ${bookmarkCount} bookmarks`}
        </p>
      )}

      {/* Import success */}
      {importMessage && (
        <div className="border-accent/30 bg-accent/10 mb-6 rounded-lg border p-3">
          <p className="text-sm text-foreground">{importMessage}</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="border-destructive/30 bg-destructive/10 mb-6 rounded-lg border p-3">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Content */}
      {bookmarkCount === 0 ? (
        <div className="py-16 text-center">
          <Bookmark className="mx-auto mb-3 h-12 w-12 text-foreground-faint" />
          <h2 className="mb-1 text-lg font-semibold text-foreground">No bookmarks yet</h2>
          <p className="mb-5 text-sm text-foreground-muted">
            Start bookmarking your favorite hadiths to see them here.
          </p>
          <Button asChild>
            <Link href="/">Browse Hadiths</Link>
          </Button>
        </div>
      ) : filteredBookmarks.length === 0 && searchQuery.trim() ? (
        <div className="py-16 text-center">
          <Search className="mx-auto mb-3 h-12 w-12 text-foreground-faint" />
          <h2 className="mb-1 text-lg font-semibold text-foreground">No results found</h2>
          <p className="mb-4 text-sm text-foreground-muted">
            No bookmarks match your search criteria.
          </p>
          <Button variant="ghost" onClick={() => setSearchQuery('')}>
            Clear search
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Stats */}
          <div className="rounded-lg border border-border bg-surface-1 p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-foreground-muted">Total bookmarks</span>
              <span className="font-medium text-foreground">{bookmarkCount}</span>
            </div>
            {searchQuery.trim() && (
              <>
                <Separator className="my-2" />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-foreground-muted">Showing results</span>
                  <span className="font-medium text-foreground">{filteredBookmarks.length}</span>
                </div>
              </>
            )}
          </div>

          {/* Bookmark previews (fallback when full hadiths failed to load) */}
          {filteredFullHadiths.length === 0 && filteredBookmarks.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-base font-semibold text-foreground">Bookmark Previews</h2>
              <p className="text-xs text-foreground-muted">
                Full content could not be loaded. Here are your bookmark previews:
              </p>
              {filteredBookmarks.map((bookmark) => (
                <BookmarkCard key={bookmark.bookId + ':' + bookmark.id} bookmark={bookmark} />
              ))}
            </div>
          )}

          {/* Full hadith cards */}
          {filteredFullHadiths.length > 0 && (
            <div className="space-y-5">
              <h2 className="text-base font-semibold text-foreground">Your Bookmarked Hadiths</h2>
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
        </div>
      )}
    </div>
  )
}
