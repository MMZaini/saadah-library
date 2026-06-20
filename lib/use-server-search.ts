'use client'

import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { Hadith } from '@/lib/api'
import { debounce } from '@/lib/performance'
import { useSearch } from '@/lib/search-context'
import { useNavigation } from '@/lib/navigation-context'
import type { SearchMode } from '@/lib/search-utils'

interface UseServerSearchOptions {
  /** Placeholder shown in the TopBar field. */
  placeholder: string
  /** CSV of book IDs to scope the query to ('' = all books). */
  bookParam: string
  /** Re-runs the mount restore/reset when it changes (e.g. the book slug). */
  resetKey: unknown
}

export interface ServerSearchFilterCriteria {
  /** Grading values selected in SearchInterface, excluding "all". */
  gradings: string[]
  /** True when the global "Search In" selector has been narrowed by the user. */
  hasBookScope: boolean
  /** Selected non-default search modes. Empty means exact phrase. */
  searchModes: SearchMode[]
}

interface UseServerSearchResult {
  query: string
  results: Hadith[]
  error: string | null
  isSearching: boolean
  filtersOpen: boolean
  setFiltersOpen: (open: boolean) => void
  setFilterCriteria: (criteria: ServerSearchFilterCriteria) => void
  clear: () => void
}

/**
 * Drives a server-backed hadith search from the persistent TopBar field for the
 * home, Al-Kāfi, and generic book pages. The query lives in the global search
 * context (so the input can sit in the TopBar); results, scoping and debounced
 * fetching live here. Per-route search state is restored via navigation-context.
 */
export function useServerSearch({
  placeholder,
  bookParam,
  resetKey,
}: UseServerSearchOptions): UseServerSearchResult {
  const {
    query,
    setQuery,
    isSearching,
    setIsSearching,
    configurePlaceholder,
    configureFilters,
    filtersOpen,
    setFiltersOpen,
  } = useSearch()
  const { getSearchState, saveSearchState } = useNavigation()

  const [results, setResults] = useState<Hadith[]>([])
  const [error, setError] = useState<string | null>(null)
  const [filterCriteria, setFilterCriteria] = useState<ServerSearchFilterCriteria>({
    gradings: [],
    hasBookScope: false,
    searchModes: [],
  })

  // Read inside the debounced fetch so a scope change doesn't recreate it.
  const bookParamRef = useRef(bookParam)
  bookParamRef.current = bookParam
  const filterCriteriaRef = useRef(filterCriteria)
  filterCriteriaRef.current = filterCriteria
  const filtersOpenRef = useRef(filtersOpen)
  filtersOpenRef.current = filtersOpen
  const requestSeqRef = useRef(0)

  useEffect(() => {
    configurePlaceholder(placeholder)
    configureFilters(true)
    return () => configureFilters(false)
  }, [placeholder, configurePlaceholder, configureFilters])

  // Restore this route's saved query on mount / route change. The reactive
  // effect below performs the actual fetch when the query becomes non-empty.
  useEffect(() => {
    const saved = getSearchState()
    setFiltersOpen(false)
    setFilterCriteria({ gradings: [], hasBookScope: false, searchModes: [] })
    setQuery(saved?.query ?? '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey])

  const runSearch = useMemo(
    () =>
      debounce(async (q: string) => {
        // Capture the route the search was started from so a result that
        // resolves after the user has navigated away is saved under the right
        // path (and never leaks into the page they moved to).
        const path = typeof window !== 'undefined' ? window.location.pathname : undefined
        const requestSeq = ++requestSeqRef.current
        const trimmed = q.trim()
        const criteria = filterCriteriaRef.current
        setIsSearching(true)
        setError(null)
        try {
          const params = new URLSearchParams()
          if (trimmed) params.set('q', trimmed)
          if (bookParamRef.current) params.set('book', bookParamRef.current)
          if (trimmed && criteria.searchModes.length > 0) {
            params.set('mode', criteria.searchModes.join(','))
          }
          if (!trimmed && filtersOpenRef.current) {
            params.set('filterOnly', '1')
            if (criteria.gradings.length > 0) params.set('grading', criteria.gradings.join(','))
          }

          const res = await fetch(
            `${process.env.NEXT_PUBLIC_BASE_PATH || ''}/api/search?${params.toString()}`,
          )
          const data = await res.json()
          if (!res.ok || data.error) throw new Error(data.error || 'Search failed')
          if (requestSeq !== requestSeqRef.current) return
          setResults(data.results)
          saveSearchState(
            {
              query: trimmed,
              results: data.results,
              page: 1,
              filters: { grading: 'all', sort: 'relevance' },
            },
            path,
          )
        } catch {
          if (requestSeq !== requestSeqRef.current) return
          setResults([])
          setError('Search failed. Please try again.')
          saveSearchState(null, path)
        } finally {
          if (requestSeq === requestSeqRef.current) setIsSearching(false)
        }
      }, 300),
    [setIsSearching, saveSearchState],
  )

  // Cancel a pending debounced search when the page unmounts.
  useEffect(() => () => runSearch.cancel(), [runSearch])

  // Re-run whenever the query or the book scope changes.
  const trimmedQuery = query.trim()
  const activeGradings = filterCriteria.gradings.filter(Boolean)
  const activeSearchModes = filterCriteria.searchModes.filter(Boolean)
  const filterOnlyKey =
    trimmedQuery.length === 0
      ? `${filtersOpen}:${filterCriteria.hasBookScope}:${activeGradings.join(',')}`
      : ''
  const searchModeKey = trimmedQuery.length > 0 ? activeSearchModes.join(',') : ''

  useEffect(() => {
    const hasFilterOnlyCriteria = filterCriteria.hasBookScope || activeGradings.length > 0

    if (!trimmedQuery && (!filtersOpen || !hasFilterOnlyCriteria)) {
      runSearch.cancel()
      requestSeqRef.current += 1
      setResults([])
      setError(null)
      setIsSearching(false)
      saveSearchState(null)
      return
    }
    setIsSearching(true)
    runSearch(trimmedQuery)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, bookParam, filterOnlyKey, searchModeKey])

  const clear = useCallback(() => {
    runSearch.cancel()
    requestSeqRef.current += 1
    setFiltersOpen(false)
    setFilterCriteria({ gradings: [], hasBookScope: false, searchModes: [] })
    setQuery('')
    setResults([])
    setError(null)
    setIsSearching(false)
    saveSearchState(null)
  }, [runSearch, setFiltersOpen, setQuery, setIsSearching, saveSearchState])

  return {
    query,
    results,
    error,
    isSearching,
    filtersOpen,
    setFiltersOpen,
    setFilterCriteria,
    clear,
  }
}
