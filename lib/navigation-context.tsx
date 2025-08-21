'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

interface NavigationState {
  scrollPosition: number
  lastPath: string
  searchState: {
    query: string
    results: any[]
    page: number
    filters: {
      grading: string
      sort: string
    }
  } | null
  explorerState: {
    selectedVolume: string | number | 'all'
    expandedCategories: string[]
    selectedChapter?: {
      category: string
      chapter: string
      categoryId: string
      chapterId: number
    } | null
  } | null
}

interface NavigationContextType {
  navigationState: NavigationState
  saveScrollPosition: (position: number) => void
  saveSearchState: (searchState: NavigationState['searchState']) => void
  savePath: (path: string) => void
  restoreScrollPosition: () => number
  getSearchState: () => NavigationState['searchState']
  clearNavigationState: () => void
  saveExplorerState: (state: NavigationState['explorerState']) => void
  getExplorerState: () => NavigationState['explorerState']
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined)

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [navigationState, setNavigationState] = useState<NavigationState>({
    scrollPosition: 0,
    lastPath: '/',
    searchState: null,
    explorerState: null
  })

  const saveScrollPosition = (position: number) => {
    setNavigationState(prev => ({ ...prev, scrollPosition: position }))
  }

  const saveSearchState = (searchState: NavigationState['searchState']) => {
    setNavigationState(prev => ({ ...prev, searchState }))
  }

  const savePath = (path: string) => {
    setNavigationState(prev => ({ ...prev, lastPath: path }))
  }

  const restoreScrollPosition = () => {
    return navigationState.scrollPosition
  }

  const getSearchState = () => {
    return navigationState.searchState
  }

  const saveExplorerState = (state: NavigationState['explorerState']) => {
    setNavigationState(prev => ({ ...prev, explorerState: state }))
  }

  const getExplorerState = () => {
    return navigationState.explorerState
  }

  const clearNavigationState = () => {
    setNavigationState({
      scrollPosition: 0,
      lastPath: '/',
      searchState: null,
      explorerState: null
    })
  }

  return (
    <NavigationContext.Provider value={{
      navigationState,
      saveScrollPosition,
      saveSearchState,
      savePath,
      restoreScrollPosition,
      getSearchState,
      clearNavigationState,
      saveExplorerState,
      getExplorerState
    }}>
      {children}
    </NavigationContext.Provider>
  )
}

export function useNavigation() {
  const context = useContext(NavigationContext)
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider')
  }
  return context
}
