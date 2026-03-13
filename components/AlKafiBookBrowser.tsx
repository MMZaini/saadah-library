'use client'

import { useState, useEffect } from 'react'
import { alKafiApi, Hadith } from '@/lib/api'
import { fetchBookStructure, fetchMultiVolumeStructure } from '@/lib/book-structure'
import HadithCard from './HadithCard'
import { Book, ChevronDown, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ChapterSummary {
  chapter: string
  chapterInCategoryId: number
  hadithCount: number
}

interface CategorySummary {
  category: string
  categoryId: string
  chapters: Record<string, ChapterSummary>
  totalHadiths: number
}

interface VolumeSummary {
  [categoryKey: string]: CategorySummary
}

interface AlKafiBookBrowserProps {
  initialVolume?: number
  className?: string
}

export default function AlKafiBookBrowser({
  initialVolume = 1,
  className,
}: AlKafiBookBrowserProps) {
  const [selectedVolume, setSelectedVolume] = useState<string | number | 'all'>(initialVolume)
  const [volumeSummary, setVolumeSummary] = useState<VolumeSummary>({})
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

  const alKafiVolumes = Array.from({ length: 8 }, (_, i) => i + 1)
  const volumeOptions = [
    ...alKafiVolumes.map((vol) => ({ value: vol, label: `Volume ${vol}` })),
    { value: 'all' as const, label: 'All Volumes' },
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
        // Determine target book IDs
        const targetBookIds =
          selectedVolume === 'all'
            ? alKafiVolumes.map((vol) => `Al-Kafi-Volume-${vol}-Kulayni`)
            : [`Al-Kafi-Volume-${selectedVolume}-Kulayni`]

        // Try the lightweight structure API first
        let summary: VolumeSummary | null = null
        if (targetBookIds.length === 1) {
          summary = (await fetchBookStructure(targetBookIds[0])) as VolumeSummary | null
        } else {
          summary = (await fetchMultiVolumeStructure(targetBookIds)) as VolumeSummary | null
        }

        // Fallback: download full hadiths and build summary client-side
        if (!summary || Object.keys(summary).length === 0) {
          let hadiths
          if (selectedVolume === 'all') {
            const allVolumeHadiths = await Promise.all(
              alKafiVolumes.map((vol) => alKafiApi.getVolumeHadiths(vol)),
            )
            hadiths = allVolumeHadiths.flat()
          } else {
            hadiths = await alKafiApi.getVolumeHadiths(Number(selectedVolume))
          }

          if (!hadiths || hadiths.length === 0) {
            setError('No hadiths found for this selection')
            return
          }

          summary = {}
          hadiths.forEach((hadith) => {
            const categoryKey = hadith.category || 'Uncategorized'
            const chapterKey = hadith.chapter || 'No Chapter'
            if (!summary![categoryKey]) {
              summary![categoryKey] = {
                category: categoryKey,
                categoryId: hadith.categoryId || '',
                chapters: {},
                totalHadiths: 0,
              }
            }
            if (!summary![categoryKey].chapters[chapterKey]) {
              summary![categoryKey].chapters[chapterKey] = {
                chapter: chapterKey,
                chapterInCategoryId: hadith.chapterInCategoryId || 0,
                hadithCount: 0,
              }
            }
            summary![categoryKey].chapters[chapterKey].hadithCount++
            summary![categoryKey].totalHadiths++
          })

          // Sort chapters within each category
          Object.values(summary).forEach((category) => {
            const sortedChapters: Record<string, ChapterSummary> = {}
            Object.entries(category.chapters)
              .sort(([, a], [, b]) => a.chapterInCategoryId - b.chapterInCategoryId)
              .forEach(([k, v]) => {
                sortedChapters[k] = v
              })
            category.chapters = sortedChapters
          })
        }

        setVolumeSummary(summary)
      } catch {
        setError(`Failed to load structure for Volume ${selectedVolume}`)
      } finally {
        setLoading(false)
      }
    }

    loadVolumeSummary()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedVolume])

  // Load specific chapter hadiths
  const loadChapterHadiths = async (
    category: string,
    chapter: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _categoryId: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _chapterId: number,
  ) => {
    setLoadingChapter(true)
    try {
      let allHadiths

      if (selectedVolume === 'all') {
        // Load hadiths from all Al-Kafi volumes
        const allVolumeHadiths = await Promise.all(
          alKafiVolumes.map((vol) => alKafiApi.getVolumeHadiths(vol)),
        )
        allHadiths = allVolumeHadiths.flat()
      } else {
        // Load hadiths from specific volume
        allHadiths = await alKafiApi.getVolumeHadiths(Number(selectedVolume))
      }

      // Filter hadiths for the specific chapter
      const chapterHadiths = allHadiths.filter(
        (hadith) => hadith.category === category && hadith.chapter === chapter,
      )

      setChapterHadiths(chapterHadiths)
    } catch {
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

  const selectChapter = (
    category: string,
    chapter: string,
    categoryId: string,
    chapterId: number,
  ) => {
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
    <div className={cn('space-y-6', className)}>
      {/* Volume Selector */}
      <div className="rounded-xl border border-border bg-surface-1 p-6">
        <div className="mb-4 flex items-center gap-4">
          <Book className="h-8 w-8 text-foreground-muted" />
          <div>
            <h3 className="mb-1 text-xl font-bold text-foreground">
              Al-Kāfi Complete Chapter Tree
            </h3>
            <p className="text-sm text-foreground-muted">
              Browse the complete structure of Al-Kāfi. Select a specific volume or &quot;All
              Volumes&quot;, expand categories, and select chapters to read all hadiths with full
              details including gradings.
            </p>
          </div>
        </div>

        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
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
                className={cn(
                  'appearance-none border border-border bg-background',
                  'rounded-lg px-4 py-2.5 pr-12 font-semibold text-foreground',
                  'transition-colors duration-200',
                  'focus:border-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-600/20',
                  'min-w-[130px] cursor-pointer hover:border-zinc-600/50',
                  loading && 'cursor-not-allowed opacity-50',
                )}
              >
                {volumeOptions.map((option) => (
                  <option key={String(option.value)} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              {/* Custom dropdown arrow */}
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                <svg
                  className="h-4 w-4 text-foreground-muted"
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
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-accent"></div>
                <span className="font-semibold text-foreground-muted">
                  {getTotalHadithsCount().toLocaleString()} hadiths
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-foreground-faint"></div>
                <span className="font-semibold text-foreground-muted">
                  {Object.keys(volumeSummary).length} categories
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-foreground-faint"></div>
                <span className="font-semibold text-foreground-muted">
                  {selectedVolume === 'all' ? 'All Volumes' : `Volume ${selectedVolume}`}
                </span>
              </div>
            </div>
          )}
        </div>
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
                {Object.entries(volumeSummary).map(([categoryKey, categoryInfo]) => (
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
                        {Object.entries(categoryInfo.chapters).map(([chapterKey, chapterInfo]) => (
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
                <div className="border-theme bg-card shadow-soft rounded-xl border p-6">
                  <h4 className="text-primary mb-2 font-semibold">{selectedChapter.category}</h4>
                  <h5 className="text-secondary mb-4">{selectedChapter.chapter}</h5>
                  <div className="flex items-center justify-between">
                    <p className="text-muted text-sm">
                      {chapterHadiths.length} {chapterHadiths.length === 1 ? 'hadith' : 'hadiths'}{' '}
                      in this chapter
                    </p>
                    {loadingChapter && (
                      <div className="text-muted flex items-center gap-2 text-sm">
                        <div className="border-primary h-4 w-4 animate-spin rounded-full border-b-2"></div>
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
                        key={hadith._id ?? `alkafi-${hadith.id ?? idx}`}
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
