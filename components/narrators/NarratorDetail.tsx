'use client'

import { memo, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  Bookmark,
  BookOpen,
  Copy,
  ExternalLink,
  FileText,
  Highlighter,
  Loader2,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { getHighlightSegments } from '@/lib/search-utils'
import { cleanNarratorName } from '@/lib/data/rijal-display'
import { getKhoeiRijalScanUrl, getKhoeiRijalViewerUrl } from '@/lib/rijal-pdfs'
import { useNarratorBookmarks } from '@/lib/narrator-bookmarks-context'
import { cn } from '@/lib/utils'
import type { NarratorEntry } from '@/lib/data/rijal-types'

interface NarratorDetailProps {
  narrator: NarratorEntry | null
  query: string
  loading?: boolean
  // On the dedicated /narrators/[id] page the entry is already the whole page, so
  // the "open in new tab" affordance is hidden there.
  standalone?: boolean
}

// A handful of narrator entries (e.g. al-Tūsī, al-Ṣādiq) carry 7,000–9,000 text
// blocks / 300K+ characters. Rendering them all in one synchronous pass blocks
// the main thread for seconds — the "white panel" freeze. Instead we paint an
// initial window immediately and stream the remainder in idle-time chunks.
const INITIAL_BLOCK_COUNT = 40
const BLOCK_CHUNK = 120

type IdleWindow = Window &
  typeof globalThis & {
    requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number
    cancelIdleCallback?: (handle: number) => void
  }

/** Run `cb` when the main thread is idle (falls back to a macrotask). Returns a canceller. */
function scheduleIdle(cb: () => void): () => void {
  if (typeof window === 'undefined') return () => {}
  const w = window as IdleWindow
  if (typeof w.requestIdleCallback === 'function') {
    const handle = w.requestIdleCallback(cb, { timeout: 250 })
    return () => w.cancelIdleCallback?.(handle)
  }
  const handle = window.setTimeout(cb, 16)
  return () => window.clearTimeout(handle)
}

/** Highlight `query` occurrences in `text`. Pure + module-level so it can back a memoized block. */
function highlightToNodes(text: string, query: string): ReactNode {
  if (!query.trim()) return text
  const segments = getHighlightSegments(text, query)
  if (segments.length === 1 && !segments[0].highlight) return text
  return segments.map((segment, index) =>
    segment.highlight ? (
      <mark
        key={index}
        className="rounded-sm bg-yellow-300/80 px-0.5 text-inherit dark:bg-yellow-500/50"
      >
        {segment.text}
      </mark>
    ) : (
      segment.text
    ),
  )
}

// Memoized so that, while the rest of the entry streams in, blocks already on
// screen are not re-highlighted on every chunk (the query is stable mid-stream).
const NarratorTextBlock = memo(function NarratorTextBlock({
  text,
  heading,
  query,
}: {
  text: string
  heading: boolean
  query: string
}) {
  return (
    <div
      className={
        heading
          ? 'font-arabic text-xl font-semibold leading-loose text-foreground'
          : 'font-arabic text-lg leading-loose text-foreground sm:text-xl'
      }
    >
      {highlightToNodes(text, query)}
    </div>
  )
})

export default function NarratorDetail({
  narrator,
  query,
  loading = false,
  standalone = false,
}: NarratorDetailProps) {
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null)
  const { isNarratorBookmarked, addNarratorBookmark, removeNarratorBookmark } =
    useNarratorBookmarks()
  const bookmarked = narrator ? isNarratorBookmarked(narrator.id) : false

  const totalBlocks = narrator?.textBlocks.length ?? 0

  // How many text blocks are currently mounted. Resets whenever the selected
  // narrator changes so a freshly-opened heavy entry starts from the small
  // window again rather than re-rendering thousands of nodes at once.
  const [visibleBlocks, setVisibleBlocks] = useState(INITIAL_BLOCK_COUNT)
  // Reset the streaming window synchronously when the selected narrator changes,
  // so we never render thousands of the *new* entry's blocks against the old
  // (possibly large) count before an effect could correct it.
  const [renderedId, setRenderedId] = useState<string | undefined>(narrator?.id)
  if (narrator?.id !== renderedId) {
    setRenderedId(narrator?.id)
    setVisibleBlocks(INITIAL_BLOCK_COUNT)
  }

  // Stream the remaining blocks in during idle time, one chunk per frame, so no
  // single task is long enough to freeze the tab.
  useEffect(() => {
    if (visibleBlocks >= totalBlocks) return
    const cancel = scheduleIdle(() => {
      setVisibleBlocks((current) => Math.min(current + BLOCK_CHUNK, totalBlocks))
    })
    return cancel
  }, [visibleBlocks, totalBlocks])

  const sourceText = useMemo(() => {
    if (!narrator) return ''
    const pages =
      narrator.startPage === narrator.endPage
        ? `p. ${narrator.startPage}`
        : `pp. ${narrator.startPage}-${narrator.endPage}`
    return `${narrator.source.title}, ${narrator.source.author}, vol. ${narrator.volumeNumber}, ${pages}`
  }, [narrator])
  const displayEntryNumber = narrator?.entryNumber ?? narrator?.sourceEntryNumber
  const pdfViewerUrl = narrator ? getKhoeiRijalViewerUrl(narrator.id) : null
  const scanUrl = narrator ? getKhoeiRijalScanUrl(narrator) : null

  const flash = useCallback((message: string) => {
    setCopyFeedback(message)
    setTimeout(() => setCopyFeedback(null), 1500)
  }, [])

  const copyText = useCallback(async () => {
    if (!narrator) return
    await navigator.clipboard.writeText(narrator.plainText)
    flash('Entry copied')
  }, [flash, narrator])

  const copySource = useCallback(async () => {
    if (!sourceText) return
    await navigator.clipboard.writeText(sourceText)
    flash('Source copied')
  }, [flash, sourceText])

  const toggleBookmark = useCallback(() => {
    if (!narrator) return
    if (isNarratorBookmarked(narrator.id)) removeNarratorBookmark(narrator.id)
    else addNarratorBookmark(narrator)
  }, [addNarratorBookmark, isNarratorBookmarked, narrator, removeNarratorBookmark])

  const renderHighlighted = useCallback(
    (text: string): ReactNode => highlightToNodes(text, query),
    [query],
  )

  if (loading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center rounded-lg border border-border bg-surface-1">
        <Loader2 className="h-6 w-6 animate-spin text-foreground-faint" />
      </div>
    )
  }

  if (!narrator) {
    return (
      <div className="bg-surface-1/60 rounded-lg border border-dashed border-border p-8 text-center">
        <FileText className="mx-auto mb-3 h-8 w-8 text-foreground-faint" />
        <h2 className="text-base font-semibold text-foreground">Select a narrator</h2>
        <p className="mt-1 text-sm text-foreground-muted">
          Search by Arabic name, then open a result to read the full source entry.
        </p>
      </div>
    )
  }

  return (
    <article className="rounded-lg border border-border bg-surface-1 p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-1.5">
            {displayEntryNumber != null && (
              <Badge variant="outline" className="tabular-nums">
                #{displayEntryNumber}
              </Badge>
            )}
            <Badge variant="secondary">Vol. {narrator.volumeNumber}</Badge>
            <Badge variant="outline">
              {narrator.startPage === narrator.endPage
                ? `p. ${narrator.startPage}`
                : `pp. ${narrator.startPage}-${narrator.endPage}`}
            </Badge>
          </div>
          <h1
            className="font-arabic text-2xl font-semibold leading-relaxed text-foreground sm:text-3xl"
            dir="rtl"
          >
            {renderHighlighted(cleanNarratorName(narrator.primaryName))}
          </h1>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-1 sm:shrink-0">
          {!standalone && (
            <Button variant="ghost" size="icon" className="h-8 w-8" title="Open in new tab" asChild>
              <a
                href={`/narrators/${narrator.id}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Open narrator in new tab"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </Button>
          )}
          {pdfViewerUrl && (
            <Button variant="outline" size="sm" className="h-8 gap-1.5" asChild>
              <a href={pdfViewerUrl}>
                <BookOpen className="h-3.5 w-3.5" />
                PDF
              </a>
            </Button>
          )}
          {scanUrl && (
            <Button variant="outline" size="sm" className="h-8 gap-1.5" asChild>
              <a href={scanUrl}>
                <Highlighter className="h-3.5 w-3.5" />
                Scans
              </a>
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className={cn('h-8 gap-1.5', bookmarked && 'text-bookmark hover:text-bookmark')}
            onClick={toggleBookmark}
            aria-pressed={bookmarked}
            title={bookmarked ? 'Remove bookmark' : 'Bookmark this narrator'}
          >
            <Bookmark className={cn('h-3.5 w-3.5', bookmarked && 'fill-current')} />
            {bookmarked ? 'Saved' : 'Save'}
          </Button>
          <Button variant="ghost" size="sm" className="h-8 gap-1.5" onClick={copyText}>
            <Copy className="h-3.5 w-3.5" />
            {copyFeedback === 'Entry copied' ? 'Copied' : 'Copy'}
          </Button>
          <Button variant="ghost" size="sm" className="h-8 gap-1.5" onClick={copySource}>
            <FileText className="h-3.5 w-3.5" />
            {copyFeedback === 'Source copied' ? 'Copied' : 'Source'}
          </Button>
        </div>
      </div>

      <Separator className="my-4" />

      <div className="space-y-4" dir="rtl">
        {narrator.textBlocks.slice(0, visibleBlocks).map((block, index) => (
          <NarratorTextBlock
            key={`${block.pageNumber}-${block.contentId ?? 'block'}-${index}`}
            text={block.text}
            heading={block.kind === 'heading'}
            query={query}
          />
        ))}
      </div>

      {visibleBlocks < totalBlocks && (
        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-foreground-faint">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Loading full entry…
        </div>
      )}

      <Separator className="my-4" />
      <p className="text-xs leading-relaxed text-foreground-faint">{sourceText}</p>
    </article>
  )
}
