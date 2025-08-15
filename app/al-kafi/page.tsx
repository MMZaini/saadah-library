'use client'

import { useState, useEffect, useMemo, lazy, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { alKafiApi, thaqalaynApi, Hadith, BookInfo } from '@/lib/api'
import SearchInterface from '@/components/SearchInterface'
import { IconSearch } from '@/components/Icons'
import { useSettings } from '@/lib/settings-context'
import { useNavigation } from '@/lib/navigation-context'
import { debounce } from '@/lib/performance'
import clsx from 'clsx'

// Lazy load heavy components
const AlKafiVolumeExplorer = lazy(() => import('@/components/AlKafiVolumeExplorer'))
const BookStructureExplorer = lazy(() => import('@/components/AlKafiVolumeStructure'))
const AlKafiBookBrowser = lazy(() => import('@/components/AlKafiBookBrowser'))

export default function AlKafiPage() {
  const router = useRouter()
  const { settings } = useSettings()
  const navigation = useNavigation()
  
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Hadith[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [bookInfo, setBookInfo] = useState<BookInfo | null>(null)
  const [viewMode, setViewMode] = useState<'structure' | 'chapters' | 'explorer'>('structure')

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Get Al-Kafi book info
        const allBooks = await thaqalaynApi.getAllBooks()
        const alKafiInfo = allBooks.find(book => book.bookId === 'Al-Kafi-Volume-1-Kulayni')
        setBookInfo(alKafiInfo || null)
      } catch (error) {
        console.error('Error loading initial data:', error)
      }
    }

    loadInitialData()
  }, []) // Only run once on mount

  // Initialize navigation state and restore scroll position ONCE on mount
  useEffect(() => {
    // Restore scroll position
    const savedScrollPosition = navigation.restoreScrollPosition()
    if (savedScrollPosition > 0) {
      // Use requestAnimationFrame for smoother scroll restoration
      requestAnimationFrame(() => {
        window.scrollTo(0, savedScrollPosition)
      })
    }

    // Save current path
    navigation.savePath('/al-kafi')

    // Restore search state if available
    const savedSearchState = navigation.getSearchState()
    if (savedSearchState) {
      setSearchQuery(savedSearchState.query)
      setSearchResults(savedSearchState.results)
    }
  }, []) // Empty dependency array - only run once on mount

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

  // Create debounced search function for Al-Kafi
  const debouncedAlKafiSearch = useMemo(
    () => debounce(async (query: string) => {
      if (!query.trim()) {
        setSearchResults([])
        navigation.saveSearchState(null)
        return
      }

      setIsSearching(true)

      try {
        const response = await alKafiApi.searchAlKafi(query)
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
        console.error('Error searching Al-Kafi:', error)
        setSearchResults([])
        navigation.saveSearchState(null)
      } finally {
        setIsSearching(false)
      }
    }, 300),
    [] // Empty dependency array for stable reference
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
    debouncedAlKafiSearch(value)
  }

  // Handle clear search
  const handleClearSearch = () => {
    setSearchQuery('')
    setSearchResults([])
    navigation.saveSearchState(null)
  }

  // Enhanced back button with navigation state preservation
  const handleBackNavigation = () => {
    navigation.saveScrollPosition(window.scrollY)
    router.push('/')
  }

  return (
    <main className="min-h-screen" data-theme={settings.theme}>
      {/* Top bar */}
      <header 
        style={{ background: 'var(--topbar-bg)' }}
        className="sticky top-0 z-40 backdrop-blur-md border-b border-theme">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center gap-2 sm:gap-4">
          {/* Back button removed: search bar only */}

          {/* Search */}
          <div className="relative flex-1 max-w-[720px] mx-auto">
            <div className="flex items-center gap-3 rounded-xl border border-theme bg-input px-4 py-2.5 shadow-soft">
              <IconSearch className="h-5 w-5 text-secondary flex-shrink-0" />
              <input
                placeholder="Search across all Al-Kāfi volumes..."
                value={searchQuery}
                onChange={(e) => handleSearchInput(e.target.value)}
                className="w-full bg-transparent outline-none text-primary placeholder:text-muted text-[15px] focus:outline-none focus:ring-0 focus:border-transparent"
              />
              {isSearching && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 mt-8">
        <div className="bg-gradient-to-r from-amber-50/80 to-yellow-50/80 dark:from-amber-900/20 dark:to-yellow-900/20 border border-amber-200/60 dark:border-amber-800/30 rounded-2xl p-8 shadow-soft backdrop-blur-sm">
          <div className="flex items-start gap-6">
            {bookInfo?.bookCover ? (
              <img
                src={bookInfo.bookCover}
                alt="Al-Kāfi"
                className="w-48 object-cover rounded-lg shadow-medium shrink-0"
              />
            ) : null}
            
            <div className="min-w-0 flex-1">
              <h1 className="text-4xl font-bold text-amber-900 dark:text-amber-100 mb-3">
                Al-Kāfi (الكافي)
              </h1>
              
              <p className="text-xl text-amber-800 dark:text-amber-200 mb-4">
                The Sufficient - A Comprehensive Collection
              </p>
              
              <p className="text-amber-700 dark:text-amber-300 mb-4 font-medium">
                By Shaykh Muḥammad b. Yaʿqūb al-Kulaynī
              </p>
              
              <p className="text-sm text-amber-700/90 dark:text-amber-300/90 leading-relaxed mb-6">
                Al-Kāfi is one of the most significant collections of Shīʿī Ḥadīth, compiled over twenty years. 
                It consists of eight volumes divided into three main parts: al-Uṣūl (Roots), al-Furūʿ (Branches), 
                and al-Rawḍa (the Garden), covering principles of belief, jurisprudence, and miscellaneous teachings.
              </p>
              
              <div className="flex flex-wrap gap-3 text-sm">
                <span className="bg-amber-200/80 dark:bg-amber-800/80 text-amber-900 dark:text-amber-100 px-3 py-1.5 rounded-full font-medium shadow-soft">
                  8 Volumes
                </span>
                <span className="bg-amber-200/80 dark:bg-amber-800/80 text-amber-900 dark:text-amber-100 px-3 py-1.5 rounded-full font-medium shadow-soft">
                  One of the Four Major Books
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Search Results */}
      <SearchInterface
        searchQuery={searchQuery}
        searchResults={searchResults}
        isSearching={isSearching}
        onSearch={debouncedAlKafiSearch}
        onClearSearch={handleClearSearch}
        searchContext="al-kafi"
      />

      {/* Volume Explorer or Chapter Tree - Only show when not searching */}
      {!searchQuery && (
        <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 mt-8 pb-16">
          {/* View Mode Toggle */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-primary mb-2">
                Explore Al-Kāfi
              </h2>
              <p className="text-sm text-muted hidden sm:block">
                Choose how you want to explore the collection
              </p>
            </div>
            
            <div className="bg-card border border-theme rounded-lg p-1 shadow-soft">
              <button
                onClick={() => setViewMode('structure')}
                className={clsx(
                  'px-3 sm:px-4 py-2 rounded text-xs sm:text-sm font-medium transition-all active:scale-95',
                  viewMode === 'structure'
                    ? 'bg-accent-primary text-white shadow-soft'
                    : 'text-secondary hover:text-primary hover:bg-hover-color'
                )}
              >
                <span className="sm:hidden">Explorer</span>
                <span className="hidden sm:inline">Volume Explorer</span>
              </button>
              <button
                onClick={() => setViewMode('chapters')}
                className={clsx(
                  'px-3 sm:px-4 py-2 rounded text-xs sm:text-sm font-medium transition-all active:scale-95',
                  viewMode === 'chapters'
                    ? 'bg-accent-primary text-white shadow-soft'
                    : 'text-secondary hover:text-primary hover:bg-hover-color'
                )}
              >
                <span className="sm:hidden">Tree</span>
                <span className="hidden sm:inline">Chapter Tree</span>
              </button>
              <button
                onClick={() => setViewMode('explorer')}
                className={clsx(
                  'px-2 sm:px-3 py-2 rounded text-xs font-medium transition-all active:scale-95',
                  viewMode === 'explorer'
                    ? 'bg-accent-primary text-white shadow-soft'
                    : 'text-secondary hover:text-primary hover:bg-hover-color'
                )}
              >
                Random
              </button>
            </div>
          </div>

          {/* Render selected view mode */}
          <Suspense fallback={
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-primary"></div>
            </div>
          }>
            {viewMode === 'structure' ? (
              <BookStructureExplorer />
            ) : viewMode === 'chapters' ? (
              <AlKafiBookBrowser />
            ) : (
              <AlKafiVolumeExplorer />
            )}
          </Suspense>
        </section>
      )}
    </main>
  )
}
