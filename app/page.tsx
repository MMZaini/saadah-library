'use client'

import { useState, useEffect, useCallback } from 'react'
import { books } from '@/lib/books'
import BookCard from '@/components/BookCard'
import SearchInterface from '@/components/SearchInterface'
import { useServerSearch } from '@/lib/use-server-search'

export default function Page() {
  // Book-scope pre-filter selected from the search filters (global search only).
  const [scopeBookParam, setScopeBookParam] = useState('')

  const { query, results, error, isSearching, clear } = useServerSearch({
    placeholder: 'Search all books…',
    bookParam: scopeBookParam,
    resetKey: '/',
  })

  // The TopBar brand title clears the home search when already on home.
  useEffect(() => {
    const handle = () => clear()
    window.addEventListener('clearSearch', handle)
    return () => window.removeEventListener('clearSearch', handle)
  }, [clear])

  const handleBookScopeChange = useCallback((ids: string[]) => {
    setScopeBookParam(ids.join(','))
  }, [])

  return (
    <div className="min-h-screen">
      {/* Search results (renders nothing when the query is empty) */}
      <SearchInterface
        searchQuery={query}
        searchResults={results}
        isSearching={isSearching}
        onSearch={() => {}}
        onClearSearch={clear}
        searchContext="all-books"
        searchError={error}
        onBookScopeChange={handleBookScopeChange}
      />

      {/* Book grid */}
      {!query && (
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
