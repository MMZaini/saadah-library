"use client"

import React from 'react'
import { SettingsProvider } from '@/lib/settings-context'
import { ChapterProvider } from '@/lib/chapter-context'
import { NavigationProvider } from '@/lib/navigation-context'
import VSCodeClassCleaner from './VSCodeClassCleaner'

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <SettingsProvider>
      <ChapterProvider>
        <NavigationProvider>
          <VSCodeClassCleaner />
          {children}
        </NavigationProvider>
      </ChapterProvider>
    </SettingsProvider>
  )
}
