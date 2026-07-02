import { NextRequest, NextResponse } from 'next/server'
import {
  clampSearchLimit,
  filterLocalHadiths,
  searchLocalHadiths,
} from '@/lib/data/server-repository'
import { normalizeSearchModes } from '@/lib/search-utils'

// The dataset is immutable per release (the manifest version only changes
// with a deploy), so identical queries can be served from the CDN cache.
const SEARCH_CACHE_CONTROL = 'public, max-age=0, s-maxage=86400, stale-while-revalidate=604800'

function jsonWithCache(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: status === 200 ? { 'Cache-Control': SEARCH_CACHE_CONTROL } : undefined,
  })
}

// In-process memo for repeated identical queries (typing, backspacing,
// pagination revisits). The CDN handles this in production; this covers warm
// serverless instances and self-hosted `next start`. Dataset is immutable per
// deploy, so entries never go stale — the LRU only bounds memory.
const responseMemo = new Map<string, unknown>()
const MAX_MEMO_ENTRIES = 30

function memoGet(key: string): unknown | undefined {
  const hit = responseMemo.get(key)
  if (hit !== undefined) {
    responseMemo.delete(key)
    responseMemo.set(key, hit) // refresh recency
  }
  return hit
}

function memoSet(key: string, value: unknown) {
  responseMemo.set(key, value)
  while (responseMemo.size > MAX_MEMO_ENTRIES) {
    const oldest = responseMemo.keys().next().value
    if (oldest === undefined) break
    responseMemo.delete(oldest)
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q')
    const bookParam = searchParams.get('book') // comma-separated book IDs for scoped search
    const filterOnly = searchParams.get('filterOnly') === '1'
    const gradingParam = searchParams.get('grading')
    const modeParam = searchParams.get('mode')
    const limit = clampSearchLimit(searchParams.get('limit'))

    const bookIds = bookParam
      ? bookParam
          .split(',')
          .map((b) => b.trim())
          .filter(Boolean)
      : undefined

    const memoKey = `${query ?? ''}|${bookParam ?? ''}|${modeParam ?? ''}|${filterOnly}|${gradingParam ?? ''}|${limit}`
    const memoized = memoGet(memoKey)
    if (memoized !== undefined) return jsonWithCache(memoized)

    if (!query) {
      if (!filterOnly) return jsonWithCache({ results: [], total: 0, truncated: false })

      const gradings = gradingParam
        ? gradingParam
            .split(',')
            .map((grading) => grading.trim())
            .filter(Boolean)
        : []
      const response = await filterLocalHadiths(bookIds, gradings, limit)
      memoSet(memoKey, response)
      return jsonWithCache(response)
    }

    // searchLocalHadiths detects Arabic vs English queries internally.
    // Missing/invalid modes default to exact phrase.
    const modes = normalizeSearchModes(modeParam?.split(','))
    const response = await searchLocalHadiths(query, bookIds, modes, limit)
    memoSet(memoKey, response)
    return jsonWithCache(response)
  } catch (error) {
    console.warn('[api/search] request failed:', error)
    return NextResponse.json(
      { error: 'Search failed', results: [], total: 0, truncated: false },
      { status: 500 },
    )
  }
}
