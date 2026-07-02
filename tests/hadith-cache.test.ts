import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  CACHE_TTL,
  cacheGet,
  cacheSet,
  getTtlForUrl,
  idbGetData,
  idbSetData,
} from '../lib/hadith-cache'

describe('getTtlForUrl', () => {
  it('never caches random endpoints', () => {
    expect(getTtlForUrl('https://api.example.com/api/v2/random')).toBe(0)
    expect(getTtlForUrl('/api/v2/Al-Kafi-Volume-1-Kulayni/random')).toBe(0)
  })

  it('uses long TTLs for stable book metadata and volumes', () => {
    expect(getTtlForUrl('/api/v2/allbooks')).toBe(CACHE_TTL.allBooks)
    expect(getTtlForUrl('/api/v2/Al-Kafi-Volume-1-Kulayni')).toBe(CACHE_TTL.bookHadiths)
    expect(getTtlForUrl('/api/v2/Al-Kafi-Volume-1-Kulayni/42')).toBe(CACHE_TTL.singleHadith)
  })

  it('uses a short TTL for search queries and a default otherwise', () => {
    expect(getTtlForUrl('/api/v2/query?q=prayer')).toBe(CACHE_TTL.search)
    expect(getTtlForUrl('/some/unrelated/url')).toBe(CACHE_TTL.default)
  })
})

describe('memory cache behaviour (server-side)', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('stores and returns values within their TTL', async () => {
    await cacheSet('test:key-1', { hello: 'world' }, 1000)
    expect(await cacheGet('test:key-1')).toEqual({ hello: 'world' })
  })

  it('expires entries after their TTL', async () => {
    await cacheSet('test:key-2', 'value', 1000)
    vi.advanceTimersByTime(1500)
    expect(await cacheGet('test:key-2')).toBeNull()
  })

  it('does not cache when the resolved TTL is zero', async () => {
    await cacheSet('/api/v2/random', 'never-cached')
    expect(await cacheGet('/api/v2/random')).toBeNull()

    await cacheSet('test:key-3', 'explicit-zero', 0)
    expect(await cacheGet('test:key-3')).toBeNull()
  })

  it('returns null for unknown keys', async () => {
    expect(await cacheGet('test:never-set')).toBeNull()
  })
})

describe('IndexedDB helpers outside the browser', () => {
  it('degrade gracefully when IndexedDB is unavailable', async () => {
    // In the Node test environment there is no window/IndexedDB; the durable
    // layer must be a silent no-op rather than throwing.
    await expect(idbSetData('test:idb', { a: 1 }, 1000)).resolves.toBeUndefined()
    expect(await idbGetData('test:idb')).toBeNull()
  })
})
