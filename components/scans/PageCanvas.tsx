'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { PDFPageProxy, RenderTask, PDFDocumentProxy } from '@/lib/pdf-engine'
import { renderPage, pageDimensions } from '@/lib/pdf-engine'
import { pdfRenderScheduler, RENDER_PRIORITY } from '@/lib/pdf-render-queue'
import type { Highlight } from '@/lib/scan-export'
import { cn } from '@/lib/utils'

const CONTAINER_PADDING = 48 // px breathing room around the page
const MAX_FIT_WIDTH = 1100 // cap page width at zoom = 1 on large screens
const DISPLAY_BASE_SCALE = 0.8 // 100% now matches the old 80% view.
const MIN_DRAW_PX = 6 // ignore tiny accidental drags
const FALLBACK_ASPECT = 1.4 // assumed page height/width before real dims load
const RENDER_ROOT_MARGIN = '700px 0px' // render pages this far outside the viewport

export type ScanTool = 'draw' | 'erase'

interface DraftRect {
  x: number
  y: number
  w: number
  h: number
}

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
  onActivate: (pageNum: number) => void
  onAddHighlight: (pageNum: number, rect: { x: number; y: number; w: number; h: number }) => void
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
  onActivatePage: (pageNum: number) => void
  onAddHighlight: (pageNum: number, rect: { x: number; y: number; w: number; h: number }) => void
  onDeleteHighlight: (id: string) => void
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

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
  onActivate,
  onAddHighlight,
  onDeleteHighlight,
}: PageViewProps) {
  const sectionRef = useRef<HTMLElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const drawStartRef = useRef<{ x: number; y: number } | null>(null)
  const isActiveRef = useRef(isActive)
  isActiveRef.current = isActive

  const [dims, setDims] = useState<{ width: number; height: number } | null>(null)
  const [inView, setInView] = useState(false)
  const [draft, setDraft] = useState<DraftRect | null>(null)

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
          const dpr = window.devicePixelRatio || 1
          try {
            task = renderPage(page, canvas, displayScale * dpr)
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

  const localPoint = (e: React.PointerEvent) => {
    const rect = overlayRef.current!.getBoundingClientRect()
    return {
      x: clamp(e.clientX - rect.left, 0, rect.width),
      y: clamp(e.clientY - rect.top, 0, rect.height),
      rect,
    }
  }

  const handlePointerDown = (e: React.PointerEvent) => {
    onActivate(pageNum)
    if (tool !== 'draw' || e.button !== 0) return
    overlayRef.current?.setPointerCapture(e.pointerId)
    const { x, y } = localPoint(e)
    drawStartRef.current = { x, y }
    setDraft({ x, y, w: 0, h: 0 })
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    const start = drawStartRef.current
    if (!start) return
    const { x, y } = localPoint(e)
    setDraft({
      x: Math.min(start.x, x),
      y: Math.min(start.y, y),
      w: Math.abs(x - start.x),
      h: Math.abs(y - start.y),
    })
  }

  const handlePointerUp = (e: React.PointerEvent) => {
    const start = drawStartRef.current
    drawStartRef.current = null
    const rect = overlayRef.current?.getBoundingClientRect()
    if (start && draft && rect && draft.w >= MIN_DRAW_PX && draft.h >= MIN_DRAW_PX) {
      onAddHighlight(pageNum, {
        x: draft.x / rect.width,
        y: draft.y / rect.height,
        w: draft.w / rect.width,
        h: draft.h / rect.height,
      })
    }
    setDraft(null)
    overlayRef.current?.releasePointerCapture?.(e.pointerId)
  }

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
      <div
        ref={overlayRef}
        className="absolute inset-0"
        style={{
          touchAction: tool === 'draw' ? 'none' : 'auto',
          cursor: tool === 'draw' ? 'crosshair' : 'default',
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        {highlights.map((h) => (
          <div
            key={h.id}
            onClick={
              tool === 'erase'
                ? () => {
                    onActivate(pageNum)
                    onDeleteHighlight(h.id)
                  }
                : undefined
            }
            className={cn(
              'absolute',
              tool === 'erase'
                ? 'cursor-pointer outline outline-2 outline-red-500/70'
                : 'pointer-events-none',
            )}
            style={{
              left: `${h.x * 100}%`,
              top: `${h.y * 100}%`,
              width: `${h.w * 100}%`,
              height: `${h.h * 100}%`,
              backgroundColor: h.color,
              mixBlendMode: 'multiply',
            }}
          />
        ))}
        {draft && (
          <div
            className="pointer-events-none absolute"
            style={{
              left: draft.x,
              top: draft.y,
              width: draft.w,
              height: draft.h,
              backgroundColor: activeColor,
              mixBlendMode: 'multiply',
            }}
          />
        )}
      </div>
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
  onActivatePage,
  onAddHighlight,
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
            onActivate={onActivatePage}
            onAddHighlight={onAddHighlight}
            onDeleteHighlight={onDeleteHighlight}
          />
        ))}
      </div>
    </div>
  )
}
