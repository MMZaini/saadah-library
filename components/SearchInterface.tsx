'use client'

import { useState, useMemo, useEffect } from 'react'
import { Hadith } from '@/lib/api'
import HadithCard from './HadithCard'
import {
  isArabicQuery,
  normalizeArabic,
  flexibleEnglishMatch,
  smartSearch,
  flexibleArabicWordMatch,
} from '@/lib/search-utils'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Search, SlidersHorizontal, X, ChevronLeft, ChevronRight } from 'lucide-react'

interface SearchInterfaceProps {
  searchQuery: string
  searchResults: Hadith[]
  isSearching: boolean
  onSearch: (query: string) => void
  onClearSearch: () => void
  searchContext?: string
}

const RESULTS_PER_PAGE = 10

const GRADING_OPTIONS = [
  { value: 'all', label: 'All Gradings' },
  { value: 'sahih', label: 'Sahih (صحيح)', keywords: ['صحيح'] },
  { value: 'hasan', label: 'Hasan (حسن)', keywords: ['حسن'] },
  { value: 'muwathaq', label: 'Muwathaq (موثق)', keywords: ['موثق'] },
  { value: 'qawi', label: 'Qawi (قوي)', keywords: ['قوي'] },
  { value: 'daif', label: 'Daif (ضعيف)', keywords: ['ضعيف'] },
  { value: 'majhul', label: 'Majhul (مجهول)', keywords: ['مجهول'] },
  { value: 'mursal', label: 'Mursal (مرسل)', keywords: ['مرسل'] },
  { value: 'lam-yukhrijhu', label: 'Not Included (لم يخرجه)', keywords: ['لم يخرجه'] },
  {
    value: 'other',
    label: 'Other Gradings',
    keywords: ['مقطوع', 'مدلس', 'غريب', 'عزيز', 'مشهور', 'متواتر', 'آحاد'],
  },
]

const SEARCH_MODES = [
  {
    key: 'smartSearch' as const,
    label: 'Smart Search',
    description: 'Automatically picks the best strategy. Includes Islamic term synonyms.',
    recommended: true,
  },
  {
    key: 'flexibleMatching' as const,
    label: 'Flexible Matching',
    description: 'Word variations + Islamic terminology synonyms.',
  },
  {
    key: 'exactWords' as const,
    label: 'Exact Words',
    description: 'Match whole words exactly.',
  },
  {
    key: 'exactPhrase' as const,
    label: 'Exact Phrase',
    description: 'Search for the exact phrase as written.',
  },
]

type SearchMode = 'exactPhrase' | 'exactWords' | 'flexibleMatching' | 'smartSearch'

export default function SearchInterface({
  searchQuery,
  searchResults,
  isSearching,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onSearch,
  onClearSearch,
  searchContext = 'all-books',
}: SearchInterfaceProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedGradings, setSelectedGradings] = useState<string[]>(['all'])
  const [showFilters, setShowFilters] = useState(false)
  const [activeMode, setActiveMode] = useState<SearchMode | null>(null)

  const shouldShowFilters = searchContext === 'all-books' || searchContext === 'al-kafi'

  const hasActiveFilters = () => {
    const hasGrading = !selectedGradings.includes('all') && selectedGradings.length > 0
    return hasGrading || activeMode !== null
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

  const clearAllFilters = () => {
    setSelectedGradings(['all'])
    setActiveMode(null)
  }

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, selectedGradings])

  // ── Filter + sort logic ──
  const filteredResults = useMemo(() => {
    let filtered = [...searchResults]

    // Apply search mode filtering
    if (activeMode && searchQuery.trim()) {
      filtered = searchResults.filter((hadith) => {
        const text = searchQuery.trim()
        const arabic = isArabicQuery(text)
        const get = (t: string | null | undefined) => (t || '').toLowerCase()
        const eng = get(hadith.englishText || hadith.thaqalaynMatn)
        const ar =
          arabic && hadith.arabicText ? normalizeArabic(hadith.arabicText) : get(hadith.arabicText)
        const all = `${eng} ${ar}`.trim()
        const q = arabic ? normalizeArabic(text) : text.toLowerCase()

        if (activeMode === 'exactPhrase') {
          return arabic ? ar.includes(q) : all.includes(q)
        }
        if (activeMode === 'exactWords') {
          const words = q.split(/\s+/).filter(Boolean)
          if (arabic) {
            const set = new Set(ar.split(/\s+/).filter(Boolean))
            return words.every((w) => set.has(w))
          }
          return words.every((w) => {
            const esc = w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
            return new RegExp('\\b' + esc + '\\b').test(all)
          })
        }
        if (activeMode === 'flexibleMatching') {
          const words = q.split(/\s+/).filter(Boolean)
          if (arabic) return words.every((w) => flexibleArabicWordMatch(ar, w))
          return flexibleEnglishMatch(all, words, {
            caseInsensitive: true,
            useSynonyms: true,
            useStemming: true,
          })
        }
        if (activeMode === 'smartSearch') {
          if (arabic) return ar.includes(q)
          return smartSearch(all, q, { caseInsensitive: true })
        }
        return false
      })
    }

    // Apply grading filters
    if (shouldShowFilters && !selectedGradings.includes('all')) {
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
  }, [searchResults, selectedGradings, activeMode, searchQuery, shouldShowFilters])

  const isArabicSearch = useMemo(() => isArabicQuery(searchQuery), [searchQuery])
  const showArabicDefault = useMemo(
    () => (hadith: Hadith) => isArabicSearch && Boolean(hadith.arabicText),
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

  if (!searchQuery) return null

  const contextLabel =
    searchContext === 'al-kafi'
      ? ' in Al-Kāfi'
      : searchContext === 'uyun-akhbar-al-rida'
        ? ' in ʿUyūn akhbār al-Riḍā'
        : ''

  return (
    <section id="search-results" className="mx-auto mt-6 max-w-5xl px-4 sm:px-6">
      {/* ── Header ── */}
      <div className="mb-5 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-lg font-semibold text-foreground sm:text-xl">
            Results{contextLabel} for &ldquo;{searchQuery}&rdquo;
          </h2>
          <p className="mt-1 text-sm text-foreground-muted">
            <span className="font-medium text-accent">{filteredResults.length}</span>{' '}
            {filteredResults.length === 1 ? 'hadith' : 'hadiths'} found
            {filteredResults.length !== searchResults.length && shouldShowFilters && (
              <span className="text-foreground-faint"> (filtered from {searchResults.length})</span>
            )}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={onClearSearch} className="shrink-0 gap-1.5">
          <X className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Clear</span>
        </Button>
      </div>

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
                {selectedGradings.filter((g) => g !== 'all').length + (activeMode ? 1 : 0)}
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
          {/* Gradings */}
          <div>
            <h3 className="mb-3 text-sm font-medium text-foreground">Grading Classification</h3>
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

          <Separator className="my-4" />

          {/* Search mode */}
          <div>
            <h3 className="mb-3 text-sm font-medium text-foreground">
              Search Mode{' '}
              <span className="text-xs font-normal text-foreground-faint">(select one)</span>
            </h3>
            <div className="grid gap-2 sm:grid-cols-2">
              {SEARCH_MODES.map((mode) => (
                <button
                  key={mode.key}
                  onClick={() => setActiveMode(activeMode === mode.key ? null : mode.key)}
                  className={cn(
                    'rounded-md border p-3 text-left transition-colors',
                    activeMode === mode.key
                      ? 'bg-accent/5 border-accent'
                      : 'border-border hover:bg-surface-2',
                  )}
                >
                  <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                    {mode.label}
                    {mode.recommended && (
                      <Badge variant="info" className="text-[10px]">
                        Recommended
                      </Badge>
                    )}
                  </span>
                  <p className="mt-0.5 text-xs text-foreground-muted">{mode.description}</p>
                </button>
              ))}
            </div>
          </div>

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
                {activeMode && (
                  <Badge variant="outline" className="gap-1 pr-1">
                    {SEARCH_MODES.find((m) => m.key === activeMode)?.label}
                    <button
                      onClick={() => setActiveMode(null)}
                      className="rounded-full p-0.5 hover:bg-surface-2"
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </Badge>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Results list ── */}
      <div className="space-y-4">
        {pageResults.length > 0 ? (
          pageResults.map((hadith, idx) => (
            <HadithCard
              key={hadith._id ?? `${hadith.bookId ?? 'book'}-${hadith.id ?? idx}`}
              hadith={hadith}
              showViewChapter
              showArabicByDefault={showArabicDefault(hadith)}
            />
          ))
        ) : !isSearching ? (
          <div className="py-16 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-border bg-surface-1">
              <Search className="h-5 w-5 text-foreground-faint" />
            </div>
            <h3 className="text-base font-medium text-foreground">
              {searchResults.length === 0 ? 'No Results Found' : 'No Results Match Filters'}
            </h3>
            <p className="mt-1 text-sm text-foreground-muted">
              {searchResults.length === 0
                ? `No hadiths found for "${searchQuery}"${contextLabel}`
                : 'Try adjusting your filters'}
            </p>
            {hasActiveFilters() && searchResults.length > 0 && (
              <Button variant="outline" size="sm" className="mt-3" onClick={clearAllFilters}>
                Clear all filters
              </Button>
            )}
          </div>
        ) : null}
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
