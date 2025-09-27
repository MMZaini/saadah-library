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
  
  const normalizedHadith = hadithText.toLowerCase().trim()
  const normalizedQuery = searchQuery.toLowerCase().trim()
  
  return normalizedHadith.includes(normalizedQuery)
}