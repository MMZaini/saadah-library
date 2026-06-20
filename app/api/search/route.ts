import { NextRequest, NextResponse } from 'next/server'
import { filterLocalHadiths, searchLocalHadiths } from '@/lib/data/server-repository'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q')
    const bookParam = searchParams.get('book') // comma-separated book IDs for scoped search
    const filterOnly = searchParams.get('filterOnly') === '1'
    const gradingParam = searchParams.get('grading')

    const bookIds = bookParam
      ? bookParam
          .split(',')
          .map((b) => b.trim())
          .filter(Boolean)
      : undefined

    if (!query) {
      if (!filterOnly) return NextResponse.json({ results: [], total: 0 })

      const gradings = gradingParam
        ? gradingParam
            .split(',')
            .map((grading) => grading.trim())
            .filter(Boolean)
        : []
      const response = await filterLocalHadiths(bookIds, gradings)
      return NextResponse.json(response)
    }

    // searchLocalHadiths detects Arabic vs English queries internally and
    // searches the generated local shards (diacritic-insensitive for Arabic).
    const response = await searchLocalHadiths(query, bookIds)
    return NextResponse.json(response)
  } catch {
    return NextResponse.json({ error: 'Search failed', results: [], total: 0 }, { status: 500 })
  }
}
