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
        const alKafiInfo = allBooks.find((book) => book.bookId === 'Al-Kafi-Volume-1-Kulayni')
        setBookInfo(alKafiInfo || null)
      } catch (error) {
        // Error logging removed
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
    () =>
      debounce(async (query: string) => {
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
              sort: 'relevance',
            },
          })
        } catch (error) {
          // Error logging removed
          setSearchResults([])
          navigation.saveSearchState(null)
        } finally {
          setIsSearching(false)
        }
      }, 300),
    [], // Empty dependency array for stable reference
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
        className="border-theme sticky top-0 z-40 border-b backdrop-blur-md"
      >
        <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-4 sm:gap-4">
          {/* Back button removed: search bar only */}

          {/* Search */}
          <div className="relative mx-auto max-w-[720px] flex-1">
            <div className="border-theme bg-input flex items-center gap-3 rounded-xl border px-4 py-2.5 shadow-soft">
              <IconSearch className="text-secondary h-5 w-5 flex-shrink-0" />
              <input
                placeholder="Search across all Al-Kāfi volumes..."
                value={searchQuery}
                onChange={(e) => handleSearchInput(e.target.value)}
                className="text-primary w-full bg-transparent text-[15px] outline-none placeholder:text-muted focus:border-transparent focus:outline-none focus:ring-0"
              />
              {isSearching && (
                <div className="border-primary h-4 w-4 animate-spin rounded-full border-b-2"></div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="mx-auto mt-8 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-amber-200/60 bg-gradient-to-r from-amber-50/80 to-yellow-50/80 p-8 shadow-soft backdrop-blur-sm dark:border-amber-800/30 dark:from-amber-900/20 dark:to-yellow-900/20">
          <div className="flex items-start gap-6">
            {bookInfo?.bookCover ? (
              <img
                src={bookInfo.bookCover}
                alt="Al-Kāfi"
                className="shadow-medium hidden w-48 shrink-0 select-none rounded-lg object-cover md:block"
              />
            ) : null}

            <div className="min-w-0 flex-1">
              <h1 className="mb-3 text-4xl font-bold text-amber-900 dark:text-amber-100">
                Al-Kāfi (الكافي)
              </h1>

              <p className="mb-4 text-xl text-amber-800 dark:text-amber-200">
                The Sufficient - A Comprehensive Collection
              </p>

              <p className="mb-4 font-medium text-amber-700 dark:text-amber-300">
                By Shaykh Muḥammad b. Yaʿqūb al-Kulaynī
              </p>

              <p className="mb-6 text-sm leading-relaxed text-amber-700/90 dark:text-amber-300/90">
                Al-Kāfi is one of the most significant collections of Shīʿī Ḥadīth, compiled over
                twenty years. It consists of eight volumes divided into three main parts: al-Uṣūl
                (Roots), al-Furūʿ (Branches), and al-Rawḍa (the Garden), covering principles of
                belief, jurisprudence, and miscellaneous teachings.
              </p>

              <div className="flex flex-wrap gap-3 text-sm">
                <span className="rounded-full bg-amber-200/80 px-3 py-1.5 font-medium text-amber-900 shadow-soft dark:bg-amber-800/80 dark:text-amber-100">
                  8 Volumes
                </span>
                <span className="rounded-full bg-amber-200/80 px-3 py-1.5 font-medium text-amber-900 shadow-soft dark:bg-amber-800/80 dark:text-amber-100">
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
        <section className="mx-auto mt-8 max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
          {/* View Mode Toggle */}
          <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div className="hidden sm:block">
              <h2 className="text-primary mb-2 text-xl font-bold sm:text-2xl">Explore Al-Kāfi</h2>
              <p className="hidden text-sm text-muted sm:block">
                Choose how you want to explore the collection
              </p>
            </div>

            <div className="border-theme mx-auto rounded-lg border bg-card p-1 shadow-soft sm:mx-0">
              <button
                onClick={() => setViewMode('structure')}
                className={clsx(
                  'rounded px-4 py-2 text-xs font-medium transition-all active:scale-95 sm:px-4 sm:text-sm',
                  viewMode === 'structure'
                    ? 'bg-accent-primary text-white shadow-soft'
                    : 'text-secondary hover:text-primary hover:bg-hover-color',
                )}
              >
                <span className="sm:hidden">Explorer</span>
                <span className="hidden sm:inline">Volume Explorer</span>
              </button>
              <button
                onClick={() => setViewMode('chapters')}
                className={clsx(
                  'rounded px-5 py-2 text-xs font-medium transition-all active:scale-95 sm:px-4 sm:text-sm',
                  viewMode === 'chapters'
                    ? 'bg-accent-primary text-white shadow-soft'
                    : 'text-secondary hover:text-primary hover:bg-hover-color',
                )}
              >
                <span className="sm:hidden">Tree</span>
                <span className="hidden sm:inline">Chapter Tree</span>
              </button>
              <button
                onClick={() => setViewMode('explorer')}
                className={clsx(
                  'rounded px-4 py-2 text-xs font-medium transition-all active:scale-95 sm:px-3',
                  viewMode === 'explorer'
                    ? 'bg-accent-primary text-white shadow-soft'
                    : 'text-secondary hover:text-primary hover:bg-hover-color',
                )}
              >
                Random
              </button>
            </div>
          </div>

          {/* Render selected view mode */}
          <Suspense
            fallback={
              <div className="flex items-center justify-center py-12">
                <div className="border-accent-primary h-8 w-8 animate-spin rounded-full border-b-2"></div>
              </div>
            }
          >
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
