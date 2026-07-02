import { describe, expect, it } from 'vitest'
import {
  containsArabic,
  flexibleArabicWordMatch,
  flexibleEnglishMatch,
  generateArabicWordVariants,
  getWordSynonyms,
  isArabicQuery,
  matchesArabicText,
  matchesSearchMode,
  normalizeArabic,
  normalizeEnglishForSearch,
  stemEnglishWord,
} from '../lib/search-utils'

describe('containsArabic / isArabicQuery', () => {
  it('detects Arabic characters anywhere in the text', () => {
    expect(containsArabic('قال الإمام')).toBe(true)
    expect(containsArabic('mixed قال text')).toBe(true)
    expect(containsArabic('english only')).toBe(false)
    expect(containsArabic('')).toBe(false)
  })

  it('classifies queries by the share of Arabic characters', () => {
    expect(isArabicQuery('الصلاة')).toBe(true)
    expect(isArabicQuery('الصلاة prayer')).toBe(true) // > 30% Arabic
    expect(isArabicQuery('prayer')).toBe(false)
    expect(isArabicQuery('   ')).toBe(false)
    expect(isArabicQuery('')).toBe(false)
  })
})

describe('normalizeArabic', () => {
  it('strips diacritics and tatweel', () => {
    expect(normalizeArabic('مُحَمَّـد')).toBe('محمد')
  })

  it('normalizes alef variants to bare alef', () => {
    expect(normalizeArabic('أإآٱ')).toBe('اااا')
  })

  it('normalizes taa marbuta to ha and alef maqsura to ya', () => {
    expect(normalizeArabic('الصلاة')).toBe('الصلاه')
    expect(normalizeArabic('موسى')).toBe('موسي')
  })

  it('normalizes hamza carriers to bare hamza', () => {
    expect(normalizeArabic('مؤمن')).toBe('مءمن')
    expect(normalizeArabic('سائل')).toBe('ساءل')
  })

  it('removes Arabic punctuation and collapses whitespace', () => {
    expect(normalizeArabic('قال،  ثم؛   قال؟')).toBe('قال ثم قال')
  })

  it('returns empty string for null/undefined/empty input', () => {
    expect(normalizeArabic(null)).toBe('')
    expect(normalizeArabic(undefined)).toBe('')
    expect(normalizeArabic('')).toBe('')
  })
})

describe('matchesArabicText', () => {
  it('matches diacritic- and variant-insensitively', () => {
    expect(matchesArabicText('إِنَّ ٱلصَّلَاةَ عَمُودُ ٱلدِّينِ', 'الصلاة')).toBe(true)
    expect(matchesArabicText('إِنَّ ٱلصَّلَاةَ عَمُودُ ٱلدِّينِ', 'الزكاة')).toBe(false)
    expect(matchesArabicText(null, 'الصلاة')).toBe(false)
    expect(matchesArabicText('نص', '')).toBe(false)
  })
})

describe('Arabic morphology helpers', () => {
  it('generates definite-article and prefix variants', () => {
    const variants = generateArabicWordVariants('الصلاه')
    expect(variants).toContain('صلاه')

    const withArticle = generateArabicWordVariants('صلاه')
    expect(withArticle).toContain('الصلاه')
  })

  it('passes non-Arabic words through unchanged', () => {
    expect(generateArabicWordVariants('prayer')).toEqual(['prayer'])
  })

  it('matches words through prefixes in flexible mode', () => {
    // Text has the word with the definite article; query without it.
    expect(flexibleArabicWordMatch('ان الصلاه عمود الدين', 'صلاه')).toBe(true)
    expect(flexibleArabicWordMatch('ان الصلاه عمود الدين', 'زكاه')).toBe(false)
    expect(flexibleArabicWordMatch('', 'صلاه')).toBe(false)
  })
})

describe('matchesSearchMode with Arabic queries', () => {
  const text = 'إِنَّ ٱلصَّلَاةَ عَمُودُ ٱلدِّينِ'

  it('matches exact phrases against normalized Arabic text', () => {
    expect(matchesSearchMode({ query: 'الصلاة عمود', mode: 'exactPhrase', arabicText: text })).toBe(
      true,
    )
    expect(matchesSearchMode({ query: 'عمود الصلاة', mode: 'exactPhrase', arabicText: text })).toBe(
      false,
    )
  })

  it('matches exact words in any order', () => {
    expect(matchesSearchMode({ query: 'الدين الصلاة', mode: 'exactWords', arabicText: text })).toBe(
      true,
    )
  })

  it('ignores the englishText field for Arabic queries', () => {
    expect(
      matchesSearchMode({
        query: 'الصلاة',
        mode: 'exactPhrase',
        englishText: 'prayer',
        arabicText: '',
      }),
    ).toBe(false)
  })
})

describe('English normalization and stemming', () => {
  it('strips diacritics and lowercases English transliterations', () => {
    expect(normalizeEnglishForSearch('Al-Kāfi ṢADŪQ')).toBe('al-kafi saduq')
    expect(normalizeEnglishForSearch('Ja‘far’s')).toBe("ja'far's")
    expect(normalizeEnglishForSearch(null)).toBe('')
  })

  it('stems plurals, verb forms and comparatives', () => {
    expect(stemEnglishWord('prayers')).toContain('prayer')
    expect(stemEnglishWord('carried')).toContain('carry')
    expect(stemEnglishWord('running')).toContain('run')
    expect(stemEnglishWord('narrations')).toContain('narration')
  })

  it('handles irregular plurals', () => {
    expect(stemEnglishWord('men')).toContain('man')
    expect(stemEnglishWord('people')).toContain('person')
  })

  it('leaves very short words untouched', () => {
    expect(stemEnglishWord('as')).toEqual(['as'])
  })
})

describe('Islamic-term synonyms', () => {
  it('is symmetric for the core worship terms', () => {
    expect(getWordSynonyms('prayer')).toContain('salah')
    expect(getWordSynonyms('salah')).toContain('prayer')
    expect(getWordSynonyms('PRAYER')).toContain('salah') // case-insensitive
    expect(getWordSynonyms('table')).toEqual([])
  })
})

describe('flexibleEnglishMatch', () => {
  const text = 'The narration discusses the merits of salah and fasting.'

  it('matches through synonyms and stemming', () => {
    expect(flexibleEnglishMatch(text, ['prayer'])).toBe(true) // synonym: salah
    expect(flexibleEnglishMatch(text, ['fast'])).toBe(true) // stem of fasting
    expect(flexibleEnglishMatch(text, ['merit', 'salah'])).toBe(true)
    expect(flexibleEnglishMatch(text, ['zakat'])).toBe(false)
  })

  it('requires every search word to match', () => {
    expect(flexibleEnglishMatch(text, ['salah', 'pilgrimage'])).toBe(false)
  })

  it('can disable synonym expansion', () => {
    expect(flexibleEnglishMatch(text, ['prayer'], { useSynonyms: false })).toBe(false)
  })
})
