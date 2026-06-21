import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'
import { getAllKnownPdfPaths, getPdfPathForVolume } from '../lib/book-pdfs.ts'
import { withBasePath } from '../lib/assets.ts'

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
