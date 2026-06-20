'use client'

import { useEffect, useState } from 'react'
import { fetchBookStructure } from '@/lib/book-structure'

/**
 * A link to an adjacent chapter within the same volume.
 * `isCrossBook` is true when the neighbour lives in a different category
 * ("book") than the current chapter — used to flag the jump in the UI.
 */
export interface ChapterNavLink {
  categoryId: string
  chapterInCategoryId: number
  chapterName: string
  categoryName: string
  isCrossBook: boolean
}

export interface ChapterNavigation {
  prev: ChapterNavLink | null
  next: ChapterNavLink | null
}

const EMPTY: ChapterNavigation = { prev: null, next: null }

/**
 * Resolves the previous/next chapter for a chapter page.
 *
 * Navigation is scoped to a single volume's `bookId`, so it never crosses
 * volumes. It traverses every chapter of every category in that volume in the
 * same order the explorer displays them (categories by numeric id, chapters by
 * `chapterInCategoryId`), so "next" always matches what the reader sees in the
 * explorer. Crossing into a different category within the volume is allowed and
 * flagged via `isCrossBook`.
 *
 * Reads the lightweight book-structure metadata (prefetched into IndexedDB on
 * app load), so this is normally an instant cache hit with no network request.
 * Degrades to `{ prev: null, next: null }` if the structure is unavailable.
 */
export function useChapterNavigation(
  volumeBookId: string,
  categoryId: string,
  chapterInCategoryId: number,
): ChapterNavigation {
  const [nav, setNav] = useState<ChapterNavigation>(EMPTY)

  useEffect(() => {
    let cancelled = false

    if (!volumeBookId || !categoryId || Number.isNaN(chapterInCategoryId)) {
      setNav(EMPTY)
      return
    }

    setNav(EMPTY)
    ;(async () => {
      const structure = await fetchBookStructure(volumeBookId)
      if (cancelled) return
      if (!structure) {
        setNav(EMPTY)
        return
      }

      // Flatten to the reading-order list. Sort defensively so the order is
      // correct regardless of how the structure JSON happens to be keyed.
      const flat: ChapterNavLink[] = []
      const categories = Object.values(structure).sort(
        (a, b) => Number(a.categoryId) - Number(b.categoryId),
      )
      for (const cat of categories) {
        const chapters = Object.values(cat.chapters).sort(
          (a, b) => a.chapterInCategoryId - b.chapterInCategoryId,
        )
        for (const ch of chapters) {
          flat.push({
            categoryId: String(cat.categoryId),
            chapterInCategoryId: ch.chapterInCategoryId,
            chapterName: ch.chapter,
            categoryName: cat.category,
            isCrossBook: false,
          })
        }
      }

      const idx = flat.findIndex(
        (c) => c.categoryId === categoryId && c.chapterInCategoryId === chapterInCategoryId,
      )
      if (idx === -1) {
        setNav(EMPTY)
        return
      }

      const currentCategoryId = flat[idx].categoryId
      const toLink = (c: ChapterNavLink | undefined): ChapterNavLink | null =>
        c ? { ...c, isCrossBook: c.categoryId !== currentCategoryId } : null

      setNav({ prev: toLink(flat[idx - 1]), next: toLink(flat[idx + 1]) })
    })()

    return () => {
      cancelled = true
    }
  }, [volumeBookId, categoryId, chapterInCategoryId])

  return nav
}
