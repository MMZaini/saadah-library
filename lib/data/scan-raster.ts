// Server-only: rasterize a single PDF page to a WebP buffer for the on-demand
// `/api/scan-page` route. Runs in the Node.js runtime (native `@napi-rs/canvas`).
//
// Why this exists: large JBIG2 scans can't be rendered by client pdf.js on mobile
// (see [[narrators-pdf-mobile-white]]). Rendering them once on the server and
// letting the CDN cache the immutable result gives phones a plain <img> that
// always paints. The big PDFs stay static assets (never bundled into the
// function — they exceed the size limit); we fetch only the bytes we need.
import 'server-only'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { createCanvas, GlobalFonts, DOMMatrix, Path2D, ImageData } from '@napi-rs/canvas'

// pdf.js expects a few DOM globals; @napi-rs/canvas provides compatible ones.
const g = globalThis as Record<string, unknown>
g.DOMMatrix ??= DOMMatrix
g.Path2D ??= Path2D
g.ImageData ??= ImageData
void GlobalFonts

type PdfjsModule = typeof import('pdfjs-dist/legacy/build/pdf.mjs')
type PdfLoadingTask = ReturnType<PdfjsModule['getDocument']>
type PDFDocumentProxy = Awaited<PdfLoadingTask['promise']>

let pdfjsPromise: Promise<PdfjsModule> | null = null
function getPdfjs(): Promise<PdfjsModule> {
  // Loaded lazily so the heavy module is only pulled in when a page is requested.
  pdfjsPromise ??= import('pdfjs-dist/legacy/build/pdf.mjs')
  return pdfjsPromise
}

export interface RasterizeOptions {
  /** Absolute URL of the source PDF (a same-origin static asset). */
  pdfUrl: string
  /** Filesystem dir holding the pdf.js asset subdirs (cmaps/, standard_fonts/, wasm/). */
  assetDir: string
  /** 1-based page number. */
  page: number
  /** Target image width in pixels. */
  width: number
}

// pdf.js resolves its asset/decoder URLs in Node via the ESM loader + fetch, which
// only accept file:// (not http://) — so these must be local filesystem URLs with
// a trailing slash. The JBIG2 decoder these scans need is loaded this way.
function fileDirUrl(...segments: string[]): string {
  return pathToFileURL(path.join(...segments) + path.sep).href
}

interface DocEntry {
  taskPromise: Promise<PdfLoadingTask>
  doc: Promise<PDFDocumentProxy>
  used: number
}

// Keep a couple of parsed documents warm so adjacent-page requests (a narrator
// range, a scan selection) don't re-fetch + re-parse the whole PDF each time.
const MAX_DOCS = 3
const docCache = new Map<string, DocEntry>()

// Small LRU of finished page images for repeat hits inside a warm instance
// (the CDN handles cross-request caching; this just avoids redundant decodes).
const MAX_PAGE_CACHE = 48
const pageCache = new Map<string, Buffer>()

async function loadDocument(pdfUrl: string, assetDir: string): Promise<PDFDocumentProxy> {
  const cached = docCache.get(pdfUrl)
  if (cached) {
    cached.used = Date.now()
    return cached.doc
  }

  const taskPromise = (async () => {
    const res = await fetch(pdfUrl)
    if (!res.ok) throw new Error(`Failed to fetch PDF (${res.status})`)
    const data = new Uint8Array(await res.arrayBuffer())
    const pdfjs = await getPdfjs()
    return pdfjs.getDocument({
      data,
      cMapUrl: fileDirUrl(assetDir, 'cmaps'),
      cMapPacked: true,
      standardFontDataUrl: fileDirUrl(assetDir, 'standard_fonts'),
      wasmUrl: fileDirUrl(assetDir, 'wasm'),
      isOffscreenCanvasSupported: false,
    })
  })()
  const docPromise = taskPromise.then((task) => task.promise)

  docCache.set(pdfUrl, { taskPromise, doc: docPromise, used: Date.now() })

  // Evict the least-recently-used document if we are over budget.
  if (docCache.size > MAX_DOCS) {
    let oldestKey: string | null = null
    let oldest = Infinity
    for (const [key, entry] of docCache) {
      if (entry.used < oldest) {
        oldest = entry.used
        oldestKey = key
      }
    }
    if (oldestKey && oldestKey !== pdfUrl) {
      const evicted = docCache.get(oldestKey)
      docCache.delete(oldestKey)
      evicted?.taskPromise.then((task) => task.destroy()).catch(() => {})
    }
  }

  try {
    return await docPromise
  } catch (err) {
    docCache.delete(pdfUrl)
    throw err
  }
}

export async function rasterizePageToWebp({
  pdfUrl,
  assetDir,
  page,
  width,
}: RasterizeOptions): Promise<Buffer> {
  const cacheKey = `${pdfUrl}|${page}|${width}`
  const hit = pageCache.get(cacheKey)
  if (hit) {
    // Refresh LRU position.
    pageCache.delete(cacheKey)
    pageCache.set(cacheKey, hit)
    return hit
  }

  const doc = await loadDocument(pdfUrl, assetDir)
  const pageNum = Math.min(Math.max(1, Math.floor(page)), doc.numPages)
  const pdfPage = await doc.getPage(pageNum)
  try {
    const base = pdfPage.getViewport({ scale: 1 })
    const scale = width / base.width
    const viewport = pdfPage.getViewport({ scale })
    const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height))
    const ctx = canvas.getContext('2d')
    // Pre-fill white so transparent scan margins never export black.
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    // @napi-rs/canvas is API-compatible with the browser canvas pdf.js expects.
    await pdfPage.render({ canvas: canvas as unknown as HTMLCanvasElement, viewport }).promise
    const webp = await canvas.encode('webp', 82)

    pageCache.set(cacheKey, webp)
    if (pageCache.size > MAX_PAGE_CACHE) {
      const oldest = pageCache.keys().next().value
      if (oldest !== undefined) pageCache.delete(oldest)
    }
    return webp
  } finally {
    pdfPage.cleanup()
  }
}
