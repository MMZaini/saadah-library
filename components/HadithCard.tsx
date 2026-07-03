'use client'

import { useState, useEffect, useRef, useMemo, useCallback, memo, ReactNode } from 'react'
import { Hadith } from '@/lib/api'
import { findFirstMatchIndex, getHighlightSegments, normalizeArabic } from '@/lib/search-utils'
import { stripArabicFootnoteMarkers, stripEnglishFootnoteMarkers } from '@/lib/footnote-markers'
import { useSettings } from '@/lib/settings-context'
import { useBookmarks } from '@/lib/bookmarks-context'
import { getHadithUrl, getChapterUrl } from '@/lib/hadith-urls'
import { withBasePath } from '@/lib/assets'
import { cn, copyTextToClipboard, hasHarakat, removeHarakat } from '@/lib/utils'
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

// In side-by-side mode the text is scaled down a touch so two columns fit
// comfortably; the Arabic/English font-size sliders still apply on top of this.
// The wider side-by-side reading container (see globals.css) lets this sit
// closer to full size than it otherwise could. English reads comfortably a
// little larger than Arabic in the two-column layout, so it gets its own scale.
const SIDE_BY_SIDE_FONT_SCALE = 0.95
const SIDE_BY_SIDE_ENGLISH_FONT_SCALE = 1

// Texts longer than this are collapsed behind a "Read more" toggle.
const LONG_TEXT_THRESHOLD = 750

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

// ── Helpers ──

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

// ── Grading badge color mapping ──

function gradingVariant(grading: string): 'sahih' | 'hasan' | 'daif' | 'secondary' {
  // normalizeArabic lowercases and folds letter variants (e.g. Persian-yeh
  // spellings of ḍaʿīf) so the badge color matches the filter's behavior.
  const g = normalizeArabic(grading)
  if (g.includes('sahih') || g.includes('صحيح')) return 'sahih'
  if (g.includes('hasan') || g.includes('حسن') || g.includes('good')) return 'hasan'
  if (g.includes('daif') || g.includes('ضعيف') || g.includes('weak')) return 'daif'
  return 'secondary'
}

// ── Grading Interactive Component ──

function GradingBadge({
  author,
  grading,
  tooltipContent,
}: {
  author: string
  grading: string
  tooltipContent: ReactNode
}) {
  const [isOpen, setIsOpen] = useState(false)

  // We use close on blur to handle taps outside the tooltip effortlessly on mobile.
  return (
    <Tooltip open={isOpen} onOpenChange={setIsOpen}>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault()
            setIsOpen((prev) => !prev)
          }}
          onBlur={() => setIsOpen(false)}
          className="py-1 transition-transform hover:scale-[1.02] focus:outline-none active:scale-[0.98]"
        >
          <Badge variant={gradingVariant(grading)} className="cursor-pointer text-[11px] shadow-sm">
            {author}: {grading}
          </Badge>
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom">{tooltipContent}</TooltipContent>
    </Tooltip>
  )
}

// ── Main component ──

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
  const [arabicExpanded, setArabicExpanded] = useState(settings.alwaysShowFullHadith)
  const [sanadExpanded, setSanadExpanded] = useState(settings.alwaysShowFullHadith)
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null)
  const copyFeedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const bookmarked = isBookmarked(hadith.bookId, hadith.id)

  useEffect(() => {
    setExpanded(settings.alwaysShowFullHadith)
  }, [settings.alwaysShowFullHadith])

  useEffect(() => {
    setArabicExpanded(settings.alwaysShowFullHadith)
  }, [settings.alwaysShowFullHadith])

  useEffect(() => {
    setSanadExpanded(settings.alwaysShowFullHadith)
  }, [settings.alwaysShowFullHadith])

  useEffect(() => {
    setShowArabic(showArabicByDefault ?? settings.defaultLanguage === 'arabic')
  }, [showArabicByDefault, settings.defaultLanguage])

  // Memoize text processing. Both languages use the same length-based
  // "long text" rule; Arabic previously measured rendered overflow with a
  // DOM-clone per card per resize, which thrashed layout on long chapters.
  // Footnote markers are stripped here — before the chain/matn prefix
  // comparison, so both sides are transformed identically — which also keeps
  // the copy actions (they reuse these values) footnote-free.
  const { englishText, arabicText, sanadText, isLongText, isLongArabic } = useMemo(() => {
    const rawEnglish = stripEnglishFootnoteMarkers(hadith.englishText || hadith.thaqalaynMatn)
    const arabic = stripArabicFootnoteMarkers(hadith.arabicText)
    const chain = stripEnglishFootnoteMarkers(hadith.thaqalaynSanad)
    const processed = chain && rawEnglish ? removeChainFromMatn(rawEnglish, chain) : rawEnglish

    return {
      englishText: processed,
      arabicText: arabic,
      sanadText: chain,
      isLongText: (processed?.length || 0) > LONG_TEXT_THRESHOLD,
      isLongArabic: (arabic?.length || 0) > LONG_TEXT_THRESHOLD,
    }
  }, [hadith.englishText, hadith.thaqalaynMatn, hadith.arabicText, hadith.thaqalaynSanad])

  const hasArabic = Boolean(arabicText)
  const hasEnglish = Boolean(englishText)
  const bothLanguages = hasArabic && hasEnglish
  const fontScale = settings.sideBySide ? SIDE_BY_SIDE_FONT_SCALE : 1
  const englishFontScale = settings.sideBySide ? SIDE_BY_SIDE_ENGLISH_FONT_SCALE : 1

  // Truncation window for collapsed long texts. When a search highlight is
  // active and the first match sits beyond the visible window, the excerpt
  // recenters on the match so results never look like false positives.
  const makeExcerpt = useCallback(
    (text: string): string => {
      let start = 0
      if (highlightQuery?.trim()) {
        const matchIndex = findFirstMatchIndex(text, highlightQuery, { exactMatch })
        if (matchIndex > LONG_TEXT_THRESHOLD - 150) {
          start = Math.max(0, matchIndex - Math.floor(LONG_TEXT_THRESHOLD / 3))
          // Snap to the next word boundary so the excerpt starts cleanly.
          const boundary = text.indexOf(' ', start)
          if (boundary !== -1 && boundary < matchIndex) start = boundary + 1
        }
      }
      const end = Math.min(text.length, start + LONG_TEXT_THRESHOLD)
      return `${start > 0 ? '… ' : ''}${text.slice(start, end)}${end < text.length ? '…' : ''}`
    },
    [highlightQuery, exactMatch],
  )

  // Render text with search highlighting
  const renderHighlighted = useCallback(
    (text: string | undefined, truncate?: boolean): ReactNode => {
      if (!text) return null
      const display = truncate ? makeExcerpt(text) : text
      if (!highlightQuery?.trim()) return display
      const segments = getHighlightSegments(display, highlightQuery, { exactMatch })
      if (segments.length === 1 && !segments[0].highlight) return display
      return segments.map((seg, i) =>
        seg.highlight ? (
          <mark
            key={i}
            className="rounded-sm bg-yellow-300/80 px-0.5 text-inherit dark:bg-yellow-500/50"
          >
            {seg.text}
          </mark>
        ) : (
          seg.text
        ),
      )
    },
    [highlightQuery, exactMatch, makeExcerpt],
  )

  // Grading data
  const gradingData = useMemo(
    () => ({
      majlisi: hadith.gradingsFull?.find((g) => g.author.name_en.toLowerCase().includes('majlisi')),
      mohseni: hadith.gradingsFull?.find((g) => g.author.name_en.toLowerCase().includes('mohseni')),
      behbudi: hadith.gradingsFull?.find((g) => g.author.name_en.toLowerCase().includes('behbudi')),
    }),
    [hadith.gradingsFull],
  )

  // Copy helpers — flash accurate success/failure feedback, and clear the
  // timer on unmount so a pending flash never updates a dead component.
  const flash = useCallback((msg: string) => {
    setCopyFeedback(msg)
    if (copyFeedbackTimerRef.current) clearTimeout(copyFeedbackTimerRef.current)
    copyFeedbackTimerRef.current = setTimeout(() => setCopyFeedback(null), 1500)
  }, [])

  useEffect(
    () => () => {
      if (copyFeedbackTimerRef.current) clearTimeout(copyFeedbackTimerRef.current)
    },
    [],
  )

  const copyWithFeedback = useCallback(
    async (text: string, successMessage: string) => {
      flash((await copyTextToClipboard(text)) ? successMessage : 'Copy failed')
    },
    [flash],
  )

  const buildSourceLine = useCallback(() => {
    const parts = [hadith.book || 'Unknown Book']
    if (hadith.volume) parts.push(`Volume ${hadith.volume}`)
    parts.push(hadith.chapter || 'Unknown Chapter')
    parts.push(`Hadith ${hadith.id}`)
    return parts.join(', ')
  }, [hadith])

  const handleCopyLink = useCallback(async () => {
    const url = `${window.location.origin}${process.env.NEXT_PUBLIC_BASE_PATH || ''}${getHadithUrl(hadith)}`
    await copyWithFeedback(url, 'Link copied')
  }, [hadith, copyWithFeedback])

  const handleCopySource = useCallback(async () => {
    await copyWithFeedback(buildSourceLine(), 'Source copied')
  }, [buildSourceLine, copyWithFeedback])

  const handleCopyBoth = useCallback(async () => {
    const url = `${window.location.origin}${process.env.NEXT_PUBLIC_BASE_PATH || ''}${getHadithUrl(hadith)}`
    await copyWithFeedback(`${buildSourceLine()}\n${url}`, 'Copied')
  }, [hadith, buildSourceLine, copyWithFeedback])

  const handleCopyEnglish = useCallback(async () => {
    if (!englishText) return
    await copyWithFeedback(englishText, 'English copied')
  }, [englishText, copyWithFeedback])

  const handleCopyArabic = useCallback(
    async (withHarakat: boolean) => {
      if (!arabicText) return
      const text = withHarakat ? arabicText : removeHarakat(arabicText)
      await copyWithFeedback(text, 'Arabic copied')
    },
    [arabicText, copyWithFeedback],
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

  // Reusable render blocks so the single and side-by-side layouts share markup.
  const arabicTextBlock = (
    <>
      <div
        className="hadith-arabic-text text-right font-arabic text-foreground"
        dir="rtl"
        style={{ fontSize: `${settings.arabicFontSize * 1.485 * fontScale}%` }}
      >
        {isLongArabic && !arabicExpanded
          ? renderHighlighted(arabicText, true)
          : renderHighlighted(arabicText)}
      </div>
      {isLongArabic && (
        <button
          onClick={() => setArabicExpanded(!arabicExpanded)}
          className="mt-1 py-1 text-xs font-medium text-accent transition-colors hover:underline"
        >
          {arabicExpanded ? 'اعرض أقل' : 'اقرأ المزيد'}
        </button>
      )}
    </>
  )

  const arabicBoxedBlock = (
    <div className="hadith-block bg-surface-2/50 rounded-md border border-border">
      {arabicTextBlock}
    </div>
  )

  const englishBlock = (
    <>
      {sanadText && (
        // On mobile the sanad collapses to 3 lines to keep lists compact;
        // tapping it reveals the full chain. Desktop always shows it in full
        // (sm:line-clamp-none), so the tap toggle only matters below sm.
        <p
          onClick={() => setSanadExpanded((prev) => !prev)}
          className={cn(
            'hadith-english-size-only mb-2 cursor-pointer font-lora text-xs text-foreground-faint sm:line-clamp-none sm:cursor-auto sm:text-sm',
            !sanadExpanded && 'line-clamp-3',
          )}
          style={{ fontSize: `${settings.englishFontSize * englishFontScale}%` }}
        >
          {sanadText}
        </p>
      )}
      <div
        className="hadith-english-text text-sm leading-relaxed text-foreground sm:text-base"
        style={{ fontSize: `${settings.englishFontSize * englishFontScale}%` }}
      >
        {isLongText && !expanded
          ? renderHighlighted(englishText, true)
          : renderHighlighted(englishText)}
        {isLongText && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="ml-1 inline-block py-1 text-xs font-medium text-accent transition-colors hover:underline"
          >
            {expanded ? 'Show less' : 'Read more'}
          </button>
        )}
      </div>
    </>
  )

  return (
    <article className={cn('rounded-lg border border-border bg-surface-1 p-4 sm:p-5', className)}>
      {/* ── Header ── */}
      <div className="mb-3 flex items-center justify-end gap-1">
        <span className="mr-auto text-xs tabular-nums text-foreground-faint">#{hadith.id}</span>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn('h-9 w-9 sm:h-7 sm:w-7', bookmarked && 'text-bookmark')}
              onClick={handleBookmarkToggle}
              aria-label={bookmarked ? 'Remove bookmark' : 'Bookmark this hadith'}
              aria-pressed={bookmarked}
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

        {hasArabic && !settings.sideBySide && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={showArabic ? 'default' : 'ghost'}
                size="icon"
                className="h-9 w-9 sm:h-7 sm:w-7"
                onClick={() => setShowArabic(!showArabic)}
                aria-label={showArabic ? 'Hide Arabic text' : 'Show Arabic text'}
                aria-pressed={showArabic}
              >
                <Languages className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{showArabic ? 'Hide Arabic' : 'Show Arabic'}</TooltipContent>
          </Tooltip>
        )}

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 sm:h-7 sm:w-7"
              onClick={handleOpenNewTab}
              aria-label="Open hadith in new tab"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Open in new tab</TooltipContent>
        </Tooltip>
      </div>

      {/* ── Content ── */}
      <div className="space-y-3">
        {settings.sideBySide ? (
          bothLanguages ? (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="min-w-0">{englishBlock}</div>
              <div className="min-w-0 lg:border-l lg:border-divider lg:pl-6">{arabicTextBlock}</div>
            </div>
          ) : (
            <div className="lg:max-w-2xl">{hasArabic ? arabicBoxedBlock : englishBlock}</div>
          )
        ) : showArabic && hasArabic ? (
          arabicBoxedBlock
        ) : (
          englishBlock
        )}
      </div>

      {/* ── Gradings ── */}
      {(hadith.majlisiGrading || hadith.mohseniGrading || hadith.behbudiGrading) && (
        <>
          <Separator className="my-3" />
          <div className="flex flex-wrap items-center gap-1.5">
            {hadith.majlisiGrading && (
              <GradingBadge
                author="Majlisi"
                grading={hadith.majlisiGrading}
                tooltipContent={
                  gradingTooltipContent(gradingData.majlisi, hadith.majlisiGrading) ||
                  'Majlisi grading'
                }
              />
            )}
            {hadith.mohseniGrading && (
              <GradingBadge
                author="Mohseni"
                grading={hadith.mohseniGrading}
                tooltipContent={
                  gradingTooltipContent(gradingData.mohseni, hadith.mohseniGrading) ||
                  'Mohseni grading'
                }
              />
            )}
            {hadith.behbudiGrading && (
              <GradingBadge
                author="Behbudi"
                grading={hadith.behbudiGrading}
                tooltipContent={
                  gradingTooltipContent(gradingData.behbudi, hadith.behbudiGrading) ||
                  'Behbudi grading'
                }
              />
            )}
          </div>
        </>
      )}

      {/* ── Footer actions ── */}
      <Separator className="my-3" />
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          {/* Copy dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-9 gap-1 px-2 text-xs text-foreground-muted sm:h-7"
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
                'h-9 gap-1 px-2 text-xs sm:h-7',
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
              href={withBasePath(chapterUrl)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-0.5 py-1.5 text-xs font-medium text-foreground-muted transition-colors hover:text-foreground"
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
