import { NextRequest, NextResponse } from 'next/server'
import { thaqalaynApi } from '@/lib/api'
import { isArabicQuery, normalizeArabic } from '@/lib/search-utils'
import { searchArabicLocally } from '@/lib/arabic-search-index'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q')

    if (!query) {
      return NextResponse.json({ results: [], total: 0 })
    }

    // For Arabic queries: search locally through normalized cached index (diacritic-insensitive).
    // For non-Arabic queries: pass through to external API.
    if (isArabicQuery(query)) {
      const response = await searchArabicLocally(query)
      return NextResponse.json(response)
    }

    // Non-Arabic: call external API
    const response = await thaqalaynApi.searchAllBooks(query)
    return NextResponse.json(response)
  } catch (error) {
    return NextResponse.json({ error: 'Search failed', results: [], total: 0 }, { status: 500 })
  }
}
