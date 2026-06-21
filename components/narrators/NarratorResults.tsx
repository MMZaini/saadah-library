'use client'

import Link from 'next/link'
import { Languages, Loader2, Search, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { containsArabic, getHighlightSegments } from '@/lib/search-utils'
import { cleanNarratorName } from '@/lib/data/rijal-display'
import type { NarratorSearchResult } from '@/lib/data/rijal-types'

interface NarratorResultsProps {
  query: string
  results: NarratorSearchResult[]
  total: number
  selectedId: string | null
  loading: boolean
  error: string | null
  onSelect: (id: string) => void
  onClear: () => void
}

export default function NarratorResults({
  query,
  results,
  total,
  selectedId,
  loading,
  error,
  onSelect,
  onClear,
}: NarratorResultsProps) {
  const trimmed = query.trim()
  // The narrator dataset is Arabic-only, so a query with no Arabic characters can
  // never match — surface that explicitly rather than a generic "not found".
  const queryIsArabic = containsArabic(trimmed)

  const highlightedName = (name: string) => {
    if (!trimmed) return name
    const segments = getHighlightSegments(name, trimmed)
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

  return (
    <div className="rounded-lg border border-border bg-surface-1">
      <div className="flex items-start justify-between gap-3 border-b border-border p-4">
        <div className="min-w-0">
          <h2 className="truncate text-base font-semibold text-foreground">
            {trimmed ? `Results for “${query}”` : 'Narrator Search'}
          </h2>
          <p className="mt-1 text-sm text-foreground-muted">
            {loading ? (
              <span className="flex items-center gap-1.5">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-accent" />
                Searching…
              </span>
            ) : trimmed ? (
              <>
                <span className="font-medium text-accent">{total}</span>{' '}
                {total === 1 ? 'narrator' : 'narrators'} found
              </>
            ) : (
              'Search by Arabic name or structured alias.'
            )}
          </p>
        </div>
        {trimmed && (
          <Button variant="ghost" size="sm" className="h-8 gap-1.5" onClick={onClear}>
            <X className="h-3.5 w-3.5" />
            Clear
          </Button>
        )}
      </div>

      {error && (
        <div className="border-b border-border px-4 py-3 text-sm text-destructive">{error}</div>
      )}

      <div className="max-h-[calc(100vh-16rem)] overflow-y-auto p-2">
        {loading && results.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-foreground-faint" />
          </div>
        ) : results.length > 0 ? (
          <div className="space-y-1.5">
            {results.map((result) => (
              <Link
                key={result.id}
                href={`/narrators/${result.id}`}
                onClick={(event) => {
                  // Modified clicks (Ctrl/Cmd/middle) fall through to the browser so
                  // the narrator opens in a new tab; a plain click selects in place.
                  if (
                    event.metaKey ||
                    event.ctrlKey ||
                    event.shiftKey ||
                    event.altKey ||
                    event.button !== 0
                  ) {
                    return
                  }
                  event.preventDefault()
                  onSelect(result.id)
                }}
                className={cn(
                  'block w-full rounded-md border p-3 text-left transition-colors',
                  selectedId === result.id
                    ? 'bg-accent/10 border-accent'
                    : 'border-transparent hover:border-border hover:bg-surface-2',
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h3
                      className="font-arabic text-lg font-semibold leading-relaxed text-foreground"
                      dir="rtl"
                    >
                      {highlightedName(cleanNarratorName(result.primaryName))}
                    </h3>
                  </div>
                  <Badge variant="outline" className="shrink-0 tabular-nums">
                    {result.entryNumber != null || result.sourceEntryNumber != null
                      ? `#${result.entryNumber ?? result.sourceEntryNumber}`
                      : `Vol. ${result.volumeNumber}`}
                  </Badge>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5 text-xs text-foreground-faint">
                  <span>Vol. {result.volumeNumber}</span>
                  <span>·</span>
                  <span>
                    {result.startPage === result.endPage
                      ? `p. ${result.startPage}`
                      : `pp. ${result.startPage}-${result.endPage}`}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : trimmed ? (
          queryIsArabic ? (
            <div className="py-16 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-border bg-surface-2">
                <Search className="h-5 w-5 text-foreground-faint" />
              </div>
              <h3 className="text-base font-medium text-foreground">No narrators found</h3>
              <p className="mt-1 text-sm text-foreground-muted">
                Try a shorter Arabic name or a known alias.
              </p>
            </div>
          ) : (
            <div className="py-16 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-border bg-surface-2">
                <Languages className="h-5 w-5 text-foreground-faint" />
              </div>
              <h3 className="text-base font-medium text-foreground">Arabic search only</h3>
              <p className="mx-auto mt-1 max-w-xs text-sm text-foreground-muted">
                Currently, only Arabic searches are available. Enter the narrator’s name in Arabic.
              </p>
            </div>
          )
        ) : (
          <div className="py-14 text-center">
            <Search className="mx-auto mb-3 h-7 w-7 text-foreground-faint" />
            <p className="text-sm text-foreground-muted">
              Use the search field above to find a narrator entry.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
