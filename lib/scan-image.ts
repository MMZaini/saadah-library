// Shared (client + server) helpers for the on-demand page-image pipeline.
//
// Mobile browsers can't render these large JBIG2 scans with client-side pdf.js
// (the page goes white — see [[narrators-pdf-mobile-white]]), so on constrained
// devices we display server-rasterized WebP page images instead. This module is
// the contract between the <img> consumers and the `/api/scan-page` route: it
// fixes the allowed page widths (so the CDN cache key is stable) and whitelists
// the PDFs that may be rasterized (so the route can never be pointed at an
// arbitrary URL/file).

import { withBasePath } from './assets'
import { getAllKnownPdfPaths } from './book-pdfs'
import { getAllKhoeiRijalPdfPaths } from './rijal-pdfs'

// Bump whenever the server rendering changes so old cache entries are bypassed.
// Page images are served `immutable, max-age=1y`, so without this a page that ever
// rendered wrong (e.g. the blank images produced before the Vercel decoder fix)
// would stay cached — in the CDN AND in each visitor's browser — effectively
// forever. Versioning the URL makes the fix take effect without manual purges.
const SCAN_IMAGE_VERSION = 2

// Discrete render widths. Requests snap to one of these so every page has only a
// handful of cacheable variants rather than a unique image per viewport/zoom.
// 280 serves the sidebar thumbnails; the rest serve the main viewer at 1×–3× zoom.
export const SCAN_IMAGE_WIDTHS = [280, 560, 900, 1240, 1600, 2000] as const
const MAX_WIDTH = SCAN_IMAGE_WIDTHS[SCAN_IMAGE_WIDTHS.length - 1]

/** Snap a desired CSS×DPR width up to the nearest supported render width. */
export function snapScanImageWidth(target: number): number {
  for (const w of SCAN_IMAGE_WIDTHS) if (target <= w) return w
  return MAX_WIDTH
}

// Every PDF the studio/narrator viewers can open. Frozen at module load from the
// existing path configs so the route shares one source of truth with the UI.
const ALLOWED_PDF_PATHS: ReadonlySet<string> = new Set([
  ...getAllKnownPdfPaths(),
  ...getAllKhoeiRijalPdfPaths(),
])

/** True if `path` is a known, rasterizable PDF (unprefixed public path). */
export function isAllowedScanPdfPath(path: string | null | undefined): path is string {
  return typeof path === 'string' && ALLOWED_PDF_PATHS.has(path)
}

/**
 * URL for a single rasterized page. `pdfPath` is the unprefixed public path
 * (e.g. `/pdfs/rijal/khoei/volume-01.pdf`); `width` is snapped to a supported
 * size. The result is basePath-prefixed so it routes through `/read`.
 */
export function buildScanPageImageUrl(pdfPath: string, page: number, width: number): string {
  const params = new URLSearchParams({
    pdf: pdfPath,
    page: String(Math.max(1, Math.floor(page))),
    w: String(snapScanImageWidth(width)),
    v: String(SCAN_IMAGE_VERSION),
  })
  return `${withBasePath('/api/scan-page')}?${params.toString()}`
}
