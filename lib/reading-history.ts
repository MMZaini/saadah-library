'use client'

// Tiny localStorage-backed "continue reading" store. Chapter pages record a
// visit on load; the homepage surfaces the most recent entries.

export interface ReadingHistoryEntry {
  /** Library-relative path (no basePath), e.g. /al-kafi/volume/1/chapter/2/1 */
  path: string
  bookTitle: string
  chapter: string
  timestamp: number
}

const STORAGE_KEY = 'saadah-reading-history'
const MAX_ENTRIES = 3

export function getReadingHistory(): ReadingHistoryEntry[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as ReadingHistoryEntry[]
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (entry) =>
        typeof entry?.path === 'string' &&
        typeof entry?.bookTitle === 'string' &&
        typeof entry?.chapter === 'string' &&
        typeof entry?.timestamp === 'number',
    )
  } catch {
    return []
  }
}

export function recordChapterVisit(entry: Omit<ReadingHistoryEntry, 'timestamp'>): void {
  if (typeof window === 'undefined' || !entry.path) return
  try {
    const next: ReadingHistoryEntry[] = [
      { ...entry, timestamp: Date.now() },
      ...getReadingHistory().filter((existing) => existing.path !== entry.path),
    ].slice(0, MAX_ENTRIES)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // Best-effort — never let history-keeping break reading.
  }
}
