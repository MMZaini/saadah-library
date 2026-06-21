'use client'

import { useEffect, useRef, useState } from 'react'
import type { PDFPageProxy, RenderTask, PDFDocumentProxy } from '@/lib/pdf-engine'
import { renderPage, pageDimensions } from '@/lib/pdf-engine'
import type { Highlight } from '@/lib/scan-export'
import { cn } from '@/lib/utils'

const CONTAINER_PADDING = 48 // px breathing room around the page
const MAX_FIT_WIDTH = 1100 // cap page width at zoom = 1 on large screens
const DISPLAY_BASE_SCALE = 0.8 // 100% now matches the old 80% view.
const MIN_DRAW_PX = 6 // ignore tiny accidental drags

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
  zoom: number
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
  zoom,
  tool,
  activeColor,
  highlights,
  onActivate,
  onAddHighlight,
  onDeleteHighlight,
}: PageViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const taskRef = useRef<RenderTask | null>(null)
  const drawStartRef = useRef<{ x: number; y: number } | null>(null)

  const [display, setDisplay] = useState<{ w: number; h: number } | null>(null)
  const [draft, setDraft] = useState<DraftRect | null>(null)

  useEffect(() => {
    if (!containerWidth) return
    let cancelled = false
    let page: PDFPageProxy | null = null

    void (async () => {
      page = await doc.getPage(pageNum)
      const canvas = canvasRef.current
      if (cancelled || !canvas) {
        page.cleanup()
        return
      }
      const { width: baseW, height: baseH } = pageDimensions(page)
      const fitWidth = Math.max(1, Math.min(containerWidth - CONTAINER_PADDING, MAX_FIT_WIDTH))
      const displayScale = (fitWidth / baseW) * zoom * DISPLAY_BASE_SCALE
      const dpr = window.devicePixelRatio || 1

      taskRef.current?.cancel()
      const cssW = displayScale * baseW
      const cssH = displayScale * baseH
      canvas.style.width = `${cssW}px`
      canvas.style.height = `${cssH}px`
      setDisplay({ w: cssW, h: cssH })

      const task = renderPage(page, canvas, displayScale * dpr)
      taskRef.current = task
      try {
        await task.promise
      } catch {
        // Cancelled by a newer render — expected.
      } finally {
        page?.cleanup()
      }
    })()

    return () => {
      cancelled = true
      taskRef.current?.cancel()
    }
  }, [doc, pageNum, zoom, containerWidth])

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
      className={cn(
        'relative h-fit transition-shadow',
        isActive && 'ring-2 ring-zinc-500/70 ring-offset-4 ring-offset-surface-1',
      )}
      style={display ? { width: display.w, height: display.h } : undefined}
      aria-label={`Page ${pageNum}`}
    >
      <canvas ref={canvasRef} className="block rounded-sm shadow-xl" />
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

  return (
    <div ref={scrollRef} className="min-h-0 flex-1 overflow-auto bg-surface-1 p-6">
      <div className="flex w-full flex-col items-center gap-8">
        {pageNums.map((pageNum) => (
          <PageView
            key={pageNum}
            doc={doc}
            pageNum={pageNum}
            isActive={pageNum === activePage}
            containerWidth={containerWidth}
            zoom={zoom}
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
