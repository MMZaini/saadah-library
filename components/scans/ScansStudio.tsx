'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Loader2, FileText, AlertTriangle } from 'lucide-react'
import { withBasePath } from '@/lib/assets'
import { loadPdf, type PDFDocumentProxy } from '@/lib/pdf-engine'
import { exportPages, HIGHLIGHT_COLORS, type ExportCover, type Highlight } from '@/lib/scan-export'
import type { ScanBook, ScanVolume } from '@/lib/scan-sources'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import ScanSidebar from './ScanSidebar'
import PageCanvas, { type ScanTool } from './PageCanvas'
import ScanToolbar, { type ExportSettings } from './ScanToolbar'

const ZOOM_MIN = 0.4
const ZOOM_MAX = 3
const ZOOM_STEP = 0.2

type Source =
  | {
      kind: 'library'
      path: string
      bookId: string
      title: string
      volumeLabel: string
      cover: string
    }
  | {
      kind: 'upload'
      path: string
      title: string
      volumeLabel: string
      fileName: string
    }

function slugify(...parts: (string | undefined)[]): string {
  return (
    parts
      .filter(Boolean)
      .join('-')
      .normalize('NFD')
      .replace(/\p{M}/gu, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'scan'
  )
}

export default function ScansStudio() {
  const [source, setSource] = useState<Source | null>(null)
  const [doc, setDoc] = useState<PDFDocumentProxy | null>(null)
  const [numPages, setNumPages] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set())
  const [highlights, setHighlights] = useState<Highlight[]>([])
  const [tool, setTool] = useState<ScanTool>('draw')
  const [activeColor, setActiveColor] = useState(HIGHLIGHT_COLORS[0].value)
  const [zoom, setZoom] = useState(1)
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [settings, setSettings] = useState<ExportSettings>({
    layout: 'each',
    format: 'png',
    delivery: 'zip',
    showBadge: false,
    coverEnabled: true,
    coverPage: 1,
  })

  const loadTokenRef = useRef(0)
  const loadHandleRef = useRef<ReturnType<typeof loadPdf> | null>(null)
  const docRef = useRef<PDFDocumentProxy | null>(null)
  const lastSelectedPageRef = useRef<number | null>(null)

  // Tear down the active document + any in-flight load when leaving the studio.
  // Destroying the loading task also destroys its document proxy and worker.
  useEffect(() => {
    return () => {
      loadHandleRef.current?.destroy()
    }
  }, [])

  const topBarSourceTitle = source
    ? source.kind === 'upload'
      ? source.fileName
      : source.title
    : null

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent('scanSourceChange', { detail: { title: topBarSourceTitle } }),
    )
    return () => {
      window.dispatchEvent(new CustomEvent('scanSourceChange', { detail: { title: null } }))
    }
  }, [topBarSourceTitle])

  const loadSource = useCallback(async (book: ScanBook, volume: ScanVolume) => {
    const token = ++loadTokenRef.current
    // Releases the previously loaded document (and any in-flight load).
    loadHandleRef.current?.destroy()
    loadHandleRef.current = null
    docRef.current = null
    setDoc(null)

    setLoading(true)
    setLoadError(null)
    setHighlights([])
    setSelectedPages(new Set())
    lastSelectedPageRef.current = null
    setCurrentPage(1)
    setZoom(1)
    setSettings((s) => ({ ...s, coverPage: 1 }))

    const handle = loadPdf(withBasePath(volume.path))
    loadHandleRef.current = handle
    try {
      const loaded = await handle.promise
      if (loadTokenRef.current !== token) {
        handle.destroy()
        return
      }
      docRef.current = loaded
      setDoc(loaded)
      setNumPages(loaded.numPages)
      setSource({
        kind: 'library',
        path: volume.path,
        bookId: book.bookId,
        title: book.title,
        volumeLabel: volume.label,
        cover: book.cover,
      })
      setSidebarOpen(false)
    } catch {
      if (loadTokenRef.current === token) setLoadError('Could not load this PDF. Please try again.')
    } finally {
      if (loadTokenRef.current === token) setLoading(false)
    }
  }, [])

  const loadUploadedPdf = useCallback(async (file: File) => {
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
    if (!isPdf) {
      setLoadError('Choose a PDF file to upload.')
      return
    }

    const token = ++loadTokenRef.current
    loadHandleRef.current?.destroy()
    loadHandleRef.current = null
    docRef.current = null
    setDoc(null)

    setLoading(true)
    setLoadError(null)
    setHighlights([])
    setSelectedPages(new Set())
    lastSelectedPageRef.current = null
    setCurrentPage(1)
    setZoom(1)
    setSettings((s) => ({ ...s, coverPage: 1 }))

    try {
      const bytes = new Uint8Array(await file.arrayBuffer())
      if (loadTokenRef.current !== token) return

      const handle = loadPdf(bytes)
      loadHandleRef.current = handle
      const loaded = await handle.promise
      if (loadTokenRef.current !== token) {
        handle.destroy()
        return
      }

      const title = file.name.replace(/\.pdf$/i, '') || 'Uploaded PDF'
      docRef.current = loaded
      setDoc(loaded)
      setNumPages(loaded.numPages)
      setSource({
        kind: 'upload',
        path: `upload:${file.name}:${file.lastModified}`,
        title,
        volumeLabel: 'Uploaded PDF',
        fileName: file.name,
      })
      setSidebarOpen(false)
    } catch {
      if (loadTokenRef.current === token) {
        setLoadError('Could not load this uploaded PDF. Please try another file.')
      }
    } finally {
      if (loadTokenRef.current === token) setLoading(false)
    }
  }, [])

  const handleChangePdf = useCallback(() => {
    loadTokenRef.current++
    loadHandleRef.current?.destroy()
    loadHandleRef.current = null
    docRef.current = null
    setDoc(null)
    setSource(null)
    setNumPages(0)
    setHighlights([])
    setSelectedPages(new Set())
    lastSelectedPageRef.current = null
    setLoadError(null)
    setSettings((s) => ({ ...s, coverPage: 1 }))
  }, [])

  const toggleSelectPage = useCallback((n: number, extendRange = false) => {
    setSelectedPages((prev) => {
      const next = new Set(prev)
      const anchor = lastSelectedPageRef.current
      if (extendRange && anchor !== null) {
        const start = Math.min(anchor, n)
        const end = Math.max(anchor, n)
        for (let page = start; page <= end; page++) next.add(page)
      } else if (next.has(n)) {
        next.delete(n)
      } else {
        next.add(n)
      }
      return next
    })
    lastSelectedPageRef.current = n
    setCurrentPage(n)
  }, [])

  useEffect(() => {
    if (selectedPages.size === 0 || selectedPages.has(currentPage)) return
    setCurrentPage(Math.min(...selectedPages))
  }, [currentPage, selectedPages])

  const openPage = useCallback(
    (n: number, extendRange = false) => {
      if (extendRange) {
        toggleSelectPage(n, true)
        return
      }
      setCurrentPage(n)
      setSidebarOpen(false)
    },
    [toggleSelectPage],
  )

  const addHighlight = useCallback(
    (pageNum: number, rect: { x: number; y: number; w: number; h: number }) => {
      setHighlights((prev) => [
        ...prev,
        { id: crypto.randomUUID(), page: pageNum, color: activeColor, ...rect },
      ])
    },
    [activeColor],
  )

  const deleteHighlight = useCallback((id: string) => {
    setHighlights((prev) => prev.filter((h) => h.id !== id))
  }, [])

  const handleExport = useCallback(async () => {
    if (!docRef.current || selectedPages.size === 0) return
    setExporting(true)
    try {
      const pageNumbers = Array.from(selectedPages).sort((a, b) => a - b)
      const byPage = new Map<number, Highlight[]>()
      for (const h of highlights) {
        const list = byPage.get(h.page)
        if (list) list.push(h)
        else byPage.set(h.page, [h])
      }
      let cover: ExportCover | null = null
      if (settings.coverEnabled && settings.layout !== 'each' && source) {
        if (source.kind === 'library') {
          cover = { kind: 'image', src: withBasePath(source.cover) }
        } else {
          cover = {
            kind: 'page',
            pageNumber: Math.min(numPages, Math.max(1, settings.coverPage)),
          }
        }
      }
      await exportPages(docRef.current, pageNumbers, byPage, {
        layout: settings.layout,
        format: settings.format,
        delivery: settings.delivery,
        showBadge: settings.showBadge,
        cover,
        fileBaseName: slugify(source?.title, source?.volumeLabel),
      })
    } catch (err) {
      console.error('Scan export failed', err)
      setLoadError('Export failed. Please try fewer pages or a smaller format.')
    } finally {
      setExporting(false)
    }
  }, [selectedPages, highlights, settings, source, numPages])

  const visiblePages = useMemo(
    () =>
      selectedPages.size > 0 ? Array.from(selectedPages).sort((a, b) => a - b) : [currentPage],
    [currentPage, selectedPages],
  )

  const activeVisibleIndex = visiblePages.indexOf(currentPage)
  const canPrev = selectedPages.size > 0 ? activeVisibleIndex > 0 : doc !== null && currentPage > 1
  const canNext =
    selectedPages.size > 0
      ? activeVisibleIndex >= 0 && activeVisibleIndex < visiblePages.length - 1
      : doc !== null && currentPage < numPages

  const goPrev = useCallback(() => {
    setCurrentPage((page) => {
      if (selectedPages.size === 0) return Math.max(1, page - 1)
      const pages = Array.from(selectedPages).sort((a, b) => a - b)
      const index = pages.indexOf(page)
      return pages[Math.max(0, index - 1)] ?? pages[0] ?? page
    })
  }, [selectedPages])

  const goNext = useCallback(() => {
    setCurrentPage((page) => {
      if (selectedPages.size === 0) return Math.min(numPages, page + 1)
      const pages = Array.from(selectedPages).sort((a, b) => a - b)
      const index = pages.indexOf(page)
      return pages[Math.min(pages.length - 1, index + 1)] ?? pages.at(-1) ?? page
    })
  }, [numPages, selectedPages])

  const highlightsByPage = useMemo(() => {
    const byPage = new Map<number, Highlight[]>()
    for (const h of highlights) {
      const list = byPage.get(h.page)
      if (list) list.push(h)
      else byPage.set(h.page, [h])
    }
    return byPage
  }, [highlights])

  const sidebar = (
    <ScanSidebar
      activePath={source?.kind === 'library' ? source.path : null}
      sourceTitle={source?.title ?? null}
      sourceVolumeLabel={source?.volumeLabel ?? null}
      doc={doc}
      numPages={numPages}
      currentPage={currentPage}
      selectedPages={selectedPages}
      onUploadPdf={loadUploadedPdf}
      onSelectVolume={loadSource}
      onChangePdf={handleChangePdf}
      onOpenPage={openPage}
      onToggleSelectPage={toggleSelectPage}
    />
  )

  return (
    <div className="flex h-[calc(100dvh-3.5rem)] overflow-hidden">
      <aside className="hidden w-[340px] shrink-0 flex-col bg-background pt-2 md:flex md:border-r md:border-border">
        {sidebar}
      </aside>

      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-[90vw] max-w-[380px] gap-0 p-0 sm:max-w-[380px]">
          <div className="flex h-full flex-col pt-10">{sidebar}</div>
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        <ScanToolbar
          hasDoc={!!doc}
          tool={tool}
          onToolChange={setTool}
          activeColor={activeColor}
          onColorChange={setActiveColor}
          zoom={zoom}
          onZoomIn={() => setZoom((z) => Math.min(ZOOM_MAX, +(z + ZOOM_STEP).toFixed(2)))}
          onZoomOut={() => setZoom((z) => Math.max(ZOOM_MIN, +(z - ZOOM_STEP).toFixed(2)))}
          currentPage={currentPage}
          numPages={numPages}
          coverMode={
            source?.kind === 'upload' ? 'page' : source?.kind === 'library' ? 'book' : null
          }
          canPrev={canPrev}
          canNext={canNext}
          onPrev={goPrev}
          onNext={goNext}
          selectedCount={selectedPages.size}
          settings={settings}
          onSettingsChange={(patch) => setSettings((s) => ({ ...s, ...patch }))}
          onExport={handleExport}
          exporting={exporting}
          onOpenSidebar={() => setSidebarOpen(true)}
        />

        {loadError && !loading ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
            <AlertTriangle className="h-8 w-8 text-destructive" />
            <p className="max-w-sm text-sm text-foreground-muted">{loadError}</p>
          </div>
        ) : loading ? (
          <div className="flex flex-1 items-center justify-center gap-2 text-foreground-muted">
            <Loader2 className="h-5 w-5 animate-spin" /> Loading PDF…
          </div>
        ) : doc ? (
          <PageCanvas
            doc={doc}
            pageNums={visiblePages}
            activePage={currentPage}
            zoom={zoom}
            tool={tool}
            activeColor={activeColor}
            highlightsByPage={highlightsByPage}
            onActivatePage={setCurrentPage}
            onAddHighlight={addHighlight}
            onDeleteHighlight={deleteHighlight}
          />
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
            <FileText className="h-10 w-10 text-foreground-faint" />
            <div>
              <p className="text-base font-medium text-foreground">Pick a PDF to begin</p>
              <p className="mt-1 max-w-sm text-sm text-foreground-faint">
                Choose a book and volume, select pages, highlight what matters, then export.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
