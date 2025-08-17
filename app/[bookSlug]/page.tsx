'use client'

import { useState, useEffect, useMemo, lazy, Suspense } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { thaqalaynApi, Hadith, BookInfo } from '@/lib/api'
import { getBookConfig, getBookIdFromUrlSlug } from '@/lib/books-config'
import { books } from '@/lib/books'
import HadithCard from '@/components/HadithCard'
import SearchInterface from '@/components/SearchInterface'
import { IconSearch, IconMenu } from '@/components/Icons'
import { useSettings } from '@/lib/settings-context'
import { debounce } from '@/lib/performance'
import clsx from 'clsx'

const GenericBookBrowser = lazy(() => import('@/components/GenericBookBrowser'))
const GenericVolumeExplorer = lazy(() => import('@/components/GenericVolumeExplorer'))
const GenericVolumeStructure = lazy(() => import('@/components/GenericVolumeStructure'))

interface BookPageState {
  bookInfo: BookInfo | null
  hadiths: Hadith[]
  loading: boolean
  error: string | null
}

export default function BookPage() {
  const params = useParams()
  const router = useRouter()
  const { settings, toggleSettings } = useSettings()
  const urlSlug = params?.bookSlug as string
  const bookId = getBookIdFromUrlSlug(urlSlug)

  const [state, setState] = useState<BookPageState>({
    bookInfo: null,
    hadiths: [],
    loading: true,
    error: null
  })

  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Hadith[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [viewMode, setViewMode] = useState<'structure' | 'chapters' | 'explorer'>('structure')

  // Optional: implement scroll/save state if navigation-context is available

  // Create debounced search function
  const debouncedSearch = useMemo(
    () => debounce(async (query: string) => {
      if (!query.trim()) {
        setSearchResults([])
        return
      }

      setIsSearching(true)

      try {
        const response = await thaqalaynApi.searchBook(bookId, query)
        setSearchResults(response.results)
        
  // Optional: persist search state if navigation-context implemented
      } catch (error) {
        // Search failed
        setSearchResults([])
      } finally {
        setIsSearching(false)
      }
  }, 300),
  [bookId]
  )

  // Handle search input change
  const handleSearchInput = (value: string) => {
    setSearchQuery(value)
    
    if (!value.trim()) {
      setSearchResults([])
      return
    }
    
    debouncedSearch(value)
  }

  // Handle clear search
  const handleClearSearch = () => {
    setSearchQuery('')
    setSearchResults([])
  }

  // Load book information and initial random hadith
  useEffect(() => {
    const loadBookData = async () => {
      if (!bookId) return

      setState(prev => ({ ...prev, loading: true, error: null }))

      try {
        const allBooks = await thaqalaynApi.getAllBooks()
        let bookInfo = allBooks.find(book => book.bookId === bookId)

        // If API didn't return the book, fallback to local config (some books are multi-volume
        // with Thaqalayn book IDs and may not appear in the API's allbooks payload)
        if (!bookInfo) {
          const config = getBookConfig(bookId)
          if (config) {
            // Create a minimal BookInfo from the config so the page can render
            // Try to enrich it from the local `books` list (title, author, image)
            const simpleNorm = (s: string | undefined | null) =>
              (s || '')
                .toLowerCase()
                .normalize('NFD')
                .replace(/\p{M}/gu, '')
                .replace(/[^a-z0-9]+/g, '')

            const target = simpleNorm(config.englishName || config.bookId)
            const localMatch = books.find(b => {
              const bNorm = simpleNorm(b.title)
              return bNorm && (bNorm.includes(target) || target.includes(bNorm))
            })

            bookInfo = {
              bookId: config.bookId,
              BookName: localMatch?.title || config.englishName,
              author: localMatch?.author || '',
              idRangeMin: 0,
              idRangeMax: 0,
              bookDescription: localMatch?.description || '',
              bookCover: localMatch?.image || '',
              englishName: config.englishName,
              translator: '',
              volume: config.volumeCount ?? (config.volumes?.length ?? 1)
            } as BookInfo
          }
        }

        if (!bookInfo) {
          setState(prev => ({ ...prev, error: 'Book not found', loading: false }))
          return
        }

        setState(prev => ({
          ...prev,
          bookInfo,
          loading: false
        }))
      } catch (error) {
        // Failed to load book data
        setState(prev => ({
          ...prev,
          error: 'Failed to load book data',
          loading: false
        }))
      }
    }

    loadBookData()
  }, [bookId])

  if (state.loading) {
    return (
      <main className="min-h-screen" data-theme={settings.theme}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted">Loading book...</p>
          </div>
        </div>
      </main>
    )
  }

  if (state.error || !state.bookInfo) {
    return (
      <main className="min-h-screen" data-theme={settings.theme}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <p className="text-red-500 mb-4">{state.error || 'Book not found'}</p>
            <button
              onClick={() => router.push('/')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-card border border-theme rounded-lg hover:bg-hover-color text-primary transition-all active:scale-95"
            >
              Go back to library
            </button>
          </div>
        </div>
      </main>
    )
  }

  const { bookInfo } = state
  const displayedHadiths = searchQuery ? searchResults : []
  const bookConfig = getBookConfig(bookId)

  const normalize = (s: string) =>
    s
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{M}/gu, '')
      .replace(/[^a-z0-9]+/g, '')

  const findTitleFromBooksList = (id?: string | null) => {
    if (!id) return null
    const normId = normalize(id)
    for (const b of books) {
      const normTitle = normalize(b.title)
      if (!normTitle) continue
      if (normId.includes(normTitle) || normTitle.includes(normId)) return b.title
    }
    return null
  }

  const findImageFromBooksList = (id?: string | null) => {
    if (!id) return null
    const normId = normalize(id)
    for (const b of books) {
      const normTitle = normalize(b.title)
      if (!normTitle) continue
      if (normId.includes(normTitle) || normTitle.includes(normId)) return b.image
    }
    return null
  }

  const displayTitle = findTitleFromBooksList(bookId) || getBookConfig(bookId)?.englishName || bookInfo?.englishName || bookInfo?.BookName || bookId

  const coverSrc = bookInfo?.bookCover || findImageFromBooksList(bookId)

  return (
    <main className="min-h-screen" data-theme={settings.theme}>
      {/* Top bar */}
      <header 
        style={{ background: 'var(--topbar-bg)' }}
        className="sticky top-0 z-40 backdrop-blur-md border-b border-theme">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center gap-4">
          {/* Back button removed: search bar only */}

          {/* Search */}
          <div className="relative flex-1 max-w-[720px] mx-auto">
            <div className="flex items-center gap-3 rounded-xl border border-theme bg-input px-4 py-2.5 shadow-soft">
              <IconSearch className="h-5 w-5 text-secondary" />
              <input
                placeholder={`Search across all ${displayTitle} volumes...`}
                value={searchQuery}
                onChange={(e) => handleSearchInput(e.target.value)}
                className="w-full bg-transparent outline-none text-primary placeholder:text-muted text-[15px] focus:outline-none focus:ring-0 focus:border-transparent"
              />
              {isSearching && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              )}
            </div>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-3 ml-auto">
            <button 
              onClick={toggleSettings}
              className="p-2 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors focus-visible:outline-2 focus-visible:outline-amber-500/50 min-h-[44px] min-w-[44px] flex items-center justify-center"
              title="Settings"
            >
              <IconMenu className="h-5 w-5 sm:h-6 sm:w-6 text-primary/80 hover:text-primary" />
            </button>
          </div>
        </div>
      </header>

      {/* Book header (Uyun-style hero for visual parity) */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 mt-8">
        <div className="bg-gradient-to-r from-emerald-50/80 to-teal-50/80 dark:from-emerald-900/20 dark:to-teal-900/20 border border-emerald-200/60 dark:border-emerald-800/30 rounded-2xl p-8 shadow-soft backdrop-blur-sm">
          <div className="flex items-start gap-6">
            {coverSrc ? (
              <img
                src={coverSrc}
                alt={bookInfo?.englishName || displayTitle}
                className="hidden md:block w-48 object-cover rounded-lg shadow-medium shrink-0 select-none"
              />
            ) : null}

            <div className="min-w-0 flex-1">
              <h1 className="text-4xl font-bold text-emerald-900 dark:text-emerald-100 mb-3">
                {displayTitle}
              </h1>

              <p className="text-xl text-emerald-800 dark:text-emerald-200 mb-4">
                {bookInfo?.englishName || bookConfig?.englishName || ''}
              </p>

              <p className="text-emerald-700 dark:text-emerald-300 mb-4 font-medium">
                {bookInfo?.author}
              </p>

              <p className="text-sm text-emerald-700/90 dark:text-emerald-300/90 leading-relaxed mb-6">
                {bookInfo?.bookDescription}
              </p>

              <div className="flex flex-wrap gap-3 text-sm">
                <span className="bg-emerald-200/80 dark:bg-emerald-800/80 text-emerald-900 dark:text-emerald-100 px-3 py-1.5 rounded-full font-medium shadow-soft">
                  {bookConfig?.volumeCount ?? (bookConfig?.volumes?.length || 1)} {bookConfig?.volumeCount && bookConfig.volumeCount > 1 ? 'Volumes' : 'Volume'}
                </span>
                <span className="bg-emerald-200/80 dark:bg-emerald-800/80 text-emerald-900 dark:text-emerald-100 px-3 py-1.5 rounded-full font-medium shadow-soft">
                  {displayTitle}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Results */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 mt-8 pb-16">
        {searchQuery ? (
          <SearchInterface
            searchResults={searchResults}
            searchQuery={searchQuery}
            isSearching={isSearching}
            searchContext={bookId}
            onSearch={handleSearchInput}
            onClearSearch={handleClearSearch}
          />
        ) : (
          <>
            {/* View Mode Toggle (match Uyun layout exactly) */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
              <div className="hidden sm:block">
                <h2 className="text-xl sm:text-2xl font-bold text-primary mb-2">Explore {displayTitle}</h2>
                <p className="text-sm text-muted hidden sm:block">Choose how you want to explore the collection</p>
              </div>

              <div className="bg-card border border-theme rounded-lg p-1 shadow-soft mx-auto sm:mx-0">
                <button
                  onClick={() => setViewMode('structure')}
                  className={clsx(
                    'px-4 sm:px-4 py-2 rounded text-xs sm:text-sm font-medium transition-all active:scale-95',
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
                    'px-5 sm:px-4 py-2 rounded text-xs sm:text-sm font-medium transition-all active:scale-95',
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
                    'px-4 sm:px-3 py-2 rounded text-xs font-medium transition-all active:scale-95',
                    viewMode === 'explorer'
                      ? 'bg-accent-primary text-white shadow-soft'
                      : 'text-secondary hover:text-primary hover:bg-hover-color'
                  )}
                >
                  Random
                </button>
              </div>
            </div>

            <Suspense fallback={
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-primary"></div>
              </div>
            }>
              {viewMode === 'structure' ? (
                <GenericVolumeStructure
                  bookId={bookInfo.bookId}
                  bookName={bookInfo.englishName}
                  volumes={bookConfig?.volumes ?? [bookInfo.bookId]}
                  baseRoute={`/${urlSlug}`}
                />
              ) : viewMode === 'chapters' ? (
                <GenericBookBrowser bookId={bookId} bookConfig={bookConfig} />
              ) : (
                <GenericVolumeExplorer bookConfig={bookConfig || { bookId: bookInfo.bookId, englishName: bookInfo.englishName, volumes: [bookInfo.bookId], hasMultipleVolumes: false }} />
              )}
            </Suspense>
          </>
        )}
      </section>
    </main>
  )
}