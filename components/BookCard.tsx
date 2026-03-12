'use client'

import Image from './OptimizedImage'
import Link from 'next/link'
import { useState } from 'react'
import clsx from 'clsx'
import { getBookUrlSlug } from '@/lib/books-config'

type Book = {
  id: number
  title: string
  subtitle?: string
  author?: string
  image: string
  highlighted?: boolean
  bookId?: string // API book ID for routing
}

// Mapping from local IDs to API book IDs
const bookIdMap: Record<number, string> = {
  1: 'Al-Kafi-Volume-1-Kulayni', // Al-Kāfi
  2: 'Uyun-akhbar-al-Rida-Volume-1-Saduq', // ʿUyūn akhbār al-Riḍā
  3: 'Al-Amali-Mufid', // Al-Amālī (Mufid)
  4: 'Al-Amali-Saduq', // Al-Amālī (Saduq)
  5: 'Man-La-Yahduruh-al-Faqih', // Man Lā Yaḥḍuruh al-Faqīh (multi-volume base id)
  6: 'Al-Tawhid-Saduq', // Al-Tawḥīd
  7: 'Kitab-al-Ghayba-Numani', // Kitāb al-Ghayba (Numani)
  8: 'Kitab-al-Ghayba-Tusi', // Kitāb al-Ghayba (Tusi)
  9: 'Nahj-al-Balagha-Radi', // Nahj al-Balāgha
  10: 'Sifat-al-Shia-Saduq', // Ṣifāt al-Shīʿa
  11: 'Fadail-al-Shia-Saduq', // Faḍaʾil al-Shīʿa
  12: 'Kitab-al-Mumin-Ahwazi', // Kitāb al-Muʾmin
  13: 'Kitab-al-Zuhd-Ahwazi', // Kitāb al-Zuhd
  14: 'Risalat-al-Huquq-Abidin', // Risālat al-Ḥuqūq
  15: 'Thawab-al-Amal-wa-iqab-al-Amal-Saduq', // Thawāb al-Aʿmāl wa ʿiqāb al-Aʿmāl
  16: 'Al-Khisal-Saduq', // Al-Khiṣāl
  17: 'Kamil-al-Ziyarat-Qummi', // Kāmil al-Ziyārāt
  18: 'Kitab-al-Duafa-Ghadairi', // Kitāb al-Ḍuʿafāʾ
  19: 'Maani-al-Akhbar-Saduq', // Maʿānī al-ʾAkhbār
  20: 'Mujam-al-Ahadith-al-Mutabara-Muhsini', // Muʿjam al-Aḥādīth al-Muʿtabara
}

export default function BookCard({ book }: { book: Book }) {
  // Start non-hovered so featured books (e.g., Al-Kāfi) don't appear permanently raised.
  // The "Featured" badge is still shown when book.highlighted is true.
  const [hovered, setHovered] = useState<boolean>(false)
  const bookId = book.bookId || bookIdMap[book.id]

  // Special routing for Al-Kafi; route others to clean URL slugs
  const href = book.id === 1 ? '/al-kafi' : bookId ? `/${getBookUrlSlug(bookId)}` : '#'

  const cardContent = (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={clsx(
        'border-theme rounded-2xl border bg-card shadow-soft',
        'flex items-center gap-4 p-4 transition-all duration-300 sm:gap-6 sm:p-6',
        'hover:bg-card-hover hover:border-zinc-500/20 dark:hover:border-zinc-500/30',
        'cursor-pointer active:scale-95 sm:active:scale-100',
        hovered ? 'shadow-glow ring-1 ring-zinc-400/10 dark:ring-zinc-400/20' : 'ring-0',
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
        className={clsx(
          'shrink-0 select-none rounded-lg object-contain shadow-book transition-transform duration-300',
          'sm:h-48 sm:w-36', // Larger on desktop
          hovered
            ? 'translate-x-[-4px] scale-105 sm:translate-x-[-8px]'
            : 'translate-x-0 scale-100',
        )}
        priority={book.highlighted}
        quality={95}
        sizes="(max-width: 640px) 120px, (max-width: 1024px) 144px, 180px"
      />

      <div className="min-w-0 flex-1 select-none">
        <h3
          className="select-none break-words text-lg font-semibold tracking-tight sm:text-xl"
          title={book.title}
        >
          {book.title}
        </h3>
        {book.subtitle && (
          <p className="mt-1 line-clamp-2 select-none text-sm text-muted sm:line-clamp-none">
            {book.subtitle}
          </p>
        )}
        {book.author && (
          <p className="mt-1 line-clamp-2 select-none text-xs text-muted sm:line-clamp-none sm:text-sm">
            {book.author}
          </p>
        )}
        {book.highlighted && (
          <div className="mt-2">
            <span className="text-gray select-none rounded-full bg-amber-100 px-2 py-1 text-xs shadow-soft dark:bg-amber-900/30 dark:text-amber-300">
              Featured
            </span>
          </div>
        )}
      </div>
    </div>
  )

  if (href !== '#') {
    return (
      <Link href={href} className="block">
        {cardContent}
      </Link>
    )
  }

  return cardContent
}
