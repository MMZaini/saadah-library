'use client'

import { useState, useEffect, useRef, useMemo, useCallback, memo } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { Hadith } from '@/lib/api'
import { useSettings } from '@/lib/settings-context'
import { useNavigation } from '@/lib/navigation-context'
import { useBookmarks } from '@/lib/bookmarks-context'
import { getBookConfig, getBookUrlSlug } from '@/lib/books-config'
import { IconBookmark, IconBookmarkFilled } from '@/components/Icons'
import clsx from 'clsx'

interface HadithCardProps {
  hadith: Hadith
  className?: string
  showViewChapter?: boolean // Only show "View Chapter" button in search contexts
  showNotesToggle?: boolean // Show notes toggle button
  notesVisible?: boolean // Control notes visibility
  onToggleNotes?: () => void // Callback when notes toggle is clicked
  showArabicByDefault?: boolean // Show Arabic version by default (for Arabic search results)
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

const HadithCard = ({ hadith, className, showViewChapter = false, showNotesToggle = false, notesVisible = false, onToggleNotes, showArabicByDefault = false }: HadithCardProps) => {
  const { settings } = useSettings()
  const router = useRouter()
  const navigation = useNavigation()
  const { addBookmark, removeBookmark, isBookmarked } = useBookmarks()
  
  const [showArabic, setShowArabic] = useState(showArabicByDefault)
  const [expanded, setExpanded] = useState(settings.alwaysShowFullHadith)
  const [arabicExpanded, setArabicExpanded] = useState(true)
  
  // Check if this hadith is bookmarked
  const bookmarked = isBookmarked(hadith.bookId, hadith.id)
  
  // Update expanded state when settings change
  useEffect(() => {
    setExpanded(settings.alwaysShowFullHadith)
  }, [settings.alwaysShowFullHadith])
  
  // Update showArabic state when showArabicByDefault prop changes
  useEffect(() => {
    setShowArabic(showArabicByDefault)
  }, [showArabicByDefault])
  
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

  // Function to clean duplicate chain from matn
  const removeChainFromMatn = useCallback((matn: string, chain: string): string => {
    if (!matn || !chain) return matn

    const cleanMatn = matn.trim()
    const cleanChain = chain.trim()
    
    // Case 1: Exact match at the beginning
    if (cleanMatn.startsWith(cleanChain)) {
      let result = cleanMatn.slice(cleanChain.length).trim()
      // Remove leading colons, semicolons, and quotes
      result = result.replace(/^[:\s;"']+/, '').trim()
      return result
    }
    
    // Case 2: Chain might have slight variations (punctuation, spacing)
    // Normalize both texts for comparison
    const normalizeText = (text: string) => 
      text.replace(/[^\w\s]/g, ' ')  // Replace punctuation with spaces
          .replace(/\s+/g, ' ')      // Normalize whitespace
          .toLowerCase()
          .trim()
    
    const normalizedMatn = normalizeText(cleanMatn)
    const normalizedChain = normalizeText(cleanChain)
    
    if (normalizedMatn.startsWith(normalizedChain)) {
      // Find where the chain ends in the original text
      const words = cleanChain.split(/\s+/)
      let endIndex = 0
      let wordCount = 0
      
      for (let i = 0; i < cleanMatn.length && wordCount < words.length; i++) {
        if (/\w/.test(cleanMatn[i])) { // If it's a word character
          // Find the end of this word
          let wordEnd = i
          while (wordEnd < cleanMatn.length && /\w/.test(cleanMatn[wordEnd])) {
            wordEnd++
          }
          wordCount++
          endIndex = wordEnd
          i = wordEnd - 1 // Skip to end of word
        }
      }
      
      if (wordCount === words.length) {
        let result = cleanMatn.slice(endIndex).trim()
        // Remove leading punctuation that might separate chain from actual hadith
        result = result.replace(/^[:\s;"']+/, '').trim()
        return result
      }
    }
    
    return cleanMatn
  }, [])

  // Memoize expensive calculations
  const { englishText, arabicText, isLongText, isArabicLongText } = useMemo(() => {
    const rawEnglish = hadith.englishText || hadith.thaqalaynMatn
    const arabic = hadith.arabicText
    const chain = hadith.thaqalaynSanad
    
    // Remove duplicate chain from the beginning of the matn if both exist
    let processedEnglish = rawEnglish
    if (chain && rawEnglish) {
      processedEnglish = removeChainFromMatn(rawEnglish, chain)
    }
    
    return {
      englishText: processedEnglish,
      arabicText: arabic,
      isLongText: (processedEnglish?.length || 0) > 600,
      isArabicLongText: (arabic?.length || 0) > 600
    }
  }, [hadith.englishText, hadith.thaqalaynMatn, hadith.arabicText, hadith.thaqalaynSanad, removeChainFromMatn])

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

  // Returns the chapter URL for the hadith (for use in both navigation and anchor href)
  const getChapterUrl = useCallback(() => {
    let basePath = '/al-kafi';
    let isAlKafi = true;
    try {
      const bookId = hadith.bookId || '';
      const cfg = getBookConfig(bookId);
      if (cfg) {
        if (cfg.bookId === 'Al-Kafi') {
          basePath = '/al-kafi';
          isAlKafi = true;
        } else {
          basePath = `/${getBookUrlSlug(cfg.bookId)}`;
          isAlKafi = false;
        }
      } else if (bookId.includes('Uyun') || (hadith.book && hadith.book.toLowerCase().includes('uyun'))) {
        basePath = '/Uyun-akhbar-al-Rida';
        isAlKafi = false;
      } else if (bookId) {
        basePath = `/${getBookUrlSlug(bookId)}`;
        isAlKafi = false;
      }
    } catch (e) {
      if ((hadith.book && hadith.book.includes('Uyun')) || (hadith.bookId && hadith.bookId.includes('Uyun'))) {
        basePath = '/Uyun-akhbar-al-Rida';
        isAlKafi = false;
      } else if (hadith.bookId) {
        basePath = `/${getBookUrlSlug(hadith.bookId)}`;
        isAlKafi = false;
      }
    }
    if (isAlKafi) {
      return `${basePath}/volume/${hadith.volume}/chapter/${hadith.categoryId}/${hadith.chapterInCategoryId}`;
    } else {
      return `${basePath}/chapter/${hadith.categoryId}/${hadith.chapterInCategoryId}`;
    }
  }, [hadith.volume, hadith.categoryId, hadith.chapterInCategoryId, hadith.book, hadith.bookId]);

  // For backward compatibility, keep the handler (if needed elsewhere)
  const handleNavigateToChapter = useCallback(async () => {
    navigation.saveScrollPosition(window.scrollY);
    router.push(getChapterUrl());
  }, [navigation, router, getChapterUrl]);

  const handleCopyLink = useCallback(async () => {
    try {
      const bookId = hadith.bookId || ''
      let hadithUrl = ''
      
      console.log('Copy link - hadith:', { id: hadith.id, bookId, book: hadith.book })
      
      // Determine the correct path based on the book/collection
      const cfg = getBookConfig(bookId)
      console.log('Book config:', cfg)
      
      if (cfg) {
        if (cfg.bookId === 'Al-Kafi') {
          hadithUrl = `/al-kafi/hadith/${hadith.id}`
        } else {
          hadithUrl = `/${getBookUrlSlug(cfg.bookId)}/hadith/${hadith.id}`
        }
      } else if (bookId.includes('Uyun') || (hadith.book && hadith.book.toLowerCase().includes('uyun'))) {
        hadithUrl = `/Uyun-akhbar-al-Rida/hadith/${hadith.id}`
      } else if (bookId) {
        hadithUrl = `/${getBookUrlSlug(bookId)}/hadith/${hadith.id}`
      } else {
        hadithUrl = `/al-kafi/hadith/${hadith.id}` // fallback
      }
      
      console.log('Generated hadith URL:', hadithUrl)
      
      const fullUrl = `${window.location.origin}${hadithUrl}`
      console.log('Full URL to copy:', fullUrl)
      
      await navigator.clipboard.writeText(fullUrl)
      
      // Could add a toast notification here if you have a toast system
      // For now, we'll just provide visual feedback through the title change
      
    } catch (err) {
      console.error('Failed to copy link:', err)
    }
  }, [hadith.id, hadith.bookId, hadith.book])

  const handleCopySource = useCallback(async () => {
    try {
      // Format the source information
      let sourceText = ''
      
      // Book name
      const bookName = hadith.book || 'Unknown Book'
      
      // Chapter information
      const chapterInfo = hadith.chapter || 'Unknown Chapter'
      
      // Volume information (if available)
      const volumeInfo = hadith.volume ? `Volume ${hadith.volume}` : ''
      
      // Hadith number
      const hadithNumber = `Hadith ${hadith.id}`
      
      // Combine all parts
      if (volumeInfo) {
        sourceText = `${bookName}, ${volumeInfo}, ${chapterInfo}, ${hadithNumber}`
      } else {
        sourceText = `${bookName}, ${chapterInfo}, ${hadithNumber}`
      }
      
      await navigator.clipboard.writeText(sourceText)
      
      console.log('Copied source:', sourceText)
      
    } catch (err) {
      console.error('Failed to copy source:', err)
    }
  }, [hadith.book, hadith.chapter, hadith.volume, hadith.id])

  const handleCopyLinkAndSource = useCallback(async () => {
    try {
      // Get the link URL
      const bookId = hadith.bookId || ''
      let hadithUrl = ''
      
      // Determine the correct path based on the book/collection
      const cfg = getBookConfig(bookId)
      
      if (cfg) {
        if (cfg.bookId === 'Al-Kafi') {
          hadithUrl = `/al-kafi/hadith/${hadith.id}`
        } else {
          hadithUrl = `/${getBookUrlSlug(cfg.bookId)}/hadith/${hadith.id}`
        }
      } else if (bookId.includes('Uyun') || (hadith.book && hadith.book.toLowerCase().includes('uyun'))) {
        hadithUrl = `/Uyun-akhbar-al-Rida/hadith/${hadith.id}`
      } else if (bookId) {
        hadithUrl = `/${getBookUrlSlug(bookId)}/hadith/${hadith.id}`
      } else {
        hadithUrl = `/al-kafi/hadith/${hadith.id}` // fallback
      }
      
      const fullUrl = `${window.location.origin}${hadithUrl}`
      
      // Format the source information
      const bookName = hadith.book || 'Unknown Book'
      const chapterInfo = hadith.chapter || 'Unknown Chapter'
      const volumeInfo = hadith.volume ? `Volume ${hadith.volume}` : ''
      const hadithNumber = `Hadith ${hadith.id}`
      
      let sourceText = ''
      if (volumeInfo) {
        sourceText = `${bookName}, ${volumeInfo}, ${chapterInfo}, ${hadithNumber}`
      } else {
        sourceText = `${bookName}, ${chapterInfo}, ${hadithNumber}`
      }
      
      // Combine link and source
      const combinedText = `${sourceText}\n${fullUrl}`
      
      await navigator.clipboard.writeText(combinedText)
      
      console.log('Copied link and source:', combinedText)
      
    } catch (err) {
      console.error('Failed to copy link and source:', err)
    }
  }, [hadith.id, hadith.bookId, hadith.book, hadith.chapter, hadith.volume])

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
          {/* Bookmark Button */}
          <button
            onClick={e => {
              e.preventDefault();
              bookmarked ? removeBookmark(hadith.bookId, hadith.id) : addBookmark(hadith);
            }}
            className={clsx(
              'px-2 sm:px-3 py-1 rounded-lg text-xs font-medium transition-all shadow-soft min-w-[28px] sm:min-w-[32px] flex items-center justify-center',
              bookmarked 
                ? 'bg-yellow-500 text-white shadow-medium hover:bg-yellow-600' 
                : 'bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20 active:scale-95 dark:text-yellow-500'
            )}
            title={bookmarked ? 'Remove bookmark' : 'Add bookmark'}
          >
            {bookmarked ? (
              <IconBookmarkFilled className="w-3 h-3 sm:w-4 sm:h-4" />
            ) : (
              <IconBookmark className="w-3 h-3 sm:w-4 sm:h-4" />
            )}
          </button>
          
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
                  {arabicText.slice(0, 750)}...
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
                  {englishText.slice(0, 750)}...
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

        {/* Source Link and Actions */}
        <div className="flex items-center justify-between text-xs text-muted">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full">
            {/* Copy Link Button */}
            <button
              onClick={handleCopyLink}
              className="text-primary/70 hover:text-primary hover:underline flex items-center gap-1 transition-colors rounded px-2 py-1 min-w-[44px] min-h-[36px] text-xs sm:text-xs w-full sm:w-auto justify-center"
              title="Copy link to this hadith"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copy Link
            </button>
            
            {/* Copy Source Button */}
            <button
              onClick={handleCopySource}
              className="text-primary/70 hover:text-primary hover:underline flex items-center gap-1 transition-colors rounded px-2 py-1 min-w-[44px] min-h-[36px] text-xs sm:text-xs w-full sm:w-auto justify-center"
              title="Copy source citation (book, chapter, hadith number)"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Copy Source
            </button>
            
            {/* Copy Link & Source Button */}
            <button
              onClick={handleCopyLinkAndSource}
              className="text-primary/70 hover:text-primary hover:underline flex items-center gap-1 transition-colors rounded px-2 py-1 min-w-[44px] min-h-[36px] text-xs sm:text-xs w-full sm:w-auto justify-center"
              title="Copy both source citation and link"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              Copy Both
            </button>

            {/* Notes Toggle Button (only shown in bookmark context) */}
            {showNotesToggle && onToggleNotes && (
              <button
                onClick={onToggleNotes}
                className={clsx(
                  "flex items-center gap-1 transition-colors font-medium rounded px-2 py-1 min-w-[44px] min-h-[36px] text-xs sm:text-xs w-full sm:w-auto justify-center",
                  notesVisible 
                    ? "text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                    : "text-primary/70 hover:text-primary hover:underline"
                )}
                title={notesVisible ? "Hide notes" : "Show notes"}
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Notes
                <svg 
                  className={clsx(
                    "w-3 h-3 transition-transform duration-200",
                    notesVisible ? "rotate-180" : ""
                  )} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            )}
          </div>
          
          {/* View Chapter Button */}
          {showViewChapter && hadith.volume && hadith.categoryId && (hadith.chapterInCategoryId !== null && hadith.chapterInCategoryId !== undefined) ? (
            <a
              href={getChapterUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline flex items-center gap-1 transition-colors rounded px-2 py-1 min-w-[44px] min-h-[36px] text-xs sm:text-xs w-full sm:w-auto justify-center"
              tabIndex={0}
            >
              View Chapter
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>
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
