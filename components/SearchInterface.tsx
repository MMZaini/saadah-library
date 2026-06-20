'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { Hadith } from '@/lib/api'
import HadithCard from './HadithCard'
import { isArabicQuery, matchesSearchMode, type SearchMode } from '@/lib/search-utils'
import { cn } from '@/lib/utils'
import { SEARCHABLE_BOOKS, searchContextHasGradings } from '@/lib/books-config'
import type { ServerSearchFilterCriteria } from '@/lib/use-server-search'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Search,
  SlidersHorizontal,
  X,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Info,
  Loader2,
} from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

interface SearchInterfaceProps {
  searchQuery: string
  searchResults: Hadith[]
  isSearching: boolean
  onSearch: (query: string) => void
  onClearSearch: () => void
  searchContext?: string
  searchError?: string | null
  highlightQuery?: string
  onBookScopeChange?: (volumeIds: string[]) => void
  filtersOpen?: boolean
  onFiltersOpenChange?: (open: boolean) => void
  onFilterCriteriaChange?: (criteria: ServerSearchFilterCriteria) => void
}

const RESULTS_PER_PAGE = 10

const GRADING_OPTIONS = [
  { value: 'all', label: 'All Gradings' },
  { value: 'sahih', label: 'Sahih (صحيح)', keywords: ['صحيح', 'sahih', 'authentic'] },
  { value: 'hasan', label: 'Hasan (حسن)', keywords: ['حسن', 'hasan', 'good'] },
  {
    value: 'muwathaq',
    label: 'Muwathaq (موثق)',
    keywords: ['موثق', 'muwathaq', 'reliable'],
  },
  { value: 'qawi', label: 'Qawi (قوي)', keywords: ['قوي', 'qawi', 'strong'] },
  { value: 'daif', label: 'Daif (ضعيف)', keywords: ['ضعيف', 'daif', 'weak'] },
  { value: 'majhul', label: 'Majhul (مجهول)', keywords: ['مجهول', 'majhul', 'unknown'] },
  { value: 'mursal', label: 'Mursal (مرسل)', keywords: ['مرسل', 'mursal'] },
  {
    value: 'lam-yukhrijhu',
    label: 'Not Included (لم يخرجه)',
    keywords: ['لم يخرجه'],
  },
  {
    value: 'other',
    label: 'Other Gradings',
    keywords: ['مقطوع', 'مدلس', 'غريب', 'عزيز', 'مشهور', 'متواتر', 'آحاد'],
  },
]

const SEARCH_MODES = [
  {
    key: 'exactWords' as const,
    label: 'Exact Words',
    description: 'Every word must appear exactly as typed, but in any order.',
  },
  {
    key: 'flexibleMatching' as const,
    label: 'Flexible',
    description: 'Stems words and expands Islamic terms (e.g. "prayer" also finds "salah").',
  },
]

export default function SearchInterface({
  searchQuery,
  searchResults,
  isSearching,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onSearch,
  onClearSearch,
  searchContext = 'all-books',
  searchError = null,
  highlightQuery,
  onBookScopeChange,
  filtersOpen,
  onFiltersOpenChange,
  onFilterCriteriaChange,
}: SearchInterfaceProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedGradings, setSelectedGradings] = useState<string[]>(['all'])
  const [selectedBooks, setSelectedBooks] = useState<string[]>([])
  const [internalShowFilters, setInternalShowFilters] = useState(false)
  const [activeModes, setActiveModes] = useState<Set<SearchMode>>(new Set())
  const showFilters = filtersOpen ?? internalShowFilters
  const setShowFilters = onFiltersOpenChange ?? setInternalShowFilters

  // Book scope pre-filter (global search only)
  const [scopeBooks, setScopeBooks] = useState<string[]>([])
  const [scopeVolumes, setScopeVolumes] = useState<Record<string, number[]>>({})
  const showBookScope = searchContext === 'all-books' || !searchContext

  // Only offer the grading filter where graded hadith actually exist: global
  // search and Al-Kāfi always, other books only if they carry gradings.
  const showGradingFilter = searchContextHasGradings(searchContext)

  // Compute API book IDs from scope selection
  const scopeBookIds = useMemo(() => {
    if (scopeBooks.length === 0) return []
    const ids: string[] = []
    for (const bookKey of scopeBooks) {
      const book = SEARCHABLE_BOOKS.find((b) => b.key === bookKey)
      if (!book) continue
      if (book.volumeCount <= 1) {
        ids.push(...book.volumeIds)
      } else {
        const vols = scopeVolumes[bookKey]
        if (vols && vols.length > 0) {
          for (const v of vols) {
            if (v >= 1 && v <= book.volumeCount) ids.push(book.volumeIds[v - 1])
          }
        } else {
          ids.push(...book.volumeIds)
        }
      }
    }
    return ids
  }, [scopeBooks, scopeVolumes])

  // Notify parent when scope changes
  const scopeKey = scopeBookIds.join(',')
  useEffect(() => {
    onBookScopeChange?.(scopeBookIds)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scopeKey])

  const activeServerGradings = selectedGradings.filter((g) => g !== 'all')
  const hasGlobalBookScope = showBookScope && scopeBooks.length > 0
  const activeSearchModes = useMemo(
    () => SEARCH_MODES.filter((mode) => activeModes.has(mode.key)).map((mode) => mode.key),
    [activeModes],
  )

  useEffect(() => {
    onFilterCriteriaChange?.({
      gradings: activeServerGradings,
      hasBookScope: hasGlobalBookScope,
      searchModes: activeSearchModes,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeServerGradings.join(','), hasGlobalBookScope, activeSearchModes.join(',')])

  const toggleScopeBook = (bookKey: string) => {
    const book = SEARCHABLE_BOOKS.find((b) => b.key === bookKey)
    if (!book) return
    setScopeBooks((prev) => {
      if (prev.includes(bookKey)) {
        setScopeVolumes((v) => {
          const next = { ...v }
          delete next[bookKey]
          return next
        })
        return prev.filter((k) => k !== bookKey)
      } else {
        if (book.volumeCount > 1) {
          setScopeVolumes((v) => ({
            ...v,
            [bookKey]: Array.from({ length: book.volumeCount }, (_, i) => i + 1),
          }))
        }
        return [...prev, bookKey]
      }
    })
  }

  const toggleScopeVolume = (bookKey: string, volNum: number) => {
    setScopeVolumes((prev) => {
      const current = prev[bookKey] || []
      const next = current.includes(volNum)
        ? current.filter((v) => v !== volNum)
        : [...current, volNum].sort((a, b) => a - b)
      if (next.length === 0) {
        setScopeBooks((sb) => sb.filter((k) => k !== bookKey))
        const rest = { ...prev }
        delete rest[bookKey]
        return rest
      }
      return { ...prev, [bookKey]: next }
    })
  }

  const shouldShowFilters = true

  // Derive unique books/volumes from results for filter chips.
  // When all results share the same display name (e.g. all Al-Kāfi volumes),
  // present them as selectable volumes instead of duplicate book names.
  const { availableBooks, isVolumeMode } = useMemo(() => {
    const bookMap = new Map<string, { name: string; volume?: number }>() // bookId -> info
    searchResults.forEach((h) => {
      if (h.bookId && h.book && !bookMap.has(h.bookId)) {
        bookMap.set(h.bookId, { name: h.book, volume: h.volume })
      }
    })

    const entries = Array.from(bookMap.entries()).map(([id, info]) => ({
      id,
      name: info.name,
      volume: info.volume,
    }))

    // Detect if all entries share the same display name (multi-volume same book)
    const uniqueNames = new Set(entries.map((e) => e.name))
    const isVolumeMode = uniqueNames.size === 1 && entries.length > 1

    if (isVolumeMode) {
      // Sort by volume number and label as "Vol. N"
      const sorted = entries
        .sort((a, b) => (a.volume || 0) - (b.volume || 0))
        .map((e) => ({
          id: e.id,
          name: e.volume ? `Vol. ${e.volume}` : e.name,
        }))
      return { availableBooks: sorted, isVolumeMode: true }
    }

    // Normal book mode — sort alphabetically
    const sorted = entries
      .map(({ id, name }) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name))
    return { availableBooks: sorted, isVolumeMode: false }
  }, [searchResults])

  const hasActiveFilters = () => {
    const hasGrading = !selectedGradings.includes('all') && selectedGradings.length > 0
    const hasSearchMode = searchQuery.trim() ? activeModes.size > 0 : false
    const hasBookScope = showBookScope && scopeBooks.length > 0
    const hasBookPost = !showBookScope && selectedBooks.length > 0
    return hasGrading || hasSearchMode || hasBookScope || hasBookPost
  }

  const handleGradingChange = (value: string, checked: boolean) => {
    if (value === 'all') {
      setSelectedGradings(['all'])
    } else {
      setSelectedGradings((prev) => {
        const without = prev.filter((g) => g !== 'all')
        const updated = checked ? [...without, value] : without.filter((g) => g !== value)
        return updated.length === 0 ? ['all'] : updated
      })
    }
  }

  const clearAllFilters = useCallback(() => {
    setSelectedGradings(['all'])
    setSelectedBooks([])
    setActiveModes(new Set())
    if (showBookScope) {
      setScopeBooks([])
      setScopeVolumes({})
    }
  }, [showBookScope])

  useEffect(() => {
    if (!searchQuery.trim() && !showFilters) clearAllFilters()
  }, [searchQuery, showFilters, clearAllFilters])

  // The [bookSlug] page reuses this component instance across books, so a
  // grading selection can survive navigation to a book without grading data.
  // Drop it when the filter isn't offered so a hidden filter can't narrow
  // results silently.
  useEffect(() => {
    if (!showGradingFilter) {
      setSelectedGradings((prev) => (prev.length === 1 && prev[0] === 'all' ? prev : ['all']))
    }
  }, [showGradingFilter])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, selectedGradings, selectedBooks, activeModes, scopeBooks, scopeVolumes])

  // ── Filter + sort logic ──
  const filteredResults = useMemo(() => {
    let filtered = [...searchResults]

    // Apply search mode filtering (default exact phrase; selected modes are ORed).
    if (searchQuery.trim()) {
      const modes = activeModes.size > 0 ? activeSearchModes : (['exactPhrase'] as SearchMode[])
      filtered = searchResults.filter((hadith) => {
        return modes.some((mode) =>
          matchesSearchMode({
            query: searchQuery,
            mode,
            englishText: hadith.englishText || hadith.thaqalaynMatn,
            arabicText: hadith.arabicText,
          }),
        )
      })
    }

    // Apply book post-filter (non-global search only; global uses API-level scoping)
    if (!showBookScope && selectedBooks.length > 0) {
      const bookSet = new Set(selectedBooks)
      filtered = filtered.filter((h) => bookSet.has(h.bookId))
    }

    // Apply grading filters
    if (shouldShowFilters && showGradingFilter && !selectedGradings.includes('all')) {
      filtered = filtered.filter((hadith) => {
        const gradingText = [
          hadith.majlisiGrading,
          hadith.mohseniGrading,
          hadith.behbudiGrading,
          ...(hadith.gradingsFull || []).map((g) => `${g.grade_en} ${g.grade_ar}`),
        ]
          .join(' ')
          .toLowerCase()

        return selectedGradings.some((sel) => {
          const opt = GRADING_OPTIONS.find((o) => o.value === sel)
          if (!opt) return false
          if (sel === 'lam-yukhrijhu') {
            const none =
              !hadith.majlisiGrading &&
              !hadith.mohseniGrading &&
              !hadith.behbudiGrading &&
              (!hadith.gradingsFull || hadith.gradingsFull.length === 0)
            return none || gradingText.includes('لم يخرجه')
          }
          if (sel === 'other') {
            const common = ['صحيح', 'حسن', 'موثق', 'قوي', 'ضعيف', 'مجهول', 'مرسل', 'لم يخرجه']
            return (
              gradingText.trim().length > 0 &&
              !common.some((c) => gradingText.includes(c.toLowerCase()))
            )
          }
          return opt.keywords?.some((k) => gradingText.includes(k.toLowerCase())) || false
        })
      })
    }

    filtered.sort((a, b) => (a.volume || 0) - (b.volume || 0) || (a.id || 0) - (b.id || 0))
    return filtered
  }, [
    searchResults,
    selectedGradings,
    selectedBooks,
    activeModes,
    activeSearchModes,
    searchQuery,
    shouldShowFilters,
    showGradingFilter,
    showBookScope,
  ])

  const isArabicSearch = useMemo(() => isArabicQuery(searchQuery), [searchQuery])
  const showArabicDefault = useMemo(
    () => (hadith: Hadith) => (isArabicSearch && Boolean(hadith.arabicText) ? true : undefined),
    [isArabicSearch],
  )

  // Pagination
  const totalPages = Math.ceil(filteredResults.length / RESULTS_PER_PAGE)
  const start = (currentPage - 1) * RESULTS_PER_PAGE
  const pageResults = filteredResults.slice(start, start + RESULTS_PER_PAGE)

  const goToPage = (page: number) => {
    setCurrentPage(page)
    document.getElementById('search-results')?.scrollIntoView({ behavior: 'smooth' })
  }

  const trimmedSearchQuery = searchQuery.trim()
  const isFilterOnly = !trimmedSearchQuery

  // Which filter panel sections are actually rendered for this context. Used to
  // show a fallback message when nothing is filterable (e.g. filter-only mode on
  // a single-volume book without grading data).
  const showBookPostFilter = !showBookScope && availableBooks.length > 1
  const showSearchModeSection = !isFilterOnly
  const hasAnyFilterSection =
    showBookScope || showBookPostFilter || showSearchModeSection || showGradingFilter

  if (!trimmedSearchQuery && !showFilters) return null

  const contextLabel =
    searchContext === 'al-kafi'
      ? ' in Al-Kāfi'
      : searchContext === 'uyun-akhbar-al-rida'
        ? ' in ʿUyūn akhbār al-Riḍā'
        : ''

  return (
    <section
      id="search-results"
      className="hadith-reading-container mx-auto mt-6 max-w-5xl px-4 sm:px-6"
    >
      {/* ── Header ── */}
      <div className="mb-5 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-lg font-semibold text-foreground sm:text-xl">
            {isFilterOnly ? (
              <>Filter hadith{contextLabel}</>
            ) : (
              <>
                Results{contextLabel} for &ldquo;{searchQuery}&rdquo;
              </>
            )}
          </h2>
          <p className="mt-1 text-sm text-foreground-muted">
            {isSearching ? (
              <span className="flex items-center gap-1.5">
                <Loader2 className="h-3 w-3 animate-spin text-accent" />
                {isFilterOnly ? 'Loading hadith…' : 'Searching…'}
              </span>
            ) : isFilterOnly && !hasActiveFilters() ? (
              'Choose filters to find hadith without a search term.'
            ) : (
              <>
                <span className="font-medium text-accent">{filteredResults.length}</span>{' '}
                {filteredResults.length === 1 ? 'hadith' : 'hadiths'} found
                {filteredResults.length !== searchResults.length && shouldShowFilters && (
                  <span className="text-foreground-faint">
                    {' '}
                    (filtered from {searchResults.length})
                  </span>
                )}
              </>
            )}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onClearSearch}
          aria-label={isFilterOnly ? 'Back to browsing' : 'Clear search'}
          title={isFilterOnly ? 'Back to browsing' : 'Clear search'}
          className="shrink-0 gap-1.5"
        >
          <X className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{isFilterOnly ? 'Back' : 'Clear'}</span>
        </Button>
      </div>

      {/* ── Error banner ── */}
      {searchError && (
        <div className="border-destructive/30 bg-destructive/5 mb-4 flex items-center gap-2 rounded-lg border px-3.5 py-2.5">
          <AlertCircle className="h-4 w-4 shrink-0 text-destructive" />
          <p className="text-sm text-destructive">{searchError}</p>
        </div>
      )}

      {/* ── Filter toggle ── */}
      {shouldShowFilters && (
        <div className="mb-4 flex items-center gap-2">
          <Button
            variant={showFilters ? 'default' : 'outline'}
            size="sm"
            className="gap-1.5"
            onClick={() => setShowFilters(!showFilters)}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filters
            {hasActiveFilters() && (
              <Badge variant="secondary" className="ml-1 h-4 min-w-[16px] px-1 text-[10px]">
                {selectedGradings.filter((g) => g !== 'all').length +
                  (searchQuery.trim() ? activeModes.size : 0) +
                  (showBookScope ? scopeBooks.length : selectedBooks.length)}
              </Badge>
            )}
          </Button>
          {hasActiveFilters() && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-foreground-muted"
              onClick={clearAllFilters}
            >
              Clear all
            </Button>
          )}
        </div>
      )}

      {/* ── Filter panel ── */}
      {showFilters && shouldShowFilters && (
        <div className="mb-5 rounded-lg border border-border bg-surface-1 p-4 sm:p-5">
          {/* Book scope selector (global search) */}
          {showBookScope && (
            <>
              <div>
                <h3 className="mb-2 text-sm font-medium text-foreground">Search In</h3>
                <p className="mb-3 text-[11px] leading-snug text-foreground-faint">
                  {scopeBooks.length === 0
                    ? 'All books. Select to narrow your search.'
                    : `${scopeBooks.length} book${scopeBooks.length === 1 ? '' : 's'} selected`}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {SEARCHABLE_BOOKS.map((book) => {
                    const isActive = scopeBooks.includes(book.key)
                    return (
                      <button
                        key={book.key}
                        onClick={() => toggleScopeBook(book.key)}
                        className={cn(
                          'rounded-md border px-2.5 py-1 text-xs font-medium transition-colors',
                          isActive
                            ? 'bg-accent/10 border-accent text-accent'
                            : 'border-border text-foreground-muted hover:bg-surface-2',
                        )}
                      >
                        {book.displayName}
                      </button>
                    )
                  })}
                </div>
                {/* Volume sub-filters for selected multi-volume books */}
                {scopeBooks
                  .filter((key) => {
                    const book = SEARCHABLE_BOOKS.find((b) => b.key === key)
                    return book && book.volumeCount > 1
                  })
                  .map((bookKey) => {
                    const book = SEARCHABLE_BOOKS.find((b) => b.key === bookKey)!
                    const selectedVols = scopeVolumes[bookKey] || []
                    return (
                      <div key={bookKey} className="mt-2.5 flex flex-wrap items-center gap-1.5">
                        <span className="mr-0.5 text-[11px] text-foreground-faint">
                          {book.displayName}:
                        </span>
                        {Array.from({ length: book.volumeCount }, (_, i) => i + 1).map((volNum) => {
                          const isVolumeActive = selectedVols.includes(volNum)
                          return (
                            <button
                              key={volNum}
                              onClick={() => toggleScopeVolume(bookKey, volNum)}
                              className={cn(
                                'rounded border px-1.5 py-0.5 text-[11px] font-medium transition-colors',
                                isVolumeActive
                                  ? 'bg-accent/10 border-accent text-accent'
                                  : 'border-border text-foreground-muted hover:bg-surface-2',
                              )}
                            >
                              Vol. {volNum}
                            </button>
                          )
                        })}
                      </div>
                    )
                  })}
              </div>
              <Separator className="my-4" />
            </>
          )}

          {/* Book / Volume post-filter (non-global search, derived from results) */}
          {showBookPostFilter && (
            <>
              <h3 className="mb-3 text-sm font-medium text-foreground">
                {isVolumeMode ? 'Volume' : 'Book'}
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {availableBooks.map((b) => {
                  const active = selectedBooks.includes(b.id)
                  return (
                    <button
                      key={b.id}
                      onClick={() =>
                        setSelectedBooks((prev) =>
                          active ? prev.filter((id) => id !== b.id) : [...prev, b.id],
                        )
                      }
                      className={cn(
                        'rounded-md border px-2.5 py-1 text-xs font-medium transition-colors',
                        active
                          ? 'bg-accent/10 border-accent text-accent'
                          : 'border-border text-foreground-muted hover:bg-surface-2',
                      )}
                    >
                      {b.name}
                    </button>
                  )
                })}
              </div>
              <Separator className="my-4" />
            </>
          )}

          {!isFilterOnly && (
            <>
              {/* Search mode */}
              <div>
                <h3 className="mb-3 text-sm font-medium text-foreground">Search Mode</h3>
                <p className="mb-3 text-xs leading-snug text-foreground-faint">
                  Default is exact phrase. Select a mode below to broaden the search.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {SEARCH_MODES.map((mode) => {
                    const isActive = activeModes.has(mode.key)
                    return (
                      <button
                        key={mode.key}
                        onClick={() =>
                          setActiveModes((prev) => {
                            const next = new Set(prev)
                            if (next.has(mode.key)) next.delete(mode.key)
                            else next.add(mode.key)
                            return next
                          })
                        }
                        className={cn(
                          'group rounded-lg border px-3 py-2.5 text-left transition-all',
                          isActive
                            ? 'bg-accent/5 ring-accent/20 border-accent ring-1'
                            : 'border-border hover:border-foreground-faint hover:bg-surface-2',
                        )}
                      >
                        <span
                          className={cn(
                            'block text-xs font-semibold',
                            isActive ? 'text-accent' : 'text-foreground',
                          )}
                        >
                          {mode.label}
                        </span>
                        <span className="mt-0.5 block text-[11px] leading-snug text-foreground-muted">
                          {mode.description}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {showGradingFilter && <Separator className="my-4" />}
            </>
          )}

          {/* Gradings — only books with grading data offer this filter */}
          {showGradingFilter && (
            <div>
              <h3 className="mb-3 flex items-center gap-1.5 text-sm font-medium text-foreground">
                Grading Classification
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3.5 w-3.5 cursor-help text-foreground-faint" />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[220px] text-center">
                    Filter by hadith authenticity grading (e.g. Ṣaḥīḥ, Ḍaʿīf). Grading coverage
                    varies by book.
                  </TooltipContent>
                </Tooltip>
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {GRADING_OPTIONS.map((opt) => {
                  const active = selectedGradings.includes(opt.value)
                  return (
                    <button
                      key={opt.value}
                      onClick={() => {
                        if (opt.value === 'all') clearAllFilters()
                        else handleGradingChange(opt.value, !active)
                      }}
                      className={cn(
                        'rounded-md border px-2.5 py-1 text-xs font-medium transition-colors',
                        active
                          ? 'bg-accent/10 border-accent text-accent'
                          : 'border-border text-foreground-muted hover:bg-surface-2',
                      )}
                    >
                      {opt.label}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Nothing to filter (e.g. filter-only mode on a book without gradings) */}
          {!hasAnyFilterSection && (
            <p className="text-sm text-foreground-muted">
              No filters available for this book. Start a search to filter the results.
            </p>
          )}

          {/* Active filter tags */}
          {hasActiveFilters() && (
            <>
              <Separator className="my-4" />
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="mr-1 text-xs text-foreground-faint">Active:</span>
                {selectedGradings
                  .filter((g) => g !== 'all')
                  .map((g) => {
                    const opt = GRADING_OPTIONS.find((o) => o.value === g)
                    return opt ? (
                      <Badge key={g} variant="outline" className="gap-1 pr-1">
                        {opt.label}
                        <button
                          onClick={() => handleGradingChange(g, false)}
                          className="rounded-full p-0.5 hover:bg-surface-2"
                        >
                          <X className="h-2.5 w-2.5" />
                        </button>
                      </Badge>
                    ) : null
                  })}
                {showBookScope
                  ? scopeBooks.map((bookKey) => {
                      const book = SEARCHABLE_BOOKS.find((b) => b.key === bookKey)
                      if (!book) return null
                      const vols = scopeVolumes[bookKey]
                      const volLabel =
                        book.volumeCount > 1 && vols && vols.length < book.volumeCount
                          ? ` (${vols.length}/${book.volumeCount} vols)`
                          : ''
                      return (
                        <Badge key={bookKey} variant="outline" className="gap-1 pr-1">
                          {book.displayName}
                          {volLabel}
                          <button
                            onClick={() => toggleScopeBook(bookKey)}
                            className="rounded-full p-0.5 hover:bg-surface-2"
                          >
                            <X className="h-2.5 w-2.5" />
                          </button>
                        </Badge>
                      )
                    })
                  : selectedBooks.map((bid) => {
                      const b = availableBooks.find((ab) => ab.id === bid)
                      return b ? (
                        <Badge key={bid} variant="outline" className="gap-1 pr-1">
                          {b.name}
                          <button
                            onClick={() =>
                              setSelectedBooks((prev) => prev.filter((id) => id !== bid))
                            }
                            className="rounded-full p-0.5 hover:bg-surface-2"
                          >
                            <X className="h-2.5 w-2.5" />
                          </button>
                        </Badge>
                      ) : null
                    })}
                {(searchQuery.trim() ? Array.from(activeModes) : []).map((modeKey) => {
                  const mode = SEARCH_MODES.find((m) => m.key === modeKey)
                  return mode ? (
                    <Badge key={modeKey} variant="outline" className="gap-1 pr-1">
                      {mode.label}
                      <button
                        onClick={() =>
                          setActiveModes((prev) => {
                            const next = new Set(prev)
                            next.delete(modeKey)
                            return next
                          })
                        }
                        className="rounded-full p-0.5 hover:bg-surface-2"
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </Badge>
                  ) : null
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Results list ── */}
      <div className="space-y-4">
        {isSearching && pageResults.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-7 w-7 animate-spin text-foreground-faint" />
          </div>
        ) : pageResults.length > 0 ? (
          pageResults.map((hadith, idx) => (
            <HadithCard
              key={hadith._id ?? `${hadith.bookId ?? 'book'}-${hadith.id ?? idx}`}
              hadith={hadith}
              showViewChapter
              showArabicByDefault={showArabicDefault(hadith)}
              highlightQuery={highlightQuery || searchQuery}
              exactMatch={activeModes.size === 0 || activeModes.has('exactWords')}
            />
          ))
        ) : (
          <div className="py-16 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-border bg-surface-1">
              <Search className="h-5 w-5 text-foreground-faint" />
            </div>
            <h3 className="text-base font-medium text-foreground">
              {isFilterOnly && !hasActiveFilters()
                ? 'Choose filters'
                : searchResults.length === 0
                  ? isFilterOnly
                    ? 'No Hadith Match Filters'
                    : 'No Results Found'
                  : 'No Results Match Filters'}
            </h3>
            <p className="mt-1 text-sm text-foreground-muted">
              {isFilterOnly && !hasActiveFilters()
                ? 'Select a grading or narrow the search scope to start.'
                : searchResults.length === 0
                  ? isFilterOnly
                    ? 'Try adjusting your filters'
                    : `No hadith found for "${searchQuery}"${contextLabel}`
                  : 'Try adjusting your filters'}
            </p>
            {hasActiveFilters() && (
              <Button variant="outline" size="sm" className="mt-3" onClick={clearAllFilters}>
                Clear all filters
              </Button>
            )}
          </div>
        )}
      </div>

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="mb-8 mt-8 flex flex-col items-center gap-3">
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => goToPage(currentPage - 1)}
              className="gap-1"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Previous</span>
            </Button>

            <div className="flex items-center gap-1 px-1">
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                let p: number
                if (totalPages <= 7) p = i + 1
                else if (currentPage <= 4) p = i + 1
                else if (currentPage >= totalPages - 3) p = totalPages - 6 + i
                else p = currentPage - 3 + i

                return (
                  <Button
                    key={p}
                    variant={currentPage === p ? 'default' : 'ghost'}
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => goToPage(p)}
                  >
                    {p}
                  </Button>
                )
              })}
            </div>

            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => goToPage(currentPage + 1)}
              className="gap-1"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>

          <p className="text-xs text-foreground-faint">
            {start + 1}–{Math.min(start + RESULTS_PER_PAGE, filteredResults.length)} of{' '}
            {filteredResults.length}
          </p>
        </div>
      )}
    </section>
  )
}
