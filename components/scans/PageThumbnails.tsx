'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Check } from 'lucide-react'
import type { PDFDocumentProxy } from '@/lib/pdf-engine'
import { renderPage, scaleForWidth } from '@/lib/pdf-engine'
import { pdfRenderScheduler, RENDER_PRIORITY } from '@/lib/pdf-render-queue'
import { cn } from '@/lib/utils'

const THUMB_WIDTH = 132 // render target width in CSS px (DPR-independent; small = fast)
const COLS = 2
const GRID_GAP = 10 // matches gap-2.5 (0.625rem)
const THUMB_ASPECT = 0.72 // width / height of each tile
const OVERSCAN_ROWS = 4 // rows rendered beyond the viewport, each side

interface ThumbnailProps {
  doc: PDFDocumentProxy
  pageNum: number
  height: number
  isCurrent: boolean
  isSelected: boolean
  onOpen: (n: number, extendRange?: boolean) => void
  onToggleSelect: (n: number, extendRange?: boolean) => void
}

function Thumbnail({
  doc,
  pageNum,
  height,
  isCurrent,
  isSelected,
  onOpen,
  onToggleSelect,
}: ThumbnailProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [rendered, setRendered] = useState(false)

  // Only mounted tiles (i.e. near the viewport) render, and they go through the
  // shared scheduler so the single pdf.js worker is never flooded. Unmounting on
  // scroll-away aborts the queued/in-flight render and frees the canvas bitmap.
  useEffect(() => {
    setRendered(false)
    const controller = new AbortController()
    let renderTask: ReturnType<typeof renderPage> | null = null

    pdfRenderScheduler
      .run(
        async (signal) => {
          const page = await doc.getPage(pageNum)
          const canvas = canvasRef.current
          if (signal?.aborted || !canvas) {
            page.cleanup()
            return
          }
          try {
            renderTask = renderPage(page, canvas, scaleForWidth(page, THUMB_WIDTH))
            signal?.addEventListener('abort', () => renderTask?.cancel(), { once: true })
            await renderTask.promise
            if (!signal?.aborted) setRendered(true)
          } finally {
            page.cleanup()
          }
        },
        { priority: RENDER_PRIORITY.thumbnail, signal: controller.signal },
      )
      .catch(() => {
        // Aborted (scrolled away) or render cancelled — expected, ignore.
      })

    return () => controller.abort()
  }, [doc, pageNum])

  return (
    <div className="relative" style={{ height }}>
      <button
        type="button"
        onClick={(event) => onOpen(pageNum, event.shiftKey)}
        aria-current={isCurrent}
        className={cn(
          'group relative block h-full w-full overflow-hidden rounded-md border bg-white transition-colors',
          isCurrent
            ? 'border-zinc-500 ring-2 ring-zinc-500/70'
            : 'border-border hover:border-zinc-400',
        )}
        title={`Page ${pageNum}`}
      >
        <canvas ref={canvasRef} className="h-full w-full object-contain" />
        {!rendered && (
          <span className="absolute inset-0 flex items-center justify-center text-xs text-foreground-faint">
            {pageNum}
          </span>
        )}
      </button>

      <button
        type="button"
        onClick={(event) => onToggleSelect(pageNum, event.shiftKey)}
        aria-pressed={isSelected}
        aria-label={isSelected ? `Deselect page ${pageNum}` : `Select page ${pageNum}`}
        className={cn(
          'absolute left-2 top-2 flex h-6 w-6 items-center justify-center rounded-md border shadow-sm transition-colors',
          isSelected
            ? 'border-zinc-500 bg-zinc-600 text-white'
            : 'border-zinc-400 bg-zinc-100/95 text-transparent hover:border-zinc-500 hover:bg-zinc-200',
        )}
      >
        <Check className="h-3.5 w-3.5" strokeWidth={3} />
      </button>

      <span className="pointer-events-none absolute bottom-1 right-1 rounded bg-black/65 px-1.5 py-0.5 text-[10px] font-medium text-white">
        {pageNum}
      </span>
    </div>
  )
}

interface PageThumbnailsProps {
  doc: PDFDocumentProxy
  numPages: number
  currentPage: number
  selectedPages: Set<number>
  onOpenPage: (n: number, extendRange?: boolean) => void
  onToggleSelectPage: (n: number, extendRange?: boolean) => void
}

export default function PageThumbnails({
  doc,
  numPages,
  currentPage,
  selectedPages,
  onOpenPage,
  onToggleSelectPage,
}: PageThumbnailsProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef(0)
  const [viewport, setViewport] = useState({ width: 0, height: 0 })
  const [scrollTop, setScrollTop] = useState(0)

  // Track the scroll container's size. A hidden sidebar (e.g. the desktop aside
  // on mobile, display:none) reports width 0, so nothing renders there.
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const ro = new ResizeObserver(() => {
      setViewport({ width: el.clientWidth, height: el.clientHeight })
    })
    ro.observe(el)
    setViewport({ width: el.clientWidth, height: el.clientHeight })
    return () => ro.disconnect()
  }, [])

  const onScroll = () => {
    if (rafRef.current) return
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = 0
      const el = scrollRef.current
      if (el) setScrollTop(el.scrollTop)
    })
  }

  useEffect(() => () => cancelAnimationFrame(rafRef.current), [])

  const layout = useMemo(() => {
    // The scroll container has px-3 padding; subtract it for the grid's width.
    const availWidth = Math.max(0, viewport.width - 24)
    const itemWidth = (availWidth - GRID_GAP) / COLS
    if (itemWidth <= 0 || numPages <= 0) return null

    const itemHeight = itemWidth / THUMB_ASPECT
    const rowPitch = itemHeight + GRID_GAP
    const totalRows = Math.ceil(numPages / COLS)
    const totalHeight = totalRows * itemHeight + (totalRows - 1) * GRID_GAP

    const firstRow = Math.max(0, Math.floor(scrollTop / rowPitch) - OVERSCAN_ROWS)
    const rowsInView = Math.ceil(viewport.height / rowPitch) + OVERSCAN_ROWS * 2 + 1
    const lastRow = Math.min(totalRows - 1, firstRow + rowsInView)

    const firstPage = firstRow * COLS + 1
    const lastPage = Math.min(numPages, (lastRow + 1) * COLS)
    const renderedRows = lastRow - firstRow + 1
    const topSpacer = firstRow * rowPitch
    const gridHeight = renderedRows * itemHeight + (renderedRows - 1) * GRID_GAP
    const bottomSpacer = Math.max(0, totalHeight - topSpacer - gridHeight)

    const pages: number[] = []
    for (let p = firstPage; p <= lastPage; p++) pages.push(p)

    return { itemHeight, topSpacer, bottomSpacer, pages }
  }, [viewport.width, viewport.height, scrollTop, numPages])

  return (
    <div
      ref={scrollRef}
      onScroll={onScroll}
      data-thumb-scroll
      className="min-h-0 flex-1 overflow-y-auto px-3 pb-4"
    >
      {layout && (
        <>
          <div style={{ height: layout.topSpacer }} aria-hidden />
          <div className="grid grid-cols-2 gap-2.5">
            {layout.pages.map((pageNum) => (
              <Thumbnail
                key={pageNum}
                doc={doc}
                pageNum={pageNum}
                height={layout.itemHeight}
                isCurrent={pageNum === currentPage}
                isSelected={selectedPages.has(pageNum)}
                onOpen={onOpenPage}
                onToggleSelect={onToggleSelectPage}
              />
            ))}
          </div>
          <div style={{ height: layout.bottomSpacer }} aria-hidden />
        </>
      )}
    </div>
  )
}
