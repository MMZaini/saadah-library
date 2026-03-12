'use client'

import { useState } from 'react'
import Link from 'next/link'
import { BookmarkData } from '@/lib/bookmarks-context'
import { getBookConfig, getBookUrlSlug } from '@/lib/books-config'
import { useBookmarks } from '@/lib/bookmarks-context'
import { IconBookmarkFilled, IconBook } from './Icons'
import { useSettings } from '@/lib/settings-context'
import clsx from 'clsx'

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
      if (cfg?.bookId === 'Al-Kafi') {
        return `/al-kafi/hadith/${bookmark.id}`
      } else if (bookmark.bookId.includes('Uyun')) {
        return `/Uyun-akhbar-al-Rida/hadith/${bookmark.id}`
      } else {
        return `/${getBookUrlSlug(bookmark.bookId)}/hadith/${bookmark.id}`
      }
    } catch {
      return `/al-kafi/hadith/${bookmark.id}` // fallback
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
      className={clsx(
        'border-theme rounded-xl border bg-card p-4 shadow-soft sm:p-6',
        'hover:border-accent-primary/20 hover:bg-card-hover hover:shadow-medium',
        'transition-all duration-300',
        className,
      )}
    >
      {/* Header */}
      <div className="mb-3 flex items-start justify-between sm:mb-4">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
            <span className="bg-accent-primary w-fit rounded px-2 py-1 text-xs font-medium text-white shadow-soft sm:text-sm">
              <span className="sm:hidden">
                {bookmark.book}
                {bookmark.volume && ` Vol.${bookmark.volume}`}
              </span>
              <span className="hidden sm:inline">
                {bookmark.book}
                {bookmark.volume && ` - Volume ${bookmark.volume}`}
              </span>
            </span>
            <span className="text-xs text-muted">#{bookmark.id}</span>
          </div>

          <h3 className="text-secondary mb-1 line-clamp-2 text-sm font-medium leading-tight">
            {bookmark.category}
          </h3>

          <p className="line-clamp-2 text-xs text-muted">{bookmark.chapter}</p>
        </div>

        <div className="ml-3 flex flex-shrink-0 items-center gap-2 sm:ml-4">
          {/* Remove Bookmark Button */}
          <button
            onClick={() => removeBookmark(bookmark.bookId, bookmark.id)}
            className="shadow-medium flex min-w-[28px] items-center justify-center rounded-lg bg-yellow-500 px-2 py-1 text-xs font-medium text-white shadow-soft transition-all hover:bg-yellow-600 active:scale-95 sm:min-w-[32px] sm:px-3"
            title="Remove bookmark"
          >
            <IconBookmarkFilled className="h-3 w-3 sm:h-4 sm:w-4" />
          </button>

          {bookmark.arabicPreview && (
            <button
              onClick={() => setShowArabic(!showArabic)}
              className={clsx(
                'min-w-[28px] rounded-lg px-2 py-1 text-xs font-medium shadow-soft transition-all sm:min-w-[32px] sm:px-3',
                showArabic
                  ? 'bg-accent-primary shadow-medium text-white'
                  : 'bg-accent-primary/10 text-accent-primary hover:bg-accent-primary/20 active:scale-95',
              )}
            >
              ع
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="space-y-3 sm:space-y-4">
        {showArabic && bookmark.arabicPreview ? (
          <div className="hadith-block rounded-lg border border-amber-200/60 bg-amber-50/80 shadow-soft backdrop-blur-sm dark:border-amber-800/30 dark:bg-amber-900/20">
            <div
              className="hadith-arabic-text text-right font-arabic text-base leading-relaxed text-amber-900 dark:text-amber-100 sm:text-lg"
              dir="rtl"
            >
              {bookmark.arabicPreview}
            </div>
          </div>
        ) : (
          <div className="text-primary leading-relaxed">
            <div
              className="hadith-english-text font-mono text-sm sm:text-base"
              style={{
                fontSize: `${settings.englishFontSize}%`,
                fontFamily:
                  '"Space Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, "Roboto Mono", "Helvetica Neue", monospace',
              }}
            >
              {bookmark.preview}
            </div>
          </div>
        )}
      </div>

      {/* Notes Section */}
      <div className="mt-4 rounded-lg border border-blue-200/30 bg-blue-50/50 p-3 dark:border-blue-800/20 dark:bg-blue-900/10">
        <div className="mb-2 flex items-center justify-between">
          <h4 className="text-primary flex items-center gap-2 text-xs font-semibold">
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
            Personal Notes
          </h4>
          {!isEditingNotes && (
            <button
              onClick={() => setIsEditingNotes(true)}
              className="text-xs text-blue-600 transition-colors hover:text-blue-700 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
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
              className="w-full resize-none rounded-md border border-blue-200 bg-white p-2 text-sm text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-blue-700 dark:bg-gray-800 dark:text-gray-100"
              rows={3}
              placeholder="Add your personal notes about this hadith..."
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={handleSaveNotes}
                className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-700"
              >
                Save
              </button>
              <button
                onClick={handleCancelNotes}
                className="rounded-md bg-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-400 dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="text-sm text-gray-700 dark:text-gray-300">
            {bookmark.notes ? (
              <div className="whitespace-pre-wrap leading-relaxed">{bookmark.notes}</div>
            ) : (
              <div className="italic text-gray-500 dark:text-gray-400">No notes added yet</div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-theme mt-6 border-t pt-4">
        <div className="flex items-center justify-between text-xs text-muted">
          <div className="flex items-center gap-3">
            <span>Bookmarked: {new Date(bookmark.timestamp).toLocaleDateString()}</span>
          </div>

          <Link
            href={getHadithUrl()}
            className="text-primary flex items-center gap-1 transition-colors hover:underline"
          >
            View Full Hadith
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  )
}
