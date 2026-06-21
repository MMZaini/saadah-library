import { NextRequest } from 'next/server'
import { describe, expect, it } from 'vitest'
import { GET as getNarratorRoute } from '@/app/api/narrators/[id]/route'
import { GET as searchNarratorsRoute } from '@/app/api/narrators/search/route'

function request(url: string) {
  return new NextRequest(url)
}

describe('narrator API routes', () => {
  it('handles empty query and limit-bounded Arabic search', async () => {
    const empty = await searchNarratorsRoute(
      request('http://localhost/api/narrators/search?q=&limit=1'),
    )
    expect(empty.status).toBe(200)
    expect(await empty.json()).toMatchObject({ results: [], total: 0 })

    const searched = await searchNarratorsRoute(
      request('http://localhost/api/narrators/search?q=%D8%A3%D8%A8%D8%A7%D9%86&limit=1'),
    )
    const data = await searched.json()
    expect(searched.status).toBe(200)
    expect(data.results).toHaveLength(1)
    expect(data.total).toBeGreaterThan(0)
  })

  it('returns full narrator detail and 404s missing ids', async () => {
    const searched = await searchNarratorsRoute(
      request('http://localhost/api/narrators/search?q=%D8%A3%D8%A8%D8%A7%D9%86&limit=1'),
    )
    const data = await searched.json()
    const detail = await getNarratorRoute(request('http://localhost/api/narrators/khoei'), {
      params: Promise.resolve({ id: data.results[0].id }),
    })
    expect(detail.status).toBe(200)
    expect((await detail.json()).plainText).toContain('أبان')

    const missing = await getNarratorRoute(request('http://localhost/api/narrators/nope'), {
      params: Promise.resolve({ id: '../bad' }),
    })
    expect(missing.status).toBe(404)
  })
})
