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
