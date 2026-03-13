// Client-side helper for fetching lightweight book structure metadata.
// Instead of downloading entire hadith payloads (2-36 MB), this fetches
// a structure-only summary (~5-50 KB) from the server-side API route.
//
// On app load the prefetchAllStructures() function is called in the
// background.  It pulls every book's structure in a single request and
// seeds IndexedDB so all subsequent book navigations are instant (zero
// network request).

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

interface AllStructuresResponse {
  structures: Record<
    string,
    {
      structure: BookStructureMap
      totalHadiths: number
      volumeIds: string[]
    }
  >
}

// ── Cache key helper ─────────────────────────────────────────────────────

const STRUCTURE_TTL = 24 * 60 * 60 * 1000 // 24 hours

function structureCacheKey(bookIds: string[]): string {
  return `book-structure:${bookIds.slice().sort().join('|')}`
}

// ── Prefetch state ───────────────────────────────────────────────────────

let prefetchPromise: Promise<void> | null = null
let prefetchDone = false

/**
 * Prefetch ALL book structures in a single request and seed IndexedDB.
 * Safe to call multiple times — only the first invocation does work.
 * Designed to be called from a useEffect / requestIdleCallback on app load.
 */
export function prefetchAllStructures(): Promise<void> {
  if (prefetchDone) return Promise.resolve()
  if (prefetchPromise) return prefetchPromise

  prefetchPromise = _doPrefetch()
  return prefetchPromise
}

async function _doPrefetch(): Promise<void> {
  try {
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''
    const res = await fetch(`${basePath}/api/all-book-structures`)
    if (!res.ok) return

    const data: AllStructuresResponse = await res.json()
    if (!data.structures) return

    // Store every entry in IndexedDB with the correct cache key
    const storeOps: Promise<void>[] = []

    for (const [entryKey, entry] of Object.entries(data.structures)) {
      if (!entry.structure) continue

      // Determine the client cache key
      let cacheKeyStr: string
      if (entryKey.startsWith('__merged__:')) {
        // Multi-volume aggregate — key encodes the sorted volume IDs
        const sortedIds = entryKey.replace('__merged__:', '').split('|')
        cacheKeyStr = structureCacheKey(sortedIds)
      } else {
        // Single volume
        cacheKeyStr = structureCacheKey([entryKey])
      }

      storeOps.push(cacheSet(cacheKeyStr, entry.structure, STRUCTURE_TTL))
    }

    await Promise.all(storeOps)
    prefetchDone = true
  } catch {
    // Non-critical — components will fall back to on-demand fetch
  }
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
