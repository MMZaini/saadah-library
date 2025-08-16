'use client'

import { useState, useEffect } from 'react'
import { alKafiApi, thaqalaynApi, ChapterStructure, CategoryInfo, ChapterInfo, Hadith, BookInfo } from '@/lib/api'
import HadithCard from './HadithCard'
import { IconBook, IconChevronDown, IconChevronRight } from './Icons'
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

interface AlKafiBookBrowserProps {
  initialVolume?: number
  className?: string
}

export default function AlKafiBookBrowser({ initialVolume = 1, className }: AlKafiBookBrowserProps) {
  const [selectedVolume, setSelectedVolume] = useState<string | number | 'all'>(initialVolume)
  const [volumeSummary, setVolumeSummary] = useState<VolumeSummary>({})
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [selectedChapter, setSelectedChapter] = useState<{ category: string; chapter: string; categoryId: string; chapterId: number } | null>(null)
  const [chapterHadiths, setChapterHadiths] = useState<Hadith[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingChapter, setLoadingChapter] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const alKafiVolumes = Array.from({ length: 8 }, (_, i) => i + 1)
  const volumeOptions = [
    ...alKafiVolumes.map(vol => ({ value: vol, label: `Volume ${vol}` })),
    { value: 'all' as const, label: 'All Volumes' }
  ]

  // Load volume summary (categories and chapter counts without full hadith content)
  useEffect(() => {
    const loadVolumeSummary = async () => {
      setLoading(true)
      setError(null)
      setSelectedChapter(null)
      setChapterHadiths([])
      setExpandedCategories(new Set())

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
        setError(`Failed to load structure for Volume ${selectedVolume}`)
        // Error logging removed
      } finally {
        setLoading(false)
      }
    }

    loadVolumeSummary()
  }, [selectedVolume])

  // Load specific chapter hadiths
  const loadChapterHadiths = async (category: string, chapter: string, categoryId: string, chapterId: number) => {
    setLoadingChapter(true)
    try {
      let allHadiths
      
      if (selectedVolume === 'all') {
        // Load hadiths from all Al-Kafi volumes
        const allVolumeHadiths = await Promise.all(
          alKafiVolumes.map(vol => alKafiApi.getVolumeHadiths(vol))
        )
        allHadiths = allVolumeHadiths.flat()
      } else {
        // Load hadiths from specific volume
        allHadiths = await alKafiApi.getVolumeHadiths(Number(selectedVolume))
      }
      
      // Filter hadiths for the specific chapter
      const chapterHadiths = allHadiths.filter(hadith => 
        hadith.category === category && hadith.chapter === chapter
      )
      
      setChapterHadiths(chapterHadiths)
    } catch (err) {
      // Error logging removed
      setChapterHadiths([])
    } finally {
      setLoadingChapter(false)
    }
  }

  const toggleCategory = (categoryKey: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(categoryKey)) {
      newExpanded.delete(categoryKey)
    } else {
      newExpanded.add(categoryKey)
    }
    setExpandedCategories(newExpanded)
  }

  const selectChapter = (category: string, chapter: string, categoryId: string, chapterId: number) => {
    const newSelection = { category, chapter, categoryId, chapterId }
    setSelectedChapter(newSelection)
    loadChapterHadiths(category, chapter, categoryId, chapterId)
  }

  const getTotalHadithsCount = (): number => {
    return Object.values(volumeSummary).reduce((total, category) => {
      return total + category.totalHadiths
    }, 0)
  }

  return (
    <div className={clsx('space-y-6', className)}>
      {/* Volume Selector */}
      <div className="bg-gradient-to-r from-white to-slate-50/80 dark:from-slate-800/50 dark:to-slate-900/30 border border-slate-200/60 dark:border-slate-700/50 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-4 mb-4">
          <IconBook className="h-8 w-8 text-primary" />
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-1">
              Al-Kāfi Complete Chapter Tree
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Browse the complete structure of Al-Kāfi. Select a specific volume or "All Volumes", expand categories, and select chapters to read all hadiths with full details including gradings.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">

            <div className="relative">
              <select
                id="volume-browser-select"
                value={selectedVolume}
                onChange={(e) => {
                  const raw = e.target.value
                  const parsed = raw === 'all' ? 'all' : isNaN(Number(raw)) ? raw : Number(raw)
                  setSelectedVolume(parsed)
                }}
                disabled={loading}
                className={clsx(
                  'appearance-none bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600',
                  'rounded-xl px-4 py-2.5 pr-12 font-semibold text-slate-900 dark:text-slate-100',
                  'shadow-sm hover:shadow-md transition-all duration-200',
                  'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary',
                  'hover:border-primary/50 cursor-pointer min-w-[130px]',
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
                <svg className="w-4 h-4 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {!loading && getTotalHadithsCount() > 0 && (
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500 shadow-sm"></div>
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {getTotalHadithsCount().toLocaleString()} hadiths
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500 shadow-sm"></div>
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {Object.keys(volumeSummary).length} categories
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-purple-500 shadow-sm"></div>
                <span className="font-semibold text-slate-700 dark:text-slate-300">{selectedVolume === 'all' ? 'All Volumes' : `Volume ${selectedVolume}`}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {loading && (
        <div className="bg-card border border-theme rounded-xl p-12 shadow-soft">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-3 text-muted">Loading book structure...</span>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-xl p-4">
          <p className="text-red-800 dark:text-red-300 text-sm">{error}</p>
        </div>
      )}

      {!loading && !error && Object.keys(volumeSummary).length > 0 && (
        <div className="grid lg:grid-cols-3 gap-4 lg:gap-6">
          {/* Chapter Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-card border border-theme rounded-xl shadow-soft max-h-[60vh] sm:max-h-[70vh] lg:max-h-[80vh] overflow-y-auto overflow-x-visible">
              <div className="p-3 sm:p-4 border-b border-theme sticky top-0 bg-card z-10">
                <h4 className="font-semibold text-primary text-sm sm:text-base">
                  <span className="sm:hidden">Categories</span>
                  <span className="hidden sm:inline">Categories & Chapters</span>
                </h4>
                <p className="text-xs text-muted mt-1 hidden sm:block">Click to expand categories</p>
              </div>
              
              <div className="p-1 sm:p-2">
                {Object.entries(volumeSummary).map(([categoryKey, categoryInfo]) => (
                  <div key={categoryKey} className="mb-1 sm:mb-2">
                    {/* Category Header */}
                    <button
                      onClick={() => toggleCategory(categoryKey)}
                      className="w-full flex items-center gap-2 p-2 sm:p-3 rounded-lg hover:bg-card-hover active:bg-card-hover transition-colors text-left"
                    >
                      {expandedCategories.has(categoryKey) ? (
                        <IconChevronDown className="h-4 w-4 text-muted flex-shrink-0" />
                      ) : (
                        <IconChevronRight className="h-4 w-4 text-muted flex-shrink-0" />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-primary text-sm leading-tight">
                          {categoryInfo.category}
                        </div>
                        <div className="text-xs text-muted mt-1">
                          {categoryInfo.totalHadiths} hadiths • {Object.keys(categoryInfo.chapters).length} chapters
                        </div>
                      </div>
                    </button>

                    {/* Chapters */}
                    {expandedCategories.has(categoryKey) && (
                      <div className="ml-6 mt-1 space-y-1">
                        {Object.entries(categoryInfo.chapters).map(([chapterKey, chapterInfo]) => (
                          <button
                            key={`${categoryKey}-${chapterKey}`}
                            onClick={() => selectChapter(
                              categoryKey, 
                              chapterKey, 
                              categoryInfo.categoryId, 
                              chapterInfo.chapterInCategoryId
                            )}
                            className={clsx(
                              'w-full text-left p-2 rounded text-sm transition-colors',
                              selectedChapter?.category === categoryKey && selectedChapter?.chapter === chapterKey
                                ? 'bg-primary/10 text-primary border border-primary/20'
                                : 'hover:bg-card-hover text-secondary'
                            )}
                          >
                            <div className="leading-tight">
                              {chapterInfo.chapter}
                            </div>
                            <div className="text-xs text-muted mt-1">
                              {chapterInfo.hadithCount} hadiths
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Hadith Display */}
          <div className="lg:col-span-2">
            {selectedChapter ? (
              <div className="space-y-4">
                {/* Chapter Header */}
                <div className="bg-card border border-theme rounded-xl p-6 shadow-soft">
                  <h4 className="font-semibold text-primary mb-2">
                    {selectedChapter.category}
                  </h4>
                  <h5 className="text-secondary mb-4">
                    {selectedChapter.chapter}
                  </h5>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted">
                      {chapterHadiths.length} {chapterHadiths.length === 1 ? 'hadith' : 'hadiths'} in this chapter
                    </p>
                    {loadingChapter && (
                      <div className="flex items-center gap-2 text-sm text-muted">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                        Loading hadiths...
                      </div>
                    )}
                  </div>
                </div>

                {/* Hadiths */}
                <div className="space-y-6 max-h-[80vh] overflow-y-auto overflow-x-visible">
                  {loadingChapter ? (
                    <div className="bg-card border border-theme rounded-xl p-12 shadow-soft text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                      <p className="text-muted">Loading chapter hadiths...</p>
                    </div>
                  ) : chapterHadiths.length > 0 ? (
                    chapterHadiths.map((hadith) => (
                      <HadithCard key={hadith._id} hadith={hadith} />
                    ))
                  ) : (
                    <div className="bg-card border border-theme rounded-xl p-8 shadow-soft text-center">
                      <p className="text-muted">No hadiths found in this chapter.</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-card border border-theme rounded-xl p-12 shadow-soft text-center">
                <IconBook className="h-12 w-12 text-muted mx-auto mb-4" />
                <h4 className="text-lg font-medium text-primary mb-2">
                  Select a Chapter to Begin Reading
                </h4>
                <p className="text-muted mb-4">
                  Expand a category on the left and select a chapter to view its hadiths with complete text, Arabic content, and grading information.
                </p>
                <div className="text-sm text-muted">
                  <p>📖 Each hadith includes:</p>
                  <ul className="mt-2 space-y-1">
                    <li>• Complete English and Arabic text</li>
                    <li>• Chain of narration (Sanad)</li>
                    <li>• Scholarly grading and authentication</li>
                    <li>• Source references and links</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
