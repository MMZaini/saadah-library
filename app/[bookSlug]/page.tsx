'use client'

import { useState, useEffect, useMemo, lazy, Suspense } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { thaqalaynApi, Hadith, BookInfo } from '@/lib/api'
import { getBookConfig, getBookIdFromUrlSlug } from '@/lib/books-config'
import { books } from '@/lib/books'
import SearchInterface from '@/components/SearchInterface'
import { debounce } from '@/lib/performance'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Search, Loader2 } from 'lucide-react'

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
  const urlSlug = params?.bookSlug as string
  const bookId = getBookIdFromUrlSlug(urlSlug)

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
        } catch {
          setSearchResults([])
        } finally {
          setIsSearching(false)
        }
      }, 300),
    [bookId],
  )

  const handleSearchInput = (value: string) => {
    setSearchQuery(value)
    if (!value.trim()) {
      setSearchResults([])
      return
    }
    debouncedSearch(value)
  }

  const handleClearSearch = () => {
    setSearchQuery('')
    setSearchResults([])
  }

  useEffect(() => {
    const loadBookData = async () => {
      if (!bookId) return
      setState((prev) => ({ ...prev, loading: true, error: null }))

      try {
        const allBooks = await thaqalaynApi.getAllBooks()
        let bookInfo = allBooks.find((book) => book.bookId === bookId)

        if (!bookInfo) {
          const config = getBookConfig(bookId)
          if (config) {
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

        setState((prev) => ({ ...prev, bookInfo, loading: false }))
      } catch {
        setState((prev) => ({ ...prev, error: 'Failed to load book data', loading: false }))
      }
    }

    loadBookData()
  }, [bookId])

  if (state.loading) {
    return (
      <main className="min-h-screen">
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-foreground-muted" />
        </div>
      </main>
    )
  }

  if (state.error || !state.bookInfo) {
    return (
      <main className="min-h-screen">
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-center">
            <p className="mb-4 text-destructive">{state.error || 'Book not found'}</p>
            <Button variant="outline" onClick={() => router.push('/')}>
              Go back to library
            </Button>
          </div>
        </div>
      </main>
    )
  }

  const { bookInfo } = state
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

  const VIEW_MODES = [
    { key: 'structure' as const, label: 'Volume Explorer', short: 'Explorer' },
    { key: 'chapters' as const, label: 'Chapter Tree', short: 'Tree' },
    { key: 'explorer' as const, label: 'Random', short: 'Random' },
  ]

  return (
    <main className="min-h-screen">
      {/* Search bar */}
      <div className="mx-auto max-w-2xl px-4 pt-6 sm:px-6">
        <div className="flex items-center gap-3 rounded-lg border border-border bg-surface-1 px-3.5 py-2.5">
          <Search className="h-4 w-4 shrink-0 text-foreground-faint" />
          <input
            placeholder={`Search across all ${displayTitle} volumes…`}
            value={searchQuery}
            onChange={(e) => handleSearchInput(e.target.value)}
            className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-foreground-faint"
          />
          {isSearching && (
            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-foreground-muted" />
          )}
        </div>
      </div>

      {/* Book header */}
      <section className="mx-auto mt-6 max-w-5xl px-4 sm:px-6">
        <div className="rounded-lg border border-border bg-surface-1 p-5 sm:p-6">
          <div className="flex items-start gap-5">
            {coverSrc && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={coverSrc}
                alt={bookInfo?.englishName || displayTitle}
                className="hidden w-32 shrink-0 rounded object-cover md:block"
              />
            )}
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-bold text-foreground sm:text-3xl">{displayTitle}</h1>
              {bookInfo?.englishName && bookInfo.englishName !== displayTitle && (
                <p className="mt-1 text-sm text-foreground-muted">{bookInfo.englishName}</p>
              )}
              {bookInfo?.author && (
                <p className="mt-1 text-sm text-foreground-muted">{bookInfo.author}</p>
              )}
              {bookInfo?.bookDescription && (
                <p className="mt-3 text-sm leading-relaxed text-foreground-muted">
                  {bookInfo.bookDescription}
                </p>
              )}
              <div className="mt-3 flex flex-wrap gap-1.5">
                <Badge variant="secondary">
                  {bookConfig?.volumeCount ?? (bookConfig?.volumes?.length || 1)}{' '}
                  {(bookConfig?.volumeCount ?? 1) > 1 ? 'Volumes' : 'Volume'}
                </Badge>
                <Badge variant="secondary">{displayTitle}</Badge>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Search results */}
      <SearchInterface
        searchQuery={searchQuery}
        searchResults={searchResults}
        isSearching={isSearching}
        onSearch={handleSearchInput}
        onClearSearch={handleClearSearch}
        searchContext={bookId}
      />

      {/* Volume Explorer / Chapter Tree */}
      {!searchQuery && (
        <section className="mx-auto mt-6 max-w-5xl px-4 pb-12 sm:px-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Explore</h2>
            <div className="flex rounded-md border border-border bg-surface-1 p-0.5">
              {VIEW_MODES.map((mode) => (
                <button
                  key={mode.key}
                  onClick={() => setViewMode(mode.key)}
                  className={cn(
                    'rounded-[5px] px-3 py-1.5 text-xs font-medium transition-colors',
                    viewMode === mode.key
                      ? 'bg-accent text-accent-foreground'
                      : 'text-foreground-muted hover:text-foreground',
                  )}
                >
                  <span className="sm:hidden">{mode.short}</span>
                  <span className="hidden sm:inline">{mode.label}</span>
                </button>
              ))}
            </div>
          </div>

          <Suspense
            fallback={
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-foreground-muted" />
              </div>
            }
          >
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
        </section>
      )}
    </main>
  )
}
