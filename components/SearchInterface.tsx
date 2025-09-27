'use client'

import { useState, useMemo, useEffect } from 'react'
import { Hadith } from '@/lib/api'
import HadithCard from './HadithCard'
import { IconSearch, IconFilter, IconChevronLeft, IconChevronRight, IconX } from './Icons'
import { useSettings } from '@/lib/settings-context'
import { isArabicQuery, matchesArabicText, normalizeArabic, flexibleArabicWordMatch } from '@/lib/search-utils'
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
  { value: 'other', label: 'Other Gradings', keywords: ['مقطوع', 'مدلس', 'غريب', 'عزيز', 'مشهور', 'متواتر', 'آحاد'] },
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
  searchContext = 'all-books'
}: SearchInterfaceProps) {
  const { settings } = useSettings()
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedGradings, setSelectedGradings] = useState<string[]>(['all'])
  const [showFilters, setShowFilters] = useState(false)
  const [filtersLoaded, setFiltersLoaded] = useState(false)
  const [searchOptions, setSearchOptions] = useState({
    exactPhrase: false,
    exactWords: false,
    flexibleMatching: false
  })

  // Helper function to handle search option changes (only one at a time)
  const handleSearchOptionChange = (option: keyof typeof searchOptions, checked: boolean) => {
    if (checked) {
      // If checking an option, uncheck all others
      setSearchOptions({
        exactPhrase: option === 'exactPhrase',
        exactWords: option === 'exactWords',
        flexibleMatching: option === 'flexibleMatching'
      })
    } else {
      // If unchecking, just uncheck this option
      setSearchOptions(prev => ({ ...prev, [option]: false }))
    }
  }

  // Helper function to determine if filters should be shown
  const shouldShowFilters = () => {
    return searchContext === 'all-books' || searchContext === 'al-kafi'
  }

  // Helper function to check if any specific grading is selected
  const hasActiveFilters = () => {
    const hasGradingFilters = !selectedGradings.includes('all') && selectedGradings.length > 0
    const hasSearchOptions = searchOptions.exactPhrase || searchOptions.exactWords || searchOptions.flexibleMatching
    return hasGradingFilters || hasSearchOptions
  }

  // Helper function to handle grading selection
  const handleGradingChange = (gradingValue: string, checked: boolean) => {
    if (gradingValue === 'all') {
      setSelectedGradings(['all'])
    } else {
      setSelectedGradings(prev => {
        // Remove 'all' when selecting specific gradings
        const withoutAll = prev.filter(g => g !== 'all')
        
        if (checked) {
          // Add the new grading
          return [...withoutAll, gradingValue]
        } else {
          // Remove the grading
          const updated = withoutAll.filter(g => g !== gradingValue)
          // If no specific gradings selected, default to 'all'
          return updated.length === 0 ? ['all'] : updated
        }
      })
    }
  }

  // Helper function to select all specific gradings (excluding 'all')
  const selectAllGradings = () => {
    const allSpecificGradings = GRADING_OPTIONS.filter(opt => opt.value !== 'all').map(opt => opt.value)
    setSelectedGradings(allSpecificGradings)
  }

  // Helper function to check if all specific gradings are selected
  const areAllGradingsSelected = () => {
    const specificGradings = GRADING_OPTIONS.filter(opt => opt.value !== 'all').map(opt => opt.value)
    return specificGradings.every(grading => selectedGradings.includes(grading))
  }

  // Helper function to clear all filters
  const clearAllFilters = () => {
    setSelectedGradings(['all'])
    setSearchOptions({
      exactPhrase: false,
      exactWords: false,
      flexibleMatching: false
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
    const hasSearchOptions = searchOptions.exactPhrase || searchOptions.exactWords || searchOptions.flexibleMatching
    
    if (hasSearchOptions && searchQuery.trim()) {
      filtered = searchResults.filter(hadith => {
        const searchText = searchQuery.trim()

        const getText = (text: string | null | undefined) => {
          if (!text) return ''
          return text.toLowerCase()
        }

        const isArabic = isArabicQuery(searchText)
        const queryText = isArabic ? normalizeArabic(searchText) : searchText.toLowerCase()

        const englishText = getText(hadith.englishText || hadith.thaqalaynMatn)
        // For Arabic, keep both raw (with diacritics) and normalized (without) versions
        const arabicRaw = (hadith.arabicText || '').toLowerCase()
        const arabicText = isArabic && hadith.arabicText ? normalizeArabic(hadith.arabicText) : arabicRaw
        const queryArabicRaw = searchText.toLowerCase()

        // Arabic-aware helpers
        const tokenizeArabic = (s: string) => s.split(/\s+/).filter(Boolean)
        const alVariants = (w: string) => {
          const vars = [w]
          if (w.startsWith('ال')) vars.push(w.slice(2))
          else vars.push('ال' + w)
          return Array.from(new Set(vars))
        }

        const allText = `${englishText} ${arabicText}`.trim()

        if (searchOptions.exactPhrase) {
          // Exact phrase matching - require exact diacritics in Arabic
          if (isArabic) {
            return arabicRaw.includes(queryArabicRaw)
          }
          return allText.includes(queryText)
        }
        
        if (searchOptions.exactWords) {
          // All words must appear exactly (not as substrings)
          if (isArabic) {
            // Require exact diacritics per token
            const searchWords = queryArabicRaw.split(/\s+/).filter(Boolean)
            const textWords = new Set(tokenizeArabic(arabicRaw))
            return searchWords.every(w => textWords.has(w))
          }
          const searchWords = queryText.split(/\s+/).filter(word => word.length > 0)
          return searchWords.every(searchWord => {
            // Use word boundary regex for exact word matching
            const wordRegex = new RegExp('\\b' + searchWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'i')
            return wordRegex.test(allText)
          })
        }

        if (searchOptions.flexibleMatching) {
          // Flexible matching - match word stems and variations
          const searchWords = queryText.split(/\s+/).filter(word => word.length > 0)
          if (isArabic) {
            // Enhanced flexible Arabic matching with morphological awareness
            return searchWords.every(searchWord => {
              return flexibleArabicWordMatch(arabicText, searchWord)
            })
          }
          return searchWords.every(searchWord => {
            // First check for exact word match (including the original word)
            if (allText.includes(searchWord)) {
              return true
            }
            
            // Create flexible patterns for each word (English heuristics)
            let stem = searchWord
            if (stem.endsWith('ies') && stem.length > 4) {
              stem = stem.slice(0, -3) + 'y'
            } else if (stem.endsWith('ied') && stem.length > 4) {
              stem = stem.slice(0, -3) + 'y'
            } else if (stem.endsWith('ing') && stem.length > 4) {
              const beforeIng = stem.slice(0, -3)
              if (beforeIng.length >= 2 && 
                  beforeIng[beforeIng.length - 1] === beforeIng[beforeIng.length - 2] &&
                  'bcdfghjklmnpqrstvwxz'.includes(beforeIng[beforeIng.length - 1])) {
                stem = beforeIng.slice(0, -1)
              } else {
                stem = beforeIng
              }
            } else if (stem.endsWith('ed') && stem.length > 3) {
              const beforeEd = stem.slice(0, -2)
              if (beforeEd.length >= 2 && 
                  beforeEd[beforeEd.length - 1] === beforeEd[beforeEd.length - 2] &&
                  'bcdfghjklmnpqrstvwxz'.includes(beforeEd[beforeEd.length - 1])) {
                stem = beforeEd.slice(0, -1)
              } else {
                stem = beforeEd
              }
            } else {
              const suffixes = ['tion', 'sion', 'ness', 'ment', 'able', 'ible', 'ful', 'less', 'ous', 'ious', 'eous', 'ive', 'ative', 'itive', 'er', 'est', 'ly', 'es', 's']
              for (const suffix of suffixes) {
                if (stem.endsWith(suffix) && stem.length > suffix.length + 2) {
                  stem = stem.slice(0, -suffix.length)
                  break
                }
              }
            }
            const pattern = stem.length >= 3 && stem !== searchWord ? stem : searchWord
            return allText.includes(pattern)
          })
        }

        return false // Should not reach here
      })
    }

    // Apply grading filters - Skip for searches that don't support filters
    if (shouldShowFilters() && !selectedGradings.includes('all')) {
      filtered = filtered.filter(hadith => {
        const gradingText = [
          hadith.majlisiGrading,
          hadith.mohseniGrading,
          hadith.behbudiGrading,
          ...(hadith.gradingsFull || []).map(g => `${g.grade_en} ${g.grade_ar}`).join(' ')
        ].join(' ').toLowerCase()

        // Check if hadith matches any of the selected gradings
        return selectedGradings.some(selectedGrading => {
          const selectedOption = GRADING_OPTIONS.find(opt => opt.value === selectedGrading)
          if (!selectedOption) return false

          // Special case for "lam-yukhrijhu" - check for "لم يخرجه" OR no grading at all
          if (selectedGrading === 'lam-yukhrijhu') {
            const hasNoGrading = !hadith.majlisiGrading && 
                                !hadith.mohseniGrading && 
                                !hadith.behbudiGrading && 
                                (!hadith.gradingsFull || hadith.gradingsFull.length === 0)
            const hasLamYukhrijhu = gradingText.includes('لم يخرجه')
            return hasNoGrading || hasLamYukhrijhu
          }

          // Special case for "other" - check if it doesn't match common gradings but has some grading
          if (selectedGrading === 'other') {
            const hasGrading = gradingText.trim().length > 0
            const isCommonGrading = ['صحيح', 'حسن', 'موثق', 'قوي', 'ضعيف', 'مجهول', 'مرسل', 'لم يخرجه'].some(common => 
              gradingText.includes(common.toLowerCase())
            )
            return hasGrading && !isCommonGrading
          }

          // Regular keyword matching for other grading types
          return selectedOption?.keywords?.some(keyword => 
            gradingText.includes(keyword.toLowerCase())
          ) || false
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
    
    // For Arabic queries, check if the hadith's Arabic text matches the search query
    return (hadith: Hadith) => {
      return matchesArabicText(hadith.arabicText, searchQuery)
    }
  }, [isArabicSearchQuery, searchQuery])

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
    <section id="search-results" className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 mt-8">
      {/* Search Header */}
      <div className="flex flex-col gap-4 mb-6">
        {/* Title and Clear Button Row */}
        <div className="flex items-start sm:items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-xl sm:text-2xl font-bold text-primary truncate">
                Search Results {searchContext === 'al-kafi' ? 'in Al-Kāfi' : searchContext === 'uyun-akhbar-al-rida' ? 'in ʿUyūn akhbār al-Riḍā' : ''} for "{searchQuery}"
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted">
              <span className="flex items-center gap-1">
                <span className="font-medium text-accent-primary">
                  {filteredAndSortedResults.length}
                </span>
                {filteredAndSortedResults.length === 1 ? 'hadith' : 'hadiths'} found
              </span>
              {hasActiveFilters() && shouldShowFilters() && (
                <div className="flex flex-wrap gap-2">
                  {selectedGradings.map(grading => {
                    const option = GRADING_OPTIONS.find(opt => opt.value === grading)
                    return option ? (
                      <span 
                        key={grading} 
                        className={clsx(
                          "px-2 py-1 bg-accent-primary/10 rounded-full text-xs font-medium",
                          getGradingTextColor(grading)
                        )}
                      >
                        {option.label}
                      </span>
                    ) : null
                  })}
                  {searchOptions.exactPhrase && (
                    <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs font-medium">
                      Exact Phrase
                    </span>
                  )}
                  {searchOptions.exactWords && (
                    <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs font-medium">
                      Exact Words
                    </span>
                  )}
                  {searchOptions.flexibleMatching && (
                    <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-xs font-medium">
                      Flexible Match
                    </span>
                  )}
                </div>
              )}
              {filteredAndSortedResults.length !== searchResults.length && shouldShowFilters() && (
                <span className="text-muted/80">
                  (filtered from {searchResults.length} total)
                </span>
              )}
            </div>
          </div>
          
          <button
            onClick={onClearSearch}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card border border-theme hover:bg-hover-color text-secondary hover:text-primary transition-all active:scale-95 shadow-soft shrink-0 min-h-[44px]"
            title="Clear search and go back"
          >
            <IconX className="h-4 w-4" />
            <span className="text-sm font-medium hidden sm:inline">Clear</span>
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
                'flex items-center gap-2 px-4 py-2 rounded-lg border transition-all active:scale-95 min-h-[44px] select-none',
                showFilters
                  ? 'bg-accent-primary text-white border-accent-primary shadow-soft'
                  : 'bg-card text-primary border-theme hover:bg-hover-color'
              )}
            >
              <IconFilter className="h-4 w-4" />
              <span className="font-medium select-none">
                {showFilters ? 'Hide' : 'Show'} Filters
              </span>
              {hasActiveFilters() && (
                <span className="bg-white/20 text-xs px-2 py-0.5 rounded-full font-medium min-w-[20px] text-center select-none">
                  {selectedGradings.length}
                </span>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Filters Panel */}
      <div className={clsx(
        "transition-all duration-300 ease-in-out overflow-hidden mb-6",
        showFilters && shouldShowFilters() 
          ? "max-h-[1000px] opacity-100" 
          : "max-h-0 opacity-0"
      )}>
        {shouldShowFilters() && (
          <div className="bg-card border border-theme rounded-xl shadow-soft overflow-hidden">
            {/* Filter Header */}
            <div className="bg-gradient-to-r from-card to-card-hover border-b border-theme px-4 sm:px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <IconFilter className="h-5 w-5 text-accent-primary" />
                  <h3 className="font-semibold text-primary select-none">Filter Options</h3>
                </div>
                <button
                  onClick={() => setShowFilters(false)}
                  className="sm:hidden p-2 rounded-lg hover:bg-hover-color transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                >
                  <IconX className="h-4 w-4 text-secondary" />
                </button>
              </div>
              <p className="text-sm text-muted mt-1 select-none">
                Select multiple grading types to refine your search results
                {hasActiveFilters() && (
                  <span className="text-accent-primary font-medium select-none"> • {selectedGradings.length} filter{selectedGradings.length > 1 ? 's' : ''} active</span>
                )}
              </p>
            </div>
            
            {/* Filter Content */}
            <div className="p-4 sm:p-6">
              {/* Grading Filter */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-sm font-medium text-primary select-none">
                    Hadith Grading Classification
                  </label>
                  <div className="flex items-center gap-2">
                    {!areAllGradingsSelected() && !selectedGradings.includes('all') && (
                      <button
                        onClick={selectAllGradings}
                        className="text-xs text-accent-primary hover:text-accent-secondary transition-colors px-2 py-1 rounded hover:bg-accent-primary/10 select-none"
                      >
                        Select all
                      </button>
                    )}
                    {hasActiveFilters() && (
                      <button
                        onClick={clearAllFilters}
                        className="text-xs text-muted hover:text-primary transition-colors px-2 py-1 rounded hover:bg-hover-color select-none"
                      >
                        Clear all
                      </button>
                    )}
                  </div>
                </div>
                
                {/* Desktop: Grid Layout */}
                <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {GRADING_OPTIONS.map((option, index) => {
                    const isSelected = selectedGradings.includes(option.value)
                    const isAllOption = option.value === 'all'
                    return (
                      <label 
                        key={option.value} 
                        className={clsx(
                          "flex items-center gap-3 cursor-pointer group p-3 rounded-lg border transition-all duration-200 ease-out select-none",
                          filtersLoaded ? "opacity-100" : "opacity-0",
                          isSelected 
                            ? "border-accent-primary bg-accent-primary/5 hover:bg-accent-primary/10" 
                            : "border-theme/50 hover:border-gray-200 dark:hover:border-gray-500 hover:bg-card-hover/30"
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
                          className="text-accent-primary focus:ring-0 focus:ring-offset-0 focus:outline-none border-theme w-4 h-4"
                        />
                        <span className={clsx(
                          "text-sm transition-colors font-medium leading-tight select-none",
                          getGradingTextColor(option.value)
                        )}>
                          {option.label}
                        </span>
                      </label>
                    )
                  })}
                </div>
                
                {/* Mobile: List Layout with better spacing */}
                <div className="sm:hidden space-y-3">
                  {GRADING_OPTIONS.map((option, index) => {
                    const isSelected = selectedGradings.includes(option.value)
                    const isAllOption = option.value === 'all'
                    return (
                      <label 
                        key={option.value} 
                        className={clsx(
                          "flex items-center gap-4 cursor-pointer group p-4 rounded-lg border transition-all duration-200 ease-out min-h-[56px] active:scale-[0.98] select-none",
                          filtersLoaded ? "opacity-100" : "opacity-0",
                          isSelected 
                            ? "border-accent-primary bg-accent-primary/5" 
                            : "border-theme/50 hover:border-gray-200 dark:hover:border-gray-500 hover:bg-card-hover/30"
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
                          className="text-accent-primary focus:ring-0 focus:ring-offset-0 focus:outline-none border-theme w-5 h-5"
                        />
                        <span className={clsx(
                          "transition-colors font-medium flex-1 select-none",
                          getGradingTextColor(option.value)
                        )}>
                          {option.label}
                        </span>
                      </label>
                    )
                  })}
                </div>
              </div>

              {/* Search Options */}
              <div className="border-t border-theme pt-6 mt-6">
                <label className="block text-sm font-medium text-primary mb-4 select-none">
                  Search Options <span className="text-xs text-muted font-normal select-none">(select one)</span>
                </label>
                <div className="space-y-3">
                  <label className={clsx(
                    "flex items-center gap-3 cursor-pointer group p-3 rounded-lg border border-theme/50 hover:border-gray-200 dark:hover:border-gray-500 hover:bg-card-hover/30 transition-all duration-200 ease-out select-none",
                    filtersLoaded ? "opacity-100" : "opacity-0"
                  )}>
                    <input
                      type="checkbox"
                      checked={searchOptions.exactPhrase}
                      onChange={(e) => handleSearchOptionChange('exactPhrase', e.target.checked)}
                      className="text-accent-primary focus:ring-0 focus:ring-offset-0 focus:outline-none border-theme w-4 h-4"
                    />
                    <div className="select-none">
                      <span className="text-sm font-medium text-primary select-none">Exact Phrase</span>
                      <p className="text-xs text-muted mt-1 select-none">Search for the exact phrase as written</p>
                    </div>
                  </label>
                  <label className={clsx(
                    "flex items-center gap-3 cursor-pointer group p-3 rounded-lg border border-theme/50 hover:border-gray-200 dark:hover:border-gray-500 hover:bg-card-hover/30 transition-all duration-200 ease-out select-none",
                    filtersLoaded ? "opacity-100" : "opacity-0"
                  )}>
                    <input
                      type="checkbox"
                      checked={searchOptions.exactWords}
                      onChange={(e) => handleSearchOptionChange('exactWords', e.target.checked)}
                      className="text-accent-primary focus:ring-0 focus:ring-offset-0 focus:outline-none border-theme w-4 h-4"
                    />
                    <div className="select-none">
                      <span className="text-sm font-medium text-primary select-none">Exact Words Only</span>
                      <p className="text-xs text-muted mt-1 select-none">Match whole words exactly (not as parts of other words)</p>
                    </div>
                  </label>
                  <label className={clsx(
                    "flex items-center gap-3 cursor-pointer group p-3 rounded-lg border border-theme/50 hover:border-gray-200 dark:hover:border-gray-500 hover:bg-card-hover/30 transition-all duration-200 ease-out select-none",
                    filtersLoaded ? "opacity-100" : "opacity-0"
                  )}>
                    <input
                      type="checkbox"
                      checked={searchOptions.flexibleMatching}
                      onChange={(e) => handleSearchOptionChange('flexibleMatching', e.target.checked)}
                      className="text-accent-primary focus:ring-0 focus:ring-offset-0 focus:outline-none border-theme w-4 h-4"
                    />
                    <div className="select-none">
                      <span className="text-sm font-medium text-primary select-none">Flexible Word Matching</span>
                      <p className="text-xs text-muted mt-1 select-none">Find word variations (e.g., "wrestling" matches "wrestle", "wrestled", "wrestler")</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Clear Filters */}
              {hasActiveFilters() && (
                <div className="border-t border-theme pt-4 mt-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex flex-col gap-2">
                    <span className="text-sm text-muted font-medium">Active filters:</span>
                    <div className="flex flex-wrap gap-2">
                      {selectedGradings.map(grading => {
                        const option = GRADING_OPTIONS.find(opt => opt.value === grading)
                        return option ? (
                          <span key={grading} className="inline-flex items-center gap-1 px-3 py-1.5 bg-accent-primary/10 border border-accent-primary/20 text-accent-primary rounded-lg text-xs font-medium shadow-sm hover:shadow-md hover:scale-105 hover:bg-accent-primary/15 transition-all duration-200">
                            {option.label}
                            {/* Don't show X button for "All Gradings" */}
                            {grading !== 'all' && (
                              <button
                                onClick={() => handleGradingChange(grading, false)}
                                className="ml-1 hover:bg-accent-primary/20 dark:hover:bg-accent-primary/30 rounded-full p-0.5 flex items-center justify-center transition-all duration-200 hover:scale-110"
                                title={`Remove ${option.label} filter`}
                              >
                                <IconX className="h-3 w-3" />
                              </button>
                            )}
                          </span>
                        ) : null
                      })}
                      {searchOptions.exactPhrase && (
                        <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700/50 text-blue-700 dark:text-blue-300 rounded-lg text-xs font-medium shadow-sm hover:shadow-md hover:scale-105 hover:bg-blue-150 dark:hover:bg-blue-900/40 transition-all duration-200">
                          Exact Phrase
                          <button
                            onClick={() => handleSearchOptionChange('exactPhrase', false)}
                            className="ml-1 hover:bg-blue-200 dark:hover:bg-blue-800/50 rounded-full p-0.5 flex items-center justify-center transition-all duration-200 hover:scale-110"
                            title="Remove Exact Phrase filter"
                          >
                            <IconX className="h-3 w-3" />
                          </button>
                        </span>
                      )}
                      {searchOptions.exactWords && (
                        <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700/50 text-blue-700 dark:text-blue-300 rounded-lg text-xs font-medium shadow-sm hover:shadow-md hover:scale-105 hover:bg-blue-150 dark:hover:bg-blue-900/40 transition-all duration-200">
                          Exact Words
                          <button
                            onClick={() => handleSearchOptionChange('exactWords', false)}
                            className="ml-1 hover:bg-blue-200 dark:hover:bg-blue-800/50 rounded-full p-0.5 flex items-center justify-center transition-all duration-200 hover:scale-110"
                            title="Remove Exact Words filter"
                          >
                            <IconX className="h-3 w-3" />
                          </button>
                        </span>
                      )}
                      {searchOptions.flexibleMatching && (
                        <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-purple-100 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-700/50 text-purple-700 dark:text-purple-300 rounded-lg text-xs font-medium shadow-sm hover:shadow-md hover:scale-105 hover:bg-purple-150 dark:hover:bg-purple-900/40 transition-all duration-200">
                          Flexible Match
                          <button
                            onClick={() => handleSearchOptionChange('flexibleMatching', false)}
                            className="ml-1 hover:bg-purple-200 dark:hover:bg-purple-800/50 rounded-full p-0.5 flex items-center justify-center transition-all duration-200 hover:scale-110"
                            title="Remove Flexible Match filter"
                          >
                            <IconX className="h-3 w-3" />
                          </button>
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={clearAllFilters}
                    className="text-sm text-muted hover:text-primary transition-colors px-3 py-2 rounded-lg hover:bg-hover-color font-medium border border-theme/50 hover:border-gray-200 dark:hover:border-gray-500 active:scale-95 min-h-[40px] shrink-0"
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
          <div className="text-center py-12 pb-80">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-card border border-theme flex items-center justify-center">
                <IconSearch className="h-7 w-7 text-muted" />
              </div>
              <h3 className="text-lg font-medium text-primary mb-2">
                {searchResults.length === 0 ? 'No Results Found' : 'No Results Match Filters'}
              </h3>
              <p className="text-muted mb-4">
                {searchResults.length === 0 
                  ? `No hadiths found for "${searchQuery}"${searchContext === 'al-kafi' ? ' in Al-Kāfi' : searchContext === 'uyun-akhbar-al-rida' ? ' in ʿUyūn akhbār al-Riḍā' : ''}`
                  : 'No hadiths match the selected filters'
                }
              </p>
              <div className="flex flex-col sm:flex-row gap-3 items-center justify-center">
                {searchResults.length === 0 ? (
                  <p className="text-sm text-muted">
                    Try a different search term or check your spelling
                  </p>
                ) : (
                  <>
                    <p className="text-sm text-muted">
                      Try adjusting your filters
                    </p>
                    {hasActiveFilters() && (
                      <button
                        onClick={clearAllFilters}
                        className="px-4 py-2 bg-accent-primary text-white rounded-lg hover:bg-accent-secondary transition-colors text-sm font-medium active:scale-95"
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
        <div className="flex flex-col items-center gap-4 mt-12 mb-8">
          {/* Desktop Pagination */}
          <div className="hidden sm:flex items-center gap-2">
            {/* Previous Button */}
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={clsx(
                'flex items-center gap-2 px-4 py-2 rounded-lg border transition-all active:scale-95',
                currentPage === 1
                  ? 'text-muted border-theme/50 cursor-not-allowed opacity-50'
                  : 'text-primary border-theme hover:bg-hover-color'
              )}
            >
              <IconChevronLeft className="h-4 w-4" />
              <span>Previous</span>
            </button>

            {/* Page Numbers */}
            <div className="flex items-center gap-1 mx-2">
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
                      'w-10 h-10 rounded-lg border transition-all active:scale-95',
                      currentPage === pageNum
                        ? 'bg-accent-primary text-white border-accent-primary shadow-soft'
                        : 'text-primary border-theme hover:bg-hover-color'
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
                'flex items-center gap-2 px-4 py-2 rounded-lg border transition-all active:scale-95',
                currentPage === totalPages
                  ? 'text-muted border-theme/50 cursor-not-allowed opacity-50'
                  : 'text-primary border-theme hover:bg-hover-color'
              )}
            >
              <span>Next</span>
              <IconChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Mobile Pagination */}
          <div className="sm:hidden flex items-center justify-between w-full">
            {/* Previous Button */}
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={clsx(
                'flex items-center gap-2 px-4 py-3 rounded-lg border transition-all active:scale-95 min-h-[48px]',
                currentPage === 1
                  ? 'text-muted border-theme/50 cursor-not-allowed opacity-50'
                  : 'text-primary border-theme hover:bg-hover-color'
              )}
            >
              <IconChevronLeft className="h-4 w-4" />
              <span>Previous</span>
            </button>

            {/* Page Info */}
            <div className="flex items-center gap-2 px-4 py-2 bg-card border border-theme rounded-lg">
              <span className="text-sm text-muted">Page</span>
              <span className="text-sm font-medium text-primary">{currentPage}</span>
              <span className="text-sm text-muted">of</span>
              <span className="text-sm font-medium text-primary">{totalPages}</span>
            </div>

            {/* Next Button */}
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={clsx(
                'flex items-center gap-2 px-4 py-3 rounded-lg border transition-all active:scale-95 min-h-[48px]',
                currentPage === totalPages
                  ? 'text-muted border-theme/50 cursor-not-allowed opacity-50'
                  : 'text-primary border-theme hover:bg-hover-color'
              )}
            >
              <span>Next</span>
              <IconChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Pagination Info */}
          <div className="text-center text-sm text-muted">
            Showing {startIndex + 1}-{Math.min(endIndex, filteredAndSortedResults.length)} of {filteredAndSortedResults.length} results
          </div>
        </div>
      )}
    </section>
  )
}
