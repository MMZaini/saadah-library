'use client'

import { useState, useEffect } from 'react'
import { Hadith } from '@/lib/api'
import { useBookmarks, BookmarkData } from '@/lib/bookmarks-context'
import HadithCard from './HadithCard'

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

  // Update local state when global toggle changes
  useEffect(() => {
    if (globalNotesVisible !== undefined) {
      setShowNotes(globalNotesVisible)
    }
  }, [globalNotesVisible])

  const handleSaveNotes = (e: React.FormEvent) => {
    e.preventDefault() // Prevent any form submission
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
        // Could add toast notification here
        console.log('Notes copied to clipboard')
      } catch (err) {
        console.error('Failed to copy notes:', err)
      }
    }
  }

  // Use global state if provided, otherwise use local state
  // But allow individual toggle to override global state
  const notesVisible = showNotes

  return (
    <div className="space-y-4">
      {/* Regular Hadith Card with Notes Toggle */}
      <HadithCard
        hadith={hadith}
        showViewChapter={showViewChapter}
        className={className}
        showNotesToggle={true}
        notesVisible={notesVisible}
        onToggleNotes={() => setShowNotes(!showNotes)}
      />

      {/* Notes Section - Only shown when toggled */}
      {notesVisible && (
        <div className="rounded-lg border border-blue-200/30 bg-blue-50/50 p-4 dark:border-blue-800/20 dark:bg-blue-900/10">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="text-primary flex items-center gap-2 text-sm font-semibold">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              Personal Notes
            </h4>
            <div className="flex gap-2">
              {bookmark.notes && !isEditingNotes && (
                <>
                  <button
                    onClick={handleCopyNotes}
                    className="text-sm text-gray-600 transition-colors hover:text-gray-700 hover:underline dark:text-gray-400 dark:hover:text-gray-300"
                    title="Copy notes to clipboard"
                  >
                    Copy
                  </button>
                  <button
                    onClick={handleClearNotes}
                    className="text-sm text-red-600 transition-colors hover:text-red-700 hover:underline dark:text-red-400 dark:hover:text-red-300"
                    title="Clear all notes"
                  >
                    Clear
                  </button>
                </>
              )}
              {!isEditingNotes && (
                <button
                  onClick={() => setIsEditingNotes(true)}
                  className="text-sm text-blue-600 transition-colors hover:text-blue-700 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
                >
                  {bookmark.notes ? 'Edit' : 'Add Note'}
                </button>
              )}
            </div>
          </div>

          {isEditingNotes ? (
            <form onSubmit={handleSaveNotes} className="space-y-3">
              <textarea
                value={notesValue}
                onChange={(e) => setNotesValue(e.target.value)}
                className="w-full resize-none rounded-md border border-blue-200 bg-white p-3 text-sm text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-blue-700 dark:bg-gray-800 dark:text-gray-100"
                rows={4}
                placeholder="Add your personal notes about this hadith..."
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={handleCancelNotes}
                  className="rounded-md bg-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-400 dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="text-sm text-gray-700 dark:text-gray-300">
              {bookmark.notes ? (
                <div className="whitespace-pre-wrap rounded border border-gray-200 bg-white p-3 leading-relaxed dark:border-gray-700 dark:bg-gray-800">
                  {bookmark.notes}
                </div>
              ) : (
                <div className="py-2 italic text-gray-500 dark:text-gray-400">
                  No notes added yet. Click "Add Note" to start writing your thoughts about this
                  hadith.
                </div>
              )}
            </div>
          )}

          {/* Bookmark timestamp */}
          <div className="mt-3 border-t border-blue-200 pt-3 dark:border-blue-700">
            <div className="text-xs text-gray-500 dark:text-gray-400">
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
        </div>
      )}
    </div>
  )
}
