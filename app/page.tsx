'use client'

import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { books } from '@/lib/books'
import { Hadith } from '@/lib/api'
import BookCard from '@/components/BookCard'
import SearchInterface from '@/components/SearchInterface'
import SearchBar from '@/components/SearchBar'
import { useNavigation } from '@/lib/navigation-context'
import { debounce } from '@/lib/performance'

export default function Page() {
  const { restoreScrollPosition, getSearchState, saveSearchState, saveScrollPosition } =
    useNavigation()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Hadith[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const bookScopeRef = useRef<string[]>([])

  useEffect(() => {
    const saved = restoreScrollPosition()
    if (saved > 0) requestAnimationFrame(() => window.scrollTo(0, saved))
    const s = getSearchState()
    if (s) {
      setSearchQuery(s.query)
      setSearchResults(s.results as Hadith[])
    }
  }, [restoreScrollPosition, getSearchState])

  useEffect(() => {
    const handle = () => {
      setSearchQuery('')
      setSearchResults([])
      saveSearchState(null)
    }
    window.addEventListener('clearSearch', handle)
    return () => window.removeEventListener('clearSearch', handle)
  }, [saveSearchState])

  useEffect(() => {
    // Capture the path at mount: on unmount the URL may already point at the
    // next route, so we must save this page's scroll under its own path.
    const path = window.location.pathname
    const save = () => saveScrollPosition(window.scrollY, path)
    window.addEventListener('beforeunload', save)
    return () => {
      window.removeEventListener('beforeunload', save)
      saveScrollPosition(window.scrollY, path)
    }
  }, [saveScrollPosition])

  const debouncedSearch = useMemo(
    () =>
      debounce(async (query: string) => {
        if (!query.trim()) {
          setSearchResults([])
          setSearchError(null)
          saveSearchState(null)
          return
        }
        setIsSearching(true)
        setSearchError(null)
        try {
          const bookIds = bookScopeRef.current
          const bookParam = bookIds.length > 0 ? `&book=${bookIds.join(',')}` : ''
          const res = await fetch(
            `${process.env.NEXT_PUBLIC_BASE_PATH || ''}/api/search?q=${encodeURIComponent(query)}${bookParam}`,
          )
          if (!res.ok) throw new Error('Search request failed')
          const data = await res.json()
          if (data.error) throw new Error(data.error)
          setSearchResults(data.results)
          saveSearchState({
            query,
            results: data.results,
            page: 1,
            filters: { grading: 'all', sort: 'relevance' },
          })
        } catch {
          setSearchResults([])
          setSearchError('Search failed. Please try again.')
          saveSearchState(null)
        } finally {
          setIsSearching(false)
        }
      }, 300),
    [saveSearchState],
  )

  const handleSearchInput = (value: string) => {
    setSearchQuery(value)
    if (!value.trim()) {
      debouncedSearch.cancel()
      setSearchResults([])
      setIsSearching(false)
      setSearchError(null)
      saveSearchState(null)
      return
    }
    setIsSearching(true)
    debouncedSearch(value)
  }

  const handleClearSearch = () => {
    debouncedSearch.cancel()
    setSearchQuery('')
    setSearchResults([])
    setIsSearching(false)
    setSearchError(null)
    saveSearchState(null)
  }

  const handleBookScopeChange = useCallback(
    (ids: string[]) => {
      bookScopeRef.current = ids
      if (searchQuery.trim()) {
        setIsSearching(true)
        debouncedSearch(searchQuery)
      }
    },
    [searchQuery, debouncedSearch],
  )

  return (
    <div className="min-h-screen">
      {/* Search bar */}
      <SearchBar
        value={searchQuery}
        onChange={handleSearchInput}
        placeholder="Search hadith across all books… (Ctrl+K)"
        isSearching={isSearching}
        className="max-w-3xl"
      />

      {/* Search results */}
      <SearchInterface
        searchQuery={searchQuery}
        searchResults={searchResults}
        isSearching={isSearching}
        onSearch={debouncedSearch}
        onClearSearch={handleClearSearch}
        searchContext="all-books"
        searchError={searchError}
        onBookScopeChange={handleBookScopeChange}
      />

      {/* Book grid */}
      {!searchQuery && (
        <section className="mx-auto mt-8 max-w-[1800px] px-4 pb-12 sm:mt-12 sm:px-8 sm:pb-16 md:px-16 lg:px-20 xl:px-32">
          <div className="mb-6 sm:mb-8">
            <h2 className="mb-2 text-xl font-bold text-foreground sm:text-2xl">Browse Books</h2>
            <p className="text-sm text-foreground-faint">
              <span className="sm:hidden">Tap any book to explore</span>
              <span className="hidden sm:inline">Click on any book to explore its hadiths</span>
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 gap-y-8 sm:grid-cols-2 sm:gap-8 sm:gap-y-12 md:gap-12 md:gap-y-16 lg:gap-16 xl:grid-cols-3 xl:gap-24">
            {books.map((b) => (
              <BookCard key={b.id} book={b} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
