import { describe, expect, it } from 'vitest'
import { normalizeCoverPage, normalizeExportLayout } from '../../lib/scan-layout.ts'
import { resolveExportCover } from '../../lib/scan-cover.ts'

describe('scan export layout selection', () => {
  it('only allows all-pages cover layout for multi-page exports', () => {
    expect(normalizeExportLayout('all-cover', 0)).toBe('page-cover')
    expect(normalizeExportLayout('all-cover', 1)).toBe('page-cover')
    expect(normalizeExportLayout('all-cover', 2)).toBe('all-cover')
  })

  it('keeps single-page-compatible layouts unchanged', () => {
    expect(normalizeExportLayout('each', 1)).toBe('each')
    expect(normalizeExportLayout('page-cover', 1)).toBe('page-cover')
  })

  it('clamps PDF cover pages to valid whole document pages', () => {
    expect(normalizeCoverPage(4, 10)).toBe(4)
    expect(normalizeCoverPage(4.9, 10)).toBe(4)
    expect(normalizeCoverPage(0, 10)).toBe(1)
    expect(normalizeCoverPage(99, 10)).toBe(10)
    expect(normalizeCoverPage(Number.NaN, 10)).toBe(1)
    expect(normalizeCoverPage(3, 0)).toBe(1)
  })

  it('uses library artwork by default and allows a PDF page override', () => {
    const base = {
      enabled: true,
      layout: 'page-cover',
      bookCoverSrc: '/read/covers/book.jpg',
      page: 7,
      numPages: 20,
    }
    expect(resolveExportCover({ ...base, source: 'book' })).toEqual({
      kind: 'image',
      src: '/read/covers/book.jpg',
    })
    expect(resolveExportCover({ ...base, source: 'page' })).toEqual({
      kind: 'page',
      pageNumber: 7,
    })
  })

  it('uses a validated PDF page when no book artwork is available', () => {
    expect(
      resolveExportCover({
        enabled: true,
        layout: 'all-cover',
        source: 'book',
        bookCoverSrc: null,
        page: 999,
        numPages: 12,
      }),
    ).toEqual({ kind: 'page', pageNumber: 12 })
  })

  it('omits covers when disabled or irrelevant to the layout', () => {
    const base = {
      layout: 'page-cover',
      source: 'page',
      bookCoverSrc: null,
      page: 2,
      numPages: 10,
    }
    expect(resolveExportCover({ ...base, enabled: false })).toBeNull()
    expect(resolveExportCover({ ...base, enabled: true, layout: 'each' })).toBeNull()
  })
})
