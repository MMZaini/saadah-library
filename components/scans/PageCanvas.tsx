'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { PDFPageProxy, RenderTask, PDFDocumentProxy } from '@/lib/pdf-engine'
import { renderPage, pageDimensions } from '@/lib/pdf-engine'
import { pdfRenderScheduler, RENDER_PRIORITY } from '@/lib/pdf-render-queue'
import { isConstrainedDevice } from '@/lib/device'
import type { Highlight } from '@/lib/scan-export'
import { cn } from '@/lib/utils'
import HighlightOverlay from './HighlightOverlay'

const CONTAINER_PADDING = 48 // px breathing room around the page
const MAX_FIT_WIDTH = 1100 // cap page width at zoom = 1 on large screens
const DISPLAY_BASE_SCALE = 0.8 // 100% now matches the old 80% view.
const FALLBACK_ASPECT = 1.4 // assumed page height/width before real dims load

// Mobile Safari caps total canvas memory, so on constrained devices we (a) render
// far fewer pages ahead of the viewport, (b) cap the device-pixel-ratio, and (c)
// cap each canvas's backing-store area. Together these keep peak canvas memory
// well under the budget that otherwise makes scanned pages render white.
const CONSTRAINED = isConstrainedDevice()
const RENDER_ROOT_MARGIN = CONSTRAINED ? '200px 0px' : '700px 0px'
const MAX_RENDER_DPR = 2 // plenty sharp for a bilevel scan; halves backing-store size vs DPR 3
const MAX_CANVAS_PIXELS = 4_000_000 // ceiling on a single output canvas (constrained devices)

export type ScanTool = 'draw' | 'select'

interface PageViewProps {
  doc: PDFDocumentProxy
  pageNum: number
  isActive: boolean
  containerWidth: number
  displayZoom: number
  renderZoom: number
  tool: ScanTool
  activeColor: string
  highlights: Highlight[]
  selectedHighlightId: string | null
  onActivate: (pageNum: number) => void
  onAddHighlight: (pageNum: number, rect: { x: number; y: number; w: number; h: number }) => void
  onSelectHighlight: (id: string | null) => void
  onUpdateHighlight: (id: string, patch: Partial<Pick<Highlight, 'x' | 'y' | 'w' | 'h'>>) => void
  onDeleteHighlight: (id: string) => void
}

interface PageCanvasProps {
  doc: PDFDocumentProxy
  pageNums: number[]
  activePage: number
  zoom: number
  tool: ScanTool
  activeColor: string
  highlightsByPage: Map<number, Highlight[]>
  selectedHighlightId: string | null
  onActivatePage: (pageNum: number) => void
  onAddHighlight: (pageNum: number, rect: { x: number; y: number; w: number; h: number }) => void
  onSelectHighlight: (id: string | null) => void
  onUpdateHighlight: (id: string, patch: Partial<Pick<Highlight, 'x' | 'y' | 'w' | 'h'>>) => void
  onDeleteHighlight: (id: string) => void
}

function PageView({
  doc,
  pageNum,
  isActive,
  containerWidth,
  displayZoom,
  renderZoom,
  tool,
  activeColor,
  highlights,
  selectedHighlightId,
  onActivate,
  onAddHighlight,
  onSelectHighlight,
  onUpdateHighlight,
  onDeleteHighlight,
}: PageViewProps) {
  const sectionRef = useRef<HTMLElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const isActiveRef = useRef(isActive)
  isActiveRef.current = isActive

  const [dims, setDims] = useState<{ width: number; height: number } | null>(null)
  const [inView, setInView] = useState(false)

  // Cheap structural pass — learn the page's intrinsic size so its scroll space
  // can be reserved immediately. No image is decoded here.
  useEffect(() => {
    let cancelled = false
    void (async () => {
      const page = await doc.getPage(pageNum)
      try {
        if (!cancelled) setDims(pageDimensions(page))
      } finally {
        page.cleanup()
      }
    })()
    return () => {
      cancelled = true
    }
  }, [doc, pageNum])

  const fitWidth = containerWidth
    ? Math.max(1, Math.min(containerWidth - CONTAINER_PADDING, MAX_FIT_WIDTH))
    : 0

  // CSS size follows the live zoom so the page reflows instantly while zooming.
  const display = useMemo(() => {
    if (!dims || !fitWidth) return null
    const scale = (fitWidth / dims.width) * displayZoom * DISPLAY_BASE_SCALE
    return { w: scale * dims.width, h: scale * dims.height }
  }, [dims, fitWidth, displayZoom])

  // Reserve realistic space before the real dimensions arrive so the viewport
  // observer stays accurate (collapsed pages would all read as "in view").
  const reserved =
    display ?? (fitWidth ? { w: fitWidth * displayZoom * DISPLAY_BASE_SCALE, h: 0 } : null)
  const reservedHeight = display ? display.h : reserved ? reserved.w * FALLBACK_ASPECT : 0

  // Only decode/render pages near the viewport.
  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) setInView(entry.isIntersecting)
      },
      { root: el.closest('[data-page-scroll]'), rootMargin: RENDER_ROOT_MARGIN },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  // Paint the page (at the debounced render zoom) once it is near the viewport.
  useEffect(() => {
    if (!inView || !dims || !fitWidth) return
    const controller = new AbortController()
    let task: RenderTask | null = null

    pdfRenderScheduler
      .run(
        async (signal) => {
          let page: PDFPageProxy | null = await doc.getPage(pageNum)
          const canvas = canvasRef.current
          if (signal?.aborted || !canvas) {
            page.cleanup()
            return
          }
          const displayScale = (fitWidth / dims.width) * renderZoom * DISPLAY_BASE_SCALE
          const rawDpr = window.devicePixelRatio || 1
          const dpr = CONSTRAINED ? Math.min(rawDpr, MAX_RENDER_DPR) : rawDpr
          let renderScale = displayScale * dpr
          // Keep the backing store under mobile Safari's per-canvas budget. The
          // page reflows to its CSS size regardless, so this only trades a little
          // sharpness for a canvas that actually paints instead of going white.
          if (CONSTRAINED) {
            const area = renderScale * dims.width * (renderScale * dims.height)
            if (area > MAX_CANVAS_PIXELS) renderScale *= Math.sqrt(MAX_CANVAS_PIXELS / area)
          }
          try {
            task = renderPage(page, canvas, renderScale)
            signal?.addEventListener('abort', () => task?.cancel(), { once: true })
            await task.promise
          } finally {
            page?.cleanup()
            page = null
          }
        },
        {
          priority: isActiveRef.current ? RENDER_PRIORITY.activePage : RENDER_PRIORITY.visiblePage,
          signal: controller.signal,
        },
      )
      .catch(() => {
        // Cancelled by a newer render / scroll-away — expected.
      })

    return () => controller.abort()
  }, [inView, dims, doc, pageNum, renderZoom, fitWidth])

  return (
    <section
      ref={sectionRef}
      className={cn(
        'relative h-fit transition-shadow',
        isActive && 'ring-2 ring-zinc-500/70 ring-offset-4 ring-offset-surface-1',
      )}
      style={reserved ? { width: reserved.w, height: reservedHeight } : undefined}
      aria-label={`Page ${pageNum}`}
    >
      <canvas
        ref={canvasRef}
        className="block rounded-sm shadow-xl"
        style={display ? { width: display.w, height: display.h } : undefined}
      />
      <HighlightOverlay
        pageNum={pageNum}
        tool={tool}
        activeColor={activeColor}
        highlights={highlights}
        selectedHighlightId={selectedHighlightId}
        onActivate={onActivate}
        onAddHighlight={onAddHighlight}
        onSelectHighlight={onSelectHighlight}
        onUpdateHighlight={onUpdateHighlight}
        onDeleteHighlight={onDeleteHighlight}
      />
      <span className="pointer-events-none absolute right-2 top-2 rounded bg-black/65 px-2 py-1 text-xs font-medium text-white">
        {pageNum}
      </span>
    </section>
  )
}

export default function PageCanvas({
  doc,
  pageNums,
  activePage,
  zoom,
  tool,
  activeColor,
  highlightsByPage,
  selectedHighlightId,
  onActivatePage,
  onAddHighlight,
  onSelectHighlight,
  onUpdateHighlight,
  onDeleteHighlight,
}: PageCanvasProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(0)
  const [renderZoom, setRenderZoom] = useState(zoom)

  // Track the available width so pages can fit-to-width and reflow on resize.
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      setContainerWidth(entries[0].contentRect.width)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Debounce the zoom used for the (expensive) re-render; the CSS size tracks
  // `zoom` instantly, so zooming feels immediate and only sharpens once settled.
  useEffect(() => {
    const id = setTimeout(() => setRenderZoom(zoom), 140)
    return () => clearTimeout(id)
  }, [zoom])

  return (
    <div ref={scrollRef} data-page-scroll className="min-h-0 flex-1 overflow-auto bg-surface-1 p-6">
      <div className="flex w-full flex-col items-center gap-8">
        {pageNums.map((pageNum) => (
          <PageView
            key={pageNum}
            doc={doc}
            pageNum={pageNum}
            isActive={pageNum === activePage}
            containerWidth={containerWidth}
            displayZoom={zoom}
            renderZoom={renderZoom}
            tool={tool}
            activeColor={activeColor}
            highlights={highlightsByPage.get(pageNum) ?? []}
            selectedHighlightId={selectedHighlightId}
            onActivate={onActivatePage}
            onAddHighlight={onAddHighlight}
            onSelectHighlight={onSelectHighlight}
            onUpdateHighlight={onUpdateHighlight}
            onDeleteHighlight={onDeleteHighlight}
          />
        ))}
      </div>
    </div>
  )
}
