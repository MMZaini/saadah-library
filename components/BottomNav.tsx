'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Bookmark, UserSearch, Settings } from 'lucide-react'
import { LuNotebookPen } from 'react-icons/lu'
import { stripBasePath, withBasePath } from '@/lib/assets'
import { useSettings } from '@/lib/settings-context'
import { useBookmarks } from '@/lib/bookmarks-context'
import { useNarratorBookmarks } from '@/lib/narrator-bookmarks-context'
import { cn } from '@/lib/utils'

/**
 * Mobile-only bottom tab bar (md:hidden). Holds the primary destinations that
 * the TopBar shows as an icon cluster on desktop, so the mobile TopBar can keep
 * just the brand + search.
 *
 * Routing is basePath-sensitive and mirrors TopBar exactly: Home/Bookmarks go
 * through Next <Link> (which applies the /read basePath), while Scans/Narrators
 * are root-level tools reached with raw <a> anchors. Active state is derived
 * from the basePath-stripped pathname.
 */
export default function BottomNav() {
  const pathname = stripBasePath(usePathname() || '/')
  const { toggleSettings, isSettingsOpen } = useSettings()
  const { bookmarkCount } = useBookmarks()
  const { narratorBookmarkCount } = useNarratorBookmarks()
  const totalBookmarkCount = bookmarkCount + narratorBookmarkCount

  // The full-screen tools (scan studio / narrator PDF viewer) size themselves to
  // sit above this bar — see their `100dvh - 7.5rem` height — so on those routes
  // we keep the bar for navigation but skip the in-flow spacer (the tool already
  // reserves the room). The 4rem here must stay in sync with the nav's h-16.
  const isScansPage = pathname === '/scans' || pathname.startsWith('/scans/')
  const isNarratorPdfPage = pathname.startsWith('/narrators/') && pathname.endsWith('/pdf')
  const selfManagedBottomSpace = isScansPage || isNarratorPdfPage

  const isHome = pathname === '/'
  const isBookmarks = pathname === '/bookmarks'
  const isNarrators = pathname === '/narrators' || pathname.startsWith('/narrators/')

  const tabClass = (active: boolean) =>
    cn(
      'relative flex h-full min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-1 text-[10px] font-medium transition-colors',
      active ? 'text-accent' : 'text-foreground-muted hover:text-foreground',
    )

  return (
    <>
      {/* In-flow spacer so page content can scroll clear of the fixed bar
          (includes the safe-area inset the nav itself adds on notched phones).
          Skipped on the full-screen tools, which reserve the room themselves. */}
      {!selfManagedBottomSpace && (
        <div
          aria-hidden
          className="h-[calc(4rem+env(safe-area-inset-bottom))] shrink-0 md:hidden"
        />
      )}

      <nav
        aria-label="Primary"
        className="bg-background/95 supports-[backdrop-filter]:bg-background/80 fixed inset-x-0 bottom-0 z-50 border-t border-border pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
      >
        <div className="flex h-16 items-stretch">
          <Link
            href={withBasePath('/')}
            className={tabClass(isHome)}
            aria-current={isHome ? 'page' : undefined}
          >
            <Home className="h-5 w-5 shrink-0" />
            <span>Home</span>
          </Link>

          <Link
            href="/bookmarks"
            className={tabClass(isBookmarks)}
            aria-current={isBookmarks ? 'page' : undefined}
          >
            <span className="relative">
              <Bookmark className="h-5 w-5 shrink-0" />
              {totalBookmarkCount > 0 && (
                <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-bookmark px-1 text-[9px] font-bold text-background">
                  {totalBookmarkCount > 99 ? '99+' : totalBookmarkCount}
                </span>
              )}
            </span>
            <span>Bookmarks</span>
          </Link>

          {/* Raw anchors target root-level tools instead of basePath-prefixed routes. */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a
            href="/narrators"
            className={tabClass(isNarrators)}
            aria-current={isNarrators ? 'page' : undefined}
          >
            <UserSearch className="h-5 w-5 shrink-0" />
            <span>Narrators</span>
          </a>

          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/scans" className={tabClass(false)}>
            <LuNotebookPen className="h-5 w-5 shrink-0" />
            <span>Scans</span>
          </a>

          <button type="button" onClick={toggleSettings} className={tabClass(isSettingsOpen)}>
            <Settings className="h-5 w-5 shrink-0" />
            <span>Settings</span>
          </button>
        </div>
      </nav>
    </>
  )
}
