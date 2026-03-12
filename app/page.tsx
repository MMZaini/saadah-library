'use client'

import { useState, useMemo, useEffect } from 'react'
import { books } from '@/lib/books'
import { Hadith } from '@/lib/api'
import BookCard from '@/components/BookCard'
import SearchInterface from '@/components/SearchInterface'
import { useNavigation } from '@/lib/navigation-context'
import { debounce } from '@/lib/performance'
import { Search, Loader2 } from 'lucide-react'

export default function Page() {
  const navigation = useNavigation()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Hadith[]>([])
  const [isSearching, setIsSearching] = useState(false)

  useEffect(() => {
    const saved = navigation.restoreScrollPosition()
    if (saved > 0) requestAnimationFrame(() => window.scrollTo(0, saved))
    navigation.savePath('/')
    const s = navigation.getSearchState()
    if (s) {
      setSearchQuery(s.query)
      setSearchResults(s.results)
    }
  }, [navigation])

  useEffect(() => {
    const handle = () => {
      setSearchQuery('')
      setSearchResults([])
      navigation.saveSearchState(null)
    }
    window.addEventListener('clearSearch', handle)
    return () => window.removeEventListener('clearSearch', handle)
  }, [navigation])

  useEffect(() => {
    const save = () => navigation.saveScrollPosition(window.scrollY)
    window.addEventListener('beforeunload', save)
    return () => {
      window.removeEventListener('beforeunload', save)
      navigation.saveScrollPosition(window.scrollY)
    }
  }, [navigation])

  const debouncedSearch = useMemo(
    () =>
      debounce(async (query: string) => {
        if (!query.trim()) {
          setSearchResults([])
          navigation.saveSearchState(null)
          return
        }
        setIsSearching(true)
        try {
          const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
          const data = await res.json()
          setSearchResults(data.results)
          navigation.saveSearchState({
            query,
            results: data.results,
            page: 1,
            filters: { grading: 'all', sort: 'relevance' },
          })
        } catch {
          setSearchResults([])
          navigation.saveSearchState(null)
        } finally {
          setIsSearching(false)
        }
      }, 300),
    [navigation],
  )

  const handleSearchInput = (value: string) => {
    setSearchQuery(value)
    if (!value.trim()) {
      setSearchResults([])
      navigation.saveSearchState(null)
      return
    }
    debouncedSearch(value)
  }

  const handleClearSearch = () => {
    setSearchQuery('')
    setSearchResults([])
    navigation.saveSearchState(null)
  }

  return (
    <div className="min-h-screen">
      {/* Search bar */}
      <div className="mx-auto max-w-2xl px-4 pt-6 sm:px-6">
        <div className="flex items-center gap-3 rounded-lg border border-border bg-surface-1 px-3.5 py-2.5">
          <Search className="h-4 w-4 shrink-0 text-foreground-faint" />
          <input
            placeholder="Search hadith across all books…"
            value={searchQuery}
            onChange={(e) => handleSearchInput(e.target.value)}
            className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-foreground-faint"
          />
          {isSearching && (
            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-foreground-muted" />
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
