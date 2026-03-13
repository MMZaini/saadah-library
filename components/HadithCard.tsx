'use client'

import { useState, useEffect, useRef, useMemo, useCallback, memo, ReactNode } from 'react'
import { Hadith } from '@/lib/api'
import { getHighlightSegments } from '@/lib/search-utils'
import { useSettings } from '@/lib/settings-context'
import { useBookmarks } from '@/lib/bookmarks-context'
import { getBookConfig, getBookUrlSlug } from '@/lib/books-config'
import { cn, hasHarakat, removeHarakat } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Bookmark,
  BookmarkCheck,
  Copy,
  ExternalLink,
  ChevronRight,
  FileText,
  Link2,
  ClipboardList,
  StickyNote,
  ChevronDown,
  Languages,
  ALargeSmall,
  Type,
} from 'lucide-react'

interface HadithCardProps {
  hadith: Hadith
  className?: string
  showViewChapter?: boolean
  showNotesToggle?: boolean
  notesVisible?: boolean
  onToggleNotes?: () => void
  showArabicByDefault?: boolean
  highlightQuery?: string
  exactMatch?: boolean
}

// â”€â”€ Helpers â”€â”€

function removeChainFromMatn(matn: string, chain: string): string {
  if (!matn || !chain) return matn
  const cleanMatn = matn.trim()
  const cleanChain = chain.trim()

  if (cleanMatn.startsWith(cleanChain)) {
    return cleanMatn
      .slice(cleanChain.length)
      .replace(/^[:\s;"']+/, '')
      .trim()
  }

  const normalize = (t: string) =>
    t
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .toLowerCase()
      .trim()

  if (normalize(cleanMatn).startsWith(normalize(cleanChain))) {
    const words = cleanChain.split(/\s+/)
    let endIndex = 0
    let wordCount = 0
    for (let i = 0; i < cleanMatn.length && wordCount < words.length; i++) {
      if (/\w/.test(cleanMatn[i])) {
        let j = i
        while (j < cleanMatn.length && /\w/.test(cleanMatn[j])) j++
        wordCount++
        endIndex = j
        i = j - 1
      }
    }
    if (wordCount === words.length) {
      return cleanMatn
        .slice(endIndex)
        .replace(/^[:\s;"']+/, '')
        .trim()
    }
  }
  return cleanMatn
}

function getHadithUrl(hadith: Hadith): string {
  const bookId = hadith.bookId || ''
  const cfg = getBookConfig(bookId)

  if (cfg) {
    return cfg.bookId === 'Al-Kafi'
      ? `/al-kafi/hadith/${hadith.id}`
      : `/${getBookUrlSlug(cfg.bookId)}/hadith/${hadith.id}`
  }
  if (bookId.includes('Uyun') || hadith.book?.toLowerCase().includes('uyun')) {
    return `/Uyun-akhbar-al-Rida/hadith/${hadith.id}`
  }
  if (bookId) return `/${getBookUrlSlug(bookId)}/hadith/${hadith.id}`
  return `/al-kafi/hadith/${hadith.id}`
}

function getChapterUrl(hadith: Hadith): string {
  const bookId = hadith.bookId || ''
  const cfg = getBookConfig(bookId)
  let basePath = '/al-kafi'
  let isAlKafi = true

  if (cfg) {
    if (cfg.bookId === 'Al-Kafi') {
      basePath = '/al-kafi'
    } else {
      basePath = `/${getBookUrlSlug(cfg.bookId)}`
      isAlKafi = false
    }
  } else if (bookId.includes('Uyun') || hadith.book?.toLowerCase().includes('uyun')) {
    basePath = '/Uyun-akhbar-al-Rida'
    isAlKafi = false
  } else if (bookId) {
    basePath = `/${getBookUrlSlug(bookId)}`
    isAlKafi = false
  }

  return isAlKafi
    ? `${basePath}/volume/${hadith.volume}/chapter/${hadith.categoryId}/${hadith.chapterInCategoryId}`
    : `${basePath}/chapter/${hadith.categoryId}/${hadith.chapterInCategoryId}`
}

// â”€â”€ Grading badge color mapping â”€â”€

function gradingVariant(grading: string): 'sahih' | 'hasan' | 'daif' | 'secondary' {
  const g = grading.toLowerCase()
  if (g.includes('sahih') || g.includes('ØµØ­ÙŠØ­')) return 'sahih'
  if (g.includes('hasan') || g.includes('Ø­Ø³Ù†') || g.includes('good')) return 'hasan'
  if (g.includes('daif') || g.includes('Ø¶Ø¹ÙŠÙ') || g.includes('weak')) return 'daif'
  return 'secondary'
}

// â”€â”€ Main component â”€â”€

const HadithCard = ({
  hadith,
  className,
  showViewChapter = false,
  showNotesToggle = false,
  notesVisible = false,
  onToggleNotes,
  showArabicByDefault,
  highlightQuery,
  exactMatch = false,
}: HadithCardProps) => {
  const { settings } = useSettings()
  const { addBookmark, removeBookmark, isBookmarked } = useBookmarks()

  // Resolve initial Arabic visibility: explicit prop wins, otherwise use the global setting
  const resolvedArabicDefault = showArabicByDefault ?? settings.defaultLanguage === 'arabic'

  const [showArabic, setShowArabic] = useState(resolvedArabicDefault)
  const [expanded, setExpanded] = useState(settings.alwaysShowFullHadith)
  const [arabicExpanded, setArabicExpanded] = useState(true)
  const arabicRef = useRef<HTMLDivElement | null>(null)
  const [arabicOverflow, setArabicOverflow] = useState(false)
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null)

  const bookmarked = isBookmarked(hadith.bookId, hadith.id)

  useEffect(() => {
    setExpanded(settings.alwaysShowFullHadith)
  }, [settings.alwaysShowFullHadith])

  useEffect(() => {
    setShowArabic(showArabicByDefault ?? settings.defaultLanguage === 'arabic')
  }, [showArabicByDefault, settings.defaultLanguage])

  // Memoize text processing
  const { englishText, arabicText, isLongText } = useMemo(() => {
    const rawEnglish = hadith.englishText || hadith.thaqalaynMatn
    const arabic = hadith.arabicText
    const chain = hadith.thaqalaynSanad
    const processed = chain && rawEnglish ? removeChainFromMatn(rawEnglish, chain) : rawEnglish

    return {
      englishText: processed,
      arabicText: arabic,
      isLongText: (processed?.length || 0) > 750,
    }
  }, [hadith.englishText, hadith.thaqalaynMatn, hadith.arabicText, hadith.thaqalaynSanad])

  // Render text with search highlighting
  const renderHighlighted = useCallback(
    (text: string | undefined, truncate?: boolean): ReactNode => {
      if (!text) return null
      const display = truncate ? text.slice(0, 750) + '...' : text
      if (!highlightQuery?.trim()) return display
      const segments = getHighlightSegments(display, highlightQuery, { exactMatch })
      if (segments.length === 1 && !segments[0].highlight) return display
      return segments.map((seg, i) =>
        seg.highlight ? (
          <mark
            key={i}
            className="bg-yellow-300/80 dark:bg-yellow-500/50 text-inherit rounded-sm px-0.5"
          >
            {seg.text}
          </mark>
        ) : (
          seg.text
        ),
      )
    },
    [highlightQuery, exactMatch],
  )

  // Arabic overflow detection
  useEffect(() => {
    const el = arabicRef.current
    if (!el) {
      setArabicOverflow(false)
      return
    }
    const check = () => {
      try {
        const clone = el.cloneNode(true) as HTMLElement
        clone.style.cssText = `position:absolute;visibility:hidden;width:${el.offsetWidth}px;max-height:none;height:auto`
        document.body.appendChild(clone)
        const overflow = clone.scrollHeight > el.clientHeight + 2
        document.body.removeChild(clone)
        setArabicOverflow(overflow)
      } catch {
        setArabicOverflow(false)
      }
    }
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [arabicText, settings.arabicFontSize, arabicExpanded])

  // Grading data
  const gradingData = useMemo(
    () => ({
      majlisi: hadith.gradingsFull?.find((g) => g.author.name_en.toLowerCase().includes('majlisi')),
      mohseni: hadith.gradingsFull?.find((g) => g.author.name_en.toLowerCase().includes('mohseni')),
      behbudi: hadith.gradingsFull?.find((g) => g.author.name_en.toLowerCase().includes('behbudi')),
    }),
    [hadith.gradingsFull],
  )

  // Copy helpers
  const flash = useCallback((msg: string) => {
    setCopyFeedback(msg)
    setTimeout(() => setCopyFeedback(null), 1500)
  }, [])

  const handleCopyLink = useCallback(async () => {
    const url = `${window.location.origin}${process.env.NEXT_PUBLIC_BASE_PATH || ''}${getHadithUrl(hadith)}`
    await navigator.clipboard.writeText(url)
    flash('Link copied')
  }, [hadith, flash])

  const handleCopySource = useCallback(async () => {
    const parts = [hadith.book || 'Unknown Book']
    if (hadith.volume) parts.push(`Volume ${hadith.volume}`)
    parts.push(hadith.chapter || 'Unknown Chapter')
    parts.push(`Hadith ${hadith.id}`)
    await navigator.clipboard.writeText(parts.join(', '))
    flash('Source copied')
  }, [hadith, flash])

  const handleCopyBoth = useCallback(async () => {
    const url = `${window.location.origin}${process.env.NEXT_PUBLIC_BASE_PATH || ''}${getHadithUrl(hadith)}`
    const parts = [hadith.book || 'Unknown Book']
    if (hadith.volume) parts.push(`Volume ${hadith.volume}`)
    parts.push(hadith.chapter || 'Unknown Chapter')
    parts.push(`Hadith ${hadith.id}`)
    await navigator.clipboard.writeText(`${parts.join(', ')}\n${url}`)
    flash('Copied')
  }, [hadith, flash])

  const handleCopyEnglish = useCallback(async () => {
    if (!englishText) return
    await navigator.clipboard.writeText(englishText)
    flash('English copied')
  }, [englishText, flash])

  const handleCopyArabic = useCallback(
    async (withHarakat: boolean) => {
      if (!arabicText) return
      const text = withHarakat ? arabicText : removeHarakat(arabicText)
      await navigator.clipboard.writeText(text)
      flash('Arabic copied')
    },
    [arabicText, flash],
  )

  const handleOpenNewTab = useCallback(() => {
    window.open(
      `${window.location.origin}${process.env.NEXT_PUBLIC_BASE_PATH || ''}${getHadithUrl(hadith)}`,
      '_blank',
      'noopener',
    )
  }, [hadith])

  const handleBookmarkToggle = useCallback(() => {
    if (bookmarked) {
      removeBookmark(hadith.bookId, hadith.id)
    } else {
      addBookmark(hadith)
    }
  }, [bookmarked, hadith, addBookmark, removeBookmark])

  const chapterUrl = useMemo(() => getChapterUrl(hadith), [hadith])

  // Grading tooltip content builder
  const getGradingInfo = (grading: string) => {
    const variant = gradingVariant(grading)
    if (variant === 'sahih')
      return {
        number: '1',
        color: 'text-emerald-400',
        note: 'Strong chain. Does not guarantee full authenticity. Further investigation required.',
      }
    if (variant === 'hasan')
      return {
        number: '1',
        color: 'text-emerald-400',
        note: 'Good chain. May be authentic, but does not guarantee full authenticity. Further investigation required.',
      }
    if (variant === 'daif')
      return {
        number: '2',
        color: 'text-red-400',
        note: 'Weak chain. Does not necessarily mean the hadith is inauthentic. Further investigation required.',
      }
    return {
      number: '3',
      color: 'text-foreground-muted',
      note: "Chain requires further investigation. Does not determine the hadith's authenticity.",
    }
  }

  const gradingTooltipContent = (data: typeof gradingData.majlisi, grading?: string) => {
    if (!data) return null
    const info = grading ? getGradingInfo(grading) : null
    return (
      <div className="max-w-[200px] space-y-1.5 text-xs">
        <p className="font-medium">
          {data.author.name_en}
          {data.author.death_date && (
            <span className="font-normal text-foreground-muted">
              {' '}
              (d. {data.author.death_date})
            </span>
          )}
        </p>
        {data.grade_en && <p>{data.grade_en}</p>}
        {data.grade_ar && <p dir="rtl">{data.grade_ar}</p>}
        {data.reference_en && (
          <p className="border-t border-border pt-1 text-foreground-muted">{data.reference_en}</p>
        )}
        {info && (
          <p className="border-t border-border pt-1.5 italic leading-snug text-foreground-muted">
            {info.note}
          </p>
        )}
      </div>
    )
  }

  return (
    <article className={cn('rounded-lg border border-border bg-surface-1 p-4 sm:p-5', className)}>
      {/* â”€â”€ Header â”€â”€ */}
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant="secondary" className="text-[11px]">
              {hadith.book} {hadith.volume ? `Â· Vol. ${hadith.volume}` : ''}
            </Badge>
            <span className="text-xs tabular-nums text-foreground-faint">#{hadith.id}</span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex shrink-0 items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn('h-7 w-7', bookmarked && 'text-bookmark')}
                onClick={handleBookmarkToggle}
              >
                {bookmarked ? (
                  <BookmarkCheck className="h-3.5 w-3.5" />
                ) : (
                  <Bookmark className="h-3.5 w-3.5" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{bookmarked ? 'Remove bookmark' : 'Bookmark'}</TooltipContent>
          </Tooltip>

          {arabicText && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={showArabic ? 'default' : 'ghost'}
                  size="icon"
                  className="h-7 w-7 font-arabic text-xs"
                  onClick={() => setShowArabic(!showArabic)}
                >
                  Ø¹
                </Button>
              </TooltipTrigger>
              <TooltipContent>{showArabic ? 'Hide Arabic' : 'Show Arabic'}</TooltipContent>
            </Tooltip>
          )}

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleOpenNewTab}>
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Open in new tab</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* â”€â”€ Content â”€â”€ */}
      <div className="space-y-3">
        {showArabic && arabicText ? (
          <div className="hadith-block bg-surface-2/50 rounded-md border border-border">
            <div
              ref={arabicRef}
              className="hadith-arabic-text text-right font-arabic text-foreground"
              dir="rtl"
              style={{ fontSize: `${settings.arabicFontSize * 1.485}%` }}
            >
              {arabicOverflow && !arabicExpanded
                ? renderHighlighted(arabicText, true)
                : renderHighlighted(arabicText)}
            </div>
            {arabicOverflow && (
              <button
                onClick={() => setArabicExpanded(!arabicExpanded)}
                className="mt-1 text-xs font-medium text-accent transition-colors hover:underline"
              >
                {arabicExpanded ? 'Ø§Ø¹Ø±Ø¶ Ø£Ù‚Ù„' : 'Ø§Ù‚Ø±Ø£ Ø§Ù„Ù…Ø²ÙŠØ¯'}
              </button>
            )}
          </div>
        ) : (
          <div>
            {hadith.thaqalaynSanad && (
              <p
                className="hadith-english-size-only mb-2 line-clamp-3 font-lora text-xs text-foreground-faint sm:line-clamp-none sm:text-sm"
                style={{ fontSize: `${settings.englishFontSize}%` }}
              >
                {hadith.thaqalaynSanad.trim()}
              </p>
            )}
            <div
              className="hadith-english-text text-sm leading-relaxed text-foreground sm:text-base"
              style={{ fontSize: `${settings.englishFontSize}%` }}
            >
              {isLongText && !expanded
                ? renderHighlighted(englishText, true)
                : renderHighlighted(englishText)}
              {isLongText && (
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="ml-1 text-xs font-medium text-accent transition-colors hover:underline"
                >
                  {expanded ? 'Show less' : 'Read more'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* â”€â”€ Gradings â”€â”€ */}
      {(hadith.majlisiGrading || hadith.mohseniGrading || hadith.behbudiGrading) && (
        <>
          <Separator className="my-3" />
          <div className="flex flex-wrap items-center gap-1.5">
            {hadith.majlisiGrading && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Badge
                      variant={gradingVariant(hadith.majlisiGrading)}
                      className="cursor-default text-[11px]"
                    >
                      Majlisi: {hadith.majlisiGrading}
                    </Badge>
                  </span>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  {gradingTooltipContent(gradingData.majlisi, hadith.majlisiGrading) ||
                    'Majlisi grading'}
                </TooltipContent>
              </Tooltip>
            )}
            {hadith.mohseniGrading && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Badge
                      variant={gradingVariant(hadith.mohseniGrading)}
                      className="cursor-default text-[11px]"
                    >
                      Mohseni: {hadith.mohseniGrading}
                    </Badge>
                  </span>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  {gradingTooltipContent(gradingData.mohseni, hadith.mohseniGrading) ||
                    'Mohseni grading'}
                </TooltipContent>
              </Tooltip>
            )}
            {hadith.behbudiGrading && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Badge
                      variant={gradingVariant(hadith.behbudiGrading)}
                      className="cursor-default text-[11px]"
                    >
                      Behbudi: {hadith.behbudiGrading}
                    </Badge>
                  </span>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  {gradingTooltipContent(gradingData.behbudi, hadith.behbudiGrading) ||
                    'Behbudi grading'}
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </>
      )}

      {/* â”€â”€ Footer actions â”€â”€ */}
      <Separator className="my-3" />
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          {/* Copy dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1 px-2 text-xs text-foreground-muted"
              >
                <Copy className="h-3 w-3" />
                {copyFeedback || 'Copy'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {englishText && (
                <DropdownMenuItem onClick={handleCopyEnglish}>
                  <Type className="mr-2 h-3.5 w-3.5" />
                  Copy English
                </DropdownMenuItem>
              )}
              {arabicText && (
                <>
                  {hasHarakat(arabicText) ? (
                    <>
                      <DropdownMenuItem onClick={() => handleCopyArabic(true)}>
                        <Languages className="mr-2 h-3.5 w-3.5" />
                        Copy Arabic
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleCopyArabic(false)}>
                        <ALargeSmall className="mr-2 h-3.5 w-3.5" />
                        Copy Arabic (no harakat)
                      </DropdownMenuItem>
                    </>
                  ) : (
                    <DropdownMenuItem onClick={() => handleCopyArabic(true)}>
                      <Languages className="mr-2 h-3.5 w-3.5" />
                      Copy Arabic
                    </DropdownMenuItem>
                  )}
                </>
              )}
              {(englishText || arabicText) && <DropdownMenuSeparator />}
              <DropdownMenuItem onClick={handleCopyLink}>
                <Link2 className="mr-2 h-3.5 w-3.5" />
                Copy link
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleCopySource}>
                <FileText className="mr-2 h-3.5 w-3.5" />
                Copy source
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleCopyBoth}>
                <ClipboardList className="mr-2 h-3.5 w-3.5" />
                Copy both
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Notes toggle */}
          {showNotesToggle && onToggleNotes && (
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                'h-7 gap-1 px-2 text-xs',
                notesVisible ? 'text-accent' : 'text-foreground-muted',
              )}
              onClick={onToggleNotes}
            >
              <StickyNote className="h-3 w-3" />
              Notes
              <ChevronDown
                className={cn('h-3 w-3 transition-transform', notesVisible && 'rotate-180')}
              />
            </Button>
          )}
        </div>

        {/* View chapter */}
        {showViewChapter &&
          hadith.volume &&
          hadith.categoryId &&
          hadith.chapterInCategoryId != null && (
            <a
              href={chapterUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-0.5 text-xs font-medium text-foreground-muted transition-colors hover:text-foreground"
            >
              View Chapter
              <ChevronRight className="h-3 w-3" />
            </a>
          )}
      </div>
    </article>
  )
}

export default memo(HadithCard)
