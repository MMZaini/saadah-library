'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { alKafiApi, thaqalaynApi, ChapterInfo, BookInfo } from '@/lib/api'
import HadithCard from './HadithCard'
import { IconBook, IconChevronDown, IconChevronRight } from './Icons'
import { useNavigation } from '@/lib/navigation-context'
import clsx from 'clsx'

interface ChapterSummary {
  chapter: string;
  chapterInCategoryId: number;
  hadithCount: number;
}

interface CategorySummary {
  category: string;
  categoryId: string;
  chapters: Record<string, ChapterSummary>;
  totalHadiths: number;
}

interface VolumeSummary {
  [categoryKey: string]: CategorySummary;
}

interface BookStructureExplorerProps {
  className?: string
}

export default function BookStructureExplorer({ className }: BookStructureExplorerProps) {
  const router = useRouter()
  const navigation = useNavigation()

  const savedState = navigation.getExplorerState()

  const [selectedVolume, setSelectedVolume] = useState<string | number | 'all'>(
    savedState?.selectedVolume !== undefined ? savedState.selectedVolume : 1
  )
  const [volumeSummary, setVolumeSummary] = useState<VolumeSummary>({})
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    () => new Set(savedState?.expandedCategories || [])
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const initialLoad = useRef(true)

  const alKafiVolumes = Array.from({ length: 8 }, (_, i) => i + 1)
  const volumeOptions = [
    ...alKafiVolumes.map(vol => ({ value: vol, label: `Volume ${vol}` })),
    { value: 'all' as const, label: 'All Volumes' }
  ]

  // Load volume summary (categories and chapter counts)
  useEffect(() => {
    const loadVolumeSummary = async () => {
      setLoading(true)
      setError(null)
      if (!initialLoad.current) {
        setExpandedCategories(new Set())
      }

      try {
        let hadiths
        
        if (selectedVolume === 'all') {
          // Load hadiths from all Al-Kafi volumes
          const allVolumeHadiths = await Promise.all(
            alKafiVolumes.map(vol => alKafiApi.getVolumeHadiths(vol))
          )
          hadiths = allVolumeHadiths.flat()
        } else {
          // Load hadiths from specific volume
          hadiths = await alKafiApi.getVolumeHadiths(Number(selectedVolume))
        }

        if (!hadiths || hadiths.length === 0) {
          setError('No hadiths found for this selection')
          return
        }
        
        // Build summary structure
        const summary: VolumeSummary = {}
        
        hadiths.forEach(hadith => {
          const categoryKey = hadith.category || 'Uncategorized'
          const chapterKey = hadith.chapter || 'No Chapter'
          
          if (!summary[categoryKey]) {
            summary[categoryKey] = {
              category: categoryKey,
              categoryId: hadith.categoryId || '',
              chapters: {},
              totalHadiths: 0
            }
          }
          
          if (!summary[categoryKey].chapters[chapterKey]) {
            summary[categoryKey].chapters[chapterKey] = {
              chapter: chapterKey,
              chapterInCategoryId: hadith.chapterInCategoryId || 0,
              hadithCount: 0
            }
          }
          
          summary[categoryKey].chapters[chapterKey].hadithCount++
          summary[categoryKey].totalHadiths++
        })

        // Sort chapters within each category
        Object.values(summary).forEach(category => {
          const sortedChapters: Record<string, ChapterSummary> = {}
          const sortedEntries = Object.entries(category.chapters)
            .sort(([,a], [,b]) => a.chapterInCategoryId - b.chapterInCategoryId)
          
          sortedEntries.forEach(([key, value]) => {
            sortedChapters[key] = value
          })
          
          category.chapters = sortedChapters
        })

        setVolumeSummary(summary)
      } catch (err) {
        setError(`Failed to load structure for selected volume(s)`)
        // Error logging removed
      } finally {
        setLoading(false)
      }
    }

    loadVolumeSummary()
    initialLoad.current = false
  }, [selectedVolume])

  // Restore scroll position on mount
  useEffect(() => {
    const pos = navigation.restoreScrollPosition()
    if (pos > 0) {
      requestAnimationFrame(() => {
        window.scrollTo(0, pos)
      })
    }
  }, [])

  // Persist explorer state when values change
  useEffect(() => {
    navigation.saveExplorerState({
      selectedVolume,
      expandedCategories: Array.from(expandedCategories)
    })
  }, [selectedVolume, expandedCategories])

  const toggleCategory = (categoryKey: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(categoryKey)) {
      newExpanded.delete(categoryKey)
    } else {
      newExpanded.add(categoryKey)
    }
    setExpandedCategories(newExpanded)
  }

  const handleChapterClick = (categoryId: string, chapterInCategoryId: number) => {
    // Save current state before navigation
    navigation.saveScrollPosition(window.scrollY)
    navigation.saveExplorerState({
      selectedVolume,
      expandedCategories: Array.from(expandedCategories)
    })

    // For Al-Kafi navigation, we'll use the first available volume or selectedVolume if it's a number
    const volumeForUrl = selectedVolume === 'all' ? 1 : selectedVolume
    router.push(`/al-kafi/volume/${volumeForUrl}/chapter/${categoryId}/${chapterInCategoryId}`)
  }

  const getTotalHadithsCount = () => {
    return Object.values(volumeSummary).reduce((total, category) => {
      return total + category.totalHadiths
    }, 0)
  }

  return (
    <div className={clsx('space-y-6', className)}>
      {/* Volume Selection */}
      <div className="bg-gradient-to-r from-white/90 to-gray-50/90 dark:from-gray-800/50 dark:to-gray-900/30 border border-theme rounded-2xl p-6 shadow-soft backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-accent-primary/20 to-accent-secondary/10 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-accent-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-primary mb-1">
                Al-Kāfi Volume Explorer
              </h3>
              <p className="text-sm text-secondary">
                Browse Al-Kāfi volumes individually or view the complete collection structure
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <select
                value={selectedVolume}
                onChange={(e) => {
                  const raw = e.target.value
                  const val = raw === 'all' ? 'all' : (isNaN(Number(raw)) ? raw : Number(raw))
                  setSelectedVolume(val)
                }}
                disabled={loading}
                className={clsx(
                  'appearance-none bg-card border border-theme',
                  'rounded-xl px-4 py-3 pr-12 text-lg font-semibold text-primary',
                  'shadow-soft hover:shadow-medium transition-all duration-200',
                  'focus:outline-none focus:ring-2 focus:ring-accent-primary/20 focus:border-accent-primary',
                  'hover:border-accent-primary/50 cursor-pointer min-w-[200px] max-w-[300px]',
                  loading && 'opacity-50 cursor-not-allowed'
                )}
              >
                {volumeOptions.map((option) => (
                  <option key={String(option.value)} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              
              {/* Custom dropdown arrow */}
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="w-5 h-5 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {!loading && getTotalHadithsCount() > 0 && (
          <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-theme">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500 dark:bg-green-400 shadow-soft"></div>
              <span className="text-sm font-semibold text-primary">
                {getTotalHadithsCount().toLocaleString()} hadiths
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500 dark:bg-blue-400 shadow-soft"></div>
              <span className="text-sm font-semibold text-primary">
                {Object.keys(volumeSummary).length} categories
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-purple-500 dark:bg-purple-400 shadow-soft"></div>
              <span className="text-sm font-semibold text-primary">
                {selectedVolume === 'all' ? 'All Al-Kāfi Volumes' : `Al-Kāfi Volume ${selectedVolume}`}
              </span>
            </div>
          </div>
        )}

        <p className="text-sm text-secondary mt-4">
          Browse the complete structure of the selected book. Click on categories to expand them and view chapters. Click on any chapter to read all hadiths in that chapter.
        </p>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="bg-card border border-theme rounded-xl p-12 shadow-soft">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-primary"></div>
            <span className="ml-3 text-secondary">Loading book structure...</span>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50/80 dark:bg-red-900/20 border border-red-200/60 dark:border-red-800/30 rounded-xl p-6 shadow-soft">
          <p className="text-red-800 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* Categories and Chapters */}
      {!loading && !error && Object.keys(volumeSummary).length > 0 && (
        <div className="space-y-6">
          {Object.entries(volumeSummary).map(([categoryKey, category]) => (
            <div
              key={categoryKey}
              className="bg-card border border-theme rounded-2xl shadow-soft hover:shadow-medium transition-all duration-200 overflow-y-hidden overflow-x-visible"
            >
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(categoryKey)}
                className="w-full px-6 py-5 flex items-center justify-between hover:bg-card-hover transition-all duration-200 group"
              >
                <div className="flex items-center gap-4">
                  <div className={`transition-transform duration-200 ${expandedCategories.has(categoryKey) ? 'rotate-90' : 'rotate-0'}`}>
                    <div className="w-8 h-8 bg-gradient-to-br from-accent-primary/20 to-accent-primary/10 rounded-full flex items-center justify-center group-hover:from-accent-primary/30 group-hover:to-accent-primary/20 transition-all duration-200">
                      <svg className="w-4 h-4 text-accent-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-primary text-left group-hover:text-accent-primary transition-colors">
                    {category.category}
                  </h3>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-sm font-semibold text-primary">
                      {category.totalHadiths} hadiths
                    </div>
                    <div className="text-xs text-secondary">
                      {Object.keys(category.chapters).length} chapters
                    </div>
                  </div>
                  <div className="w-2 h-12 bg-gradient-to-b from-accent-primary/20 via-accent-primary/10 to-transparent rounded-full"></div>
                </div>
              </button>

              {/* Chapters */}
              {expandedCategories.has(categoryKey) && (
                <div 
                  className="border-t border-theme p-4 sm:p-6 bg-gradient-to-r from-card/50 to-card/30 animate-in slide-in-from-top-2 duration-300"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                    {Object.entries(category.chapters).map(([chapterKey, chapter]) => (
                      <button
                        key={chapterKey}
                        onClick={() => handleChapterClick(category.categoryId, chapter.chapterInCategoryId)}
                        className="group relative bg-card rounded-xl p-4 sm:p-5 shadow-soft hover:shadow-medium transition-all duration-200 border border-theme hover:border-accent-primary/30 hover:scale-[1.02] text-left"
                      >
                        {/* Chapter number indicator */}
                        <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-accent-primary to-accent-secondary rounded-full flex items-center justify-center text-white text-xs font-bold shadow-medium">
                          {chapter.chapterInCategoryId}
                        </div>
                        
                        {/* Chapter content */}
                        <div className="pr-4">
                          <h4 className="font-semibold text-primary mb-3 leading-snug group-hover:text-accent-primary transition-colors line-clamp-2">
                            {chapter.chapter}
                          </h4>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-green-500 dark:bg-green-400"></div>
                              <span className="text-sm font-medium text-secondary">
                                {chapter.hadithCount} {chapter.hadithCount === 1 ? 'hadith' : 'hadiths'}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-1 text-secondary group-hover:text-accent-primary transition-colors">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </div>
                          </div>
                        </div>
                        
                        {/* Subtle hover gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-r from-accent-primary/5 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && Object.keys(volumeSummary).length === 0 && (
        <div className="bg-gradient-to-br from-card to-card/50 border border-theme rounded-2xl p-12 shadow-soft text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-accent-primary/20 to-accent-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-accent-primary/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-primary mb-2">No chapters found</h3>
          <p className="text-secondary">The selected book appears to be empty or still loading.</p>
        </div>
      )}
    </div>
  )
}
