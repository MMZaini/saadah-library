// Book configuration for multi-volume and single-volume books
export interface BookConfig {
  bookId: string
  baseName: string
  englishName: string
  hasMultipleVolumes: boolean
  volumes?: string[]
  volumeCount?: number
}

export const AL_KAFI_VOLUMES = [
  'Al-Kafi-Volume-1-Kulayni',
  'Al-Kafi-Volume-2-Kulayni',
  'Al-Kafi-Volume-3-Kulayni',
  'Al-Kafi-Volume-4-Kulayni',
  'Al-Kafi-Volume-5-Kulayni',
  'Al-Kafi-Volume-6-Kulayni',
  'Al-Kafi-Volume-7-Kulayni',
  'Al-Kafi-Volume-8-Kulayni',
]

export const UYUN_VOLUMES = [
  'Uyun-akhbar-al-Rida-Volume-1-Saduq',
  'Uyun-akhbar-al-Rida-Volume-2-Saduq',
]

// Multi-volume book configurations
export const MULTI_VOLUME_BOOKS: Record<string, BookConfig> = {
  'Al-Kafi': {
    bookId: 'Al-Kafi',
    baseName: 'Al-Kafi-Kulayni',
    englishName: 'Al-Kāfi',
    hasMultipleVolumes: true,
    volumes: AL_KAFI_VOLUMES,
    volumeCount: 8,
  },

  'Uyun-akhbar-al-Rida': {
    bookId: 'Uyun-akhbar-al-Rida',
    baseName: 'Uyun-akhbar-al-Rida-Saduq',
    englishName: 'ʿUyūn akhbār al-Riḍā',
    hasMultipleVolumes: true,
    volumes: UYUN_VOLUMES,
    volumeCount: 2,
  },
  'Man-La-Yahduruh-al-Faqih': {
    bookId: 'Man-La-Yahduruh-al-Faqih',
    baseName: 'Man-La-Yahduruh-al-Faqih-Saduq',
    englishName: 'Man lā yaḥḍuruh al-Faqīh',
    hasMultipleVolumes: true,
    volumes: [
      'Man-La-Yahduruh-al-Faqih-Volume-1-Saduq',
      'Man-La-Yahduruh-al-Faqih-Volume-2-Saduq',
      'Man-La-Yahduruh-al-Faqih-Volume-3-Saduq',
      'Man-La-Yahduruh-al-Faqih-Volume-4-Saduq',
      'Man-La-Yahduruh-al-Faqih-Volume-5-Saduq',
    ],
    volumeCount: 5,
  },
}

// Single-volume books (common API book IDs)
export const SINGLE_VOLUME_BOOKS: string[] = [
  'Al-Tawhid-Saduq',
  'Al-Amali-Mufid',
  'Al-Amali-Saduq',
  'Nahj-al-Balagha-Radi',
  'Sifat-al-Shia-Saduq',
  'Fadail-al-Shia-Saduq',
  'Kitab-al-Mumin-Ahwazi',
  'Kitab-al-Zuhd-Ahwazi',
  'Risalat-al-Huquq-Abidin',
  'Thawab-al-Amal-wa-iqab-al-Amal-Saduq',
  'Al-Khisal-Saduq',
  'Kamal-al-Din-wa-Tamam-al-Nima-Saduq',
  'Kamil-al-Ziyarat-Qummi',
  'Kitab-al-Duafa-Ghadairi',
  'Maani-al-Akhbar-Saduq',
  'Mujam-al-Ahadith-al-Mutabara-Muhsini',
]

// URL slug to full book ID mapping for cleaner URLs
export const URL_TO_BOOK_ID_MAP: Record<string, string> = {
  // Multi-volume books - map short URL to primary volume
  'Uyun-akhbar-al-Rida': 'Uyun-akhbar-al-Rida-Volume-1-Saduq',
  'Man-La-Yahduruh-al-Faqih': 'Man-La-Yahduruh-al-Faqih-Volume-1-Saduq',

  // Single-volume books - remove author names
  'Al-Amali-Mufid': 'Al-Amali-Mufid',
  'Al-Amali-Saduq': 'Al-Amali-Saduq',
  'Al-Tawhid': 'Al-Tawhid-Saduq',
  'Kitab-al-Ghayba-Numani': 'Kitab-al-Ghayba-Numani',
  'Kitab-al-Ghayba-Tusi': 'Kitab-al-Ghayba-Tusi',
  'Nahj-al-Balagha': 'Nahj-al-Balagha-Radi',
  'Sifat-al-Shia': 'Sifat-al-Shia-Saduq',
  'Fadail-al-Shia': 'Fadail-al-Shia-Saduq',
  'Kitab-al-Mumin': 'Kitab-al-Mumin-Ahwazi',
  'Kitab-al-Zuhd': 'Kitab-al-Zuhd-Ahwazi',
  'Risalat-al-Huquq': 'Risalat-al-Huquq-Abidin',
  'Thawab-al-Amal-wa-iqab-al-Amal': 'Thawab-al-Amal-wa-iqab-al-Amal-Saduq',
  'Al-Khisal': 'Al-Khisal-Saduq',
  'Kamal-al-Din-wa-Tamam-al-Nima': 'Kamal-al-Din-wa-Tamam-al-Nima-Saduq',
  'Kamil-al-Ziyarat': 'Kamil-al-Ziyarat-Qummi',
  'Kitab-al-Duafa': 'Kitab-al-Duafa-Ghadairi',
  'Maani-al-Akhbar': 'Maani-al-Akhbar-Saduq',
  'Mujam-al-Ahadith-al-Mutabara': 'Mujam-al-Ahadith-al-Mutabara-Muhsini',
}

// Reverse mapping for generating URLs from book IDs
export const BOOK_ID_TO_URL_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(URL_TO_BOOK_ID_MAP).map(([url, bookId]) => [bookId, url]),
)

// Helper function to get clean URL from book ID
export const getBookUrlSlug = (bookId: string): string => {
  const slug = BOOK_ID_TO_URL_MAP[bookId] || bookId
  return slug.toLowerCase()
}

// Helper function to get full book ID from URL slug
export const getBookIdFromUrlSlug = (urlSlug: string): string => {
  if (!urlSlug) return urlSlug

  // Case-insensitive lookup: prefer exact key, otherwise try lowercase key
  const exact = URL_TO_BOOK_ID_MAP[urlSlug]
  if (exact) return exact

  const lowerKey = urlSlug.toLowerCase()
  // Build a lowercase-keyed lookup for efficient case-insensitive mapping
  const lowercaseMap: Record<string, string> = Object.fromEntries(
    Object.entries(URL_TO_BOOK_ID_MAP).map(([k, v]) => [k.toLowerCase(), v]),
  )

  return lowercaseMap[lowerKey] || urlSlug
}

export const isMultiVolumeBook = (bookId: string): boolean => {
  return Object.keys(MULTI_VOLUME_BOOKS).some((key) => bookId.startsWith(key))
}

export const getBookConfig = (bookId: string): BookConfig | null => {
  // Check multi-volume books by prefix
  for (const [key, config] of Object.entries(MULTI_VOLUME_BOOKS)) {
    if (bookId.startsWith(key)) {
      return config
    }
  }

  // Check single-volume list
  if (SINGLE_VOLUME_BOOKS.includes(bookId)) {
    return {
      bookId,
      baseName: bookId,
      englishName: bookId,
      hasMultipleVolumes: false,
      volumes: [bookId],
      volumeCount: 1,
    }
  }

  return null
}

// Unified searchable book list for the global search scope selector
export interface SearchableBook {
  key: string // unique identifier
  displayName: string // shown in UI chips
  volumeIds: string[] // API book IDs (one per volume)
  volumeCount: number // total number of volumes
}

export const SEARCHABLE_BOOKS: SearchableBook[] = [
  {
    key: 'Al-Kafi',
    displayName: 'Al-Kāfi',
    volumeIds: MULTI_VOLUME_BOOKS['Al-Kafi'].volumes!,
    volumeCount: 8,
  },
  {
    key: 'Uyun-akhbar-al-Rida',
    displayName: 'ʿUyūn akhbār al-Riḍā',
    volumeIds: MULTI_VOLUME_BOOKS['Uyun-akhbar-al-Rida'].volumes!,
    volumeCount: 2,
  },
  {
    key: 'Al-Amali-Mufid',
    displayName: 'Al-Amālī (Mufīd)',
    volumeIds: ['Al-Amali-Mufid'],
    volumeCount: 1,
  },
  {
    key: 'Al-Amali-Saduq',
    displayName: 'Al-Amālī (Ṣaduq)',
    volumeIds: ['Al-Amali-Saduq'],
    volumeCount: 1,
  },
  {
    key: 'Man-La-Yahduruh-al-Faqih',
    displayName: 'Man lā yaḥḍuruh al-Faqīh',
    volumeIds: MULTI_VOLUME_BOOKS['Man-La-Yahduruh-al-Faqih'].volumes!,
    volumeCount: 5,
  },
  {
    key: 'Al-Tawhid-Saduq',
    displayName: 'Al-Tawḥīd',
    volumeIds: ['Al-Tawhid-Saduq'],
    volumeCount: 1,
  },
  {
    key: 'Kitab-al-Ghayba-Numani',
    displayName: 'Kitāb al-Ghayba (Nuʿmānī)',
    volumeIds: ['Kitab-al-Ghayba-Numani'],
    volumeCount: 1,
  },
  {
    key: 'Kitab-al-Ghayba-Tusi',
    displayName: 'Kitāb al-Ghayba (Ṭūsī)',
    volumeIds: ['Kitab-al-Ghayba-Tusi'],
    volumeCount: 1,
  },
  {
    key: 'Nahj-al-Balagha-Radi',
    displayName: 'Nahj al-Balāgha',
    volumeIds: ['Nahj-al-Balagha-Radi'],
    volumeCount: 1,
  },
  {
    key: 'Sifat-al-Shia-Saduq',
    displayName: 'Ṣifāt al-Shīʿa',
    volumeIds: ['Sifat-al-Shia-Saduq'],
    volumeCount: 1,
  },
  {
    key: 'Fadail-al-Shia-Saduq',
    displayName: 'Faḍāʾil al-Shīʿa',
    volumeIds: ['Fadail-al-Shia-Saduq'],
    volumeCount: 1,
  },
  {
    key: 'Kitab-al-Mumin-Ahwazi',
    displayName: 'Kitāb al-Muʾmin',
    volumeIds: ['Kitab-al-Mumin-Ahwazi'],
    volumeCount: 1,
  },
  {
    key: 'Kitab-al-Zuhd-Ahwazi',
    displayName: 'Kitāb al-Zuhd',
    volumeIds: ['Kitab-al-Zuhd-Ahwazi'],
    volumeCount: 1,
  },
  {
    key: 'Risalat-al-Huquq-Abidin',
    displayName: 'Risālat al-Ḥuqūq',
    volumeIds: ['Risalat-al-Huquq-Abidin'],
    volumeCount: 1,
  },
  {
    key: 'Thawab-al-Amal-wa-iqab-al-Amal-Saduq',
    displayName: 'Thawāb al-Aʿmāl',
    volumeIds: ['Thawab-al-Amal-wa-iqab-al-Amal-Saduq'],
    volumeCount: 1,
  },
  {
    key: 'Al-Khisal-Saduq',
    displayName: 'Al-Khiṣāl',
    volumeIds: ['Al-Khisal-Saduq'],
    volumeCount: 1,
  },
  {
    key: 'Kamal-al-Din-wa-Tamam-al-Nima-Saduq',
    displayName: 'Kamāl al-Dīn',
    volumeIds: ['Kamal-al-Din-wa-Tamam-al-Nima-Saduq'],
    volumeCount: 1,
  },
  {
    key: 'Kamil-al-Ziyarat-Qummi',
    displayName: 'Kāmil al-Ziyārāt',
    volumeIds: ['Kamil-al-Ziyarat-Qummi'],
    volumeCount: 1,
  },
  {
    key: 'Kitab-al-Duafa-Ghadairi',
    displayName: 'Kitāb al-Ḍuʿafāʾ',
    volumeIds: ['Kitab-al-Duafa-Ghadairi'],
    volumeCount: 1,
  },
  {
    key: 'Maani-al-Akhbar-Saduq',
    displayName: 'Maʿānī al-Akhbār',
    volumeIds: ['Maani-al-Akhbar-Saduq'],
    volumeCount: 1,
  },
  {
    key: 'Mujam-al-Ahadith-al-Mutabara-Muhsini',
    displayName: 'Muʿjam al-Aḥādīth al-Muʿtabara',
    volumeIds: ['Mujam-al-Ahadith-al-Mutabara-Muhsini'],
    volumeCount: 1,
  },
]

// Runtime volume IDs (one per `runtime/volumes/*.json`) that contain at least
// one graded hadith in the active dataset. Most books carry no grading data, so
// the search "Grading Classification" filter is only meaningful for these.
// Derived from the dataset and validated by tests/data/gradings.test.mjs — if
// the dataset changes, that test fails until this set is updated.
export const VOLUMES_WITH_GRADINGS: ReadonlySet<string> = new Set([
  'Al-Amali-Mufid',
  'Al-Kafi-Volume-1-Kulayni',
  'Al-Kafi-Volume-2-Kulayni',
  'Al-Kafi-Volume-3-Kulayni',
  'Al-Kafi-Volume-4-Kulayni',
  'Al-Kafi-Volume-5-Kulayni',
  'Al-Kafi-Volume-6-Kulayni',
  'Al-Kafi-Volume-7-Kulayni',
  'Al-Kafi-Volume-8-Kulayni',
  'Al-Khisal-Saduq',
  'Al-Tawhid-Saduq',
  'Kitab-al-Zuhd-Ahwazi',
  'Maani-al-Akhbar-Saduq',
  'Man-La-Yahduruh-al-Faqih-Volume-5-Saduq',
  'Mujam-al-Ahadith-al-Mutabara-Muhsini',
  'Uyun-akhbar-al-Rida-Volume-1-Saduq',
  'Uyun-akhbar-al-Rida-Volume-2-Saduq',
])

// True if any of the given runtime volume IDs has graded hadith.
export const volumesHaveGradings = (volumeIds: string[]): boolean =>
  volumeIds.some((id) => VOLUMES_WITH_GRADINGS.has(id))

/**
 * Whether the "Grading Classification" search filter should be offered for a
 * given SearchInterface context. Global search ('all-books'/undefined) and
 * Al-Kāfi always qualify; a specific book qualifies only if it actually has
 * graded hadith in any of its volumes.
 */
export const searchContextHasGradings = (searchContext?: string): boolean => {
  if (!searchContext || searchContext === 'all-books') {
    return SEARCHABLE_BOOKS.some((book) => volumesHaveGradings(book.volumeIds))
  }
  if (searchContext === 'al-kafi') return volumesHaveGradings(AL_KAFI_VOLUMES)

  // A specific book page passes the (first) volume ID; resolve the full volume
  // set so multi-volume books are evaluated across every volume (e.g. Man lā
  // yaḥḍuruh, where only volume 5 carries gradings).
  const config = getBookConfig(searchContext)
  const volumeIds = config?.volumes?.length ? config.volumes : [searchContext]
  return volumesHaveGradings(volumeIds)
}
