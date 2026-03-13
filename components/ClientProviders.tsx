'use client'

import React, { useEffect } from 'react'
import { SettingsProvider } from '@/lib/settings-context'
import { ChapterProvider } from '@/lib/chapter-context'
import { NavigationProvider } from '@/lib/navigation-context'
import { BookmarksProvider } from '@/lib/bookmarks-context'
import { prefetchAllStructures } from '@/lib/book-structure'

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  // Prefetch all book structures in the background so navigating to any
  // book is instant.  Uses requestIdleCallback to avoid blocking initial
  // page render.
  useEffect(() => {
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
          <BookmarksProvider>{children}</BookmarksProvider>
        </NavigationProvider>
      </ChapterProvider>
    </SettingsProvider>
  )
}
