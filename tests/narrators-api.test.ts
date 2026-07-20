// Unit tests for the narrator (rijal) API routes against the real committed
// dataset under data/rijal — the feature behind /narrators.
import { NextRequest } from 'next/server'
import { describe, expect, it } from 'vitest'
import { GET as narratorSearchGet } from '../app/api/narrators/search/route'
import { GET as narratorGet } from '../app/api/narrators/[id]/route'

function searchRequest(params: Record<string, string>) {
  const query = new URLSearchParams(params).toString()
  return new NextRequest(`http://localhost/api/narrators/search${query ? `?${query}` : ''}`)
}

async function firstNarratorId(): Promise<string> {
  const response = await narratorSearchGet(searchRequest({ q: 'أبان', limit: '1' }))
  const body = await response.json()
  expect(body.results.length).toBeGreaterThan(0)
  return body.results[0].id as string
}

describe('GET /api/narrators/search', () => {
  it('finds narrators by Arabic name with cacheable responses', async () => {
    const response = await narratorSearchGet(searchRequest({ q: 'أبان', limit: '5' }))
    expect(response.status).toBe(200)
    expect(response.headers.get('cache-control')).toMatch(/s-maxage=\d+/)
    expect(response.headers.get('cache-control')).toContain('max-age=0')
    expect(response.headers.get('cache-control')).toContain('must-revalidate')

    const body = await response.json()
    expect(body.total).toBeGreaterThan(0)
    expect(body.results.length).toBeLessThanOrEqual(5)
    for (const result of body.results) {
      expect(result.id).toBeTruthy()
    }
  })

  it('respects the limit parameter', async () => {
    const one = await narratorSearchGet(searchRequest({ q: 'أبان', limit: '1' }))
    expect((await one.json()).results).toHaveLength(1)
  })

  it('returns exact English phrase matches before longer names', async () => {
    const response = await narratorSearchGet(
      searchRequest({ q: 'muhammad bin muslim', limit: '50', ranking: '5' }),
    )
    expect(response.status).toBe(200)

    const body = await response.json()
    expect(
      body.results.slice(0, 2).map((result: { entryNumber: number }) => result.entryNumber),
    ).toEqual([11804, 11805])
    expect(body.results[2].matchType).not.toBe('exact')
  })

  it('returns a precise structured-identity match for a reordered Arabic name', async () => {
    const response = await narratorSearchGet(
      searchRequest({ q: 'أبو الحسين محمد بن بحر الشيباني', limit: '10', ranking: '5' }),
    )
    expect(response.status).toBe(200)

    const body = await response.json()
    expect(body.results[0]).toMatchObject({
      id: 'khoei-v16-10324',
      primaryName: 'محمد بن بحر الرهني',
      matchType: 'words',
    })
    expect(body.results[0].matchedIdentity).toContain('أبو الحسين الشيباني')
    expect(body.total).toBeLessThanOrEqual(5)
  })

  it('returns a precise composed subject-fact match for an abbreviated lineage', async () => {
    const response = await narratorSearchGet(
      searchRequest({ q: 'أبو بكر محمد بن علي بن حاتم النوفلي', limit: '10', ranking: '5' }),
    )
    expect(response.status).toBe(200)

    const body = await response.json()
    expect(body.results[0]).toMatchObject({
      id: 'khoei-v18-11366',
      primaryName: 'محمد بن علي بن محمد بن حاتم',
      matchedDetails: ['أبي بكر', 'النوفلي'],
    })
    expect(body.total).toBeLessThanOrEqual(5)
  })

  it('combines an exact two-segment lineage with its opening nisba', async () => {
    const response = await narratorSearchGet(
      searchRequest({ q: 'جبرئيل بن أحمد الفاريابي', limit: '10', ranking: '5' }),
    )
    expect(response.status).toBe(200)

    const body = await response.json()
    expect(body.results[0]).toMatchObject({
      id: 'khoei-v4-2054',
      primaryName: 'جبرئيل بن أحمد',
      matchedDetails: ['الفاريابي'],
    })
    expect(body.total).toBeLessThanOrEqual(5)
  })
})

describe('GET /api/narrators/[id]', () => {
  it('returns the full narrator entry with its source text', async () => {
    const id = await firstNarratorId()
    const request = new NextRequest(`http://localhost/api/narrators/${id}`)
    const response = await narratorGet(request, { params: Promise.resolve({ id }) })

    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.id).toBe(id)
    expect(typeof body.plainText).toBe('string')
    expect(body.plainText.length).toBeGreaterThan(0)
  })

  it('returns the lightweight summary without heavy fields for view=summary', async () => {
    const id = await firstNarratorId()
    const request = new NextRequest(`http://localhost/api/narrators/${id}?view=summary`)
    const response = await narratorGet(request, { params: Promise.resolve({ id }) })

    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.id).toBe(id)
    expect(body.plainText).toBeUndefined()
    expect(body.volumeNumber).toBeGreaterThan(0)
  })

  it('rejects unknown and malformed ids with 404', async () => {
    for (const id of ['no-such-narrator', '../metadata']) {
      const request = new NextRequest(`http://localhost/api/narrators/${encodeURIComponent(id)}`)
      const response = await narratorGet(request, { params: Promise.resolve({ id }) })
      expect(response.status).toBe(404)
    }
  })
})
