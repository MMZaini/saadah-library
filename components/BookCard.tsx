'use client'

import Image from './OptimizedImage'
import Link from 'next/link'
import { getBookUrlSlug } from '@/lib/books-config'

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
  const bookId = book.bookId || bookIdMap[book.id]
  const href = book.id === 1 ? '/al-kafi' : bookId ? `/${getBookUrlSlug(bookId)}` : '#'

  const card = (
    <div className="group flex items-center gap-4 rounded-lg border border-border bg-surface-1 p-3 transition-colors hover:bg-surface-2 sm:gap-5 sm:p-4">
      <Image
        src={book.image}
        alt={`${book.title} cover`}
        width={180}
        height={240}
        className="h-28 w-20 shrink-0 rounded object-contain sm:h-36 sm:w-24"
        priority={book.highlighted}
        quality={95}
        sizes="(max-width: 640px) 80px, 96px"
      />

      <div className="min-w-0 flex-1">
        <h3 className="text-base font-semibold leading-snug tracking-tight text-foreground sm:text-lg">
          {book.title}
        </h3>
        {book.subtitle && (
          <p className="mt-0.5 line-clamp-2 text-sm text-foreground-muted">{book.subtitle}</p>
        )}
        {book.author && (
          <p className="mt-1 text-xs text-foreground-faint sm:text-sm">{book.author}</p>
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
