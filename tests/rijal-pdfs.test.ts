import { afterEach, describe, expect, it } from 'vitest'
import {
  KHOEI_RIJAL_PDFS,
  getKhoeiRijalPageOffset,
  getKhoeiRijalPdf,
  getKhoeiRijalPdfPageRange,
  getKhoeiRijalPdfUrl,
  getKhoeiRijalScanUrl,
  getKhoeiRijalViewerUrl,
} from '@/lib/rijal-pdfs'

// The PDF page mapping was verified by reading the scans (running-header page
// numbers cross-checked against entry content). These cases lock that mapping so
// the offsets can never silently regress to the old `pdfPageCount - sourcePageCount`
// bug, which sent every narrator to the wrong physical page.
describe('khoei rijal source-page -> physical-pdf-page mapping', () => {
  it('maps the reported vol. 14 entry to the same physical page (offset 0)', () => {
    // khoei-v14-1 startPage 192; physical page 192 holds its text.
    const range = getKhoeiRijalPdfPageRange({ volumeNumber: 14, startPage: 192, endPage: 192 })
    expect(range?.pdfStartPage).toBe(192)
    expect(range?.pdfEndPage).toBe(192)
    expect(range?.sourceStartPage).toBe(192)
  })

  it('applies the +1 offset for vol. 1 (long muqaddima)', () => {
    // khoei-v1-1 ("آدم", entry #1) startPage 131 sits on physical page 132.
    const range = getKhoeiRijalPdfPageRange({ volumeNumber: 1, startPage: 131, endPage: 131 })
    expect(range?.pdfStartPage).toBe(132)
    expect(range?.pdfEndPage).toBe(132)
  })

  it('applies the +1 offset for vol. 8 (one extra leading page)', () => {
    // khoei-v8-4539 ("الربيع بن عطية") startPage 179 sits on physical page 180.
    const range = getKhoeiRijalPdfPageRange({ volumeNumber: 8, startPage: 179, endPage: 179 })
    expect(range?.pdfStartPage).toBe(180)
  })

  it('uses offset 0 for an ordinary volume', () => {
    const range = getKhoeiRijalPdfPageRange({ volumeNumber: 2, startPage: 9, endPage: 12 })
    expect(range?.pdfStartPage).toBe(9)
    expect(range?.pdfEndPage).toBe(12)
  })

  it('only vols 1 and 8 carry a non-zero offset, and it is small', () => {
    for (const pdf of KHOEI_RIJAL_PDFS) {
      const offset = getKhoeiRijalPageOffset(pdf.volumeNumber)
      const expected = pdf.volumeNumber === 1 || pdf.volumeNumber === 8 ? 1 : 0
      expect(offset).toBe(expected)
      // Guard against ever reintroducing the page-count-difference values (15-32).
      expect(offset).toBeLessThanOrEqual(1)
    }
  })

  it('clamps source pages into the volume and physical pages into the file', () => {
    const pdf = getKhoeiRijalPdf(14)!
    // Below 1 -> clamps to page 1.
    const low = getKhoeiRijalPdfPageRange({ volumeNumber: 14, startPage: 0, endPage: 0 })
    expect(low?.sourceStartPage).toBe(1)
    expect(low?.pdfStartPage).toBe(1)
    // Beyond the source count -> clamps to the last source page, and the physical
    // page never exceeds the file length.
    const high = getKhoeiRijalPdfPageRange({
      volumeNumber: 14,
      startPage: pdf.sourcePageCount + 50,
      endPage: pdf.sourcePageCount + 50,
    })
    expect(high?.sourceStartPage).toBe(pdf.sourcePageCount)
    expect(high?.pdfEndPage).toBeLessThanOrEqual(pdf.pdfPageCount)
  })

  it('keeps endPage at or after startPage even when given inverted input', () => {
    const range = getKhoeiRijalPdfPageRange({ volumeNumber: 5, startPage: 100, endPage: 40 })
    expect(range?.sourceEndPage).toBe(range?.sourceStartPage)
    expect(range?.pdfEndPage).toBe(range?.pdfStartPage)
  })

  it('returns null for an unknown volume', () => {
    expect(getKhoeiRijalPdfPageRange({ volumeNumber: 99, startPage: 1, endPage: 1 })).toBeNull()
    expect(getKhoeiRijalPdf(0)).toBeNull()
    expect(getKhoeiRijalPdfUrl(99)).toBeNull()
  })
})

describe('khoei rijal url helpers', () => {
  const originalBasePath = process.env.NEXT_PUBLIC_BASE_PATH
  afterEach(() => {
    if (originalBasePath === undefined) delete process.env.NEXT_PUBLIC_BASE_PATH
    else process.env.NEXT_PUBLIC_BASE_PATH = originalBasePath
  })

  it('builds a physical-page anchor on the native pdf url, clamped to the file', () => {
    process.env.NEXT_PUBLIC_BASE_PATH = '/read'
    expect(getKhoeiRijalPdfUrl(14, 192)).toBe('/read/pdfs/rijal/khoei/volume-14.pdf#page=192')
    const pdf = getKhoeiRijalPdf(14)!
    expect(getKhoeiRijalPdfUrl(14, pdf.pdfPageCount + 100)).toBe(
      `/read/pdfs/rijal/khoei/volume-14.pdf#page=${pdf.pdfPageCount}`,
    )
    // No page -> no anchor.
    expect(getKhoeiRijalPdfUrl(14)).toBe('/read/pdfs/rijal/khoei/volume-14.pdf')
  })

  it('builds a Scan Maker deep link with the physical page range (clean root url)', () => {
    expect(getKhoeiRijalScanUrl({ volumeNumber: 14, startPage: 192, endPage: 192 })).toBe(
      '/scans?source=rijal-khoei&volume=14&pages=192-192',
    )
    // Vol. 1 carries the +1 offset through to the deep link.
    expect(getKhoeiRijalScanUrl({ volumeNumber: 1, startPage: 131, endPage: 131 })).toBe(
      '/scans?source=rijal-khoei&volume=1&pages=132-132',
    )
  })

  it('builds the in-app viewer url (clean root url, no base path)', () => {
    expect(getKhoeiRijalViewerUrl('khoei-v14-1')).toBe('/narrators/khoei-v14-1/pdf')
  })
})
