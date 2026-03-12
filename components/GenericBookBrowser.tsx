'use client'

import { useState, useEffect } from 'react'
import { bookApi, Hadith } from '@/lib/api'
import HadithCard from '@/components/HadithCard'
import { Book, ChevronDown, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { makeVolumeOptions, getVolumeLabelForValue } from '@/lib/volume-utils'
import { BookConfig } from '@/lib/books-config'

interface ChapterSummaryData {
  chapter: string
  chapterInCategoryId: number
  hadithCount: number
}

interface CategorySummaryData {
  category: string
  categoryId: string
  chapters: Record<string, ChapterSummaryData>
  totalHadiths: number
}

interface GenericBookBrowserProps {
  bookId: string
  bookConfig?: BookConfig | null
  className?: string
}

export default function GenericBookBrowser({
  bookId,
  bookConfig = null,
  className,
}: GenericBookBrowserProps) {
  const [selectedVolume, setSelectedVolume] = useState<string | 'all'>(() => {
    if (bookConfig?.hasMultipleVolumes) return bookConfig?.volumes?.[0] || 'all'
    return bookId
  })

  const [volumeSummary, setVolumeSummary] = useState<Record<string, CategorySummaryData>>({})
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [selectedChapter, setSelectedChapter] = useState<{
    category: string
    chapter: string
    categoryId: string
    chapterId: number
  } | null>(null)
  const [chapterHadiths, setChapterHadiths] = useState<Hadith[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingChapter, setLoadingChapter] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const volumesList = bookConfig?.hasMultipleVolumes ? bookConfig.volumes : [bookId]
  const volumeOptions = makeVolumeOptions(volumesList)
  const displayTitle = bookConfig?.englishName || bookId

  useEffect(() => {
    const loadVolumeSummary = async () => {
      setLoading(true)
      setError(null)
      setExpandedCategories(new Set())
      setSelectedChapter(null)
      setChapterHadiths([])

      try {
        const summary: Record<string, CategorySummaryData> = {}

        if (selectedVolume === 'all') {
          const promises = (volumesList || []).map(async (vol: string) => {
            const hadiths = await bookApi.getBookHadiths(vol)
            return { volume: vol, hadiths }
          })

          const results = await Promise.all(promises)
          results.forEach(({ volume, hadiths }) => {
            const volNum = (String(volume).match(/-Volume-(\d+)-/) || [])[1] || ''
            hadiths.forEach((hadith: Hadith) => {
              const categoryKey = `${hadith.category || 'Uncategorized'}${volNum ? ` (Vol ${volNum})` : ''}`
              const chapterKey = hadith.chapter || 'No Chapter'

              if (!summary[categoryKey]) {
                summary[categoryKey] = {
                  category: categoryKey,
                  categoryId: hadith.categoryId || '',
                  chapters: {},
                  totalHadiths: 0,
                }
              }

              if (!summary[categoryKey].chapters[chapterKey]) {
                summary[categoryKey].chapters[chapterKey] = {
                  chapter: chapterKey,
                  chapterInCategoryId: hadith.chapterInCategoryId || 0,
                  hadithCount: 0,
                }
              }

              summary[categoryKey].chapters[chapterKey].hadithCount++
              summary[categoryKey].totalHadiths++
            })
          })
        } else {
          const hadiths = await bookApi.getBookHadiths(selectedVolume)
          hadiths.forEach((hadith: Hadith) => {
            const categoryKey = hadith.category || 'Uncategorized'
            const chapterKey = hadith.chapter || 'No Chapter'

            if (!summary[categoryKey]) {
              summary[categoryKey] = {
                category: categoryKey,
                categoryId: hadith.categoryId || '',
                chapters: {},
                totalHadiths: 0,
              }
            }

            if (!summary[categoryKey].chapters[chapterKey]) {
              summary[categoryKey].chapters[chapterKey] = {
                chapter: chapterKey,
                chapterInCategoryId: hadith.chapterInCategoryId || 0,
                hadithCount: 0,
              }
            }

            summary[categoryKey].chapters[chapterKey].hadithCount++
            summary[categoryKey].totalHadiths++
          })
        }

        setVolumeSummary(summary)
      } catch {
        // Error logging removed
        setError('Failed to load book structure')
      } finally {
        setLoading(false)
      }
    }

    loadVolumeSummary()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedVolume, bookId, bookConfig])

  const toggleCategory = (categoryKey: string) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(categoryKey)) newSet.delete(categoryKey)
      else newSet.add(categoryKey)
      return newSet
    })
  }

  const loadChapterHadiths = async (
    categoryId: string,
    chapterId: number,
    category: string,
    chapter: string,
  ) => {
    setLoadingChapter(true)
    setSelectedChapter({ category, chapter, categoryId, chapterId })

    try {
      let hadiths: Hadith[] = []

      if (selectedVolume === 'all') {
        const promises = (volumesList || []).map(async (vol: string) => {
          const volHadiths = await bookApi.getBookHadiths(vol)
          return volHadiths.filter(
            (h) => h.categoryId === categoryId && h.chapterInCategoryId === chapterId,
          )
        })
        const results = await Promise.all(promises)
        hadiths = results.flat()
      } else {
        hadiths = await bookApi.getChapterHadiths(selectedVolume, categoryId, chapterId)
      }

      const sorted = hadiths.sort((a, b) => a.id - b.id)
      setChapterHadiths(sorted)
    } catch {
      // Error logging removed
      setChapterHadiths([])
    } finally {
      setLoadingChapter(false)
    }
  }

  const selectChapter = (
    category: string,
    chapter: string,
    categoryId: string,
    chapterId: number,
  ) => {
    setSelectedChapter({ category, chapter, categoryId, chapterId })
    loadChapterHadiths(categoryId, chapterId, category, chapter)
  }

  const getTotalHadithsCount = (): number => {
    return Object.values(volumeSummary).reduce(
      (total, category) => total + (category.totalHadiths || 0),
      0,
    )
  }

  return (
    <div className={cn('space-y-6', className)}>
      <div className="rounded-xl border border-border bg-surface-1 p-6">
        <div className="mb-4 flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-2">
            <svg
              className="h-5 w-5 text-foreground-muted"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-primary mb-1 text-lg font-bold">{displayTitle} Volume Explorer</h3>
            <p className="text-secondary text-sm">
              Browse {displayTitle} volumes individually or view the complete collection structure
            </p>
          </div>
        </div>

        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div className="relative">
              <select
                value={String(selectedVolume)}
                onChange={(e) => {
                  const raw = e.target.value
                  const val = raw === 'all' ? 'all' : isNaN(Number(raw)) ? raw : String(raw)
                  setSelectedVolume(val)
                }}
                disabled={loading}
                className={cn(
                  'border-theme bg-card appearance-none border',
                  'text-primary rounded-xl px-4 py-3 pr-12 text-lg font-semibold',
                  'hover:shadow-medium shadow-soft transition-all duration-200',
                  'focus:border-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-600/20',
                  'min-w-[200px] max-w-[300px] cursor-pointer hover:border-zinc-600/50',
                  loading && 'cursor-not-allowed opacity-50',
                )}
              >
                {volumeOptions.map((option) => (
                  <option key={String(option.value)} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                <svg
                  className="text-secondary h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>
          </div>

          {!loading && getTotalHadithsCount() > 0 && (
            <div className="border-theme flex flex-wrap items-center gap-4 border-t pt-4">
              <div className="flex items-center gap-2">
                <div className="shadow-soft h-3 w-3 rounded-full bg-green-500"></div>
                <span className="text-primary text-sm font-semibold">
                  {getTotalHadithsCount().toLocaleString()} hadiths
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="shadow-soft h-3 w-3 rounded-full bg-blue-500"></div>
                <span className="text-primary text-sm font-semibold">
                  {Object.keys(volumeSummary).length} categories
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="shadow-soft h-3 w-3 rounded-full bg-purple-500"></div>
                <span className="text-primary text-sm font-semibold">
                  {selectedVolume === 'all'
                    ? 'All Volumes'
                    : getVolumeLabelForValue(volumesList, selectedVolume)}
                </span>
              </div>
            </div>
          )}
        </div>

        <p className="text-secondary mt-4 text-sm">
          Browse the complete structure of the selected book. Click on categories to expand them and
          view chapters. Click on any chapter to read all hadiths in that chapter.
        </p>
      </div>

      {loading && (
        <div className="border-theme bg-card shadow-soft rounded-xl border p-12">
          <div className="flex items-center justify-center">
            <div className="border-primary h-8 w-8 animate-spin rounded-full border-b-2"></div>
            <span className="text-muted ml-3">Loading book structure...</span>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-800/30 dark:bg-red-900/20">
          <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
        </div>
      )}

      {!loading && !error && Object.keys(volumeSummary).length > 0 && (
        <div className="grid gap-4 lg:grid-cols-3 lg:gap-6">
          {/* Chapter Navigation */}
          <div className="lg:col-span-1">
            <div className="border-theme bg-card shadow-soft max-h-[60vh] overflow-y-auto overflow-x-visible rounded-xl border sm:max-h-[70vh] lg:max-h-[80vh]">
              <div className="border-theme bg-card sticky top-0 z-10 border-b p-3 sm:p-4">
                <h4 className="text-primary text-sm font-semibold sm:text-base">
                  <span className="sm:hidden">Categories</span>
                  <span className="hidden sm:inline">Categories & Chapters</span>
                </h4>
                <p className="text-muted mt-1 hidden text-xs sm:block">
                  Click to expand categories
                </p>
              </div>

              <div className="p-1 sm:p-2">
                {Object.entries(volumeSummary).map(
                  ([categoryKey, categoryInfo]: [string, CategorySummaryData]) => (
                    <div key={categoryKey} className="mb-1 sm:mb-2">
                      {/* Category Header */}
                      <button
                        onClick={() => toggleCategory(categoryKey)}
                        className="hover:bg-card-hover active:bg-card-hover flex w-full items-center gap-2 rounded-lg p-2 text-left transition-colors sm:p-3"
                      >
                        {expandedCategories.has(categoryKey) ? (
                          <ChevronDown className="text-muted h-4 w-4 flex-shrink-0" />
                        ) : (
                          <ChevronRight className="text-muted h-4 w-4 flex-shrink-0" />
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="text-primary text-sm font-medium leading-tight">
                            {categoryInfo.category}
                          </div>
                          <div className="text-muted mt-1 text-xs">
                            {categoryInfo.totalHadiths} hadiths •{' '}
                            {Object.keys(categoryInfo.chapters).length} chapters
                          </div>
                        </div>
                      </button>

                      {/* Chapters */}
                      {expandedCategories.has(categoryKey) && (
                        <div className="ml-6 mt-1 space-y-1">
                          {Object.entries(categoryInfo.chapters).map(
                            ([chapterKey, chapterInfo]: [string, ChapterSummaryData]) => (
                              <button
                                key={`${categoryKey}-${chapterKey}`}
                                onClick={() =>
                                  selectChapter(
                                    categoryKey,
                                    chapterKey,
                                    categoryInfo.categoryId,
                                    chapterInfo.chapterInCategoryId,
                                  )
                                }
                                className={cn(
                                  'w-full rounded p-2 text-left text-sm transition-colors',
                                  selectedChapter?.category === categoryKey &&
                                    selectedChapter?.chapter === chapterKey
                                    ? 'bg-primary/10 text-primary border-primary/20 border'
                                    : 'hover:bg-card-hover text-secondary',
                                )}
                              >
                                <div className="leading-tight">{chapterInfo.chapter}</div>
                                <div className="text-muted mt-1 text-xs">
                                  {chapterInfo.hadithCount} hadiths
                                </div>
                              </button>
                            ),
                          )}
                        </div>
                      )}
                    </div>
                  ),
                )}
              </div>
            </div>
          </div>

          {/* Hadith Display */}
          <div className="lg:col-span-2">
            {selectedChapter ? (
              <div className="space-y-4">
                {/* Chapter Header */}
                <div className="mb-8 rounded-xl border border-border bg-surface-1 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="mb-2 text-2xl font-bold text-foreground">
                        {selectedChapter.category}
                      </h2>
                      <p className="mb-3 font-medium text-foreground-muted">
                        {selectedChapter.chapter}
                      </p>
                      <div className="flex items-center gap-3 text-sm">
                        <span className="rounded-full bg-surface-2 px-3 py-1.5 font-medium text-foreground">
                          {selectedVolume === 'all'
                            ? 'All Volumes'
                            : getVolumeLabelForValue(volumesList, selectedVolume)}
                        </span>
                        <span className="rounded-full bg-surface-2 px-3 py-1.5 font-medium text-foreground">
                          {chapterHadiths.length}{' '}
                          {chapterHadiths.length === 1 ? 'Hadith' : 'Hadiths'}
                        </span>
                      </div>
                    </div>

                    {loadingChapter && (
                      <div className="flex items-center gap-2 text-sm text-foreground-muted">
                        <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-foreground-muted"></div>
                        Loading hadiths...
                      </div>
                    )}
                  </div>
                </div>

                {/* Hadiths */}
                <div className="max-h-[80vh] space-y-6 overflow-y-auto overflow-x-visible">
                  {loadingChapter ? (
                    <div className="border-theme bg-card shadow-soft rounded-xl border p-12 text-center">
                      <div className="border-primary mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2"></div>
                      <p className="text-muted">Loading chapter hadiths...</p>
                    </div>
                  ) : chapterHadiths.length > 0 ? (
                    chapterHadiths.map((hadith, idx) => (
                      <HadithCard
                        key={hadith._id ?? `${hadith.bookId ?? bookId}-${hadith.id ?? idx}`}
                        hadith={hadith}
                      />
                    ))
                  ) : (
                    <div className="border-theme bg-card shadow-soft rounded-xl border p-8 text-center">
                      <p className="text-muted">No hadiths found in this chapter.</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="border-theme bg-card shadow-soft rounded-xl border p-12 text-center">
                <Book className="text-muted mx-auto mb-4 h-12 w-12" />
                <h4 className="text-primary mb-2 text-lg font-medium">
                  Select a Chapter to Begin Reading
                </h4>
                <p className="text-muted mb-4">
                  Expand a category on the left and select a chapter to view its hadiths with
                  complete text, Arabic content, and grading information.
                </p>
                <div className="text-muted text-sm">
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
