'use client'

import { useState } from 'react'
import { Bookmark, BookOpen, ChevronRight, StickyNote } from 'lucide-react'
import type { NarratorBookmarkData } from '@/lib/narrator-bookmarks-context'
import { useNarratorBookmarks } from '@/lib/narrator-bookmarks-context'
import { cleanNarratorName } from '@/lib/data/rijal-display'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

interface NarratorBookmarkCardProps {
  bookmark: NarratorBookmarkData
  className?: string
}

export default function NarratorBookmarkCard({ bookmark, className }: NarratorBookmarkCardProps) {
  const { removeNarratorBookmark, updateNarratorBookmarkNotes } = useNarratorBookmarks()
  const [isEditingNotes, setIsEditingNotes] = useState(false)
  const [notesValue, setNotesValue] = useState(bookmark.notes || '')

  const displayNumber = bookmark.entryNumber ?? bookmark.sourceEntryNumber
  const pageLabel =
    bookmark.startPage === bookmark.endPage
      ? `p. ${bookmark.startPage}`
      : `pp. ${bookmark.startPage}-${bookmark.endPage}`

  const handleSaveNotes = () => {
    updateNarratorBookmarkNotes(bookmark.id, notesValue)
    setIsEditingNotes(false)
  }

  const handleCancelNotes = () => {
    setNotesValue(bookmark.notes || '')
    setIsEditingNotes(false)
  }

  return (
    <div
      className={cn(
        'rounded-lg border border-border bg-surface-1 p-4 transition-colors hover:bg-surface-2',
        className,
      )}
    >
      {/* Header */}
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
            {displayNumber != null && (
              <Badge variant="outline" className="tabular-nums">
                #{displayNumber}
              </Badge>
            )}
            <Badge variant="secondary">Vol. {bookmark.volumeNumber}</Badge>
            <Badge variant="outline">{pageLabel}</Badge>
          </div>
          <h3
            className="font-arabic text-xl font-semibold leading-relaxed text-foreground"
            dir="rtl"
          >
            {cleanNarratorName(bookmark.primaryName)}
          </h3>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => removeNarratorBookmark(bookmark.id)}
          title="Remove bookmark"
          className="shrink-0 text-bookmark hover:text-bookmark"
        >
          <Bookmark className="h-3.5 w-3.5 fill-current" />
        </Button>
      </div>

      {/* Preview */}
      {bookmark.preview && (
        <p className="font-arabic text-base leading-loose text-foreground-muted" dir="rtl">
          {bookmark.preview}
        </p>
      )}

      {/* Notes */}
      <div className="mt-3 rounded-md border border-border bg-background p-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-xs font-medium text-foreground-muted">
            <StickyNote className="h-3 w-3" />
            Notes
          </span>
          {!isEditingNotes && (
            <button
              onClick={() => setIsEditingNotes(true)}
              className="text-xs text-accent transition-colors hover:underline"
            >
              {bookmark.notes ? 'Edit' : 'Add Note'}
            </button>
          )}
        </div>

        {isEditingNotes ? (
          <div className="space-y-2">
            <textarea
              value={notesValue}
              onChange={(e) => setNotesValue(e.target.value)}
              className="w-full resize-none rounded-md border border-border bg-surface-1 p-2 text-sm text-foreground placeholder:text-foreground-faint focus:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600"
              rows={3}
              placeholder="Add your personal notes about this narrator…"
              autoFocus
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSaveNotes}>
                Save
              </Button>
              <Button size="sm" variant="outline" onClick={handleCancelNotes}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-sm text-foreground-muted">
            {bookmark.notes ? (
              <div className="whitespace-pre-wrap leading-relaxed">{bookmark.notes}</div>
            ) : (
              <div className="italic text-foreground-faint">No notes added yet</div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <Separator className="my-3" />
      <div className="flex items-center justify-between text-xs text-foreground-faint">
        <span>Bookmarked: {new Date(bookmark.timestamp).toLocaleDateString()}</span>
        {/* Raw anchor: /narrators is a clean root route (outside the /read basePath). */}
        <a
          href={`/narrators/${encodeURIComponent(bookmark.id)}`}
          className="flex items-center gap-0.5 text-foreground-muted transition-colors hover:text-foreground"
        >
          <BookOpen className="h-3 w-3" />
          View Entry
          <ChevronRight className="h-3 w-3" />
        </a>
      </div>
    </div>
  )
}
