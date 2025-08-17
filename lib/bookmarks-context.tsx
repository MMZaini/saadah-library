'use client'

import { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react'
import { Hadith } from './api'

// Check localStorage availability
const isLocalStorageAvailable = () => {
  try {
    if (typeof window === 'undefined') return false
    const test = '__localStorage_test__'
    localStorage.setItem(test, test)
    localStorage.removeItem(test)
    return true
  } catch {
    return false
  }
}

// Minimal bookmark data for efficient storage
export interface BookmarkData {
  id: number
  bookId: string
  book: string
  category: string
  chapter: string
  volume?: number
  timestamp: number
  // Store a preview of the text for quick display
  preview: string
  arabicPreview?: string
  // User notes for this bookmark
  notes?: string
}

type BookmarksContextType = {
  bookmarks: BookmarkData[]
  addBookmark: (hadith: Hadith) => void
  removeBookmark: (bookId: string, hadithId: number) => void
  updateBookmarkNotes: (bookId: string, hadithId: number, notes: string) => void
  importBookmarks: (bookmarks: BookmarkData[]) => { imported: number, duplicates: number }
  isBookmarked: (bookId: string, hadithId: number) => boolean
  bookmarkCount: number
  isHydrated: boolean
}

const BookmarksContext = createContext<BookmarksContextType | null>(null)

const STORAGE_KEY = 'bookmarkedHadiths'
const MAX_BOOKMARKS = 1000 // Limit to prevent localStorage bloat
const MAX_PREVIEW_LENGTH = 200 // Preview text length

export function BookmarksProvider({ children }: { children: React.ReactNode }) {
  const [bookmarks, setBookmarks] = useState<BookmarkData[]>([])
  const [isHydrated, setIsHydrated] = useState(false)

  // Load bookmarks from localStorage on mount
  useEffect(() => {
    setIsHydrated(true)
    
    if (!isLocalStorageAvailable()) {
      return
    }

    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved) as BookmarkData[]
        // Validate the data structure and sort by timestamp (newest first)
        const validBookmarks = parsed
          .filter(bookmark => 
            typeof bookmark.id === 'number' &&
            typeof bookmark.bookId === 'string' &&
            typeof bookmark.book === 'string' &&
            typeof bookmark.timestamp === 'number'
          )
          .sort((a, b) => b.timestamp - a.timestamp)
        
        setBookmarks(validBookmarks)
      }
    } catch (error) {
      console.error('Failed to load bookmarks from localStorage:', error)
      // Clear corrupted data
      try {
        localStorage.removeItem(STORAGE_KEY)
      } catch {}
    }
  }, [])

  // Save bookmarks to localStorage whenever they change
  useEffect(() => {
    if (!isHydrated || !isLocalStorageAvailable()) {
      return
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks))
    } catch (error) {
      console.error('Failed to save bookmarks to localStorage:', error)
      
      // Try to handle quota exceeded error
      if (error instanceof Error && error.message.includes('QuotaExceededError')) {
        try {
          // Remove oldest bookmarks and try again
          const reducedBookmarks = bookmarks.slice(0, Math.floor(MAX_BOOKMARKS / 2))
          setBookmarks(reducedBookmarks)
          localStorage.setItem(STORAGE_KEY, JSON.stringify(reducedBookmarks))
        } catch (clearError) {
          console.error('Failed to save reduced bookmarks:', clearError)
        }
      }
    }
  }, [bookmarks, isHydrated])

  const addBookmark = useCallback((hadith: Hadith) => {
    setBookmarks(prev => {
      // Check if already bookmarked (by bookId and id)
      if (prev.some(bookmark => bookmark.id === hadith.id && bookmark.bookId === hadith.bookId)) {
        return prev
      }

      // Create bookmark data with preview text
      const englishText = hadith.englishText || hadith.thaqalaynMatn || ''
      const arabicText = hadith.arabicText || ''
      
      const newBookmark: BookmarkData = {
        id: hadith.id,
        bookId: hadith.bookId,
        book: hadith.book,
        category: hadith.category,
        chapter: hadith.chapter,
        volume: hadith.volume,
        timestamp: Date.now(),
        preview: englishText.slice(0, MAX_PREVIEW_LENGTH) + (englishText.length > MAX_PREVIEW_LENGTH ? '...' : ''),
        arabicPreview: arabicText ? (arabicText.slice(0, MAX_PREVIEW_LENGTH) + (arabicText.length > MAX_PREVIEW_LENGTH ? '...' : '')) : undefined
      }

      // Add to beginning of array (newest first)
      const updated = [newBookmark, ...prev]

      // Limit the number of bookmarks
      if (updated.length > MAX_BOOKMARKS) {
        return updated.slice(0, MAX_BOOKMARKS)
      }

      return updated
    })
  }, [])

  const removeBookmark = useCallback((bookId: string, hadithId: number) => {
    setBookmarks(prev => prev.filter(bookmark => !(bookmark.id === hadithId && bookmark.bookId === bookId)))
  }, [])

  const updateBookmarkNotes = useCallback((bookId: string, hadithId: number, notes: string) => {
    setBookmarks(prev => prev.map(bookmark => 
      bookmark.id === hadithId && bookmark.bookId === bookId
        ? { ...bookmark, notes: notes.trim() || undefined }
        : bookmark
    ))
  }, [])

  const importBookmarks = useCallback((importedBookmarks: BookmarkData[]) => {
    let imported = 0
    let duplicates = 0
    setBookmarks(prev => {
      const existingKeys = new Set(prev.map(bookmark => `${bookmark.bookId}::${bookmark.id}`))
      const newBookmarks = []
      for (const bookmark of importedBookmarks) {
        const key = `${bookmark.bookId}::${bookmark.id}`
        if (existingKeys.has(key)) {
          duplicates++
        } else {
          // Validate the bookmark structure
          if (
            typeof bookmark.id === 'number' &&
            typeof bookmark.bookId === 'string' &&
            typeof bookmark.book === 'string' &&
            typeof bookmark.category === 'string' &&
            typeof bookmark.chapter === 'string' &&
            typeof bookmark.timestamp === 'number'
          ) {
            newBookmarks.push({
              ...bookmark,
              timestamp: bookmark.timestamp || Date.now(),
              preview: bookmark.preview || `${bookmark.book} - ${bookmark.chapter}`,
              arabicPreview: bookmark.arabicPreview || undefined,
              notes: bookmark.notes || undefined
            })
            imported++
            existingKeys.add(key)
          }
        }
      }
      const updated = [...newBookmarks, ...prev]
      return updated.length > MAX_BOOKMARKS ? updated.slice(0, MAX_BOOKMARKS) : updated
    })
    return { imported, duplicates }
  }, [])

  const isBookmarked = useCallback((bookId: string, hadithId: number) => {
    return bookmarks.some(bookmark => bookmark.id === hadithId && bookmark.bookId === bookId)
  }, [bookmarks])

  const contextValue = useMemo(() => ({
    bookmarks,
    addBookmark,
    removeBookmark,
    updateBookmarkNotes,
    importBookmarks,
    isBookmarked,
    bookmarkCount: bookmarks.length,
    isHydrated
  }), [bookmarks, addBookmark, removeBookmark, updateBookmarkNotes, importBookmarks, isBookmarked, isHydrated])

  return (
    <BookmarksContext.Provider value={contextValue}>
      {children}
    </BookmarksContext.Provider>
  )
}

export function useBookmarks() {
  const context = useContext(BookmarksContext)
  if (!context) {
    throw new Error('useBookmarks must be used within a BookmarksProvider')
  }
  return context
}
