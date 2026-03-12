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
}

interface NavigationContextType {
  navigationState: NavigationState
  saveScrollPosition: (position: number) => void
  saveSearchState: (searchState: NavigationState['searchState']) => void
  savePath: (path: string) => void
  restoreScrollPosition: () => number
  getSearchState: () => NavigationState['searchState']
  clearNavigationState: () => void
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined)

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [navigationState, setNavigationState] = useState<NavigationState>({
    scrollPosition: 0,
    lastPath: '/',
    searchState: null,
  })

  const saveScrollPosition = (position: number) => {
    setNavigationState((prev) => ({ ...prev, scrollPosition: position }))
  }

  const saveSearchState = (searchState: NavigationState['searchState']) => {
    setNavigationState((prev) => ({ ...prev, searchState }))
  }

  const savePath = (path: string) => {
    setNavigationState((prev) => ({ ...prev, lastPath: path }))
  }

  const restoreScrollPosition = () => {
    return navigationState.scrollPosition
  }

  const getSearchState = () => {
    return navigationState.searchState
  }

  const clearNavigationState = () => {
    setNavigationState({
      scrollPosition: 0,
      lastPath: '/',
      searchState: null,
    })
  }

  return (
    <NavigationContext.Provider
      value={{
        navigationState,
        saveScrollPosition,
        saveSearchState,
        savePath,
        restoreScrollPosition,
        getSearchState,
        clearNavigationState,
      }}
    >
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
