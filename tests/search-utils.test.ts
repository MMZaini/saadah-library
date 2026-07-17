import { describe, expect, it } from 'vitest'
import {
  getHighlightSegments,
  matchesSearchMode,
  normalizeArabicNarratorName,
  normalizeSearchModes,
  tokenizeEnglish,
} from '../lib/search-utils'
// The data builder is plain ESM while the application is TypeScript. Import it
// here deliberately so CI enforces their shared normalization contract.
import { normalizeArabic as normalizeArabicForRijalBuild } from '../tools/rijal/shared.mjs'

const highlighted = (text: string, query: string, opts?: { exactMatch?: boolean }) =>
  getHighlightSegments(text, query, opts)
    .filter((s) => s.highlight)
    .map((s) => s.text)

describe('search matching', () => {
  it('keeps runtime and narrator-build Arabic normalization in lockstep', () => {
    const samples = [
      'جبرئيل بن أحمد',
      'مسؤول',
      'يحيى الكوفي',
      'علی کاظم',
      'مُحَمَّد،بن',
      'علي\u200dبن',
      'عبدﷲ',
      'شَيْءٌ',
    ]

    for (const sample of samples) {
      expect(normalizeArabicNarratorName(sample)).toBe(normalizeArabicForRijalBuild(sample))
    }
  })

  it('normalizes hamza carriers, Persian keyboard letters, marks, and boundaries', () => {
    expect(normalizeArabicNarratorName('جبرئيل بن أحمد')).toBe('جبرييل بن احمد')
    expect(normalizeArabicNarratorName('مسؤول')).toBe('مسوول')
    expect(normalizeArabicNarratorName('علی کاظم')).toBe('علي كاظم')
    expect(normalizeArabicNarratorName('مُحَمَّد،بن')).toBe('محمد بن')
    expect(normalizeArabicNarratorName('علي\u200dبن')).toBe('علي بن')
  })

  it('tokenizes English without preserving punctuation or diacritics', () => {
    expect(tokenizeEnglish("Al-Kāfi: Ja'far said")).toEqual(['al', 'kafi', "ja'far", 'said'])
  })

  it('defaults invalid or empty mode lists to exact phrase', () => {
    expect(normalizeSearchModes([])).toEqual(['exactPhrase'])
    expect(normalizeSearchModes(['unknown'])).toEqual(['exactPhrase'])
    expect(normalizeSearchModes(['flexibleMatching', 'exactWords', 'flexibleMatching'])).toEqual([
      'flexibleMatching',
      'exactWords',
    ])
  })

  it('does not match short exact phrase queries inside unrelated words', () => {
    const text = 'The grand Shaikh al-Saduq said that the servant records deeds.'

    expect(matchesSearchMode({ query: 'sad', mode: 'exactPhrase', englishText: text })).toBe(false)
    expect(matchesSearchMode({ query: 'sad', mode: 'exactWords', englishText: text })).toBe(false)
    expect(
      matchesSearchMode({ query: 'sad', mode: 'exactPhrase', englishText: 'He was sad.' }),
    ).toBe(true)
  })

  it('matches exact phrase as consecutive normalized tokens', () => {
    const text = 'When Allah created the intellect, He gave it speech.'

    expect(
      matchesSearchMode({ query: 'created the intellect', mode: 'exactPhrase', englishText: text }),
    ).toBe(true)
    expect(
      matchesSearchMode({ query: 'created intellect', mode: 'exactPhrase', englishText: text }),
    ).toBe(false)
  })

  it('matches exact words in any order', () => {
    const text = 'When Allah created the intellect, He gave it speech.'

    expect(
      matchesSearchMode({ query: 'intellect Allah', mode: 'exactWords', englishText: text }),
    ).toBe(true)
    expect(
      matchesSearchMode({ query: 'intellect mercy', mode: 'exactWords', englishText: text }),
    ).toBe(false)
  })

  it('keeps flexible matching broad without arbitrary substring matches', () => {
    expect(
      matchesSearchMode({
        query: 'prayer',
        mode: 'flexibleMatching',
        englishText: 'The narration discusses salah.',
      }),
    ).toBe(true)
    expect(
      matchesSearchMode({
        query: 'sad',
        mode: 'flexibleMatching',
        englishText: 'The grand Shaikh al-Saduq said this.',
      }),
    ).toBe(false)
  })
})

describe('getHighlightSegments', () => {
  it('highlights an Arabic word that is not the first word of the text', () => {
    // Regression: the normalized→original index map treated spaces as stripped
    // diacritics, so any match after the first space failed to map back.
    const text = 'قال الإمام الصادق عليه السلام إن الصلاة عمود الدين'
    expect(highlighted(text, 'الصلاة')).toEqual(['الصلاة'])
  })

  it('matches Arabic diacritic-insensitively and keeps the original diacritics, no trailing space', () => {
    const text = 'إِنَّ ٱلصَّلَاةَ عَمُودُ ٱلدِّينِ'
    expect(highlighted(text, 'الصلاة')).toEqual(['ٱلصَّلَاةَ'])
  })

  it('highlights every occurrence of a repeated Arabic word', () => {
    expect(highlighted('الله ثم الله ثم الله', 'الله')).toEqual(['الله', 'الله', 'الله'])
  })

  it('highlights an Arabic multi-word phrase and separate query words', () => {
    expect(highlighted('قال إن عمود الدين هو الصلاة', 'عمود الدين')).toEqual(['عمود الدين'])
    expect(highlighted('الصلاة ثم الزكاة', 'الصلاة الزكاة')).toEqual(['الصلاة', 'الزكاة'])
  })

  it('still highlights English matches', () => {
    expect(highlighted('When Allah created the intellect', 'intellect')).toEqual(['intellect'])
  })
})
