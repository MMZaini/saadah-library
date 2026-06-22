import path from 'node:path'
import { NextRequest, NextResponse } from 'next/server'
import { rasterizePageToWebp } from '@/lib/data/scan-raster'
import { isAllowedScanPdfPath, snapScanImageWidth } from '@/lib/scan-image'

// Native canvas + pdf.js need the Node runtime (not Edge).
export const runtime = 'nodejs'

// Resolve the origin used to fetch this deployment's own static PDF. We trust the
// Vercel-provided deployment URL (never client headers — those are spoofable and
// would let a request point the fetch at an arbitrary host), and fall back to the
// request origin only for local dev.
function resolveOrigin(request: NextRequest): string {
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
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

  try {
    const webp = await rasterizePageToWebp({
      pdfUrl: `${origin}${pdf}`,
      // pdf.js' Node decoders must load from the local filesystem (file://), so the
      // small pdf.js asset dir is read from disk; only the big PDF is fetched.
      assetDir: path.join(process.cwd(), 'public', 'pdf'),
      page,
      width,
    })

    return new NextResponse(new Uint8Array(webp), {
      headers: {
        'Content-Type': 'image/webp',
        // The dataset is immutable and content-addressed by (pdf, page, width),
        // so the rendered image never changes — let the browser/CDN keep it.
        'Cache-Control': 'public, max-age=31536000, s-maxage=31536000, immutable',
      },
    })
  } catch (err) {
    console.error('scan-page rasterize failed', { pdf, page, width, err })
    return NextResponse.json({ error: 'Could not render page' }, { status: 500 })
  }
}
