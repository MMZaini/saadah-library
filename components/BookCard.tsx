'use client'

import { useState } from 'react'
import Image from './OptimizedImage'
import Link from 'next/link'
import { getBookUrlSlug } from '@/lib/books-config'
import { cn } from '@/lib/utils'

type Book = {
  id: number
  title: string
  subtitle?: string
  author?: string
  image: string
  highlighted?: boolean
  bookId?: string
}

const bookIdMap: Record<number, string> = {
  1: 'Al-Kafi-Volume-1-Kulayni',
  2: 'Uyun-akhbar-al-Rida-Volume-1-Saduq',
  3: 'Al-Amali-Mufid',
  4: 'Al-Amali-Saduq',
  5: 'Man-La-Yahduruh-al-Faqih',
  6: 'Al-Tawhid-Saduq',
  7: 'Kitab-al-Ghayba-Numani',
  8: 'Kitab-al-Ghayba-Tusi',
  9: 'Nahj-al-Balagha-Radi',
  10: 'Sifat-al-Shia-Saduq',
  11: 'Fadail-al-Shia-Saduq',
  12: 'Kitab-al-Mumin-Ahwazi',
  13: 'Kitab-al-Zuhd-Ahwazi',
  14: 'Risalat-al-Huquq-Abidin',
  15: 'Thawab-al-Amal-wa-iqab-al-Amal-Saduq',
  16: 'Al-Khisal-Saduq',
  17: 'Kamil-al-Ziyarat-Qummi',
  18: 'Kitab-al-Duafa-Ghadairi',
  19: 'Maani-al-Akhbar-Saduq',
  20: 'Mujam-al-Ahadith-al-Mutabara-Muhsini',
}

export default function BookCard({ book }: { book: Book }) {
  const [hovered, setHovered] = useState(false)
  const bookId = book.bookId || bookIdMap[book.id]
  const href = book.id === 1 ? '/al-kafi' : bookId ? `/${getBookUrlSlug(bookId)}` : '#'

  const card = (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={cn(
        'shadow-soft rounded-2xl border border-border bg-surface-1',
        'flex items-center gap-4 p-4 transition-all duration-300 sm:gap-6 sm:p-6',
        'hover:bg-surface-2',
        'cursor-pointer active:scale-95 sm:active:scale-100',
        hovered && 'shadow-glow ring-1 ring-white/10',
      )}
      style={{
        transform: hovered ? 'translateY(-2px) scale(1.01)' : 'translateY(0) scale(1)',
      }}
    >
      <Image
        src={book.image}
        alt={`${book.title} cover`}
        width={180}
        height={240}
        className={cn(
          'shadow-book shrink-0 select-none rounded-lg object-contain transition-transform duration-300',
          'h-28 w-20 sm:h-48 sm:w-36',
          hovered
            ? 'translate-x-[-4px] scale-105 sm:translate-x-[-8px]'
            : 'translate-x-0 scale-100',
        )}
        priority={book.highlighted}
        quality={95}
        sizes="(max-width: 640px) 80px, (max-width: 1024px) 144px, 180px"
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
      <Link href={href} className="block">
        {card}
      </Link>
    )
  }

  return card
}
