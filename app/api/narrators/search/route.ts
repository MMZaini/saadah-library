import { NextRequest, NextResponse } from 'next/server'
import { searchNarrators } from '@/lib/data/rijal-server-repository'
import { normalizeSearchModes } from '@/lib/search-utils'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q') ?? ''
    const limit = Number(searchParams.get('limit') ?? 50)
    const modes = normalizeSearchModes(searchParams.get('mode')?.split(','))

    const response = await searchNarrators({ query, limit, modes })
    return NextResponse.json(response, {
      // The dataset is immutable per deploy and the query is fully in the URL, so
      // identical searches can be served from the browser/CDN cache instead of
      // re-running the server scan.
      headers: {
        'Cache-Control': 'public, max-age=300, s-maxage=86400, stale-while-revalidate=604800',
      },
    })
  } catch {
    return NextResponse.json(
      { error: 'Narrator search failed', results: [], total: 0 },
      { status: 500 },
    )
  }
}
