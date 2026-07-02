// Unit tests for the App Router API routes, exercised directly as functions
// against the real local dataset (no server needed).
import { NextRequest } from 'next/server'
import { describe, expect, it } from 'vitest'
import { GET as searchGet } from '../app/api/search/route'
import { GET as bookStructureGet } from '../app/api/book-structure/[bookId]/route'
import { GET as allStructuresGet } from '../app/api/all-book-structures/route'

const SMALL_BOOK = 'Risalat-al-Huquq-Abidin'
const GRADED_BOOK = 'Al-Amali-Mufid'

function searchRequest(params: Record<string, string>) {
  const query = new URLSearchParams(params).toString()
  return new NextRequest(`http://localhost/api/search${query ? `?${query}` : ''}`)
}

describe('GET /api/search', () => {
  it('returns an empty result set when no query is given', async () => {
    const response = await searchGet(searchRequest({}))
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ results: [], total: 0, truncated: false })
  })

  it('searches scoped to the requested books', async () => {
    const response = await searchGet(searchRequest({ q: 'rights', book: SMALL_BOOK }))
    expect(response.status).toBe(200)

    const body = await response.json()
    expect(body.total).toBeGreaterThan(0)
    expect(body.results.every((hadith: { bookId: string }) => hadith.bookId === SMALL_BOOK)).toBe(
      true,
    )
  })

  it('supports Arabic queries', async () => {
    const response = await searchGet(searchRequest({ q: 'الله', book: SMALL_BOOK }))
    const body = await response.json()
    expect(body.total).toBeGreaterThan(0)
  })

  it('honours the mode parameter (exact words vs exact phrase)', async () => {
    const phrase = await searchGet(
      searchRequest({ q: 'rights God', book: SMALL_BOOK, mode: 'exactPhrase' }),
    )
    const words = await searchGet(
      searchRequest({ q: 'rights God', book: SMALL_BOOK, mode: 'exactWords' }),
    )

    const phraseBody = await phrase.json()
    const wordsBody = await words.json()
    // Words-in-any-order can only widen the result set relative to the phrase.
    expect(wordsBody.total).toBeGreaterThanOrEqual(phraseBody.total)
    expect(wordsBody.total).toBeGreaterThan(0)
  })

  it('ignores invalid modes by falling back to exact phrase', async () => {
    const invalid = await searchGet(
      searchRequest({ q: 'rights', book: SMALL_BOOK, mode: 'bogus-mode' }),
    )
    const explicit = await searchGet(
      searchRequest({ q: 'rights', book: SMALL_BOOK, mode: 'exactPhrase' }),
    )
    expect((await invalid.json()).total).toBe((await explicit.json()).total)
  })

  it('runs grading-only filtering when filterOnly=1', async () => {
    const response = await searchGet(
      searchRequest({ filterOnly: '1', book: GRADED_BOOK, grading: 'sahih' }),
    )
    const body = await response.json()
    expect(body.total).toBeGreaterThan(0)

    const everything = await searchGet(searchRequest({ filterOnly: '1', book: GRADED_BOOK }))
    expect((await everything.json()).total).toBeGreaterThan(body.total)
  })
})

describe('GET /api/book-structure/[bookId]', () => {
  it('returns the structure and hadith total for a single book', async () => {
    const request = new NextRequest(`http://localhost/api/book-structure/${SMALL_BOOK}`)
    const response = await bookStructureGet(request, {
      params: Promise.resolve({ bookId: SMALL_BOOK }),
    })

    expect(response.status).toBe(200)
    expect(response.headers.get('cache-control')).toMatch(/s-maxage=\d+/)

    const body = await response.json()
    expect(body.bookIds).toEqual([SMALL_BOOK])
    expect(body.totalHadiths).toBeGreaterThan(0)
    expect(Object.keys(body.structure).length).toBeGreaterThan(0)
  })

  it('aggregates multiple volumes via the volumes parameter', async () => {
    const request = new NextRequest(
      `http://localhost/api/book-structure/${SMALL_BOOK}?volumes=${SMALL_BOOK},${GRADED_BOOK}`,
    )
    const response = await bookStructureGet(request, {
      params: Promise.resolve({ bookId: SMALL_BOOK }),
    })

    const body = await response.json()
    expect(body.bookIds).toEqual([SMALL_BOOK, GRADED_BOOK])
    expect(Object.keys(body.structure).length).toBeGreaterThan(0)
  })

  it('fails with 500 for an unknown book instead of crashing', async () => {
    const request = new NextRequest('http://localhost/api/book-structure/Not-A-Book')
    const response = await bookStructureGet(request, {
      params: Promise.resolve({ bookId: 'Not-A-Book' }),
    })
    expect(response.status).toBe(500)
    expect((await response.json()).error).toBeTruthy()
  })
})

describe('GET /api/all-book-structures', () => {
  it('returns a structure entry for every known volume with cache headers', async () => {
    const response = await allStructuresGet()
    expect(response.status).toBe(200)
    expect(response.headers.get('cache-control')).toMatch(/s-maxage=\d+/)

    const body = await response.json()
    expect(body.structures[SMALL_BOOK]).toBeDefined()
    expect(body.structures['Al-Kafi-Volume-1-Kulayni']).toBeDefined()
    expect(body.structures[SMALL_BOOK].totalHadiths).toBeGreaterThan(0)
  })
})
