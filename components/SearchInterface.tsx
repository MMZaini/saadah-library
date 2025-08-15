'use client'

import { useState, useMemo, useEffect } from 'react'
import { Hadith } from '@/lib/api'
import HadithCard from './HadithCard'
import { IconSearch, IconFilter, IconChevronLeft, IconChevronRight, IconX } from './Icons'
import { useSettings } from '@/lib/settings-context'
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
  const [selectedGrading, setSelectedGrading] = useState('all')
  const [showFilters, setShowFilters] = useState(false)

  // Helper function to determine if filters should be shown
  const shouldShowFilters = () => {
    return searchContext === 'all-books' || searchContext === 'al-kafi'
  }

  // Reset pagination when search query changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, selectedGrading])

  // Filter and sort results
  const filteredAndSortedResults = useMemo(() => {
    let filtered = [...searchResults]

    // Apply grading filter - Skip for searches that don't support filters
    if (selectedGrading !== 'all' && shouldShowFilters()) {
      const selectedOption = GRADING_OPTIONS.find(opt => opt.value === selectedGrading)
      if (selectedOption) {
        filtered = filtered.filter(hadith => {
          const gradingText = [
            hadith.majlisiGrading,
            hadith.mohseniGrading,
            hadith.behbudiGrading,
            ...(hadith.gradingsFull || []).map(g => `${g.grade_en} ${g.grade_ar}`).join(' ')
          ].join(' ').toLowerCase()

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
      }
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
  }, [searchResults, selectedGrading])

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-2xl font-bold text-primary">
              Search Results {searchContext === 'al-kafi' ? 'in Al-Kāfi' : searchContext === 'uyun-akhbar-al-rida' ? 'in ʿUyūn akhbār al-Riḍā' : ''} for "{searchQuery}"
            </h2>
            <button
              onClick={onClearSearch}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card border border-theme hover:bg-hover-color text-secondary hover:text-primary transition-all active:scale-95 shadow-soft"
              title="Clear search and go back"
            >
              <IconX className="h-4 w-4" />
              <span className="text-sm font-medium hidden sm:inline">Clear</span>
            </button>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted">
            <span>
              {filteredAndSortedResults.length} {filteredAndSortedResults.length === 1 ? 'hadith' : 'hadiths'} found
              {selectedGrading !== 'all' && shouldShowFilters() && (
                <span className="ml-1">
                  ({GRADING_OPTIONS.find(opt => opt.value === selectedGrading)?.label})
                </span>
              )}
            </span>
            {filteredAndSortedResults.length !== searchResults.length && shouldShowFilters() && (
              <span className="text-accent-primary">
                Filtered from {searchResults.length} total
              </span>
            )}
          </div>
        </div>

        {/* Filter Toggle */}
        {shouldShowFilters() && (
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={clsx(
              'flex items-center gap-2 px-4 py-2 rounded-lg border transition-all active:scale-95',
              showFilters
                ? 'bg-accent-primary text-white border-accent-primary'
                : 'bg-card text-primary border-theme hover:bg-hover-color'
            )}
          >
            <IconFilter className="h-4 w-4" />
            <span className="hidden sm:inline">Filters</span>
            {selectedGrading !== 'all' && (
              <span className="bg-white/20 text-xs px-2 py-0.5 rounded-full">
                1
              </span>
            )}
          </button>
        )}
      </div>

      {/* Filters Panel */}
      {showFilters && shouldShowFilters() && (
        <div className="bg-card border border-theme rounded-xl p-4 sm:p-6 mb-6 shadow-soft">
          <div>
            {/* Grading Filter */}
            <div>
              <label className="block text-sm font-medium text-primary mb-3">
                Filter by Grading
              </label>
              <div className="space-y-2">
                {GRADING_OPTIONS.map((option) => (
                  <label key={option.value} className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="radio"
                      name="grading"
                      value={option.value}
                      checked={selectedGrading === option.value}
                      onChange={(e) => setSelectedGrading(e.target.value)}
                      className="text-accent-primary focus:ring-accent-primary border-theme"
                    />
                    <span className="text-sm text-secondary group-hover:text-primary transition-colors">
                      {option.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Clear Filters */}
          {selectedGrading !== 'all' && (
            <div className="border-t border-theme pt-4 mt-6">
              <button
                onClick={() => {
                  setSelectedGrading('all')
                }}
                className="text-sm text-muted hover:text-primary transition-colors"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* Results */}
      <div className="space-y-6">
        {currentPageResults.length > 0 ? (
          currentPageResults.map((hadith, idx) => (
            <HadithCard
              key={hadith._id ?? `${hadith.bookId ?? 'book'}-${hadith.id ?? idx}`}
              hadith={hadith}
              showViewChapter={true}
            />
          ))
        ) : !isSearching ? (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <p className="text-muted mb-2">
                {searchResults.length === 0 
                  ? `No hadiths found for "${searchQuery}"${searchContext === 'al-kafi' ? ' in Al-Kāfi' : searchContext === 'uyun-akhbar-al-rida' ? ' in ʿUyūn akhbār al-Riḍā' : ''}`
                  : 'No hadiths match the selected filters'
                }
              </p>
              <p className="text-sm text-muted">
                {searchResults.length === 0 
                  ? 'Try a different search term'
                  : 'Try adjusting your filters or clearing them'
                }
              </p>
              {searchResults.length > 0 && selectedGrading !== 'all' && (
                <button
                  onClick={() => setSelectedGrading('all')}
                  className="mt-3 text-accent-primary hover:underline text-sm"
                >
                  Clear grading filter
                </button>
              )}
            </div>
          </div>
        ) : null}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center mt-12 mb-8">
          <div className="flex items-center gap-2">
            {/* Previous Button */}
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={clsx(
                'flex items-center gap-2 px-3 py-2 rounded-lg border transition-all active:scale-95',
                currentPage === 1
                  ? 'text-muted border-theme/50 cursor-not-allowed opacity-50'
                  : 'text-primary border-theme hover:bg-hover-color'
              )}
            >
              <IconChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Previous</span>
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
                        ? 'bg-accent-primary text-white border-accent-primary'
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
                'flex items-center gap-2 px-3 py-2 rounded-lg border transition-all active:scale-95',
                currentPage === totalPages
                  ? 'text-muted border-theme/50 cursor-not-allowed opacity-50'
                  : 'text-primary border-theme hover:bg-hover-color'
              )}
            >
              <span className="hidden sm:inline">Next</span>
              <IconChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Pagination Info */}
      {totalPages > 1 && (
        <div className="text-center text-sm text-muted mb-8">
          Showing {startIndex + 1}-{Math.min(endIndex, filteredAndSortedResults.length)} of {filteredAndSortedResults.length} results
          {totalPages > 1 && ` (Page ${currentPage} of ${totalPages})`}
        </div>
      )}
    </section>
  )
}
