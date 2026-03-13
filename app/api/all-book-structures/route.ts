import { NextResponse } from 'next/server'
import { getAllStructures } from '@/lib/server-book-structure'

/**
 * GET /api/all-book-structures
 *
 * Returns the structure metadata for EVERY book in the library in a single
 * response.  The server caches this for 24 h so the upstream Thaqalayn API
 * is only hit once per day (or server restart).
 *
 * The client calls this in the background on first load and stores each
 * entry in IndexedDB — making subsequent book navigation instant.
 */
export async function GET() {
  try {
    const structures = await getAllStructures()

    return NextResponse.json(
      { structures },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=86400',
        },
      },
    )
  } catch {
    return NextResponse.json({ error: 'Failed to build book structures' }, { status: 500 })
  }
}
