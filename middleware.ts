import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { URL_TO_BOOK_ID_MAP, MULTI_VOLUME_BOOKS } from './lib/books-config'

const LIBRARY_BASE_SEGMENT = 'read'
const ROOT_CLEAN_SECTIONS = new Set(['narrators', 'scans', 'bookmarks'])
const KNOWN_BOOK_SLUGS = new Set(
  [...Object.keys(URL_TO_BOOK_ID_MAP), ...Object.keys(MULTI_VOLUME_BOOKS)].map((slug) =>
    slug.toLowerCase(),
  ),
)

function redirectTo(req: NextRequest, pathname: string, status = 308) {
  const url = req.nextUrl.clone()
  url.pathname = pathname
  return NextResponse.redirect(url, status)
}

function isKnownBookSlug(slug: string | undefined): boolean {
  return Boolean(slug && KNOWN_BOOK_SLUGS.has(slug.toLowerCase()))
}

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

  const segments = pathname.split('/').filter(Boolean)
  const first = segments[0]
  const firstLower = first?.toLowerCase()
  const secondLower = segments[1]?.toLowerCase()

  // Keep these sections at clean root-level URLs.
  if (firstLower === LIBRARY_BASE_SEGMENT && ROOT_CLEAN_SECTIONS.has(secondLower ?? '')) {
    return redirectTo(req, `/${segments.slice(1).join('/')}`)
  }

  // Tolerate the common /reads typo by sending it to the same clean URL.
  if (firstLower === 'reads' && ROOT_CLEAN_SECTIONS.has(secondLower ?? '')) {
    return redirectTo(req, `/${segments.slice(1).join('/')}`)
  }

  // Implement the /read namespace without Next's global basePath so selected
  // tools can live at root. Browser URLs stay under /read, but routes/assets/APIs
  // resolve to their real app/public paths.
  if (firstLower === LIBRARY_BASE_SEGMENT) {
    const readSegments = segments.slice(1)
    if (isKnownBookSlug(readSegments[0])) {
      const lowerPath = `/${LIBRARY_BASE_SEGMENT}/${readSegments
        .map((segment) => segment.toLowerCase())
        .join('/')}`
      if (pathname !== lowerPath) return redirectTo(req, lowerPath, 301)
    }

    const url = nextUrl.clone()
    url.pathname = readSegments.length ? `/${readSegments.join('/')}` : '/'
    return NextResponse.rewrite(url)
  }

  // These sections are real root routes.
  if (ROOT_CLEAN_SECTIONS.has(firstLower ?? '')) return NextResponse.next()

  if (!isKnownBookSlug(first)) return

  // Library books are canonical under /read and lowercased for stable URLs.
  const lowerPath = `/${LIBRARY_BASE_SEGMENT}/${segments.map((s) => s.toLowerCase()).join('/')}`
  return redirectTo(req, lowerPath)
}

export const config = {
  // Run middleware for all paths at root (we filter inside middleware)
  matcher: '/:path*',
}
