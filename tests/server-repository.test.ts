// Integration-style unit tests for the server-side data layer, run against the
// real versioned dataset under public/data/thaqalayn. Scoped to small books so
// the suite stays fast (the full dataset is ~176 MB; Al-Kāfi volumes are avoided).
import { describe, expect, it } from 'vitest'
import {
  filterLocalHadiths,
  findLocalHadithAcrossBooks,
  getAllLocalStructures,
  getAvailableBookIds,
  getLocalBooks,
  getLocalHadith,
  getLocalManifest,
  getLocalRandomHadith,
  getLocalStructure,
  searchLocalHadiths,
} from '../lib/data/server-repository'

const SMALL_BOOK = 'Risalat-al-Huquq-Abidin'
const GRADED_BOOK = 'Al-Amali-Mufid'

describe('dataset manifest and books', () => {
  it('resolves the active dataset version from the current manifest', async () => {
    const manifest = await getLocalManifest()
    expect(manifest.version).toBeTruthy()
    expect(manifest.counts.books).toBeGreaterThan(0)
    expect(manifest.counts.hadiths).toBeGreaterThan(0)
  })

  it('lists every runtime volume with a usable id range', async () => {
    const books = await getLocalBooks()
    expect(books.length).toBeGreaterThanOrEqual(30)

    for (const book of books) {
      expect(book.bookId).toBeTruthy()
      expect(book.idRangeMin).toBeGreaterThanOrEqual(1)
      expect(book.idRangeMax).toBeGreaterThanOrEqual(book.idRangeMin)
    }

    const ids = await getAvailableBookIds()
    expect(ids).toContain(SMALL_BOOK)
    expect(ids).toContain('Al-Kafi-Volume-1-Kulayni')
  })
})

describe('hadith retrieval', () => {
  it('fetches a hadith by id with full content fields', async () => {
    const hadith = await getLocalHadith(SMALL_BOOK, 1)
    expect(hadith.id).toBe(1)
    expect(hadith.bookId).toBe(SMALL_BOOK)
    expect((hadith.englishText || '').length).toBeGreaterThan(0)
  })

  it('throws for a hadith id that does not exist', async () => {
    await expect(getLocalHadith(SMALL_BOOK, 999999)).rejects.toThrow('No hadith 999999')
  })

  it('finds a hadith across candidate volumes and returns null when absent', async () => {
    const found = await findLocalHadithAcrossBooks(['Not-A-Book', SMALL_BOOK], 1)
    expect(found?.bookId).toBe(SMALL_BOOK)

    expect(await findLocalHadithAcrossBooks(['Not-A-Book'], 1)).toBeNull()
  })

  it('serves a random hadith scoped to a book', async () => {
    const hadith = await getLocalRandomHadith(SMALL_BOOK)
    expect(hadith.bookId).toBe(SMALL_BOOK)
    expect(hadith.id).toBeGreaterThanOrEqual(1)
  })
})

describe('book structures', () => {
  it('loads a single-book structure with consistent hadith counts', async () => {
    const structure = await getLocalStructure([SMALL_BOOK])
    const categories = Object.values(structure)
    expect(categories.length).toBeGreaterThan(0)

    for (const category of categories) {
      const chapterTotal = Object.values(category.chapters).reduce(
        (sum, chapter) => sum + chapter.hadithCount,
        0,
      )
      expect(category.totalHadiths).toBe(chapterTotal)
    }
  })

  it('exposes an all-books structure index covering every runtime volume', async () => {
    const [all, ids] = await Promise.all([getAllLocalStructures(), getAvailableBookIds()])

    for (const bookId of ids) {
      expect(all[bookId], `missing structure for ${bookId}`).toBeDefined()
      expect(all[bookId].volumeIds.length).toBeGreaterThan(0)
    }
  })

  it('merges structures when multiple volumes are requested', async () => {
    const merged = await getLocalStructure([SMALL_BOOK, GRADED_BOOK])
    const single = await getLocalStructure([SMALL_BOOK])
    expect(Object.keys(merged).length).toBeGreaterThanOrEqual(Object.keys(single).length)
  })
})

describe('searchLocalHadiths', () => {
  it('returns nothing for a blank query', async () => {
    const response = await searchLocalHadiths('   ', [SMALL_BOOK])
    expect(response).toEqual({ results: [], total: 0, truncated: false })
  })

  it('finds English matches scoped to the given books', async () => {
    const response = await searchLocalHadiths('rights', [SMALL_BOOK], ['exactPhrase'])
    expect(response.total).toBeGreaterThan(0)
    expect(response.total).toBe(response.results.length)
    for (const hadith of response.results) {
      expect(hadith.bookId).toBe(SMALL_BOOK)
    }
  })

  it('finds Arabic matches diacritic-insensitively', async () => {
    const response = await searchLocalHadiths('الله', [SMALL_BOOK], ['exactWords'])
    expect(response.total).toBeGreaterThan(0)
  })

  it('ignores unknown book ids instead of failing the whole search', async () => {
    const response = await searchLocalHadiths('rights', ['Not-A-Book', SMALL_BOOK])
    expect(response.total).toBeGreaterThan(0)
  })

  it('hydrates full hadith objects for search hits', async () => {
    const response = await searchLocalHadiths('rights', [SMALL_BOOK])
    const first = response.results[0]
    expect(first.englishText.length).toBeGreaterThan(0)
    expect(first.chapter).toBeTruthy()
  })
})

describe('filterLocalHadiths (grading filter)', () => {
  it('returns nothing when neither scope nor gradings are given', async () => {
    expect(await filterLocalHadiths(undefined, [])).toEqual({
      results: [],
      total: 0,
      truncated: false,
    })
    expect(await filterLocalHadiths([], ['all'])).toEqual({
      results: [],
      total: 0,
      truncated: false,
    })
  })

  it('returns the whole scoped book when no grading filter is active', async () => {
    const response = await filterLocalHadiths([SMALL_BOOK])
    expect(response.total).toBeGreaterThan(0)
    expect(response.results.every((hadith) => hadith.bookId === SMALL_BOOK)).toBe(true)
  })

  it('filters a graded book down to matching gradings only', async () => {
    const all = await filterLocalHadiths([GRADED_BOOK])
    const sahih = await filterLocalHadiths([GRADED_BOOK], ['sahih'])

    expect(sahih.total).toBeGreaterThan(0)
    expect(sahih.total).toBeLessThan(all.total)
  })

  it('treats ungraded hadith as lam-yukhrijhu', async () => {
    const all = await filterLocalHadiths([GRADED_BOOK])
    const ungraded = await filterLocalHadiths([GRADED_BOOK], ['lam-yukhrijhu'])

    expect(ungraded.total).toBeGreaterThan(0)
    expect(ungraded.total).toBeLessThan(all.total)
    for (const hadith of ungraded.results.slice(0, 25)) {
      const hasGrading =
        Boolean(hadith.majlisiGrading || hadith.mohseniGrading || hadith.behbudiGrading) ||
        (hadith.gradingsFull || []).length > 0
      const text = [
        hadith.majlisiGrading,
        hadith.mohseniGrading,
        hadith.behbudiGrading,
        ...(hadith.gradingsFull || []).map((grading) => `${grading.grade_en} ${grading.grade_ar}`),
      ].join(' ')
      expect(!hasGrading || text.includes('لم يخرجه')).toBe(true)
    }
  })

  it('sorts filtered results by volume then id', async () => {
    const response = await filterLocalHadiths([SMALL_BOOK])
    const ids = response.results.map((hadith) => hadith.id)
    expect(ids).toEqual([...ids].sort((a, b) => a - b))
  })
})
