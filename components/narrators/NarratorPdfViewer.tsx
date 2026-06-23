'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import {
  AlertTriangle,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Highlighter,
  Loader2,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import PageCanvas from '@/components/scans/PageCanvas'
import ScanImageView from '@/components/scans/ScanImageView'
import { isConstrainedDevice } from '@/lib/device'
import type { Highlight } from '@/lib/scan-export'
import { loadPdf, type PDFDocumentProxy } from '@/lib/pdf-engine'
import {
  formatPageRange,
  getKhoeiRijalPdfPageRange,
  getKhoeiRijalPdfUrl,
  getKhoeiRijalScanUrl,
  KHOEI_RIJAL_TITLE,
  type PdfPageRange,
} from '@/lib/rijal-pdfs'
import { cleanNarratorName } from '@/lib/data/rijal-display'
import type { NarratorIndexEntry } from '@/lib/data/rijal-types'

const ZOOM_MIN = 0.4
const ZOOM_MAX = 3
const ZOOM_STEP = 0.2

// The narrator viewer is read-only (no highlighting), so this never changes. A
// stable reference keeps PageCanvas/PageView from re-rendering on every parent
// render (a fresh `new Map()` each time would invalidate them needlessly).
const NO_HIGHLIGHTS: Map<number, Highlight[]> = new Map()

type LoadStatus = 'loading' | 'ready' | 'notfound' | 'error'

function rangePages(range: PdfPageRange): number[] {
  return Array.from(
    { length: range.pdfEndPage - range.pdfStartPage + 1 },
    (_, index) => range.pdfStartPage + index,
  )
}

export default function NarratorPdfViewer() {
  const params = useParams()
  const id = Array.isArray(params.id) ? (params.id[0] ?? '') : (params.id ?? '')

  // On phones/tablets, pdf.js whites-out on these huge JBIG2 scans, so render
  // server-rasterized page images instead (see [[narrators-pdf-mobile-white]]).
  // This component is mounted client-only (ssr:false), so the check is stable.
  const constrained = isConstrainedDevice()

  const [narrator, setNarrator] = useState<NarratorIndexEntry | null>(null)
  const [status, setStatus] = useState<LoadStatus>('loading')
  const [doc, setDoc] = useState<PDFDocumentProxy | null>(null)
  const [docLoading, setDocLoading] = useState(false)
  const [docError, setDocError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [zoom, setZoom] = useState(1)
  const loadHandleRef = useRef<ReturnType<typeof loadPdf> | null>(null)

  useEffect(() => {
    if (!id) return
    let cancelled = false
    setStatus('loading')
    setNarrator(null)

    async function loadNarrator() {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_PATH || ''}/api/narrators/${id}?view=summary`,
        )
        if (res.status === 404) {
          if (!cancelled) setStatus('notfound')
          return
        }
        const data = await res.json()
        if (!res.ok || data.error) throw new Error(data.error || 'Narrator lookup failed')
        if (cancelled) return
        setNarrator(data)
        setStatus('ready')
      } catch {
        if (!cancelled) setStatus('error')
      }
    }

    void loadNarrator()
    return () => {
      cancelled = true
    }
  }, [id])

  const pdfRange = useMemo(
    () => (narrator ? getKhoeiRijalPdfPageRange(narrator) : null),
    [narrator],
  )
  const pageNums = useMemo(() => (pdfRange ? rangePages(pdfRange) : []), [pdfRange])
  const nativePdfUrl = pdfRange
    ? getKhoeiRijalPdfUrl(pdfRange.volumeNumber, pdfRange.pdfStartPage)
    : null
  const scanUrl = narrator ? getKhoeiRijalScanUrl(narrator) : null

  // Open each narrator at the first page of its range, at 100%.
  useEffect(() => {
    if (!pdfRange) return
    setCurrentPage(pdfRange.pdfStartPage)
    setZoom(1)
  }, [pdfRange])

  useEffect(() => {
    // Constrained devices use the image viewer and never touch pdf.js.
    if (!pdfRange || constrained) {
      setDoc(null)
      return
    }

    let cancelled = false
    loadHandleRef.current?.destroy()
    loadHandleRef.current = null
    setDoc(null)
    setDocLoading(true)
    setDocError(null)

    const handle = loadPdf(`${process.env.NEXT_PUBLIC_BASE_PATH || ''}${pdfRange.path}`)
    loadHandleRef.current = handle
    handle.promise
      .then((loaded) => {
        if (cancelled) {
          handle.destroy()
          return
        }
        setDoc(loaded)
      })
      .catch(() => {
        if (!cancelled) setDocError('Could not load this PDF volume.')
      })
      .finally(() => {
        if (!cancelled) setDocLoading(false)
      })

    return () => {
      cancelled = true
      handle.destroy()
    }
  }, [pdfRange, constrained])

  useEffect(() => {
    return () => {
      loadHandleRef.current?.destroy()
    }
  }, [])

  useEffect(() => {
    const name = narrator ? cleanNarratorName(narrator.primaryName) : null
    if (name) document.title = `${name} PDF`
    window.dispatchEvent(new CustomEvent('narratorTitleChange', { detail: { title: name } }))
  }, [narrator])

  useEffect(() => {
    return () => {
      window.dispatchEvent(new CustomEvent('narratorTitleChange', { detail: { title: null } }))
    }
  }, [])

  const activeIndex = pageNums.indexOf(currentPage)
  const canPrev = activeIndex > 0
  const canNext = activeIndex >= 0 && activeIndex < pageNums.length - 1
  const pageRangeLabel = pdfRange
    ? formatPageRange(pdfRange.sourceStartPage, pdfRange.sourceEndPage)
    : ''
  const pdfRangeLabel = pdfRange ? formatPageRange(pdfRange.pdfStartPage, pdfRange.pdfEndPage) : ''

  const goPrev = () => {
    if (!canPrev) return
    setCurrentPage(pageNums[activeIndex - 1])
  }

  const goNext = () => {
    if (!canNext) return
    setCurrentPage(pageNums[activeIndex + 1])
  }

  if (status === 'loading') {
    return (
      <div className="flex h-[calc(100dvh-7.5rem-env(safe-area-inset-bottom))] items-center justify-center gap-2 text-foreground-muted md:h-[calc(100dvh-3.5rem)]">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading narrator PDF…
      </div>
    )
  }

  if (status === 'notfound' || status === 'error' || !narrator) {
    return (
      <div className="flex h-[calc(100dvh-7.5rem-env(safe-area-inset-bottom))] flex-col items-center justify-center gap-3 p-8 text-center md:h-[calc(100dvh-3.5rem)]">
        <AlertTriangle className="h-8 w-8 text-destructive" />
        <h1 className="text-base font-semibold text-foreground">
          {status === 'notfound' ? 'Narrator not found' : 'Could not load this narrator'}
        </h1>
        <Button variant="outline" size="sm" asChild>
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/narrators">Back to narrators</a>
        </Button>
      </div>
    )
  }

  if (!pdfRange) {
    return (
      <div className="flex h-[calc(100dvh-7.5rem-env(safe-area-inset-bottom))] flex-col items-center justify-center gap-3 p-8 text-center md:h-[calc(100dvh-3.5rem)]">
        <AlertTriangle className="h-8 w-8 text-destructive" />
        <h1 className="text-base font-semibold text-foreground">PDF volume unavailable</h1>
        <p className="max-w-sm text-sm text-foreground-muted">
          This narrator points to a volume that does not have a registered PDF.
        </p>
        <Button variant="outline" size="sm" asChild>
          <a href={`/narrators/${id}`}>Back to entry</a>
        </Button>
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100dvh-7.5rem-env(safe-area-inset-bottom))] flex-col overflow-hidden md:h-[calc(100dvh-3.5rem)]">
      <div className="flex shrink-0 flex-col gap-3 border-b border-border bg-background px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="mb-1 flex items-center gap-2 text-xs text-foreground-faint">
            <Button variant="ghost" size="sm" className="-ml-2 h-7 gap-1.5 px-2" asChild>
              <a href={`/narrators/${id}`}>
                <ArrowLeft className="h-3.5 w-3.5" />
                Entry
              </a>
            </Button>
            <span>{KHOEI_RIJAL_TITLE}</span>
          </div>
          <h1 className="truncate font-arabic text-xl font-semibold text-foreground" dir="rtl">
            {cleanNarratorName(narrator.primaryName)}
          </h1>
          <p className="mt-1 text-xs text-foreground-muted">
            Vol. {pdfRange.volumeNumber} · Source {pageRangeLabel} · PDF {pdfRangeLabel}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={goPrev}
            disabled={!canPrev}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-[4.5rem] text-center text-sm text-foreground-muted">
            {currentPage} / {pdfRange.pdfEndPage}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={goNext}
            disabled={!canNext}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setZoom((z) => Math.max(ZOOM_MIN, +(z - ZOOM_STEP).toFixed(2)))}
            title="Zoom out"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="min-w-[3rem] text-center text-xs text-foreground-muted">
            {Math.round(zoom * 100)}%
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setZoom((z) => Math.min(ZOOM_MAX, +(z + ZOOM_STEP).toFixed(2)))}
            title="Zoom in"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          {nativePdfUrl && (
            <Button variant="outline" size="sm" className="h-8 gap-1.5" asChild>
              <a href={nativePdfUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3.5 w-3.5" />
                Open PDF
              </a>
            </Button>
          )}
          {scanUrl && (
            <Button size="sm" className="h-8 gap-1.5" asChild>
              <a href={scanUrl}>
                <Highlighter className="h-3.5 w-3.5" />
                Open in Scan Maker
              </a>
            </Button>
          )}
        </div>
      </div>

      {constrained ? (
        <ScanImageView
          pdfPath={pdfRange.path}
          pageNums={pageNums}
          activePage={currentPage}
          zoom={zoom}
          tool="erase"
          activeColor="#ffe600"
          highlightsByPage={NO_HIGHLIGHTS}
          onActivatePage={setCurrentPage}
          onAddHighlight={() => {}}
          onDeleteHighlight={() => {}}
        />
      ) : docError ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
          <AlertTriangle className="h-8 w-8 text-destructive" />
          <p className="max-w-sm text-sm text-foreground-muted">{docError}</p>
        </div>
      ) : docLoading || !doc ? (
        <div className="flex flex-1 items-center justify-center gap-2 text-foreground-muted">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading PDF…
        </div>
      ) : (
        <PageCanvas
          doc={doc}
          pageNums={pageNums}
          activePage={currentPage}
          zoom={zoom}
          tool="erase"
          activeColor="#ffe600"
          highlightsByPage={NO_HIGHLIGHTS}
          onActivatePage={setCurrentPage}
          onAddHighlight={() => {}}
          onDeleteHighlight={() => {}}
        />
      )}
    </div>
  )
}
