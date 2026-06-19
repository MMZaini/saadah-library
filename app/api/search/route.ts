import { NextRequest, NextResponse } from 'next/server'
import { isArabicQuery } from '@/lib/search-utils'
import { searchArabicLocally, searchEnglishLocally } from '@/lib/arabic-search-index'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q')
    const bookParam = searchParams.get('book') // comma-separated book IDs for scoped search

    if (!query) {
      return NextResponse.json({ results: [], total: 0 })
    }

    const bookIds = bookParam
      ? bookParam
          .split(',')
          .map((b) => b.trim())
          .filter(Boolean)
      : undefined

    // Arabic queries always use the local normalized index (diacritic-insensitive)
    if (isArabicQuery(query)) {
      const response = await searchArabicLocally(query, bookIds)
      return NextResponse.json(response)
    }

    // English queries also use generated local search shards.
    const response = await searchEnglishLocally(query, bookIds)
    return NextResponse.json(response)
  } catch {
    return NextResponse.json({ error: 'Search failed', results: [], total: 0 }, { status: 500 })
  }
}
