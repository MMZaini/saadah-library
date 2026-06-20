import fs from 'node:fs/promises'
import path from 'node:path'
import type { BookInfo, Hadith, QueryResponse } from '@/lib/api'
import { flexibleEnglishMatch, isArabicQuery, normalizeArabic } from '@/lib/search-utils'
import type { DatasetManifest, LocalHadithRef, LocalSearchEntry } from '@/lib/data/types'

const DATA_ROOT = path.join(process.cwd(), 'public', 'data', 'thaqalayn', 'current')

const jsonCache = new Map<string, Promise<unknown>>()

async function readJson<T>(filePath: string): Promise<T> {
  const cached = jsonCache.get(filePath)
  if (cached) return cached as Promise<T>

  const promise = fs.readFile(filePath, 'utf8').then((text) => JSON.parse(text) as T)
  jsonCache.set(filePath, promise)
  return promise
}

async function runtimePath(...segments: string[]) {
  const manifest = await getLocalManifest()
  return path.join(
    process.cwd(),
    'public',
    'data',
    'thaqalayn',
    manifest.version,
    'runtime',
    ...segments,
  )
}

export async function getLocalManifest(): Promise<DatasetManifest> {
  return readJson<DatasetManifest>(path.join(DATA_ROOT, 'manifest.json'))
}

export async function getLocalBooks(): Promise<BookInfo[]> {
  return readJson<BookInfo[]>(await runtimePath('books.json'))
}

export async function getAvailableBookIds(): Promise<string[]> {
  const books = await getLocalBooks()
  return books.map((book) => book.bookId)
}

export async function getLocalBookHadiths(bookId: string): Promise<Hadith[]> {
  return readJson<Hadith[]>(await runtimePath('volumes', `${bookId}.json`))
}

export async function getLocalHadith(bookId: string, hadithId: number): Promise<Hadith> {
  const hadiths = await getLocalBookHadiths(bookId)
  const found = hadiths.find((hadith) => hadith.id === hadithId)
  if (!found) throw new Error(`No hadith ${hadithId} in ${bookId}`)
  return found
}

export async function findLocalHadithAcrossBooks(
  bookIds: string[],
  hadithId: number,
): Promise<Hadith | null> {
  const results = await Promise.allSettled(
    bookIds.map((bookId) => getLocalHadith(bookId, hadithId)),
  )

  for (const result of results) {
    if (result.status === 'fulfilled') return result.value
  }

  return null
}

export async function getLocalRandomHadith(bookId?: string): Promise<Hadith> {
  const random = await readJson<{
    allRefs: LocalHadithRef[]
    byBook: Record<string, LocalHadithRef[]>
  }>(await runtimePath('random.json'))
  const refs = bookId ? random.byBook[bookId] || [] : random.allRefs
  if (refs.length === 0)
    throw new Error(`No hadith refs available${bookId ? ` for ${bookId}` : ''}`)
  const ref = refs[Math.floor(Math.random() * refs.length)]
  return getLocalHadith(ref.bookId, ref.id)
}

export interface ChapterMeta {
  chapter: string
  chapterInCategoryId: number
  hadithCount: number
  sourceChapterKey?: string
  bookId?: string
  volume?: number
}

export interface CategoryMeta {
  category: string
  categoryId: string
  chapters: Record<string, ChapterMeta>
  totalHadiths: number
  sourceChapterKeys?: string[]
}

export type StructureMap = Record<string, CategoryMeta>

export interface BookStructureEntry {
  structure: StructureMap
  totalHadiths: number
  volumeIds: string[]
}

export async function getLocalStructure(bookIds: string[]): Promise<StructureMap> {
  if (bookIds.length === 1) {
    return readJson<StructureMap>(await runtimePath('structures', `${bookIds[0]}.json`))
  }

  const all = await getAllLocalStructures()
  const key = `__merged__:${bookIds.slice().sort().join('|')}`
  if (all[key]) return all[key].structure

  const structures = await Promise.all(
    bookIds.map((bookId) =>
      runtimePath('structures', `${bookId}.json`)
        .then((filePath) => readJson<StructureMap>(filePath))
        .catch(() => ({})),
    ),
  )
  return Object.assign({}, ...structures)
}

export async function getAllLocalStructures(): Promise<Record<string, BookStructureEntry>> {
  return readJson<Record<string, BookStructureEntry>>(await runtimePath('structures', 'all.json'))
}

async function getSearchShard(bookId: string): Promise<LocalSearchEntry[]> {
  return readJson<LocalSearchEntry[]>(await runtimePath('search', `${bookId}.json`))
}

async function hydrateSearchHits(hits: Array<Pick<LocalSearchEntry, 'bookId' | 'id'>>) {
  const grouped = new Map<string, Set<number>>()
  for (const hit of hits) {
    grouped.set(hit.bookId, grouped.get(hit.bookId) ?? new Set())
    grouped.get(hit.bookId)!.add(hit.id)
  }

  const hydrated: Hadith[] = []
  for (const [bookId, ids] of grouped) {
    const hadiths = await getLocalBookHadiths(bookId)
    for (const hadith of hadiths) {
      if (ids.has(hadith.id)) hydrated.push(hadith)
    }
  }
  return hydrated
}

const GRADING_KEYWORDS: Record<string, string[]> = {
  sahih: ['صحيح', 'sahih', 'authentic'],
  hasan: ['حسن', 'hasan', 'good'],
  muwathaq: ['موثق', 'muwathaq', 'reliable'],
  qawi: ['قوي', 'qawi', 'strong'],
  daif: ['ضعيف', 'daif', 'weak'],
  majhul: ['مجهول', 'majhul', 'unknown'],
  mursal: ['مرسل', 'mursal'],
}

const COMMON_GRADING_TERMS = ['صحيح', 'حسن', 'موثق', 'قوي', 'ضعيف', 'مجهول', 'مرسل', 'لم يخرجه']

function getHadithGradingText(hadith: Hadith) {
  return [
    hadith.majlisiGrading,
    hadith.mohseniGrading,
    hadith.behbudiGrading,
    ...(hadith.gradingsFull || []).map((grading) => `${grading.grade_en} ${grading.grade_ar}`),
  ]
    .join(' ')
    .toLowerCase()
}

function hasNoIncludedGrading(hadith: Hadith, gradingText: string) {
  const none =
    !hadith.majlisiGrading &&
    !hadith.mohseniGrading &&
    !hadith.behbudiGrading &&
    (!hadith.gradingsFull || hadith.gradingsFull.length === 0)

  return none || gradingText.includes('لم يخرجه')
}

function matchesGrading(hadith: Hadith, grading: string) {
  const gradingText = getHadithGradingText(hadith)

  if (grading === 'lam-yukhrijhu') return hasNoIncludedGrading(hadith, gradingText)

  if (grading === 'other') {
    return (
      gradingText.trim().length > 0 &&
      !COMMON_GRADING_TERMS.some((term) => gradingText.includes(term.toLowerCase()))
    )
  }

  return (
    GRADING_KEYWORDS[grading]?.some((keyword) => gradingText.includes(keyword.toLowerCase())) ??
    false
  )
}

export async function filterLocalHadiths(
  bookIds?: string[],
  gradings: string[] = [],
): Promise<QueryResponse> {
  const activeGradings = gradings.filter((grading) => grading && grading !== 'all')
  if ((!bookIds || bookIds.length === 0) && activeGradings.length === 0) {
    return { results: [], total: 0 }
  }

  const scope = bookIds && bookIds.length > 0 ? bookIds : await getAvailableBookIds()
  const volumes = await Promise.all(
    scope.map((bookId) => getLocalBookHadiths(bookId).catch(() => [] as Hadith[])),
  )

  let results = volumes.flat()
  if (activeGradings.length > 0) {
    results = results.filter((hadith) =>
      activeGradings.some((grading) => matchesGrading(hadith, grading)),
    )
  }

  results.sort((a, b) => (a.volume || 0) - (b.volume || 0) || (a.id || 0) - (b.id || 0))
  return { results, total: results.length }
}

export async function searchLocalHadiths(
  query: string,
  bookIds?: string[],
): Promise<QueryResponse> {
  const trimmed = query.trim()
  if (!trimmed) return { results: [], total: 0 }

  const scope = bookIds && bookIds.length > 0 ? bookIds : await getAvailableBookIds()
  const arabic = isArabicQuery(trimmed)
  const arabicQuery = arabic ? normalizeArabic(trimmed) : ''
  const englishWords = trimmed.toLowerCase().split(/\s+/).filter(Boolean)
  const hits: Array<Pick<LocalSearchEntry, 'bookId' | 'id'>> = []

  const shards = await Promise.all(
    scope.map((bookId) => getSearchShard(bookId).catch(() => [] as LocalSearchEntry[])),
  )

  for (const shard of shards) {
    for (const entry of shard) {
      const matched = arabic
        ? entry.arabic.includes(arabicQuery)
        : flexibleEnglishMatch(entry.english, englishWords, {
            caseInsensitive: true,
            useSynonyms: true,
            useStemming: true,
          })

      if (matched) hits.push({ bookId: entry.bookId, id: entry.id })
    }
  }

  const results = await hydrateSearchHits(hits)
  return { results, total: results.length }
}
