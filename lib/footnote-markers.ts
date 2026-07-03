/**
 * Strips printed-edition footnote markers from hadith text at display time.
 *
 * The dataset carries markers like "(2)", "(١)", "[1]", "(*)" and a stray
 * superscript "¹" that reference footnotes of the printed source editions —
 * footnotes the app does not have. The dataset itself is immutable (releases
 * are checksummed in the manifest), so cleanup happens here, on the way to
 * the screen/clipboard, never in the data files.
 *
 * The rules are deliberately asymmetric per language. They were derived from
 * a census of all 33k hadiths in the current release:
 *
 * Arabic:
 *  - "(N)" with 1–2 digits (ASCII or Arabic-Indic) is always a footnote
 *    marker; observed values are 1–30 and the 31–99 range is empty.
 *  - 3+ digit values are NOT footnotes — Al-Khisal #1232 embeds Quranic ayah
 *    numbers "(190)"–"(194)" inside a long quote — so the 2-digit cap
 *    protects them.
 *  - "[N]" and "(*)" each occur only as footnote markers.
 *
 * English (translation, matn, sanad):
 *  - "[N]" is always a footnote marker (translator footnotes).
 *  - "(N)" is NEVER stripped: it is used for in-text enumerations
 *    ("... of three types: (1) One is a man who ...") and, in Kitab
 *    al-Ghayba, as the hadith's own number at the start of the sanad.
 *  - Quran references "(2:167)" and ranges "(4-6)" never match the patterns.
 *
 * Both:
 *  - Standalone superscript digits (e.g. "Ziyad ¹ from") are footnote
 *    markers.
 *
 * All functions are pure and idempotent, so double-stripping (e.g. a stored
 * bookmark preview that was already clean) is harmless.
 */

const SUPERSCRIPT_DIGITS = /[ \t]*[¹²³⁰-⁹]+/g

// Whitespace before a marker is consumed so "القول (2)." collapses to
// "القول." — but only spaces/tabs, never newlines, so paragraph breaks
// around a marker are preserved.
const ARABIC_PATTERNS = [
  /[ \t]*\(\s*\d{1,2}\s*\)/g, // (2) — printed-edition footnote number
  /[ \t]*\(\s*[٠-٩]{1,2}\s*\)/g, // (٢) — Arabic-Indic digits
  /[ \t]*\[\s*\d{1,3}\s*\]/g, // [1]
  /[ \t]*\(\*\)/g, // (*)
  SUPERSCRIPT_DIGITS,
]

const ENGLISH_PATTERNS = [
  /[ \t]*\[\s*\d{1,3}\s*\]/g, // [1] — translator footnote
  SUPERSCRIPT_DIGITS,
]

function applyPatterns(text: string, patterns: RegExp[]): string {
  let result = text
  for (const pattern of patterns) result = result.replace(pattern, '')
  // Removing a mid-sentence marker can leave a doubled space behind.
  return result.replace(/ {2,}/g, ' ').trim()
}

export function stripArabicFootnoteMarkers(text: string): string
export function stripArabicFootnoteMarkers(text: string | undefined): string | undefined
export function stripArabicFootnoteMarkers(text: string | undefined): string | undefined {
  if (!text) return text
  return applyPatterns(text, ARABIC_PATTERNS)
}

export function stripEnglishFootnoteMarkers(text: string): string
export function stripEnglishFootnoteMarkers(text: string | undefined): string | undefined
export function stripEnglishFootnoteMarkers(text: string | undefined): string | undefined {
  if (!text) return text
  return applyPatterns(text, ENGLISH_PATTERNS)
}
