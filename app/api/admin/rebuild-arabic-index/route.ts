import { NextResponse } from 'next/server'
import { forceRebuild } from '@/lib/arabic-search-index'

export async function GET() {
  try {
    await forceRebuild()
    return NextResponse.json({ ok: true, message: 'Arabic index rebuild triggered and completed' })
  } catch (err) {
    return NextResponse.json({ ok: false, error: 'Rebuild failed' }, { status: 500 })
  }
}
