'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { buildScanPageImageUrl, snapScanImageWidth } from '@/lib/scan-image'
import type { Highlight } from '@/lib/scan-export'
import type { ScanTool } from './PageCanvas'
import { cn } from '@/lib/utils'
import HighlightOverlay from './HighlightOverlay'

// Mobile/constrained-device counterpart to PageCanvas: instead of decoding the
// huge JBIG2 pages with client pdf.js (which whites-out on phones — see
// [[narrators-pdf-mobile-white]]), it shows server-rasterized WebP page images
// from /api/scan-page. The highlight-overlay model is identical to PageCanvas so
// the scan studio's highlight editing tools keep working on mobile.

const CONTAINER_PADDING = 32
const MAX_FIT_WIDTH = 1100
const DISPLAY_BASE_SCALE = 0.8
const FALLBACK_ASPECT = 1.45 // height/width before the image's real ratio is known

interface ScanImageViewProps {
  pdfPath: string
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
  selectedHighlightId: string | null
  onActivate: (pageNum: number) => void
  onAddHighlight: (pageNum: number, rect: { x: number; y: number; w: number; h: number }) => void
  onSelectHighlight: (id: string | null) => void
  onUpdateHighlight: (id: string, patch: Partial<Pick<Highlight, 'x' | 'y' | 'w' | 'h'>>) => void
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
  selectedHighlightId,
  onActivate,
  onAddHighlight,
  onSelectHighlight,
  onUpdateHighlight,
  onDeleteHighlight,
}: PageImageProps) {
  const [aspect, setAspect] = useState<number | null>(null)
  // attempt 0 = first load; 1 = one retry (cache-busted); 2 = give up.
  const [attempt, setAttempt] = useState(0)

  const displayWidth = fitWidth ? fitWidth * displayZoom * DISPLAY_BASE_SCALE : 0
  const displayHeight = displayWidth * (aspect ?? FALLBACK_ASPECT)
  const failed = attempt >= 2
  const baseSrc = fitWidth ? buildScanPageImageUrl(pdfPath, pageNum, renderWidth) : undefined
  const src =
    baseSrc && !failed ? (attempt > 0 ? `${baseSrc}&retry=${attempt}` : baseSrc) : undefined

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

export default function ScanImageView({
  pdfPath,
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
