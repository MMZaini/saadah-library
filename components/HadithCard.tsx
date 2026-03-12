'use client'

import { useState, useEffect, useRef, useMemo, useCallback, memo } from 'react'
import { useRouter } from 'next/navigation'
import { Hadith } from '@/lib/api'
import { useSettings } from '@/lib/settings-context'
import { useNavigation } from '@/lib/navigation-context'
import { useBookmarks } from '@/lib/bookmarks-context'
import { getBookConfig, getBookUrlSlug } from '@/lib/books-config'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Bookmark,
  BookmarkCheck,
  Copy,
  ExternalLink,
  ChevronRight,
  MoreHorizontal,
  FileText,
  Link2,
  ClipboardList,
  StickyNote,
  ChevronDown,
} from 'lucide-react'

interface HadithCardProps {
  hadith: Hadith
  className?: string
  showViewChapter?: boolean
  showNotesToggle?: boolean
  notesVisible?: boolean
  onToggleNotes?: () => void
  showArabicByDefault?: boolean
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

// ── Grading badge color mapping ──

function gradingVariant(grading: string): 'sahih' | 'hasan' | 'daif' | 'secondary' {
  const g = grading.toLowerCase()
  if (g.includes('sahih') || g.includes('صحيح')) return 'sahih'
  if (g.includes('hasan') || g.includes('حسن') || g.includes('good')) return 'hasan'
  if (g.includes('daif') || g.includes('ضعيف') || g.includes('weak')) return 'daif'
  return 'secondary'
}

// ── Main component ──

const HadithCard = ({
  hadith,
  className,
  showViewChapter = false,
  showNotesToggle = false,
  notesVisible = false,
  onToggleNotes,
  showArabicByDefault = false,
}: HadithCardProps) => {
  const { settings } = useSettings()
  const router = useRouter()
  const navigation = useNavigation()
  const { addBookmark, removeBookmark, isBookmarked } = useBookmarks()

  const [showArabic, setShowArabic] = useState(showArabicByDefault)
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
    setShowArabic(showArabicByDefault)
  }, [showArabicByDefault])

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
    const url = `${window.location.origin}${getHadithUrl(hadith)}`
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
    const url = `${window.location.origin}${getHadithUrl(hadith)}`
    const parts = [hadith.book || 'Unknown Book']
    if (hadith.volume) parts.push(`Volume ${hadith.volume}`)
    parts.push(hadith.chapter || 'Unknown Chapter')
    parts.push(`Hadith ${hadith.id}`)
    await navigator.clipboard.writeText(`${parts.join(', ')}\n${url}`)
    flash('Copied')
  }, [hadith, flash])

  const handleOpenNewTab = useCallback(() => {
    window.open(`${window.location.origin}${getHadithUrl(hadith)}`, '_blank', 'noopener')
  }, [hadith])

  const handleBookmarkToggle = useCallback(() => {
    bookmarked ? removeBookmark(hadith.bookId, hadith.id) : addBookmark(hadith)
  }, [bookmarked, hadith, addBookmark, removeBookmark])

  const chapterUrl = useMemo(() => getChapterUrl(hadith), [hadith])

  // Grading tooltip content builder
  const gradingTooltipContent = (data: typeof gradingData.majlisi) => {
    if (!data) return null
    return (
      <div className="max-w-xs space-y-1 text-xs">
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
      </div>
    )
  }

  return (
    <article className={cn('rounded-lg border border-border bg-surface-1 p-4 sm:p-5', className)}>
      {/* ── Header ── */}
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant="secondary" className="text-[11px]">
              {hadith.book} {hadith.volume ? `· Vol. ${hadith.volume}` : ''}
            </Badge>
            <span className="text-xs tabular-nums text-foreground-faint">#{hadith.id}</span>
          </div>
          <p className="line-clamp-1 text-sm font-medium text-foreground">{hadith.category}</p>
          <p className="line-clamp-1 text-xs text-foreground-muted">{hadith.chapter}</p>
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
                  ع
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

      {/* ── Content ── */}
      <div className="space-y-3">
        {showArabic && arabicText ? (
          <div className="hadith-block bg-surface-2/50 rounded-md border border-border">
            <div
              ref={arabicRef}
              className="hadith-arabic-text text-right font-arabic text-base leading-loose text-foreground sm:text-lg"
              dir="rtl"
              style={{ fontSize: `${settings.arabicFontSize}%` }}
            >
              {arabicOverflow && !arabicExpanded ? <>{arabicText.slice(0, 750)}...</> : arabicText}
            </div>
            {arabicOverflow && (
              <button
                onClick={() => setArabicExpanded(!arabicExpanded)}
                className="mt-1 text-xs font-medium text-accent transition-colors hover:underline"
              >
                {arabicExpanded ? 'اعرض أقل' : 'اقرأ المزيد'}
              </button>
            )}
          </div>
        ) : (
          <div>
            {hadith.thaqalaynSanad && (
              <p
                className="hadith-english-text mb-2 line-clamp-3 font-mono text-xs text-foreground-faint sm:line-clamp-none sm:text-sm"
                style={{ fontSize: `${settings.englishFontSize}%` }}
              >
                {hadith.thaqalaynSanad.trim()}
              </p>
            )}
            <div
              className="hadith-english-text text-sm leading-relaxed text-foreground sm:text-base"
              style={{ fontSize: `${settings.englishFontSize}%` }}
            >
              {isLongText && !expanded ? <>{englishText.slice(0, 750)}...</> : englishText}
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

      {/* ── Gradings ── */}
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
                      className="cursor-help text-[11px]"
                    >
                      Majlisi: {hadith.majlisiGrading}
                    </Badge>
                  </span>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  {gradingTooltipContent(gradingData.majlisi) || 'Majlisi grading'}
                </TooltipContent>
              </Tooltip>
            )}
            {hadith.mohseniGrading && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Badge
                      variant={gradingVariant(hadith.mohseniGrading)}
                      className="cursor-help text-[11px]"
                    >
                      Mohseni: {hadith.mohseniGrading}
                    </Badge>
                  </span>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  {gradingTooltipContent(gradingData.mohseni) || 'Mohseni grading'}
                </TooltipContent>
              </Tooltip>
            )}
            {hadith.behbudiGrading && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Badge
                      variant={gradingVariant(hadith.behbudiGrading)}
                      className="cursor-help text-[11px]"
                    >
                      Behbudi: {hadith.behbudiGrading}
                    </Badge>
                  </span>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  {gradingTooltipContent(gradingData.behbudi) || 'Behbudi grading'}
                </TooltipContent>
              </Tooltip>
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
                className="h-7 gap-1 px-2 text-xs text-foreground-muted"
              >
                <Copy className="h-3 w-3" />
                {copyFeedback || 'Copy'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
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
