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

/**
 * Flexible Arabic word match for handling article variations and normalized matching.
 * Returns true if every search word has a match in the given Arabic text considering
 * common article (ال) presence/absence and normalization.
 */
export function flexibleArabicWordMatch(arabicText: string | null | undefined, searchWord: string): boolean {
  if (!arabicText || !searchWord) return false

  const normalizedText = normalizeArabic(arabicText)
  const normalizedWord = normalizeArabic(searchWord)

  // Consider variants with and without the definite article 'ال'
  const variants = new Set<string>([normalizedWord])
  if (normalizedWord.startsWith('ال')) {
    variants.add(normalizedWord.slice(2))
  } else {
    variants.add('ال' + normalizedWord)
  }

  // Also consider short contractions where hamza/aleph differences cleaned by normalizeArabic
  // Check if any variant is included as a whole word or substring in the normalized text
  for (const v of variants) {
    if (normalizedText.includes(v)) return true
    // Also check with word boundaries (split by spaces)
    const words = normalizedText.split(/\s+/).filter(Boolean)
    if (words.includes(v)) return true
  }

  return false
}