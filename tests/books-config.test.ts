import { describe, expect, it } from 'vitest'
import {
  AL_KAFI_VOLUMES,
  BOOK_ID_TO_URL_MAP,
  MULTI_VOLUME_BOOKS,
  SEARCHABLE_BOOKS,
  SINGLE_VOLUME_BOOKS,
  URL_TO_BOOK_ID_MAP,
  UYUN_VOLUMES,
  VOLUMES_WITH_GRADINGS,
  getBookConfig,
  getBookIdFromUrlSlug,
  getBookUrlSlug,
  isMultiVolumeBook,
  searchContextHasGradings,
  volumesHaveGradings,
} from '../lib/books-config'

describe('URL slug ↔ bookId mapping', () => {
  it('maps single-volume book ids to clean lowercase slugs', () => {
    expect(getBookUrlSlug('Al-Tawhid-Saduq')).toBe('al-tawhid')
    expect(getBookUrlSlug('Nahj-al-Balagha-Radi')).toBe('nahj-al-balagha')
    expect(getBookUrlSlug('Mujam-al-Ahadith-al-Mutabara-Muhsini')).toBe(
      'mujam-al-ahadith-al-mutabara',
    )
  })

  it('falls back to the lowercased bookId when no mapping exists', () => {
    expect(getBookUrlSlug('Al-Kafi')).toBe('al-kafi')
    expect(getBookUrlSlug('Unknown-Book')).toBe('unknown-book')
  })

  it('resolves slugs case-insensitively', () => {
    expect(getBookIdFromUrlSlug('Al-Tawhid')).toBe('Al-Tawhid-Saduq')
    expect(getBookIdFromUrlSlug('al-tawhid')).toBe('Al-Tawhid-Saduq')
    expect(getBookIdFromUrlSlug('AL-KHISAL')).toBe('Al-Khisal-Saduq')
  })

  it('returns unknown slugs unchanged (including empty)', () => {
    expect(getBookIdFromUrlSlug('not-a-book')).toBe('not-a-book')
    expect(getBookIdFromUrlSlug('')).toBe('')
  })

  it('maps multi-volume slugs to their primary volume', () => {
    expect(getBookIdFromUrlSlug('uyun-akhbar-al-rida')).toBe('Uyun-akhbar-al-Rida-Volume-1-Saduq')
    expect(getBookIdFromUrlSlug('man-la-yahduruh-al-faqih')).toBe(
      'Man-La-Yahduruh-al-Faqih-Volume-1-Saduq',
    )
  })

  it('round-trips every mapped bookId through slug generation and resolution', () => {
    for (const bookId of Object.values(URL_TO_BOOK_ID_MAP)) {
      const slug = getBookUrlSlug(bookId)
      expect(slug).toBe(slug.toLowerCase())
      expect(getBookIdFromUrlSlug(slug)).toBe(bookId)
    }
  })

  it('keeps the reverse map consistent with the forward map', () => {
    for (const [slug, bookId] of Object.entries(URL_TO_BOOK_ID_MAP)) {
      expect(BOOK_ID_TO_URL_MAP[bookId]).toBe(slug)
    }
  })
})

describe('book configuration', () => {
  it('resolves multi-volume configs by bookId prefix (volume ids included)', () => {
    const kafi = getBookConfig('Al-Kafi-Volume-3-Kulayni')
    expect(kafi?.bookId).toBe('Al-Kafi')
    expect(kafi?.hasMultipleVolumes).toBe(true)
    expect(kafi?.volumes).toEqual(AL_KAFI_VOLUMES)
    expect(kafi?.volumeCount).toBe(8)

    const uyun = getBookConfig('Uyun-akhbar-al-Rida-Volume-2-Saduq')
    expect(uyun?.volumes).toEqual(UYUN_VOLUMES)
    expect(uyun?.volumeCount).toBe(2)
  })

  it('synthesizes a single-volume config for known single-volume books', () => {
    const config = getBookConfig('Al-Tawhid-Saduq')
    expect(config).toMatchObject({
      bookId: 'Al-Tawhid-Saduq',
      hasMultipleVolumes: false,
      volumes: ['Al-Tawhid-Saduq'],
      volumeCount: 1,
    })
  })

  it('returns null for unknown books', () => {
    expect(getBookConfig('Some-Random-Book')).toBeNull()
  })

  it('classifies multi-volume books via prefix matching', () => {
    expect(isMultiVolumeBook('Al-Kafi-Volume-8-Kulayni')).toBe(true)
    expect(isMultiVolumeBook('Man-La-Yahduruh-al-Faqih-Volume-2-Saduq')).toBe(true)
    expect(isMultiVolumeBook('Al-Tawhid-Saduq')).toBe(false)
  })

  it('declares volume counts matching the volume lists', () => {
    for (const config of Object.values(MULTI_VOLUME_BOOKS)) {
      expect(config.volumes).toBeDefined()
      expect(config.volumes).toHaveLength(config.volumeCount!)
    }
  })
})

describe('SEARCHABLE_BOOKS (global search scope)', () => {
  it('has unique keys and consistent volume counts', () => {
    const keys = SEARCHABLE_BOOKS.map((book) => book.key)
    expect(new Set(keys).size).toBe(keys.length)

    for (const book of SEARCHABLE_BOOKS) {
      expect(book.volumeIds.length).toBe(book.volumeCount)
      expect(book.displayName.length).toBeGreaterThan(0)
    }
  })

  it('references only volume ids the config layer knows about', () => {
    const known = new Set<string>([
      ...SINGLE_VOLUME_BOOKS,
      ...Object.values(MULTI_VOLUME_BOOKS).flatMap((config) => config.volumes ?? []),
      // The two Ghayba books are searchable but only registered in the URL map.
      ...Object.values(URL_TO_BOOK_ID_MAP),
    ])

    for (const book of SEARCHABLE_BOOKS) {
      for (const volumeId of book.volumeIds) {
        expect(known.has(volumeId), `unknown volume id: ${volumeId}`).toBe(true)
      }
    }
  })
})

describe('grading availability', () => {
  it('detects volumes with graded hadith', () => {
    expect(volumesHaveGradings(['Al-Kafi-Volume-1-Kulayni'])).toBe(true)
    expect(volumesHaveGradings(['Nahj-al-Balagha-Radi'])).toBe(false)
    expect(volumesHaveGradings([])).toBe(false)
  })

  it('offers the grading filter for global and Al-Kāfi contexts', () => {
    expect(searchContextHasGradings(undefined)).toBe(true)
    expect(searchContextHasGradings('all-books')).toBe(true)
    expect(searchContextHasGradings('al-kafi')).toBe(true)
  })

  it('evaluates multi-volume books across every volume', () => {
    // Only volume 5 of Man lā yaḥḍuruh carries gradings, but any volume's page
    // (which passes its own volume id) must still qualify.
    expect(VOLUMES_WITH_GRADINGS.has('Man-La-Yahduruh-al-Faqih-Volume-1-Saduq')).toBe(false)
    expect(searchContextHasGradings('Man-La-Yahduruh-al-Faqih-Volume-1-Saduq')).toBe(true)
  })

  it('hides the grading filter for books with no graded hadith', () => {
    expect(searchContextHasGradings('Nahj-al-Balagha-Radi')).toBe(false)
    expect(searchContextHasGradings('Sifat-al-Shia-Saduq')).toBe(false)
  })
})
