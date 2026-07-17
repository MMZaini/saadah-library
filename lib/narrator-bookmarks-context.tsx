'use client'

import { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react'
import type { NarratorEntry } from '@/lib/data/rijal-types'

// Check localStorage availability (mirrors bookmarks-context).
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

// Minimal narrator bookmark — enough to render a card and re-open the entry
// without re-fetching the (potentially multi-MB) full record.
export interface NarratorBookmarkData {
  id: string
  primaryName: string
  transliteratedName?: string
  volumeNumber: number
  startPage: number
  endPage: number
  entryNumber?: number
  sourceEntryNumber?: number
  timestamp: number
  preview?: string
  notes?: string
}

type NarratorBookmarksContextType = {
  narratorBookmarks: NarratorBookmarkData[]
  addNarratorBookmark: (narrator: NarratorEntry) => void
  removeNarratorBookmark: (id: string) => void
  updateNarratorBookmarkNotes: (id: string, notes: string) => void
  importNarratorBookmarks: (bookmarks: NarratorBookmarkData[]) => {
    imported: number
    duplicates: number
  }
  isNarratorBookmarked: (id: string) => boolean
  narratorBookmarkCount: number
  isHydrated: boolean
}

const NarratorBookmarksContext = createContext<NarratorBookmarksContextType | null>(null)

const STORAGE_KEY = 'bookmarkedNarrators'
const MAX_BOOKMARKS = 1000
const MAX_PREVIEW_LENGTH = 220

function isValid(bookmark: Partial<NarratorBookmarkData>): bookmark is NarratorBookmarkData {
  return (
    typeof bookmark.id === 'string' &&
    typeof bookmark.primaryName === 'string' &&
    typeof bookmark.volumeNumber === 'number' &&
    typeof bookmark.timestamp === 'number'
  )
}

export function NarratorBookmarksProvider({ children }: { children: React.ReactNode }) {
  const [narratorBookmarks, setNarratorBookmarks] = useState<NarratorBookmarkData[]>([])
  const [isHydrated, setIsHydrated] = useState(false)

  // Load from localStorage on mount.
  useEffect(() => {
    setIsHydrated(true)
    if (!isLocalStorageAvailable()) return

    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved) as NarratorBookmarkData[]
        const valid = parsed.filter(isValid).sort((a, b) => b.timestamp - a.timestamp)
        setNarratorBookmarks(valid)
      }
    } catch (error) {
      console.error('Failed to load narrator bookmarks from localStorage:', error)
      try {
        localStorage.removeItem(STORAGE_KEY)
      } catch {}
    }
  }, [])

  // Persist on change, with quota handling.
  useEffect(() => {
    if (!isHydrated || !isLocalStorageAvailable()) return

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(narratorBookmarks))
    } catch (error) {
      console.error('Failed to save narrator bookmarks to localStorage:', error)
      if (error instanceof Error && error.message.includes('QuotaExceededError')) {
        try {
          const reduced = narratorBookmarks.slice(0, Math.floor(MAX_BOOKMARKS / 2))
          setNarratorBookmarks(reduced)
          localStorage.setItem(STORAGE_KEY, JSON.stringify(reduced))
        } catch (clearError) {
          console.error('Failed to save reduced narrator bookmarks:', clearError)
        }
      }
    }
  }, [narratorBookmarks, isHydrated])

  const addNarratorBookmark = useCallback((narrator: NarratorEntry) => {
    setNarratorBookmarks((prev) => {
      if (prev.some((bookmark) => bookmark.id === narrator.id)) return prev

      const plainText = narrator.plainText || ''
      const newBookmark: NarratorBookmarkData = {
        id: narrator.id,
        primaryName: narrator.primaryName,
        transliteratedName: narrator.transliteratedName,
        volumeNumber: narrator.volumeNumber,
        startPage: narrator.startPage,
        endPage: narrator.endPage,
        entryNumber: narrator.entryNumber,
        sourceEntryNumber: narrator.sourceEntryNumber,
        timestamp: Date.now(),
        preview: plainText
          ? plainText.slice(0, MAX_PREVIEW_LENGTH) +
            (plainText.length > MAX_PREVIEW_LENGTH ? '…' : '')
          : undefined,
      }

      const updated = [newBookmark, ...prev]
      return updated.length > MAX_BOOKMARKS ? updated.slice(0, MAX_BOOKMARKS) : updated
    })
  }, [])

  const removeNarratorBookmark = useCallback((id: string) => {
    setNarratorBookmarks((prev) => prev.filter((bookmark) => bookmark.id !== id))
  }, [])

  const updateNarratorBookmarkNotes = useCallback((id: string, notes: string) => {
    setNarratorBookmarks((prev) =>
      prev.map((bookmark) =>
        bookmark.id === id ? { ...bookmark, notes: notes.trim() || undefined } : bookmark,
      ),
    )
  }, [])

  const importNarratorBookmarks = useCallback((imported: NarratorBookmarkData[]) => {
    let added = 0
    let duplicates = 0
    setNarratorBookmarks((prev) => {
      const existing = new Set(prev.map((bookmark) => bookmark.id))
      const next: NarratorBookmarkData[] = []
      for (const bookmark of imported) {
        if (!isValid(bookmark)) continue
        if (existing.has(bookmark.id)) {
          duplicates++
          continue
        }
        next.push({ ...bookmark, timestamp: bookmark.timestamp || Date.now() })
        existing.add(bookmark.id)
        added++
      }
      const updated = [...next, ...prev]
      return updated.length > MAX_BOOKMARKS ? updated.slice(0, MAX_BOOKMARKS) : updated
    })
    return { imported: added, duplicates }
  }, [])

  const isNarratorBookmarked = useCallback(
    (id: string) => narratorBookmarks.some((bookmark) => bookmark.id === id),
    [narratorBookmarks],
  )

  const contextValue = useMemo(
    () => ({
      narratorBookmarks,
      addNarratorBookmark,
      removeNarratorBookmark,
      updateNarratorBookmarkNotes,
      importNarratorBookmarks,
      isNarratorBookmarked,
      narratorBookmarkCount: narratorBookmarks.length,
      isHydrated,
    }),
    [
      narratorBookmarks,
      addNarratorBookmark,
      removeNarratorBookmark,
      updateNarratorBookmarkNotes,
      importNarratorBookmarks,
      isNarratorBookmarked,
      isHydrated,
    ],
  )

  return (
    <NarratorBookmarksContext.Provider value={contextValue}>
      {children}
    </NarratorBookmarksContext.Provider>
  )
}

export function useNarratorBookmarks() {
  const context = useContext(NarratorBookmarksContext)
  if (!context) {
    throw new Error('useNarratorBookmarks must be used within a NarratorBookmarksProvider')
  }
  return context
}
