'use client'

import { useEffect, useCallback, useState, RefObject } from 'react'

const HISTORY_KEY = 'saadah-search-history'
const MAX_HISTORY = 10

/**
 * Retrieves search history from localStorage
 */
function getHistory(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

/**
 * Saves a query to search history (most recent first, deduped, max 10)
 */
function saveToHistory(query: string) {
  if (typeof window === 'undefined' || !query.trim()) return
  try {
    const prev = getHistory()
    const trimmed = query.trim()
    const updated = [trimmed, ...prev.filter((q) => q !== trimmed)].slice(0, MAX_HISTORY)
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated))
  } catch {
    // Storage full or unavailable
  }
}

/**
 * Hook for keyboard shortcuts and search history.
 *
 * - Ctrl+K / Cmd+K or "/" focuses the search input
 * - Saves submitted queries to localStorage history
 * - Returns recent history for dropdown display
 */
export function useSearchShortcuts(inputRef: RefObject<HTMLInputElement | null>) {
  const [history, setHistory] = useState<string[]>([])

  // Load history on mount
  useEffect(() => {
    setHistory(getHistory())
  }, [])

  // Keyboard shortcut: Ctrl+K or "/" to focus search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      const isInput =
        target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable

      // "/" only triggers when not already in an input
      if (e.key === '/' && !isInput) {
        e.preventDefault()
        inputRef.current?.focus()
        return
      }

      // Ctrl+K / Cmd+K works from anywhere
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [inputRef])

  const addToHistory = useCallback((query: string) => {
    saveToHistory(query)
    setHistory(getHistory())
  }, [])

  const clearHistory = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(HISTORY_KEY)
    }
    setHistory([])
  }, [])

  return { history, addToHistory, clearHistory }
}
