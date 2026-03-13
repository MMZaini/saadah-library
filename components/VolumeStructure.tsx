'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { alKafiApi, thaqalaynApi } from '@/lib/api'
import { fetchBookStructure, fetchMultiVolumeStructure } from '@/lib/book-structure'
import { useNavigation } from '@/lib/navigation-context'
import { cn } from '@/lib/utils'
import { makeVolumeOptions, getVolumeLabelForValue } from '@/lib/volume-utils'

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

interface VolumeStructureProps {
  bookId: string
  bookName: string
  volumes: (string | number)[]
  baseRoute?: string // e.g., '/al-kafi' or '/book/bookId'
  className?: string
}

export default function VolumeStructure({
  bookId,
  bookName,
  volumes,
  baseRoute,
  className,
}: VolumeStructureProps) {
  const router = useRouter()
  const navigation = useNavigation()

  const [selectedVolume, setSelectedVolume] = useState<string | number | 'all'>(() => {
    if (!volumes || volumes.length === 0) return 'all'
    return volumes[0]
  })
  const [volumeSummary, setVolumeSummary] = useState<VolumeSummary>({})
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Mobile long-press expansion state
  const [mobileExpandedKey, setMobileExpandedKey] = useState<string | null>(null)
  const longPressTimeoutRef = useRef<number | null>(null)
  const mobileCollapseTimeoutRef = useRef<number | null>(null)
  const ignoreNextClickRef = useRef(false)
  const touchStartPosRef = useRef<{ x: number; y: number } | null>(null)
  const touchStartTimeRef = useRef<number | null>(null)
  const longPressTriggeredRef = useRef(false)
  // Desktop hover gradient animation control
  const [hoveredKey, setHoveredKey] = useState<string | null>(null)
  const [, setLeavingKey] = useState<string | null>(null)
  const leaveTimeoutRef = useRef<number | null>(null)

  const volumeOptions = makeVolumeOptions(volumes)

  // Load volume summary (categories and chapter counts)
  useEffect(() => {
    const loadVolumeSummary = async () => {
      setLoading(true)
      setError(null)
      setExpandedCategories(new Set())

      try {
        // Determine which book IDs to fetch structure for
        let targetBookIds: string[]
        if (selectedVolume === 'all') {
          if (bookId.includes('Al-Kafi')) {
            targetBookIds = volumes.map((vol) => `Al-Kafi-Volume-${vol}-Kulayni`)
          } else {
            targetBookIds = (volumes || []).map(String)
          }
        } else {
          if (bookId.includes('Al-Kafi')) {
            targetBookIds = [`Al-Kafi-Volume-${selectedVolume}-Kulayni`]
          } else {
            targetBookIds = [String(selectedVolume)]
          }
        }

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
            if (bookId.includes('Al-Kafi')) {
              const allVolumeHadiths = await Promise.all(
                volumes.map((vol) => alKafiApi.getVolumeHadiths(Number(vol))),
              )
              hadiths = allVolumeHadiths.flat()
            } else {
              const allResponses = await Promise.all(
                (volumes || []).map((vol) => thaqalaynApi.searchBook(String(vol), '')),
              )
              hadiths = allResponses.flatMap((r) => (r && r.results ? r.results : []))
            }
          } else {
            if (bookId.includes('Al-Kafi')) {
              hadiths = await alKafiApi.getVolumeHadiths(Number(selectedVolume))
            } else {
              const response = await thaqalaynApi.searchBook(String(selectedVolume), '')
              hadiths = response.results || []
            }
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

        // Sort categories to ensure Introduction comes before Content
        const sortedSummary: VolumeSummary = {}
        const categoryEntries = Object.entries(summary)

        const sortCategories = (
          [keyA]: [string, CategorySummary],
          [keyB]: [string, CategorySummary],
        ) => {
          const normalizeKey = (key: string) => key.toLowerCase().trim()
          const normalizedA = normalizeKey(keyA)
          const normalizedB = normalizeKey(keyB)
          if (normalizedA.includes('introduction') && !normalizedB.includes('introduction'))
            return -1
          if (!normalizedA.includes('introduction') && normalizedB.includes('introduction'))
            return 1
          if (
            normalizedA.includes('content') &&
            !normalizedB.includes('content') &&
            !normalizedB.includes('introduction')
          )
            return -1
          if (
            !normalizedA.includes('content') &&
            normalizedB.includes('content') &&
            !normalizedA.includes('introduction')
          )
            return 1
          return normalizedA.localeCompare(normalizedB)
        }

        categoryEntries.sort(sortCategories).forEach(([key, value]) => {
          sortedSummary[key] = value
        })

        setVolumeSummary(sortedSummary)
      } catch {
        setError(`Failed to load structure for selected volume(s)`)
      } finally {
        setLoading(false)
      }
    }

    loadVolumeSummary()
  }, [selectedVolume, bookId, volumes])

  // Cleanup timers on unmount to avoid leaks
  useEffect(() => {
    return () => {
      if (longPressTimeoutRef.current) window.clearTimeout(longPressTimeoutRef.current)
      if (mobileCollapseTimeoutRef.current) window.clearTimeout(mobileCollapseTimeoutRef.current)
      if (leaveTimeoutRef.current) window.clearTimeout(leaveTimeoutRef.current)
    }
  }, [])

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
    // Save current scroll position before navigation
    navigation.saveScrollPosition(window.scrollY)

    // Handle navigation based on book type and baseRoute
    let volumeForUrl: string | number
    if (selectedVolume === 'all') {
      volumeForUrl = volumes && volumes.length ? volumes[0] : 1
    } else {
      const asStr = String(selectedVolume)
      const m = asStr.match(/-Volume-(\d+)-/)
      if (m) volumeForUrl = Number(m[1])
      else if (!isNaN(Number(asStr))) volumeForUrl = Number(asStr)
      else volumeForUrl = selectedVolume
    }

    if (baseRoute) {
      if (bookId.includes('Al_Kafi') || bookId.includes('Al-Kafi')) {
        router.push(
          `${baseRoute}/volume/${volumeForUrl}/chapter/${categoryId}/${chapterInCategoryId}`,
        )
      } else {
        router.push(`${baseRoute}/chapter/${categoryId}/${chapterInCategoryId}`)
      }
    }
  }

  const getChapterKey = (categoryId: string, chapterInCategoryId: number) =>
    `${categoryId}-${chapterInCategoryId}`

  const clearLongPressTimer = () => {
    if (longPressTimeoutRef.current) {
      window.clearTimeout(longPressTimeoutRef.current)
      longPressTimeoutRef.current = null
    }
  }

  const clearMobileCollapseTimer = () => {
    if (mobileCollapseTimeoutRef.current) {
      window.clearTimeout(mobileCollapseTimeoutRef.current)
      mobileCollapseTimeoutRef.current = null
    }
  }

  const scheduleCollapseMobileExpansion = () => {
    clearMobileCollapseTimer()
    mobileCollapseTimeoutRef.current = window.setTimeout(() => {
      setMobileExpandedKey(null)
    }, 1600)
  }

  const getTouchHandlers = (key: string, onNavigate: () => void) => ({
    onTouchStart: (e: React.TouchEvent) => {
      const t = e.touches && e.touches[0]
      if (t) touchStartPosRef.current = { x: t.clientX, y: t.clientY }
      touchStartTimeRef.current = Date.now()
      longPressTriggeredRef.current = false
      clearLongPressTimer()
      // Schedule long-press to preview after 250ms
      longPressTimeoutRef.current = window.setTimeout(() => {
        longPressTriggeredRef.current = true
        setMobileExpandedKey(key)
        scheduleCollapseMobileExpansion()
      }, 250)
    },
    onTouchMove: (e: React.TouchEvent) => {
      const start = touchStartPosRef.current
      const t = e.touches && e.touches[0]
      if (!start || !t) return
      const dx = Math.abs(t.clientX - start.x)
      const dy = Math.abs(t.clientY - start.y)
      // If significant move, cancel tap recognition but keep potential preview if long-press fires
      if (dx > 20 || dy > 20) {
        // Do not immediately clear long-press; user may still want preview
        // Just mark that synthetic click should be ignored if it happens
        ignoreNextClickRef.current = true
      }
    },
    onTouchEnd: (e: React.TouchEvent) => {
      const startTime = touchStartTimeRef.current || Date.now()
      const duration = Date.now() - startTime
      clearLongPressTimer()
      touchStartPosRef.current = null
      touchStartTimeRef.current = null

      const withinTapThreshold = duration < 250
      // If long-press hasn't triggered and it's a quick tap, navigate now
      if (!longPressTriggeredRef.current && withinTapThreshold) {
        e.preventDefault()
        e.stopPropagation()
        ignoreNextClickRef.current = true // swallow the subsequent synthetic click
        onNavigate()
        return
      }

      // Otherwise, if preview is open, keep briefly then collapse
      if (mobileExpandedKey === key) {
        scheduleCollapseMobileExpansion()
      }
    },
    onTouchCancel: () => {
      clearLongPressTimer()
      touchStartPosRef.current = null
      touchStartTimeRef.current = null
      if (mobileExpandedKey === key) {
        scheduleCollapseMobileExpansion()
      }
    },
  })

  const getTotalHadithsCount = () => {
    return Object.values(volumeSummary).reduce((total, category) => {
      return total + category.totalHadiths
    }, 0)
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Volume Selection */}
      <div className="rounded-xl border border-border bg-surface-1 p-6">
        <div className="mb-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
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
              <h3 className="text-primary mb-1 text-lg font-bold">{bookName} Volume Explorer</h3>
              <p className="text-secondary text-sm">
                {bookName} consists of {volumes.length} volume{volumes.length === 1 ? '' : 's'}.
                Browse volumes individually or view the complete collection structure
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Show a selector only for multi-volume books; otherwise show a static label */}
            {volumes.length > 1 ? (
              <div className="relative">
                <select
                  value={selectedVolume}
                  onChange={(e) => {
                    const raw = e.target.value
                    const val = raw === 'all' ? 'all' : isNaN(Number(raw)) ? raw : Number(raw)
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

                {/* Custom dropdown arrow */}
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
            ) : (
              <div className="text-sm font-semibold">
                {getVolumeLabelForValue(volumes, volumeOptions[0]?.value)}
              </div>
            )}
          </div>
        </div>

        {!loading && getTotalHadithsCount() > 0 && (
          <div>
            <div className="border-theme flex flex-wrap items-center gap-4 border-t pt-4">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-accent"></div>
                <span className="text-primary text-sm font-semibold">
                  {getTotalHadithsCount().toLocaleString()} hadiths
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-foreground-faint"></div>
                <span className="text-primary text-sm font-semibold">
                  {Object.keys(volumeSummary).length} categories
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-foreground-faint"></div>
                <span className="text-primary text-sm font-semibold">
                  {selectedVolume === 'all'
                    ? bookId.includes('Al-Kafi')
                      ? 'All Al-Kāfi Volumes'
                      : `All Volumes`
                    : getVolumeLabelForValue(volumes, selectedVolume)}
                </span>
              </div>
            </div>

            <p className="text-secondary mt-4 text-sm">
              Browse the complete structure of the selected book. Click on categories to expand them
              and view chapters. Click on any chapter to read all hadiths in that chapter.
            </p>
          </div>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="border-theme bg-card shadow-soft rounded-xl border p-12">
          <div className="flex items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-zinc-400"></div>
            <span className="text-secondary ml-3">Loading book structure...</span>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="shadow-soft rounded-xl border border-red-200/60 bg-red-50/80 p-6 dark:border-red-800/30 dark:bg-red-900/20">
          <p className="text-red-800 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* Categories and Chapters */}
      {!loading && !error && Object.keys(volumeSummary).length > 0 && (
        <div className="space-y-6">
          {Object.entries(volumeSummary).map(([categoryKey, category]) => (
            <div
              key={categoryKey}
              className="border-theme hover:shadow-medium bg-card shadow-soft overflow-y-hidden overflow-x-visible rounded-2xl border transition-all duration-200"
            >
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(categoryKey)}
                className="hover:bg-card-hover group flex w-full items-center justify-between px-6 py-5 transition-all duration-200"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`transition-transform duration-200 ${expandedCategories.has(categoryKey) ? 'rotate-90' : 'rotate-0'}`}
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 transition-all duration-200 group-hover:bg-zinc-700">
                      <svg
                        className="h-4 w-4 text-zinc-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </div>
                  <h3 className="text-primary text-left text-lg font-bold transition-colors group-hover:text-foreground">
                    {category.category}
                  </h3>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-primary text-sm font-semibold">
                      {category.totalHadiths} hadiths
                    </div>
                    <div className="text-secondary text-xs">
                      {Object.keys(category.chapters).length} chapters
                    </div>
                  </div>
                  <div className="h-12 w-1 rounded-full bg-zinc-700"></div>
                </div>
              </button>

              {/* Chapters */}
              {expandedCategories.has(categoryKey) && (
                <div className="border-theme from-card/50 to-card/30 border-t bg-gradient-to-r p-4 duration-300 animate-in slide-in-from-top-2 sm:p-6">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
                    {Object.entries(category.chapters).map(([chapterKey, chapter]) => {
                      const key = getChapterKey(category.categoryId, chapter.chapterInCategoryId)
                      const isExpanded = mobileExpandedKey === key
                      return (
                        <button
                          key={chapterKey}
                          onClick={(e) => {
                            if (ignoreNextClickRef.current) {
                              e.preventDefault()
                              e.stopPropagation()
                              ignoreNextClickRef.current = false
                              return
                            }
                            handleChapterClick(category.categoryId, chapter.chapterInCategoryId)
                          }}
                          {...getTouchHandlers(key, () =>
                            handleChapterClick(category.categoryId, chapter.chapterInCategoryId),
                          )}
                          aria-expanded={isExpanded}
                          onMouseEnter={() => {
                            setLeavingKey(null)
                            setHoveredKey(key)
                          }}
                          onMouseLeave={() => {
                            setHoveredKey(null)
                            setLeavingKey(key)
                            if (leaveTimeoutRef.current)
                              window.clearTimeout(leaveTimeoutRef.current)
                            leaveTimeoutRef.current = window.setTimeout(() => {
                              setLeavingKey(null)
                            }, 900)
                          }}
                          onMouseMove={(e) => {
                            const el = e.currentTarget as HTMLElement
                            const rect = el.getBoundingClientRect()
                            const x = e.clientX - rect.left
                            const y = e.clientY - rect.top
                            el.style.setProperty('--mx', `${x}px`)
                            el.style.setProperty('--my', `${y}px`)
                          }}
                          className={cn(
                            'border-theme bg-card group relative rounded-xl border text-left',
                            'p-4 transition-all duration-500 ease-out sm:p-5',
                            'touch-manipulation select-none',
                            'shadow-soft hover:shadow-md',
                            'hover:border-zinc-600 md:hover:ring-1 md:hover:ring-zinc-700/30',
                            'md:hover:translate-y-[-2px]',
                            isExpanded &&
                              'z-10 translate-y-[-2px] border-zinc-600 md:p-5 md:shadow-md md:ring-1 md:ring-zinc-700/30',
                          )}
                          style={{
                            transform: isExpanded ? 'translateY(-2px)' : undefined,
                          }}
                        >
                          {/* Subtle sliding gradient background (visible on mobile when expanded) */}
                          <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden rounded-xl">
                            <div
                              className={cn(
                                'absolute inset-0 bg-zinc-900/40',
                                'transition-opacity duration-500 ease-in-out',
                                hoveredKey === key && 'opacity-100',
                                hoveredKey !== key && 'opacity-0',
                                isExpanded && 'opacity-100',
                              )}
                            />
                            {/* Cursor-following subtle glow — desktop only */}
                            <div
                              className={cn(
                                'absolute inset-0 opacity-0 transition-opacity duration-500 ease-out md:group-hover:opacity-40',
                                isExpanded && 'md:opacity-40',
                              )}
                              style={{
                                background:
                                  'radial-gradient(180px circle at var(--mx) var(--my), rgba(255, 255, 255, 0.035), rgba(0,0,0,0) 60%)',
                              }}
                            />
                          </div>
                          {/* Chapter number indicator */}
                          <div className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-zinc-700 text-xs font-bold text-zinc-200">
                            {chapter.chapterInCategoryId}
                          </div>

                          {/* Chapter content (expands height smoothly) */}
                          <div
                            className={cn(
                              'overflow-hidden pr-4',
                              'relative z-10 transition-[max-height] duration-700 ease-smooth-expand md:duration-1100',
                              'max-h-24',
                              'md:group-hover:max-h-[500px]',
                            )}
                            style={{
                              willChange: 'max-height',
                              maxHeight: isExpanded ? ('500px' as const) : undefined,
                            }}
                          >
                            <h4
                              className={cn(
                                'text-primary mb-3 font-semibold leading-snug transition-colors',
                                'group-hover:text-foreground',
                                isExpanded && 'text-foreground',
                                'line-clamp-2',
                                'md:group-hover:line-clamp-none',
                                isExpanded && 'line-clamp-none',
                              )}
                            >
                              {chapter.chapter}
                            </h4>

                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-accent"></div>
                                <span className="text-secondary text-sm font-medium">
                                  {chapter.hadithCount}{' '}
                                  {chapter.hadithCount === 1 ? 'hadith' : 'hadiths'}
                                </span>
                              </div>

                              <div className="text-secondary flex items-center gap-1 transition-colors group-hover:text-foreground-muted">
                                <svg
                                  className="h-4 w-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 5l7 7-7 7"
                                  />
                                </svg>
                              </div>
                            </div>
                          </div>

                          {/* Subtle hover gradient overlay */}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && Object.keys(volumeSummary).length === 0 && (
        <div className="border-theme from-card to-card/50 shadow-soft rounded-2xl border bg-gradient-to-br p-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-800">
            <svg
              className="h-8 w-8 text-zinc-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
          </div>
          <h3 className="text-primary mb-2 text-lg font-semibold">No chapters found</h3>
          <p className="text-secondary">The selected book appears to be empty or still loading.</p>
        </div>
      )}
    </div>
  )
}
