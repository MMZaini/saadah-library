import { alKafiApi, uyunApi } from './api'

// Book configuration for multi-volume and single-volume books
export interface BookConfig {
  bookId: string
  baseName: string
  englishName: string
  hasMultipleVolumes: boolean
  volumes?: string[]
  volumeCount?: number
}

// Multi-volume book configurations
export const MULTI_VOLUME_BOOKS: Record<string, BookConfig> = {
  'Al-Kafi': {
    bookId: 'Al-Kafi',
    baseName: 'Al-Kafi-Kulayni',
    englishName: 'Al-Kāfi',
    hasMultipleVolumes: true,
    volumes: alKafiApi.getAlKafiVolumes(),
    volumeCount: 8
  },

  'Uyun-akhbar-al-Rida': {
    bookId: 'Uyun-akhbar-al-Rida',
    baseName: 'Uyun-akhbar-al-Rida-Saduq',
    englishName: 'ʿUyūn akhbār al-Riḍā',
    hasMultipleVolumes: true,
    volumes: uyunApi.getUyunVolumes(),
    volumeCount: 2
  }
  ,
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
      'Man-La-Yahduruh-al-Faqih-Volume-5-Saduq'
    ],
    volumeCount: 5
  }
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
  'Kamil-al-Ziyarat-Qummi',
  'Kitab-al-Duafa-Ghadairi',
  'Maani-al-Akhbar-Saduq',
  'Mujam-al-Ahadith-al-Mutabara-Muhsini'
]

export const isMultiVolumeBook = (bookId: string): boolean => {
  return Object.keys(MULTI_VOLUME_BOOKS).some(key => bookId.startsWith(key))
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
      volumeCount: 1
    }
  }

  return null
}
