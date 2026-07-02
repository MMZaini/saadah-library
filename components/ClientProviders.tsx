'use client'

import React, { useEffect } from 'react'
import { SettingsProvider } from '@/lib/settings-context'
import { ChapterProvider } from '@/lib/chapter-context'
import { NavigationProvider } from '@/lib/navigation-context'
import { BookmarksProvider } from '@/lib/bookmarks-context'
import { NarratorBookmarksProvider } from '@/lib/narrator-bookmarks-context'
import { SearchProvider } from '@/lib/search-context'
import { prefetchAllStructures } from '@/lib/book-structure'

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  // Prefetch all book structures in the background so navigating to any
  // book is instant.  Uses requestIdleCallback to avoid blocking initial
  // page render.
  useEffect(() => {
    // The all-structures artifact is ~3 MB raw (~420 KB gzipped). Skip the
    // eager prefetch when it's least likely to pay off:
    //  - hadith deep links (share links) rarely lead to book browsing, and
    //    the chapter pager fetches its single structure on demand anyway
    //  - connections that ask us to save data
    const isHadithDeepLink = /\/hadith\//.test(window.location.pathname)
    const connection = (
      navigator as Navigator & {
        connection?: { saveData?: boolean; effectiveType?: string }
      }
    ).connection
    const isConstrainedConnection =
      Boolean(connection?.saveData) || /(^|-)2g$/.test(connection?.effectiveType ?? '')
    if (isHadithDeepLink || isConstrainedConnection) return

    const start = () => {
      void prefetchAllStructures()
    }

    if (typeof requestIdleCallback === 'function') {
      const id = requestIdleCallback(start, { timeout: 3000 })
      return () => cancelIdleCallback(id)
    } else {
      // Fallback for browsers without requestIdleCallback (Safari < 17)
      const timer = setTimeout(start, 1500)
      return () => clearTimeout(timer)
    }
  }, [])

  return (
    <SettingsProvider>
      <ChapterProvider>
        <NavigationProvider>
          <BookmarksProvider>
            <NarratorBookmarksProvider>
              <SearchProvider>{children}</SearchProvider>
            </NarratorBookmarksProvider>
          </BookmarksProvider>
        </NavigationProvider>
      </ChapterProvider>
    </SettingsProvider>
  )
}
