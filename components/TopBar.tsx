'use client'

import Link from 'next/link'
import { usePathname, useParams, useRouter } from 'next/navigation'
import { IconMenu, IconArrowLeft, IconBook, IconBookmark } from './Icons'
import { getBookConfig, getBookIdFromUrlSlug } from '@/lib/books-config'
import { books } from '@/lib/books'
import { useSettings } from '@/lib/settings-context'
import clsx from 'clsx'
import { useChapter } from '@/lib/chapter-context'
import { useNavigation } from '@/lib/navigation-context'
import { useBookmarks } from '@/lib/bookmarks-context'

export default function TopBar() {
  const { toggleSettings, isSettingsOpen } = useSettings()
  const { chapterInfo } = useChapter()
  const { bookmarkCount } = useBookmarks()
  const navigation = useNavigation()
  const pathname = usePathname()
  const params = useParams()
  const router = useRouter()

  // derive bookId when on generic book routes
  const currentBookSlug = pathname.startsWith('/book/') ? params.bookId as string | null : 
                         pathname !== '/' && pathname !== '/al-kafi' && !pathname.startsWith('/al-kafi/') && !pathname.includes('/Uyun-akhbar-al-Rida') ? 
                         (params.bookSlug as string | null) : null
  const currentBookId = currentBookSlug ? getBookIdFromUrlSlug(currentBookSlug) : null

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
  const isUyunChapterPage = false // ʿUyūn now uses generic routes
  const isGenericChapterPage = (pathname.startsWith('/book/') || (pathname !== '/' && pathname !== '/al-kafi' && !pathname.startsWith('/al-kafi/'))) && pathname.includes('/chapter/')
  const isChapterPage = isAlKafiChapterPage || isUyunChapterPage || isGenericChapterPage
  
  // Parse hadith page parameters for all book types
  const isAlKafiHadithPage = pathname.includes('/al-kafi/hadith/')
  const isUyunHadithPage = false // ʿUyūn now uses generic routes
  const isGenericHadithPage = (pathname !== '/' && pathname !== '/al-kafi' && !pathname.startsWith('/al-kafi/')) && pathname.includes('/hadith/')
  const isHadithPage = isAlKafiHadithPage || isUyunHadithPage || isGenericHadithPage
  
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
    <div
      className={clsx(
        'fixed top-0 left-0 right-0 z-40 backdrop-blur-sm border-b border-theme shadow-soft',
        isSettingsOpen && 'blur-sm'
      )}
      style={{ background: 'var(--topbar-bg)' }}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Left side - Logo/Title and Breadcrumb */}
          <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
            {/* Back button for chapter pages */}
            {isChapterPage && (
              <button
                onClick={() => {
                  if (isAlKafiChapterPage) {
                    router.push('/al-kafi')
                  } else if (isGenericChapterPage && currentBookSlug) {
                    router.push(`/${currentBookSlug}`)
                  }
                }}
                className="p-2 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors focus-visible:outline-2 flex-shrink-0"
              >
                <IconArrowLeft className="h-5 w-5 text-primary/80 hover:text-primary" />
              </button>
            )}

            <Link href="/" onClick={handleTitleClick} className="flex items-center gap-2 flex-shrink-0 group">
                <h1 className="text-xl sm:text-2xl font-bold relative overflow-hidden cursor-pointer font-arabic select-none">
                <span className="library-title-gradient select-none">
                  مكتبة السعادة
                </span>
              </h1>
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
                {pathname === '/bookmarks' && (
                  <span className="font-medium text-primary truncate">Bookmarks</span>
                )}
                {pathname === '/Uyun-akhbar-al-Rida' && (
                  <span className="font-medium text-primary truncate">ʿUyūn akhbār al-Riḍā Explorer</span>
                )}
                {(pathname.startsWith('/book/') || (currentBookSlug && pathname !== '/' && pathname !== '/al-kafi' && !pathname.startsWith('/al-kafi/') && !pathname.includes('/Uyun-akhbar-al-Rida'))) && !isGenericChapterPage && (
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
                {pathname.startsWith('/Uyun-akhbar-al-Rida/volume/') && !isUyunChapterPage && (
                  <span className="font-medium text-primary truncate">ʿUyūn akhbār al-Riḍā Volume</span>
                )}
                {isAlKafiChapterPage && chapterInfo && (
                  <div className="flex items-center gap-2 min-w-0">
                    <IconBook className="h-4 w-4 text-amber-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="font-medium text-primary truncate">
                        <span className="hidden md:inline">
                          <span className="group hover:text-amber-400 transition-colors">
                            <Link href="/al-kafi" className="group-hover:text-amber-400 transition-colors">
                              Al-Kāfi
                            </Link>
                            {' '}
                            <Link href="/al-kafi" className="group-hover:text-amber-400 transition-colors">
                              Volume {chapterInfo.volumeId}
                            </Link>
                          </span>
                          {' • '}
                        </span>
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
                        <span className="hidden md:inline">
                          <span className="group hover:text-emerald-400 transition-colors">
                            {currentBookSlug ? (
                              <Link href={`/${currentBookSlug}`} className="group-hover:text-emerald-400 transition-colors">
                                {displayBookTitle}
                              </Link>
                            ) : (
                              displayBookTitle
                            )}
                            {' '}
                            {currentBookSlug ? (
                              <Link href={`/${currentBookSlug}`} className="group-hover:text-emerald-400 transition-colors">
                                Volume {chapterInfo.volumeId}
                              </Link>
                            ) : (
                              `Volume ${chapterInfo.volumeId}`
                            )}
                          </span>
                          {' • '}
                        </span>
                        <span className="truncate">{chapterInfo.chapter}</span>
                      </div>
                      <div className="text-xs text-secondary truncate md:block hidden">
                        {chapterInfo.category} • {chapterInfo.hadithCount} Hadiths
                      </div>
                    </div>
                  </div>
                )}
                {isAlKafiHadithPage && chapterInfo && (
                  <div className="flex items-center gap-2 min-w-0">
                    <IconBook className="h-4 w-4 text-amber-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="font-medium text-primary truncate">
                        <span className="hidden md:inline">
                          <span className="group hover:text-amber-400 transition-colors">
                            <Link href="/al-kafi" className="group-hover:text-amber-400 transition-colors">
                              Al-Kāfi
                            </Link>
                            {' '}
                            <Link href="/al-kafi" className="group-hover:text-amber-400 transition-colors">
                              Volume {chapterInfo.volumeId}
                            </Link>
                          </span>
                          {' • '}
                        </span>
                        <span className="truncate">{chapterInfo.chapter}</span>
                      </div>
                      <div className="text-xs text-secondary truncate md:block hidden">
                        {chapterInfo.category} • Hadith
                      </div>
                    </div>
                  </div>
                )}
                {isGenericHadithPage && chapterInfo && (
                  <div className="flex items-center gap-2 min-w-0">
                    <IconBook className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="font-medium text-primary truncate">
                        <span className="hidden md:inline">
                          <span className="group hover:text-emerald-400 transition-colors">
                            {currentBookSlug ? (
                              <Link href={`/${currentBookSlug}`} className="group-hover:text-emerald-400 transition-colors">
                                {displayBookTitle}
                              </Link>
                            ) : (
                              displayBookTitle
                            )}
                            {' '}
                            {currentBookSlug ? (
                              <Link href={`/${currentBookSlug}`} className="group-hover:text-emerald-400 transition-colors">
                                Volume {chapterInfo.volumeId}
                              </Link>
                            ) : (
                              `Volume ${chapterInfo.volumeId}`
                            )}
                          </span>
                          {' • '}
                        </span>
                        <span className="truncate">{chapterInfo.chapter}</span>
                      </div>
                      <div className="text-xs text-secondary truncate md:block hidden">
                        {chapterInfo.category} • Hadith
                      </div>
                    </div>
                  </div>
                )}
                {isAlKafiChapterPage && !chapterInfo && (
                  <div className="flex items-center gap-2">
                    <IconBook className="h-4 w-4 text-amber-400 flex-shrink-0" />
                    <span className="font-medium text-primary truncate">
                      <span className="group hover:text-amber-400 transition-colors">
                        <Link href="/al-kafi" className="group-hover:text-amber-400 transition-colors">
                          Al-Kāfi
                        </Link>
                        {' '}
                        <Link href="/al-kafi" className="group-hover:text-amber-400 transition-colors">
                          Volume {volumeId}
                        </Link>
                      </span>
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right side - Actions */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {/* Bookmarks Button */}
            <Link
              href="/bookmarks"
              className="relative p-2 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors focus-visible:outline-2 focus-visible:outline-amber-500/50"
              title={`Bookmarks (${bookmarkCount})`}
            >
              <IconBookmark className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-600 dark:text-yellow-500 hover:text-yellow-700 dark:hover:text-yellow-400" />
              {bookmarkCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-yellow-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center min-w-[20px] text-center">
                  {bookmarkCount > 99 ? '99+' : bookmarkCount}
                </span>
              )}
            </Link>
            
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
