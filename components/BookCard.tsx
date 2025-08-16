'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import clsx from 'clsx'

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
  const [hovered, setHovered] = useState<boolean>(!!book.highlighted)
  const bookId = book.bookId || bookIdMap[book.id]
  
  // Special routing for Al-Kafi; route others (including Uyun) to generic book pages
  const href = book.id === 1 ? '/al-kafi' : 
               bookId ? `/book/${bookId}` : '#'

  const cardContent = (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(!!book.highlighted)}
      className={clsx(
        'rounded-2xl bg-card border border-theme shadow-soft',
        'flex items-center gap-4 sm:gap-6 p-4 sm:p-6 transition-all duration-300',
        'hover:border-zinc-500/20 hover:bg-card-hover dark:hover:border-zinc-500/30',
        'cursor-pointer active:scale-95 sm:active:scale-100',
        hovered ? 'shadow-glow ring-1 ring-zinc-400/10 dark:ring-zinc-400/20' : 'ring-0',
      )}
      style={{
        transform: hovered ? 'translateY(-2px) scale(1.01)' : 'translateY(0) scale(1)'
      }}
    >
      <Image
        src={book.image}
        alt={`${book.title} cover`}
        width={180}
        height={240}
        className={clsx(
          'rounded-lg shadow-book transition-transform duration-300 object-contain shrink-0',
          'sm:w-36 sm:h-48', // Larger on desktop
          hovered ? 'translate-x-[-4px] sm:translate-x-[-8px] scale-105' : 'translate-x-0 scale-100'
        )}
        priority={book.highlighted}
        quality={95}
        sizes="(max-width: 640px) 120px, (max-width: 1024px) 144px, 180px"
      />

      <div className="min-w-0 flex-1">
        <h3 className="text-lg sm:text-xl font-semibold tracking-tight line-clamp-2">{book.title}</h3>
        {book.subtitle && <p className="text-sm text-muted mt-1 line-clamp-2 sm:line-clamp-none">{book.subtitle}</p>}
        {book.author && (
          <p className="text-xs sm:text-sm text-muted mt-1 line-clamp-2 sm:line-clamp-none">
            {book.author}
          </p>
        )}
        {book.highlighted && (
          <div className="mt-2">
            <span className="text-xs px-2 py-1 rounded-full shadow-soft bg-amber-100 text-gray dark:bg-amber-900/30 dark:text-amber-300">
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
