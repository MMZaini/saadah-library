import { NextRequest, NextResponse } from 'next/server'
import { getLocalRandomHadith } from '@/lib/data/server-repository'

// Serves one random hadith using the dataset's precomputed random.json refs,
// so clients don't have to download a multi-MB volume to show a single entry.
export async function GET(request: NextRequest) {
  const bookParam = request.nextUrl.searchParams.get('book')?.trim() || undefined

  try {
    const hadith = await getLocalRandomHadith(bookParam)
    return NextResponse.json(hadith, {
      // Every response is different by design.
      headers: { 'Cache-Control': 'no-store' },
    })
  } catch (error) {
    console.warn('[api/random] request failed:', error)
    return NextResponse.json(
      { error: bookParam ? `No hadiths available for ${bookParam}` : 'No hadiths available' },
      { status: 404 },
    )
  }
}
