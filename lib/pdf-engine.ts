// Client-only pdf.js wrapper. Imported exclusively from the /scans studio, which
// is mounted with `ssr: false`, so this never runs during server rendering.
// All assets (worker, cmaps, fonts, wasm, icc) are self-hosted under /pdf — no
// external/CDN requests — satisfying the app's no-external-calls constraint.
import * as pdfjsLib from 'pdfjs-dist'
import type { PDFDocumentProxy, PDFPageProxy, RenderTask } from 'pdfjs-dist'
import { withBasePath } from './assets'

let workerConfigured = false

function ensureWorker(): void {
  if (workerConfigured) return
  // Same-origin .mjs worker — pdf.js v6 loads it as a module worker.
  pdfjsLib.GlobalWorkerOptions.workerSrc = withBasePath('/pdf/pdf.worker.min.mjs')
  workerConfigured = true
}

const PDF_ASSET_OPTIONS = {
  cMapUrl: withBasePath('/pdf/cmaps/'),
  cMapPacked: true,
  standardFontDataUrl: withBasePath('/pdf/standard_fonts/'),
  wasmUrl: withBasePath('/pdf/wasm/'),
  iccUrl: withBasePath('/pdf/iccs/'),
} as const

export type { PDFDocumentProxy, PDFPageProxy, RenderTask }

export interface LoadHandle {
  promise: Promise<PDFDocumentProxy>
  /** Aborts the load (and frees resources) if still in flight. */
  destroy: () => void
}

export type PdfLoadSource = string | Uint8Array

export function loadPdf(source: PdfLoadSource): LoadHandle {
  ensureWorker()
  const task = pdfjsLib.getDocument(
    typeof source === 'string'
      ? { url: source, ...PDF_ASSET_OPTIONS }
      : { data: source, ...PDF_ASSET_OPTIONS },
  )
  return {
    promise: task.promise,
    destroy: () => {
      void task.destroy()
    },
  }
}

/**
 * Renders a page into `canvas` at the given scale and returns the live
 * RenderTask so callers can cancel it (e.g. when the user flips pages quickly).
 * The canvas is pre-filled white so transparent page margins never export black.
 */
export function renderPage(
  page: PDFPageProxy,
  canvas: HTMLCanvasElement,
  scale: number,
): RenderTask {
  const viewport = page.getViewport({ scale })
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Could not acquire a 2D canvas context')

  canvas.width = Math.max(1, Math.ceil(viewport.width))
  canvas.height = Math.max(1, Math.ceil(viewport.height))
  context.save()
  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.restore()

  return page.render({ canvas, viewport })
}

/** Scale needed for a page to render at `targetCssWidth` CSS pixels (DPR aside). */
export function scaleForWidth(page: PDFPageProxy, targetCssWidth: number): number {
  const base = page.getViewport({ scale: 1 })
  return targetCssWidth / base.width
}

/** Intrinsic (scale-1) dimensions of a page, in PDF units. */
export function pageDimensions(page: PDFPageProxy): { width: number; height: number } {
  const base = page.getViewport({ scale: 1 })
  return { width: base.width, height: base.height }
}
