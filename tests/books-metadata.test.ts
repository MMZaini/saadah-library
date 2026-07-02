import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { BOOK_ID_BY_NUMERIC_ID, books, getCoverForBookId } from '../lib/books'
import { getBookConfig, getBookIdFromUrlSlug } from '../lib/books-config'

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..')

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

  it('looks up round covers by dataset bookId', () => {
    expect(getCoverForBookId('Al-Kafi-Volume-1-Kulayni')).toBe('/covers/1-round.jpeg')
    expect(getCoverForBookId('Nahj-al-Balagha-Radi')).toBe('/covers/32-round.jpeg')
    expect(getCoverForBookId('Unknown-Book')).toBeUndefined()
  })
})
