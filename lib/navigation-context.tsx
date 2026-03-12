'use client'

import { createContext, useContext, useState, useCallback, useMemo, useRef, ReactNode } from 'react'

interface NavigationState {
  scrollPosition: number
  lastPath: string
  searchState: {
    query: string
    results: unknown[]
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

  // Keep a ref so getSearchState / restoreScrollPosition always read the
  // latest value without adding navigationState to callback deps (which would
  // recreate the callbacks on every state change and break memoisation).
  const stateRef = useRef(navigationState)
  stateRef.current = navigationState

  const saveScrollPosition = useCallback((position: number) => {
    setNavigationState((prev) => ({ ...prev, scrollPosition: position }))
  }, [])

  const saveSearchState = useCallback((searchState: NavigationState['searchState']) => {
    setNavigationState((prev) => ({ ...prev, searchState }))
  }, [])

  const savePath = useCallback((path: string) => {
    setNavigationState((prev) => ({ ...prev, lastPath: path }))
  }, [])

  const restoreScrollPosition = useCallback(() => {
    return stateRef.current.scrollPosition
  }, [])

  const getSearchState = useCallback(() => {
    return stateRef.current.searchState
  }, [])

  const clearNavigationState = useCallback(() => {
    setNavigationState({
      scrollPosition: 0,
      lastPath: '/',
      searchState: null,
    })
  }, [])

  const value = useMemo<NavigationContextType>(
    () => ({
      navigationState,
      saveScrollPosition,
      saveSearchState,
      savePath,
      restoreScrollPosition,
      getSearchState,
      clearNavigationState,
    }),
    [
      navigationState,
      saveScrollPosition,
      saveSearchState,
      savePath,
      restoreScrollPosition,
      getSearchState,
      clearNavigationState,
    ],
  )

  return <NavigationContext.Provider value={value}>{children}</NavigationContext.Provider>
}

export function useNavigation() {
  const context = useContext(NavigationContext)
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider')
  }
  return context
}
