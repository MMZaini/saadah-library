import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { URL_TO_BOOK_ID_MAP, MULTI_VOLUME_BOOKS } from './lib/books-config'

// Only redirect for known book slugs (case-insensitive). This avoids interfering
// with other top-level routes and ensures we only canonicalize library book URLs.
export function middleware(req: NextRequest) {
  const { nextUrl } = req
  const pathname = nextUrl.pathname

  // Ignore special paths immediately
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname.startsWith('/favicon.ico')
  ) {
    return
  }

  // Consider nested routes: if the first segment matches a known book slug,
  // canonicalize the entire path to lowercase (so /Al-Kafi/Volume/1 -> /al-kafi/volume/1)
  const segments = pathname.split('/').filter(Boolean)
  if (segments.length === 0) return

  const first = segments[0]
  const firstLower = first.toLowerCase()

  // Build whitelist of known slugs (lowercased) from URL_TO_BOOK_ID_MAP and multi-volume book keys
  const mapSlugs = Object.keys(URL_TO_BOOK_ID_MAP).map((k) => k.toLowerCase())
  const multiSlugs = Object.keys(MULTI_VOLUME_BOOKS).map((k) => k.toLowerCase())
  const known = new Set([...mapSlugs, ...multiSlugs])

  if (!known.has(firstLower)) return

  // Lowercase entire path
  const lowerPath = '/' + segments.map((s) => s.toLowerCase()).join('/')
  if (pathname === lowerPath) return

  const url = nextUrl.clone()
  url.pathname = lowerPath
  // Permanent redirect for canonicalization (301)
  return NextResponse.redirect(url, 301)
}

export const config = {
  // Run middleware for all paths at root (we filter inside middleware)
  matcher: '/:path*',
}
