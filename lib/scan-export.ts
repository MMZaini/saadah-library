// Canvas composition + image export for the /scans studio. Browser-only.
//
// Highlights use a "multiply" composite so a strong colour sits over the white
// page while dark text underneath stays dark — the FastStone-capture look. The
// same model drives both the on-screen overlay and these exported images, so
// what you draw is what you get.
import JSZip from 'jszip'
import { renderPage, scaleForWidth, type PDFDocumentProxy } from './pdf-engine'
import { drawHighlights, type Highlight } from './scan-annotations'

export {
  drawHighlights,
  HIGHLIGHT_COLORS,
  UNDERLINE_COLORS,
  type Highlight,
} from './scan-annotations'

export type ExportLayout = 'each' | 'page-cover' | 'all-cover'
export type ExportFormat = 'png' | 'jpg'
export type ExportDelivery = 'zip' | 'separate'
export type ExportCover = { kind: 'image'; src: string } | { kind: 'page'; pageNumber: number }

export interface ExportOptions {
  layout: ExportLayout
  format: ExportFormat
  delivery: ExportDelivery
  showBadge: boolean
  /** Image cover URL or a PDF page to render as the cover panel. */
  cover: ExportCover | null
  /** Slug used to name downloaded files, e.g. "al-kafi-volume-1". */
  fileBaseName: string
}

const EXPORT_PAGE_WIDTH = 1500 // px target width per rendered page
const COVER_HEIGHT_RATIO = 0.55 // cover height as a fraction of page height
const GAP_RATIO = 0.035 // gap between page and cover / between pages
const PANEL_PAD_RATIO = 0.05 // horizontal padding inside the cover panel

// Browsers cap canvas size; exceeding it yields a blank/failed canvas (which is
// how the "all pages + cover" collage used to crash for ~11+ pages). Keep both
// the longest side and the total area within a conservative cross-browser bound.
const MAX_CANVAS_DIM = 16384
const MAX_CANVAS_AREA = MAX_CANVAS_DIM * MAX_CANVAS_DIM

/** Largest scale ≤ 1 that keeps a width×height canvas within browser limits. */
function fitCanvasScale(width: number, height: number): number {
  if (width <= 0 || height <= 0) return 1
  return Math.min(
    1,
    MAX_CANVAS_DIM / width,
    MAX_CANVAS_DIM / height,
    Math.sqrt(MAX_CANVAS_AREA / (width * height)),
  )
}

function createCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(width))
  canvas.height = Math.max(1, Math.round(height))
  return canvas
}

/** Releases a canvas's backing store so large intermediates don't pile up. */
function freeCanvas(canvas: HTMLCanvasElement): void {
  canvas.width = 0
  canvas.height = 0
}

function context2d(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not acquire a 2D canvas context')
  return ctx
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`))
    img.src = src
  })
}

/** Draws an "n/total" pill in the top-right corner. */
export function drawBadge(ctx: CanvasRenderingContext2D, text: string, canvasWidth: number): void {
  const fontSize = Math.max(18, Math.round(canvasWidth * 0.024))
  const padX = Math.round(fontSize * 0.7)
  const padY = Math.round(fontSize * 0.42)
  const margin = Math.round(canvasWidth * 0.018)

  ctx.save()
  ctx.font = `600 ${fontSize}px ui-sans-serif, system-ui, sans-serif`
  ctx.textBaseline = 'middle'
  ctx.textAlign = 'center'
  const textW = ctx.measureText(text).width
  const boxW = textW + padX * 2
  const boxH = fontSize + padY * 2
  const x = ctx.canvas.width - margin - boxW
  const y = margin

  ctx.fillStyle = 'rgba(17, 17, 17, 0.72)'
  if (typeof ctx.roundRect === 'function') {
    ctx.beginPath()
    ctx.roundRect(x, y, boxW, boxH, boxH / 2)
    ctx.fill()
  } else {
    ctx.fillRect(x, y, boxW, boxH)
  }
  ctx.fillStyle = '#ffffff'
  ctx.fillText(text, x + boxW / 2, y + boxH / 2 + 1)
  ctx.restore()
}

/** Renders a single page to a fresh canvas, with highlights and optional badge. */
async function buildPageCanvas(
  doc: PDFDocumentProxy,
  pageNum: number,
  highlights: Highlight[],
  badgeText: string | null,
): Promise<HTMLCanvasElement> {
  const page = await doc.getPage(pageNum)
  try {
    const scale = scaleForWidth(page, EXPORT_PAGE_WIDTH)
    const canvas = createCanvas(1, 1)
    await renderPage(page, canvas, scale).promise
    const ctx = context2d(canvas)
    drawHighlights(ctx, highlights, canvas.width, canvas.height)
    if (badgeText) drawBadge(ctx, badgeText, canvas.width)
    return canvas
  } finally {
    page.cleanup()
  }
}

type CoverPanelSource = HTMLImageElement | HTMLCanvasElement

function coverPanelWidth(panelHeight: number, cover: CoverPanelSource): number {
  const aspect = cover.width / cover.height
  const drawH = Math.round(panelHeight * COVER_HEIGHT_RATIO)
  const drawW = Math.round(drawH * aspect)
  const pad = Math.round(EXPORT_PAGE_WIDTH * PANEL_PAD_RATIO)
  return drawW + pad * 2
}

function drawCoverPanel(
  ctx: CanvasRenderingContext2D,
  x: number,
  panelWidth: number,
  panelHeight: number,
  cover: CoverPanelSource,
): void {
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(x, 0, panelWidth, panelHeight)
  const aspect = cover.width / cover.height
  let drawH = Math.round(panelHeight * COVER_HEIGHT_RATIO)
  let drawW = Math.round(drawH * aspect)
  const maxW = panelWidth - Math.round(EXPORT_PAGE_WIDTH * PANEL_PAD_RATIO) * 2
  if (drawW > maxW) {
    drawW = maxW
    drawH = Math.round(maxW / aspect)
  }
  const dx = x + Math.round((panelWidth - drawW) / 2)
  const dy = Math.round((panelHeight - drawH) / 2)
  ctx.drawImage(cover, dx, dy, drawW, drawH)
}

/** [ page | cover ] side-by-side. Downscales if the result exceeds canvas limits. */
function composeCollage(pageCanvas: HTMLCanvasElement, cover: CoverPanelSource): HTMLCanvasElement {
  const gap = Math.round(pageCanvas.width * GAP_RATIO)
  const panelW = coverPanelWidth(pageCanvas.height, cover)
  const totalW = pageCanvas.width + gap + panelW
  const totalH = pageCanvas.height
  const scale = fitCanvasScale(totalW, totalH)

  const out = createCanvas(totalW * scale, totalH * scale)
  const ctx = context2d(out)
  if (scale !== 1) ctx.scale(scale, scale)
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, totalW, totalH)
  ctx.drawImage(pageCanvas, 0, 0)
  drawCoverPanel(ctx, pageCanvas.width + gap, panelW, totalH, cover)
  return out
}

/**
 * All pages in a left-to-right row, with an optional cover panel at the end.
 * Downscales the whole row to stay within browser canvas limits, and **consumes**
 * (frees) each page canvas as it is drawn so a large collage never holds every
 * full-resolution page in memory at once.
 */
function composeRow(
  pageCanvases: HTMLCanvasElement[],
  cover: CoverPanelSource | null,
): HTMLCanvasElement {
  const gap = Math.round(EXPORT_PAGE_WIDTH * GAP_RATIO)
  const maxH = Math.max(...pageCanvases.map((c) => c.height))
  const pagesWidth =
    pageCanvases.reduce((sum, c) => sum + c.width, 0) + gap * (pageCanvases.length - 1)
  const panelW = cover ? coverPanelWidth(maxH, cover) : 0
  const totalW = pagesWidth + (cover ? gap + panelW : 0)
  const scale = fitCanvasScale(totalW, maxH)

  const out = createCanvas(totalW * scale, maxH * scale)
  const ctx = context2d(out)
  if (scale !== 1) ctx.scale(scale, scale)
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, totalW, maxH)

  let x = 0
  for (const c of pageCanvases) {
    ctx.drawImage(c, x, 0)
    x += c.width + gap
    freeCanvas(c) // input no longer needed — keep peak memory bounded
  }
  if (cover) drawCoverPanel(ctx, x, panelW, maxH, cover)
  return out
}

function canvasToBlob(canvas: HTMLCanvasElement, format: ExportFormat): Promise<Blob> {
  const type = format === 'png' ? 'image/png' : 'image/jpeg'
  const quality = format === 'png' ? undefined : 0.92
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Canvas export failed'))),
      type,
      quality,
    )
  })
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  // Revoke after the click has been processed.
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

interface NamedBlob {
  blob: Blob
  filename: string
}

async function deliver(items: NamedBlob[], options: ExportOptions): Promise<void> {
  if (items.length === 1) {
    triggerDownload(items[0].blob, items[0].filename)
    return
  }
  if (options.delivery === 'zip') {
    const zip = new JSZip()
    for (const item of items) zip.file(item.filename, item.blob)
    const blob = await zip.generateAsync({ type: 'blob' })
    triggerDownload(blob, `${options.fileBaseName}-scans.zip`)
    return
  }
  // Sequential separate downloads — small gaps so the browser keeps them all.
  for (const item of items) {
    triggerDownload(item.blob, item.filename)
    await wait(300)
  }
}

async function buildCover(
  doc: PDFDocumentProxy,
  cover: ExportCover | null,
): Promise<CoverPanelSource | null> {
  if (!cover) return null
  if (cover.kind === 'image') return loadImage(cover.src)
  return buildPageCanvas(doc, cover.pageNumber, [], null)
}

/**
 * Renders the selected pages, composes them per the chosen layout, and triggers
 * the download(s). `pageNumbers` is used as-is; sort upstream for stable order.
 */
export async function exportPages(
  doc: PDFDocumentProxy,
  pageNumbers: number[],
  highlightsByPage: Map<number, Highlight[]>,
  options: ExportOptions,
): Promise<void> {
  if (pageNumbers.length === 0) return
  const ext = options.format
  const total = pageNumbers.length
  const cover = await buildCover(doc, options.cover)

  const badgeFor = (index: number): string | null =>
    options.showBadge && total > 1 ? `${index + 1}/${total}` : null

  // A page-rendered cover is reused across pages; free it once at the end.
  const releaseCover = () => {
    if (cover instanceof HTMLCanvasElement) freeCanvas(cover)
  }

  if (options.layout === 'all-cover') {
    const canvases: HTMLCanvasElement[] = []
    for (let i = 0; i < pageNumbers.length; i++) {
      const pageNum = pageNumbers[i]
      canvases.push(
        await buildPageCanvas(doc, pageNum, highlightsByPage.get(pageNum) ?? [], badgeFor(i)),
      )
    }
    const composed = composeRow(canvases, cover) // frees each page canvas as it draws
    const blob = await canvasToBlob(composed, options.format)
    freeCanvas(composed)
    releaseCover()
    triggerDownload(blob, `${options.fileBaseName}-collage.${ext}`)
    return
  }

  const items: NamedBlob[] = []
  for (let i = 0; i < pageNumbers.length; i++) {
    const pageNum = pageNumbers[i]
    const pageCanvas = await buildPageCanvas(
      doc,
      pageNum,
      highlightsByPage.get(pageNum) ?? [],
      badgeFor(i),
    )
    if (options.layout === 'page-cover' && cover) {
      const collage = composeCollage(pageCanvas, cover)
      const blob = await canvasToBlob(collage, options.format)
      freeCanvas(collage)
      items.push({ blob, filename: `${options.fileBaseName}-p${pageNum}-cover.${ext}` })
    } else {
      const blob = await canvasToBlob(pageCanvas, options.format)
      items.push({ blob, filename: `${options.fileBaseName}-p${pageNum}.${ext}` })
    }
    freeCanvas(pageCanvas)
  }
  releaseCover()
  await deliver(items, options)
}
