'use client'

import { useState, useEffect, useMemo, lazy, Suspense } from 'react'
import { alKafiApi, thaqalaynApi, Hadith, BookInfo } from '@/lib/api'
import SearchInterface from '@/components/SearchInterface'
import { useNavigation } from '@/lib/navigation-context'
import { debounce } from '@/lib/performance'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Search, Loader2 } from 'lucide-react'

const AlKafiVolumeExplorer = lazy(() => import('@/components/AlKafiVolumeExplorer'))
const BookStructureExplorer = lazy(() => import('@/components/AlKafiVolumeStructure'))
const AlKafiBookBrowser = lazy(() => import('@/components/AlKafiBookBrowser'))

export default function AlKafiPage() {
  const navigation = useNavigation()

  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Hadith[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [bookInfo, setBookInfo] = useState<BookInfo | null>(null)
  const [viewMode, setViewMode] = useState<'structure' | 'chapters' | 'explorer'>('structure')

  useEffect(() => {
    thaqalaynApi
      .getAllBooks()
      .then((all) => {
        const info = all.find((b) => b.bookId === 'Al-Kafi-Volume-1-Kulayni')
        setBookInfo(info || null)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    const saved = navigation.restoreScrollPosition()
    if (saved > 0) requestAnimationFrame(() => window.scrollTo(0, saved))
    navigation.savePath('/al-kafi')
    const s = navigation.getSearchState()
    if (s) {
      setSearchQuery(s.query)
      setSearchResults(s.results)
    }
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
          const response = await alKafiApi.searchAlKafi(query)
          setSearchResults(response.results)
          navigation.saveSearchState({
            query,
            results: response.results,
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
            placeholder="Search across all Al-Kāfi volumes…"
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
            {bookInfo?.bookCover && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={bookInfo.bookCover}
                alt="Al-Kāfi"
                className="hidden w-32 shrink-0 rounded object-cover md:block"
              />
            )}
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
                Al-Kāfi <span className="font-arabic text-foreground-muted">(الكافي)</span>
              </h1>
              <p className="mt-1 text-sm text-foreground-muted">
                By Shaykh Muḥammad b. Yaʿqūb al-Kulaynī
              </p>
              <p className="mt-3 text-sm leading-relaxed text-foreground-muted">
                One of the most significant collections of Shīʿī Ḥadīth, compiled over twenty years.
                Eight volumes covering principles of belief, jurisprudence, and miscellaneous
                teachings.
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <Badge variant="secondary">8 Volumes</Badge>
                <Badge variant="secondary">Four Major Books</Badge>
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
        onSearch={debouncedSearch}
        onClearSearch={handleClearSearch}
        searchContext="al-kafi"
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
