import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cacheGet, cacheSet, idbGetData, idbSetData } from '../lib/hadith-cache'

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

  it('does not cache when the TTL is zero or negative', async () => {
    await cacheSet('test:key-3', 'explicit-zero', 0)
    expect(await cacheGet('test:key-3')).toBeNull()

    await cacheSet('test:key-4', 'negative', -5)
    expect(await cacheGet('test:key-4')).toBeNull()
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
