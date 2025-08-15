'use client'

import { useState, useEffect, useMemo, lazy, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { uyunApi, thaqalaynApi, Hadith, BookInfo } from '@/lib/api'
import SearchInterface from '@/components/SearchInterface'
import { IconSearch } from '@/components/Icons'
import { useSettings } from '@/lib/settings-context'
import { useNavigation } from '@/lib/navigation-context'
import { debounce } from '@/lib/performance'
import clsx from 'clsx'

// Lazy load heavy components (generic)
const GenericVolumeExplorer = lazy(() => import('@/components/GenericVolumeExplorer'))
const GenericVolumeStructure = lazy(() => import('@/components/GenericVolumeStructure'))
const GenericBookBrowser = lazy(() => import('@/components/GenericBookBrowser'))

export default function UyunPage() {
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
        // Get ʿUyūn akhbār al-Riḍā book info
        const allBooks = await thaqalaynApi.getAllBooks()
        const uyunInfo = allBooks.find(book => book.bookId === 'Uyun-akhbar-al-Rida-Volume-1-Saduq')
        setBookInfo(uyunInfo || null)
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
    navigation.savePath('/uyun-akhbar-al-rida')

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

  // Create debounced search function for ʿUyūn akhbār al-Riḍā
  const debouncedUyunSearch = useMemo(
    () => debounce(async (query: string) => {
      if (!query.trim()) {
        setSearchResults([])
        navigation.saveSearchState(null)
        return
      }

      setIsSearching(true)

      try {
        const response = await uyunApi.searchUyun(query)
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
        console.error('Error searching ʿUyūn akhbār al-Riḍā:', error)
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
    debouncedUyunSearch(value)
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
                placeholder="Search across all ʿUyūn akhbār al-Riḍā volumes..."
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
        <div className="bg-gradient-to-r from-emerald-50/80 to-teal-50/80 dark:from-emerald-900/20 dark:to-teal-900/20 border border-emerald-200/60 dark:border-emerald-800/30 rounded-2xl p-8 shadow-soft backdrop-blur-sm">
          <div className="flex items-start gap-6">
            {bookInfo?.bookCover ? (
              <img
                src={bookInfo.bookCover}
                alt="ʿUyūn akhbār al-Riḍā"
                className="w-48 object-cover rounded-lg shadow-medium shrink-0"
              />
            ) : null}
            
            <div className="min-w-0 flex-1">
              <h1 className="text-4xl font-bold text-emerald-900 dark:text-emerald-100 mb-3">
                ʿUyūn akhbār al-Riḍā (عيون أخبار الرضا)
              </h1>
              
              <p className="text-xl text-emerald-800 dark:text-emerald-200 mb-4">
                The Source of Traditions on Imam al-Riḍā
              </p>
              
              <p className="text-emerald-700 dark:text-emerald-300 mb-4 font-medium">
                By Shaykh Muḥammad b. ʿAlī al-Ṣaduq
              </p>
              
              <p className="text-sm text-emerald-700/90 dark:text-emerald-300/90 leading-relaxed mb-6">
                ʿUyūn akhbār al-Riḍā is a comprehensive collection dedicated to the traditions, 
                biographical accounts, and teachings related to Imam ʿAlī b. Mūsā al-Riḍā (a), 
                the eighth Imam of the Shīʿa. Compiled by the renowned scholar al-Ṣaduq, 
                this work preserves valuable historical and religious material about the Imam.
              </p>
              
              <div className="flex flex-wrap gap-3 text-sm">
                <span className="bg-emerald-200/80 dark:bg-emerald-800/80 text-emerald-900 dark:text-emerald-100 px-3 py-1.5 rounded-full font-medium shadow-soft">
                  2 Volumes
                </span>
                <span className="bg-emerald-200/80 dark:bg-emerald-800/80 text-emerald-900 dark:text-emerald-100 px-3 py-1.5 rounded-full font-medium shadow-soft">
                  Imam al-Riḍā (a) Traditions
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
        onSearch={debouncedUyunSearch}
        onClearSearch={handleClearSearch}
        searchContext="uyun-akhbar-al-rida"
      />

      {/* Volume Explorer or Chapter Tree - Only show when not searching */}
      {!searchQuery && (
        <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 mt-8 pb-16">
          {/* View Mode Toggle */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-primary mb-2">
                Explore ʿUyūn akhbār al-Riḍā
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
              <GenericVolumeStructure bookId="Uyun-akhbar-al-Rida" bookName="ʿUyūn akhbār al-Riḍā" volumes={[] as any} baseRoute="/book/Uyun-akhbar-al-Rida" />
            ) : viewMode === 'chapters' ? (
              <GenericBookBrowser bookId="Uyun-akhbar-al-Rida" bookConfig={null} />
            ) : (
              <GenericVolumeExplorer bookConfig={{ bookId: 'Uyun-akhbar-al-Rida', englishName: 'ʿUyūn akhbār al-Riḍā', volumes: [], hasMultipleVolumes: true }} />
            )}
          </Suspense>
        </section>
      )}
    </main>
  )
}
