export interface CanonicalHadithGrading {
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

export interface CanonicalBook {
  id: string
  title: string
  englishName: string
  author: string
  description: string
  cover: string
  volumeIds: string[]
  legacyBookIds: string[]
}

export interface CanonicalVolume {
  id: string
  bookId: string
  legacyBookId: string
  volumeNumber: number
  title: string
  englishName: string
  translator: string
  sourcePointer: string | null
}

export interface CanonicalChapter {
  id: string
  sourcePath: string | null
  bookId: string
  volumeId: string
  legacyBookId: string
  volumePointer: string | null
  sectionNumber: number
  chapterNumber: number
  categoryId: string
  category: string
  chapter: string
}

export interface CanonicalHadith {
  id: string
  sourceKey: string
  sourceUrl: string | null
  bookId: string
  volumeId: string
  legacyBookId: string
  legacyHadithId: number
  chapterId: string
  sourceHadithNumber: number | null
  englishText: string
  arabicText: string
  sanad: string
  matn: string
  gradings: CanonicalHadithGrading[]
}

export interface DatasetManifest {
  schemaVersion: number
  version: string
  generatedAt: string
  source: {
    kind: string
    url: string | null
    commitSha: string | null
    license: string
    notes: string[]
  }
  counts: {
    books: number
    volumes: number
    chapters: number
    hadiths: number
  }
  artifactHash: string
  checksums: Record<string, string>
}

export interface LocalHadithRef {
  bookId: string
  id: number
  volume: number
  sourceKey: string
}

export interface LocalSearchEntry {
  bookId: string
  id: number
  sourceKey: string
  english: string
  arabic: string
}
