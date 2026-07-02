'use client'

import { useState, useEffect, useMemo, lazy, Suspense } from 'react'
import { alKafiApi, thaqalaynApi, BookInfo } from '@/lib/api'
import SearchInterface from '@/components/SearchInterface'
import { useNavigation } from '@/lib/navigation-context'
import { useServerSearch } from '@/lib/use-server-search'
import { cn } from '@/lib/utils'
import { withBasePath } from '@/lib/assets'
import { getPdfUrlForVolume } from '@/lib/book-pdfs'
import type { SelectedVolume } from '@/lib/volume-utils'
import { Badge } from '@/components/ui/badge'
import { Loader2 } from 'lucide-react'

const AlKafiVolumeExplorer = lazy(() => import('@/components/AlKafiVolumeExplorer'))
const BookStructureExplorer = lazy(() => import('@/components/AlKafiVolumeStructure'))
const AlKafiBookBrowser = lazy(() => import('@/components/AlKafiBookBrowser'))

export default function AlKafiPage() {
  const { restoreScrollPosition, saveScrollPosition } = useNavigation()

  const [bookInfo, setBookInfo] = useState<BookInfo | null>(null)
  const [viewMode, setViewMode] = useState<'structure' | 'chapters' | 'explorer'>('structure')
  const [selectedPdfVolume, setSelectedPdfVolume] = useState<SelectedVolume>(1)

  const alKafiBookParam = useMemo(() => alKafiApi.getAlKafiVolumes().join(','), [])

  const {
    query,
    results,
    totalMatches,
    truncated,
    error,
    isSearching,
    filtersOpen,
    setFiltersOpen,
    setFilterCriteria,
    clear,
  } = useServerSearch({
    placeholder: 'Search Al-Kāfi…',
    bookParam: alKafiBookParam,
    resetKey: '/al-kafi',
  })

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
    const saved = restoreScrollPosition()
    if (saved > 0) requestAnimationFrame(() => window.scrollTo(0, saved))
  }, [restoreScrollPosition])

  useEffect(() => {
    const path = window.location.pathname
    const save = () => saveScrollPosition(window.scrollY, path)
    window.addEventListener('beforeunload', save)
    return () => {
      window.removeEventListener('beforeunload', save)
      saveScrollPosition(window.scrollY, path)
    }
  }, [saveScrollPosition])

  // Labels describe what the reader sees: a chapter grid, a two-pane tree
  // browser, and a random-hadith picker.
  const VIEW_MODES = [
    { key: 'structure' as const, label: 'Chapters', short: 'Chapters' },
    { key: 'chapters' as const, label: 'Tree View', short: 'Tree' },
    { key: 'explorer' as const, label: 'Random Hadith', short: 'Random' },
  ]
  const selectedPdfUrl = getPdfUrlForVolume('Al-Kafi', selectedPdfVolume)

  return (
    <main className="min-h-screen">
      {/* Book header */}
      <section className="mx-auto mt-6 max-w-5xl px-4 sm:px-6">
        <div className="rounded-lg border border-border bg-surface-1 p-5 sm:p-6">
          <div className="flex items-start gap-5">
            {bookInfo?.bookCover &&
              (selectedPdfUrl ? (
                <a
                  href={selectedPdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Open selected Al-Kafi PDF"
                  className="hidden w-32 shrink-0 rounded md:block"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={withBasePath(bookInfo.bookCover)}
                    alt="Al-Kafi"
                    className="w-full rounded object-cover transition-opacity hover:opacity-90"
                  />
                </a>
              ) : (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={withBasePath(bookInfo.bookCover)}
                    alt="Al-Kāfi"
                    className="hidden w-32 shrink-0 rounded object-cover md:block"
                  />
                </>
              ))}
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
        searchQuery={query}
        searchResults={results}
        isSearching={isSearching}
        onSearch={() => {}}
        onClearSearch={clear}
        searchContext="al-kafi"
        searchError={error}
        filtersOpen={filtersOpen}
        onFiltersOpenChange={setFiltersOpen}
        onFilterCriteriaChange={setFilterCriteria}
        totalMatches={totalMatches}
        truncated={truncated}
      />

      {/* Volume Explorer / Chapter Tree */}
      {!query && !filtersOpen && (
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
              <BookStructureExplorer
                selectedVolume={selectedPdfVolume}
                onSelectedVolumeChange={setSelectedPdfVolume}
              />
            ) : viewMode === 'chapters' ? (
              <AlKafiBookBrowser
                selectedVolume={selectedPdfVolume}
                onSelectedVolumeChange={setSelectedPdfVolume}
              />
            ) : (
              <AlKafiVolumeExplorer
                selectedVolume={selectedPdfVolume}
                onSelectedVolumeChange={setSelectedPdfVolume}
              />
            )}
          </Suspense>
        </section>
      )}
    </main>
  )
}
