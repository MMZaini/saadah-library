'use client'

import { useState, useEffect } from 'react'
import { bookApi, ChapterStructure, Hadith } from '@/lib/api'
import HadithCard from '@/components/HadithCard'
import { IconBook, IconChevronDown, IconChevronRight } from '@/components/Icons'
import clsx from 'clsx'
import { makeVolumeOptions, getVolumeLabelForValue } from '@/lib/volume-utils'

interface GenericBookBrowserProps {
  bookId: string
  bookConfig?: any | null
  className?: string
}

export default function GenericBookBrowser({ bookId, bookConfig = null, className }: GenericBookBrowserProps) {
  const [selectedVolume, setSelectedVolume] = useState<string | 'all'>(() => {
    if (bookConfig?.hasMultipleVolumes) return bookConfig?.volumes?.[0] || 'all'
    return bookId
  })

  const [volumeSummary, setVolumeSummary] = useState<Record<string, any>>({})
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [selectedChapter, setSelectedChapter] = useState<{ category: string; chapter: string; categoryId: string; chapterId: number } | null>(null)
  const [chapterHadiths, setChapterHadiths] = useState<Hadith[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingChapter, setLoadingChapter] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const volumesList = bookConfig?.hasMultipleVolumes ? bookConfig.volumes : [bookId]
  const isMulti = !!bookConfig?.hasMultipleVolumes
  const volumeOptions = makeVolumeOptions(volumesList)
  const displayTitle = bookConfig?.englishName || bookId
  const volumesCount = (Array.isArray(volumesList) && volumesList.length) || 1

  useEffect(() => {
    const loadVolumeSummary = async () => {
      setLoading(true)
      setError(null)
      setExpandedCategories(new Set())
      setSelectedChapter(null)
      setChapterHadiths([])

      try {
        let summary: Record<string, any> = {}

        if (selectedVolume === 'all') {
          const promises = (volumesList || []).map(async (vol: any, idx: number) => {
            const hadiths = await bookApi.getBookHadiths(vol)
            return { volume: vol, hadiths }
          })

          const results = await Promise.all(promises)
          results.forEach(({ volume, hadiths }: any) => {
            const volNum = (String(volume).match(/-Volume-(\d+)-/) || [])[1] || ''
            hadiths.forEach((hadith: Hadith) => {
              const categoryKey = `${hadith.category || 'Uncategorized'}${volNum ? ` (Vol ${volNum})` : ''}`
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
          })
        } else {
          const hadiths = await bookApi.getBookHadiths(selectedVolume as any)
          hadiths.forEach((hadith: Hadith) => {
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
        }

        setVolumeSummary(summary)
      } catch (err) {
        console.error('Error loading volume summary:', err)
        setError('Failed to load book structure')
      } finally {
        setLoading(false)
      }
    }

    loadVolumeSummary()
  }, [selectedVolume, bookId, bookConfig])

  const toggleCategory = (categoryKey: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev)
      if (newSet.has(categoryKey)) newSet.delete(categoryKey)
      else newSet.add(categoryKey)
      return newSet
    })
  }

  const loadChapterHadiths = async (categoryId: string, chapterId: number, category: string, chapter: string) => {
    setLoadingChapter(true)
    setSelectedChapter({ category, chapter, categoryId, chapterId })

    try {
      let hadiths: Hadith[] = []

      if (selectedVolume === 'all') {
        const promises = (volumesList || []).map(async (vol: any) => {
          const volHadiths = await bookApi.getBookHadiths(vol)
          return volHadiths.filter(h => h.categoryId === categoryId && h.chapterInCategoryId === chapterId)
        })
        const results = await Promise.all(promises)
        hadiths = results.flat()
      } else {
        hadiths = await bookApi.getChapterHadiths(selectedVolume as any, categoryId, chapterId)
      }

      const sorted = hadiths.sort((a, b) => a.id - b.id)
      setChapterHadiths(sorted)
    } catch (err) {
      console.error('Error loading chapter hadiths:', err)
      setChapterHadiths([])
    } finally {
      setLoadingChapter(false)
    }
  }

  const clearChapterSelection = () => {
    setSelectedChapter(null)
    setChapterHadiths([])
  }

  const selectChapter = (category: string, chapter: string, categoryId: string, chapterId: number) => {
    setSelectedChapter({ category, chapter, categoryId, chapterId })
    loadChapterHadiths(categoryId, chapterId, category, chapter)
  }

  const getTotalHadithsCount = (): number => {
    return Object.values(volumeSummary).reduce((total, category: any) => total + (category.totalHadiths || 0), 0)
  }

  return (
    <div className={clsx('space-y-6', className)}>
      <div className="bg-gradient-to-r from-white to-slate-50/80 dark:from-slate-800/50 dark:to-slate-900/30 border border-slate-200/60 dark:border-slate-700/50 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-accent-primary/20 to-accent-secondary/10 rounded-xl flex items-center justify-center">
            <svg className="w-6 h-6 text-accent-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-primary mb-1">{displayTitle} Volume Explorer</h3>
            <p className="text-sm text-secondary">Browse {displayTitle} volumes individually or view the complete collection structure</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <select
                value={selectedVolume as any}
                onChange={(e) => {
                  const raw = e.target.value
                  const val = raw === 'all' ? 'all' : (isNaN(Number(raw)) ? raw : Number(raw))
                  setSelectedVolume(val as any)
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

              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="w-5 h-5 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {!loading && getTotalHadithsCount() > 0 && (
            <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-theme">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500 shadow-soft"></div>
                <span className="text-sm font-semibold text-primary">{getTotalHadithsCount().toLocaleString()} hadiths</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500 shadow-soft"></div>
                <span className="text-sm font-semibold text-primary">{Object.keys(volumeSummary).length} categories</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-purple-500 shadow-soft"></div>
                <span className="text-sm font-semibold text-primary">{selectedVolume === 'all' ? 'All Volumes' : `Volume ${String(selectedVolume).match(/-Volume-(\d+)-/)?.[1] || selectedVolume}`}</span>
              </div>
            </div>
          )}
        </div>

        <p className="text-sm text-secondary mt-4">Browse the complete structure of the selected book. Click on categories to expand them and view chapters. Click on any chapter to read all hadiths in that chapter.</p>
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
                {Object.entries(volumeSummary).map(([categoryKey, categoryInfo]: [string, any]) => (
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
                        {Object.entries(categoryInfo.chapters).map(([chapterKey, chapterInfo]: [string, any]) => (
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
                <div className="bg-gradient-to-r from-amber-50/80 to-yellow-50/80 dark:from-amber-900/20 dark:to-yellow-900/20 border border-amber-200/60 dark:border-amber-800/30 rounded-xl p-6 shadow-soft mb-8 backdrop-blur-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-amber-900 dark:text-amber-100 mb-2">
                        {selectedChapter.category}
                      </h2>
                      <p className="text-amber-700 dark:text-amber-300 mb-3 font-medium">
                        {selectedChapter.chapter}
                      </p>
                      <div className="flex items-center gap-3 text-sm">
                        <span className="bg-amber-200/80 dark:bg-amber-800/80 text-amber-900 dark:text-amber-100 px-3 py-1.5 rounded-full font-medium shadow-soft">
                          {selectedVolume === 'all' ? 'All Volumes' : getVolumeLabelForValue(selectedVolume)}
                        </span>
                        <span className="bg-amber-200/80 dark:bg-amber-800/80 text-amber-900 dark:text-amber-100 px-3 py-1.5 rounded-full font-medium shadow-soft">
                          {chapterHadiths.length} {chapterHadiths.length === 1 ? 'Hadith' : 'Hadiths'}
                        </span>
                      </div>
                    </div>

                    {loadingChapter && (
                      <div className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-300">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-amber-900 dark:border-amber-100"></div>
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
                    chapterHadiths.map((hadith, idx) => (
                      <HadithCard key={hadith._id ?? `${hadith.bookId ?? bookId}-${hadith.id ?? idx}` } hadith={hadith} />
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
