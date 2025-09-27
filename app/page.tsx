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
    () => debounce(async (query: string) => {
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
            sort: 'relevance'
          }
        })
      } catch (error) {
        // Search failed, show empty results
        setSearchResults([])
        navigation.saveSearchState(null)
      } finally {
        setIsSearching(false)
      }
    }, 300),
  [] // Remove navigation dependency to prevent recreation
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
        className="sticky top-0 z-40 backdrop-blur-md border-b border-theme">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center gap-4">
          {/* Search - Mobile first, then desktop */}
          <div className="relative flex-1 max-w-[720px] mx-auto">
            <div className="flex items-center gap-3 rounded-xl border border-theme bg-input px-4 py-2.5 shadow-soft">
              <IconSearch className="h-5 w-5 text-secondary flex-shrink-0" />
              <input
                placeholder="Search Hadith across all books..."
                value={searchQuery}
                onChange={(e) => handleSearchInput(e.target.value)}
                className="w-full bg-transparent outline-none text-primary placeholder:text-muted text-[15px] focus:outline-none focus:ring-0 focus:border-transparent"
              />
              {isSearching && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary flex-shrink-0"></div>
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

      {/* Featured Al-Kafi Section - Only show when not searching */}
      {!searchQuery && (
        <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 mt-8">
          <div className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 border border-amber-200 dark:border-amber-800/30 rounded-2xl p-4 sm:p-6 lg:p-8 shadow-soft mb-12">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-amber-900 dark:text-amber-100 mb-2">
                  Al-Kāfi (الكافي)
                  <span className="hidden sm:inline"> - Featured Collection</span>
                </h2>
                <p className="text-sm sm:text-base text-amber-700 dark:text-amber-300">
                  <span className="sm:hidden">Most comprehensive Shīʿī Ḥadīth collection</span>
                  <span className="hidden sm:inline">Explore the most comprehensive Shīʿī Ḥadīth collection with specialized features</span>
                </p>
              </div>
              
              <Link
                href="/al-kafi"
                className="px-4 sm:px-6 py-2 sm:py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium transition-colors text-center text-sm sm:text-base select-none"
              >
                  Explore <span className="font-arabic select-none">الكافي</span>
              </Link>
            </div>
            
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
              <div className="bg-white/50 dark:bg-black/20 rounded-lg p-3 sm:p-4">
                <h3 className="font-semibold text-amber-900 dark:text-amber-100 mb-1 sm:mb-2 text-sm sm:text-base">8 Volumes</h3>
                <p className="text-xs sm:text-sm text-amber-700 dark:text-amber-300">
                  Browse through all volumes with dedicated volume explorer
                </p>
              </div>
              
              <div className="bg-white/50 dark:bg-black/20 rounded-lg p-3 sm:p-4">
                <h3 className="font-semibold text-amber-900 dark:text-amber-100 mb-1 sm:mb-2 text-sm sm:text-base">Advanced Search</h3>
                <p className="text-xs sm:text-sm text-amber-700 dark:text-amber-300">
                  Search across all volumes simultaneously for comprehensive results
                </p>
              </div>
              
              <div className="bg-white/50 dark:bg-black/20 rounded-lg p-3 sm:p-4 sm:col-span-2 md:col-span-1">
                <h3 className="font-semibold text-amber-900 dark:text-amber-100 mb-1 sm:mb-2 text-sm sm:text-base">Major Collection</h3>
                <p className="text-xs sm:text-sm text-amber-700 dark:text-amber-300">
                  Explore the major collection of Shīʿī Ḥadīth with in-depth resources
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Books grid - Only show when not searching */}
      {!searchQuery && (
        <section className="mx-auto max-w-[1800px] px-4 sm:px-8 md:px-16 lg:px-20 xl:px-32 mt-8 sm:mt-12 pb-12 sm:pb-16">
          <div className="mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-primary mb-2">
              Browse Books
            </h2>
            <p className="text-sm text-muted">
              <span className="sm:hidden">Tap any book to explore</span>
              <span className="hidden sm:inline">Click on any book to explore its hadiths</span>
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-8 md:gap-12 lg:gap-16 xl:gap-24 gap-y-8 sm:gap-y-12 md:gap-y-16">
            {books.map((b) => (
              <BookCard key={b.id} book={b} />
            ))}
          </div>
        </section>
      )}
    {/* Footer - Home page only */}
    <footer className="w-full mt-12 border-t border-gray-200 dark:border-gray-700 py-6 flex justify-center items-center bg-white/70 dark:bg-black/30">
      <p className="text-sm text-gray-700 dark:text-gray-300 text-center">
        Found a bug or have a feature request? Contact <span className="font-semibold">@deleteooom</span> on Discord.
      </p>
    </footer>
  </div>
  )
}



