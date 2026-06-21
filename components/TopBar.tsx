'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useParams, useRouter } from 'next/navigation'
import { LuNotebookPen } from 'react-icons/lu'
import { Settings, ChevronRight, ArrowLeft, Bookmark, UserSearch } from 'lucide-react'
import { getBookConfig, getBookIdFromUrlSlug } from '@/lib/books-config'
import { books } from '@/lib/books'
import { useSettings } from '@/lib/settings-context'
import { useChapter } from '@/lib/chapter-context'
import { useBookmarks } from '@/lib/bookmarks-context'
import { useSearch } from '@/lib/search-context'
import { Button } from '@/components/ui/button'
import SearchBar from '@/components/SearchBar'
import TruncatedTooltip from '@/components/TruncatedTooltip'

export default function TopBar() {
  const { toggleSettings } = useSettings()
  const { chapterInfo } = useChapter()
  const { bookmarkCount } = useBookmarks()
  const { query, setQuery, isSearching, placeholder, filtersEnabled, filtersOpen, setFiltersOpen } =
    useSearch()
  const pathname = usePathname()
  const params = useParams()
  const router = useRouter()
  const isScansPage =
    pathname === '/scans' ||
    pathname.startsWith('/scans/') ||
    pathname === '/read/scans' ||
    pathname.startsWith('/read/scans/')
  const [scanSourceTitle, setScanSourceTitle] = useState<string | null>(null)

  useEffect(() => {
    if (!isScansPage) {
      setScanSourceTitle(null)
      return
    }

    const handleScanSourceChange = (event: Event) => {
      const detail = (event as CustomEvent<{ title?: string | null }>).detail
      setScanSourceTitle(detail?.title ?? null)
    }

    window.addEventListener('scanSourceChange', handleScanSourceChange)
    return () => window.removeEventListener('scanSourceChange', handleScanSourceChange)
  }, [isScansPage])

  const currentBookSlug =
    pathname !== '/' &&
    pathname !== '/al-kafi' &&
    !pathname.startsWith('/al-kafi/') &&
    !pathname.includes('/Uyun-akhbar-al-Rida')
      ? (params.bookSlug as string | null)
      : null
  const currentBookId = currentBookSlug ? getBookIdFromUrlSlug(currentBookSlug) : null

  const humanizeBookId = (id?: string | null) => {
    if (!id) return ''
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
      .replace(/\p{M}/gu, '')
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

  const isAlKafiChapterPage =
    pathname.includes('/al-kafi/volume/') && pathname.includes('/chapter/')
  const isGenericChapterPage =
    pathname !== '/' &&
    pathname !== '/al-kafi' &&
    !pathname.startsWith('/al-kafi/') &&
    pathname.includes('/chapter/')
  const isChapterPage = isAlKafiChapterPage || isGenericChapterPage

  // Matches both the legacy /al-kafi/hadith/<id> and the canonical
  // /al-kafi/volume/<vol>/hadith/<id> forms (chapter pages have /chapter/, not
  // /hadith/, so the two never overlap).
  const isAlKafiHadithPage =
    pathname.includes('/al-kafi/hadith/') ||
    (pathname.startsWith('/al-kafi/volume/') && pathname.includes('/hadith/'))
  const isGenericHadithPage =
    pathname !== '/' &&
    pathname !== '/al-kafi' &&
    !pathname.startsWith('/al-kafi/') &&
    pathname.includes('/hadith/')
  const isHadithPage = isAlKafiHadithPage || isGenericHadithPage

  const displayBookTitle = currentBookId
    ? findTitleFromBooksList(currentBookId) ||
      getBookConfig(currentBookId)?.englishName ||
      humanizeBookId(currentBookId)
    : ''

  const handleTitleClick = (e: React.MouseEvent) => {
    if (pathname === '/') {
      e.preventDefault()
      // Home listens for this and clears its query + saved search state.
      window.dispatchEvent(new CustomEvent('clearSearch'))
    }
  }

  // Build breadcrumb segments
  const getBreadcrumb = () => {
    if (pathname === '/') return null

    if (isScansPage) {
      return (
        <div className="flex min-w-0 items-center gap-1 text-sm text-foreground-muted">
          <span>Scan Creator</span>
          {scanSourceTitle && (
            <>
              <ChevronRight className="h-3 w-3 shrink-0" />
              <TruncatedTooltip text={scanSourceTitle} className="max-w-[260px] text-foreground" />
            </>
          )}
        </div>
      )
    }

    if (pathname === '/bookmarks')
      return <span className="text-sm text-foreground-muted">Bookmarks</span>

    if (pathname === '/narrators')
      return <span className="text-sm text-foreground-muted">Narrators</span>

    if (pathname.startsWith('/narrators/'))
      return (
        <div className="flex items-center gap-1 text-sm text-foreground-muted">
          <Link href="/narrators" className="transition-colors hover:text-foreground">
            Narrators
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground">Entry</span>
        </div>
      )

    if (pathname === '/al-kafi' && !isAlKafiChapterPage && !isAlKafiHadithPage) {
      return <span className="text-sm text-foreground-muted">Al-Kāfi</span>
    }

    if (isChapterPage && chapterInfo) {
      const bookName = isAlKafiChapterPage ? 'Al-Kāfi' : displayBookTitle
      const backHref = isAlKafiChapterPage
        ? '/al-kafi'
        : currentBookSlug
          ? `/${currentBookSlug}`
          : '/'
      return (
        <div className="flex items-center gap-1 text-sm text-foreground-muted">
          <Link href={backHref} className="transition-colors hover:text-foreground">
            {bookName}
          </Link>
          {chapterInfo.volumeId && (
            <>
              <ChevronRight className="h-3 w-3" />
              <span>Vol. {chapterInfo.volumeId}</span>
            </>
          )}
          <ChevronRight className="h-3 w-3" />
          <TruncatedTooltip text={chapterInfo.chapter} className="max-w-[200px] text-foreground" />
        </div>
      )
    }

    if (isHadithPage && chapterInfo) {
      const bookName = isAlKafiHadithPage ? 'Al-Kāfi' : displayBookTitle
      const backHref = isAlKafiHadithPage
        ? '/al-kafi'
        : currentBookSlug
          ? `/${currentBookSlug}`
          : '/'
      return (
        <div className="flex items-center gap-1 text-sm text-foreground-muted">
          <Link href={backHref} className="transition-colors hover:text-foreground">
            {bookName}
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground">Hadith</span>
        </div>
      )
    }

    // Generic book page
    if (currentBookId) {
      const title =
        findTitleFromBooksList(currentBookId) ||
        getBookConfig(currentBookId)?.englishName ||
        humanizeBookId(currentBookId)
      return (
        <TruncatedTooltip text={title} className="max-w-[260px] text-sm text-foreground-muted" />
      )
    }

    return null
  }

  return (
    <header className="bg-background/95 supports-[backdrop-filter]:bg-background/80 sticky top-0 z-50 border-b border-border backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 sm:px-6">
        {/* Back button for chapter/hadith pages */}
        {(isChapterPage || isHadithPage) && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => {
              if (isAlKafiChapterPage || isAlKafiHadithPage) {
                router.push('/al-kafi')
              } else if (currentBookSlug) {
                router.push(`/${currentBookSlug}`)
              } else {
                router.push('/')
              }
            }}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}

        {/* Title */}
        <Link
          href="/"
          onClick={handleTitleClick}
          className="shrink-0 font-arabic text-lg font-bold tracking-tight sm:text-xl"
        >
          مكتبة السعادة
        </Link>

        {/* Breadcrumb */}
        {pathname !== '/' && (
          <div className="hidden min-w-0 items-center gap-1.5 sm:flex">
            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-foreground-faint" />
            {getBreadcrumb()}
          </div>
        )}

        {/* Persistent search field — behavior is set by the active page */}
        <div className="flex min-w-0 flex-1 justify-end">
          {!isScansPage && (
            <SearchBar
              variant="topbar"
              value={query}
              onChange={setQuery}
              placeholder={placeholder}
              isSearching={isSearching}
              showFilterButton={filtersEnabled}
              filtersOpen={filtersOpen}
              onFilterClick={() => setFiltersOpen(!filtersOpen)}
              className="w-full max-w-xs sm:max-w-sm md:max-w-md"
            />
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          {/* Raw anchor (not next/link) so it targets the bare /scans rather than
              the basePath-prefixed /read/scans; middleware serves it there. The
              no-html-link rule is intentionally bypassed for this basePath escape. */}
          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a href="/scans" title="PDF highlighter & export">
              <LuNotebookPen className="h-4 w-4" />
            </a>
          </Button>

          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
            <Link href="/narrators" title="Narrators">
              <UserSearch className="h-4 w-4" />
            </Link>
          </Button>

          <Button variant="ghost" size="icon" className="relative h-8 w-8" asChild>
            <Link href="/bookmarks" title={`Bookmarks (${bookmarkCount})`}>
              <Bookmark className="h-4 w-4" />
              {bookmarkCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-bookmark text-[10px] font-bold text-background">
                  {bookmarkCount > 99 ? '99+' : bookmarkCount}
                </span>
              )}
            </Link>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={toggleSettings}
            title="Settings"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  )
}
