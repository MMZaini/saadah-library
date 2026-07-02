'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { BookOpen, ChevronRight } from 'lucide-react'
import { getReadingHistory, type ReadingHistoryEntry } from '@/lib/reading-history'
import { withBasePath } from '@/lib/assets'

/**
 * "Continue reading" strip on the homepage — the last few chapters the reader
 * visited, straight from localStorage. Loaded after mount so SSR markup stays
 * stable; renders nothing for first-time visitors.
 */
export default function ContinueReading() {
  const [entries, setEntries] = useState<ReadingHistoryEntry[]>([])

  useEffect(() => {
    setEntries(getReadingHistory())
  }, [])

  if (entries.length === 0) return null

  return (
    <div className="mb-8">
      <h2 className="mb-3 text-sm font-medium text-foreground-muted">Continue reading</h2>
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {entries.map((entry) => (
          <Link
            key={entry.path}
            href={withBasePath(entry.path)}
            className="group flex items-center gap-3 rounded-lg border border-border bg-surface-1 px-3.5 py-3 transition-colors hover:bg-surface-2"
          >
            <BookOpen className="h-4 w-4 shrink-0 text-foreground-faint" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-foreground">
                {entry.chapter}
              </span>
              <span className="block truncate text-xs text-foreground-muted">
                {entry.bookTitle}
              </span>
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 text-foreground-faint transition-colors group-hover:text-foreground-muted" />
          </Link>
        ))}
      </div>
    </div>
  )
}
