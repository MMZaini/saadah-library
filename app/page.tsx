'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { books } from '@/lib/books'
import { Hadith } from '@/lib/api'
import BookCard from '@/components/BookCard'
import SearchInterface from '@/components/SearchInterface'
import { useNavigation } from '@/lib/navigation-context'
import { useSearchShortcuts } from '@/lib/use-search-shortcuts'
import { debounce } from '@/lib/performance'
import { Search, Loader2, Clock } from 'lucide-react'

export default function Page() {
  const { restoreScrollPosition, savePath, getSearchState, saveSearchState, saveScrollPosition } = useNavigation()
  const searchInputRef = useRef<HTMLInputElement>(null)
  const { history, addToHistory, clearHistory } = useSearchShortcuts(searchInputRef)
  const [showHistory, setShowHistory] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Hadith[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)

  useEffect(() => {
    const saved = restoreScrollPosition()
    if (saved > 0) requestAnimationFrame(() => window.scrollTo(0, saved))
    savePath('/')
    const s = getSearchState()
    if (s) {
      setSearchQuery(s.query)
      setSearchResults(s.results as Hadith[])
    }
  }, [restoreScrollPosition, savePath, getSearchState])

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
    const save = () => saveScrollPosition(window.scrollY)
    window.addEventListener('beforeunload', save)
    return () => {
      window.removeEventListener('beforeunload', save)
      saveScrollPosition(window.scrollY)
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
          const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/api/search?q=${encodeURIComponent(query)}`)
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
    setShowHistory(false)
    if (!value.trim()) {
      debouncedSearch.cancel()
      setSearchResults([])
      setSearchError(null)
      saveSearchState(null)
      return
    }
    debouncedSearch(value)
  }

  const handleClearSearch = () => {
    debouncedSearch.cancel()
    setSearchQuery('')
    setSearchResults([])
    setSearchError(null)
    saveSearchState(null)
    setShowHistory(false)
  }

  const handleSearchSubmit = () => {
    if (searchQuery.trim()) addToHistory(searchQuery.trim())
    setShowHistory(false)
  }

  const handleHistorySelect = (query: string) => {
    setSearchQuery(query)
    setShowHistory(false)
    debouncedSearch(query)
  }

  return (
    <div className="min-h-screen">
      {/* Search bar */}
      <div className="mx-auto max-w-2xl px-4 pt-6 sm:px-6">
        <div className="relative">
          <div className="flex items-center gap-3 rounded-lg border border-border bg-surface-1 px-3.5 py-2.5">
            <Search className="h-4 w-4 shrink-0 text-foreground-faint" />
            <input
              ref={searchInputRef}
              placeholder="Search hadith across all books… (Ctrl+K)"
              value={searchQuery}
              onChange={(e) => handleSearchInput(e.target.value)}
              onFocus={() => { if (!searchQuery && history.length > 0) setShowHistory(true) }}
              onBlur={() => setTimeout(() => setShowHistory(false), 200)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSearchSubmit()
                if (e.key === 'Escape') { setShowHistory(false); searchInputRef.current?.blur() }
              }}
              className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-foreground-faint"
            />
            {isSearching && (
              <Loader2 className="h-4 w-4 shrink-0 animate-spin text-foreground-muted" />
            )}
            <kbd className="hidden shrink-0 rounded border border-border px-1.5 py-0.5 font-mono text-[10px] text-foreground-faint sm:inline-block">
              ⌘K
            </kbd>
          </div>

          {/* Search history dropdown */}
          {showHistory && history.length > 0 && (
            <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-lg border border-border bg-surface-1 shadow-lg">
              <div className="flex items-center justify-between px-3 py-1.5">
                <span className="text-xs font-medium text-foreground-muted">Recent searches</span>
                <button
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={clearHistory}
                  className="text-xs text-foreground-faint transition-colors hover:text-foreground-muted"
                >
                  Clear
                </button>
              </div>
              {history.map((q, i) => (
                <button
                  key={i}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleHistorySelect(q)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-surface-2"
                >
                  <Clock className="h-3 w-3 shrink-0 text-foreground-faint" />
                  <span className="truncate">{q}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Search results */}
      <SearchInterface
        searchQuery={searchQuery}
        searchResults={searchResults}
        isSearching={isSearching}
        onSearch={debouncedSearch}
        onClearSearch={handleClearSearch}
        searchContext="all-books"
        searchError={searchError}
      />

      {/* Book grid */}
      {!searchQuery && (
        <section className="mx-auto mt-8 max-w-5xl px-4 pb-12 sm:px-6">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-foreground sm:text-xl">Browse Books</h2>
            <p className="mt-0.5 text-sm text-foreground-muted">
              Select a book to explore its hadiths
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
            {books.map((b) => (
              <BookCard key={b.id} book={b} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
