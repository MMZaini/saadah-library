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
  const suffixes = ['هما', 'كما', 'نها', 'ها', 'هم', 'هن', 'ني', 'نا', 'كم', 'كن', 'ك', 'ه', 'ون', 'ين', 'ان', 'ات', 'ة']
  for (const suffix of suffixes) {
    if (word.endsWith(suffix) && word.length > suffix.length + 1) {
      variants.add(word.slice(0, -suffix.length))
    }
  }
  
  // Try to extract potential 3-letter roots
  if (word.length >= 3) {
    // Remove common patterns to find potential root
    let candidate = word
    
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
  return Array.from(variants).filter(v => v && v.length >= 2)
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