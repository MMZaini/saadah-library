'use client'

import { useRef, useState } from 'react'
import { useBookmarks } from '@/lib/bookmarks-context'
import { useNarratorBookmarks } from '@/lib/narrator-bookmarks-context'
import { usePageSearch } from '@/lib/search-context'
import BookmarksNarrations from '@/components/BookmarksNarrations'
import BookmarksNarrators from '@/components/BookmarksNarrators'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Bookmark, Download, Upload, RefreshCw, UserSearch, ScrollText } from 'lucide-react'

type Tab = 'narrations' | 'narrators'

export default function BookmarksPage() {
  const { bookmarks, bookmarkCount, importBookmarks } = useBookmarks()
  const { narratorBookmarks, narratorBookmarkCount, importNarratorBookmarks } =
    useNarratorBookmarks()
  const { query: searchQuery, setQuery: setSearchQuery } = usePageSearch({
    placeholder: 'Search bookmarks…',
    resetKey: 'bookmarks',
  })
  const [activeTab, setActiveTab] = useState<Tab>('narrations')
  const [importMessage, setImportMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const totalCount = bookmarkCount + narratorBookmarkCount

  const handleExportBookmarks = () => {
    try {
      const exportData = {
        version: '1.1',
        bookmarks: bookmarks.map((bookmark) => ({
          id: bookmark.id,
          bookId: bookmark.bookId,
          book: bookmark.book,
          category: bookmark.category,
          chapter: bookmark.chapter,
          volume: bookmark.volume,
          timestamp: bookmark.timestamp,
          preview: bookmark.preview,
          arabicPreview: bookmark.arabicPreview,
          notes: bookmark.notes || '',
        })),
        narratorBookmarks,
      }
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

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const result = e.target?.result as string
        const data = JSON.parse(result)

        const hasHadiths = Array.isArray(data.bookmarks)
        const hasNarrators = Array.isArray(data.narratorBookmarks)
        if (!hasHadiths && !hasNarrators) {
          throw new Error('Invalid bookmark file format')
        }

        const parts: string[] = []
        if (hasHadiths) {
          const { imported, duplicates } = importBookmarks(data.bookmarks)
          parts.push(
            `${imported} narration${imported !== 1 ? 's' : ''}${
              duplicates > 0
                ? ` (${duplicates} duplicate${duplicates !== 1 ? 's' : ''} skipped)`
                : ''
            }`,
          )
        }
        if (hasNarrators) {
          const { imported, duplicates } = importNarratorBookmarks(data.narratorBookmarks)
          parts.push(
            `${imported} narrator${imported !== 1 ? 's' : ''}${
              duplicates > 0
                ? ` (${duplicates} duplicate${duplicates !== 1 ? 's' : ''} skipped)`
                : ''
            }`,
          )
        }

        setImportMessage(`Imported ${parts.join(' and ')}.`)
        setTimeout(() => setImportMessage(null), 5000)
      } catch (err) {
        console.error('Failed to import bookmarks:', err)
        setError('Failed to import bookmarks. Please check the file format and try again.')
      }
    }

    reader.readAsText(file)
    event.target.value = ''
  }

  const tabs: { value: Tab; label: string; count: number; icon: typeof ScrollText }[] = [
    { value: 'narrations', label: 'Narrations', count: bookmarkCount, icon: ScrollText },
    { value: 'narrators', label: 'Narrators', count: narratorBookmarkCount, icon: UserSearch },
  ]

  return (
    <div className="hadith-reading-container mx-auto max-w-5xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <Bookmark className="h-5 w-5 text-bookmark" />
        <h1 className="text-xl font-bold text-foreground">Bookmarks</h1>
        {totalCount > 0 && <Badge variant="secondary">{totalCount}</Badge>}
      </div>

      {/* Action buttons */}
      <div className="mb-6 flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
          <Upload className="mr-1.5 h-3.5 w-3.5" />
          Import
        </Button>
        <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
          <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
          Refresh
        </Button>
        {totalCount > 0 && (
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

      {totalCount === 0 ? (
        <div className="py-16 text-center">
          <Bookmark className="mx-auto mb-3 h-12 w-12 text-foreground-faint" />
          <h2 className="mb-1 text-lg font-semibold text-foreground">No bookmarks yet</h2>
          <p className="text-sm text-foreground-muted">
            Bookmark hadiths as you read, or save narrators from their entry pages.
          </p>
        </div>
      ) : (
        <>
          {/* Tabs */}
          <div className="mb-6 inline-flex rounded-lg border border-border bg-surface-1 p-1">
            {tabs.map(({ value, label, count, icon: Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => setActiveTab(value)}
                aria-pressed={activeTab === value}
                className={cn(
                  'flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors',
                  activeTab === value
                    ? 'bg-surface-2 text-foreground shadow-sm'
                    : 'text-foreground-muted hover:text-foreground',
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
                <Badge
                  variant={activeTab === value ? 'secondary' : 'outline'}
                  className="tabular-nums"
                >
                  {count}
                </Badge>
              </button>
            ))}
          </div>

          {/* Sections — both stay mounted so switching tabs never re-fetches. */}
          <div className={activeTab === 'narrations' ? '' : 'hidden'}>
            <BookmarksNarrations
              searchQuery={searchQuery}
              onClearSearch={() => setSearchQuery('')}
            />
          </div>
          <div className={activeTab === 'narrators' ? '' : 'hidden'}>
            <BookmarksNarrators
              searchQuery={searchQuery}
              onClearSearch={() => setSearchQuery('')}
            />
          </div>
        </>
      )}
    </div>
  )
}
