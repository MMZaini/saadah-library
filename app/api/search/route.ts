import { NextRequest, NextResponse } from 'next/server'
import { searchLocalHadiths } from '@/lib/data/server-repository'

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

    // searchLocalHadiths detects Arabic vs English queries internally and
    // searches the generated local shards (diacritic-insensitive for Arabic).
    const response = await searchLocalHadiths(query, bookIds)
    return NextResponse.json(response)
  } catch {
    return NextResponse.json({ error: 'Search failed', results: [], total: 0 }, { status: 500 })
  }
}
