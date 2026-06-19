'use client'

import { createContext, useContext, useState, useCallback, useMemo, useRef, ReactNode } from 'react'

interface SearchState {
  query: string
  results: unknown[]
  page: number
  filters: {
    grading: string
    sort: string
  }
}

interface PerPathState {
  scrollPosition: number
  searchState: SearchState | null
}

interface NavigationContextType {
  saveScrollPosition: (position: number, path?: string) => void
  saveSearchState: (searchState: SearchState | null, path?: string) => void
  restoreScrollPosition: (path?: string) => number
  getSearchState: (path?: string) => SearchState | null
  clearNavigationState: () => void
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined)

// Scroll position and search results are scoped per route path so state from
// one page (e.g. a search on the home page) never leaks into an unrelated page
// (e.g. a book page). The path defaults to the current pathname, which is
// correct for the common case: saves happen while on the page (or via a
// mount-captured path passed explicitly), and restores happen on the entering
// page's mount, where the pathname is already the page's own.
function currentPath(): string {
  return typeof window !== 'undefined' ? window.location.pathname : '/'
}

const EMPTY: PerPathState = { scrollPosition: 0, searchState: null }

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [stateByPath, setStateByPath] = useState<Record<string, PerPathState>>({})

  // Keep a ref so getSearchState / restoreScrollPosition always read the latest
  // value without adding stateByPath to callback deps (which would recreate the
  // callbacks on every change and break memoisation in consumers).
  const stateRef = useRef(stateByPath)
  stateRef.current = stateByPath

  const saveScrollPosition = useCallback((position: number, path: string = currentPath()) => {
    setStateByPath((prev) => ({
      ...prev,
      [path]: { ...(prev[path] ?? EMPTY), scrollPosition: position },
    }))
  }, [])

  const saveSearchState = useCallback(
    (searchState: SearchState | null, path: string = currentPath()) => {
      setStateByPath((prev) => ({
        ...prev,
        [path]: { ...(prev[path] ?? EMPTY), searchState },
      }))
    },
    [],
  )

  const restoreScrollPosition = useCallback((path: string = currentPath()) => {
    return stateRef.current[path]?.scrollPosition ?? 0
  }, [])

  const getSearchState = useCallback((path: string = currentPath()) => {
    return stateRef.current[path]?.searchState ?? null
  }, [])

  const clearNavigationState = useCallback(() => {
    setStateByPath({})
  }, [])

  const value = useMemo<NavigationContextType>(
    () => ({
      saveScrollPosition,
      saveSearchState,
      restoreScrollPosition,
      getSearchState,
      clearNavigationState,
    }),
    [
      saveScrollPosition,
      saveSearchState,
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
