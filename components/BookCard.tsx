'use client'

import Link from 'next/link'
import { getBookUrlSlug } from '@/lib/books-config'
import { BOOK_ID_BY_NUMERIC_ID } from '@/lib/books'
import { withBasePath } from '@/lib/assets'
import { cn } from '@/lib/utils'

// Pre-generated WebP thumbnails (scripts/generate-cover-thumbs.mjs) — the
// source JPEGs are up to ~400 KB but display at 80–144 px wide here.
function coverThumbBase(image: string): string {
  return image.replace(/^\/covers\//, '/covers/thumbs/').replace(/\.(jpe?g|png)$/i, '')
}

type Book = {
  id: number
  title: string
  subtitle?: string
  author?: string
  image: string
  highlighted?: boolean
  bookId?: string
}

export default function BookCard({ book }: { book: Book }) {
  const bookId = book.bookId || BOOK_ID_BY_NUMERIC_ID[book.id]
  const href =
    book.id === 1
      ? withBasePath('/al-kafi')
      : bookId
        ? withBasePath(`/${getBookUrlSlug(bookId)}`)
        : '#'

  // Hover styling is pure CSS (group-hover) — no per-card React state.
  const card = (
    <div
      className={cn(
        'shadow-soft rounded-2xl border border-border bg-surface-1',
        'flex items-center gap-4 p-4 transition-all duration-300 sm:gap-6 sm:p-6',
        'group-hover:shadow-glow group-hover:-translate-y-0.5 group-hover:bg-surface-2 group-hover:ring-1 group-hover:ring-white/10',
        'cursor-pointer active:scale-95 sm:active:scale-100',
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={withBasePath(`${coverThumbBase(book.image)}-360w.webp`)}
        srcSet={`${withBasePath(`${coverThumbBase(book.image)}-160w.webp`)} 160w, ${withBasePath(
          `${coverThumbBase(book.image)}-360w.webp`,
        )} 360w`}
        sizes="(max-width: 640px) 80px, 144px"
        alt={`${book.title} cover`}
        width={180}
        height={240}
        loading={book.highlighted ? 'eager' : 'lazy'}
        decoding="async"
        className={cn(
          'shadow-book shrink-0 select-none rounded-lg object-contain transition-transform duration-300',
          'h-28 w-20 sm:h-48 sm:w-36',
          'group-hover:-translate-x-1 group-hover:scale-105 sm:group-hover:-translate-x-2',
        )}
      />

      <div className="min-w-0 flex-1 select-none">
        <h3
          className="select-none break-words text-lg font-semibold tracking-tight text-foreground sm:text-xl"
          title={book.title}
        >
          {book.title}
        </h3>
        {book.subtitle && (
          <p className="mt-1 line-clamp-2 select-none text-sm text-foreground-muted sm:line-clamp-none">
            {book.subtitle}
          </p>
        )}
        {book.author && (
          <p className="mt-1 line-clamp-2 select-none text-xs text-foreground-faint sm:line-clamp-none sm:text-sm">
            {book.author}
          </p>
        )}
      </div>
    </div>
  )

  if (href !== '#') {
    return (
      <Link href={href} className="group block">
        {card}
      </Link>
    )
  }

  return <div className="group">{card}</div>
}
