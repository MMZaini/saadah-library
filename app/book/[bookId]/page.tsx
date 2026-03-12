'use client'

import { useState, useEffect, useMemo, lazy, Suspense } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { thaqalaynApi, Hadith, BookInfo } from '@/lib/api'
import { getBookConfig } from '@/lib/books-config'
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
  const bookId = params?.bookId as string

  const [state, setState] = useState<BookPageState>({
    bookInfo: null,
    hadiths: [],
    loading: true,
    error: null,
  })

  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Hadith[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [viewMode, setViewMode] = useState<'structure' | 'chapters' | 'explorer'>('structure')

  // Optional: implement scroll/save state if navigation-context is available

  // Create debounced search function
  const debouncedSearch = useMemo(
    () =>
      debounce(async (query: string) => {
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
    [bookId],
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

      setState((prev) => ({ ...prev, loading: true, error: null }))

      try {
        const allBooks = await thaqalaynApi.getAllBooks()
        let bookInfo = allBooks.find((book) => book.bookId === bookId)

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
            const localMatch = books.find((b) => {
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
              volume: config.volumeCount ?? config.volumes?.length ?? 1,
            } as BookInfo
          }
        }

        if (!bookInfo) {
          setState((prev) => ({ ...prev, error: 'Book not found', loading: false }))
          return
        }

        setState((prev) => ({
          ...prev,
          bookInfo,
          loading: false,
        }))
      } catch (error) {
        // Failed to load book data
        setState((prev) => ({
          ...prev,
          error: 'Failed to load book data',
          loading: false,
        }))
      }
    }

    loadBookData()
  }, [bookId])

  if (state.loading) {
    return (
      <main className="min-h-screen" data-theme={settings.theme}>
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="border-primary mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2"></div>
            <p className="text-muted">Loading book...</p>
          </div>
        </div>
      </main>
    )
  }

  if (state.error || !state.bookInfo) {
    return (
      <main className="min-h-screen" data-theme={settings.theme}>
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <p className="mb-4 text-red-500">{state.error || 'Book not found'}</p>
            <button
              onClick={() => router.push('/')}
              className="border-theme hover:bg-hover-color text-primary inline-flex items-center gap-2 rounded-lg border bg-card px-4 py-2 transition-all active:scale-95"
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

  const displayTitle =
    findTitleFromBooksList(bookId) ||
    getBookConfig(bookId)?.englishName ||
    bookInfo?.englishName ||
    bookInfo?.BookName ||
    bookId

  const coverSrc = bookInfo?.bookCover || findImageFromBooksList(bookId)

  return (
    <main className="min-h-screen" data-theme={settings.theme}>
      {/* Top bar */}
      <header
        style={{ background: 'var(--topbar-bg)' }}
        className="border-theme sticky top-0 z-40 border-b backdrop-blur-md"
      >
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-4">
          {/* Back button removed: search bar only */}

          {/* Search */}
          <div className="relative mx-auto max-w-[720px] flex-1">
            <div className="border-theme bg-input flex items-center gap-3 rounded-xl border px-4 py-2.5 shadow-soft">
              <IconSearch className="text-secondary h-5 w-5" />
              <input
                placeholder={`Search across all ${displayTitle} volumes...`}
                value={searchQuery}
                onChange={(e) => handleSearchInput(e.target.value)}
                className="text-primary w-full bg-transparent text-[15px] outline-none placeholder:text-muted focus:border-transparent focus:outline-none focus:ring-0"
              />
              {isSearching && (
                <div className="border-primary h-4 w-4 animate-spin rounded-full border-b-2"></div>
              )}
            </div>
          </div>

          {/* Right actions */}
          <div className="ml-auto flex items-center gap-3">
            <button
              onClick={toggleSettings}
              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg p-2 transition-colors hover:bg-black/10 focus-visible:outline-2 focus-visible:outline-amber-500/50 dark:hover:bg-white/10"
              title="Settings"
            >
              <IconMenu className="text-primary/80 hover:text-primary h-5 w-5 sm:h-6 sm:w-6" />
            </button>
          </div>
        </div>
      </header>

      {/* Book header (Uyun-style hero for visual parity) */}
      <section className="mx-auto mt-8 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-emerald-200/60 bg-gradient-to-r from-emerald-50/80 to-teal-50/80 p-8 shadow-soft backdrop-blur-sm dark:border-emerald-800/30 dark:from-emerald-900/20 dark:to-teal-900/20">
          <div className="flex items-start gap-6">
            {coverSrc ? (
              <img
                src={coverSrc}
                alt={bookInfo?.englishName || displayTitle}
                className="shadow-medium hidden w-48 shrink-0 select-none rounded-lg object-cover md:block"
              />
            ) : null}

            <div className="min-w-0 flex-1">
              <h1 className="mb-3 text-4xl font-bold text-emerald-900 dark:text-emerald-100">
                {displayTitle}
              </h1>

              <p className="mb-4 text-xl text-emerald-800 dark:text-emerald-200">
                {bookInfo?.englishName || bookConfig?.englishName || ''}
              </p>

              <p className="mb-4 font-medium text-emerald-700 dark:text-emerald-300">
                {bookInfo?.author}
              </p>

              <p className="mb-6 text-sm leading-relaxed text-emerald-700/90 dark:text-emerald-300/90">
                {bookInfo?.bookDescription}
              </p>

              <div className="flex flex-wrap gap-3 text-sm">
                <span className="rounded-full bg-emerald-200/80 px-3 py-1.5 font-medium text-emerald-900 shadow-soft dark:bg-emerald-800/80 dark:text-emerald-100">
                  {bookConfig?.volumeCount ?? (bookConfig?.volumes?.length || 1)}{' '}
                  {bookConfig?.volumeCount && bookConfig.volumeCount > 1 ? 'Volumes' : 'Volume'}
                </span>
                <span className="rounded-full bg-emerald-200/80 px-3 py-1.5 font-medium text-emerald-900 shadow-soft dark:bg-emerald-800/80 dark:text-emerald-100">
                  {displayTitle}
                </span>
                {((bookConfig && bookConfig.bookId === 'Man-La-Yahduruh-al-Faqih') ||
                  bookInfo?.bookId?.startsWith('Man-La-Yahduruh-al-Faqih')) && (
                  <span className="rounded-full bg-amber-200/80 px-3 py-1.5 font-medium text-amber-900 shadow-soft dark:bg-amber-800/80 dark:text-amber-100">
                    One of the Four Major Books
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Results */}
      <section className="mx-auto mt-8 max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
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
            <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div className="hidden sm:block">
                <h2 className="text-primary mb-2 text-xl font-bold sm:text-2xl">
                  Explore {displayTitle}
                </h2>
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

            <Suspense
              fallback={
                <div className="flex items-center justify-center py-12">
                  <div className="border-accent-primary h-8 w-8 animate-spin rounded-full border-b-2"></div>
                </div>
              }
            >
              {viewMode === 'structure' ? (
                <GenericVolumeStructure
                  bookId={bookInfo.bookId}
                  bookName={bookInfo.englishName}
                  volumes={bookConfig?.volumes ?? [bookInfo.bookId]}
                  baseRoute={`/book/${bookInfo.bookId}`}
                />
              ) : viewMode === 'chapters' ? (
                <GenericBookBrowser bookId={bookId} bookConfig={bookConfig} />
              ) : (
                <GenericVolumeExplorer
                  bookConfig={
                    bookConfig || {
                      bookId: bookInfo.bookId,
                      englishName: bookInfo.englishName,
                      volumes: [bookInfo.bookId],
                      hasMultipleVolumes: false,
                    }
                  }
                />
              )}
            </Suspense>
          </>
        )}
      </section>
    </main>
  )
}
