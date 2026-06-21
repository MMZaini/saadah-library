'use client'

import { Search, UserSearch } from 'lucide-react'
import { useNarratorBookmarks } from '@/lib/narrator-bookmarks-context'
import { cleanNarratorName } from '@/lib/data/rijal-display'
import NarratorBookmarkCard from '@/components/NarratorBookmarkCard'
import { Button } from '@/components/ui/button'

interface BookmarksNarratorsProps {
  searchQuery: string
  onClearSearch: () => void
}

export default function BookmarksNarrators({
  searchQuery,
  onClearSearch,
}: BookmarksNarratorsProps) {
  const { narratorBookmarks, narratorBookmarkCount } = useNarratorBookmarks()

  const query = searchQuery.trim().toLowerCase()
  const filtered = !query
    ? narratorBookmarks
    : narratorBookmarks.filter((bookmark) => {
        return (
          cleanNarratorName(bookmark.primaryName).toLowerCase().includes(query) ||
          bookmark.primaryName.toLowerCase().includes(query) ||
          bookmark.preview?.toLowerCase().includes(query) ||
          bookmark.notes?.toLowerCase().includes(query) ||
          String(bookmark.entryNumber ?? bookmark.sourceEntryNumber ?? '').includes(query)
        )
      })

  if (narratorBookmarkCount === 0) {
    return (
      <div className="py-16 text-center">
        <UserSearch className="mx-auto mb-3 h-12 w-12 text-foreground-faint" />
        <h2 className="mb-1 text-lg font-semibold text-foreground">No bookmarked narrators yet</h2>
        <p className="mb-5 text-sm text-foreground-muted">
          Open a narrator entry and tap Save to keep it here.
        </p>
        <Button asChild>
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/narrators">Search narrators</a>
        </Button>
      </div>
    )
  }

  if (filtered.length === 0 && query) {
    return (
      <div className="py-16 text-center">
        <Search className="mx-auto mb-3 h-12 w-12 text-foreground-faint" />
        <h2 className="mb-1 text-lg font-semibold text-foreground">No results found</h2>
        <p className="mb-4 text-sm text-foreground-muted">
          No narrators match your search criteria.
        </p>
        <Button variant="ghost" onClick={onClearSearch}>
          Clear search
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {query && (
        <p className="text-xs text-foreground-muted">
          {filtered.length === narratorBookmarkCount
            ? `Showing all ${narratorBookmarkCount} narrators`
            : `Found ${filtered.length} of ${narratorBookmarkCount} narrators`}
        </p>
      )}
      <div className="space-y-4">
        {filtered.map((bookmark) => (
          <NarratorBookmarkCard key={bookmark.id} bookmark={bookmark} />
        ))}
      </div>
    </div>
  )
}
