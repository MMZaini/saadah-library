'use client'

import { useEffect, useRef, useState } from 'react'
import { Check } from 'lucide-react'
import type { PDFDocumentProxy } from '@/lib/pdf-engine'
import { renderPage, scaleForWidth } from '@/lib/pdf-engine'
import { cn } from '@/lib/utils'

const THUMB_WIDTH = 132

interface ThumbnailProps {
  doc: PDFDocumentProxy
  pageNum: number
  isCurrent: boolean
  isSelected: boolean
  onOpen: (n: number, extendRange?: boolean) => void
  onToggleSelect: (n: number, extendRange?: boolean) => void
}

function Thumbnail({
  doc,
  pageNum,
  isCurrent,
  isSelected,
  onOpen,
  onToggleSelect,
}: ThumbnailProps) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const renderedRef = useRef(false)
  const [visible, setVisible] = useState(false)

  // Reveal (and render) only when scrolled near the viewport.
  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true)
            io.disconnect()
            break
          }
        }
      },
      { root: el.closest('[data-thumb-scroll]'), rootMargin: '300px 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    if (!visible || renderedRef.current) return
    let cancelled = false
    let task: ReturnType<typeof renderPage> | null = null
    void (async () => {
      const page = await doc.getPage(pageNum)
      const canvas = canvasRef.current
      if (cancelled || !canvas) {
        page.cleanup()
        return
      }
      try {
        task = renderPage(page, canvas, scaleForWidth(page, THUMB_WIDTH))
        await task.promise
        renderedRef.current = true
      } catch {
        // Render cancelled (page changed / unmounted) — ignore.
      } finally {
        page.cleanup()
      }
    })()
    return () => {
      cancelled = true
      task?.cancel()
    }
  }, [visible, doc, pageNum])

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={(event) => onOpen(pageNum, event.shiftKey)}
        aria-current={isCurrent}
        className={cn(
          'group relative block w-full overflow-hidden rounded-md border bg-white transition-colors',
          isCurrent
            ? 'border-zinc-500 ring-2 ring-zinc-500/70'
            : 'border-border hover:border-zinc-400',
        )}
        style={{ aspectRatio: '0.72' }}
        title={`Page ${pageNum}`}
      >
        {visible ? (
          <canvas ref={canvasRef} className="h-full w-full object-contain" />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-xs text-foreground-faint">
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
  return (
    <div data-thumb-scroll className="min-h-0 flex-1 overflow-y-auto px-3 pb-4">
      <div className="grid grid-cols-2 gap-2.5">
        {Array.from({ length: numPages }, (_, i) => i + 1).map((pageNum) => (
          <Thumbnail
            key={pageNum}
            doc={doc}
            pageNum={pageNum}
            isCurrent={pageNum === currentPage}
            isSelected={selectedPages.has(pageNum)}
            onOpen={onOpenPage}
            onToggleSelect={onToggleSelectPage}
          />
        ))}
      </div>
    </div>
  )
}
