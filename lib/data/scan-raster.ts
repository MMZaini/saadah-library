// Server-only: rasterize a single PDF page to a WebP buffer for the on-demand
// `/api/scan-page` route. Runs in the Node.js runtime (native `@napi-rs/canvas`).
//
// Why this exists: large JBIG2 scans can't be rendered by client pdf.js on mobile
// (see [[narrators-pdf-mobile-white]]). Rendering them once on the server and
// letting the CDN cache the immutable result gives phones a plain <img> that
// always paints. The big PDFs stay static assets (never bundled into the
// function — they exceed the size limit); we fetch only the bytes we need.
import 'server-only'
import fs from 'node:fs'
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
  /** 1-based page number. */
  page: number
  /** Target image width in pixels. */
  width: number
}

// pdf.js' Node asset loader resolves the JBIG2 decoder via the ESM loader, which
// only accepts file:// URLs (trailing slash). `require.resolve` can't be used (the
// bundler rewrites it to a numeric module id), so we locate pdf.js' bundled
// `wasm/` (+ cmaps/standard_fonts) by probing the paths where the traced files land
// at runtime. These are force-included via next.config `outputFileTracingIncludes`.
const safeExists = (p: string): boolean => {
  try {
    return fs.existsSync(p)
  } catch {
    return false
  }
}

function assetCandidates(): string[] {
  const cwd = process.cwd()
  return [
    path.join(cwd, 'node_modules', 'pdfjs-dist'),
    path.join(cwd, 'public', 'pdf'),
    // Vercel can run the function from a nested dir; the traced node_modules then
    // sits a couple levels up. Probe those too rather than assume cwd.
    path.join(cwd, '..', 'node_modules', 'pdfjs-dist'),
    path.join(cwd, '..', '..', 'node_modules', 'pdfjs-dist'),
  ]
}

let cachedAssetDir: string | null = null
function pdfjsAssetDir(): string {
  if (cachedAssetDir) return cachedAssetDir
  const found = assetCandidates().find((c) =>
    safeExists(path.join(c, 'wasm', 'jbig2_nowasm_fallback.js')),
  )
  cachedAssetDir = found ?? assetCandidates()[0]
  return cachedAssetDir
}

function fileDirUrl(...segments: string[]): string {
  return pathToFileURL(path.join(...segments) + path.sep).href
}

/** Diagnostics for `?debug=1`: confirms the decoder file is present AND importable. */
export async function getAssetDiagnostics(): Promise<Record<string, unknown>> {
  const candidates = assetCandidates().map((c) => ({
    dir: c,
    fallback: safeExists(path.join(c, 'wasm', 'jbig2_nowasm_fallback.js')),
    wasm: safeExists(path.join(c, 'wasm', 'jbig2.wasm')),
  }))
  const chosen = pdfjsAssetDir()
  const fbUrl = pathToFileURL(path.join(chosen, 'wasm', 'jbig2_nowasm_fallback.js')).href
  let importTest: string
  try {
    // Mirrors how pdf.js loads the JS decoder in Node; webpackIgnore keeps the
    // bundler from trying to resolve the runtime file:// URL at build time.
    await import(/* webpackIgnore: true */ fbUrl)
    importTest = 'ok'
  } catch (err) {
    importTest = err instanceof Error ? `${err.name}: ${err.message}` : String(err)
  }
  return { cwd: process.cwd(), chosen, fbUrl, importTest, candidates }
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

async function loadDocument(pdfUrl: string): Promise<PDFDocumentProxy> {
  const cached = docCache.get(pdfUrl)
  if (cached) {
    cached.used = Date.now()
    return cached.doc
  }

  const taskPromise = (async () => {
    // `redirect: 'follow'` lets an apex→www production redirect resolve; the timeout
    // stops a stuck fetch from holding the function open until the platform kills it.
    const res = await fetch(pdfUrl, { redirect: 'follow', signal: AbortSignal.timeout(20000) })
    if (!res.ok) throw new Error(`Failed to fetch PDF (${res.status}) from ${pdfUrl}`)
    const data = new Uint8Array(await res.arrayBuffer())
    const pdfjs = await getPdfjs()
    const assetDir = pdfjsAssetDir()
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

  const doc = await loadDocument(pdfUrl)
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
