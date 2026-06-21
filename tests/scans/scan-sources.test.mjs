import { describe, expect, it } from 'vitest'
import { SCAN_BOOKS, COVER_OPTIONS, getScanBookByPath } from '../../lib/scan-sources.ts'
import { getAllKnownPdfPaths } from '../../lib/book-pdfs.ts'

const knownPaths = new Set(getAllKnownPdfPaths())

describe('scan sources', () => {
  it('exposes every homepage book with at least one volume', () => {
    expect(SCAN_BOOKS.length).toBeGreaterThan(0)
    for (const book of SCAN_BOOKS) {
      expect(book.volumes.length).toBeGreaterThan(0)
      expect(book.title).toBeTruthy()
      expect(book.cover.startsWith('/covers/')).toBe(true)
    }
  })

  it('only references PDF paths that exist in the app config', () => {
    for (const book of SCAN_BOOKS) {
      for (const volume of book.volumes) {
        expect(volume.path.startsWith('/pdfs/books/')).toBe(true)
        expect(knownPaths.has(volume.path)).toBe(true)
        expect(volume.label).toBeTruthy()
      }
    }
  })

  it('does not duplicate a PDF path within a book', () => {
    for (const book of SCAN_BOOKS) {
      const paths = book.volumes.map((v) => v.path)
      expect(new Set(paths).size).toBe(paths.length)
    }
  })

  it('derives expected volume counts from the existing config', () => {
    const byId = Object.fromEntries(SCAN_BOOKS.map((b) => [b.bookId, b]))
    expect(byId['Al-Kafi-Volume-1-Kulayni'].volumes.length).toBe(8)
    expect(byId['Al-Khisal-Saduq'].volumes.length).toBe(3)
    expect(byId['Uyun-akhbar-al-Rida-Volume-1-Saduq'].volumes.length).toBe(3)
    // Volume 5 of Man lā yaḥḍuruh has no scanned PDF, so only 4 surface.
    expect(byId['Man-La-Yahduruh-al-Faqih'].volumes.length).toBe(4)
  })

  it('maps a known path back to its book', () => {
    const book = getScanBookByPath('/pdfs/books/al-kafi/volume-3.pdf')
    expect(book?.bookId).toBe('Al-Kafi-Volume-1-Kulayni')
  })

  it('offers one cover option per book', () => {
    expect(COVER_OPTIONS.length).toBe(SCAN_BOOKS.length)
    for (const option of COVER_OPTIONS) {
      expect(option.cover.startsWith('/covers/')).toBe(true)
    }
  })
})
