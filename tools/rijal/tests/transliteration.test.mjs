import { describe, expect, it } from 'vitest'
import {
  buildNarratorTransliterations,
  buildTokenTransliterationList,
  transliterateNarratorName,
} from '../transliteration.mjs'

describe('narrator transliteration generation', () => {
  it('reconstructs names from canonical reusable word spellings', () => {
    expect(transliterateNarratorName('محمد بن علي بن مهدي')).toBe('Muḥammad b. ʿAlī b. Mahdī')
    expect(transliterateNarratorName('محمد بن محمد')).toBe('Muḥammad b. Muḥammad')
  })

  it('covers every unique Arabic token and narrator id', () => {
    const entries = [
      { id: 'one', primaryName: 'محمد بن علي', aliases: ['أبو جعفر'] },
      { id: 'two', primaryName: 'علي بن محمد', aliases: [] },
    ]
    const names = buildNarratorTransliterations(entries)
    const tokens = buildTokenTransliterationList(entries)

    expect(Object.keys(names)).toHaveLength(2)
    expect(names.one.primary).toBe('Muḥammad b. ʿAlī')
    expect(tokens.محمد).toBe('Muḥammad')
    expect(tokens.علي).toBe('ʿAlī')
  })
})
