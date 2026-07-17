import {
  normalizeEnglishForSearch,
  tokenizeEnglish,
  type HighlightSegment,
} from '@/lib/search-utils'

const NARRATOR_TOKEN_REGEX = /[\p{L}\p{M}\p{N}'’]+/gu
const CONNECTOR_KEYS: Record<string, string> = {
  b: 'b',
  ben: 'b',
  bin: 'b',
  ibn: 'b',
  bt: 'bt',
  bint: 'bt',
}

function stripTransliterationMarks(value: string): string {
  return value.replace(/['ʿʾ]/g, '')
}

function normalizeTransliterationToken(token: string): string {
  const normalized = stripTransliterationMarks(normalizeEnglishForSearch(token)).replace(
    /\.+$/g,
    '',
  )
  return CONNECTOR_KEYS[normalized] ?? normalized
}

/**
 * Collapse spelling differences common in Arabic romanization while retaining
 * word boundaries. This is intentionally narrower than fuzzy edit-distance:
 * Muḥammad/Mohamed and Mahdī/Mehdi converge, but unrelated names do not.
 */
export function normalizeNarratorTransliteration(input: string | null | undefined): string {
  return tokenizeEnglish(input)
    .map((token) =>
      normalizeTransliterationToken(token)
        .replace(/kh/g, 'x')
        .replace(/gh/g, 'g')
        .replace(/sh/g, 's')
        .replace(/th/g, 't')
        .replace(/dh/g, 'd')
        .replace(/ph/g, 'f')
        .replace(/[qck]/g, 'k')
        .replace(/[aeiouy]+/g, 'a')
        .replace(/(.)\1+/g, '$1')
        .replace(/h$/, ''),
    )
    .filter(Boolean)
    .join(' ')
}

/** Consonant skeleton used only as a final fallback for rarer unvocalized tokens. */
export function narratorTransliterationSkeleton(input: string | null | undefined): string {
  return tokenizeEnglish(input)
    .map((token) =>
      normalizeTransliterationToken(token)
        .replace(/kh/g, 'x')
        .replace(/gh/g, 'g')
        .replace(/sh/g, 's')
        .replace(/th/g, 't')
        .replace(/dh/g, 'd')
        .replace(/ph/g, 'f')
        .replace(/[qck]/g, 'k')
        .replace(/[aeiouy]/g, '')
        .replace(/(.)\1+/g, '$1')
        .replace(/h$/, ''),
    )
    .filter(Boolean)
    .join(' ')
}

interface NarratorTokenForms {
  plain: string
  phonetic: string
  skeleton: string
  connector?: string
}

function narratorTokenForms(token: string): NarratorTokenForms {
  const plain = stripTransliterationMarks(normalizeEnglishForSearch(token)).replace(/\.+$/g, '')
  return {
    plain,
    phonetic: normalizeNarratorTransliteration(plain),
    skeleton: narratorTransliterationSkeleton(plain),
    connector: CONNECTOR_KEYS[plain],
  }
}

function narratorTokensMatch(display: NarratorTokenForms, query: NarratorTokenForms): boolean {
  if (!display.plain || !query.plain) return false
  if (display.connector || query.connector) {
    return Boolean(display.connector && display.connector === query.connector)
  }
  if (display.plain === query.plain) return true
  if (display.plain.includes(query.plain) && query.plain.length >= 3) return true
  if (display.phonetic === query.phonetic) return true
  if (display.phonetic.startsWith(query.phonetic) && query.phonetic.length >= 3) return true
  return (
    display.skeleton === query.skeleton &&
    display.skeleton.length >= 3 &&
    query.skeleton.length >= 3
  )
}

/**
 * Highlight the displayed canonical name with the same tolerant spelling rules
 * used by narrator search. Ranges are mapped to the original string so marks
 * include scholarly diacritics (Muḥammad) and abbreviations (b.).
 */
export function getNarratorHighlightSegments(text: string, query: string): HighlightSegment[] {
  if (!text || !query.trim()) return [{ text, highlight: false }]

  const queryTokens = Array.from(query.matchAll(NARRATOR_TOKEN_REGEX), (match) =>
    narratorTokenForms(match[0]),
  )
  if (queryTokens.length === 0) return [{ text, highlight: false }]

  const ranges: Array<[number, number]> = []
  for (const match of text.matchAll(NARRATOR_TOKEN_REGEX)) {
    const start = match.index
    if (start == null) continue
    const forms = narratorTokenForms(match[0])
    if (!queryTokens.some((queryToken) => narratorTokensMatch(forms, queryToken))) continue

    let end = start + match[0].length
    if ((forms.connector === 'b' || forms.connector === 'bt') && text[end] === '.') end++
    ranges.push([start, end])
  }

  if (ranges.length === 0) return [{ text, highlight: false }]

  const segments: HighlightSegment[] = []
  let position = 0
  for (const [start, end] of ranges) {
    if (start > position) segments.push({ text: text.slice(position, start), highlight: false })
    segments.push({ text: text.slice(start, end), highlight: true })
    position = end
  }
  if (position < text.length) segments.push({ text: text.slice(position), highlight: false })
  return segments
}
