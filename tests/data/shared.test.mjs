import { describe, expect, it } from 'vitest'
import {
  getChapterPathFromHadith,
  getVolumeNumberFromLegacyBookId,
  getWorkKeyFromLegacyBookId,
  normalizeArabic,
  parseThaqalaynHadithUrl,
} from '../../scripts/data/shared.mjs'

describe('data shared helpers', () => {
  it('normalizes Arabic text for search', () => {
    expect(normalizeArabic('إِنَّ ٱللّٰهَ')).toBe('ان الله')
  })

  it('parses Thaqalayn hadith URLs into stable source keys', () => {
    const parsed = parseThaqalaynHadithUrl('https://thaqalayn.net/hadith/1/1/0/3')

    expect(parsed.chapterPath).toBe('/chapter/1/1/0')
    expect(parsed.sourceHadithNumber).toBeUndefined()
    expect(parsed.hadithNumber).toBe(3)
  })

  it('derives legacy work and volume identities', () => {
    expect(getWorkKeyFromLegacyBookId('Al-Kafi-Volume-8-Kulayni')).toBe('Al-Kafi')
    expect(getVolumeNumberFromLegacyBookId('Al-Kafi-Volume-8-Kulayni')).toBe(8)
    expect(getChapterPathFromHadith({ URL: 'https://thaqalayn.net/hadith/1/1/0/3' })).toBe(
      '/chapter/1/1/0',
    )
  })
})
