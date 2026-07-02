import fs from 'node:fs/promises'
import path from 'node:path'
import type { BookInfo, Hadith, QueryResponse } from '@/lib/api'
import {
  isArabicQuery,
  matchesSearchMode,
  normalizeArabic,
  normalizeEnglishForSearch,
  normalizeSearchModes,
  type SearchMode,
} from '@/lib/search-utils'
import type { DatasetManifest, LocalHadithRef, LocalSearchEntry } from '@/lib/data/types'

const DATA_ROOT = path.join(process.cwd(), 'public', 'data', 'thaqalayn', 'current')

// Three cache tiers, sized to what each artifact class costs:
//  - small artifacts (manifest, books.json, structures) are cached forever
//  - search shards stay resident too — a global search touches all of them
//    every request, so evicting any turns every search into disk I/O
//  - full-volume files (the biggest tier, ~100 MB total) go through a bounded
//    LRU so grading filters over all books can't pin the whole dataset
const jsonCache = new Map<string, Promise<unknown>>()
const volumeCache = new Map<string, Promise<unknown>>()
const MAX_VOLUME_CACHE_ENTRIES = 12

function isVolumeArtifact(filePath: string): boolean {
  return filePath.includes(`${path.sep}volumes${path.sep}`)
}

async function readJson<T>(filePath: string): Promise<T> {
  const cache = isVolumeArtifact(filePath) ? volumeCache : jsonCache

  const cached = cache.get(filePath)
  if (cached) {
    if (cache === volumeCache) {
      // Refresh recency (Map preserves insertion order, so re-insert).
      cache.delete(filePath)
      cache.set(filePath, cached)
    }
    return cached as Promise<T>
  }

  const promise = fs.readFile(filePath, 'utf8').then((text) => JSON.parse(text) as T)
  // Drop failed reads so a transient error is retried on the next request.
  promise.catch(() => {
    if (cache.get(filePath) === promise) cache.delete(filePath)
  })
  cache.set(filePath, promise)

  if (cache === volumeCache) {
    while (cache.size > MAX_VOLUME_CACHE_ENTRIES) {
      const oldest = cache.keys().next().value
      if (oldest === undefined) break
      cache.delete(oldest)
    }
  }

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

  const byKey = new Map<string, Hadith>()
  await Promise.all(
    Array.from(grouped, async ([bookId, ids]) => {
      const hadiths = await getLocalBookHadiths(bookId).catch(() => [] as Hadith[])
      for (const hadith of hadiths) {
        if (ids.has(hadith.id)) byKey.set(`${bookId}:${hadith.id}`, hadith)
      }
    }),
  )

  // Preserve the caller's hit order (relevance ranking) in the hydrated list.
  const hydrated: Hadith[] = []
  for (const hit of hits) {
    const hadith = byKey.get(`${hit.bookId}:${hit.id}`)
    if (hadith) hydrated.push(hadith)
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
  // normalizeArabic lowercases and folds letter variants (e.g. Persian yeh in
  // "ضعیف") so keyword matching is spelling-insensitive.
  return normalizeArabic(
    [
      hadith.majlisiGrading,
      hadith.mohseniGrading,
      hadith.behbudiGrading,
      ...(hadith.gradingsFull || []).map((grading) => `${grading.grade_en} ${grading.grade_ar}`),
    ].join(' '),
  )
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

/**
 * A capped query response. `total` is always the FULL match count; `results`
 * carries at most `limit` entries and `truncated` says whether a cap applied.
 */
export interface CappedQueryResponse extends QueryResponse {
  truncated: boolean
}

// A hard ceiling keeps a single broad query ("god", grading-only filters …)
// from serializing tens of MB of full hadith objects into one response.
export const DEFAULT_SEARCH_LIMIT = 200
export const MAX_SEARCH_LIMIT = 500

export function clampSearchLimit(raw: unknown): number {
  const parsed = Number(raw)
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_SEARCH_LIMIT
  return Math.min(Math.floor(parsed), MAX_SEARCH_LIMIT)
}

export async function filterLocalHadiths(
  bookIds?: string[],
  gradings: string[] = [],
  limit: number = DEFAULT_SEARCH_LIMIT,
): Promise<CappedQueryResponse> {
  const activeGradings = gradings.filter((grading) => grading && grading !== 'all')
  if ((!bookIds || bookIds.length === 0) && activeGradings.length === 0) {
    return { results: [], total: 0, truncated: false }
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
  const total = results.length
  return { results: results.slice(0, limit), total, truncated: total > limit }
}

/**
 * Relevance score for a matched search entry. Phrase occurrences dominate
 * (capped so very long texts don't crowd out focused ones), an early first
 * occurrence adds a small "the text is about this" bonus, and per-word
 * presence breaks ties for multi-word queries matched loosely.
 */
function scoreSearchEntry(
  entry: LocalSearchEntry,
  normQuery: string,
  queryWords: string[],
  arabic: boolean,
): number {
  // Scoring only needs a representative window — normalizing multi-KB texts
  // in full for thousands of matches dominates request time otherwise.
  const raw = (arabic ? entry.arabic : entry.english) || ''
  const text = arabic
    ? normalizeArabic(raw.slice(0, 4000))
    : normalizeEnglishForSearch(raw.slice(0, 4000))
  if (!text || !normQuery) return 0

  let score = 0

  let index = text.indexOf(normQuery)
  const firstIndex = index
  let occurrences = 0
  while (index !== -1 && occurrences < 5) {
    occurrences++
    index = text.indexOf(normQuery, index + normQuery.length)
  }
  score += occurrences * 10
  if (firstIndex !== -1 && firstIndex < 200) score += 3

  if (queryWords.length > 1) {
    for (const word of queryWords) {
      if (text.includes(word)) score += 1
    }
  }

  return score
}

export async function searchLocalHadiths(
  query: string,
  bookIds?: string[],
  modes?: SearchMode[],
  limit: number = DEFAULT_SEARCH_LIMIT,
): Promise<CappedQueryResponse> {
  const trimmed = query.trim()
  if (!trimmed) return { results: [], total: 0, truncated: false }

  const scope = bookIds && bookIds.length > 0 ? bookIds : await getAvailableBookIds()
  const activeModes = normalizeSearchModes(modes)
  const arabic = isArabicQuery(trimmed)
  const normQuery = arabic ? normalizeArabic(trimmed) : normalizeEnglishForSearch(trimmed)
  const queryWords = normQuery.split(' ').filter(Boolean)
  const hits: Array<{ bookId: string; id: number; score: number }> = []

  const shards = await Promise.all(
    scope.map((bookId) => getSearchShard(bookId).catch(() => [] as LocalSearchEntry[])),
  )

  for (const shard of shards) {
    for (const entry of shard) {
      const matched = activeModes.some((mode) =>
        matchesSearchMode({
          query: trimmed,
          mode,
          englishText: entry.english,
          arabicText: entry.arabic,
        }),
      )

      if (matched) {
        hits.push({
          bookId: entry.bookId,
          id: entry.id,
          score: scoreSearchEntry(entry, normQuery, queryWords, arabic),
        })
      }
    }
  }

  // Best matches first; ties keep the stable book/volume reading order.
  hits.sort((a, b) => b.score - a.score || a.bookId.localeCompare(b.bookId) || a.id - b.id)

  const total = hits.length
  const results = await hydrateSearchHits(hits.slice(0, limit))
  return { results, total, truncated: total > limit }
}
