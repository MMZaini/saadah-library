'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { debounce } from '@/lib/performance'
import { useSearch } from '@/lib/search-context'
import type {
  NarratorEntry,
  NarratorSearchResponse,
  NarratorSearchResult,
} from '@/lib/data/rijal-types'

interface UseNarratorSearchResult {
  query: string
  results: NarratorSearchResult[]
  selected: NarratorEntry | null
  selectedId: string | null
  total: number
  metadata: NarratorSearchResponse['metadata'] | null
  error: string | null
  isSearching: boolean
  isLoadingDetail: boolean
  selectNarrator: (id: string) => void
  clear: () => void
}

// Session caches shared across remounts of the page. The endpoints already send
// long Cache-Control headers; these add a synchronous, flicker-free hit (no
// network, no re-parse) for narrators and queries already seen this session.
const DETAIL_CACHE_LIMIT = 60
const SEARCH_CACHE_LIMIT = 80
// Increment whenever matching or ordering semantics change. Including the
// version in both cache keys prevents a Fast Refresh from reusing results
// produced by older client code, while including it in the request URL busts
// browser/CDN responses produced by an older server ranking implementation.
const NARRATOR_SEARCH_RANKING_VERSION = '5'
const detailCache = new Map<string, NarratorEntry>()
const searchCache = new Map<
  string,
  Pick<NarratorSearchResponse, 'results' | 'total' | 'metadata'>
>()

function remember<K, V>(cache: Map<K, V>, key: K, value: V, limit: number): void {
  cache.set(key, value)
  if (cache.size > limit) {
    const oldest = cache.keys().next().value
    if (oldest !== undefined) cache.delete(oldest)
  }
}

export function useNarratorSearch(): UseNarratorSearchResult {
  const { query, setQuery, isSearching, setIsSearching, configurePlaceholder, configureFilters } =
    useSearch()
  const [results, setResults] = useState<NarratorSearchResult[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selected, setSelected] = useState<NarratorEntry | null>(null)
  const [total, setTotal] = useState(0)
  const [metadata, setMetadata] = useState<NarratorSearchResponse['metadata'] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoadingDetail, setIsLoadingDetail] = useState(false)
  const requestSeqRef = useRef(0)
  const detailSeqRef = useRef(0)

  useEffect(() => {
    configurePlaceholder('Search narrators in Arabic or English…')
    configureFilters(false)
    return () => configureFilters(false)
  }, [configurePlaceholder, configureFilters])

  useEffect(() => {
    let cancelled = false
    async function loadMetadata() {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/api/narrators/search`)
        const data = (await res.json()) as NarratorSearchResponse
        if (!cancelled && data.metadata) setMetadata(data.metadata)
      } catch {
        // Search still works without the metadata count in the empty state.
      }
    }
    void loadMetadata()
    return () => {
      cancelled = true
    }
  }, [])

  const fetchDetail = useCallback(async (id: string) => {
    const requestSeq = ++detailSeqRef.current
    setSelectedId(id)
    setError(null)

    const cached = detailCache.get(id)
    if (cached) {
      setSelected(cached)
      setIsLoadingDetail(false)
      return
    }

    setIsLoadingDetail(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/api/narrators/${id}`)
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error || 'Narrator lookup failed')
      if (requestSeq !== detailSeqRef.current) return
      remember(detailCache, id, data as NarratorEntry, DETAIL_CACHE_LIMIT)
      setSelected(data)
    } catch {
      if (requestSeq !== detailSeqRef.current) return
      setSelected(null)
      setError('Could not load this narrator entry.')
    } finally {
      if (requestSeq === detailSeqRef.current) setIsLoadingDetail(false)
    }
  }, [])

  const runSearch = useMemo(
    () =>
      debounce(async (q: string) => {
        const requestSeq = ++requestSeqRef.current
        const trimmed = q.trim()
        if (!trimmed) {
          setResults([])
          setTotal(0)
          setSelected(null)
          setSelectedId(null)
          setError(null)
          setIsSearching(false)
          return
        }

        setIsSearching(true)
        setError(null)

        const applyResults = (
          payload: Pick<NarratorSearchResponse, 'results' | 'total' | 'metadata'>,
        ) => {
          setResults(payload.results)
          setTotal(payload.total)
          setMetadata(payload.metadata)
          const firstId = payload.results[0]?.id ?? null
          if (firstId) void fetchDetail(firstId)
          else {
            setSelected(null)
            setSelectedId(null)
          }
        }

        const searchCacheKey = `${NARRATOR_SEARCH_RANKING_VERSION}:${trimmed}`
        const cachedSearch = searchCache.get(searchCacheKey)
        if (cachedSearch) {
          if (requestSeq !== requestSeqRef.current) return
          applyResults(cachedSearch)
          setIsSearching(false)
          return
        }

        try {
          const params = new URLSearchParams({
            q: trimmed,
            limit: '50',
            ranking: NARRATOR_SEARCH_RANKING_VERSION,
          })
          const res = await fetch(
            `${process.env.NEXT_PUBLIC_BASE_PATH || ''}/api/narrators/search?${params.toString()}`,
          )
          const data = (await res.json()) as NarratorSearchResponse & { error?: string }
          if (!res.ok || data.error) throw new Error(data.error || 'Narrator search failed')
          if (requestSeq !== requestSeqRef.current) return

          remember(
            searchCache,
            searchCacheKey,
            { results: data.results, total: data.total, metadata: data.metadata },
            SEARCH_CACHE_LIMIT,
          )
          applyResults(data)
        } catch {
          if (requestSeq !== requestSeqRef.current) return
          setResults([])
          setTotal(0)
          setSelected(null)
          setSelectedId(null)
          setError('Narrator search failed. Please try again.')
        } finally {
          if (requestSeq === requestSeqRef.current) setIsSearching(false)
        }
      }, 250),
    [fetchDetail, setIsSearching],
  )

  useEffect(() => () => runSearch.cancel(), [runSearch])

  useEffect(() => {
    if (!query.trim()) {
      runSearch.cancel()
      requestSeqRef.current += 1
      detailSeqRef.current += 1
      setResults([])
      setTotal(0)
      setSelected(null)
      setSelectedId(null)
      setError(null)
      setIsSearching(false)
      setIsLoadingDetail(false)
      return
    }

    setIsSearching(true)
    runSearch(query)
  }, [query, runSearch, setIsSearching])

  const clear = useCallback(() => {
    runSearch.cancel()
    requestSeqRef.current += 1
    detailSeqRef.current += 1
    setQuery('')
    setResults([])
    setTotal(0)
    setSelected(null)
    setSelectedId(null)
    setError(null)
    setIsSearching(false)
    setIsLoadingDetail(false)
  }, [runSearch, setIsSearching, setQuery])

  return {
    query,
    results,
    selected,
    selectedId,
    total,
    metadata,
    error,
    isSearching,
    isLoadingDetail,
    selectNarrator: fetchDetail,
    clear,
  }
}
