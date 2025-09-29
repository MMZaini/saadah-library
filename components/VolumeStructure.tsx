'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { alKafiApi, thaqalaynApi } from '@/lib/api'
import { IconBook, IconChevronDown, IconChevronRight } from '@/components/Icons'
import { useNavigation } from '@/lib/navigation-context'
import clsx from 'clsx'
import { makeVolumeOptions, getVolumeLabelForValue } from '@/lib/volume-utils'

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

interface VolumeStructureProps {
  bookId: string
  bookName: string
  // volumes may be numeric (1,2,3) or string ids (e.g. 'Book-Volume-1-...')
  volumes: any[]
  baseRoute?: string // e.g., '/al-kafi' or '/book/bookId'
  className?: string
}

export default function VolumeStructure({ bookId, bookName, volumes, baseRoute, className }: VolumeStructureProps) {
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
  // Desktop hover gradient animation control
  const [hoveredKey, setHoveredKey] = useState<string | null>(null)
  const [leavingKey, setLeavingKey] = useState<string | null>(null)
  const leaveTimeoutRef = useRef<number | null>(null)

  const volumeOptions = makeVolumeOptions(volumes)

  // Load volume summary (categories and chapter counts)
  useEffect(() => {
    const loadVolumeSummary = async () => {      
      setLoading(true)
      setError(null)
      setExpandedCategories(new Set())

      try {
        let hadiths
        
        if (selectedVolume === 'all') {
          // Load hadiths from all volumes
          if (bookId.includes('Al-Kafi')) {
            const allVolumeHadiths = await Promise.all(
              volumes.map(vol => alKafiApi.getVolumeHadiths(vol))
            )
            hadiths = allVolumeHadiths.flat()
          } else {
            // For non-Al-Kafi multi-volume books, aggregate results from each volume book id
            const allResponses = await Promise.all(
              (volumes || []).map((vol) => thaqalaynApi.searchBook(String(vol), ''))
            )
            hadiths = allResponses.flatMap(r => (r && r.results) ? r.results : [])
          }
        } else {
          // Load hadiths from specific volume
          if (bookId.includes('Al-Kafi')) {
            hadiths = await alKafiApi.getVolumeHadiths(Number(selectedVolume))
          } else {
            // selectedVolume is expected to be a volume book id (string) for Thaqalayn-sourced books
            const targetBookId = String(selectedVolume)
            const response = await thaqalaynApi.searchBook(targetBookId, '')
            hadiths = response.results || []
          }
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

        // Sort categories to ensure Introduction comes before Content
        const sortedSummary: VolumeSummary = {}
        const categoryEntries = Object.entries(summary)
        
        // Custom sort function for categories
        const sortCategories = ([keyA]: [string, CategorySummary], [keyB]: [string, CategorySummary]) => {
          const normalizeKey = (key: string) => key.toLowerCase().trim()
          const normalizedA = normalizeKey(keyA)
          const normalizedB = normalizeKey(keyB)
          
          // Introduction should come first
          if (normalizedA.includes('introduction') && !normalizedB.includes('introduction')) return -1
          if (!normalizedA.includes('introduction') && normalizedB.includes('introduction')) return 1
          
          // Content should come after Introduction but before other categories
          if (normalizedA.includes('content') && !normalizedB.includes('content') && !normalizedB.includes('introduction')) return -1
          if (!normalizedA.includes('content') && normalizedB.includes('content') && !normalizedA.includes('introduction')) return 1
          
          // Default alphabetical sort for other categories
          return normalizedA.localeCompare(normalizedB)
        }
        
        categoryEntries.sort(sortCategories).forEach(([key, value]) => {
          sortedSummary[key] = value
        })

        setVolumeSummary(sortedSummary)
      } catch (err) {
        setError(`Failed to load structure for selected volume(s)`)
        // Error logging removed
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
    let volumeForUrl: any
    if (selectedVolume === 'all') {
      volumeForUrl = (volumes && volumes.length) ? volumes[0] : 1
    } else {
      const asStr = String(selectedVolume)
      const m = asStr.match(/-Volume-(\d+)-/)
      if (m) volumeForUrl = Number(m[1])
      else if (!isNaN(Number(asStr))) volumeForUrl = Number(asStr)
      else volumeForUrl = selectedVolume
    }

    if (baseRoute) {
      if (bookId.includes('Al_Kafi') || bookId.includes('Al-Kafi')) {
        router.push(`${baseRoute}/volume/${volumeForUrl}/chapter/${categoryId}/${chapterInCategoryId}`)
      } else {
        router.push(`${baseRoute}/chapter/${categoryId}/${chapterInCategoryId}`)
      }
    }
  }

  const getChapterKey = (categoryId: string, chapterInCategoryId: number) => `${categoryId}-${chapterInCategoryId}`

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

  const getTouchHandlers = (key: string) => ({
    onTouchStart: (e: React.TouchEvent) => {
      // Record start position to detect meaningful movement (scrolls)
      const t = e.touches && e.touches[0]
      if (t) touchStartPosRef.current = { x: t.clientX, y: t.clientY }
      // Immediately preview (uncollapse) on press for mobile; suppress the next click to avoid instant navigation
      clearLongPressTimer()
      setMobileExpandedKey(key)
      ignoreNextClickRef.current = true
      scheduleCollapseMobileExpansion()
    },
    onTouchMove: (e: React.TouchEvent) => {
      // If user moves, treat as potential scroll; only react on significant movement
      const start = touchStartPosRef.current
      const t = e.touches && e.touches[0]
      if (!start || !t) return
      const dx = Math.abs(t.clientX - start.x)
      const dy = Math.abs(t.clientY - start.y)
      if (dx > 20 || dy > 20) {
        // Don't collapse immediately; keep preview open and suppress click
        clearLongPressTimer()
        ignoreNextClickRef.current = true
      }
    },
    onTouchEnd: () => {
      clearLongPressTimer()
      const start = touchStartPosRef.current
      touchStartPosRef.current = null
      
      // If this was a tap (no significant movement), allow the next click to navigate
      if (start) {
        // Check if there was minimal movement (likely a tap)
        const lastTouch = start
        // For taps with minimal movement, allow navigation on next click
        setTimeout(() => {
          ignoreNextClickRef.current = false
        }, 50) // Small delay to allow click event to fire
      }
      
      // If expanded, keep it for a brief moment to allow reading
      if (mobileExpandedKey === key) {
        scheduleCollapseMobileExpansion()
      }
    },
    onTouchCancel: () => {
      clearLongPressTimer()
      touchStartPosRef.current = null
      if (mobileExpandedKey === key) {
        scheduleCollapseMobileExpansion()
      }
    }
  })

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
                <h3 className="text-lg font-bold text-primary mb-1">{bookName} Volume Explorer</h3>
                <p className="text-sm text-secondary">{bookName} consists of {volumes.length} volume{volumes.length === 1 ? '' : 's'}. Browse volumes individually or view the complete collection structure</p>
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
            ) : (
              <div className="text-sm font-semibold">{getVolumeLabelForValue(volumes, volumeOptions[0]?.value)}</div>
            )}
          </div>
        </div>

        {!loading && getTotalHadithsCount() > 0 && (
          <div>
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
                  {selectedVolume === 'all'
                    ? (bookId.includes('Al-Kafi') ? 'All Al-Kāfi Volumes' : `All Volumes`)
                    : getVolumeLabelForValue(volumes, selectedVolume)}
                </span>
              </div>
            </div>

            <p className="text-sm text-secondary mt-4">
              Browse the complete structure of the selected book. Click on categories to expand them and view chapters. Click on any chapter to read all hadiths in that chapter.
            </p>
          </div>
        )}
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
                        {...getTouchHandlers(key)}
                        aria-expanded={isExpanded}
                        onMouseEnter={() => {
                          setLeavingKey(null)
                          setHoveredKey(key)
                        }}
                        onMouseLeave={() => {
                          setHoveredKey(null)
                          setLeavingKey(key)
                          if (leaveTimeoutRef.current) window.clearTimeout(leaveTimeoutRef.current)
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
                        className={clsx(
                          'group relative bg-card rounded-xl border border-theme text-left',
                          'p-4 sm:p-5 transition-all duration-900 ease-out',
                          'touch-manipulation select-none',
                          'shadow-soft hover:shadow-medium',
                          'hover:border-accent-primary/15 md:hover:ring-1 md:hover:ring-accent-primary/10',
                          'md:hover:translate-y-[-3px] md:hover:scale-[1.02]',
                          // Simplified mobile expansion (no ring/glow, gentler lift/scale); keep desktop subtle
                          isExpanded && 'translate-y-[-2px] scale-[1.02] z-10 border-accent-primary/15 md:translate-y-[-3px] md:scale-[1.02] md:p-5 md:ring-1 md:ring-accent-primary/15 md:shadow-medium'
                        )}
                        style={{
                          transform: isExpanded ? 'translateY(-3px) scale(1.02)' : undefined
                        }}
                      >
                        {/* Subtle sliding gradient background (visible on mobile when expanded) */}
                        <div className="absolute inset-0 rounded-xl overflow-hidden z-0 pointer-events-none">
                          <div
                            className={clsx(
                              'absolute inset-0 bg-gradient-to-r from-[#15171b] via-[#111318] to-[#0f1114]',
                              'transition-all duration-900 ease-in-out',
                              hoveredKey === key && 'opacity-100 translate-x-0',
                              leavingKey === key && 'opacity-0 translate-x-full',
                              hoveredKey !== key && leavingKey !== key && 'opacity-0 -translate-x-full',
                              isExpanded && 'opacity-100 translate-x-0'
                            )}
                          />
                          {/* Cursor-following subtle glow (neutral, toned down) — desktop only */}
                          <div
                            className={clsx(
                              'absolute inset-0 opacity-0 md:group-hover:opacity-90 transition-opacity duration-900 ease-out',
                              isExpanded && 'md:opacity-100'
                            )}
                            style={{
                              background: 'radial-gradient(200px circle at var(--mx) var(--my), rgba(255, 255, 255, 0.06), rgba(0,0,0,0) 60%)'
                            }}
                          />
                          {/* Outside-the-box cursor-following glow (neutral, toned down) — desktop only */}
                          <div
                            className={clsx(
                              'absolute -inset-6 opacity-0 md:group-hover:opacity-80 transition-opacity duration-900 ease-out',
                              isExpanded && 'md:opacity-100'
                            )}
                            style={{
                              background: 'radial-gradient(240px circle at var(--mx) var(--my), rgba(255, 255, 255, 0.04), rgba(0,0,0,0) 65%)',
                              filter: 'blur(14px)'
                            }}
                          />
                        </div>
                        {/* Chapter number indicator */}
                        <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-accent-primary to-accent-secondary rounded-full flex items-center justify-center text-white text-xs font-bold shadow-medium">
                          {chapter.chapterInCategoryId}
                        </div>
                        
                        {/* Chapter content (expands height smoothly) */}
                        <div
                          className={clsx(
                            'pr-4 overflow-hidden',
                            'relative z-10 transition-[max-height] duration-[700ms] md:duration-[1100ms] ease-[cubic-bezier(0.22,1,0.36,1)]',
                            'max-h-24',
                            'md:group-hover:max-h-[500px]'
                          )}
                          style={{ willChange: 'max-height', maxHeight: isExpanded ? '500px' as const : undefined }}
                        >
                          <h4 className={clsx(
                            'font-semibold text-primary mb-3 leading-snug transition-colors',
                            'group-hover:text-accent-primary/70',
                            isExpanded && 'text-accent-primary/80',
                            'line-clamp-2',
                            'md:group-hover:line-clamp-none',
                            isExpanded && 'line-clamp-none'
                          )}>
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
                    )})}
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
