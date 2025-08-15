'use client'

import Link from 'next/link'
import { usePathname, useParams, useRouter } from 'next/navigation'
import { IconMenu, IconArrowLeft, IconBook } from './Icons'
import { getBookConfig } from '@/lib/books-config'
import { books } from '@/lib/books'
import { useSettings } from '@/lib/settings-context'
import { useChapter } from '@/lib/chapter-context'
import { useNavigation } from '@/lib/navigation-context'

export default function TopBar() {
  const { toggleSettings } = useSettings()
  const { chapterInfo } = useChapter()
  const navigation = useNavigation()
  const pathname = usePathname()
  const params = useParams()
  const router = useRouter()

  // derive bookId when on generic book routes
  const currentBookId = pathname.startsWith('/book/') ? params.bookId as string | null : null

  const humanizeBookId = (id?: string | null) => {
    if (!id) return ''
    // remove common prefixes and volume tokens, replace dashes with spaces
    return id.replace(/-/g, ' ').replace(/\bvolume\b \d+/i, '').replace(/\bSaduq\b/i, '').trim()
  }

  const normalize = (s: string) =>
    s
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{M}/gu, '') // remove diacritics
      .replace(/[^a-z0-9]+/g, '')

  const findTitleFromBooksList = (id?: string | null) => {
    if (!id) return null
    const normId = normalize(id)
    for (const b of books) {
      const normTitle = normalize(b.title)
      if (!normTitle) continue
      if (normId.includes(normTitle) || normTitle.includes(normId)) return b.title
    }
    return null
  }

  // Parse chapter page parameters for both Al-Kafi and ʿUyūn
  const isAlKafiChapterPage = pathname.includes('/al-kafi/volume/') && pathname.includes('/chapter/')
  const isUyunChapterPage = pathname.includes('/uyun-akhbar-al-rida/volume/') && pathname.includes('/chapter/')
  const isGenericChapterPage = pathname.startsWith('/book/') && pathname.includes('/chapter/')
  const isChapterPage = isAlKafiChapterPage || isUyunChapterPage || isGenericChapterPage
  const volumeId = isChapterPage ? params.volumeId : null

  const displayBookTitle = currentBookId
    ? (findTitleFromBooksList(currentBookId) || getBookConfig(currentBookId)?.englishName || humanizeBookId(currentBookId))
    : ''

  // Handle clicking the library title
  const handleTitleClick = (e: React.MouseEvent) => {
    if (pathname === '/') {
      // If we're already on the main page, clear search instead of navigating
      e.preventDefault()
      // Clear search state in navigation context
      navigation.saveSearchState(null)
      // Trigger a custom event that the main page can listen for
      window.dispatchEvent(new CustomEvent('clearSearch'))
    }
    // If we're on another page, let the Link handle navigation normally
  }

  return (
    <div className="sticky top-0 z-50 backdrop-blur-sm border-b border-theme shadow-soft" style={{ background: 'var(--topbar-bg)' }}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Left side - Logo/Title and Breadcrumb */}
          <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
            {/* Back button for chapter pages */}
            {isChapterPage && (
              <button
                onClick={() => {
                  if (isUyunChapterPage) {
                    router.push('/uyun-akhbar-al-rida')
                  } else if (isAlKafiChapterPage) {
                    router.push('/al-kafi')
                  } else if (isGenericChapterPage && currentBookId) {
                    router.push(`/book/${currentBookId}`)
                  }
                }}
                className="p-2 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors focus-visible:outline-2 flex-shrink-0"
              >
                <IconArrowLeft className="h-5 w-5 text-primary/80 hover:text-primary" />
              </button>
            )}

            <Link href="/" onClick={handleTitleClick} className="flex items-center gap-2 hover:opacity-80 transition-opacity flex-shrink-0">
              <h1 className="text-lg sm:text-xl font-bold text-primary">مكتبة السعادة</h1>
            </Link>
            
            {/* Breadcrumb - Hidden on small screens, optimized for medium+ */}
            {pathname !== '/' && (
              <div className="hidden sm:flex items-center gap-2 text-sm min-w-0">
                <svg className="w-4 h-4 text-secondary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                {pathname === '/al-kafi' && (
                  <span className="font-medium text-primary truncate">Al-Kāfi Explorer</span>
                )}
                {pathname === '/uyun-akhbar-al-rida' && (
                  <span className="font-medium text-primary truncate">ʿUyūn akhbār al-Riḍā Explorer</span>
                )}
                {pathname.startsWith('/book/') && !isGenericChapterPage && (
                  <span className="font-medium text-primary truncate">
                    {currentBookId
                      ? (findTitleFromBooksList(currentBookId) || getBookConfig(currentBookId)?.englishName || humanizeBookId(currentBookId))
                      : 'Book'
                    }
                  </span>
                )}
                {pathname.startsWith('/al-kafi/volume/') && !isAlKafiChapterPage && (
                  <span className="font-medium text-primary truncate">Al-Kāfi Volume</span>
                )}
                {pathname.startsWith('/uyun-akhbar-al-rida/volume/') && !isUyunChapterPage && (
                  <span className="font-medium text-primary truncate">ʿUyūn akhbār al-Riḍā Volume</span>
                )}
                {isAlKafiChapterPage && chapterInfo && (
                  <div className="flex items-center gap-2 min-w-0">
                    <IconBook className="h-4 w-4 text-amber-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="font-medium text-primary truncate">
                        <span className="hidden md:inline">Al-Kāfi Volume {chapterInfo.volumeId} • </span>
                        <span className="truncate">{chapterInfo.chapter}</span>
                      </div>
                      <div className="text-xs text-secondary truncate md:block hidden">
                        {chapterInfo.category} • {chapterInfo.hadithCount} Hadiths
                      </div>
                    </div>
                  </div>
                )}
                {isUyunChapterPage && chapterInfo && (
                  <div className="flex items-center gap-2 min-w-0">
                    <IconBook className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="font-medium text-primary truncate">
                        <span className="hidden md:inline">ʿUyūn Volume {chapterInfo.volumeId} • </span>
                        <span className="truncate">{chapterInfo.chapter}</span>
                      </div>
                      <div className="text-xs text-secondary truncate md:block hidden">
                        {chapterInfo.category} • {chapterInfo.hadithCount} Hadiths
                      </div>
                    </div>
                  </div>
                )}
                {isGenericChapterPage && chapterInfo && (
                  <div className="flex items-center gap-2 min-w-0">
                    <IconBook className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="font-medium text-primary truncate">
                        <span className="hidden md:inline">{displayBookTitle} Volume {chapterInfo.volumeId} • </span>
                        <span className="truncate">{chapterInfo.chapter}</span>
                      </div>
                      <div className="text-xs text-secondary truncate md:block hidden">
                        {chapterInfo.category} • {chapterInfo.hadithCount} Hadiths
                      </div>
                    </div>
                  </div>
                )}
                {isAlKafiChapterPage && !chapterInfo && (
                  <div className="flex items-center gap-2">
                    <IconBook className="h-4 w-4 text-amber-400 flex-shrink-0" />
                    <span className="font-medium text-primary truncate">
                      Al-Kāfi Volume {volumeId}
                    </span>
                  </div>
                )}
                {isUyunChapterPage && !chapterInfo && (
                  <div className="flex items-center gap-2">
                    <IconBook className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                    <span className="font-medium text-primary truncate">
                      ʿUyūn Volume {volumeId}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right side - Actions */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <button 
              onClick={toggleSettings}
              className="p-2 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors focus-visible:outline-2 focus-visible:outline-amber-500/50"
              title="Settings"
            >
              <IconMenu className="h-5 w-5 sm:h-6 sm:w-6 text-primary/80 hover:text-primary" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
