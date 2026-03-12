import { NextResponse } from 'next/server'
import { ensureArabicIndexReady } from '@/lib/arabic-search-index'

// Return a simple JSON status about the Arabic index: whether it's built and approximate stats.
export async function GET() {
  try {
    // Ensure the index is at least attempted to be built (non-blocking if already fresh)
    await ensureArabicIndexReady()

    // We don't expose internals here; simply report success. Additional fields can be
    // added later (e.g., lastBuilt timestamp) if the library exposes them.
    return NextResponse.json({ ok: true, message: 'Arabic index is ready or being built' })
  } catch (err) {
    return NextResponse.json({ ok: false, error: 'Failed to ensure Arabic index' }, { status: 500 })
  }
}
