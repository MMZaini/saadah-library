// Server-only shared logic for building & caching book structure metadata.
// Imported by API routes — never import this from client components.

import { thaqalaynApi, Hadith } from '@/lib/api'
import { SEARCHABLE_BOOKS } from '@/lib/books-config'

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

export type StructureMap = Record<string, CategoryMeta>

export interface BookStructureEntry {
  structure: StructureMap
  totalHadiths: number
  volumeIds: string[]
}

// ── Server-side in-memory cache ──────────────────────────────────────────

interface CachedStructure {
  data: StructureMap
  timestamp: number
}

const structureCache = new Map<string, CachedStructure>()
const CACHE_TTL = 24 * 60 * 60 * 1000 // 24 hours

// All-structures aggregate cache
let allStructuresCache: {
  data: Record<string, BookStructureEntry>
  timestamp: number
} | null = null

// ── Helpers ──────────────────────────────────────────────────────────────

export function buildStructureFromHadiths(hadiths: Hadith[]): StructureMap {
  const structure: StructureMap = {}

  for (const hadith of hadiths) {
    const categoryKey = hadith.category || 'Uncategorized'
    const chapterKey = hadith.chapter || 'No Chapter'

    if (!structure[categoryKey]) {
      structure[categoryKey] = {
        category: categoryKey,
        categoryId: hadith.categoryId || '',
        chapters: {},
        totalHadiths: 0,
      }
    }

    if (!structure[categoryKey].chapters[chapterKey]) {
      structure[categoryKey].chapters[chapterKey] = {
        chapter: chapterKey,
        chapterInCategoryId: hadith.chapterInCategoryId || 0,
        hadithCount: 0,
      }
    }

    structure[categoryKey].chapters[chapterKey].hadithCount++
    structure[categoryKey].totalHadiths++
  }

  // Sort chapters within each category by chapterInCategoryId
  for (const category of Object.values(structure)) {
    const sorted: Record<string, ChapterMeta> = {}
    Object.entries(category.chapters)
      .sort(([, a], [, b]) => a.chapterInCategoryId - b.chapterInCategoryId)
      .forEach(([k, v]) => {
        sorted[k] = v
      })
    category.chapters = sorted
  }

  return structure
}

function getCacheKey(bookIds: string[]): string {
  return bookIds.slice().sort().join('|')
}

// ── Public API ───────────────────────────────────────────────────────────

/**
 * Get the structure for one or more book/volume IDs.
 * Checks server cache first (24h TTL), then fetches from external API.
 */
export async function getStructure(bookIds: string[]): Promise<StructureMap> {
  const key = getCacheKey(bookIds)

  const cached = structureCache.get(key)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data
  }

  // Fetch hadiths in parallel (max 4 concurrent)
  const results: Hadith[][] = []
  const batchSize = 4
  for (let i = 0; i < bookIds.length; i += batchSize) {
    const batch = bookIds.slice(i, i + batchSize)
    const batchResults = await Promise.all(
      batch.map(async (id) => {
        try {
          return await thaqalaynApi.getBookHadiths(id)
        } catch {
          return []
        }
      }),
    )
    results.push(...batchResults)
  }

  const allHadiths = results.flat()
  const structure = buildStructureFromHadiths(allHadiths)

  structureCache.set(key, { data: structure, timestamp: Date.now() })
  return structure
}

/**
 * Get structures for ALL books in the library at once.
 * Returns both individual volume structures and pre-merged multi-volume aggregates.
 * Server-cached for 24h.
 */
export async function getAllStructures(): Promise<Record<string, BookStructureEntry>> {
  // Return from cache if fresh
  if (allStructuresCache && Date.now() - allStructuresCache.timestamp < CACHE_TTL) {
    return allStructuresCache.data
  }

  const result: Record<string, BookStructureEntry> = {}

  // Collect every unique volume ID
  const allVolumeIds: string[] = []
  for (const book of SEARCHABLE_BOOKS) {
    allVolumeIds.push(...book.volumeIds)
  }
  const uniqueVolumeIds = [...new Set(allVolumeIds)]

  // Fetch all volumes in parallel (batches of 6)
  const volumeStructures = new Map<string, StructureMap>()
  const batchSize = 6
  for (let i = 0; i < uniqueVolumeIds.length; i += batchSize) {
    const batch = uniqueVolumeIds.slice(i, i + batchSize)
    const batchResults = await Promise.all(
      batch.map(async (volumeId) => {
        // Check individual cache first
        const cached = structureCache.get(volumeId)
        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
          return { id: volumeId, structure: cached.data }
        }
        try {
          const hadiths = await thaqalaynApi.getBookHadiths(volumeId)
          const structure = buildStructureFromHadiths(hadiths)
          // Also populate individual cache
          structureCache.set(volumeId, { data: structure, timestamp: Date.now() })
          return { id: volumeId, structure }
        } catch {
          return { id: volumeId, structure: {} as StructureMap }
        }
      }),
    )
    for (const { id, structure } of batchResults) {
      volumeStructures.set(id, structure)
    }
  }

  // Build result entries per SEARCHABLE_BOOKS entry
  for (const book of SEARCHABLE_BOOKS) {
    // Individual volume entries
    for (const volumeId of book.volumeIds) {
      const structure = volumeStructures.get(volumeId) || {}
      const totalHadiths = Object.values(structure).reduce((sum, cat) => sum + cat.totalHadiths, 0)
      result[volumeId] = { structure, totalHadiths, volumeIds: [volumeId] }
    }

    // Pre-merged multi-volume aggregate (only for multi-volume books)
    if (book.volumeCount > 1) {
      const mergedStructure: StructureMap = {}
      for (const volumeId of book.volumeIds) {
        const vs = volumeStructures.get(volumeId)
        if (!vs) continue
        for (const [catKey, catMeta] of Object.entries(vs)) {
          if (!mergedStructure[catKey]) {
            mergedStructure[catKey] = { ...catMeta, chapters: { ...catMeta.chapters } }
          } else {
            // Merge chapters into existing category
            for (const [chKey, chMeta] of Object.entries(catMeta.chapters)) {
              if (!mergedStructure[catKey].chapters[chKey]) {
                mergedStructure[catKey].chapters[chKey] = { ...chMeta }
              } else {
                mergedStructure[catKey].chapters[chKey].hadithCount += chMeta.hadithCount
              }
            }
            mergedStructure[catKey].totalHadiths += catMeta.totalHadiths
          }
        }
      }

      const cacheKey = `__merged__:${getCacheKey(book.volumeIds)}`
      const totalHadiths = Object.values(mergedStructure).reduce(
        (sum, cat) => sum + cat.totalHadiths,
        0,
      )
      result[cacheKey] = {
        structure: mergedStructure,
        totalHadiths,
        volumeIds: book.volumeIds,
      }

      // Also put the merged structure in the individual cache
      structureCache.set(getCacheKey(book.volumeIds), {
        data: mergedStructure,
        timestamp: Date.now(),
      })
    }
  }

  allStructuresCache = { data: result, timestamp: Date.now() }
  return result
}
