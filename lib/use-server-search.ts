'use client'

import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { Hadith } from '@/lib/api'
import { debounce } from '@/lib/performance'
import { useSearch } from '@/lib/search-context'
import { useNavigation } from '@/lib/navigation-context'
import { saveSearchToHistory } from '@/lib/use-search-shortcuts'
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
  /** Full server-side match count (may exceed results.length when capped). */
  totalMatches: number
  /** True when the server capped the result list. */
  truncated: boolean
  error: string | null
  isSearching: boolean
  filtersOpen: boolean
  setFiltersOpen: (open: boolean) => void
  setFilterCriteria: (criteria: ServerSearchFilterCriteria) => void
  clear: () => void
}

/** Reflect the active query in the URL (?q=) so searches are shareable and
 * survive a refresh. Uses history.replaceState (supported shallow routing in
 * the App Router) to avoid re-rendering the route. */
function syncQueryToUrl(query: string) {
  if (typeof window === 'undefined') return
  try {
    const url = new URL(window.location.href)
    const current = url.searchParams.get('q') ?? ''
    if (current === query || (!current && !query)) return
    if (query) url.searchParams.set('q', query)
    else url.searchParams.delete('q')
    window.history.replaceState(window.history.state, '', url)
  } catch {
    // URL sync is best-effort; never let it break the search itself.
  }
}

function readQueryFromUrl(): string {
  if (typeof window === 'undefined') return ''
  try {
    return new URLSearchParams(window.location.search).get('q') ?? ''
  } catch {
    return ''
  }
}

/**
 * Drives a server-backed hadith search from the persistent TopBar field for the
 * home, Al-Kāfi, and generic book pages. The query lives in the global search
 * context (so the input can sit in the TopBar); results, scoping and debounced
 * fetching live here. Per-route search state is restored via navigation-context,
 * with a ?q= URL param taking priority (shared/refreshed links).
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
  const [totalMatches, setTotalMatches] = useState(0)
  const [truncated, setTruncated] = useState(false)
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
  const abortRef = useRef<AbortController | null>(null)

  const abortInFlight = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
  }, [])

  useEffect(() => {
    configurePlaceholder(placeholder)
    configureFilters(true)
    return () => configureFilters(false)
  }, [placeholder, configurePlaceholder, configureFilters])

  // Restore this route's saved query on mount / route change. A ?q= URL param
  // wins over in-memory state (shared or refreshed links). The reactive effect
  // below performs the actual fetch when the query becomes non-empty.
  useEffect(() => {
    const saved = getSearchState()
    setFiltersOpen(false)
    setFilterCriteria({ gradings: [], hasBookScope: false, searchModes: [] })
    setQuery(readQueryFromUrl() || saved?.query || '')
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

        // A superseded 10+ MB response would keep downloading in the
        // background without this; the seq guard alone only ignores it.
        abortRef.current?.abort()
        const controller = new AbortController()
        abortRef.current = controller

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
            { signal: controller.signal },
          )
          const data = await res.json()
          if (!res.ok || data.error) throw new Error(data.error || 'Search failed')
          if (requestSeq !== requestSeqRef.current) return
          setResults(data.results)
          setTotalMatches(typeof data.total === 'number' ? data.total : data.results.length)
          setTruncated(Boolean(data.truncated))
          if (trimmed) {
            saveSearchToHistory(trimmed)
            syncQueryToUrl(trimmed)
          }
          saveSearchState({ query: trimmed }, path)
        } catch (err) {
          if (requestSeq !== requestSeqRef.current) return
          if (err instanceof DOMException && err.name === 'AbortError') return
          console.warn('[search] request failed:', err)
          setResults([])
          setTotalMatches(0)
          setTruncated(false)
          setError('Search failed. Please try again.')
          saveSearchState(null, path)
        } finally {
          if (requestSeq === requestSeqRef.current) setIsSearching(false)
        }
      }, 300),
    [setIsSearching, saveSearchState],
  )

  // Cancel a pending debounced search (and any in-flight request) on unmount.
  useEffect(
    () => () => {
      runSearch.cancel()
      abortInFlight()
    },
    [runSearch, abortInFlight],
  )

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
      abortInFlight()
      requestSeqRef.current += 1
      setResults([])
      setTotalMatches(0)
      setTruncated(false)
      setError(null)
      setIsSearching(false)
      syncQueryToUrl('')
      saveSearchState(null)
      return
    }
    setIsSearching(true)
    runSearch(trimmedQuery)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, bookParam, filterOnlyKey, searchModeKey])

  const clear = useCallback(() => {
    runSearch.cancel()
    abortInFlight()
    requestSeqRef.current += 1
    setFiltersOpen(false)
    setFilterCriteria({ gradings: [], hasBookScope: false, searchModes: [] })
    setQuery('')
    setResults([])
    setTotalMatches(0)
    setTruncated(false)
    setError(null)
    setIsSearching(false)
    syncQueryToUrl('')
    saveSearchState(null)
  }, [runSearch, abortInFlight, setFiltersOpen, setQuery, setIsSearching, saveSearchState])

  return {
    query,
    results,
    totalMatches,
    truncated,
    error,
    isSearching,
    filtersOpen,
    setFiltersOpen,
    setFilterCriteria,
    clear,
  }
}
