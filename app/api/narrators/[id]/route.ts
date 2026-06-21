import { NextRequest, NextResponse } from 'next/server'
import { getNarrator } from '@/lib/data/rijal-server-repository'

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const narrator = await getNarrator(id)
    if (!narrator) {
      return NextResponse.json({ error: 'Narrator not found' }, { status: 404 })
    }

    return NextResponse.json(narrator, {
      // A narrator id is content-addressed within the immutable dataset, so the
      // body is stable — cache it hard so re-opening a narrator never re-reads a
      // multi-MB shard on the server.
      headers: {
        'Cache-Control': 'public, max-age=3600, s-maxage=2592000, stale-while-revalidate=604800',
      },
    })
  } catch {
    return NextResponse.json({ error: 'Narrator lookup failed' }, { status: 500 })
  }
}
