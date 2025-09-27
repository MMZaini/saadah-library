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
  const arabicChars = (trimmedQuery.match(/[\u0600-\u06FF\uFB50-\uFDFF\uFE70-\uFEFF]/g) || []).length
  
  // If more than 30% of non-space characters are Arabic, consider it an Arabic query
  const nonSpaceChars = trimmedQuery.replace(/\s/g, '').length
  
  return nonSpaceChars > 0 && (arabicChars / nonSpaceChars) > 0.3
}

/**
 * Checks if a hadith text matches an Arabic search query
 * @param hadithText - The hadith text (Arabic or English)
 * @param searchQuery - The search query
 * @returns true if there's a match
 */
export function matchesArabicText(hadithText: string | null | undefined, searchQuery: string): boolean {
  if (!hadithText || !searchQuery) return false
  // Normalize both hadith text and query for accent/diacritic-insensitive matching
  const normalizedHadith = normalizeArabic(hadithText)
  const normalizedQuery = normalizeArabic(searchQuery)

  // Simple includes check is good for phrase and word matching when both sides are normalized
  return normalizedHadith.includes(normalizedQuery)
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