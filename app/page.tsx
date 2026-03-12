'use client'

import Link from 'next/link'
import { useState, useMemo, useEffect } from 'react'
import { books } from '@/lib/books'
import { thaqalaynApi, Hadith } from '@/lib/api'
import BookCard from '@/components/BookCard'
import SearchInterface from '@/components/SearchInterface'
import { IconSearch } from '@/components/Icons'
import { useSettings } from '@/lib/settings-context'
import { useNavigation } from '@/lib/navigation-context'
import { debounce } from '@/lib/performance'

export default function Page() {
  const { settings } = useSettings()
  const navigation = useNavigation()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Hadith[]>([])
  const [isSearching, setIsSearching] = useState(false)

  // Initialize navigation state and restore scroll position ONCE on mount
  useEffect(() => {
    const savedScrollPosition = navigation.restoreScrollPosition()
    if (savedScrollPosition > 0) {
      // Use requestAnimationFrame for smoother scroll restoration
      requestAnimationFrame(() => {
        window.scrollTo(0, savedScrollPosition)
      })
    }

    // Save current path
    navigation.savePath('/')

    // Restore search state if available
    const savedSearchState = navigation.getSearchState()
    if (savedSearchState) {
      setSearchQuery(savedSearchState.query)
      setSearchResults(savedSearchState.results)
    }
  }, []) // Empty dependency array - only run once on mount

  // Listen for clear search events from TopBar
  useEffect(() => {
    const handleClearSearchEvent = () => {
      setSearchQuery('')
      setSearchResults([])
      navigation.saveSearchState(null)
    }

    window.addEventListener('clearSearch', handleClearSearchEvent)

    return () => {
      window.removeEventListener('clearSearch', handleClearSearchEvent)
    }
  }, [navigation])

  // Set up scroll position saving (separate effect)
  useEffect(() => {
    const saveScrollBeforeUnload = () => {
      navigation.saveScrollPosition(window.scrollY)
    }

    window.addEventListener('beforeunload', saveScrollBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', saveScrollBeforeUnload)
      navigation.saveScrollPosition(window.scrollY)
    }
  }, []) // Empty dependency array - only set up once

  // Create debounced search function (stable reference)
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
          // Always use our API route, which handles Arabic locally and English via upstream
          const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
          const response = await res.json()
          setSearchResults(response.results)

          // Save search state for navigation
          navigation.saveSearchState({
            query,
            results: response.results,
            page: 1,
            filters: {
              grading: 'all',
              sort: 'relevance',
            },
          })
        } catch (error) {
          // Search failed, show empty results
          setSearchResults([])
          navigation.saveSearchState(null)
        } finally {
          setIsSearching(false)
        }
      }, 300),
    [], // Remove navigation dependency to prevent recreation
  )

  // Handle search input change - update state immediately, debounce API call
  const handleSearchInput = (value: string) => {
    setSearchQuery(value) // Update input immediately (no delay)

    if (!value.trim()) {
      setSearchResults([])
      navigation.saveSearchState(null)
      return
    }

    // Debounce the actual search API call
    debouncedSearch(value)
  }

  // Handle clear search
  const handleClearSearch = () => {
    setSearchQuery('')
    setSearchResults([])
    navigation.saveSearchState(null)
  }

  return (
    <div className="min-h-screen" data-theme={settings.theme}>
      {/* Top bar */}
      <header
        style={{ background: 'var(--topbar-bg)' }}
        className="border-theme sticky top-0 z-40 border-b backdrop-blur-md"
      >
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-4">
          {/* Search - Mobile first, then desktop */}
          <div className="relative mx-auto max-w-[720px] flex-1">
            <div className="border-theme bg-input flex items-center gap-3 rounded-xl border px-4 py-2.5 shadow-soft">
              <IconSearch className="text-secondary h-5 w-5 flex-shrink-0" />
              <input
                placeholder="Search Hadith across all books..."
                value={searchQuery}
                onChange={(e) => handleSearchInput(e.target.value)}
                className="text-primary w-full bg-transparent text-[15px] outline-none placeholder:text-muted focus:border-transparent focus:outline-none focus:ring-0"
              />
              {isSearching && (
                <div className="border-primary h-4 w-4 flex-shrink-0 animate-spin rounded-full border-b-2"></div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Search Results */}
      <SearchInterface
        searchQuery={searchQuery}
        searchResults={searchResults}
        isSearching={isSearching}
        onSearch={debouncedSearch}
        onClearSearch={handleClearSearch}
        searchContext="all-books"
      />

      {/* Featured Al-Kafi section removed per request */}

      {/* Books grid - Only show when not searching */}
      {!searchQuery && (
        <section className="mx-auto mt-8 max-w-[1800px] px-4 pb-12 sm:mt-12 sm:px-8 sm:pb-16 md:px-16 lg:px-20 xl:px-32">
          <div className="mb-6 sm:mb-8">
            <h2 className="text-primary mb-2 text-xl font-bold sm:text-2xl">Browse Books</h2>
            <p className="text-sm text-muted">
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
      {/* Footer - Home page only */}
      <footer className="mt-12 flex w-full items-center justify-center border-t border-gray-200 bg-white/70 py-6 dark:border-gray-700 dark:bg-black/30">
        <p className="text-center text-sm text-gray-700 dark:text-gray-300">
          Found a bug or have a feature request? Contact{' '}
          <span className="font-semibold">@deleteooom</span> on Discord.
        </p>
      </footer>
    </div>
  )
}
