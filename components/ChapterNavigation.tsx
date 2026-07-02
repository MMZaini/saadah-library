'use client'

import Link from 'next/link'
import { ChevronLeft, ChevronRight, BookOpen } from 'lucide-react'
import { withBasePath } from '@/lib/assets'
import { cn } from '@/lib/utils'
import type { ChapterNavLink } from '@/lib/use-chapter-navigation'

interface ChapterNavigationProps {
  prev: ChapterNavLink | null
  next: ChapterNavLink | null
  /** Builds an unprefixed library path; this component applies /read. */
  buildHref: (categoryId: string, chapterInCategoryId: number) => string
  className?: string
}

/**
 * Previous/next chapter pager shown at the bottom of a chapter page. A button
 * renders only when that neighbour exists, and the two columns stay fixed
 * (prev left, next right) via spacers. When a neighbour is in a different
 * category ("book") within the volume, it's flagged with a book icon and the
 * category name.
 */
export default function ChapterNavigation({
  prev,
  next,
  buildHref,
  className,
}: ChapterNavigationProps) {
  if (!prev && !next) return null

  return (
    <nav aria-label="Chapter navigation" className={cn('grid grid-cols-2 gap-3', className)}>
      {prev ? (
        <Link
          href={withBasePath(buildHref(prev.categoryId, prev.chapterInCategoryId))}
          className="group flex items-center gap-3 rounded-lg border border-border bg-surface-1 p-3.5 text-left transition-colors hover:border-foreground-faint hover:bg-surface-2 sm:p-4"
        >
          <ChevronLeft className="h-5 w-5 shrink-0 text-foreground-faint transition-colors group-hover:text-foreground" />
          <span className="min-w-0">
            <span className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-wide text-foreground-faint">
              {prev.isCrossBook && <BookOpen className="h-3 w-3 shrink-0" />}
              {prev.isCrossBook ? 'Previous book' : 'Previous'}
            </span>
            <span className="mt-0.5 block truncate text-sm font-medium text-foreground">
              {prev.chapterName}
            </span>
            {prev.isCrossBook && prev.categoryName !== prev.chapterName && (
              <span className="block truncate text-xs text-foreground-muted">
                {prev.categoryName}
              </span>
            )}
          </span>
        </Link>
      ) : (
        <div aria-hidden />
      )}

      {next ? (
        <Link
          href={withBasePath(buildHref(next.categoryId, next.chapterInCategoryId))}
          className="group flex items-center justify-end gap-3 rounded-lg border border-border bg-surface-1 p-3.5 text-right transition-colors hover:border-foreground-faint hover:bg-surface-2 sm:p-4"
        >
          <span className="min-w-0">
            <span className="flex items-center justify-end gap-1 text-[11px] font-medium uppercase tracking-wide text-foreground-faint">
              {next.isCrossBook && <BookOpen className="h-3 w-3 shrink-0" />}
              {next.isCrossBook ? 'Next book' : 'Next'}
            </span>
            <span className="mt-0.5 block truncate text-sm font-medium text-foreground">
              {next.chapterName}
            </span>
            {next.isCrossBook && next.categoryName !== next.chapterName && (
              <span className="block truncate text-xs text-foreground-muted">
                {next.categoryName}
              </span>
            )}
          </span>
          <ChevronRight className="h-5 w-5 shrink-0 text-foreground-faint transition-colors group-hover:text-foreground" />
        </Link>
      ) : (
        <div aria-hidden />
      )}
    </nav>
  )
}
