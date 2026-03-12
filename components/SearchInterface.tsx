'use client'

import { useState, useMemo, useEffect } from 'react'
import { Hadith } from '@/lib/api'
import HadithCard from './HadithCard'
import { IconSearch, IconFilter, IconChevronLeft, IconChevronRight, IconX } from './Icons'
import { useSettings } from '@/lib/settings-context'
import {
  isArabicQuery,
  matchesArabicText,
  normalizeArabic,
  flexibleEnglishMatch,
  smartSearch,
  flexibleArabicWordMatch,
} from '@/lib/search-utils'
import clsx from 'clsx'

interface SearchInterfaceProps {
  searchQuery: string
  searchResults: Hadith[]
  isSearching: boolean
  onSearch: (query: string) => void
  onClearSearch: () => void
  searchContext?: string // "all-books", "al-kafi", or "uyun-akhbar-al-rida"
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

// Helper function to get grading text color
const getGradingTextColor = (gradingValue: string) => {
  switch (gradingValue) {
    case 'sahih':
      return 'text-green-800 dark:text-green-500' // Richest darkest green
    case 'hasan':
      return 'text-green-700 dark:text-green-400' // #3 richness
    case 'muwathaq':
    case 'qawi':
      return 'text-green-700 dark:text-green-400' // #2 richness
    case 'daif':
      return 'text-red-700 dark:text-red-400' // Rich red
    case 'majhul':
    case 'mursal':
    case 'lam-yukhrijhu':
      return 'text-orange-600 dark:text-orange-400' // Orange
    case 'all':
    case 'other':
      return 'text-amber-600 dark:text-amber-400' // Gold
    default:
      return 'text-secondary'
  }
}

export default function SearchInterface({
  searchQuery,
  searchResults,
  isSearching,
  onSearch,
  onClearSearch,
  searchContext = 'all-books',
}: SearchInterfaceProps) {
  const { settings } = useSettings()
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedGradings, setSelectedGradings] = useState<string[]>(['all'])
  const [showFilters, setShowFilters] = useState(false)
  const [filtersLoaded, setFiltersLoaded] = useState(false)
  const [searchOptions, setSearchOptions] = useState({
    exactPhrase: false,
    exactWords: false,
    flexibleMatching: false,
    smartSearch: false,
  })

  // Helper function to handle search option changes
  const handleSearchOptionChange = (option: keyof typeof searchOptions, checked: boolean) => {
    // Special handling for mutually exclusive primary search modes
    const primarySearchModes = ['exactPhrase', 'exactWords', 'flexibleMatching', 'smartSearch']

    if (primarySearchModes.includes(option)) {
      if (checked) {
        // If checking a primary mode, uncheck all other primary modes
        setSearchOptions((prev) => ({
          ...prev,
          exactPhrase: option === 'exactPhrase',
          exactWords: option === 'exactWords',
          flexibleMatching: option === 'flexibleMatching',
          smartSearch: option === 'smartSearch',
        }))
      } else {
        // If unchecking a primary mode, just uncheck it
        setSearchOptions((prev) => ({ ...prev, [option]: false }))
      }
    } else {
      // For non-primary options (like caseInsensitive), toggle independently
      setSearchOptions((prev) => ({ ...prev, [option]: checked }))
    }
  }

  // Helper function to determine if filters should be shown
  const shouldShowFilters = () => {
    return searchContext === 'all-books' || searchContext === 'al-kafi'
  }

  // Helper function to check if any specific grading is selected
  const hasActiveFilters = () => {
    const hasGradingFilters = !selectedGradings.includes('all') && selectedGradings.length > 0
    const hasSearchOptions =
      searchOptions.exactPhrase ||
      searchOptions.exactWords ||
      searchOptions.flexibleMatching ||
      searchOptions.smartSearch
    return hasGradingFilters || hasSearchOptions
  }

  // Helper function to handle grading selection
  const handleGradingChange = (gradingValue: string, checked: boolean) => {
    if (gradingValue === 'all') {
      setSelectedGradings(['all'])
    } else {
      setSelectedGradings((prev) => {
        // Remove 'all' when selecting specific gradings
        const withoutAll = prev.filter((g) => g !== 'all')

        if (checked) {
          // Add the new grading
          return [...withoutAll, gradingValue]
        } else {
          // Remove the grading
          const updated = withoutAll.filter((g) => g !== gradingValue)
          // If no specific gradings selected, default to 'all'
          return updated.length === 0 ? ['all'] : updated
        }
      })
    }
  }

  // Helper function to select all specific gradings (excluding 'all')
  const selectAllGradings = () => {
    const allSpecificGradings = GRADING_OPTIONS.filter((opt) => opt.value !== 'all').map(
      (opt) => opt.value,
    )
    setSelectedGradings(allSpecificGradings)
  }

  // Helper function to check if all specific gradings are selected
  const areAllGradingsSelected = () => {
    const specificGradings = GRADING_OPTIONS.filter((opt) => opt.value !== 'all').map(
      (opt) => opt.value,
    )
    return specificGradings.every((grading) => selectedGradings.includes(grading))
  }

  // Helper function to clear all filters
  const clearAllFilters = () => {
    setSelectedGradings(['all'])
    setSearchOptions({
      exactPhrase: false,
      exactWords: false,
      flexibleMatching: false,
      smartSearch: false,
    })
  }

  // Reset pagination when search query changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, selectedGradings])

  // Load filters with a small delay for better UX
  useEffect(() => {
    if (showFilters) {
      const timer = setTimeout(() => {
        setFiltersLoaded(true)
      }, 150)
      return () => clearTimeout(timer)
    } else {
      setFiltersLoaded(false)
    }
  }, [showFilters])

  // Filter and sort results
  const filteredAndSortedResults = useMemo(() => {
    let filtered = [...searchResults]

    // Apply search options filtering first
    const hasSearchOptions =
      searchOptions.exactPhrase ||
      searchOptions.exactWords ||
      searchOptions.flexibleMatching ||
      searchOptions.smartSearch

    if (hasSearchOptions && searchQuery.trim()) {
      filtered = searchResults.filter((hadith) => {
        const searchText = searchQuery.trim()
        const isArabic = isArabicQuery(searchText)

        // Get text content with case sensitivity option
        const getProcessedText = (text: string | null | undefined) => {
          if (!text) return ''
          return text.toLowerCase()
        }

        const englishText = getProcessedText(hadith.englishText || hadith.thaqalaynMatn)
        const arabicText =
          isArabic && hadith.arabicText
            ? normalizeArabic(hadith.arabicText)
            : getProcessedText(hadith.arabicText)
        const allText = `${englishText} ${arabicText}`.trim()

        // Process search query based on language and case sensitivity
        const processedQuery = isArabic ? normalizeArabic(searchText) : searchText.toLowerCase()

        if (searchOptions.exactPhrase) {
          // Exact phrase matching
          if (isArabic) {
            return arabicText.includes(processedQuery)
          }
          return allText.includes(processedQuery)
        }

        if (searchOptions.exactWords) {
          // All words must appear exactly (not as substrings)
          const searchWords = processedQuery.split(/\s+/).filter(Boolean)

          if (isArabic) {
            const textWords = new Set(arabicText.split(/\s+/).filter(Boolean))
            return searchWords.every((w) => textWords.has(w))
          }

          return searchWords.every((searchWord) => {
            // Use word boundary regex for exact word matching
            const flags = ''
            const escapedWord = searchWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
            const wordRegex = new RegExp('\\b' + escapedWord + '\\b', flags)
            return wordRegex.test(allText)
          })
        }

        if (searchOptions.flexibleMatching) {
          // Enhanced flexible matching
          const searchWords = processedQuery.split(/\s+/).filter(Boolean)

          if (isArabic) {
            // Arabic flexible matching with article variations
            const alVariants = (w: string) => {
              const vars = [w]
              if (w.startsWith('ال')) vars.push(w.slice(2))
              else vars.push('ال' + w)
              return Array.from(new Set(vars))
            }

            return searchWords.every((searchWord) => {
              return flexibleArabicWordMatch(arabicText, searchWord)
            })
          }

          // Enhanced English flexible matching with synonyms and stemming
          return flexibleEnglishMatch(allText, searchWords, {
            caseInsensitive: true,
            useSynonyms: true,
            useStemming: true,
          })
        }

        if (searchOptions.smartSearch) {
          // Smart search that adapts to query type
          if (isArabic) {
            return arabicText.includes(processedQuery)
          }

          return smartSearch(allText, processedQuery, {
            caseInsensitive: true,
          })
        }

        return false
      })
    }

    // Apply grading filters - Skip for searches that don't support filters
    if (shouldShowFilters() && !selectedGradings.includes('all')) {
      filtered = filtered.filter((hadith) => {
        const gradingText = [
          hadith.majlisiGrading,
          hadith.mohseniGrading,
          hadith.behbudiGrading,
          ...(hadith.gradingsFull || []).map((g) => `${g.grade_en} ${g.grade_ar}`).join(' '),
        ]
          .join(' ')
          .toLowerCase()

        // Check if hadith matches any of the selected gradings
        return selectedGradings.some((selectedGrading) => {
          const selectedOption = GRADING_OPTIONS.find((opt) => opt.value === selectedGrading)
          if (!selectedOption) return false

          // Special case for "lam-yukhrijhu" - check for "لم يخرجه" OR no grading at all
          if (selectedGrading === 'lam-yukhrijhu') {
            const hasNoGrading =
              !hadith.majlisiGrading &&
              !hadith.mohseniGrading &&
              !hadith.behbudiGrading &&
              (!hadith.gradingsFull || hadith.gradingsFull.length === 0)
            const hasLamYukhrijhu = gradingText.includes('لم يخرجه')
            return hasNoGrading || hasLamYukhrijhu
          }

          // Special case for "other" - check if it doesn't match common gradings but has some grading
          if (selectedGrading === 'other') {
            const hasGrading = gradingText.trim().length > 0
            const isCommonGrading = [
              'صحيح',
              'حسن',
              'موثق',
              'قوي',
              'ضعيف',
              'مجهول',
              'مرسل',
              'لم يخرجه',
            ].some((common) => gradingText.includes(common.toLowerCase()))
            return hasGrading && !isCommonGrading
          }

          // Regular keyword matching for other grading types
          return (
            selectedOption?.keywords?.some((keyword) =>
              gradingText.includes(keyword.toLowerCase()),
            ) || false
          )
        })
      })
    }

    // Apply sorting - Sort by volume first (low to high), then by hadith ID (low to high)
    filtered.sort((a, b) => {
      // First, sort by volume
      const volumeA = a.volume || 0
      const volumeB = b.volume || 0

      if (volumeA !== volumeB) {
        return volumeA - volumeB
      }

      // If volumes are the same, sort by hadith ID
      return (a.id || 0) - (b.id || 0)
    })

    return filtered
  }, [searchResults, selectedGradings, searchOptions, searchQuery])

  // Detect if this is an Arabic search query
  const isArabicSearchQuery = useMemo(() => {
    return isArabicQuery(searchQuery)
  }, [searchQuery])

  // Determine which hadiths should show Arabic by default
  const shouldShowArabicByDefault = useMemo(() => {
    if (!isArabicSearchQuery) return () => false

    // For Arabic queries, show Arabic for all hadiths that have Arabic text
    return (hadith: Hadith) => {
      return Boolean(hadith.arabicText)
    }
  }, [isArabicSearchQuery])

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedResults.length / RESULTS_PER_PAGE)
  const startIndex = (currentPage - 1) * RESULTS_PER_PAGE
  const endIndex = startIndex + RESULTS_PER_PAGE
  const currentPageResults = filteredAndSortedResults.slice(startIndex, endIndex)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    // Scroll to top of results
    const resultsSection = document.getElementById('search-results')
    if (resultsSection) {
      resultsSection.scrollIntoView({ behavior: 'smooth' })
    }
  }

  if (!searchQuery) return null

  return (
    <section id="search-results" className="mx-auto mt-8 max-w-7xl px-4 sm:px-6 lg:px-8">
      {/* Search Header */}
      <div className="mb-6 flex flex-col gap-4">
        {/* Title and Clear Button Row */}
        <div className="flex items-start justify-between gap-4 sm:items-center">
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex items-center gap-3">
              <h2 className="text-primary truncate text-xl font-bold sm:text-2xl">
                Search Results{' '}
                {searchContext === 'al-kafi'
                  ? 'in Al-Kāfi'
                  : searchContext === 'uyun-akhbar-al-rida'
                    ? 'in ʿUyūn akhbār al-Riḍā'
                    : ''}{' '}
                for "{searchQuery}"
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted">
              <span className="flex items-center gap-1">
                <span className="text-accent-primary font-medium">
                  {filteredAndSortedResults.length}
                </span>
                {filteredAndSortedResults.length === 1 ? 'hadith' : 'hadiths'} found
              </span>
              {hasActiveFilters() && shouldShowFilters() && (
                <div className="flex flex-wrap gap-2">
                  {selectedGradings.map((grading) => {
                    const option = GRADING_OPTIONS.find((opt) => opt.value === grading)
                    return option ? (
                      <span
                        key={grading}
                        className={clsx(
                          'bg-accent-primary/10 rounded-full px-2 py-1 text-xs font-medium',
                          getGradingTextColor(grading),
                        )}
                      >
                        {option.label}
                      </span>
                    ) : null
                  })}
                  {searchOptions.exactPhrase && (
                    <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                      Exact Phrase
                    </span>
                  )}
                  {searchOptions.exactWords && (
                    <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                      Exact Words
                    </span>
                  )}
                  {searchOptions.flexibleMatching && (
                    <span className="rounded-full bg-purple-100 px-2 py-1 text-xs font-medium text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                      Flexible Match
                    </span>
                  )}
                </div>
              )}
              {filteredAndSortedResults.length !== searchResults.length && shouldShowFilters() && (
                <span className="text-muted/80">(filtered from {searchResults.length} total)</span>
              )}
            </div>
          </div>

          <button
            onClick={onClearSearch}
            className="border-theme hover:bg-hover-color text-secondary hover:text-primary flex min-h-[44px] shrink-0 items-center gap-2 rounded-lg border bg-card px-3 py-2 shadow-soft transition-all active:scale-95"
            title="Clear search and go back"
          >
            <IconX className="h-4 w-4" />
            <span className="hidden text-sm font-medium sm:inline">Clear</span>
          </button>
        </div>

        {/* Filter Toggle Row */}
        {shouldShowFilters() && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted">
              <IconFilter className="h-4 w-4" />
              <span>Filter results</span>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={clsx(
                'flex min-h-[44px] select-none items-center gap-2 rounded-lg border px-4 py-2 transition-all active:scale-95',
                showFilters
                  ? 'bg-accent-primary border-accent-primary text-white shadow-soft'
                  : 'text-primary border-theme hover:bg-hover-color bg-card',
              )}
            >
              <IconFilter className="h-4 w-4" />
              <span className="select-none font-medium">
                {showFilters ? 'Hide' : 'Show'} Filters
              </span>
              {hasActiveFilters() && (
                <span className="min-w-[20px] select-none rounded-full bg-white/20 px-2 py-0.5 text-center text-xs font-medium">
                  {selectedGradings.length}
                </span>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Filters Panel */}
      <div
        className={clsx(
          'mb-6 overflow-hidden transition-all duration-300 ease-in-out',
          showFilters && shouldShowFilters() ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0',
        )}
      >
        {shouldShowFilters() && (
          <div className="border-theme overflow-hidden rounded-xl border bg-card shadow-soft">
            {/* Filter Header */}
            <div className="to-card-hover border-theme border-b bg-gradient-to-r from-card px-4 py-4 sm:px-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <IconFilter className="text-accent-primary h-5 w-5" />
                  <h3 className="text-primary select-none font-semibold">Filter Options</h3>
                </div>
                <button
                  onClick={() => setShowFilters(false)}
                  className="hover:bg-hover-color flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg p-2 transition-colors sm:hidden"
                >
                  <IconX className="text-secondary h-4 w-4" />
                </button>
              </div>
              <p className="mt-1 select-none text-sm text-muted">
                Select multiple grading types to refine your search results
                {hasActiveFilters() && (
                  <span className="text-accent-primary select-none font-medium">
                    {' '}
                    • {selectedGradings.length} filter{selectedGradings.length > 1 ? 's' : ''}{' '}
                    active
                  </span>
                )}
              </p>
            </div>

            {/* Filter Content */}
            <div className="p-4 sm:p-6">
              {/* Grading Filter */}
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <label className="text-primary block select-none text-sm font-medium">
                    Hadith Grading Classification
                  </label>
                  <div className="flex items-center gap-2">
                    {!areAllGradingsSelected() && !selectedGradings.includes('all') && (
                      <button
                        onClick={selectAllGradings}
                        className="text-accent-primary hover:text-accent-secondary hover:bg-accent-primary/10 select-none rounded px-2 py-1 text-xs transition-colors"
                      >
                        Select all
                      </button>
                    )}
                    {hasActiveFilters() && (
                      <button
                        onClick={clearAllFilters}
                        className="hover:text-primary hover:bg-hover-color select-none rounded px-2 py-1 text-xs text-muted transition-colors"
                      >
                        Clear all
                      </button>
                    )}
                  </div>
                </div>

                {/* Desktop: Grid Layout */}
                <div className="hidden gap-3 sm:grid sm:grid-cols-2 lg:grid-cols-3">
                  {GRADING_OPTIONS.map((option, index) => {
                    const isSelected = selectedGradings.includes(option.value)
                    const isAllOption = option.value === 'all'
                    return (
                      <label
                        key={option.value}
                        className={clsx(
                          'group flex cursor-pointer select-none items-center gap-3 rounded-lg border p-3 transition-all duration-200 ease-out',
                          filtersLoaded ? 'opacity-100' : 'opacity-0',
                          isSelected
                            ? 'border-accent-primary bg-accent-primary/5 hover:bg-accent-primary/10'
                            : 'border-theme/50 hover:bg-card-hover/30 hover:border-gray-200 dark:hover:border-gray-500',
                        )}
                      >
                        <input
                          type={isAllOption ? 'radio' : 'checkbox'}
                          name={isAllOption ? 'grading-all' : 'grading'}
                          value={option.value}
                          checked={isSelected}
                          onChange={(e) => {
                            if (isAllOption) {
                              clearAllFilters()
                            } else {
                              handleGradingChange(option.value, e.target.checked)
                            }
                          }}
                          className="text-accent-primary border-theme h-4 w-4 focus:outline-none focus:ring-0 focus:ring-offset-0"
                        />
                        <span
                          className={clsx(
                            'select-none text-sm font-medium leading-tight transition-colors',
                            getGradingTextColor(option.value),
                          )}
                        >
                          {option.label}
                        </span>
                      </label>
                    )
                  })}
                </div>

                {/* Mobile: List Layout with better spacing */}
                <div className="space-y-3 sm:hidden">
                  {GRADING_OPTIONS.map((option, index) => {
                    const isSelected = selectedGradings.includes(option.value)
                    const isAllOption = option.value === 'all'
                    return (
                      <label
                        key={option.value}
                        className={clsx(
                          'group flex min-h-[56px] cursor-pointer select-none items-center gap-4 rounded-lg border p-4 transition-all duration-200 ease-out active:scale-[0.98]',
                          filtersLoaded ? 'opacity-100' : 'opacity-0',
                          isSelected
                            ? 'border-accent-primary bg-accent-primary/5'
                            : 'border-theme/50 hover:bg-card-hover/30 hover:border-gray-200 dark:hover:border-gray-500',
                        )}
                      >
                        <input
                          type={isAllOption ? 'radio' : 'checkbox'}
                          name={isAllOption ? 'grading-all' : 'grading'}
                          value={option.value}
                          checked={isSelected}
                          onChange={(e) => {
                            if (isAllOption) {
                              clearAllFilters()
                            } else {
                              handleGradingChange(option.value, e.target.checked)
                            }
                          }}
                          className="text-accent-primary border-theme h-5 w-5 focus:outline-none focus:ring-0 focus:ring-offset-0"
                        />
                        <span
                          className={clsx(
                            'flex-1 select-none font-medium transition-colors',
                            getGradingTextColor(option.value),
                          )}
                        >
                          {option.label}
                        </span>
                      </label>
                    )
                  })}
                </div>
              </div>

              {/* Search Options */}
              <div className="border-theme mt-6 border-t pt-6">
                <label className="text-primary mb-4 block select-none text-sm font-medium">
                  Search Mode{' '}
                  <span className="select-none text-xs font-normal text-muted">(select one)</span>
                </label>
                <div className="space-y-3">
                  <label
                    className={clsx(
                      'border-theme/50 hover:bg-card-hover/30 group flex cursor-pointer select-none items-center gap-3 rounded-lg border p-3 transition-all duration-200 ease-out hover:border-gray-200 dark:hover:border-gray-500',
                      filtersLoaded ? 'opacity-100' : 'opacity-0',
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={searchOptions.smartSearch}
                      onChange={(e) => handleSearchOptionChange('smartSearch', e.target.checked)}
                      className="text-accent-primary border-theme h-4 w-4 focus:outline-none focus:ring-0 focus:ring-offset-0"
                    />
                    <div className="select-none">
                      <span className="text-primary select-none text-sm font-medium">
                        Smart Search{' '}
                        <span className="text-xs font-medium text-green-600 dark:text-green-400">
                          (Recommended)
                        </span>
                      </span>
                      <p className="mt-1 select-none text-xs text-muted">
                        Automatically chooses the best search strategy. Includes synonyms for
                        Islamic terms (e.g., "prayer" finds "salah")
                      </p>
                    </div>
                  </label>
                  <label
                    className={clsx(
                      'border-theme/50 hover:bg-card-hover/30 group flex cursor-pointer select-none items-center gap-3 rounded-lg border p-3 transition-all duration-200 ease-out hover:border-gray-200 dark:hover:border-gray-500',
                      filtersLoaded ? 'opacity-100' : 'opacity-0',
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={searchOptions.flexibleMatching}
                      onChange={(e) =>
                        handleSearchOptionChange('flexibleMatching', e.target.checked)
                      }
                      className="text-accent-primary border-theme h-4 w-4 focus:outline-none focus:ring-0 focus:ring-offset-0"
                    />
                    <div className="select-none">
                      <span className="text-primary select-none text-sm font-medium">
                        Enhanced Flexible Matching
                      </span>
                      <p className="mt-1 select-none text-xs text-muted">
                        Advanced word variations + Islamic terminology synonyms (e.g., "praying"
                        matches "prayer", "salah", "salat")
                      </p>
                    </div>
                  </label>
                  <label
                    className={clsx(
                      'border-theme/50 hover:bg-card-hover/30 group flex cursor-pointer select-none items-center gap-3 rounded-lg border p-3 transition-all duration-200 ease-out hover:border-gray-200 dark:hover:border-gray-500',
                      filtersLoaded ? 'opacity-100' : 'opacity-0',
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={searchOptions.exactWords}
                      onChange={(e) => handleSearchOptionChange('exactWords', e.target.checked)}
                      className="text-accent-primary border-theme h-4 w-4 focus:outline-none focus:ring-0 focus:ring-offset-0"
                    />
                    <div className="select-none">
                      <span className="text-primary select-none text-sm font-medium">
                        Exact Words Only
                      </span>
                      <p className="mt-1 select-none text-xs text-muted">
                        Match whole words exactly (not as parts of other words)
                      </p>
                    </div>
                  </label>
                  <label
                    className={clsx(
                      'border-theme/50 hover:bg-card-hover/30 group flex cursor-pointer select-none items-center gap-3 rounded-lg border p-3 transition-all duration-200 ease-out hover:border-gray-200 dark:hover:border-gray-500',
                      filtersLoaded ? 'opacity-100' : 'opacity-0',
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={searchOptions.exactPhrase}
                      onChange={(e) => handleSearchOptionChange('exactPhrase', e.target.checked)}
                      className="text-accent-primary border-theme h-4 w-4 focus:outline-none focus:ring-0 focus:ring-offset-0"
                    />
                    <div className="select-none">
                      <span className="text-primary select-none text-sm font-medium">
                        Exact Phrase
                      </span>
                      <p className="mt-1 select-none text-xs text-muted">
                        Search for the exact phrase as written
                      </p>
                    </div>
                  </label>
                </div>

                {/* Additional Options */}
                <div className="border-theme/30 mt-4 border-t pt-4">
                  <label className="text-primary mb-3 block select-none text-sm font-medium">
                    Additional Options
                  </label>
                  {/* Case-insensitive behavior is now fixed and always on; option removed */}
                </div>
              </div>

              {/* Clear Filters */}
              {hasActiveFilters() && (
                <div className="border-theme mt-6 flex flex-col gap-4 border-t pt-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex flex-col gap-2">
                    <span className="text-sm font-medium text-muted">Active filters:</span>
                    <div className="flex flex-wrap gap-2">
                      {selectedGradings.map((grading) => {
                        const option = GRADING_OPTIONS.find((opt) => opt.value === grading)
                        return option ? (
                          <span
                            key={grading}
                            className="bg-accent-primary/10 border-accent-primary/20 text-accent-primary hover:bg-accent-primary/15 inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium shadow-sm transition-all duration-200 hover:scale-105 hover:shadow-md"
                          >
                            {option.label}
                            {/* Don't show X button for "All Gradings" */}
                            {grading !== 'all' && (
                              <button
                                onClick={() => handleGradingChange(grading, false)}
                                className="hover:bg-accent-primary/20 dark:hover:bg-accent-primary/30 ml-1 flex items-center justify-center rounded-full p-0.5 transition-all duration-200 hover:scale-110"
                                title={`Remove ${option.label} filter`}
                              >
                                <IconX className="h-3 w-3" />
                              </button>
                            )}
                          </span>
                        ) : null
                      })}
                      {searchOptions.smartSearch && (
                        <span className="hover:bg-green-150 inline-flex items-center gap-1 rounded-lg border border-green-200 bg-green-100 px-3 py-1.5 text-xs font-medium text-green-700 shadow-sm transition-all duration-200 hover:scale-105 hover:shadow-md dark:border-green-700/50 dark:bg-green-900/30 dark:text-green-300 dark:hover:bg-green-900/40">
                          Smart Search
                          <button
                            onClick={() => handleSearchOptionChange('smartSearch', false)}
                            className="ml-1 flex items-center justify-center rounded-full p-0.5 transition-all duration-200 hover:scale-110 hover:bg-green-200 dark:hover:bg-green-800/50"
                            title="Remove Smart Search filter"
                          >
                            <IconX className="h-3 w-3" />
                          </button>
                        </span>
                      )}
                      {searchOptions.flexibleMatching && (
                        <span className="hover:bg-purple-150 inline-flex items-center gap-1 rounded-lg border border-purple-200 bg-purple-100 px-3 py-1.5 text-xs font-medium text-purple-700 shadow-sm transition-all duration-200 hover:scale-105 hover:shadow-md dark:border-purple-700/50 dark:bg-purple-900/30 dark:text-purple-300 dark:hover:bg-purple-900/40">
                          Enhanced Flexible
                          <button
                            onClick={() => handleSearchOptionChange('flexibleMatching', false)}
                            className="ml-1 flex items-center justify-center rounded-full p-0.5 transition-all duration-200 hover:scale-110 hover:bg-purple-200 dark:hover:bg-purple-800/50"
                            title="Remove Enhanced Flexible filter"
                          >
                            <IconX className="h-3 w-3" />
                          </button>
                        </span>
                      )}
                      {searchOptions.exactWords && (
                        <span className="hover:bg-blue-150 inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-100 px-3 py-1.5 text-xs font-medium text-blue-700 shadow-sm transition-all duration-200 hover:scale-105 hover:shadow-md dark:border-blue-700/50 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/40">
                          Exact Words
                          <button
                            onClick={() => handleSearchOptionChange('exactWords', false)}
                            className="ml-1 flex items-center justify-center rounded-full p-0.5 transition-all duration-200 hover:scale-110 hover:bg-blue-200 dark:hover:bg-blue-800/50"
                            title="Remove Exact Words filter"
                          >
                            <IconX className="h-3 w-3" />
                          </button>
                        </span>
                      )}
                      {searchOptions.exactPhrase && (
                        <span className="hover:bg-blue-150 inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-100 px-3 py-1.5 text-xs font-medium text-blue-700 shadow-sm transition-all duration-200 hover:scale-105 hover:shadow-md dark:border-blue-700/50 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/40">
                          Exact Phrase
                          <button
                            onClick={() => handleSearchOptionChange('exactPhrase', false)}
                            className="ml-1 flex items-center justify-center rounded-full p-0.5 transition-all duration-200 hover:scale-110 hover:bg-blue-200 dark:hover:bg-blue-800/50"
                            title="Remove Exact Phrase filter"
                          >
                            <IconX className="h-3 w-3" />
                          </button>
                        </span>
                      )}
                      {/* Case sensitive option removed - search is always case-insensitive */}
                    </div>
                  </div>
                  <button
                    onClick={clearAllFilters}
                    className="hover:text-primary hover:bg-hover-color border-theme/50 min-h-[40px] shrink-0 rounded-lg border px-3 py-2 text-sm font-medium text-muted transition-colors hover:border-gray-200 active:scale-95 dark:hover:border-gray-500"
                  >
                    Clear all filters
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      <div className="space-y-6">
        {currentPageResults.length > 0 ? (
          currentPageResults.map((hadith, idx) => (
            <HadithCard
              key={hadith._id ?? `${hadith.bookId ?? 'book'}-${hadith.id ?? idx}`}
              hadith={hadith}
              showViewChapter={true}
              showArabicByDefault={shouldShowArabicByDefault(hadith)}
            />
          ))
        ) : !isSearching ? (
          <div className="py-12 pb-80 text-center">
            <div className="mx-auto max-w-md">
              <div className="border-theme mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border bg-card">
                <IconSearch className="h-7 w-7 text-muted" />
              </div>
              <h3 className="text-primary mb-2 text-lg font-medium">
                {searchResults.length === 0 ? 'No Results Found' : 'No Results Match Filters'}
              </h3>
              <p className="mb-4 text-muted">
                {searchResults.length === 0
                  ? `No hadiths found for "${searchQuery}"${searchContext === 'al-kafi' ? ' in Al-Kāfi' : searchContext === 'uyun-akhbar-al-rida' ? ' in ʿUyūn akhbār al-Riḍā' : ''}`
                  : 'No hadiths match the selected filters'}
              </p>
              <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
                {searchResults.length === 0 ? (
                  <p className="text-sm text-muted">
                    Try a different search term or check your spelling
                  </p>
                ) : (
                  <>
                    <p className="text-sm text-muted">Try adjusting your filters</p>
                    {hasActiveFilters() && (
                      <button
                        onClick={clearAllFilters}
                        className="bg-accent-primary hover:bg-accent-secondary rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors active:scale-95"
                      >
                        Clear all filters
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mb-8 mt-12 flex flex-col items-center gap-4">
          {/* Desktop Pagination */}
          <div className="hidden items-center gap-2 sm:flex">
            {/* Previous Button */}
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={clsx(
                'flex items-center gap-2 rounded-lg border px-4 py-2 transition-all active:scale-95',
                currentPage === 1
                  ? 'border-theme/50 cursor-not-allowed text-muted opacity-50'
                  : 'text-primary border-theme hover:bg-hover-color',
              )}
            >
              <IconChevronLeft className="h-4 w-4" />
              <span>Previous</span>
            </button>

            {/* Page Numbers */}
            <div className="mx-2 flex items-center gap-1">
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                let pageNum
                if (totalPages <= 7) {
                  pageNum = i + 1
                } else if (currentPage <= 4) {
                  pageNum = i + 1
                } else if (currentPage >= totalPages - 3) {
                  pageNum = totalPages - 6 + i
                } else {
                  pageNum = currentPage - 3 + i
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={clsx(
                      'h-10 w-10 rounded-lg border transition-all active:scale-95',
                      currentPage === pageNum
                        ? 'bg-accent-primary border-accent-primary text-white shadow-soft'
                        : 'text-primary border-theme hover:bg-hover-color',
                    )}
                  >
                    {pageNum}
                  </button>
                )
              })}
            </div>

            {/* Next Button */}
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={clsx(
                'flex items-center gap-2 rounded-lg border px-4 py-2 transition-all active:scale-95',
                currentPage === totalPages
                  ? 'border-theme/50 cursor-not-allowed text-muted opacity-50'
                  : 'text-primary border-theme hover:bg-hover-color',
              )}
            >
              <span>Next</span>
              <IconChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Mobile Pagination */}
          <div className="flex w-full items-center justify-between sm:hidden">
            {/* Previous Button */}
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={clsx(
                'flex min-h-[48px] items-center gap-2 rounded-lg border px-4 py-3 transition-all active:scale-95',
                currentPage === 1
                  ? 'border-theme/50 cursor-not-allowed text-muted opacity-50'
                  : 'text-primary border-theme hover:bg-hover-color',
              )}
            >
              <IconChevronLeft className="h-4 w-4" />
              <span>Previous</span>
            </button>

            {/* Page Info */}
            <div className="border-theme flex items-center gap-2 rounded-lg border bg-card px-4 py-2">
              <span className="text-sm text-muted">Page</span>
              <span className="text-primary text-sm font-medium">{currentPage}</span>
              <span className="text-sm text-muted">of</span>
              <span className="text-primary text-sm font-medium">{totalPages}</span>
            </div>

            {/* Next Button */}
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={clsx(
                'flex min-h-[48px] items-center gap-2 rounded-lg border px-4 py-3 transition-all active:scale-95',
                currentPage === totalPages
                  ? 'border-theme/50 cursor-not-allowed text-muted opacity-50'
                  : 'text-primary border-theme hover:bg-hover-color',
              )}
            >
              <span>Next</span>
              <IconChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Pagination Info */}
          <div className="text-center text-sm text-muted">
            Showing {startIndex + 1}-{Math.min(endIndex, filteredAndSortedResults.length)} of{' '}
            {filteredAndSortedResults.length} results
          </div>
        </div>
      )}
    </section>
  )
}
