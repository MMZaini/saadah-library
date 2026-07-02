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
  'Kitab-al-Ghayba-Numani',
  'Kitab-al-Ghayba-Tusi',
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

// Display names for single-volume books, keyed by dataset bookId. Without
// these, getBookConfig falls back to the raw ID and it leaks into the UI
// (page titles, search placeholders). Kept in sync with SEARCHABLE_BOOKS'
// displayName values below.
export const SINGLE_VOLUME_ENGLISH_NAMES: Record<string, string> = {
  'Al-Tawhid-Saduq': 'Al-Tawḥīd',
  'Al-Amali-Mufid': 'Al-Amālī (Mufīd)',
  'Al-Amali-Saduq': 'Al-Amālī (Ṣaduq)',
  'Kitab-al-Ghayba-Numani': 'Kitāb al-Ghayba (Nuʿmānī)',
  'Kitab-al-Ghayba-Tusi': 'Kitāb al-Ghayba (Ṭūsī)',
  'Nahj-al-Balagha-Radi': 'Nahj al-Balāgha',
  'Sifat-al-Shia-Saduq': 'Ṣifāt al-Shīʿa',
  'Fadail-al-Shia-Saduq': 'Faḍāʾil al-Shīʿa',
  'Kitab-al-Mumin-Ahwazi': 'Kitāb al-Muʾmin',
  'Kitab-al-Zuhd-Ahwazi': 'Kitāb al-Zuhd',
  'Risalat-al-Huquq-Abidin': 'Risālat al-Ḥuqūq',
  'Thawab-al-Amal-wa-iqab-al-Amal-Saduq': 'Thawāb al-Aʿmāl',
  'Al-Khisal-Saduq': 'Al-Khiṣāl',
  'Kamal-al-Din-wa-Tamam-al-Nima-Saduq': 'Kamāl al-Dīn',
  'Kamil-al-Ziyarat-Qummi': 'Kāmil al-Ziyārāt',
  'Kitab-al-Duafa-Ghadairi': 'Kitāb al-Ḍuʿafāʾ',
  'Maani-al-Akhbar-Saduq': 'Maʿānī al-Akhbār',
  'Mujam-al-Ahadith-al-Mutabara-Muhsini': 'Muʿjam al-Aḥādīth al-Muʿtabara',
}

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

// Lowercase-keyed lookup for case-insensitive slug resolution. Built once at
// module load — getBookIdFromUrlSlug runs in render paths (TopBar, pages).
const LOWERCASE_URL_TO_BOOK_ID_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(URL_TO_BOOK_ID_MAP).map(([k, v]) => [k.toLowerCase(), v]),
)

// Helper function to get full book ID from URL slug
export const getBookIdFromUrlSlug = (urlSlug: string): string => {
  if (!urlSlug) return urlSlug

  // Case-insensitive lookup: prefer exact key, otherwise try lowercase key
  const exact = URL_TO_BOOK_ID_MAP[urlSlug]
  if (exact) return exact

  return LOWERCASE_URL_TO_BOOK_ID_MAP[urlSlug.toLowerCase()] || urlSlug
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
      englishName: SINGLE_VOLUME_ENGLISH_NAMES[bookId] ?? bookId,
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

// Single-volume entries share their displayName with SINGLE_VOLUME_ENGLISH_NAMES
// so the search chips and getBookConfig can never drift apart.
const singleVolumeSearchable = (key: string): SearchableBook => ({
  key,
  displayName: SINGLE_VOLUME_ENGLISH_NAMES[key] ?? key,
  volumeIds: [key],
  volumeCount: 1,
})

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
  singleVolumeSearchable('Al-Amali-Mufid'),
  singleVolumeSearchable('Al-Amali-Saduq'),
  {
    key: 'Man-La-Yahduruh-al-Faqih',
    displayName: 'Man lā yaḥḍuruh al-Faqīh',
    volumeIds: MULTI_VOLUME_BOOKS['Man-La-Yahduruh-al-Faqih'].volumes!,
    volumeCount: 5,
  },
  singleVolumeSearchable('Al-Tawhid-Saduq'),
  singleVolumeSearchable('Kitab-al-Ghayba-Numani'),
  singleVolumeSearchable('Kitab-al-Ghayba-Tusi'),
  singleVolumeSearchable('Nahj-al-Balagha-Radi'),
  singleVolumeSearchable('Sifat-al-Shia-Saduq'),
  singleVolumeSearchable('Fadail-al-Shia-Saduq'),
  singleVolumeSearchable('Kitab-al-Mumin-Ahwazi'),
  singleVolumeSearchable('Kitab-al-Zuhd-Ahwazi'),
  singleVolumeSearchable('Risalat-al-Huquq-Abidin'),
  singleVolumeSearchable('Thawab-al-Amal-wa-iqab-al-Amal-Saduq'),
  singleVolumeSearchable('Al-Khisal-Saduq'),
  singleVolumeSearchable('Kamal-al-Din-wa-Tamam-al-Nima-Saduq'),
  singleVolumeSearchable('Kamil-al-Ziyarat-Qummi'),
  singleVolumeSearchable('Kitab-al-Duafa-Ghadairi'),
  singleVolumeSearchable('Maani-al-Akhbar-Saduq'),
  singleVolumeSearchable('Mujam-al-Ahadith-al-Mutabara-Muhsini'),
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
