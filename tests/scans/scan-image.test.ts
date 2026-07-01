import { afterEach, describe, expect, it } from 'vitest'
import {
  SCAN_IMAGE_WIDTHS,
  buildScanPageImageUrl,
  isAllowedScanPdfPath,
  snapScanImageWidth,
} from '../../lib/scan-image'
import { normalizeExportLayout } from '../../lib/scan-layout'

const originalBasePath = process.env.NEXT_PUBLIC_BASE_PATH

afterEach(() => {
  if (originalBasePath === undefined) {
    delete process.env.NEXT_PUBLIC_BASE_PATH
  } else {
    process.env.NEXT_PUBLIC_BASE_PATH = originalBasePath
  }
})

describe('snapScanImageWidth', () => {
  it('snaps up to the nearest supported width', () => {
    expect(snapScanImageWidth(1)).toBe(SCAN_IMAGE_WIDTHS[0])
    expect(snapScanImageWidth(280)).toBe(280)
    expect(snapScanImageWidth(281)).toBe(560)
    expect(snapScanImageWidth(899)).toBe(900)
  })

  it('caps at the largest supported width', () => {
    expect(snapScanImageWidth(99999)).toBe(SCAN_IMAGE_WIDTHS[SCAN_IMAGE_WIDTHS.length - 1])
  })
})

describe('isAllowedScanPdfPath', () => {
  it('accepts only registered PDF paths', () => {
    expect(isAllowedScanPdfPath('/pdfs/rijal/khoei/volume-01.pdf')).toBe(true)
    expect(isAllowedScanPdfPath('/pdfs/books/al-kafi/volume-1.pdf')).toBe(true)
  })

  it('rejects unknown paths and non-strings', () => {
    expect(isAllowedScanPdfPath('/etc/passwd')).toBe(false)
    expect(isAllowedScanPdfPath('https://evil.example.com/x.pdf')).toBe(false)
    expect(isAllowedScanPdfPath(null)).toBe(false)
    expect(isAllowedScanPdfPath(undefined)).toBe(false)
  })
})

describe('buildScanPageImageUrl', () => {
  it('builds a base-path-safe, width-snapped, versioned URL', () => {
    process.env.NEXT_PUBLIC_BASE_PATH = '/read'
    const url = buildScanPageImageUrl('/pdfs/rijal/khoei/volume-01.pdf', 3, 300)

    expect(url.startsWith('/read/api/scan-page?')).toBe(true)
    const params = new URLSearchParams(url.split('?')[1])
    expect(params.get('pdf')).toBe('/pdfs/rijal/khoei/volume-01.pdf')
    expect(params.get('page')).toBe('3')
    expect(params.get('w')).toBe('560')
    expect(params.get('v')).toBeTruthy()
  })

  it('clamps page numbers to at least 1', () => {
    const url = buildScanPageImageUrl('/pdfs/rijal/khoei/volume-01.pdf', -5, 280)
    expect(new URLSearchParams(url.split('?')[1]).get('page')).toBe('1')
  })
})

describe('normalizeExportLayout', () => {
  it('downgrades all-cover to page-cover for single-page selections', () => {
    expect(normalizeExportLayout('all-cover', 1)).toBe('page-cover')
    expect(normalizeExportLayout('all-cover', 0)).toBe('page-cover')
    expect(normalizeExportLayout('all-cover', 2)).toBe('all-cover')
    expect(normalizeExportLayout('each', 1)).toBe('each')
    expect(normalizeExportLayout('page-cover', 1)).toBe('page-cover')
  })
})
