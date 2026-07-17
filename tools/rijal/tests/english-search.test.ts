import { describe, expect, it } from 'vitest'
import {
  getNarrator,
  rankNarratorSearchEntry,
  searchNarrators,
} from '@/lib/data/rijal-server-repository'
import { getNarratorHighlightSegments } from '@/lib/data/rijal-transliteration'

function highlighted(text: string, query: string): string[] {
  return getNarratorHighlightSegments(text, query)
    .filter((segment) => segment.highlight)
    .map((segment) => segment.text)
}

const MATCH_SCORE = { exact: 0, startsWith: 1, contains: 2, words: 3 } as const

function expectSimilarityThenIdOrder(
  results: Array<{
    matchType: keyof typeof MATCH_SCORE
    entryNumber?: number
    sourceEntryNumber?: number
  }>,
) {
  const number = (result: (typeof results)[number]) =>
    result.entryNumber ?? result.sourceEntryNumber ?? Number.POSITIVE_INFINITY
  for (let index = 1; index < results.length; index++) {
    const previous = results[index - 1]
    const current = results[index]
    expect(MATCH_SCORE[current.matchType]).toBeGreaterThanOrEqual(MATCH_SCORE[previous.matchType])
    if (MATCH_SCORE[current.matchType] === MATCH_SCORE[previous.matchType]) {
      expect(number(current)).toBeGreaterThanOrEqual(number(previous))
    }
  }
}

describe('English narrator transliteration search', () => {
  const entry = {
    id: 'khoei-v1-1',
    normalizedName: 'محمد بن علي المهدي',
    normalizedAliases: [],
    searchText: 'محمد بن علي المهدي',
    entryNumber: 1,
    volumeNumber: 1,
    startPage: 1,
    transliteratedName: 'Muḥammad b. ʿAlī al-Mahdī',
    transliteratedAliases: [],
  }

  it('ignores scholarly diacritics and common vowel spellings', () => {
    expect(rankNarratorSearchEntry(entry, 'Muhammad')?.matchType).toBe('startsWith')
    expect(rankNarratorSearchEntry(entry, 'Muḥammad')?.matchType).toBe('startsWith')
    expect(rankNarratorSearchEntry(entry, 'Mohamed')?.matchType).toBe('startsWith')
    expect(rankNarratorSearchEntry(entry, 'Mehdi')?.matchType).toBe('words')
  })

  it('ranks an equivalent bin/ibn abbreviation as an exact phrase', () => {
    const exact = {
      ...entry,
      transliteratedName: 'Muḥammad b. Muslim',
    }
    const longer = {
      ...entry,
      transliteratedName: 'Aḥmad b. Muḥammad b. Muslim',
    }

    expect(rankNarratorSearchEntry(exact, 'muhammad bin muslim')).toMatchObject({
      score: 0,
      matchType: 'exact',
    })
    expect(rankNarratorSearchEntry(exact, 'muhammad ibn muslim')).toMatchObject({
      score: 0,
      matchType: 'exact',
    })
    expect(rankNarratorSearchEntry(longer, 'muhammad bin muslim')).toMatchObject({
      score: 3,
      matchType: 'words',
    })
  })

  it('matches user-supplied vowels against an unvocalized fallback spelling', () => {
    const rareEntry = {
      ...entry,
      transliteratedName: 'Qlānsī',
    }
    expect(rankNarratorSearchEntry(rareEntry, 'Qalanisi')?.matchType).toBe('words')
  })

  it('highlights diacritics, spelling variants, and patronymic abbreviations', () => {
    expect(highlighted('Suwayd mawlā Muḥammad b. Muslim', 'muhammad ibn muslim')).toEqual([
      'Muḥammad',
      'b.',
      'Muslim',
    ])
    expect(highlighted('Muḥammad b. ʿAlī al-Mahdī', 'mohamed ali mehdi')).toEqual([
      'Muḥammad',
      'ʿAlī',
      'Mahdī',
    ])
  })

  it('finds the same real narrators through canonical and variant spellings', async () => {
    const [canonical, variant, mahdiVariant] = await Promise.all([
      searchNarrators({ query: 'Muhammad', limit: 20 }),
      searchNarrators({ query: 'Mohamed', limit: 20 }),
      searchNarrators({ query: 'Mehdi', limit: 20 }),
    ])

    expect(canonical.total).toBeGreaterThan(0)
    expect(variant.total).toBe(canonical.total)
    expect(variant.results[0].id).toBe(canonical.results[0].id)
    const canonicalIds = new Set(canonical.results.map((result) => result.id))
    expect(variant.results.filter((result) => canonicalIds.has(result.id)).length).toBeGreaterThan(
      10,
    )
    expect(mahdiVariant.total).toBeGreaterThan(0)
    expect(canonical.results.every((result) => result.transliteratedName)).toBe(true)

    const detail = await getNarrator(canonical.results[0].id)
    expect(detail?.transliteratedName).toContain('Muḥammad')
    expect(detail?.plainText).not.toContain(detail?.transliteratedName ?? '')
  })

  it('sorts English results by similarity and then narrator id number', async () => {
    const response = await searchNarrators({ query: 'Muhammad', limit: 100 })
    expect(response.results.length).toBeGreaterThan(1)
    expect(new Set(response.results.map((result) => result.matchType)).size).toBeGreaterThan(1)
    expectSimilarityThenIdOrder(response.results)
  })

  it.each([
    'muhammad bin muslim',
    'muhammad ibn muslim',
    'muhammad ben muslim',
    'muhammad b muslim',
    'mohamed bin muslim',
  ])('puts exact patronymic phrase matches before longer real names for %s', async (query) => {
    const response = await searchNarrators({ query, limit: 50 })
    const firstNonExact = response.results.findIndex((result) => result.matchType !== 'exact')

    expect(response.results.slice(0, 2).map((result) => result.entryNumber)).toEqual([11804, 11805])
    expect(response.results.slice(0, 2).map((result) => result.transliteratedName)).toEqual([
      'Muḥammad b. Muslim',
      'Muḥammad b. Muslim',
    ])
    expect(response.results[0]?.matchType).toBe('exact')
    expect(firstNonExact).toBeGreaterThan(0)
    expect(
      response.results.slice(0, firstNonExact).every((result) => result.matchType === 'exact'),
    ).toBe(true)
    expect(
      response.results.slice(firstNonExact).every((result) => result.matchType !== 'exact'),
    ).toBe(true)
  })
})
