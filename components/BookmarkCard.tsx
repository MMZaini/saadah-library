'use client'

import { useState } from 'react'
import Link from 'next/link'
import { BookmarkData } from '@/lib/bookmarks-context'
import { getBookConfig, getBookUrlSlug } from '@/lib/books-config'
import { useBookmarks } from '@/lib/bookmarks-context'
import { useSettings } from '@/lib/settings-context'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Bookmark, ChevronRight, StickyNote } from 'lucide-react'

interface BookmarkCardProps {
  bookmark: BookmarkData
  className?: string
}

export default function BookmarkCard({ bookmark, className }: BookmarkCardProps) {
  const { settings } = useSettings()
  const { removeBookmark, updateBookmarkNotes } = useBookmarks()
  const [showArabic, setShowArabic] = useState(false)
  const [isEditingNotes, setIsEditingNotes] = useState(false)
  const [notesValue, setNotesValue] = useState(bookmark.notes || '')

  const getHadithUrl = () => {
    try {
      const cfg = getBookConfig(bookmark.bookId)
      if (cfg?.bookId === 'Al-Kafi') return `/al-kafi/hadith/${bookmark.id}`
      if (bookmark.bookId.includes('Uyun')) return `/Uyun-akhbar-al-Rida/hadith/${bookmark.id}`
      return `/${getBookUrlSlug(bookmark.bookId)}/hadith/${bookmark.id}`
    } catch {
      return `/al-kafi/hadith/${bookmark.id}`
    }
  }

  const handleSaveNotes = () => {
    updateBookmarkNotes(bookmark.bookId, bookmark.id, notesValue)
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
      <div className="mb-3 flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <Badge variant="secondary">
              {bookmark.book}
              {bookmark.volume && ` Vol. ${bookmark.volume}`}
            </Badge>
            <span className="text-xs text-foreground-faint">#{bookmark.id}</span>
          </div>
          <h3 className="mb-0.5 line-clamp-2 text-sm font-medium text-foreground">
            {bookmark.category}
          </h3>
          <p className="line-clamp-2 text-xs text-foreground-muted">{bookmark.chapter}</p>
        </div>

        <div className="ml-3 flex shrink-0 items-center gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => removeBookmark(bookmark.bookId, bookmark.id)}
            title="Remove bookmark"
            className="text-bookmark hover:text-bookmark"
          >
            <Bookmark className="h-3.5 w-3.5 fill-current" />
          </Button>
          {bookmark.arabicPreview && (
            <Button
              variant={showArabic ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowArabic(!showArabic)}
              className="font-arabic text-xs"
            >
              ع
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      {showArabic && bookmark.arabicPreview ? (
        <div className="rounded-md border border-border bg-surface-2 p-3">
          <div
            className="hadith-arabic-text font-arabic text-foreground"
            dir="rtl"
            style={{ fontSize: `${settings.arabicFontSize * 1.485}%` }}
          >
            {bookmark.arabicPreview}
          </div>
        </div>
      ) : (
        <div
          className="font-mono text-sm leading-relaxed text-foreground"
          style={{ fontSize: `${settings.englishFontSize}%` }}
        >
          {bookmark.preview}
        </div>
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
              placeholder="Add your personal notes about this hadith…"
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
        <Link
          href={getHadithUrl()}
          className="flex items-center gap-0.5 text-foreground-muted transition-colors hover:text-foreground"
        >
          View Full Hadith
          <ChevronRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  )
}
