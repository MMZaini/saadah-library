'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useBookmarks } from '@/lib/bookmarks-context'
import { thaqalaynApi, Hadith } from '@/lib/api'
import { getBookConfig, getBookUrlSlug } from '@/lib/books-config'
import HadithCard from '@/components/HadithCard'
import BookmarkCard from '@/components/BookmarkCard'
import BookmarkedHadithCard from '@/components/BookmarkedHadithCard'
import { IconBookmark, IconArrowLeft } from '@/components/Icons'
import { useSettings } from '@/lib/settings-context'
import clsx from 'clsx'

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

  const filterOptions = [
    { value: 'both', label: 'Both', icon: '🔍' },
    { value: 'hadith', label: 'Hadith', icon: '📜' },
    { value: 'notes', label: 'Notes', icon: '📝' },
  ]

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Export bookmarks to JSON file
  const handleExportBookmarks = () => {
    try {
      // Export only fields required for import
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

      const exportData = {
        version: '1.0',
        bookmarks: exportBookmarks,
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

  // Import bookmarks from JSON file
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

        // Validate file structure
        if (!data.bookmarks || !Array.isArray(data.bookmarks)) {
          throw new Error('Invalid bookmark file format')
        }

        const { imported, duplicates } = importBookmarks(data.bookmarks)

        let message = `Successfully imported ${imported} bookmark${imported !== 1 ? 's' : ''}.`
        if (duplicates > 0) {
          message += ` ${duplicates} duplicate${duplicates !== 1 ? 's' : ''} were skipped.`
        }

        setImportMessage(message)

        // Clear the message after 5 seconds
        setTimeout(() => setImportMessage(null), 5000)
      } catch (err) {
        console.error('Failed to import bookmarks:', err)
        setError('Failed to import bookmarks. Please check the file format and try again.')
      }
    }

    reader.readAsText(file)
    // Clear the input so the same file can be selected again
    event.target.value = ''
  }

  // Fetch full hadith data for bookmarks
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
            // First try to get the specific hadith using bookId and hadithId
            if (bookmark.bookId) {
              const hadith = await thaqalaynApi.getSpecificHadith(bookmark.bookId, bookmark.id)
              return hadith
            } else {
              // Fallback: search for the hadith by ID across all books
              const searchResult = await thaqalaynApi.searchAllBooks(`#${bookmark.id}`)
              const foundHadith = searchResult.results.find((h) => h.id === bookmark.id)
              return foundHadith || null
            }
          } catch (err) {
            console.error(`Failed to fetch hadith ${bookmark.id}:`, err)
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
      } catch (err) {
        console.error('Failed to fetch bookmarked hadiths:', err)
        setError('Failed to load bookmarks. Please check your connection and try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchHadiths()
  }, [bookmarks])

  // Filter bookmarks based on search query and filter type
  const filteredBookmarks = bookmarks.filter((bookmark) => {
    if (!searchQuery.trim()) return true

    const query = searchQuery.toLowerCase()

    // Get full hadith data if available
    const fullHadith = fullHadiths.find((h) => h.id === bookmark.id)

    switch (searchFilter) {
      case 'hadith':
        // Search in full hadith content if available, otherwise use preview
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
        } else {
          return (
            bookmark.preview.toLowerCase().includes(query) ||
            bookmark.arabicPreview?.toLowerCase().includes(query) ||
            bookmark.category.toLowerCase().includes(query) ||
            bookmark.chapter.toLowerCase().includes(query) ||
            bookmark.book.toLowerCase().includes(query)
          )
        }
      case 'notes':
        return bookmark.notes?.toLowerCase().includes(query) || false
      case 'both':
      default:
        // Search in both full hadith content and notes
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
  })

  // Filter full hadiths to match filtered bookmarks
  const filteredFullHadiths = fullHadiths.filter((hadith) =>
    filteredBookmarks.some((bookmark) => bookmark.id === hadith.id),
  )

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center gap-4">
          <Link
            href="/"
            className="rounded-lg p-2 transition-colors hover:bg-black/10 dark:hover:bg-white/10"
          >
            <IconArrowLeft className="text-primary/80 hover:text-primary h-5 w-5" />
          </Link>
          <div className="flex items-center gap-3">
            <IconBookmark className="h-6 w-6 text-yellow-600 dark:text-yellow-500" />
            <h1 className="text-primary text-2xl font-bold">Bookmarks</h1>
          </div>
        </div>

        <div className="flex items-center justify-center py-12">
          <div className="border-accent-primary h-8 w-8 animate-spin rounded-full border-b-2"></div>
          <span className="ml-3 text-muted">Loading bookmarks...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 flex items-center gap-4">
        <Link
          href="/"
          className="rounded-lg p-2 transition-colors hover:bg-black/10 dark:hover:bg-white/10"
        >
          <IconArrowLeft className="text-primary/80 hover:text-primary h-5 w-5" />
        </Link>
        <div className="flex flex-1 items-center gap-3">
          <IconBookmark className="h-6 w-6 text-yellow-600 dark:text-yellow-500" />
          <h1 className="text-primary text-2xl font-bold">Bookmarks</h1>
          {bookmarkCount > 0 && (
            <span className="rounded-full bg-yellow-100 px-2 py-1 text-sm font-medium text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
              {bookmarkCount}
            </span>
          )}
        </div>
      </div>

      {/* Global Notes Toggle and Import/Refresh/Import Buttons */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        {/* Global Notes Toggle (only if bookmarks exist) */}
        {bookmarkCount > 0 && (
          <button
            onClick={() => setGlobalNotesVisible(!globalNotesVisible)}
            className={clsx(
              'flex items-center gap-2 rounded-lg px-4 py-2 font-medium transition-all duration-200',
              globalNotesVisible
                ? 'border border-blue-200 bg-blue-100 text-blue-700 dark:border-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                : 'border border-gray-200 bg-gray-100 text-gray-600 hover:bg-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700',
            )}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
            <span>{globalNotesVisible ? 'Hide All Notes' : 'Show All Notes'}</span>
            <svg
              className={clsx(
                'h-4 w-4 transition-transform duration-200',
                globalNotesVisible ? 'rotate-180' : '',
              )}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
        )}

        {/* Import/Refresh/Export Buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleImportBookmarks}
            className="flex items-center gap-2 rounded-lg border border-purple-200 bg-purple-100 px-4 py-2 font-medium text-purple-700 transition-all duration-200 hover:bg-purple-200 dark:border-purple-700 dark:bg-purple-900/30 dark:text-purple-300 dark:hover:bg-purple-800/50"
            title="Import bookmarks from file"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
              />
            </svg>
            Import
          </button>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 rounded-lg border border-gray-300 bg-gray-200 px-4 py-2 font-medium text-gray-800 transition-all duration-200 hover:bg-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
            title="Refresh bookmarks"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582M20 20v-5h-.581M5.635 19.364A9 9 0 104.582 9.582"
              />
            </svg>
            Refresh
          </button>
          {/* Only show export if bookmarks exist */}
          {bookmarkCount > 0 && (
            <button
              onClick={handleExportBookmarks}
              className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-100 px-4 py-2 font-medium text-green-700 transition-all duration-200 hover:bg-green-200 dark:border-green-700 dark:bg-green-900/30 dark:text-green-300 dark:hover:bg-green-800/50"
              title="Export bookmarks to file"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2z"
                />
              </svg>
              Export
            </button>
          )}
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Search Interface */}
      {bookmarkCount > 0 && (
        <div className="mb-6 space-y-4">
          {/* Search Input and Filter - Side by Side Layout */}
          <div className="flex flex-col gap-3 sm:flex-row">
            {/* Search Input */}
            <div className="relative flex-1">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <svg
                  className="h-5 w-5 text-gray-400 dark:text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 leading-5 text-gray-900 placeholder-gray-400 shadow-sm transition-all duration-200 hover:shadow-md focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800/50 dark:text-gray-100 dark:placeholder-gray-500 dark:focus:border-blue-400"
                placeholder="Search through your bookmarks..."
              />
            </div>

            {/* Search Filter Dropdown - Custom Component */}
            <div className="relative min-w-[140px]" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex w-full cursor-pointer items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 font-medium text-gray-700 shadow-sm transition-all duration-200 hover:bg-gray-50 hover:shadow-md focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800/50 dark:text-gray-300 dark:hover:bg-gray-700/50 dark:focus:border-blue-400"
              >
                <span className="flex items-center gap-2">
                  <span>{filterOptions.find((opt) => opt.value === searchFilter)?.icon}</span>
                  <span>{filterOptions.find((opt) => opt.value === searchFilter)?.label}</span>
                </span>
                <svg
                  className={clsx(
                    'h-4 w-4 text-gray-500 transition-transform duration-200 dark:text-gray-400',
                    isDropdownOpen ? 'rotate-180' : '',
                  )}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {/* Custom Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
                  {filterOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        setSearchFilter(option.value as 'both' | 'hadith' | 'notes')
                        setIsDropdownOpen(false)
                      }}
                      className={clsx(
                        'flex w-full items-center gap-3 px-4 py-3 text-left transition-colors duration-150',
                        searchFilter === option.value
                          ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                          : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700/50',
                      )}
                    >
                      <span className="text-lg">{option.icon}</span>
                      <div className="flex-1 font-medium">{option.label}</div>
                      {searchFilter === option.value && (
                        <svg
                          className="h-4 w-4 flex-shrink-0 text-blue-600 dark:text-blue-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Search Results Info */}
          {searchQuery.trim() && (
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {filteredBookmarks.length === bookmarkCount
                ? `Showing all ${bookmarkCount} bookmarks`
                : `Found ${filteredBookmarks.length} of ${bookmarkCount} bookmarks`}
            </div>
          )}
        </div>
      )}

      {/* Import Success Message */}
      {importMessage && (
        <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
          <p className="text-sm font-medium text-green-800 dark:text-green-300">{importMessage}</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
          <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* Content */}
      {bookmarkCount === 0 ? (
        <div className="py-12 text-center">
          <IconBookmark className="mx-auto mb-4 h-16 w-16 text-muted" />
          <h2 className="text-primary mb-2 text-xl font-semibold">No bookmarks yet</h2>
          <p className="mb-6 text-muted">
            Start bookmarking your favorite hadiths to see them here.
          </p>
          <Link
            href="/"
            className="bg-accent-primary hover:bg-accent-secondary inline-flex items-center rounded-lg px-4 py-2 font-medium text-white transition-colors"
          >
            Browse Hadiths
          </Link>
        </div>
      ) : filteredBookmarks.length === 0 && searchQuery.trim() ? (
        <div className="py-12 text-center">
          <svg
            className="mx-auto mb-4 h-16 w-16 text-muted"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <h2 className="text-primary mb-2 text-xl font-semibold">No results found</h2>
          <p className="mb-4 text-muted">No bookmarks match your search criteria.</p>
          <button
            onClick={() => setSearchQuery('')}
            className="text-accent-primary hover:underline"
          >
            Clear search
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Stats */}
          <div className="border-theme rounded-xl border bg-card p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted">Total bookmarks:</span>
              <span className="text-primary font-medium">{bookmarkCount}</span>
            </div>
            {searchQuery.trim() && (
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="text-muted">Showing results:</span>
                <span className="text-primary font-medium">{filteredBookmarks.length}</span>
              </div>
            )}
          </div>

          {/* Bookmark Preview Cards (if hadiths failed to load) */}
          {filteredFullHadiths.length === 0 && filteredBookmarks.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-primary text-lg font-semibold">Bookmark Previews</h2>
              <p className="mb-4 text-sm text-muted">
                Full content could not be loaded. Here are your bookmark previews:
              </p>

              {filteredBookmarks.map((bookmark) => (
                <BookmarkCard key={bookmark.bookId + ':' + bookmark.id} bookmark={bookmark} />
              ))}
            </div>
          )}

          {/* Full Hadith Cards */}
          {filteredFullHadiths.length > 0 && (
            <div className="space-y-6">
              <h2 className="text-primary text-lg font-semibold">Your Bookmarked Hadiths</h2>
              {filteredFullHadiths.map((hadith, idx) => {
                const bookmark = filteredBookmarks.find(
                  (b) => b.id === hadith.id && b.bookId === hadith.bookId,
                )
                return bookmark ? (
                  <div key={hadith.bookId + ':' + hadith.id} className="relative">
                    <div className="bg-accent-primary shadow-medium absolute -left-4 top-6 flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white">
                      {idx + 1}
                    </div>
                    <div className="ml-8">
                      <BookmarkedHadithCard
                        hadith={hadith}
                        bookmark={bookmark}
                        // Align with chapter card style: hide explicit View Chapter button here
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
