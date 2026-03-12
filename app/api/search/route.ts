import { NextRequest, NextResponse } from 'next/server'
import { thaqalaynApi } from '@/lib/api'
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
      ? bookParam.split(',').map((b) => b.trim()).filter(Boolean)
      : undefined

    // Arabic queries always use the local normalized index (diacritic-insensitive)
    if (isArabicQuery(query)) {
      const response = await searchArabicLocally(query, bookIds)
      return NextResponse.json(response)
    }

    // English, book-scoped: use local English index (faster than parallel API calls)
    if (bookIds && bookIds.length > 0) {
      const response = await searchEnglishLocally(query, bookIds)
      return NextResponse.json(response)
    }

    // English, global: call external API
    const response = await thaqalaynApi.searchAllBooks(query)
    return NextResponse.json(response)
  } catch {
    return NextResponse.json({ error: 'Search failed', results: [], total: 0 }, { status: 500 })
  }
}
