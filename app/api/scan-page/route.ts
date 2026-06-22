import { NextRequest, NextResponse } from 'next/server'
import { getAssetDiagnostics, rasterizePageToWebp } from '@/lib/data/scan-raster'
import { isAllowedScanPdfPath, snapScanImageWidth } from '@/lib/scan-image'

// Native canvas + pdf.js need the Node runtime (not Edge).
export const runtime = 'nodejs'

// Resolve the origin to fetch this deployment's own static PDF over HTTP.
//
// Must be a PUBLIC production alias. NOT `VERCEL_URL`: that is the per-deployment
// `*.vercel.app` URL, which Vercel Deployment Protection guards — a server-side
// self-fetch there returns 401 ("Failed to fetch PDF"), which is what made every
// page 500 in production. `VERCEL_PROJECT_PRODUCTION_URL` is the public production
// domain (any redirect to the canonical host is followed by fetch). It is a Vercel
// system value, not a client header, so there is no SSRF surface. Falls back to the
// request origin for local dev (where neither env var is set).
function resolveOrigin(request: NextRequest): string {
  const productionHost = process.env.VERCEL_PROJECT_PRODUCTION_URL
  if (productionHost) return `https://${productionHost}`
  return request.nextUrl.origin
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams
  const pdf = params.get('pdf')
  const pageRaw = Number(params.get('page'))
  const widthRaw = Number(params.get('w'))

  if (!isAllowedScanPdfPath(pdf)) {
    return NextResponse.json({ error: 'Unknown PDF' }, { status: 400 })
  }
  if (!Number.isFinite(pageRaw) || pageRaw < 1) {
    return NextResponse.json({ error: 'Invalid page' }, { status: 400 })
  }

  const page = Math.floor(pageRaw)
  const width = snapScanImageWidth(Number.isFinite(widthRaw) && widthRaw > 0 ? widthRaw : 1240)
  const origin = resolveOrigin(request)
  // `?debug=1` reports the server-side asset/error state so a production-only
  // failure (a serverless file-tracing gap, a blank decode) can be read with one
  // request instead of a deploy cycle. It exposes only internal paths/error text.
  const debug = params.get('debug') === '1'
  if (debug) {
    return NextResponse.json({ ok: true, ...(await getAssetDiagnostics()) })
  }

  try {
    const webp = await rasterizePageToWebp({ pdfUrl: `${origin}${pdf}`, page, width })

    return new NextResponse(new Uint8Array(webp), {
      headers: {
        'Content-Type': 'image/webp',
        // The dataset is immutable and content-addressed by (pdf, page, width),
        // so the rendered image never changes — let the browser/CDN keep it.
        'Cache-Control': 'public, max-age=31536000, s-maxage=31536000, immutable',
      },
    })
  } catch (err) {
    const detail = err instanceof Error ? `${err.name}: ${err.message}` : String(err)
    console.error(`scan-page rasterize failed: ${detail}`, { pdf, page, width })
    return NextResponse.json({ error: 'Could not render page' }, { status: 500 })
  }
}
