'use client'

import { useRef, useState } from 'react'
import { ChevronLeft, ChevronDown, ChevronRight, FileText, Upload } from 'lucide-react'
import { SCAN_BOOKS, type ScanBook, type ScanVolume } from '@/lib/scan-sources'
import { cn } from '@/lib/utils'
import type { PDFDocumentProxy } from '@/lib/pdf-engine'
import PageThumbnails from './PageThumbnails'

interface ScanSidebarProps {
  activePath: string | null
  sourceTitle: string | null
  sourceVolumeLabel: string | null
  doc: PDFDocumentProxy | null
  numPages: number
  currentPage: number
  selectedPages: Set<number>
  /** When set, thumbnails render as server images (mobile path). */
  imagePdfPath?: string | null
  onUploadPdf: (file: File) => void
  onSelectVolume: (book: ScanBook, volume: ScanVolume) => void
  onChangePdf: () => void
  onOpenPage: (n: number, extendRange?: boolean) => void
  onToggleSelectPage: (n: number, extendRange?: boolean) => void
}

function UploadDropzone({ onUploadPdf }: Pick<ScanSidebarProps, 'onUploadPdf'>) {
  const inputRef = useRef<HTMLInputElement>(null)
  const dragDepthRef = useRef(0)
  const [dragging, setDragging] = useState(false)

  const handleFiles = (files: FileList | null) => {
    const file = files?.[0]
    if (file) onUploadPdf(file)
  }

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Upload PDF"
      onClick={() => inputRef.current?.click()}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          inputRef.current?.click()
        }
      }}
      onDragEnter={(event) => {
        event.preventDefault()
        dragDepthRef.current += 1
        setDragging(true)
      }}
      onDragOver={(event) => {
        event.preventDefault()
        event.dataTransfer.dropEffect = 'copy'
      }}
      onDragLeave={(event) => {
        event.preventDefault()
        dragDepthRef.current = Math.max(0, dragDepthRef.current - 1)
        if (dragDepthRef.current === 0) {
          setDragging(false)
        }
      }}
      onDrop={(event) => {
        event.preventDefault()
        dragDepthRef.current = 0
        setDragging(false)
        handleFiles(event.dataTransfer.files)
      }}
      className={cn(
        'mb-3 flex cursor-pointer items-center gap-3 rounded-lg border border-dashed p-3 text-left transition-colors',
        dragging
          ? 'border-zinc-400 bg-surface-2'
          : 'border-zinc-500/40 bg-surface-1 hover:border-zinc-400 hover:bg-surface-2',
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="sr-only"
        onChange={(event) => {
          handleFiles(event.currentTarget.files)
          event.currentTarget.value = ''
        }}
      />
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-zinc-500/40 bg-background text-foreground-muted">
        <Upload className="h-4 w-4" />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-medium text-foreground">Upload PDF</span>
        <span className="block text-xs text-foreground-faint">
          Drop a file here or click to browse.
        </span>
      </span>
    </div>
  )
}

function BookBrowser({
  activePath,
  onUploadPdf,
  onSelectVolume,
}: Pick<ScanSidebarProps, 'activePath' | 'onUploadPdf' | 'onSelectVolume'>) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-4">
      <UploadDropzone onUploadPdf={onUploadPdf} />
      <p className="px-1 pb-2 pt-1 text-xs font-medium uppercase tracking-wide text-foreground-faint">
        Choose a book
      </p>
      <ul className="space-y-1">
        {SCAN_BOOKS.map((book) => {
          const single = book.volumes.length === 1
          const expanded = expandedId === book.bookId
          const containsActive = book.volumes.some((v) => v.path === activePath)

          return (
            <li key={book.bookId}>
              <button
                type="button"
                onClick={() => {
                  if (single) onSelectVolume(book, book.volumes[0])
                  else setExpandedId(expanded ? null : book.bookId)
                }}
                className={cn(
                  'flex w-full items-center gap-2 rounded-lg border px-3 py-2.5 text-left transition-colors',
                  containsActive
                    ? 'border-accent/60 bg-surface-2'
                    : 'border-transparent hover:bg-surface-2',
                )}
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-foreground">
                    {book.title}
                  </span>
                  <span className="block truncate text-xs text-foreground-faint">
                    {book.author ?? (single ? 'Single volume' : `${book.volumes.length} volumes`)}
                  </span>
                </span>
                {!single &&
                  (expanded ? (
                    <ChevronDown className="h-4 w-4 shrink-0 text-foreground-faint" />
                  ) : (
                    <ChevronRight className="h-4 w-4 shrink-0 text-foreground-faint" />
                  ))}
              </button>

              {!single && expanded && (
                <ul className="mb-1 ml-3 mt-1 space-y-0.5 border-l border-border pl-3">
                  {book.volumes.map((volume) => (
                    <li key={volume.path}>
                      <button
                        type="button"
                        onClick={() => onSelectVolume(book, volume)}
                        className={cn(
                          'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors',
                          volume.path === activePath
                            ? 'bg-accent/15 text-accent'
                            : 'text-foreground-muted hover:bg-surface-2 hover:text-foreground',
                        )}
                      >
                        <FileText className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{volume.label}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export default function ScanSidebar(props: ScanSidebarProps) {
  const {
    activePath,
    sourceTitle,
    sourceVolumeLabel,
    doc,
    numPages,
    currentPage,
    selectedPages,
    imagePdfPath = null,
    onUploadPdf,
    onSelectVolume,
    onChangePdf,
    onOpenPage,
    onToggleSelectPage,
  } = props

  if (!doc) {
    return (
      <BookBrowser
        activePath={activePath}
        onUploadPdf={onUploadPdf}
        onSelectVolume={onSelectVolume}
      />
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="border-b border-border px-3 pb-3 pt-1">
        <button
          type="button"
          onClick={onChangePdf}
          className="mb-2 inline-flex items-center gap-1 text-xs font-medium text-foreground-muted transition-colors hover:text-foreground"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Change PDF
        </button>
        <p className="truncate text-sm font-semibold text-foreground" title={sourceTitle ?? ''}>
          {sourceTitle}
        </p>
        <p className="text-xs text-foreground-faint">
          {sourceVolumeLabel} · {numPages} pages
        </p>
        <p className="mt-2 text-xs text-foreground-muted">{selectedPages.size} selected</p>
      </div>

      <PageThumbnails
        doc={doc}
        numPages={numPages}
        currentPage={currentPage}
        selectedPages={selectedPages}
        imagePdfPath={imagePdfPath}
        onOpenPage={onOpenPage}
        onToggleSelectPage={onToggleSelectPage}
      />
    </div>
  )
}
