'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { buildScanPageImageUrl, snapScanImageWidth } from '@/lib/scan-image'
import type { Highlight } from '@/lib/scan-export'
import type { ScanTool } from './PageCanvas'
import { cn } from '@/lib/utils'

// Mobile/constrained-device counterpart to PageCanvas: instead of decoding the
// huge JBIG2 pages with client pdf.js (which whites-out on phones — see
// [[narrators-pdf-mobile-white]]), it shows server-rasterized WebP page images
// from /api/scan-page. The highlight-overlay model is identical to PageCanvas so
// the scan studio's draw/erase tools keep working on mobile.

const CONTAINER_PADDING = 32
const MAX_FIT_WIDTH = 1100
const DISPLAY_BASE_SCALE = 0.8
const MIN_DRAW_PX = 6
const FALLBACK_ASPECT = 1.45 // height/width before the image's real ratio is known

interface DraftRect {
  x: number
  y: number
  w: number
  h: number
}

interface ScanImageViewProps {
  pdfPath: string
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

interface PageImageProps {
  pdfPath: string
  pageNum: number
  isActive: boolean
  fitWidth: number
  displayZoom: number
  renderWidth: number
  tool: ScanTool
  activeColor: string
  highlights: Highlight[]
  onActivate: (pageNum: number) => void
  onAddHighlight: (pageNum: number, rect: { x: number; y: number; w: number; h: number }) => void
  onDeleteHighlight: (id: string) => void
}

function PageImage({
  pdfPath,
  pageNum,
  isActive,
  fitWidth,
  displayZoom,
  renderWidth,
  tool,
  activeColor,
  highlights,
  onActivate,
  onAddHighlight,
  onDeleteHighlight,
}: PageImageProps) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const drawStartRef = useRef<{ x: number; y: number } | null>(null)
  const [aspect, setAspect] = useState<number | null>(null)
  const [draft, setDraft] = useState<DraftRect | null>(null)
  // attempt 0 = first load; 1 = one retry (cache-busted); 2 = give up.
  const [attempt, setAttempt] = useState(0)

  const displayWidth = fitWidth ? fitWidth * displayZoom * DISPLAY_BASE_SCALE : 0
  const displayHeight = displayWidth * (aspect ?? FALLBACK_ASPECT)
  const failed = attempt >= 2
  const baseSrc = fitWidth ? buildScanPageImageUrl(pdfPath, pageNum, renderWidth) : undefined
  const src =
    baseSrc && !failed ? (attempt > 0 ? `${baseSrc}&retry=${attempt}` : baseSrc) : undefined

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
      style={displayWidth ? { width: displayWidth, height: displayHeight } : undefined}
      aria-label={`Page ${pageNum}`}
    >
      {src && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={`Page ${pageNum}`}
          loading="lazy"
          decoding="async"
          draggable={false}
          onLoad={(e) => {
            const img = e.currentTarget
            if (img.naturalWidth > 0) setAspect(img.naturalHeight / img.naturalWidth)
          }}
          onError={() => setAttempt((a) => Math.min(2, a + 1))}
          className="block rounded-sm bg-white shadow-xl"
          style={{ width: displayWidth, height: displayHeight }}
        />
      )}
      {failed && (
        <button
          type="button"
          onClick={() => setAttempt(0)}
          style={{ width: displayWidth, height: displayHeight }}
          className="flex flex-col items-center justify-center gap-1 rounded-sm bg-surface-2 text-xs text-foreground-muted shadow-xl"
        >
          <span>Page {pageNum} didn’t load</span>
          <span className="text-foreground-faint">Tap to retry</span>
        </button>
      )}
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

export default function ScanImageView({
  pdfPath,
  pageNums,
  activePage,
  zoom,
  tool,
  activeColor,
  highlightsByPage,
  onActivatePage,
  onAddHighlight,
  onDeleteHighlight,
}: ScanImageViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(0)
  const [renderWidth, setRenderWidth] = useState(0)

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => setContainerWidth(entries[0].contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const fitWidth = containerWidth
    ? Math.max(1, Math.min(containerWidth - CONTAINER_PADDING, MAX_FIT_WIDTH))
    : 0

  // The image request width tracks fit×zoom×DPR, snapped to a cacheable size.
  // Debounced so a zoom gesture doesn't fetch a new resolution on every step.
  const targetWidth = useMemo(() => {
    if (!fitWidth) return 0
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1
    return snapScanImageWidth(fitWidth * DISPLAY_BASE_SCALE * Math.max(1, zoom) * Math.min(dpr, 2))
  }, [fitWidth, zoom])

  useEffect(() => {
    const id = setTimeout(() => setRenderWidth(targetWidth), 160)
    return () => clearTimeout(id)
  }, [targetWidth])

  const effectiveRenderWidth = renderWidth || targetWidth

  return (
    <div ref={scrollRef} data-page-scroll className="min-h-0 flex-1 overflow-auto bg-surface-1 p-6">
      <div className="flex w-full flex-col items-center gap-8">
        {pageNums.map((pageNum) => (
          <PageImage
            key={pageNum}
            pdfPath={pdfPath}
            pageNum={pageNum}
            isActive={pageNum === activePage}
            fitWidth={fitWidth}
            displayZoom={zoom}
            renderWidth={effectiveRenderWidth}
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
