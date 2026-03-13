import { NextRequest, NextResponse } from 'next/server'
import { getStructure } from '@/lib/server-book-structure'

// ── Route handler ────────────────────────────────────────────────────────

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bookId: string }> },
) {
  try {
    const { bookId } = await params

    // Support multi-volume aggregation via ?volumes=id1,id2,...
    const volumesParam = request.nextUrl.searchParams.get('volumes')
    const bookIds: string[] = volumesParam
      ? volumesParam
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : [bookId]

    if (bookIds.length === 0) {
      return NextResponse.json({ error: 'No book IDs provided' }, { status: 400 })
    }

    const structure = await getStructure(bookIds)

    const totalHadiths = Object.values(structure).reduce((sum, cat) => sum + cat.totalHadiths, 0)

    return NextResponse.json(
      { structure, totalHadiths, bookIds },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=86400',
        },
      },
    )
  } catch {
    return NextResponse.json({ error: 'Failed to build book structure' }, { status: 500 })
  }
}
