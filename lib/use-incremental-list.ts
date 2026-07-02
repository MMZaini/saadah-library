'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

/**
 * Windowed rendering for long lists: show the first `batchSize` items and
 * grow the window when a sentinel element scrolls into view (with a "Show
 * all" escape hatch). Chapters can hold hundreds of hadith cards; mounting
 * them all at once makes the initial render and every reflow expensive.
 *
 * The window resets whenever the items array identity changes (new chapter,
 * new filter result).
 */
export function useIncrementalList<T>(items: T[], batchSize = 40) {
  const [visibleCount, setVisibleCount] = useState(batchSize)
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    setVisibleCount(batchSize)
  }, [items, batchSize])

  const hasMore = visibleCount < items.length

  useEffect(() => {
    if (!hasMore) return
    const sentinel = sentinelRef.current
    if (!sentinel || typeof IntersectionObserver === 'undefined') return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisibleCount((count) => Math.min(count + batchSize, items.length))
        }
      },
      // Start loading well before the user reaches the end of the list.
      { rootMargin: '800px 0px' },
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasMore, batchSize, items.length])

  const visibleItems = useMemo(() => items.slice(0, visibleCount), [items, visibleCount])

  return {
    visibleItems,
    hasMore,
    remainingCount: Math.max(items.length - visibleCount, 0),
    sentinelRef,
    showAll: () => setVisibleCount(items.length),
  }
}
