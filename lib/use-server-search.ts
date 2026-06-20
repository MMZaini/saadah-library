'use client'

import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { Hadith } from '@/lib/api'
import { debounce } from '@/lib/performance'
import { useSearch } from '@/lib/search-context'
import { useNavigation } from '@/lib/navigation-context'

interface UseServerSearchOptions {
  /** Placeholder shown in the TopBar field. */
  placeholder: string
  /** CSV of book IDs to scope the query to ('' = all books). */
  bookParam: string
  /** Re-runs the mount restore/reset when it changes (e.g. the book slug). */
  resetKey: unknown
}

interface UseServerSearchResult {
  query: string
  results: Hadith[]
  error: string | null
  isSearching: boolean
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
  const { query, setQuery, isSearching, setIsSearching, configurePlaceholder } = useSearch()
  const { getSearchState, saveSearchState } = useNavigation()

  const [results, setResults] = useState<Hadith[]>([])
  const [error, setError] = useState<string | null>(null)

  // Read inside the debounced fetch so a scope change doesn't recreate it.
  const bookParamRef = useRef(bookParam)
  bookParamRef.current = bookParam

  useEffect(() => {
    configurePlaceholder(placeholder)
  }, [placeholder, configurePlaceholder])

  // Restore this route's saved query on mount / route change. The reactive
  // effect below performs the actual fetch when the query becomes non-empty.
  useEffect(() => {
    const saved = getSearchState()
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
        setIsSearching(true)
        setError(null)
        try {
          const scope = bookParamRef.current ? `&book=${bookParamRef.current}` : ''
          const res = await fetch(
            `${process.env.NEXT_PUBLIC_BASE_PATH || ''}/api/search?q=${encodeURIComponent(q)}${scope}`,
          )
          const data = await res.json()
          if (!res.ok || data.error) throw new Error(data.error || 'Search failed')
          setResults(data.results)
          saveSearchState(
            {
              query: q,
              results: data.results,
              page: 1,
              filters: { grading: 'all', sort: 'relevance' },
            },
            path,
          )
        } catch {
          setResults([])
          setError('Search failed. Please try again.')
          saveSearchState(null, path)
        } finally {
          setIsSearching(false)
        }
      }, 300),
    [setIsSearching, saveSearchState],
  )

  // Cancel a pending debounced search when the page unmounts.
  useEffect(() => () => runSearch.cancel(), [runSearch])

  // Re-run whenever the query or the book scope changes.
  useEffect(() => {
    if (!query.trim()) {
      runSearch.cancel()
      setResults([])
      setError(null)
      setIsSearching(false)
      return
    }
    setIsSearching(true)
    runSearch(query)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, bookParam])

  const clear = useCallback(() => {
    runSearch.cancel()
    setQuery('')
    setResults([])
    setError(null)
    setIsSearching(false)
    saveSearchState(null)
  }, [runSearch, setQuery, setIsSearching, saveSearchState])

  return { query, results, error, isSearching, clear }
}
