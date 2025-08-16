'use client'

import { useState, useEffect, useRef, useMemo, useCallback, memo } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { Hadith } from '@/lib/api'
import { useSettings } from '@/lib/settings-context'
import { useNavigation } from '@/lib/navigation-context'
import clsx from 'clsx'

interface HadithCardProps {
  hadith: Hadith
  className?: string
  showViewChapter?: boolean // Only show "View Chapter" button in search contexts
}

// Tooltip component using React Portal
const Tooltip = ({ children, content, isVisible, triggerRef }: {
  children: React.ReactNode
  content: React.ReactNode
  isVisible: boolean
  triggerRef: React.RefObject<HTMLElement | null>
}) => {
  const [position, setPosition] = useState({ top: 0, left: 0 })

  useEffect(() => {
    if (isVisible && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      
      setPosition({
        top: rect.top - 8, // Position just above the trigger element
        left: rect.left + rect.width / 2
      })
    }
  }, [isVisible, triggerRef])

  return (
    <>
      {children}
      {typeof document !== 'undefined' && isVisible && createPortal(
        <div
          className="fixed px-3 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs rounded-lg shadow-lg pointer-events-none min-w-max max-w-xs transform -translate-x-1/2 -translate-y-full z-[999999]"
          style={{ top: position.top, left: position.left }}
        >
          {content}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-slate-900 dark:border-t-slate-100"></div>
        </div>,
        document.body
      )}
    </>
  )
}

const HadithCard = ({ hadith, className, showViewChapter = false }: HadithCardProps) => {
  const { settings } = useSettings()
  const router = useRouter()
  const navigation = useNavigation()
  
  const [showArabic, setShowArabic] = useState(false)
  const [expanded, setExpanded] = useState(settings.alwaysShowFullHadith)
  const [arabicExpanded, setArabicExpanded] = useState(true)
  
  // Update expanded state when settings change
  useEffect(() => {
    setExpanded(settings.alwaysShowFullHadith)
  }, [settings.alwaysShowFullHadith])
  
  // Tooltip states
  const [tooltipStates, setTooltipStates] = useState({
    majlisi: false,
    mohseni: false,
    behbudi: false
  })
  
  // Refs for tooltip positioning
  const majlisiRef = useRef<HTMLSpanElement>(null)
  const mohseniRef = useRef<HTMLSpanElement>(null)
  const behbudiRef = useRef<HTMLSpanElement>(null)

  // Memoize expensive calculations
  const { englishText, arabicText, isLongText, isArabicLongText } = useMemo(() => {
    const english = hadith.englishText || hadith.thaqalaynMatn
    const arabic = hadith.arabicText
    return {
      englishText: english,
      arabicText: arabic,
      isLongText: (english?.length || 0) > 300,
      isArabicLongText: (arabic?.length || 0) > 300
    }
  }, [hadith.englishText, hadith.thaqalaynMatn, hadith.arabicText])

  // Memoize grading data
  const gradingData = useMemo(() => ({
    majlisi: hadith.gradingsFull?.find(g => g.author.name_en.toLowerCase().includes('majlisi')),
    mohseni: hadith.gradingsFull?.find(g => g.author.name_en.toLowerCase().includes('mohseni')),
    behbudi: hadith.gradingsFull?.find(g => g.author.name_en.toLowerCase().includes('behbudi'))
  }), [hadith.gradingsFull])

  // Memoize tooltip handlers
  const handleTooltipEnter = useCallback((type: 'majlisi' | 'mohseni' | 'behbudi') => {
    setTooltipStates(prev => ({ ...prev, [type]: true }))
  }, [])

  const handleTooltipLeave = useCallback((type: 'majlisi' | 'mohseni' | 'behbudi') => {
    setTooltipStates(prev => ({ ...prev, [type]: false }))
  }, [])

  const handleNavigateToChapter = useCallback(async () => {
    // Save current scroll position before navigation
    navigation.saveScrollPosition(window.scrollY)
    
    // Determine the correct path based on the book/collection
    let basePath = '/al-kafi' // Default to Al-Kafi

    try {
      const { getBookConfig } = await import('@/lib/books-config')
      const bookId = hadith.bookId || ''
      const cfg = getBookConfig(bookId)
      if (cfg) {
        if (cfg.bookId === 'Al-Kafi') basePath = '/al-kafi'
        else if (cfg.bookId === 'Uyun-akhbar-al-Rida') basePath = '/uyun-akhbar-al-rida'
        else basePath = `/book/${cfg.bookId}`
      } else if (bookId.includes('Uyun') || (hadith.book && hadith.book.toLowerCase().includes('uyun'))) {
        basePath = '/uyun-akhbar-al-rida'
      } else if (bookId) {
        basePath = `/book/${bookId}`
      }
    } catch (e) {
      // fallback heuristics
      if ((hadith.book && hadith.book.includes('Uyun')) || (hadith.bookId && hadith.bookId.includes('Uyun'))) {
        basePath = '/uyun-akhbar-al-rida'
      }
    }

    // Navigate to the chapter view for this hadith
    router.push(`${basePath}/volume/${hadith.volume}/chapter/${hadith.categoryId}/${hadith.chapterInCategoryId}`)
  }, [navigation, router, hadith.volume, hadith.categoryId, hadith.chapterInCategoryId, hadith.book, hadith.bookId])

  return (
    <div className={clsx(
      'bg-card border border-theme rounded-xl p-4 sm:p-6 shadow-soft',
      'hover:border-accent-primary/20 hover:bg-card-hover hover:shadow-medium',
      'transition-all duration-300',
      className
    )}>
      {/* Header */}
        <div className="flex items-start justify-between mb-3 sm:mb-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
              <span className="text-xs sm:text-sm font-medium text-white bg-accent-primary px-2 py-1 rounded shadow-soft w-fit">
                <span className="sm:hidden">{hadith.book} Vol.{hadith.volume}</span>
                <span className="hidden sm:inline">{hadith.book} - Volume {hadith.volume}</span>
              </span>
              <span className="text-xs text-muted">#{hadith.id}</span>
            </div>          <h3 className="text-sm font-medium text-secondary leading-tight mb-1 line-clamp-2">
            {hadith.category}
          </h3>
          
          <p className="text-xs text-muted line-clamp-2">
            {hadith.chapter}
          </p>
        </div>

        <div className="flex items-center gap-2 ml-3 sm:ml-4 flex-shrink-0">
          {arabicText && (
            <button
              onClick={() => setShowArabic(!showArabic)}
              className={clsx(
                'px-2 sm:px-3 py-1 rounded-lg text-xs font-medium transition-all shadow-soft min-w-[28px] sm:min-w-[32px]',
                showArabic 
                  ? 'bg-accent-primary text-white shadow-medium' 
                  : 'bg-accent-primary/10 text-accent-primary hover:bg-accent-primary/20 active:scale-95'
              )}
            >
              ع
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="space-y-3 sm:space-y-4">
        {showArabic && arabicText ? (
          <div className="bg-amber-50/80 dark:bg-amber-900/20 p-3 sm:p-4 rounded-lg border border-amber-200/60 dark:border-amber-800/30 shadow-soft backdrop-blur-sm">
            <div
              className="text-right text-base sm:text-lg leading-relaxed font-arabic text-amber-900 dark:text-amber-100 hadith-arabic-text"
              dir="rtl"
              style={{ fontSize: `${settings.arabicFontSize}%` }}
            >
              {isArabicLongText && !arabicExpanded ? (
                <>
                  {arabicText.slice(0, 250)}...
                  <button
                    onClick={() => setArabicExpanded(true)}
                    className="text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 hover:underline ml-2 font-medium transition-colors active:scale-95"
                  >
                    اقرأ المزيد
                  </button>
                </>
              ) : (
                <>
                  {arabicText}
                  {isArabicLongText && arabicExpanded && (
                    <button
                      onClick={() => setArabicExpanded(false)}
                      className="text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 hover:underline ml-2 font-medium transition-colors active:scale-95"
                    >
                      اعرض أقل
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="text-primary leading-relaxed">
              {hadith.thaqalaynSanad && (
              <p
                className="text-sm mb-3 hadith-english-text line-clamp-3 sm:line-clamp-none text-[#3e3e42] font-mono"
                style={{ fontSize: `${settings.englishFontSize}%`, fontFamily: '"Space Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, "Roboto Mono", "Helvetica Neue", monospace' }}
              >
                {hadith.thaqalaynSanad.trim()}
              </p>
            )}
            
            <div className="text-sm sm:text-base hadith-english-text font-mono" style={{ fontSize: `${settings.englishFontSize}%`, fontFamily: '"Space Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, "Roboto Mono", "Helvetica Neue", monospace' }}>
              {isLongText && !expanded ? (
                <>
                  {englishText.slice(0, 250)}...
                  <button
                    onClick={() => setExpanded(true)}
                    className="text-accent-primary hover:text-accent-secondary hover:underline ml-2 font-medium transition-colors active:scale-95"
                  >
                    Read more
                  </button>
                </>
              ) : (
                <>
                  {englishText}
                  {isLongText && expanded && (
                    <button
                      onClick={() => setExpanded(false)}
                      className="text-accent-primary hover:text-accent-secondary hover:underline ml-2 font-medium transition-colors active:scale-95"
                    >
                      Show less
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-theme">
        {/* Grading Information */}
        {(hadith.majlisiGrading || hadith.mohseniGrading || hadith.behbudiGrading || (hadith.gradingsFull && hadith.gradingsFull.length > 0)) && (
          <div className="mb-4">
            <h4 className="text-xs font-semibold text-primary mb-3 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Hadith Gradings
            </h4>
            
            <div className="flex flex-wrap items-center gap-2">
              {/* Short Gradings with Detailed Tooltips */}
              {hadith.majlisiGrading && (
                <Tooltip
                  isVisible={tooltipStates.majlisi}
                  triggerRef={majlisiRef}
                  content={(() => {
                    return gradingData.majlisi ? (
                      <>
                        <div className="text-center mb-1 font-semibold">
                          {gradingData.majlisi.author.name_en}
                          {gradingData.majlisi.author.death_date && (
                            <span className="font-normal"> (d. {gradingData.majlisi.author.death_date})</span>
                          )}
                        </div>
                        {gradingData.majlisi.grade_en && gradingData.majlisi.grade_ar && (
                          <div className="mb-1 space-y-1">
                            <div>English: {gradingData.majlisi.grade_en}</div>
                            <div dir="rtl">Arabic: {gradingData.majlisi.grade_ar}</div>
                          </div>
                        )}
                        {gradingData.majlisi.reference_en && (
                          <div className="text-xs opacity-90 border-t border-slate-600 dark:border-slate-400 pt-2 mt-2">
                            <strong>Reference:</strong> {gradingData.majlisi.reference_en}
                          </div>
                        )}
                      </>
                    ) : (
                      "Traditional Majlisi classification"
                    )
                  })()}
                >
                  <span 
                    ref={majlisiRef}
                    className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-2 py-1 rounded-md text-xs font-medium cursor-help"
                    title="Majlisi Grading"
                    onMouseEnter={() => handleTooltipEnter('majlisi')}
                    onMouseLeave={() => handleTooltipLeave('majlisi')}
                  >
                    Majlisi: {hadith.majlisiGrading}
                  </span>
                </Tooltip>
              )}
              
              {hadith.mohseniGrading && (
                <Tooltip
                  isVisible={tooltipStates.mohseni}
                  triggerRef={mohseniRef}
                  content={(() => {
                    return gradingData.mohseni ? (
                      <>
                        <div className="text-center mb-1 font-semibold">
                          {gradingData.mohseni.author.name_en}
                          {gradingData.mohseni.author.death_date && (
                            <span className="font-normal"> (d. {gradingData.mohseni.author.death_date})</span>
                          )}
                        </div>
                        {gradingData.mohseni.grade_en && gradingData.mohseni.grade_ar && (
                          <div className="mb-1 space-y-1">
                            <div>English: {gradingData.mohseni.grade_en}</div>
                            <div dir="rtl">Arabic: {gradingData.mohseni.grade_ar}</div>
                          </div>
                        )}
                        {gradingData.mohseni.reference_en && (
                          <div className="text-xs opacity-90 border-t border-slate-600 dark:border-slate-400 pt-2 mt-2">
                            <strong>Reference:</strong> {gradingData.mohseni.reference_en}
                          </div>
                        )}
                      </>
                    ) : (
                      "Mohseni scholar classification"
                    )
                  })()}
                >
                  <span 
                    ref={mohseniRef}
                    className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-2 py-1 rounded-md text-xs font-medium cursor-help"
                    title="Mohseni Grading"
                    onMouseEnter={() => handleTooltipEnter('mohseni')}
                    onMouseLeave={() => handleTooltipLeave('mohseni')}
                  >
                    Mohseni: {hadith.mohseniGrading}
                  </span>
                </Tooltip>
              )}
              
              {hadith.behbudiGrading && (
                <Tooltip
                  isVisible={tooltipStates.behbudi}
                  triggerRef={behbudiRef}
                  content={(() => {
                    return gradingData.behbudi ? (
                      <>
                        <div className="text-center mb-1 font-semibold">
                          {gradingData.behbudi.author.name_en}
                          {gradingData.behbudi.author.death_date && (
                            <span className="font-normal"> (d. {gradingData.behbudi.author.death_date})</span>
                          )}
                        </div>
                        {gradingData.behbudi.grade_en && gradingData.behbudi.grade_ar && (
                          <div className="mb-1 space-y-1">
                            <div>English: {gradingData.behbudi.grade_en}</div>
                            <div dir="rtl">Arabic: {gradingData.behbudi.grade_ar}</div>
                          </div>
                        )}
                        {gradingData.behbudi.reference_en && (
                          <div className="text-xs opacity-90 border-t border-slate-600 dark:border-slate-400 pt-2 mt-2">
                            <strong>Reference:</strong> {gradingData.behbudi.reference_en}
                          </div>
                        )}
                      </>
                    ) : (
                      "Behbudi scholar classification"
                    )
                  })()}
                >
                  <span 
                    ref={behbudiRef}
                    className="bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 px-2 py-1 rounded-md text-xs font-medium cursor-help"
                    title="Behbudi Grading"
                    onMouseEnter={() => handleTooltipEnter('behbudi')}
                    onMouseLeave={() => handleTooltipLeave('behbudi')}
                  >
                    Behbudi: {hadith.behbudiGrading}
                  </span>
                </Tooltip>
              )}
            </div>
          </div>
        )}

        {/* Source Link */}
        <div className="flex items-center justify-end text-xs text-muted">
          {showViewChapter && hadith.volume && hadith.categoryId && (hadith.chapterInCategoryId !== null && hadith.chapterInCategoryId !== undefined) ? (
            <button
              onClick={handleNavigateToChapter}
              className="text-primary hover:underline flex items-center gap-1 transition-colors"
            >
              View Chapter
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ) : showViewChapter ? (
            <span className="text-xs text-gray-400">
              [Debug: vol={hadith.volume} cat={hadith.categoryId} ch={hadith.chapterInCategoryId}]
            </span>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default memo(HadithCard)
