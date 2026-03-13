// Client-side helper for fetching lightweight book structure metadata.
// Instead of downloading entire hadith payloads (2-36 MB), this fetches
// a structure-only summary (~5-50 KB) from the server-side API route.

import { cacheGet, cacheSet } from './hadith-cache'

// ── Types ────────────────────────────────────────────────────────────────

export interface ChapterMeta {
  chapter: string
  chapterInCategoryId: number
  hadithCount: number
}

export interface CategoryMeta {
  category: string
  categoryId: string
  chapters: Record<string, ChapterMeta>
  totalHadiths: number
}

export type BookStructureMap = Record<string, CategoryMeta>

interface BookStructureResponse {
  structure: BookStructureMap
  totalHadiths: number
  bookIds: string[]
}

// ── Cache key helper ─────────────────────────────────────────────────────

const STRUCTURE_TTL = 6 * 60 * 60 * 1000 // 6 hours

function structureCacheKey(bookIds: string[]): string {
  return `book-structure:${bookIds.slice().sort().join('|')}`
}

// ── Public API ───────────────────────────────────────────────────────────

/**
 * Fetch the chapter/category structure for a single book (or volume).
 * Returns the same shape that the old client-side summary-building code produced.
 *
 * Falls back to null on error so callers can degrade gracefully.
 */
export async function fetchBookStructure(bookId: string): Promise<BookStructureMap | null> {
  const key = structureCacheKey([bookId])

  // Check client cache first (IndexedDB + memory)
  const cached = await cacheGet(key)
  if (cached && typeof cached === 'object' && !Array.isArray(cached)) {
    return cached as BookStructureMap
  }

  try {
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''
    const res = await fetch(`${basePath}/api/book-structure/${encodeURIComponent(bookId)}`)
    if (!res.ok) return null

    const data: BookStructureResponse = await res.json()
    if (!data.structure) return null

    // Persist in client cache
    await cacheSet(key, data.structure, STRUCTURE_TTL)

    return data.structure
  } catch {
    return null
  }
}

/**
 * Fetch the aggregated structure across multiple volumes.
 * Used for the "All Volumes" option on multi-volume books.
 */
export async function fetchMultiVolumeStructure(
  volumeIds: string[],
): Promise<BookStructureMap | null> {
  if (!volumeIds.length) return null

  const key = structureCacheKey(volumeIds)

  const cached = await cacheGet(key)
  if (cached && typeof cached === 'object' && !Array.isArray(cached)) {
    return cached as BookStructureMap
  }

  try {
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''
    // Use the first volume's ID as the route param and the rest as a query param
    const primary = volumeIds[0]
    const allVolumes = volumeIds.join(',')
    const res = await fetch(
      `${basePath}/api/book-structure/${encodeURIComponent(primary)}?volumes=${encodeURIComponent(allVolumes)}`,
    )
    if (!res.ok) return null

    const data: BookStructureResponse = await res.json()
    if (!data.structure) return null

    await cacheSet(key, data.structure, STRUCTURE_TTL)

    return data.structure
  } catch {
    return null
  }
}
