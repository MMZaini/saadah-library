'use client'

import Link from 'next/link'
import { usePathname, useParams, useRouter } from 'next/navigation'
import { IconMenu, IconArrowLeft, IconBook, IconBookmark } from './Icons'
import { getBookConfig, getBookIdFromUrlSlug } from '@/lib/books-config'
import { books } from '@/lib/books'
import { useSettings } from '@/lib/settings-context'
import { useChapter } from '@/lib/chapter-context'
import { useNavigation } from '@/lib/navigation-context'
import { useBookmarks } from '@/lib/bookmarks-context'

export default function TopBar() {
  const { toggleSettings } = useSettings()
  const { chapterInfo } = useChapter()
  const { bookmarkCount } = useBookmarks()
  const navigation = useNavigation()
  const pathname = usePathname()
  const params = useParams()
  const router = useRouter()

  // derive bookId when on generic book routes
  const currentBookSlug = pathname.startsWith('/book/')
    ? (params.bookId as string | null)
    : pathname !== '/' &&
        pathname !== '/al-kafi' &&
        !pathname.startsWith('/al-kafi/') &&
        !pathname.includes('/Uyun-akhbar-al-Rida')
      ? (params.bookSlug as string | null)
      : null
  const currentBookId = currentBookSlug ? getBookIdFromUrlSlug(currentBookSlug) : null

  const humanizeBookId = (id?: string | null) => {
    if (!id) return ''
    // remove common prefixes and volume tokens, replace dashes with spaces
    return id
      .replace(/-/g, ' ')
      .replace(/\bvolume\b \d+/i, '')
      .replace(/\bSaduq\b/i, '')
      .trim()
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
  const isAlKafiChapterPage =
    pathname.includes('/al-kafi/volume/') && pathname.includes('/chapter/')
  const isUyunChapterPage = false // ʿUyūn now uses generic routes
  const isGenericChapterPage =
    (pathname.startsWith('/book/') ||
      (pathname !== '/' && pathname !== '/al-kafi' && !pathname.startsWith('/al-kafi/'))) &&
    pathname.includes('/chapter/')
  const isChapterPage = isAlKafiChapterPage || isUyunChapterPage || isGenericChapterPage

  // Parse hadith page parameters for all book types
  const isAlKafiHadithPage = pathname.includes('/al-kafi/hadith/')
  const isUyunHadithPage = false // ʿUyūn now uses generic routes
  const isGenericHadithPage =
    pathname !== '/' &&
    pathname !== '/al-kafi' &&
    !pathname.startsWith('/al-kafi/') &&
    pathname.includes('/hadith/')
  const isHadithPage = isAlKafiHadithPage || isUyunHadithPage || isGenericHadithPage

  const volumeId = isChapterPage ? params.volumeId : null

  const displayBookTitle = currentBookId
    ? findTitleFromBooksList(currentBookId) ||
      getBookConfig(currentBookId)?.englishName ||
      humanizeBookId(currentBookId)
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
      className="border-theme sticky top-0 z-50 border-b shadow-soft backdrop-blur-sm"
      style={{ background: 'var(--topbar-bg)' }}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between sm:h-16">
          {/* Left side - Logo/Title and Breadcrumb */}
          <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-4">
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
                className="flex-shrink-0 rounded-lg p-2 transition-colors hover:bg-black/10 focus-visible:outline-2 dark:hover:bg-white/10"
              >
                <IconArrowLeft className="text-primary/80 hover:text-primary h-5 w-5" />
              </button>
            )}

            <Link
              href="/"
              onClick={handleTitleClick}
              className="group flex flex-shrink-0 items-center gap-2"
            >
              <h1 className="relative cursor-pointer select-none overflow-hidden font-arabic text-xl font-bold sm:text-2xl">
                <span className="library-title-gradient select-none">مكتبة السعادة</span>
              </h1>
            </Link>

            {/* Breadcrumb - Hidden on small screens, optimized for medium+ */}
            {pathname !== '/' && (
              <div className="hidden min-w-0 items-center gap-2 text-sm sm:flex">
                <svg
                  className="text-secondary h-4 w-4 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
                {pathname === '/al-kafi' && (
                  <span className="text-primary truncate font-medium">Al-Kāfi Explorer</span>
                )}
                {pathname === '/bookmarks' && (
                  <span className="text-primary truncate font-medium">Bookmarks</span>
                )}
                {pathname === '/Uyun-akhbar-al-Rida' && (
                  <span className="text-primary truncate font-medium">
                    ʿUyūn akhbār al-Riḍā Explorer
                  </span>
                )}
                {(pathname.startsWith('/book/') ||
                  (currentBookSlug &&
                    pathname !== '/' &&
                    pathname !== '/al-kafi' &&
                    !pathname.startsWith('/al-kafi/') &&
                    !pathname.includes('/Uyun-akhbar-al-Rida'))) &&
                  !isGenericChapterPage && (
                    <span className="text-primary truncate font-medium">
                      {currentBookId
                        ? findTitleFromBooksList(currentBookId) ||
                          getBookConfig(currentBookId)?.englishName ||
                          humanizeBookId(currentBookId)
                        : 'Book'}
                    </span>
                  )}
                {pathname.startsWith('/al-kafi/volume/') && !isAlKafiChapterPage && (
                  <span className="text-primary truncate font-medium">Al-Kāfi Volume</span>
                )}
                {pathname.startsWith('/Uyun-akhbar-al-Rida/volume/') && !isUyunChapterPage && (
                  <span className="text-primary truncate font-medium">
                    ʿUyūn akhbār al-Riḍā Volume
                  </span>
                )}
                {isAlKafiChapterPage && chapterInfo && (
                  <div className="flex min-w-0 items-center gap-2">
                    <IconBook className="h-4 w-4 flex-shrink-0 text-amber-400" />
                    <div className="min-w-0">
                      <div className="text-primary truncate font-medium">
                        <span className="hidden md:inline">
                          <span className="group transition-colors hover:text-amber-400">
                            <Link
                              href="/al-kafi"
                              className="transition-colors group-hover:text-amber-400"
                            >
                              Al-Kāfi
                            </Link>{' '}
                            <Link
                              href="/al-kafi"
                              className="transition-colors group-hover:text-amber-400"
                            >
                              Volume {chapterInfo.volumeId}
                            </Link>
                          </span>
                          {' • '}
                        </span>
                        <span className="truncate">{chapterInfo.chapter}</span>
                      </div>
                      <div className="text-secondary hidden truncate text-xs md:block">
                        {chapterInfo.category} • {chapterInfo.hadithCount} Hadiths
                      </div>
                    </div>
                  </div>
                )}
                {isGenericChapterPage && chapterInfo && (
                  <div className="flex min-w-0 items-center gap-2">
                    <IconBook className="h-4 w-4 flex-shrink-0 text-emerald-400" />
                    <div className="min-w-0">
                      <div className="text-primary truncate font-medium">
                        <span className="hidden md:inline">
                          <span className="group transition-colors hover:text-emerald-400">
                            {currentBookSlug ? (
                              <Link
                                href={`/${currentBookSlug}`}
                                className="transition-colors group-hover:text-emerald-400"
                              >
                                {displayBookTitle}
                              </Link>
                            ) : (
                              displayBookTitle
                            )}{' '}
                            {currentBookSlug ? (
                              <Link
                                href={`/${currentBookSlug}`}
                                className="transition-colors group-hover:text-emerald-400"
                              >
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
                      <div className="text-secondary hidden truncate text-xs md:block">
                        {chapterInfo.category} • {chapterInfo.hadithCount} Hadiths
                      </div>
                    </div>
                  </div>
                )}
                {isAlKafiHadithPage && chapterInfo && (
                  <div className="flex min-w-0 items-center gap-2">
                    <IconBook className="h-4 w-4 flex-shrink-0 text-amber-400" />
                    <div className="min-w-0">
                      <div className="text-primary truncate font-medium">
                        <span className="hidden md:inline">
                          <span className="group transition-colors hover:text-amber-400">
                            <Link
                              href="/al-kafi"
                              className="transition-colors group-hover:text-amber-400"
                            >
                              Al-Kāfi
                            </Link>{' '}
                            <Link
                              href="/al-kafi"
                              className="transition-colors group-hover:text-amber-400"
                            >
                              Volume {chapterInfo.volumeId}
                            </Link>
                          </span>
                          {' • '}
                        </span>
                        <span className="truncate">{chapterInfo.chapter}</span>
                      </div>
                      <div className="text-secondary hidden truncate text-xs md:block">
                        {chapterInfo.category} • Hadith
                      </div>
                    </div>
                  </div>
                )}
                {isGenericHadithPage && chapterInfo && (
                  <div className="flex min-w-0 items-center gap-2">
                    <IconBook className="h-4 w-4 flex-shrink-0 text-emerald-400" />
                    <div className="min-w-0">
                      <div className="text-primary truncate font-medium">
                        <span className="hidden md:inline">
                          <span className="group transition-colors hover:text-emerald-400">
                            {currentBookSlug ? (
                              <Link
                                href={`/${currentBookSlug}`}
                                className="transition-colors group-hover:text-emerald-400"
                              >
                                {displayBookTitle}
                              </Link>
                            ) : (
                              displayBookTitle
                            )}{' '}
                            {currentBookSlug ? (
                              <Link
                                href={`/${currentBookSlug}`}
                                className="transition-colors group-hover:text-emerald-400"
                              >
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
                      <div className="text-secondary hidden truncate text-xs md:block">
                        {chapterInfo.category} • Hadith
                      </div>
                    </div>
                  </div>
                )}
                {isAlKafiChapterPage && !chapterInfo && (
                  <div className="flex items-center gap-2">
                    <IconBook className="h-4 w-4 flex-shrink-0 text-amber-400" />
                    <span className="text-primary truncate font-medium">
                      <span className="group transition-colors hover:text-amber-400">
                        <Link
                          href="/al-kafi"
                          className="transition-colors group-hover:text-amber-400"
                        >
                          Al-Kāfi
                        </Link>{' '}
                        <Link
                          href="/al-kafi"
                          className="transition-colors group-hover:text-amber-400"
                        >
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
          <div className="flex flex-shrink-0 items-center gap-3">
            {/* Bookmarks Button */}
            <Link
              href="/bookmarks"
              className="relative rounded-lg p-2 transition-colors hover:bg-black/10 focus-visible:outline-2 focus-visible:outline-amber-500/50 dark:hover:bg-white/10"
              title={`Bookmarks (${bookmarkCount})`}
            >
              <IconBookmark className="h-5 w-5 text-yellow-600 hover:text-yellow-700 dark:text-yellow-500 dark:hover:text-yellow-400 sm:h-6 sm:w-6" />
              {bookmarkCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 min-w-[20px] items-center justify-center rounded-full bg-yellow-600 text-center text-xs font-bold text-white">
                  {bookmarkCount > 99 ? '99+' : bookmarkCount}
                </span>
              )}
            </Link>

            <button
              onClick={toggleSettings}
              className="rounded-lg p-2 transition-colors hover:bg-black/10 focus-visible:outline-2 focus-visible:outline-amber-500/50 dark:hover:bg-white/10"
              title="Settings"
            >
              <IconMenu className="text-primary/80 hover:text-primary h-5 w-5 sm:h-6 sm:w-6" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
