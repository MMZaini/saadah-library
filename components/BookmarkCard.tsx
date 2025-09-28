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
    <div className={clsx(
      'bg-card border border-theme rounded-xl p-4 sm:p-6 shadow-soft',
      'hover:border-accent-primary/20 hover:bg-card-hover hover:shadow-medium',
      'transition-all duration-300',
      className
    )}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3 sm:mb-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
            <span className="text-xs sm:text-sm font-medium text-white bg-accent-primary px-2 py-1 rounded shadow-soft w-fit">
              <span className="sm:hidden">{bookmark.book}{bookmark.volume && ` Vol.${bookmark.volume}`}</span>
              <span className="hidden sm:inline">{bookmark.book}{bookmark.volume && ` - Volume ${bookmark.volume}`}</span>
            </span>
            <span className="text-xs text-muted">#{bookmark.id}</span>
          </div>
          
          <h3 className="text-sm font-medium text-secondary leading-tight mb-1 line-clamp-2">
            {bookmark.category}
          </h3>
          
          <p className="text-xs text-muted line-clamp-2">
            {bookmark.chapter}
          </p>
        </div>

        <div className="flex items-center gap-2 ml-3 sm:ml-4 flex-shrink-0">
          {/* Remove Bookmark Button */}
          <button
            onClick={() => removeBookmark(bookmark.bookId, bookmark.id)}
            className="px-2 sm:px-3 py-1 rounded-lg text-xs font-medium transition-all shadow-soft min-w-[28px] sm:min-w-[32px] flex items-center justify-center bg-yellow-500 text-white shadow-medium hover:bg-yellow-600 active:scale-95"
            title="Remove bookmark"
          >
            <IconBookmarkFilled className="w-3 h-3 sm:w-4 sm:h-4" />
          </button>
          
          {bookmark.arabicPreview && (
            <button
              onClick={() => setShowArabic(!showArabic)}
              className={clsx(
                'px-2 sm:px-3 py-1 rounded-lg text-xs font-medium transition-all shadow-soft min-w-[28px] sm:min-w-[32px]',
                showArabic 
                  ? 'bg-accent-primary text-white shadow-medium' 
                  : 'bg-accent-primary/10 text-accent-primary hover:bg-accent-primary/20 active:scale-95'
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
          <div className="bg-amber-50/80 dark:bg-amber-900/20 hadith-block rounded-lg border border-amber-200/60 dark:border-amber-800/30 shadow-soft backdrop-blur-sm">
            <div
              className="text-right text-base sm:text-lg leading-relaxed font-arabic text-amber-900 dark:text-amber-100 hadith-arabic-text"
              dir="rtl"
            >
              {bookmark.arabicPreview}
            </div>
          </div>
        ) : (
          <div className="text-primary leading-relaxed">
            <div 
              className="text-sm sm:text-base hadith-english-text font-mono" 
              style={{ 
                fontSize: `${settings.englishFontSize}%`, 
                fontFamily: '"Space Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, "Roboto Mono", "Helvetica Neue", monospace' 
              }}
            >
              {bookmark.preview}
            </div>
          </div>
        )}
      </div>

      {/* Notes Section */}
      <div className="mt-4 p-3 bg-blue-50/50 dark:bg-blue-900/10 rounded-lg border border-blue-200/30 dark:border-blue-800/20">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-semibold text-primary flex items-center gap-2">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Personal Notes
          </h4>
          {!isEditingNotes && (
            <button
              onClick={() => setIsEditingNotes(true)}
              className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline transition-colors"
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
              className="w-full p-2 text-sm border border-blue-200 dark:border-blue-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              rows={3}
              placeholder="Add your personal notes about this hadith..."
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={handleSaveNotes}
                className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-md hover:bg-blue-700 transition-colors"
              >
                Save
              </button>
              <button
                onClick={handleCancelNotes}
                className="px-3 py-1.5 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 text-xs font-medium rounded-md hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="text-sm text-gray-700 dark:text-gray-300">
            {bookmark.notes ? (
              <div className="whitespace-pre-wrap leading-relaxed">
                {bookmark.notes}
              </div>
            ) : (
              <div className="text-gray-500 dark:text-gray-400 italic">
                No notes added yet
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-theme">
        <div className="flex items-center justify-between text-xs text-muted">
          <div className="flex items-center gap-3">
            <span>
              Bookmarked: {new Date(bookmark.timestamp).toLocaleDateString()}
            </span>
          </div>
          
          <Link
            href={getHadithUrl()}
            className="text-primary hover:underline flex items-center gap-1 transition-colors"
          >
            View Full Hadith
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  )
}
