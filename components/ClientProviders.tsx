"use client"

import React from 'react'
import { SettingsProvider } from '@/lib/settings-context'
import { ChapterProvider } from '@/lib/chapter-context'
import { NavigationProvider } from '@/lib/navigation-context'

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <SettingsProvider>
      <ChapterProvider>
        <NavigationProvider>
          {children}
        </NavigationProvider>
      </ChapterProvider>
    </SettingsProvider>
  )
}
