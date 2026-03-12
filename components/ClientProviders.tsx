'use client'

import React from 'react'
import { SettingsProvider } from '@/lib/settings-context'
import { ChapterProvider } from '@/lib/chapter-context'
import { NavigationProvider } from '@/lib/navigation-context'
import { BookmarksProvider } from '@/lib/bookmarks-context'

export default function ClientProviders({ children }: { children: React.ReactNode }) {
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
