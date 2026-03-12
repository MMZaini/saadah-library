'use client'

import { useState, useEffect } from 'react'
import { Hadith } from '@/lib/api'
import { useBookmarks, BookmarkData } from '@/lib/bookmarks-context'
import HadithCard from './HadithCard'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { StickyNote, Copy, Trash2 } from 'lucide-react'

interface BookmarkedHadithCardProps {
  hadith: Hadith
  bookmark: BookmarkData
  showViewChapter?: boolean
  className?: string
  globalNotesVisible?: boolean
}

export default function BookmarkedHadithCard({
  hadith,
  bookmark,
  showViewChapter = true,
  className,
  globalNotesVisible = false,
}: BookmarkedHadithCardProps) {
  const { updateBookmarkNotes } = useBookmarks()
  const [isEditingNotes, setIsEditingNotes] = useState(false)
  const [notesValue, setNotesValue] = useState(bookmark.notes || '')
  const [showNotes, setShowNotes] = useState(false)

  useEffect(() => {
    if (globalNotesVisible !== undefined) {
      setShowNotes(globalNotesVisible)
    }
  }, [globalNotesVisible])

  const handleSaveNotes = (e: React.FormEvent) => {
    e.preventDefault()
    updateBookmarkNotes(bookmark.bookId, bookmark.id, notesValue)
    setIsEditingNotes(false)
  }

  const handleCancelNotes = () => {
    setNotesValue(bookmark.notes || '')
    setIsEditingNotes(false)
  }

  const handleClearNotes = () => {
    setNotesValue('')
    updateBookmarkNotes(bookmark.bookId, bookmark.id, '')
    setIsEditingNotes(false)
  }

  const handleCopyNotes = async () => {
    if (bookmark.notes) {
      try {
        await navigator.clipboard.writeText(bookmark.notes)
      } catch (err) {
        console.error('Failed to copy notes:', err)
      }
    }
  }

  return (
    <div className="space-y-3">
      <HadithCard
        hadith={hadith}
        showViewChapter={showViewChapter}
        className={className}
        showNotesToggle={true}
        notesVisible={showNotes}
        onToggleNotes={() => setShowNotes(!showNotes)}
      />

      {showNotes && (
        <div className="rounded-lg border border-border bg-surface-1 p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
              <StickyNote className="h-3.5 w-3.5" />
              Personal Notes
            </span>
            <div className="flex gap-1.5">
              {bookmark.notes && !isEditingNotes && (
                <>
                  <Button variant="ghost" size="sm" onClick={handleCopyNotes} title="Copy notes">
                    <Copy className="mr-1 h-3 w-3" />
                    Copy
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearNotes}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="mr-1 h-3 w-3" />
                    Clear
                  </Button>
                </>
              )}
              {!isEditingNotes && (
                <Button variant="ghost" size="sm" onClick={() => setIsEditingNotes(true)}>
                  {bookmark.notes ? 'Edit' : 'Add Note'}
                </Button>
              )}
            </div>
          </div>

          {isEditingNotes ? (
            <form onSubmit={handleSaveNotes} className="space-y-3">
              <textarea
                value={notesValue}
                onChange={(e) => setNotesValue(e.target.value)}
                className="w-full resize-none rounded-md border border-border bg-background p-3 text-sm text-foreground placeholder:text-foreground-faint focus:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600"
                rows={4}
                placeholder="Add your personal notes about this hadith…"
                autoFocus
              />
              <div className="flex gap-2">
                <Button size="sm" type="submit">
                  Save
                </Button>
                <Button size="sm" variant="outline" type="button" onClick={handleCancelNotes}>
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <div className="text-sm text-foreground-muted">
              {bookmark.notes ? (
                <div className="whitespace-pre-wrap rounded-md border border-border bg-background p-3 leading-relaxed">
                  {bookmark.notes}
                </div>
              ) : (
                <div className="py-2 italic text-foreground-faint">
                  No notes added yet. Click &ldquo;Add Note&rdquo; to start writing your thoughts.
                </div>
              )}
            </div>
          )}

          <Separator className="my-3" />
          <div className="text-xs text-foreground-faint">
            Bookmarked:{' '}
            {new Date(bookmark.timestamp).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
        </div>
      )}
    </div>
  )
}
