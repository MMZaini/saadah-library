import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Arabic diacritical marks (harakat / tashkeel) character class.
 * Covers: small-sign marks (U+0610-U+061A), Fathatan–Sukun and extended
 * marks (U+064B-U+065F), and superscript alef (U+0670).
 */
const HARAKAT_CHAR_CLASS = '[\u0610-\u061A\u064B-\u065F\u0670]'

/** Returns true if the text contains any Arabic harakat. */
export function hasHarakat(text: string): boolean {
  return new RegExp(HARAKAT_CHAR_CLASS).test(text)
}

/** Strips Arabic harakat / tashkeel from text. */
export function removeHarakat(text: string): string {
  return text.replace(new RegExp(HARAKAT_CHAR_CLASS, 'g'), '')
}

/**
 * Folds non-standard Arabic-script code points that the Uthmanic Hafs display
 * font (`.font-arabic`) cannot draw — it ships only placeholder "stub" glyphs
 * for them, which the browser renders as broken dotted-circle ornaments — to
 * the standard Arabic letters the font renders correctly, with full cursive
 * joining.
 *
 * These Persian/Urdu code points appear in the dataset because the upstream
 * texts were digitised from Persian sources: e.g. Farsi yeh (ی U+06CC) in
 * رَضِیتُ where Arabic yeh (ي U+064A) is meant, and keheh (ک U+06A9) for kaf
 * (ك U+0643). Only characters with an unambiguous standard-Arabic equivalent
 * are folded here — the substituted letter renders in-font and joins to its
 * neighbours. Genuinely Persian letters with no Arabic counterpart (پ چ گ ژ)
 * and punctuation/signs (؟ ۔) are deliberately left untouched; those are
 * non-joining, so they are handled at the font layer by the @font-face
 * `unicode-range` in globals.css, which routes them to Noto Sans Arabic.
 *
 * Unlike `normalizeArabic` (search-utils), this preserves harakat and every
 * other character, so it is safe on the way to the screen and clipboard.
 * Pure and idempotent.
 */
const ARABIC_PRESENTATION_FOLD: Readonly<Record<string, string>> = {
  ی: 'ي', // Farsi yeh ی → Arabic yeh ي
  ک: 'ك', // keheh ک → Arabic kaf ك
  ڪ: 'ك', // swash kaf ڪ → Arabic kaf ك
  ھ: 'ه', // heh doachashmee ھ → Arabic heh ه
  ہ: 'ه', // heh goal ہ → Arabic heh ه
  // Extended (Persian) Arabic-Indic digits ۰-۹ → standard Arabic-Indic ٠-٩,
  // which the Quranic font draws (used for verse numbers).
  '۰': '٠',
  '۱': '١',
  '۲': '٢',
  '۳': '٣',
  '۴': '٤',
  '۵': '٥',
  '۶': '٦',
  '۷': '٧',
  '۸': '٨',
  '۹': '٩',
}

const ARABIC_PRESENTATION_CHAR_CLASS = /[یکڪھہ۰-۹]/g

export function normalizeArabicPresentation(text: string): string
export function normalizeArabicPresentation(text: string | undefined): string | undefined
export function normalizeArabicPresentation(text: string | undefined): string | undefined {
  if (!text) return text
  // Runs unconditionally (no stateful `.test()` on the global regex); the
  // replace is a no-op copy when nothing matches.
  return text.replace(ARABIC_PRESENTATION_CHAR_CLASS, (ch) => ARABIC_PRESENTATION_FOLD[ch] ?? ch)
}

/**
 * True if the error is the browser's storage-quota error. Browsers put the
 * identifier in `error.name` (the message text varies per engine), with
 * legacy DOMException code 22 as a fallback.
 */
export function isQuotaExceededError(error: unknown): boolean {
  return (
    error instanceof DOMException &&
    (error.name === 'QuotaExceededError' ||
      error.code === 22 ||
      // Old Firefox used a vendor-prefixed name.
      error.name === 'NS_ERROR_DOM_QUOTA_REACHED')
  )
}

/** "1 hadith", "2 hadiths" — count plus singular/plural noun. */
export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return `${count.toLocaleString()} ${count === 1 ? singular : plural}`
}

/**
 * Copy text to the clipboard, falling back to a hidden textarea +
 * execCommand for insecure contexts / older browsers. Resolves to whether
 * the copy succeeded so callers can show accurate feedback.
 */
export async function copyTextToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    // Fall through to the legacy path (permission denied, insecure context…).
  }

  try {
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.setAttribute('readonly', '')
    textarea.style.cssText = 'position:fixed;top:-9999px;opacity:0'
    document.body.appendChild(textarea)
    textarea.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(textarea)
    return ok
  } catch {
    return false
  }
}

/**
 * "Volume 1 · Category · Chapter" location line for a hadith, collapsing the
 * category/chapter pair when the dataset uses the same string for both.
 */
export function hadithLocationLabel(hadith: {
  volume?: number
  category?: string
  chapter?: string
}): string {
  const parts: string[] = []
  if (hadith.volume) parts.push(`Volume ${hadith.volume}`)
  const category = hadith.category?.trim()
  const chapter = hadith.chapter?.trim()
  if (category) parts.push(category)
  if (chapter && chapter !== category) parts.push(chapter)
  return parts.join(' · ')
}
