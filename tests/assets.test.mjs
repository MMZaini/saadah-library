import { existsSync } from 'node:fs'
import { open } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'
import { getAllKnownPdfPaths, getPdfPathForVolume } from '../lib/book-pdfs.ts'
import {
  getAllKhoeiRijalPdfPaths,
  getKhoeiRijalPdfPageRange,
  getKhoeiRijalPdfUrl,
  getKhoeiRijalScanUrl,
} from '../lib/rijal-pdfs.ts'
import { stripBasePath, withBasePath } from '../lib/assets.ts'

const originalBasePath = process.env.NEXT_PUBLIC_BASE_PATH
const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..')

afterEach(() => {
  if (originalBasePath === undefined) {
    delete process.env.NEXT_PUBLIC_BASE_PATH
  } else {
    process.env.NEXT_PUBLIC_BASE_PATH = originalBasePath
  }
})

describe('withBasePath', () => {
  it('prefixes local public asset paths when a base path is configured', () => {
    process.env.NEXT_PUBLIC_BASE_PATH = '/read'

    expect(withBasePath('/covers/1-round.jpeg')).toBe('/read/covers/1-round.jpeg')
  })

  it('does not double-prefix paths', () => {
    process.env.NEXT_PUBLIC_BASE_PATH = '/read'

    expect(withBasePath('/read/covers/1-round.jpeg')).toBe('/read/covers/1-round.jpeg')
  })

  it('leaves non-local paths unchanged', () => {
    process.env.NEXT_PUBLIC_BASE_PATH = '/read'

    expect(withBasePath('https://example.com/cover.jpeg')).toBe('https://example.com/cover.jpeg')
    expect(withBasePath('//example.com/cover.jpeg')).toBe('//example.com/cover.jpeg')
  })
})

describe('stripBasePath', () => {
  it('removes the configured base path prefix', () => {
    process.env.NEXT_PUBLIC_BASE_PATH = '/read'

    expect(stripBasePath('/read/al-kafi/volume/1')).toBe('/al-kafi/volume/1')
    expect(stripBasePath('/read')).toBe('/')
  })

  it('leaves unprefixed paths and lookalikes untouched', () => {
    process.env.NEXT_PUBLIC_BASE_PATH = '/read'

    expect(stripBasePath('/al-kafi')).toBe('/al-kafi')
    expect(stripBasePath('/reads/scans')).toBe('/reads/scans')
  })

  it('is a no-op when no base path is configured', () => {
    delete process.env.NEXT_PUBLIC_BASE_PATH

    expect(stripBasePath('/read/al-kafi')).toBe('/read/al-kafi')
  })
})

describe('book PDF assets', () => {
  it('resolves runtime volume IDs and numeric book volume selections', () => {
    expect(getPdfPathForVolume('Al-Kafi', 3)).toBe('/pdfs/books/al-kafi/volume-3.pdf')
    expect(getPdfPathForVolume('Uyun-akhbar-al-Rida', 'Uyun-akhbar-al-Rida-Volume-2-Saduq')).toBe(
      '/pdfs/books/uyun-akhbar-al-rida/volume-2.pdf',
    )
    expect(getPdfPathForVolume('Thawab-al-Amal-wa-iqab-al-Amal-Saduq', null)).toBe(
      '/pdfs/books/thawab-al-amal-wa-iqab-al-amal/volume-1.pdf',
    )
    expect(getPdfPathForVolume('Man-La-Yahduruh-al-Faqih', 5)).toBeNull()
  })

  it('points every registered PDF path at a copied public asset', () => {
    expect(getAllKnownPdfPaths()).toHaveLength(43)

    const missing = getAllKnownPdfPaths().filter(
      (pdfPath) => !existsSync(join(repoRoot, 'public', pdfPath.replace(/^\//, ''))),
    )

    expect(missing).toEqual([])
  })
})

describe('PDF file integrity', () => {
  // Reads only the first and last bytes of each file, so checking all ~1 GB of
  // registered PDFs stays fast. Catches Git-LFS pointer files (text stand-ins
  // that exist on disk but are not PDFs) and truncated uploads — both of which
  // pass existence checks and break the reader/scan viewer silently.
  async function pdfCorruption(absolutePath) {
    const handle = await open(absolutePath, 'r')
    try {
      const { size } = await handle.stat()
      const head = Buffer.alloc(5)
      await handle.read(head, 0, 5, 0)
      if (head.toString('ascii') !== '%PDF-') return 'missing %PDF- header'

      const tailLength = Math.min(1024, size)
      const tail = Buffer.alloc(tailLength)
      await handle.read(tail, 0, tailLength, size - tailLength)
      if (!tail.toString('latin1').includes('%%EOF')) return 'missing %%EOF trailer'

      return null
    } finally {
      await handle.close()
    }
  }

  it('every registered PDF is a real, non-truncated PDF file', async () => {
    const allPaths = [...getAllKnownPdfPaths(), ...getAllKhoeiRijalPdfPaths()]
    const corrupt = []

    for (const pdfPath of allPaths) {
      const absolute = join(repoRoot, 'public', pdfPath.replace(/^\//, ''))
      const problem = await pdfCorruption(absolute).catch((err) => String(err))
      if (problem) corrupt.push({ pdfPath, problem })
    }

    expect(corrupt).toEqual([])
  }, 60_000)
})

describe('Khoei rijal PDF assets', () => {
  it('points every registered narrator PDF path at a copied public asset', () => {
    expect(getAllKhoeiRijalPdfPaths()).toHaveLength(24)

    const missing = getAllKhoeiRijalPdfPaths().filter(
      (pdfPath) => !existsSync(join(repoRoot, 'public', pdfPath.replace(/^\//, ''))),
    )

    expect(missing).toEqual([])
  })

  it('maps source page ranges to physical PDF pages with volume offsets', () => {
    // Vol. 8 carries a verified +1 offset (one extra leading page in the scan).
    expect(
      getKhoeiRijalPdfPageRange({ volumeNumber: 8, startPage: 179, endPage: 179 }),
    ).toMatchObject({
      volumeNumber: 8,
      sourceStartPage: 179,
      sourceEndPage: 179,
      pdfStartPage: 180,
      pdfEndPage: 180,
    })

    // Vol. 24 has no offset; the end page clamps to the volume length.
    expect(
      getKhoeiRijalPdfPageRange({ volumeNumber: 24, startPage: 350, endPage: 999 }),
    ).toMatchObject({
      sourceStartPage: 350,
      sourceEndPage: 352,
      pdfStartPage: 350,
      pdfEndPage: 352,
    })
  })

  it('builds base-path-safe PDF and scan-maker URLs', () => {
    process.env.NEXT_PUBLIC_BASE_PATH = '/read'

    expect(getKhoeiRijalPdfUrl(1, 24)).toBe('/read/pdfs/rijal/khoei/volume-01.pdf#page=24')
    expect(getKhoeiRijalScanUrl({ volumeNumber: 1, startPage: 131, endPage: 131 })).toBe(
      '/scans?source=rijal-khoei&volume=1&pages=132-132',
    )
  })
})
