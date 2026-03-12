// Persistent cache layer for Thaqalayn API data
// Browser: IndexedDB (persistent) + in-memory Map (fast overlay)
// Server:  in-memory Map only (IndexedDB not available)

interface CacheEntry {
  key: string
  data: unknown
  timestamp: number
  ttl: number
}

const isClient = typeof window !== 'undefined'

// ─── In-memory cache (fast overlay, works everywhere) ───────────────────

const memoryCache = new Map<string, CacheEntry>()
const MAX_MEMORY_ENTRIES = 250

function memGet(key: string): CacheEntry | null {
  const entry = memoryCache.get(key)
  if (!entry) return null
  if (Date.now() - entry.timestamp > entry.ttl) {
    memoryCache.delete(key)
    return null
  }
  return entry
}

function memSet(entry: CacheEntry): void {
  memoryCache.set(entry.key, entry)
  // Evict oldest entries if over limit
  if (memoryCache.size > MAX_MEMORY_ENTRIES) {
    const firstKey = memoryCache.keys().next().value
    if (firstKey) memoryCache.delete(firstKey)
  }
}

// ─── IndexedDB (persistent, browser-only) ────────────────────────────────

const DB_NAME = 'saadah-hadith-cache'
const DB_VERSION = 1
const STORE_NAME = 'responses'

let dbPromise: Promise<IDBDatabase> | null = null
let dbFailed = false

function openDB(): Promise<IDBDatabase> {
  if (dbFailed) return Promise.reject(new Error('IndexedDB unavailable'))
  if (dbPromise) return dbPromise

  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onupgradeneeded = () => {
        const db = request.result
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'key' })
        }
      }

      request.onsuccess = () => resolve(request.result)

      request.onerror = () => {
        dbFailed = true
        reject(request.error)
      }
    } catch (err) {
      dbFailed = true
      reject(err)
    }
  })

  return dbPromise
}

async function idbGet(key: string): Promise<CacheEntry | null> {
  if (!isClient || dbFailed) return null
  try {
    const db = await openDB()
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly')
      const store = tx.objectStore(STORE_NAME)
      const req = store.get(key)
      req.onsuccess = () => {
        const entry = req.result as CacheEntry | undefined
        if (!entry) return resolve(null)
        // Check TTL – expired entries are ignored
        if (Date.now() - entry.timestamp > entry.ttl) {
          return resolve(null)
        }
        resolve(entry)
      }
      req.onerror = () => resolve(null)
    })
  } catch {
    return null
  }
}

async function idbSet(entry: CacheEntry): Promise<void> {
  if (!isClient || dbFailed) return
  try {
    const db = await openDB()
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      const store = tx.objectStore(STORE_NAME)
      store.put(entry)
      tx.oncomplete = () => resolve()
      tx.onerror = () => resolve()
    })
  } catch {
    // Silently fail – cache is best-effort
  }
}

// ─── Public API ──────────────────────────────────────────────────────────

/** Cache TTLs in milliseconds */
export const CACHE_TTL = {
  /** Book metadata (allbooks) – extremely stable */
  allBooks: 24 * 60 * 60 * 1000, // 24 hours
  /** Full-volume hadith lists – content is fixed / very stable */
  bookHadiths: 12 * 60 * 60 * 1000, // 12 hours
  /** Individual hadith – content is fixed */
  singleHadith: 24 * 60 * 60 * 1000, // 24 hours
  /** Search results – brief cache for repeated queries */
  search: 30 * 60 * 1000, // 30 minutes
  /** Fallback for unrecognized URLs */
  default: 5 * 60 * 1000, // 5 minutes
}

/** Determine the appropriate TTL based on a Thaqalayn API URL */
export function getTtlForUrl(url: string): number {
  // Random endpoints should never be cached
  if (url.includes('/random')) return 0
  // Book list
  if (url.includes('/allbooks')) return CACHE_TTL.allBooks
  // Search results
  if (url.includes('/query')) return CACHE_TTL.search

  // Extract path after /api/v2/
  const marker = '/api/v2/'
  const idx = url.indexOf(marker)
  if (idx === -1) return CACHE_TTL.default
  const path = url.slice(idx + marker.length)
  const segments = path.split('/').filter(Boolean)

  // /{bookId}/{hadithId} – 2 segments, second is numeric
  if (segments.length === 2 && /^\d+$/.test(segments[1])) {
    return CACHE_TTL.singleHadith
  }
  // /{bookId} – 1 segment (full volume / book)
  if (segments.length === 1 && !url.includes('/ingredients')) {
    return CACHE_TTL.bookHadiths
  }

  return CACHE_TTL.default
}

/** Get data from the cache (checks memory first, then IndexedDB) */
export async function cacheGet(key: string): Promise<unknown | null> {
  // Memory first (sync, fastest)
  const mem = memGet(key)
  if (mem) return mem.data

  // IndexedDB fallback (async, persistent across navigations)
  if (isClient) {
    const idb = await idbGet(key)
    if (idb) {
      // Promote to memory for fast subsequent access
      memSet(idb)
      return idb.data
    }
  }

  return null
}

/** Store data in the cache (memory + IndexedDB). TTL auto-detected from URL. */
export async function cacheSet(
  key: string,
  data: unknown,
  ttl?: number,
): Promise<void> {
  const resolvedTtl = ttl ?? getTtlForUrl(key)
  // TTL of 0 means "don't cache" (e.g. random endpoints)
  if (resolvedTtl <= 0) return

  const entry: CacheEntry = {
    key,
    data,
    timestamp: Date.now(),
    ttl: resolvedTtl,
  }

  // Always set in memory (sync)
  memSet(entry)

  // Persist to IndexedDB in the background (fire-and-forget for speed)
  if (isClient) {
    void idbSet(entry)
  }
}

/**
 * Search within a cached full-volume response for a specific hadith.
 * Also checks the individual-hadith cache entry.
 * Returns the hadith object if found, or null.
 */
export async function findHadithInCache(
  apiBaseUrl: string,
  bookId: string,
  hadithId: number,
): Promise<unknown | null> {
  // Check the full-volume cache (might have been loaded by a structure/chapter view)
  const volumeKey = `${apiBaseUrl}/${bookId}`
  const volumeData = await cacheGet(volumeKey)
  if (Array.isArray(volumeData)) {
    const found = volumeData.find(
      (h: Record<string, unknown>) => h && h.id === hadithId,
    )
    if (found) return found
  }

  // Check the individual-hadith cache entry
  const singleKey = `${apiBaseUrl}/${bookId}/${hadithId}`
  const singleData = await cacheGet(singleKey)
  if (singleData && typeof singleData === 'object' && !('error' in singleData)) {
    return singleData
  }

  return null
}
