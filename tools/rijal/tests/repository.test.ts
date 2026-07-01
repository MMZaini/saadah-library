import { describe, expect, it } from 'vitest'
import {
  getNarrator,
  getNarratorSummary,
  rankNarratorSearchEntry,
  searchNarrators,
} from '@/lib/data/rijal-server-repository'

describe('narrator search ranking', () => {
  const entry = {
    id: 'khoei-v1-1',
    normalizedName: 'ابان بن تغلب',
    normalizedAliases: ['ابو سعيد ابان'],
    searchText: 'ابان بن تغلب ابو سعيد ابان',
    entryNumber: 1,
    volumeNumber: 1,
    startPage: 1,
  }

  it('ranks exact, prefix, alias, and word matches', () => {
    expect(rankNarratorSearchEntry(entry, 'أبان بن تغلب')?.matchType).toBe('exact')
    expect(rankNarratorSearchEntry(entry, 'أبان')?.matchType).toBe('startsWith')
    expect(rankNarratorSearchEntry(entry, 'أبو سعيد')?.matchType).toBe('startsWith')
    expect(rankNarratorSearchEntry(entry, 'تغلب أبان', ['exactWords'])?.matchType).toBe('words')
  })
})

describe('local narrator repository', () => {
  it('returns empty results for an empty query', async () => {
    const response = await searchNarrators({ query: '' })
    expect(response.results).toEqual([])
    expect(response.total).toBe(0)
    expect(response.metadata.counts.volumes).toBe(24)
  })

  it('searches Arabic narrator names from local artifacts', async () => {
    const response = await searchNarrators({ query: 'أبان', limit: 10 })
    expect(response.total).toBeGreaterThan(0)
    expect(response.results[0].primaryName).toContain('أبان')
  })

  it('hydrates narrator entries and rejects malformed ids', async () => {
    const response = await searchNarrators({ query: 'أبان', limit: 1 })
    const narrator = await getNarrator(response.results[0].id)
    expect(narrator?.plainText).toContain('أبان')
    await expect(getNarrator('../metadata')).resolves.toBeNull()
  })

  it('returns a lightweight summary without the heavy fields', async () => {
    const response = await searchNarrators({ query: 'أبان', limit: 1 })
    const id = response.results[0].id
    const summary = await getNarratorSummary(id)
    expect(summary?.id).toBe(id)
    expect(summary?.volumeNumber).toBeGreaterThan(0)
    expect(summary?.startPage).toBeGreaterThan(0)
    // The summary is the index record — it must not carry the multi-KB detail.
    expect((summary as unknown as Record<string, unknown>).plainText).toBeUndefined()
    expect((summary as unknown as Record<string, unknown>).textBlocks).toBeUndefined()
    await expect(getNarratorSummary('../metadata')).resolves.toBeNull()
  })
})
