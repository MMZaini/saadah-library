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

/**
 * Common Islamic/religious terminology synonyms for enhanced English search
 */
const ISLAMIC_SYNONYMS: Record<string, string[]> = {
  'prayer': ['salah', 'salat', 'namaz', 'worship'],
  'salah': ['prayer', 'salat', 'namaz', 'worship'],
  'salat': ['prayer', 'salah', 'namaz', 'worship'],
  'pilgrimage': ['hajj', 'haj'],
  'hajj': ['pilgrimage', 'haj'],
  'fasting': ['sawm', 'saum', 'fast'],
  'sawm': ['fasting', 'saum', 'fast'],
  'charity': ['zakat', 'zakah', 'alms'],
  'zakat': ['charity', 'zakah', 'alms'],
  'prophet': ['messenger', 'rasul', 'nabi'],
  'messenger': ['prophet', 'rasul', 'nabi'],
  'imam': ['leader', 'guide'],
  'allah': ['god', 'almighty'],
  'god': ['allah', 'almighty'],
  'faith': ['iman', 'belief'],
  'iman': ['faith', 'belief'],
  'mosque': ['masjid'],
  'masjid': ['mosque'],
  'friday': ['jumma', 'jumu\'ah'],
  'jumma': ['friday', 'jumu\'ah'],
  'ramadan': ['ramadhan'],
  'ramadhan': ['ramadan']
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
    'children': 'child',
    'men': 'man',
    'women': 'woman',
    'feet': 'foot',
    'teeth': 'tooth',
    'geese': 'goose',
    'mice': 'mouse',
    'people': 'person'
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
    { pattern: /es$/, replacement: '', condition: (w: string) => w.length > 3 && /[sxz]es$|[^aeiou]es$/.test(w) },
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
    { pattern: /ly$/, replacement: '', condition: (w: string) => w.length > 3 }
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
export function flexibleEnglishMatch(text: string, searchWords: string[], options: {
  caseInsensitive?: boolean,
  useSynonyms?: boolean,
  useStemming?: boolean
} = {}): boolean {
  const { caseInsensitive = true, useSynonyms = true, useStemming = true } = options
  
  const processText = caseInsensitive ? text.toLowerCase() : text
  
  return searchWords.every(searchWord => {
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

/**
 * Smart search that automatically determines the best search strategy
 */
export function smartSearch(text: string, query: string, options: {
  caseInsensitive?: boolean
} = {}): boolean {
  const { caseInsensitive = true } = options
  
  const processedText = caseInsensitive ? text.toLowerCase() : text
  const processedQuery = caseInsensitive ? query.toLowerCase() : query
  
  // If query is short (1-2 words), use flexible matching
  const words = processedQuery.trim().split(/\s+/)
  
  if (words.length <= 2) {
    return flexibleEnglishMatch(processedText, words, {
      caseInsensitive,
      useSynonyms: true,
      useStemming: true
    })
  }
  
  // For longer queries, use phrase matching with some flexibility
  if (processedText.includes(processedQuery)) {
    return true
  }
  
  // Fall back to flexible word matching
  return flexibleEnglishMatch(processedText, words, {
    caseInsensitive,
    useSynonyms: true,
    useStemming: false // Less aggressive for longer queries
  })
}