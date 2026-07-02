'use client'

import { useEffect, useState } from 'react'
import { bookApi, Hadith } from './api'

export interface HadithChapterPosition {
  /** 1-based position of the hadith within its chapter's reading order. */
  index: number
  /** Number of hadiths in the chapter. */
  total: number
}

/**
 * Resolves where a hadith sits inside its chapter ("Hadith 4 of 9"). The
 * volume payload is already cached from loading the hadith itself, so this
 * costs no extra network. Returns null until known (or when unresolvable).
 */
export function useHadithChapterPosition(hadith: Hadith | null): HadithChapterPosition | null {
  const [position, setPosition] = useState<HadithChapterPosition | null>(null)

  useEffect(() => {
    let cancelled = false
    setPosition(null)
    if (!hadith?.bookId || !hadith.categoryId || hadith.chapterInCategoryId == null) return

    bookApi
      .getChapterHadiths(hadith.bookId, hadith.categoryId, hadith.chapterInCategoryId)
      .then((chapterHadiths) => {
        if (cancelled) return
        const sorted = [...chapterHadiths].sort((a, b) => a.id - b.id)
        const index = sorted.findIndex((h) => h.id === hadith.id)
        if (index !== -1) setPosition({ index: index + 1, total: sorted.length })
      })
      .catch(() => {
        // Position is a nicety — silently omit it when unavailable.
      })

    return () => {
      cancelled = true
    }
  }, [hadith])

  return position
}
