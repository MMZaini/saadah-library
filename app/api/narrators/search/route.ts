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
      // The ranking version supplied by the client is part of the URL, so a
      // ranking change cannot reuse an older response. Browsers must still
      // revalidate across reloads; the CDN may cache a versioned query.
      headers: {
        'Cache-Control': 'public, max-age=0, must-revalidate, s-maxage=86400',
      },
    })
  } catch {
    return NextResponse.json(
      { error: 'Narrator search failed', results: [], total: 0 },
      { status: 500 },
    )
  }
}
