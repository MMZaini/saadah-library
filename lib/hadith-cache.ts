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

/** Store data in the cache (memory + IndexedDB). TTL of 0 means "don't cache". */
export async function cacheSet(key: string, data: unknown, ttl: number): Promise<void> {
  if (ttl <= 0) return

  const entry: CacheEntry = {
    key,
    data,
    timestamp: Date.now(),
    ttl,
  }

  // Always set in memory (sync)
  memSet(entry)

  // Persist to IndexedDB in the background (fire-and-forget for speed)
  if (isClient) {
    void idbSet(entry)
  }
}

// ─── Persistent-only helpers (skip the in-memory LRU) ─────────────────────
// Used by the content layer (lib/api.ts) to durably cache large volume
// payloads in IndexedDB without (a) evicting the small structure entries the
// in-memory LRU is sized for, or (b) holding several multi-MB blobs in JS
// memory beyond the caller's own session cache.

/** Read a value from IndexedDB only (no memory cache). Null if absent/expired. */
export async function idbGetData(key: string): Promise<unknown | null> {
  const entry = await idbGet(key)
  return entry ? entry.data : null
}

/** Persist a value to IndexedDB only (no memory cache). No-op if ttl <= 0. */
export async function idbSetData(key: string, data: unknown, ttl: number): Promise<void> {
  if (ttl <= 0) return
  await idbSet({ key, data, timestamp: Date.now(), ttl })
}
