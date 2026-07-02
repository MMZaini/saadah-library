import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { BOOK_ID_BY_NUMERIC_ID, books, getCoverForBookId } from '../lib/books'
import { getBookConfig, getBookIdFromUrlSlug } from '../lib/books-config'

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..')

function readRuntimeBooks(): Array<{ bookId: string }> {
  const manifest = JSON.parse(
    readFileSync(join(repoRoot, 'public/data/thaqalayn/current/manifest.json'), 'utf8'),
  ) as { version: string }
  return JSON.parse(
    readFileSync(
      join(repoRoot, 'public/data/thaqalayn', manifest.version, 'runtime/books.json'),
      'utf8',
    ),
  ) as Array<{ bookId: string }>
}

describe('homepage book metadata', () => {
  it('gives every book a unique id and a title', () => {
    const ids = books.map((book) => book.id)
    expect(new Set(ids).size).toBe(ids.length)

    for (const book of books) {
      expect(book.title.length).toBeGreaterThan(0)
      expect(book.image).toMatch(/^\/covers\//)
    }
  })

  it('maps every homepage book to a dataset bookId', () => {
    for (const book of books) {
      const bookId = BOOK_ID_BY_NUMERIC_ID[book.id]
      expect(bookId, `book ${book.id} (${book.title}) has no dataset mapping`).toBeTruthy()
    }
  })

  it('maps every dataset bookId to a book the routing layer can resolve', () => {
    for (const bookId of Object.values(BOOK_ID_BY_NUMERIC_ID)) {
      const config = getBookConfig(bookId)
      // Ghayba books are registered via the URL map instead of a config entry.
      const viaSlug = getBookIdFromUrlSlug(bookId)
      expect(
        config !== null || viaSlug === bookId,
        `bookId ${bookId} is unknown to books-config`,
      ).toBe(true)
    }
  })

  it('ships every referenced cover image in public/covers', () => {
    for (const book of books) {
      const coverPath = join(repoRoot, 'public', book.image.replace(/^\//, ''))
      expect(existsSync(coverPath), `missing cover: ${book.image}`).toBe(true)
    }
  })

  // BookCard renders pre-generated WebP thumbnails; a missing variant shows a
  // broken image (srcset does not fall back). Regenerate with
  // scripts/generate-cover-thumbs.mjs after adding covers.
  it('ships WebP thumbnails for every cover', () => {
    for (const book of books) {
      const base = book.image.replace(/^\/covers\//, '').replace(/\.(jpe?g|png)$/i, '')
      for (const width of [160, 360]) {
        const thumb = join(repoRoot, 'public', 'covers', 'thumbs', `${base}-${width}w.webp`)
        expect(existsSync(thumb), `missing thumbnail: ${base}-${width}w.webp`).toBe(true)
      }
    }
  })

  it('looks up round covers by dataset bookId', () => {
    expect(getCoverForBookId('Al-Kafi-Volume-1-Kulayni')).toBe('/covers/1-round.jpeg')
    expect(getCoverForBookId('Nahj-al-Balagha-Radi')).toBe('/covers/32-round.jpeg')
    expect(getCoverForBookId('Unknown-Book')).toBeUndefined()
  })

  // Regression guard: every book in the active dataset must be reachable from
  // the homepage grid. Kamāl al-Dīn once shipped in the dataset but not in
  // lib/books.ts, leaving it unbrowsable with a raw-ID title.
  it('lists every dataset book on the homepage', () => {
    const homepageIds = new Set(Object.values(BOOK_ID_BY_NUMERIC_ID))

    for (const { bookId } of readRuntimeBooks()) {
      const config = getBookConfig(bookId)
      const reachable =
        homepageIds.has(bookId) ||
        (config !== null &&
          (homepageIds.has(config.bookId) ||
            (config.volumes ?? []).some((volumeId) => homepageIds.has(volumeId))))

      expect(reachable, `dataset book ${bookId} is not reachable from the homepage`).toBe(true)
    }
  })

  it('gives every single-volume config a human-readable English name', () => {
    for (const { bookId } of readRuntimeBooks()) {
      const config = getBookConfig(bookId)
      if (!config || config.hasMultipleVolumes) continue
      expect(
        config.englishName,
        `single-volume book ${bookId} leaks its raw ID as englishName`,
      ).not.toBe(bookId)
    }
  })
})
