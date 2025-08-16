import { NextRequest, NextResponse } from 'next/server'
import { thaqalaynApi } from '@/lib/api'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q')
    
    if (!query) {
      return NextResponse.json({ results: [], total: 0 })
    }

    const response = await thaqalaynApi.searchAllBooks(query)
    return NextResponse.json(response)
  } catch (error) {
    return NextResponse.json(
      { error: 'Search failed', results: [], total: 0 },
      { status: 500 }
    )
  }
}
