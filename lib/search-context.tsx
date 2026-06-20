'use client'

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
  ReactNode,
} from 'react'

interface SearchContextValue {
  /** Current text in the persistent TopBar search field. */
  query: string
  setQuery: (q: string) => void
  /** Whether the active page is currently fetching (drives the TopBar spinner). */
  isSearching: boolean
  setIsSearching: (v: boolean) => void
  /** Placeholder the active page wants shown in the field. */
  placeholder: string
  configurePlaceholder: (p: string) => void
}

const SearchContext = createContext<SearchContextValue | undefined>(undefined)

const DEFAULT_PLACEHOLDER = 'Search…'

/**
 * Holds the single, app-wide search field state so the input can live in the
 * persistent TopBar while each page decides what the query means (global
 * search, chapter filter, hadith highlight, bookmark filter).
 */
export function SearchProvider({ children }: { children: ReactNode }) {
  const [query, setQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [placeholder, setPlaceholder] = useState(DEFAULT_PLACEHOLDER)

  const configurePlaceholder = useCallback((p: string) => setPlaceholder(p), [])

  const value = useMemo<SearchContextValue>(
    () => ({ query, setQuery, isSearching, setIsSearching, placeholder, configurePlaceholder }),
    [query, isSearching, placeholder, configurePlaceholder],
  )

  return <SearchContext.Provider value={value}>{children}</SearchContext.Provider>
}

export function useSearch() {
  const ctx = useContext(SearchContext)
  if (ctx === undefined) {
    throw new Error('useSearch must be used within a SearchProvider')
  }
  return ctx
}

/**
 * Wire the TopBar search field to a page that consumes the query directly
 * (chapter filter, hadith highlight, bookmark filter). Sets the placeholder and
 * resets the query whenever `resetKey` changes (e.g. moving to a different
 * chapter or hadith) so state never bleeds between pages.
 */
export function usePageSearch({
  placeholder,
  resetKey,
}: {
  placeholder: string
  resetKey: unknown
}) {
  const { query, setQuery, configurePlaceholder } = useSearch()

  useEffect(() => {
    configurePlaceholder(placeholder)
  }, [placeholder, configurePlaceholder])

  useEffect(() => {
    setQuery('')
  }, [resetKey, setQuery])

  return { query, setQuery }
}
