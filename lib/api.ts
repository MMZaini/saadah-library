// Thaqalayn API utilities
import { cacheGet, cacheSet, findHadithInCache } from './hadith-cache'

const BASE_URL = 'https://www.thaqalayn-api.net/api/v2'

// Enhanced fetch with persistent caching
// Browser: IndexedDB + in-memory (survives navigations, 12-24h TTL)
// Server:  in-memory Map (per-instance, auto-TTL)
const cachedFetch = async (url: string, options?: RequestInit) => {
  const cached = await cacheGet(url)
  if (cached) return cached

  const response = await fetch(url, {
    ...options,
    // Add performance headers
    headers: {
      Accept: 'application/json',
      'Accept-Encoding': 'gzip, deflate, br',
      ...options?.headers,
    },
  })

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()
  await cacheSet(url, data)
  return data
}

// Types for API responses
export interface HadithGrading {
  grade_en: string | null
  grade_ar: string | null
  reference_en: string
  author: {
    name_en: string
    name_ar: string | null
    link: string | null
    death_date: string | null
  }
}

export interface Hadith {
  _id: string
  id: number
  bookId: string
  book: string
  category: string
  categoryId: string
  chapter: string
  author: string
  translator: string
  englishText: string
  arabicText: string
  majlisiGrading: string
  URL: string
  volume: number
  frenchText: string
  mohseniGrading: string
  behbudiGrading: string
  chapterInCategoryId: number
  thaqalaynSanad: string
  thaqalaynMatn: string
  gradingsFull: HadithGrading[]
  __v: number
}

export interface BookInfo {
  bookId: string
  BookName: string
  author: string
  idRangeMin: number
  idRangeMax: number
  bookDescription: string
  bookCover: string
  englishName: string
  translator: string
  volume: number
}

export interface QueryResponse {
  results: Hadith[]
  total: number
}

export interface ChapterInfo {
  chapter: string
  chapterInCategoryId: number
  hadiths: Hadith[]
}

export interface CategoryInfo {
  category: string
  categoryId: string
  chapters: Record<string, ChapterInfo>
}

export interface ChapterStructure {
  [categoryKey: string]: CategoryInfo
}

// API functions
export const thaqalaynApi = {
  // Get all available books
  async getAllBooks(): Promise<BookInfo[]> {
    return await cachedFetch(`${BASE_URL}/allbooks`)
  },

  // Get a random hadith from any book (never cached – must be fresh)
  async getRandomHadith(): Promise<Hadith> {
    const response = await fetch(`${BASE_URL}/random`, {
      headers: { Accept: 'application/json' },
    })
    if (!response.ok) {
      throw new Error(`Failed to fetch random hadith: ${response.statusText}`)
    }
    return response.json()
  },

  // Get a random hadith from a specific book
  async getRandomHadithFromBook(bookId: string): Promise<Hadith> {
    const response = await fetch(`${BASE_URL}/${bookId}/random`)
    if (!response.ok) {
      throw new Error(`Failed to fetch random hadith from ${bookId}: ${response.statusText}`)
    }
    return response.json()
  },

  // Search across all books
  async searchAllBooks(query: string): Promise<QueryResponse> {
    // Normalize Arabic queries (strip diacritics) so client-side searches behave
    // consistently with server-side normalization.
    try {
      // Import lazy to avoid circular imports at module evaluation time
      const { isArabicQuery, normalizeArabic } = await import('./search-utils')
      const outgoing = isArabicQuery(query) ? normalizeArabic(query) : query
      const encodedQuery = encodeURIComponent(outgoing)
      const results = await cachedFetch(`${BASE_URL}/query?q=${encodedQuery}`)
      return {
        results: Array.isArray(results) ? results : [],
        total: Array.isArray(results) ? results.length : 0,
      }
    } catch {
      // On any error importing/util functions, fall back to raw query
      const encodedQuery = encodeURIComponent(query)
      const results = await cachedFetch(`${BASE_URL}/query?q=${encodedQuery}`)
      return {
        results: Array.isArray(results) ? results : [],
        total: Array.isArray(results) ? results.length : 0,
      }
    }
  },

  // Search within a specific book
  async searchBook(bookId: string, query: string): Promise<QueryResponse> {
    try {
      const { isArabicQuery, normalizeArabic } = await import('./search-utils')
      const outgoing = isArabicQuery(query) ? normalizeArabic(query) : query
      const encodedQuery = encodeURIComponent(outgoing)
      const results = await cachedFetch(`${BASE_URL}/query/${bookId}?q=${encodedQuery}`)
      return {
        results: Array.isArray(results) ? results : [],
        total: Array.isArray(results) ? results.length : 0,
      }
    } catch {
      const encodedQuery = encodeURIComponent(query)
      const results = await cachedFetch(`${BASE_URL}/query/${bookId}?q=${encodedQuery}`)
      return {
        results: Array.isArray(results) ? results : [],
        total: Array.isArray(results) ? results.length : 0,
      }
    }
  },

  // Get all hadiths from a specific book (cached 12h)
  async getBookHadiths(bookId: string): Promise<Hadith[]> {
    return await cachedFetch(`${BASE_URL}/${bookId}`)
  },

  // Get a specific hadith by book and id (checks volume cache first, then API)
  async getSpecificHadith(bookId: string, hadithId: number): Promise<Hadith> {
    // If the full volume is already cached, extract from it (instant)
    const fromVolume = await findHadithInCache(BASE_URL, bookId, hadithId)
    if (fromVolume) return fromVolume as Hadith

    // Fetch from the specific-hadith API endpoint (cached 24h)
    const data = await cachedFetch(`${BASE_URL}/${bookId}/${hadithId}`)

    // The API returns { error: "..." } with status 200 for non-existent IDs
    if (data && typeof data === 'object' && 'error' in data) {
      throw new Error((data as { error: string }).error)
    }

    return data as Hadith
  },

  /**
   * Find a hadith across multiple possible book/volume IDs.
   * 1. Checks the persistent cache for each bookId (instant if cached)
   * 2. Falls back to parallel getSpecificHadith calls (~300ms total)
   *
   * This replaces the old pattern of downloading entire volumes sequentially.
   */
  async findHadithAcrossBooks(
    bookIds: string[],
    hadithId: number,
  ): Promise<Hadith | null> {
    // Step 1: Check cache for every possible bookId (instant)
    for (const bookId of bookIds) {
      const cached = await findHadithInCache(BASE_URL, bookId, hadithId)
      if (cached) return cached as Hadith
    }

    // Step 2: Try the specific-hadith endpoint in parallel for all bookIds
    // Each request is ~2KB / ~300ms – much faster than downloading full volumes
    const results = await Promise.allSettled(
      bookIds.map(async (bookId) => {
        const data = await cachedFetch(`${BASE_URL}/${bookId}/${hadithId}`)
        if (data && typeof data === 'object' && 'error' in data) {
          throw new Error('Not found in this volume')
        }
        return data as Hadith
      }),
    )

    for (const result of results) {
      if (result.status === 'fulfilled' && result.value) {
        return result.value
      }
    }

    return null
  },

  // Get ingredients information
  async getIngredients(): Promise<unknown> {
    const response = await fetch(`${BASE_URL}/ingredients`)
    if (!response.ok) {
      throw new Error(`Failed to fetch ingredients: ${response.statusText}`)
    }
    return response.json()
  },
}

// Al-Kafi specific functions
export const alKafiApi = {
  // Get all Al-Kafi volumes
  getAlKafiVolumes(): string[] {
    return [
      'Al-Kafi-Volume-1-Kulayni',
      'Al-Kafi-Volume-2-Kulayni',
      'Al-Kafi-Volume-3-Kulayni',
      'Al-Kafi-Volume-4-Kulayni',
      'Al-Kafi-Volume-5-Kulayni',
      'Al-Kafi-Volume-6-Kulayni',
      'Al-Kafi-Volume-7-Kulayni',
      'Al-Kafi-Volume-8-Kulayni',
    ]
  },

  // Get random hadith from any Al-Kafi volume
  async getRandomAlKafiHadith(): Promise<Hadith> {
    const volumes = this.getAlKafiVolumes()
    const randomVolume = volumes[Math.floor(Math.random() * volumes.length)]
    return thaqalaynApi.getRandomHadithFromBook(randomVolume)
  },

  // Get random hadith from specific Al-Kafi volume
  async getRandomHadithFromVolume(volume: number): Promise<Hadith> {
    if (volume < 1 || volume > 8) {
      throw new Error('Al-Kafi volume must be between 1 and 8')
    }
    const bookId = `Al-Kafi-Volume-${volume}-Kulayni`
    return thaqalaynApi.getRandomHadithFromBook(bookId)
  },

  // Search across all Al-Kafi volumes
  async searchAlKafi(query: string): Promise<QueryResponse> {
    const volumes = this.getAlKafiVolumes()
    const promises = volumes.map((volume) => thaqalaynApi.searchBook(volume, query))

    try {
      const results = await Promise.all(promises)
      const combinedResults = results.flatMap((result) => result.results)

      return {
        results: combinedResults,
        total: combinedResults.length,
      }
    } catch {
      // Error occurred during search
      return { results: [], total: 0 }
    }
  },

  // Get all hadiths from specific Al-Kafi volume
  async getVolumeHadiths(volume: number): Promise<Hadith[]> {
    if (volume < 1 || volume > 8) {
      throw new Error('Al-Kafi volume must be between 1 and 8')
    }
    const bookId = `Al-Kafi-Volume-${volume}-Kulayni`
    return thaqalaynApi.getBookHadiths(bookId)
  },

  // Get organized chapter structure for Al-Kafi volume
  async getVolumeChapterStructure(volume: number): Promise<ChapterStructure> {
    if (volume < 1 || volume > 8) {
      throw new Error('Al-Kafi volume must be between 1 and 8')
    }

    try {
      const hadiths = await this.getVolumeHadiths(volume)

      const structure: ChapterStructure = {}

      hadiths.forEach((hadith) => {
        const categoryKey = hadith.category || 'Uncategorized'
        const chapterKey = hadith.chapter || 'No Chapter'

        if (!structure[categoryKey]) {
          structure[categoryKey] = {
            category: categoryKey,
            categoryId: hadith.categoryId || '',
            chapters: {},
          }
        }

        if (!structure[categoryKey].chapters[chapterKey]) {
          structure[categoryKey].chapters[chapterKey] = {
            chapter: chapterKey,
            chapterInCategoryId: hadith.chapterInCategoryId || 0,
            hadiths: [],
          }
        }

        structure[categoryKey].chapters[chapterKey].hadiths.push(hadith)
      })

      // Sort chapters by chapterInCategoryId
      Object.values(structure).forEach((category) => {
        const sortedChapters: Record<string, ChapterInfo> = {}
        const sortedEntries = Object.entries(category.chapters).sort(
          ([, a], [, b]) => a.chapterInCategoryId - b.chapterInCategoryId,
        )

        sortedEntries.forEach(([key, value]) => {
          sortedChapters[key] = value
        })

        category.chapters = sortedChapters
      })

      return structure
    } catch {
      // Error logging removed for production;
      throw new Error(`Failed to load volume ${volume} structure`)
    }
  },

  // Get a specific chapter's hadiths without loading the entire volume
  async getChapterHadiths(
    volume: number,
    categoryId: string,
    chapterId: number,
  ): Promise<Hadith[]> {
    if (volume < 1 || volume > 8) {
      throw new Error('Al-Kafi volume must be between 1 and 8')
    }

    const bookId = `Al-Kafi-Volume-${volume}-Kulayni`

    try {
      // This is a workaround since the API doesn't provide chapter-specific endpoints
      // We'll get all hadiths and filter by chapter
      const allHadiths = await thaqalaynApi.getBookHadiths(bookId)
      return allHadiths.filter(
        (hadith) => hadith.categoryId === categoryId && hadith.chapterInCategoryId === chapterId,
      )
    } catch {
      // Error logging removed for production;
      throw new Error(`Failed to load chapter hadiths`)
    }
  },
}

// ʿUyūn akhbār al-Riḍā specific functions
export const uyunApi = {
  // Get all ʿUyūn akhbār al-Riḍā volumes
  getUyunVolumes(): string[] {
    return ['Uyun-akhbar-al-Rida-Volume-1-Saduq', 'Uyun-akhbar-al-Rida-Volume-2-Saduq']
  },

  // Get random hadith from any ʿUyūn akhbār al-Riḍā volume
  async getRandomUyunHadith(): Promise<Hadith> {
    const volumes = this.getUyunVolumes()
    const randomVolume = volumes[Math.floor(Math.random() * volumes.length)]
    return thaqalaynApi.getRandomHadithFromBook(randomVolume)
  },

  // Get random hadith from specific ʿUyūn akhbār al-Riḍā volume
  async getRandomHadithFromVolume(volume: number): Promise<Hadith> {
    if (volume < 1 || volume > 2) {
      throw new Error('ʿUyūn akhbār al-Riḍā volume must be between 1 and 2')
    }
    const bookId = `Uyun-akhbar-al-Rida-Volume-${volume}-Saduq`
    return thaqalaynApi.getRandomHadithFromBook(bookId)
  },

  // Search across all ʿUyūn akhbār al-Riḍā volumes
  async searchUyun(query: string): Promise<QueryResponse> {
    const volumes = this.getUyunVolumes()
    const promises = volumes.map((volume) => thaqalaynApi.searchBook(volume, query))

    try {
      const results = await Promise.all(promises)
      const combinedResults = results.flatMap((result) => result.results)

      return {
        results: combinedResults,
        total: combinedResults.length,
      }
    } catch {
      // Error logging removed for production;
      return { results: [], total: 0 }
    }
  },

  // Get all hadiths from specific ʿUyūn akhbār al-Riḍā volume
  async getVolumeHadiths(volume: number): Promise<Hadith[]> {
    if (volume < 1 || volume > 2) {
      throw new Error('ʿUyūn akhbār al-Riḍā volume must be between 1 and 2')
    }
    const bookId = `Uyun-akhbar-al-Rida-Volume-${volume}-Saduq`
    return thaqalaynApi.getBookHadiths(bookId)
  },

  // Get organized chapter structure for ʿUyūn akhbār al-Riḍā volume
  async getVolumeChapterStructure(volume: number): Promise<ChapterStructure> {
    if (volume < 1 || volume > 2) {
      throw new Error('ʿUyūn akhbār al-Riḍā volume must be between 1 and 2')
    }

    try {
      const hadiths = await this.getVolumeHadiths(volume)

      const structure: ChapterStructure = {}

      hadiths.forEach((hadith) => {
        const categoryKey = hadith.category || 'Uncategorized'
        const chapterKey = hadith.chapter || 'No Chapter'

        if (!structure[categoryKey]) {
          structure[categoryKey] = {
            category: categoryKey,
            categoryId: hadith.categoryId || '',
            chapters: {},
          }
        }

        if (!structure[categoryKey].chapters[chapterKey]) {
          structure[categoryKey].chapters[chapterKey] = {
            chapter: chapterKey,
            chapterInCategoryId: hadith.chapterInCategoryId || 0,
            hadiths: [],
          }
        }

        structure[categoryKey].chapters[chapterKey].hadiths.push(hadith)
      })

      // Sort chapters by chapterInCategoryId
      Object.values(structure).forEach((category) => {
        const sortedChapters: Record<string, ChapterInfo> = {}
        const sortedEntries = Object.entries(category.chapters).sort(
          ([, a], [, b]) => a.chapterInCategoryId - b.chapterInCategoryId,
        )

        sortedEntries.forEach(([key, value]) => {
          sortedChapters[key] = value
        })

        category.chapters = sortedChapters
      })

      return structure
    } catch {
      // Error logging removed for production;
      throw new Error(`Failed to load volume ${volume} structure`)
    }
  },

  // Get a specific chapter's hadiths without loading the entire volume
  async getChapterHadiths(
    volume: number,
    categoryId: string,
    chapterId: number,
  ): Promise<Hadith[]> {
    if (volume < 1 || volume > 2) {
      throw new Error('ʿUyūn akhbār al-Riḍā volume must be between 1 and 2')
    }

    const bookId = `Uyun-akhbar-al-Rida-Volume-${volume}-Saduq`

    try {
      // This is a workaround since the API doesn't provide chapter-specific endpoints
      // We'll get all hadiths and filter by chapter
      const allHadiths = await thaqalaynApi.getBookHadiths(bookId)
      return allHadiths.filter(
        (hadith) => hadith.categoryId === categoryId && hadith.chapterInCategoryId === chapterId,
      )
    } catch {
      // Error logging removed for production;
      throw new Error(`Failed to load chapter hadiths`)
    }
  },
}

// Generic Book API (works for any book, single or multi-volume)
export const bookApi = {
  // Get all hadiths for a specific book
  async getBookHadiths(bookId: string): Promise<Hadith[]> {
    return await thaqalaynApi.getBookHadiths(bookId)
  },

  // Get organized chapter structure for any book
  async getBookChapterStructure(bookId: string): Promise<ChapterStructure> {
    try {
      const hadiths = await this.getBookHadiths(bookId)
      const structure: ChapterStructure = {}

      hadiths.forEach((hadith) => {
        const categoryKey = hadith.category || 'No Category'
        const chapterKey = hadith.chapter || 'No Chapter'

        if (!structure[categoryKey]) {
          structure[categoryKey] = {
            category: categoryKey,
            categoryId: hadith.categoryId || '',
            chapters: {},
          }
        }

        if (!structure[categoryKey].chapters[chapterKey]) {
          structure[categoryKey].chapters[chapterKey] = {
            chapter: chapterKey,
            chapterInCategoryId: hadith.chapterInCategoryId || 0,
            hadiths: [],
          }
        }

        structure[categoryKey].chapters[chapterKey].hadiths.push(hadith)
      })

      // Sort chapters within each category
      Object.values(structure).forEach((category) => {
        const sortedChapters: Record<string, ChapterInfo> = {}
        const sortedEntries = Object.entries(category.chapters).sort(
          ([, a], [, b]) => a.chapterInCategoryId - b.chapterInCategoryId,
        )

        sortedEntries.forEach(([key, value]) => {
          sortedChapters[key] = value
        })

        category.chapters = sortedChapters
      })

      return structure
    } catch (error) {
      console.error(`Error getting chapter structure for ${bookId}:`, error)
      throw new Error(`Failed to load chapter structure for ${bookId}`)
    }
  },

  // Get hadiths for a specific chapter in a book
  async getChapterHadiths(
    bookId: string,
    categoryId: string,
    chapterInCategoryId: number,
  ): Promise<Hadith[]> {
    try {
      const allHadiths = await this.getBookHadiths(bookId)
      return allHadiths.filter(
        (h) => h.categoryId === categoryId && h.chapterInCategoryId === chapterInCategoryId,
      )
    } catch (error) {
      console.error(`Error getting chapter hadiths for ${bookId}:`, error)
      throw new Error(`Failed to load chapter hadiths for ${bookId}`)
    }
  },
}
