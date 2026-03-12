'use client'

import Link from 'next/link'
import { usePathname, useParams, useRouter } from 'next/navigation'
import { Settings, ChevronRight, ArrowLeft, Bookmark } from 'lucide-react'
import { getBookConfig, getBookIdFromUrlSlug } from '@/lib/books-config'
import { books } from '@/lib/books'
import { useSettings } from '@/lib/settings-context'
import { useChapter } from '@/lib/chapter-context'
import { useNavigation } from '@/lib/navigation-context'
import { useBookmarks } from '@/lib/bookmarks-context'
import { Button } from '@/components/ui/button'

export default function TopBar() {
  const { toggleSettings } = useSettings()
  const { chapterInfo } = useChapter()
  const { bookmarkCount } = useBookmarks()
  const navigation = useNavigation()
  const pathname = usePathname()
  const params = useParams()
  const router = useRouter()

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
    (pathname.startsWith('/book/') ||
      (pathname !== '/' && pathname !== '/al-kafi' && !pathname.startsWith('/al-kafi/'))) &&
    pathname.includes('/chapter/')
  const isChapterPage = isAlKafiChapterPage || isGenericChapterPage

  const isAlKafiHadithPage = pathname.includes('/al-kafi/hadith/')
  const isGenericHadithPage =
    pathname !== '/' &&
    pathname !== '/al-kafi' &&
    !pathname.startsWith('/al-kafi/') &&
    pathname.includes('/hadith/')
  const isHadithPage = isAlKafiHadithPage || isGenericHadithPage

  const volumeId = isChapterPage ? params.volumeId : null

  const displayBookTitle = currentBookId
    ? findTitleFromBooksList(currentBookId) ||
      getBookConfig(currentBookId)?.englishName ||
      humanizeBookId(currentBookId)
    : ''

  const handleTitleClick = (e: React.MouseEvent) => {
    if (pathname === '/') {
      e.preventDefault()
      navigation.saveSearchState(null)
      window.dispatchEvent(new CustomEvent('clearSearch'))
    }
  }

  // Build breadcrumb segments
  const getBreadcrumb = () => {
    if (pathname === '/') return null

    if (pathname === '/bookmarks')
      return <span className="text-sm text-foreground-muted">Bookmarks</span>

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
          <span className="max-w-[200px] truncate text-foreground">{chapterInfo.chapter}</span>
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
      return <span className="truncate text-sm text-foreground-muted">{title}</span>
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

        <div className="flex-1" />

        {/* Actions */}
        <div className="flex items-center gap-1">
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
