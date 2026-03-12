import { thaqalaynApi, Hadith, BookInfo, QueryResponse } from './api'
import { normalizeArabic, isArabicQuery } from './search-utils'

// Simple in-memory Arabic search index, built once and reused.
// NOTE: On serverless platforms this cache is per-instance and volatile.

type IndexedHadith = Hadith & { normalizedArabicText: string }

let indexBuilding: Promise<void> | null = null
let indexed: IndexedHadith[] | null = null
let lastBuilt = 0

// Rebuild index every 6 hours by default
const INDEX_TTL_MS = 6 * 60 * 60 * 1000

// Refresh interval: default to INDEX_TTL_MS, can be overridden with
// environment variable ARABIC_INDEX_REFRESH_HOURS (number of hours)
const REFRESH_INTERVAL_MS: number = (() => {
  const v = process.env.ARABIC_INDEX_REFRESH_HOURS
  if (v) {
    const n = parseFloat(v)
    if (!Number.isNaN(n) && n > 0) return Math.floor(n * 60 * 60 * 1000)
  }
  return INDEX_TTL_MS
})()

let refreshTimer: NodeJS.Timeout | null = null

const shouldRebuild = () => !indexed || Date.now() - lastBuilt > INDEX_TTL_MS

async function fetchAllBooks(): Promise<BookInfo[]> {
  try {
    const books = await thaqalaynApi.getAllBooks()
    return Array.isArray(books) ? books : []
  } catch {
    return []
  }
}

async function fetchHadithsForBook(bookId: string): Promise<Hadith[]> {
  try {
    const hadiths = await thaqalaynApi.getBookHadiths(bookId)
    return Array.isArray(hadiths) ? hadiths : []
  } catch {
    return []
  }
}

// Limit concurrent fetches to avoid hammering the API
async function withConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, i: number) => Promise<R>,
): Promise<R[]> {
  const results: R[] = []
  let i = 0

  async function worker() {
    while (i < items.length) {
      const cur = i++
      results[cur] = await fn(items[cur], cur)
    }
  }

  const workers = Array.from({ length: Math.min(limit, items.length) }, () => worker())
  await Promise.all(workers)
  return results
}

async function buildIndex(): Promise<void> {
  // If already building, wait for it
  if (indexBuilding) return indexBuilding

  indexBuilding = (async () => {
    const books = await fetchAllBooks()
    if (books.length === 0) {
      indexed = []
      lastBuilt = Date.now()
      return
    }

    const bookIds = books.map((b) => b.bookId).filter(Boolean)
    const allHadithsArrays = await withConcurrency(
      bookIds,
      3,
      async (bookId) => await fetchHadithsForBook(bookId),
    )
    const allHadiths = allHadithsArrays.flat().filter(Boolean)

    indexed = allHadiths.map((h) => {
      const arabic = h.arabicText || h.thaqalaynMatn || ''
      const normalizedArabicText = normalizeArabic(arabic)
      return { ...h, normalizedArabicText }
    })

    lastBuilt = Date.now()
  })()

  try {
    await indexBuilding
  } finally {
    indexBuilding = null
  }
}

export async function ensureArabicIndexReady(): Promise<void> {
  if (shouldRebuild()) {
    await buildIndex()
  }
}

/**
 * Start a background refresher that rebuilds the index every `REFRESH_INTERVAL_MS`.
 * This will also pre-warm the index immediately.
 *
 * In serverless environments each instance will start its own refresher when this
 * module is imported. That's usually fine but be aware of per-instance costs.
 */
export function startArabicIndexRefresher(): void {
  // Only start once
  if (refreshTimer) return

  // Immediately build (pre-warm) but don't block the importer
  void buildIndex().catch(() => {
    // swallow errors here; ensureArabicIndexReady will try again on demand
  })

  // Schedule periodic rebuilds
  refreshTimer = setInterval(() => {
    // Rebuild in the background if it's time or if there's no index
    if (shouldRebuild()) {
      void buildIndex().catch(() => {
        // ignore background errors
      })
    }
  }, REFRESH_INTERVAL_MS)
}

export function stopArabicIndexRefresher(): void {
  if (!refreshTimer) return
  clearInterval(refreshTimer)
  refreshTimer = null
}

// Auto-start refresher when running on the server (Node). This makes the module
// proactively keep the index fresh without any additional wiring.
if (typeof window === 'undefined') {
  try {
    startArabicIndexRefresher()
  } catch {
    // ignore startup failures
  }
}

export async function searchArabicLocally(query: string): Promise<QueryResponse> {
  const q = normalizeArabic(query)
  if (!q) return { results: [], total: 0 }

  await ensureArabicIndexReady()
  const list = indexed || []

  // Simple includes matching on normalized Arabic text
  const results = list.filter((h) => h.normalizedArabicText.includes(q))

  // Return as Hadith[] (drop the helper field)
  return {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    results: results.map(({ normalizedArabicText: _unused, ...rest }) => rest),
    total: results.length,
  }
}

export function isArabic(text: string): boolean {
  return isArabicQuery(text)
}

/**
 * Force rebuild the Arabic index immediately (awaits completion).
 * Useful for admin/debug endpoints to trigger a rebuild on demand.
 */
export async function forceRebuild(): Promise<void> {
  // call the internal buildIndex which will dedupe concurrent builds
  await buildIndex()
}
