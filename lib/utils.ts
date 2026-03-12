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
