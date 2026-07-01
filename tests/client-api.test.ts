// Unit tests for the client-side data layer (lib/api.ts) with a mocked fetch.
// The module keeps session caches at module scope, so every test re-imports a
// fresh copy via vi.resetModules().
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { BookInfo, Hadith } from '../lib/api'

type FetchMock = ReturnType<typeof vi.fn>

const MANIFEST_URL = '/data/thaqalayn/current/manifest.json'

function jsonResponse(data: unknown, ok = true, status = 200) {
  return {
    ok,
    status,
    statusText: ok ? 'OK' : 'Error',
    json: async () => data,
  }
}

function makeHadith(overrides: Partial<Hadith>): Hadith {
  return {
    _id: 'x',
    id: 1,
    bookId: 'Test-Book',
    book: 'Test Book',
    category: 'Category A',
    categoryId: '1',
    chapter: 'Chapter One',
    author: '',
    translator: '',
    englishText: 'When Allah created the intellect',
    arabicText: 'لما خلق الله العقل',
    majlisiGrading: '',
    URL: '',
    volume: 1,
    frenchText: '',
    mohseniGrading: '',
    behbudiGrading: '',
    chapterInCategoryId: 1,
    thaqalaynSanad: '',
    thaqalaynMatn: '',
    gradingsFull: [],
    __v: 0,
    ...overrides,
  }
}

function makeBook(bookId: string, idRangeMin: number, idRangeMax: number): BookInfo {
  return {
    bookId,
    BookName: bookId,
    author: '',
    idRangeMin,
    idRangeMax,
    bookDescription: '',
    bookCover: '',
    englishName: bookId,
    translator: '',
    volume: 1,
  }
}

/** Route fetch calls by URL substring. Unrouted URLs 404. */
function installFetch(routes: Record<string, unknown>): FetchMock {
  const mock = vi.fn(async (input: string | URL) => {
    const url = String(input)
    for (const [fragment, data] of Object.entries(routes)) {
      if (url.includes(fragment)) return jsonResponse(data)
    }
    return jsonResponse({ error: 'not found' }, false, 404)
  })
  vi.stubGlobal('fetch', mock)
  return mock
}

async function freshApi() {
  vi.resetModules()
  return import('../lib/api')
}

beforeEach(() => {
  delete process.env.NEXT_PUBLIC_BASE_PATH
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('dataset version resolution', () => {
  it('resolves runtime URLs through the current manifest version', async () => {
    const fetchMock = installFetch({
      [MANIFEST_URL]: { version: 'v-test' },
      '/data/thaqalayn/v-test/runtime/books.json': [makeBook('Book-A', 1, 10)],
    })

    const { thaqalaynApi } = await freshApi()
    const books = await thaqalaynApi.getAllBooks()

    expect(books).toHaveLength(1)
    const urls = fetchMock.mock.calls.map((call) => String(call[0]))
    expect(urls).toContain('/data/thaqalayn/v-test/runtime/books.json')
  })

  it('falls back to current/runtime when the manifest cannot be loaded', async () => {
    const fetchMock = installFetch({
      '/data/thaqalayn/current/runtime/books.json': [makeBook('Book-A', 1, 10)],
    })

    const { thaqalaynApi } = await freshApi()
    const books = await thaqalaynApi.getAllBooks()

    expect(books).toHaveLength(1)
    const urls = fetchMock.mock.calls.map((call) => String(call[0]))
    expect(urls).toContain('/data/thaqalayn/current/runtime/books.json')
  })

  it('prefixes runtime URLs with NEXT_PUBLIC_BASE_PATH', async () => {
    process.env.NEXT_PUBLIC_BASE_PATH = '/read'
    const fetchMock = installFetch({
      '/read/data/thaqalayn/current/manifest.json': { version: 'v-test' },
      '/read/data/thaqalayn/v-test/runtime/books.json': [],
    })

    const { thaqalaynApi } = await freshApi()
    await thaqalaynApi.getAllBooks()

    for (const call of fetchMock.mock.calls) {
      expect(String(call[0]).startsWith('/read/')).toBe(true)
    }
  })
})

describe('session caching', () => {
  it('fetches each artifact once per session', async () => {
    const fetchMock = installFetch({
      [MANIFEST_URL]: { version: 'v-test' },
      '/volumes/Book-A.json': [makeHadith({ bookId: 'Book-A' })],
    })

    const { thaqalaynApi } = await freshApi()
    await thaqalaynApi.getBookHadiths('Book-A')
    await thaqalaynApi.getBookHadiths('Book-A')
    await thaqalaynApi.getBookHadiths('Book-A')

    const volumeCalls = fetchMock.mock.calls.filter((call) =>
      String(call[0]).includes('/volumes/Book-A.json'),
    )
    expect(volumeCalls).toHaveLength(1)
  })

  it('does not poison the cache with a failed fetch — a retry can succeed', async () => {
    let failFirst = true
    const volume = [makeHadith({ bookId: 'Book-A' })]
    const mock = vi.fn(async (input: string | URL) => {
      const url = String(input)
      if (url.includes(MANIFEST_URL)) return jsonResponse({ version: 'v-test' })
      if (url.includes('/volumes/Book-A.json')) {
        if (failFirst) {
          failFirst = false
          return jsonResponse(null, false, 503)
        }
        return jsonResponse(volume)
      }
      return jsonResponse(null, false, 404)
    })
    vi.stubGlobal('fetch', mock)

    const { thaqalaynApi } = await freshApi()
    await expect(thaqalaynApi.getBookHadiths('Book-A')).rejects.toThrow('Local data error')
    // Give the module's cache-cleanup microtask a chance to run.
    await new Promise((resolve) => setTimeout(resolve, 0))
    await expect(thaqalaynApi.getBookHadiths('Book-A')).resolves.toEqual(volume)
  })
})

describe('hadith lookup', () => {
  it('finds a specific hadith by id and throws when missing', async () => {
    installFetch({
      [MANIFEST_URL]: { version: 'v-test' },
      '/volumes/Book-A.json': [makeHadith({ id: 7, bookId: 'Book-A' })],
    })

    const { thaqalaynApi } = await freshApi()
    const hadith = await thaqalaynApi.getSpecificHadith('Book-A', 7)
    expect(hadith.id).toBe(7)

    await expect(thaqalaynApi.getSpecificHadith('Book-A', 999)).rejects.toThrow(
      'No hadith 999 in Book-A',
    )
  })

  it('uses id ranges to fetch only the likely volume across a multi-volume book', async () => {
    const fetchMock = installFetch({
      [MANIFEST_URL]: { version: 'v-test' },
      '/books.json': [makeBook('Vol-1', 1, 100), makeBook('Vol-2', 101, 200)],
      '/volumes/Vol-1.json': [makeHadith({ id: 50, bookId: 'Vol-1' })],
      '/volumes/Vol-2.json': [makeHadith({ id: 150, bookId: 'Vol-2' })],
    })

    const { thaqalaynApi } = await freshApi()
    const hadith = await thaqalaynApi.findHadithAcrossBooks(['Vol-1', 'Vol-2'], 150)

    expect(hadith?.bookId).toBe('Vol-2')
    const volumeUrls = fetchMock.mock.calls
      .map((call) => String(call[0]))
      .filter((url) => url.includes('/volumes/'))
    expect(volumeUrls).toEqual(['/data/thaqalayn/v-test/runtime/volumes/Vol-2.json'])
  })

  it('falls back to out-of-range volumes so a hadith is never missed', async () => {
    installFetch({
      [MANIFEST_URL]: { version: 'v-test' },
      '/books.json': [makeBook('Vol-1', 1, 100), makeBook('Vol-2', 101, 200)],
      // The hadith actually lives in Vol-1 despite being outside its declared range.
      '/volumes/Vol-1.json': [makeHadith({ id: 350, bookId: 'Vol-1' })],
      '/volumes/Vol-2.json': [makeHadith({ id: 150, bookId: 'Vol-2' })],
    })

    const { thaqalaynApi } = await freshApi()
    const hadith = await thaqalaynApi.findHadithAcrossBooks(['Vol-1', 'Vol-2'], 350)
    expect(hadith?.bookId).toBe('Vol-1')
  })

  it('returns null when the hadith exists in no volume', async () => {
    installFetch({
      [MANIFEST_URL]: { version: 'v-test' },
      '/books.json': [makeBook('Vol-1', 1, 100)],
      '/volumes/Vol-1.json': [makeHadith({ id: 1, bookId: 'Vol-1' })],
    })

    const { thaqalaynApi } = await freshApi()
    expect(await thaqalaynApi.findHadithAcrossBooks(['Vol-1'], 42)).toBeNull()
  })
})

describe('client-side search', () => {
  it('filters a volume by exact phrase (English and Arabic)', async () => {
    installFetch({
      [MANIFEST_URL]: { version: 'v-test' },
      '/volumes/Book-A.json': [
        makeHadith({ id: 1, englishText: 'When Allah created the intellect' }),
        makeHadith({ id: 2, englishText: 'A narration about patience' }),
        makeHadith({ id: 3, englishText: '', arabicText: 'إن الصلاة عمود الدين' }),
      ],
    })

    const { thaqalaynApi } = await freshApi()

    const english = await thaqalaynApi.searchBook('Book-A', 'created the intellect')
    expect(english.results.map((hadith) => hadith.id)).toEqual([1])
    expect(english.total).toBe(1)

    const arabic = await thaqalaynApi.searchBook('Book-A', 'الصلاة')
    expect(arabic.results.map((hadith) => hadith.id)).toEqual([3])
  })

  it('returns everything for a blank query', async () => {
    installFetch({
      [MANIFEST_URL]: { version: 'v-test' },
      '/volumes/Book-A.json': [makeHadith({ id: 1 }), makeHadith({ id: 2 })],
    })

    const { thaqalaynApi } = await freshApi()
    const response = await thaqalaynApi.searchBook('Book-A', '   ')
    expect(response.total).toBe(2)
  })
})

describe('volume-scoped helpers', () => {
  it('rejects out-of-range Al-Kāfi and Uyun volume numbers', async () => {
    installFetch({ [MANIFEST_URL]: { version: 'v-test' } })
    const { alKafiApi, uyunApi } = await freshApi()

    expect(alKafiApi.getAlKafiVolumes()).toHaveLength(8)
    expect(uyunApi.getUyunVolumes()).toHaveLength(2)
    await expect(alKafiApi.getVolumeHadiths(0)).rejects.toThrow('between 1 and 8')
    await expect(alKafiApi.getVolumeHadiths(9)).rejects.toThrow('between 1 and 8')
    await expect(uyunApi.getVolumeHadiths(3)).rejects.toThrow('between 1 and 2')
  })
})

describe('chapter structure building', () => {
  it('groups hadiths by category and chapter, sorting chapters by id', async () => {
    installFetch({
      [MANIFEST_URL]: { version: 'v-test' },
      '/volumes/Book-A.json': [
        makeHadith({ id: 1, category: 'Faith', categoryId: '1', chapter: 'B', chapterInCategoryId: 2 }),
        makeHadith({ id: 2, category: 'Faith', categoryId: '1', chapter: 'A', chapterInCategoryId: 1 }),
        makeHadith({ id: 3, category: 'Faith', categoryId: '1', chapter: 'A', chapterInCategoryId: 1 }),
        makeHadith({ id: 4, category: 'Deeds', categoryId: '2', chapter: 'C', chapterInCategoryId: 1 }),
      ],
    })

    const { bookApi } = await freshApi()
    const structure = await bookApi.getBookChapterStructure('Book-A')

    expect(Object.keys(structure).sort()).toEqual(['Deeds', 'Faith'])
    expect(Object.keys(structure['Faith'].chapters)).toEqual(['A', 'B'])
    expect(structure['Faith'].chapters['A'].hadiths).toHaveLength(2)
    expect(structure['Deeds'].categoryId).toBe('2')
  })

  it('buckets hadiths with missing category/chapter under fallback keys', async () => {
    installFetch({
      [MANIFEST_URL]: { version: 'v-test' },
      '/volumes/Book-A.json': [makeHadith({ id: 1, category: '', chapter: '' })],
    })

    const { bookApi } = await freshApi()
    const structure = await bookApi.getBookChapterStructure('Book-A')

    expect(structure['Uncategorized']).toBeDefined()
    expect(structure['Uncategorized'].chapters['No Chapter'].hadiths).toHaveLength(1)
  })

  it('filters chapter hadiths by category and chapter id', async () => {
    installFetch({
      [MANIFEST_URL]: { version: 'v-test' },
      '/volumes/Book-A.json': [
        makeHadith({ id: 1, categoryId: '1', chapterInCategoryId: 1 }),
        makeHadith({ id: 2, categoryId: '1', chapterInCategoryId: 2 }),
        makeHadith({ id: 3, categoryId: '2', chapterInCategoryId: 1 }),
      ],
    })

    const { bookApi } = await freshApi()
    const hadiths = await bookApi.getChapterHadiths('Book-A', '1', 2)
    expect(hadiths.map((hadith) => hadith.id)).toEqual([2])
  })
})
