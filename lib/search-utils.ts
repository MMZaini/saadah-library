// Search utilities for detecting Arabic text and enhancing search functionality

/**
 * Detects if the given text contains Arabic characters
 * @param text - The text to analyze
 * @returns true if the text contains Arabic characters, false otherwise
 */
export function containsArabic(text: string): boolean {
  if (!text || typeof text !== 'string') return false

  // Arabic Unicode range: U+0600 to U+06FF (Arabic block)
  // Plus Arabic Presentation Forms-A: U+FB50 to U+FDFF
  // Plus Arabic Presentation Forms-B: U+FE70 to U+FEFF
  const arabicRegex = /[\u0600-\u06FF\uFB50-\uFDFF\uFE70-\uFEFF]/

  return arabicRegex.test(text)
}

/**
 * Detects if a search query is primarily in Arabic
 * @param query - The search query to analyze
 * @returns true if the query contains significant Arabic content
 */
export function isArabicQuery(query: string): boolean {
  if (!query || typeof query !== 'string') return false

  const trimmedQuery = query.trim()
  if (trimmedQuery.length === 0) return false

  // Count Arabic characters
  const arabicChars = (trimmedQuery.match(/[\u0600-\u06FF\uFB50-\uFDFF\uFE70-\uFEFF]/g) || [])
    .length

  // If more than 30% of non-space characters are Arabic, consider it an Arabic query
  const nonSpaceChars = trimmedQuery.replace(/\s/g, '').length

  return nonSpaceChars > 0 && arabicChars / nonSpaceChars > 0.3
}

export type SearchMode = 'exactPhrase' | 'exactWords' | 'flexibleMatching'

const SEARCH_MODES: SearchMode[] = ['exactPhrase', 'exactWords', 'flexibleMatching']
const ENGLISH_TOKEN_REGEX = /[\p{L}\p{M}\p{N}]+(?:'[\p{L}\p{M}\p{N}]+)*/gu

export function normalizeSearchModes(modes?: readonly string[] | null): SearchMode[] {
  const unique = new Set<SearchMode>()
  for (const mode of modes ?? []) {
    if (SEARCH_MODES.includes(mode as SearchMode)) unique.add(mode as SearchMode)
  }
  return unique.size > 0 ? Array.from(unique) : ['exactPhrase']
}

export function normalizeEnglishForSearch(input: string | null | undefined): string {
  if (!input) return ''
  return String(input)
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .replace(/[‘’`]/g, "'")
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

export function tokenizeEnglish(input: string | null | undefined): string[] {
  return normalizeEnglishForSearch(input).match(ENGLISH_TOKEN_REGEX) ?? []
}

function matchesEnglishExactPhrase(text: string, query: string): boolean {
  const textTokens = tokenizeEnglish(text)
  const queryTokens = tokenizeEnglish(query)
  if (queryTokens.length === 0 || textTokens.length < queryTokens.length) return false

  for (let i = 0; i <= textTokens.length - queryTokens.length; i++) {
    let matched = true
    for (let j = 0; j < queryTokens.length; j++) {
      if (textTokens[i + j] !== queryTokens[j]) {
        matched = false
        break
      }
    }
    if (matched) return true
  }

  return false
}

function matchesEnglishExactWords(text: string, query: string): boolean {
  const textWords = new Set(tokenizeEnglish(text))
  const queryWords = tokenizeEnglish(query)
  return queryWords.length > 0 && queryWords.every((word) => textWords.has(word))
}

function getEnglishTermSet(text: string): Set<string> {
  const terms = new Set<string>()
  for (const token of tokenizeEnglish(text)) {
    terms.add(token)
    for (const stem of stemEnglishWord(token)) terms.add(stem)
  }
  return terms
}

function getFlexibleEnglishQueryTerms(word: string): Set<string> {
  const terms = new Set<string>([word])
  for (const stem of stemEnglishWord(word)) terms.add(stem)
  for (const synonym of getWordSynonyms(word)) {
    for (const token of tokenizeEnglish(synonym)) {
      terms.add(token)
      for (const stem of stemEnglishWord(token)) terms.add(stem)
    }
  }
  return terms
}

function matchesEnglishFlexible(text: string, query: string): boolean {
  const queryWords = tokenizeEnglish(query)
  if (queryWords.length === 0) return false

  const textTerms = getEnglishTermSet(text)
  return queryWords.every((word) => {
    for (const term of getFlexibleEnglishQueryTerms(word)) {
      if (textTerms.has(term)) return true
    }
    return false
  })
}

function matchesArabicExactPhrase(text: string, query: string): boolean {
  const normalizedText = normalizeArabic(text)
  const normalizedQuery = normalizeArabic(query)
  return Boolean(normalizedQuery) && normalizedText.includes(normalizedQuery)
}

function matchesArabicExactWords(text: string, query: string): boolean {
  const textWords = new Set(normalizeArabic(text).split(/\s+/).filter(Boolean))
  const queryWords = normalizeArabic(query).split(/\s+/).filter(Boolean)
  return queryWords.length > 0 && queryWords.every((word) => textWords.has(word))
}

function matchesArabicFlexible(text: string, query: string): boolean {
  const normalizedText = normalizeArabic(text)
  const queryWords = normalizeArabic(query).split(/\s+/).filter(Boolean)
  return (
    queryWords.length > 0 &&
    queryWords.every((word) => flexibleArabicWordMatch(normalizedText, word))
  )
}

export function matchesSearchMode({
  query,
  mode,
  englishText,
  arabicText,
}: {
  query: string
  mode: SearchMode
  englishText?: string | null
  arabicText?: string | null
}): boolean {
  const trimmed = query.trim()
  if (!trimmed) return false

  if (isArabicQuery(trimmed)) {
    const text = arabicText || ''
    if (mode === 'exactPhrase') return matchesArabicExactPhrase(text, trimmed)
    if (mode === 'exactWords') return matchesArabicExactWords(text, trimmed)
    return matchesArabicFlexible(text, trimmed)
  }

  const text = englishText || ''
  if (mode === 'exactPhrase') return matchesEnglishExactPhrase(text, trimmed)
  if (mode === 'exactWords') return matchesEnglishExactWords(text, trimmed)
  return matchesEnglishFlexible(text, trimmed)
}

/**
 * Checks if a hadith text matches an Arabic search query
 * @param hadithText - The hadith text (Arabic or English)
 * @param searchQuery - The search query
 * @returns true if there's a match
 */
export function matchesArabicText(
  hadithText: string | null | undefined,
  searchQuery: string,
): boolean {
  if (!hadithText || !searchQuery) return false
  // Normalize both hadith text and query for accent/diacritic-insensitive matching
  const normalizedHadith = normalizeArabic(hadithText)
  const normalizedQuery = normalizeArabic(searchQuery)

  // Simple includes check is good for phrase and word matching when both sides are normalized
  return normalizedHadith.includes(normalizedQuery)
}

/**
 * Generate morphological variants of an Arabic word for flexible matching
 * This handles common prefixes, suffixes, and patterns in Arabic
 * @param word - The normalized Arabic word
 * @returns Array of word variants to try matching
 */
export function generateArabicWordVariants(word: string): string[] {
  if (!word || !containsArabic(word)) return [word]

  const variants = new Set<string>()
  variants.add(word)

  // Handle definite article (ال)
  if (word.startsWith('ال') && word.length > 2) {
    variants.add(word.slice(2))
  } else if (word.length > 0) {
    variants.add('ال' + word)
  }

  // Common Arabic prefixes to try removing (in order of specificity)
  const prefixes = ['وال', 'فال', 'بال', 'كال', 'لل', 'و', 'ف', 'ب', 'ك', 'ل']
  for (const prefix of prefixes) {
    if (word.startsWith(prefix) && word.length > prefix.length + 1) {
      const withoutPrefix = word.slice(prefix.length)
      variants.add(withoutPrefix)
      // Also try adding definite article
      if (!withoutPrefix.startsWith('ال')) {
        variants.add('ال' + withoutPrefix)
      }
    }
  }

  // Common Arabic suffixes to try removing (in order of specificity)
  const suffixes = [
    'هما',
    'كما',
    'نها',
    'ها',
    'هم',
    'هن',
    'ني',
    'نا',
    'كم',
    'كن',
    'ك',
    'ه',
    'ون',
    'ين',
    'ان',
    'ات',
    'ة',
  ]
  for (const suffix of suffixes) {
    if (word.endsWith(suffix) && word.length > suffix.length + 1) {
      variants.add(word.slice(0, -suffix.length))
    }
  }

  // Try to extract potential 3-letter roots
  if (word.length >= 3) {
    // Remove common patterns to find potential root
    const candidate = word

    // Remove مُ prefix (مفعول pattern)
    if (candidate.startsWith('م') && candidate.length > 3) {
      variants.add(candidate.slice(1))
    }

    // Remove ا prefix (أفعل pattern)
    if (candidate.startsWith('ا') && candidate.length > 3) {
      variants.add(candidate.slice(1))
    }

    // Remove ت prefix (تفعيل pattern)
    if (candidate.startsWith('ت') && candidate.length > 3) {
      variants.add(candidate.slice(1))
    }

    // Remove است prefix (استفعال pattern)
    if (candidate.startsWith('است') && candidate.length > 5) {
      variants.add(candidate.slice(3))
    }

    // Generate potential 3-letter root by removing vowels and common letters
    const consonantCandidate = candidate.replace(/[اوي]/g, '')
    if (consonantCandidate.length >= 3) {
      const root = consonantCandidate.slice(0, 3)
      variants.add(root)

      // Try common patterns with this root
      const [c1, c2, c3] = root.split('')
      if (c1 && c2 && c3) {
        // فاعل pattern
        variants.add(c1 + 'ا' + c2 + c3)
        // مفعول pattern
        variants.add('م' + c1 + c2 + 'ول')
        // فعيل pattern
        variants.add(c1 + c2 + 'ي' + c3)
        // فعال pattern
        variants.add(c1 + c2 + 'ال')
        // فعول pattern
        variants.add(c1 + c2 + 'ول')
      }
    }
  }

  // Filter out very short variants that might cause false positives
  return Array.from(variants).filter((v) => v && v.length >= 2)
}

/**
 * Improved flexible Arabic word matching that considers morphology
 * @param arabicText - The normalized Arabic text to search in
 * @param searchWord - The normalized Arabic search word
 * @returns true if the word is found with flexible matching
 */
export function flexibleArabicWordMatch(arabicText: string, searchWord: string): boolean {
  if (!arabicText || !searchWord) return false

  // First try exact match
  if (arabicText.includes(searchWord)) return true

  // Generate variants of the search word
  const searchVariants = generateArabicWordVariants(searchWord)

  // Check if any variant is found
  for (const variant of searchVariants) {
    if (variant && arabicText.includes(variant)) {
      return true
    }
  }

  // Also generate variants of words in the text and check against search word
  const textWords = arabicText.split(/\s+/).filter(Boolean)
  for (const textWord of textWords) {
    const textVariants = generateArabicWordVariants(textWord)
    if (textVariants.includes(searchWord)) {
      return true
    }
  }

  return false
}

/**
 * Normalize Arabic text for search: lowercases, strips diacritics (harakat),
 * normalizes common letter variants (alef forms, hamza, ya/alef maqsura, taa marbuta),
 * and removes common punctuation and tatweel.
 */
export function normalizeArabic(input: string | null | undefined): string {
  if (!input) return ''
  let s = String(input).toLowerCase().trim()

  // Remove Arabic diacritics (064B-0652) and superscript alef (0670) and tatweel (0640)
  s = s.replace(/[\u064B-\u0652\u0670\u0640]/g, '')

  // Normalize alef variants to bare alef (ا)
  s = s.replace(/[\u0622\u0623\u0625\u0671]/g, '\u0627')

  // Normalize taa marbuta (ة) to ha (ه) to help matching
  s = s.replace(/\u0629/g, '\u0647')

  // Normalize alef maqsura (ى) to ya (ي)
  s = s.replace(/\u0649/g, '\u064A')

  // Normalize hamza forms to bare hamza (ء)
  s = s.replace(/[\u0624\u0626\u0621]/g, '\u0621')

  // Remove common Arabic punctuation and control marks
  s = s.replace(/[\u060C\u061B\u061F\u06D4\u200C\u200D]/g, '')

  // Collapse multiple spaces
  s = s.replace(/\s+/g, ' ')

  return s
}

/**
 * Common Islamic/religious terminology synonyms for enhanced English search
 */
const ISLAMIC_SYNONYMS: Record<string, string[]> = {
  prayer: ['salah', 'salat', 'namaz', 'worship'],
  salah: ['prayer', 'salat', 'namaz', 'worship'],
  salat: ['prayer', 'salah', 'namaz', 'worship'],
  pilgrimage: ['hajj', 'haj'],
  hajj: ['pilgrimage', 'haj'],
  fasting: ['sawm', 'saum', 'fast'],
  sawm: ['fasting', 'saum', 'fast'],
  charity: ['zakat', 'zakah', 'alms'],
  zakat: ['charity', 'zakah', 'alms'],
  prophet: ['messenger', 'rasul', 'nabi'],
  messenger: ['prophet', 'rasul', 'nabi'],
  imam: ['leader', 'guide'],
  allah: ['god', 'almighty'],
  god: ['allah', 'almighty'],
  faith: ['iman', 'belief'],
  iman: ['faith', 'belief'],
  mosque: ['masjid'],
  masjid: ['mosque'],
  friday: ['jumma', "jumu'ah"],
  jumma: ['friday', "jumu'ah"],
  ramadan: ['ramadhan'],
  ramadhan: ['ramadan'],
}

/**
 * Enhanced English word stemming with better pluralization and verb form handling
 */
export function stemEnglishWord(word: string): string[] {
  if (!word || word.length < 3) return [word]

  const variations = new Set([word])
  const stem = word.toLowerCase()

  // Handle irregular plurals first
  const irregularPlurals: Record<string, string> = {
    children: 'child',
    men: 'man',
    women: 'woman',
    feet: 'foot',
    teeth: 'tooth',
    geese: 'goose',
    mice: 'mouse',
    people: 'person',
  }

  if (irregularPlurals[stem]) {
    variations.add(irregularPlurals[stem])
  }

  // Handle common suffixes with more accuracy
  const suffixPatterns = [
    // Plurals
    { pattern: /ies$/, replacement: 'y', condition: (w: string) => w.length > 4 },
    { pattern: /ves$/, replacement: 'f', condition: (w: string) => w.length > 4 },
    { pattern: /oes$/, replacement: 'o', condition: (w: string) => w.length > 4 },
    { pattern: /ses$/, replacement: 's', condition: (w: string) => w.length > 4 },
    {
      pattern: /es$/,
      replacement: '',
      condition: (w: string) => w.length > 3 && /[sxz]es$|[^aeiou]es$/.test(w),
    },
    { pattern: /s$/, replacement: '', condition: (w: string) => w.length > 3 && !/ss$/.test(w) },

    // Past tense and past participle
    { pattern: /ied$/, replacement: 'y', condition: (w: string) => w.length > 4 },
    { pattern: /ed$/, replacement: '', condition: (w: string) => w.length > 3 },

    // Present participle and gerund
    { pattern: /ing$/, replacement: '', condition: (w: string) => w.length > 4 },

    // Comparative and superlative
    { pattern: /ier$/, replacement: 'y', condition: (w: string) => w.length > 4 },
    { pattern: /iest$/, replacement: 'y', condition: (w: string) => w.length > 5 },
    { pattern: /er$/, replacement: '', condition: (w: string) => w.length > 3 },
    { pattern: /est$/, replacement: '', condition: (w: string) => w.length > 4 },

    // Other common suffixes
    { pattern: /tion$/, replacement: 'te', condition: (w: string) => w.length > 5 },
    { pattern: /sion$/, replacement: 'de', condition: (w: string) => w.length > 5 },
    { pattern: /ness$/, replacement: '', condition: (w: string) => w.length > 5 },
    { pattern: /ment$/, replacement: '', condition: (w: string) => w.length > 5 },
    { pattern: /able$/, replacement: '', condition: (w: string) => w.length > 5 },
    { pattern: /ible$/, replacement: '', condition: (w: string) => w.length > 5 },
    { pattern: /ful$/, replacement: '', condition: (w: string) => w.length > 4 },
    { pattern: /less$/, replacement: '', condition: (w: string) => w.length > 5 },
    { pattern: /ous$/, replacement: '', condition: (w: string) => w.length > 4 },
    { pattern: /ious$/, replacement: '', condition: (w: string) => w.length > 5 },
    { pattern: /eous$/, replacement: '', condition: (w: string) => w.length > 5 },
    { pattern: /ive$/, replacement: '', condition: (w: string) => w.length > 4 },
    { pattern: /ative$/, replacement: '', condition: (w: string) => w.length > 6 },
    { pattern: /ly$/, replacement: '', condition: (w: string) => w.length > 3 },
  ]

  for (const { pattern, replacement, condition } of suffixPatterns) {
    if (pattern.test(stem) && condition(stem)) {
      const newStem = stem.replace(pattern, replacement)
      if (newStem.length >= 2) {
        variations.add(newStem)

        // Handle double consonants in stemming (e.g., "running" -> "run")
        if (replacement === '' && newStem.length > 2) {
          const lastChar = newStem[newStem.length - 1]
          const secondLastChar = newStem[newStem.length - 2]
          if (lastChar === secondLastChar && 'bcdfghjklmnpqrstvwxz'.includes(lastChar)) {
            variations.add(newStem.slice(0, -1))
          }
        }
      }
      break // Only apply one transformation
    }
  }

  return Array.from(variations)
}

/**
 * Get synonyms for a word including Islamic terminology
 */
export function getWordSynonyms(word: string): string[] {
  const lowerWord = word.toLowerCase()
  return ISLAMIC_SYNONYMS[lowerWord] || []
}

/**
 * Enhanced flexible matching for English text with synonyms and better stemming
 */
export function flexibleEnglishMatch(
  text: string,
  searchWords: string[],
  options: {
    caseInsensitive?: boolean
    useSynonyms?: boolean
    useStemming?: boolean
  } = {},
): boolean {
  const { caseInsensitive = true, useSynonyms = true, useStemming = true } = options

  const processText = caseInsensitive ? text.toLowerCase() : text

  return searchWords.every((searchWord) => {
    const processedSearchWord = caseInsensitive ? searchWord.toLowerCase() : searchWord

    // Direct match
    if (processText.includes(processedSearchWord)) {
      return true
    }

    // Synonym matching
    if (useSynonyms) {
      const synonyms = getWordSynonyms(processedSearchWord)
      for (const synonym of synonyms) {
        const processedSynonym = caseInsensitive ? synonym.toLowerCase() : synonym
        if (processText.includes(processedSynonym)) {
          return true
        }
      }
    }

    // Stemming-based matching
    if (useStemming) {
      const stemVariations = stemEnglishWord(processedSearchWord)
      for (const variation of stemVariations) {
        const processedVariation = caseInsensitive ? variation.toLowerCase() : variation
        if (processText.includes(processedVariation)) {
          return true
        }
      }
    }

    return false
  })
}

// (duplicate simple flexibleArabicWordMatch removed — keeping the improved implementation above)

/**
 * Splits text into segments indicating which parts match the search query.
 * Returns an array of { text, highlight } objects.
 */
export interface HighlightSegment {
  text: string
  highlight: boolean
}

export function getHighlightSegments(
  text: string,
  query: string,
  options: { exactMatch?: boolean } = {},
): HighlightSegment[] {
  if (!text || !query?.trim()) return [{ text, highlight: false }]

  const trimmed = query.trim()
  const arabic = isArabicQuery(trimmed)

  if (arabic) {
    return highlightArabicSegments(text, trimmed)
  }
  return highlightEnglishSegments(text, trimmed, options)
}

function highlightEnglishSegments(
  text: string,
  query: string,
  options: { exactMatch?: boolean } = {},
): HighlightSegment[] {
  // Escape regex special chars and split query into words
  const words = query
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))

  if (words.length === 0) return [{ text, highlight: false }]

  // Try full phrase first, then individual words
  const patterns = [words.join('\\s+'), ...words.filter((w) => w.length >= 2)]
  const joined = patterns.join('|')
  const regex = options.exactMatch
    ? new RegExp(`(?<![\\p{L}\\p{M}\\p{N}_])(${joined})(?![\\p{L}\\p{M}\\p{N}_])`, 'giu')
    : new RegExp(`(${joined})`, 'gi')

  return splitByRegex(text, regex)
}

function highlightArabicSegments(text: string, query: string): HighlightSegment[] {
  const normQuery = normalizeArabic(query)
  const queryWords = normQuery.split(/\s+/).filter(Boolean)
  if (queryWords.length === 0) return [{ text, highlight: false }]

  // Build a character-position mapping: for each char in the original text,
  // its index in the normalized text
  const normText = normalizeArabic(text)

  // Build mapping from normalized text indices back to original text indices
  const origIndexForNorm: number[] = []
  {
    let normIdx = 0
    let origIdx = 0
    const origLen = text.length
    const normLen = normText.length

    while (normIdx < normLen && origIdx < origLen) {
      const nc = normText[normIdx]
      const oc = text[origIdx]
      // normalizeArabic() trims, so a lone whitespace char would collapse to ''
      // and be treated as a stripped diacritic — desyncing the map against
      // normText, which keeps single spaces. Normalize any whitespace to a
      // single space so the two stay aligned. Collapsed runs of whitespace fall
      // through the mismatch branch below and are skipped.
      const normOc = /\s/.test(oc) ? ' ' : normalizeArabic(oc)

      if (normOc === '') {
        // This original char is stripped during normalization (diacritics, etc.)
        origIdx++
        continue
      }

      if (normOc === nc) {
        origIndexForNorm[normIdx] = origIdx
        normIdx++
        origIdx++
      } else {
        // Mismatch — advance original
        origIdx++
      }
    }
  }

  // Find all matches in normalized text
  const patterns = queryWords
    .filter((w) => w.length >= 1)
    .map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  // Try full phrase first
  const allPatterns = [queryWords.join('\\s*'), ...patterns]
  const regex = new RegExp(`(${allPatterns.join('|')})`, 'gi')

  const matchRanges: Array<[number, number]> = [] // [origStart, origEnd] inclusive
  let m: RegExpExecArray | null
  while ((m = regex.exec(normText)) !== null) {
    const normStart = m.index
    const normEnd = m.index + m[0].length - 1

    const origStart = origIndexForNorm[normStart]
    let origEnd = origIndexForNorm[normEnd]

    if (origStart == null || origEnd == null) continue

    // Extend origEnd to include any trailing diacritics, but never whitespace
    // (normalizeArabic trims, so a space also normalizes to '').
    while (origEnd + 1 < text.length) {
      const next = text[origEnd + 1]
      if (/\s/.test(next) || normalizeArabic(next) !== '') break
      origEnd++
    }

    matchRanges.push([origStart, origEnd + 1])
  }

  if (matchRanges.length === 0) return [{ text, highlight: false }]

  // Merge overlapping ranges and build segments
  matchRanges.sort((a, b) => a[0] - b[0])
  const merged: Array<[number, number]> = [matchRanges[0]]
  for (let i = 1; i < matchRanges.length; i++) {
    const last = merged[merged.length - 1]
    if (matchRanges[i][0] <= last[1]) {
      last[1] = Math.max(last[1], matchRanges[i][1])
    } else {
      merged.push(matchRanges[i])
    }
  }

  const segments: HighlightSegment[] = []
  let pos = 0
  for (const [start, end] of merged) {
    if (start > pos) segments.push({ text: text.slice(pos, start), highlight: false })
    segments.push({ text: text.slice(start, end), highlight: true })
    pos = end
  }
  if (pos < text.length) segments.push({ text: text.slice(pos), highlight: false })

  return segments
}

function splitByRegex(text: string, regex: RegExp): HighlightSegment[] {
  const segments: HighlightSegment[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ text: text.slice(lastIndex, match.index), highlight: false })
    }
    segments.push({ text: match[0], highlight: true })
    lastIndex = regex.lastIndex
    // Prevent infinite loop on zero-length matches
    if (match[0].length === 0) regex.lastIndex++
  }

  if (lastIndex < text.length) {
    segments.push({ text: text.slice(lastIndex), highlight: false })
  }

  return segments.length > 0 ? segments : [{ text, highlight: false }]
}
