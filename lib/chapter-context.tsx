'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

interface ChapterInfo {
  volumeId: number
  category: string
  chapter: string
  hadithCount: number
  categoryId?: string
  chapterInCategoryId?: number
}

interface ChapterContextType {
  chapterInfo: ChapterInfo | null
  setChapterInfo: (info: ChapterInfo | null) => void
}

const ChapterContext = createContext<ChapterContextType | undefined>(undefined)

export function ChapterProvider({ children }: { children: ReactNode }) {
  const [chapterInfo, setChapterInfo] = useState<ChapterInfo | null>(null)

  return (
    <ChapterContext.Provider value={{ chapterInfo, setChapterInfo }}>
      {children}
    </ChapterContext.Provider>
  )
}

export function useChapter() {
  const context = useContext(ChapterContext)
  if (!context) {
    throw new Error('useChapter must be used within ChapterProvider')
  }
  return context
}
