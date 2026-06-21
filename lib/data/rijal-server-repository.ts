import fs from 'node:fs/promises'
import path from 'node:path'
import {
  normalizeArabic,
  type SearchMode,
  normalizeSearchModes,
  matchesSearchMode,
} from '@/lib/search-utils'
import type {
  NarratorEntry,
  NarratorIndexEntry,
  NarratorSearchEntry,
  NarratorSearchResponse,
  NarratorSearchResult,
  RijalManifest,
  RijalMetadata,
} from '@/lib/data/rijal-types'

const DATA_ROOT = path.join(process.cwd(), 'data', 'rijal', 'khoei')
const RELEASES_ROOT = path.join(DATA_ROOT, 'releases')
const ID_PATTERN = /^khoei-v(\d{1,2})-[a-z0-9\u0600-\u06ff-]+$/i

const jsonCache = new Map<string, Promise<unknown>>()

async function readJson<T>(filePath: string): Promise<T> {
  const cached = jsonCache.get(filePath)
  if (cached) return cached as Promise<T>

  const promise = fs.readFile(filePath, 'utf8').then((text) => JSON.parse(text) as T)
  jsonCache.set(filePath, promise)
  return promise
}

async function runtimePath(...segments: string[]) {
  const manifest = await getRijalManifest()
  return path.join(RELEASES_ROOT, manifest.version, 'runtime', ...segments)
}

export async function getRijalManifest(): Promise<RijalManifest> {
  const current = await readJson<{ version: string }>(path.join(DATA_ROOT, 'current.json'))
  return readJson<RijalManifest>(path.join(RELEASES_ROOT, current.version, 'manifest.json'))
}

export async function getRijalMetadata(): Promise<RijalMetadata> {
  return readJson<RijalMetadata>(await runtimePath('metadata.json'))
}

async function getNarratorIndex(): Promise<NarratorIndexEntry[]> {
  return readJson<NarratorIndexEntry[]>(await runtimePath('index.json'))
}

async function getNarratorSearchIndex(): Promise<NarratorSearchEntry[]> {
  return readJson<NarratorSearchEntry[]>(await runtimePath('search.json'))
}

interface SearchStructure {
  searchIndex: NarratorSearchEntry[]
  indexById: Map<string, NarratorIndexEntry>
}

// The id→index Map is rebuilt-free across requests: it is joined once per dataset
// version and reused, so each search is just the linear scan, not a fresh
// 15.6K-entry Map build every keystroke.
let searchStructureCache: { version: string; promise: Promise<SearchStructure> } | null = null

async function getSearchStructure(): Promise<SearchStructure> {
  const manifest = await getRijalManifest()
  if (searchStructureCache && searchStructureCache.version === manifest.version) {
    return searchStructureCache.promise
  }

  const promise = (async () => {
    const [index, searchIndex] = await Promise.all([getNarratorIndex(), getNarratorSearchIndex()])
    const indexById = new Map(index.map((entry) => [entry.id, entry]))
    return { searchIndex, indexById }
  })()
  promise.catch(() => {
    if (searchStructureCache?.promise === promise) searchStructureCache = null
  })
  searchStructureCache = { version: manifest.version, promise }
  return promise
}

// Detail shards are large (2–4 MB each; ~75 MB across all 24). Unlike the small
// search/index/metadata artifacts, they must not accumulate in the unbounded
// jsonCache — a busy server would otherwise hold every shard (~200 MB parsed)
// and risk being OOM-killed. Keep only the few most-recently-used shards.
const SHARD_CACHE_LIMIT = 4
const shardCache = new Map<string, Promise<Record<string, NarratorEntry>>>()

async function getNarratorShard(volumeNumber: number): Promise<Record<string, NarratorEntry>> {
  const filePath = await runtimePath(
    'narrators',
    `volume-${String(volumeNumber).padStart(2, '0')}.json`,
  )

  const existing = shardCache.get(filePath)
  if (existing) {
    // Refresh recency: re-insert so it moves to the end of the Map's order.
    shardCache.delete(filePath)
    shardCache.set(filePath, existing)
    return existing
  }

  const promise = fs
    .readFile(filePath, 'utf8')
    .then((text) => JSON.parse(text) as Record<string, NarratorEntry>)
  // Drop a rejected read so a later lookup can retry instead of caching a failure.
  promise.catch(() => {
    if (shardCache.get(filePath) === promise) shardCache.delete(filePath)
  })
  shardCache.set(filePath, promise)

  // Evict the least-recently-used shard (first key) once over the limit.
  if (shardCache.size > SHARD_CACHE_LIMIT) {
    const oldest = shardCache.keys().next().value
    if (oldest !== undefined) shardCache.delete(oldest)
  }

  return promise
}

export async function getNarrator(id: string): Promise<NarratorEntry | null> {
  const match = id.match(ID_PATTERN)
  if (!match) return null

  const volumeNumber = Number(match[1])
  if (!Number.isInteger(volumeNumber) || volumeNumber < 1 || volumeNumber > 24) return null

  try {
    const shard = await getNarratorShard(volumeNumber)
    return shard[id] ?? null
  } catch {
    return null
  }
}

export function rankNarratorSearchEntry(
  entry: NarratorSearchEntry,
  query: string,
  modes: SearchMode[] = ['exactPhrase'],
  // Callers iterating thousands of entries can pass the query normalized once to
  // avoid re-running normalizeArabic(query) on every entry.
  precomputedNormalizedQuery?: string,
): {
  score: number
  matchType: NarratorSearchResult['matchType']
  matchedAlias?: string
} | null {
  const normalizedQuery = precomputedNormalizedQuery ?? normalizeArabic(query)
  if (!normalizedQuery) return null

  const aliases = [entry.normalizedName, ...entry.normalizedAliases].filter(Boolean)
  for (const alias of aliases) {
    if (alias === normalizedQuery) {
      return { score: 0, matchType: 'exact', matchedAlias: alias }
    }
  }

  for (const alias of aliases) {
    if (alias.startsWith(normalizedQuery)) {
      return { score: 1, matchType: 'startsWith', matchedAlias: alias }
    }
  }

  for (const alias of aliases) {
    if (alias.includes(normalizedQuery)) {
      return { score: 2, matchType: 'contains', matchedAlias: alias }
    }
  }

  const activeModes = normalizeSearchModes(modes)
  const wordMatch = activeModes.some((mode) =>
    matchesSearchMode({
      query,
      mode,
      arabicText: entry.searchText,
    }),
  )
  if (wordMatch) return { score: 3, matchType: 'words' }

  return null
}

export async function searchNarrators({
  query,
  limit = 50,
  modes,
}: {
  query: string
  limit?: number
  modes?: SearchMode[]
}): Promise<NarratorSearchResponse> {
  const trimmed = query.trim()
  const metadata = await getRijalMetadata()
  if (!trimmed) {
    return {
      results: [],
      total: 0,
      metadata: pickSearchMetadata(metadata),
    }
  }

  const safeLimit = Math.max(1, Math.min(Number.isFinite(limit) ? limit : 50, 100))
  const { searchIndex, indexById } = await getSearchStructure()
  const normalizedQuery = normalizeArabic(trimmed)

  const hits: Array<NarratorSearchResult & { _score: number }> = []
  for (const searchEntry of searchIndex) {
    const rank = rankNarratorSearchEntry(searchEntry, trimmed, modes, normalizedQuery)
    if (!rank) continue

    const indexEntry = indexById.get(searchEntry.id)
    if (!indexEntry) continue
    hits.push({
      ...indexEntry,
      matchType: rank.matchType,
      matchedAlias: rank.matchedAlias,
      _score: rank.score,
    })
  }

  // Relevance decides which entries make the limited result set...
  hits.sort(
    (a, b) =>
      a._score - b._score ||
      a.volumeNumber - b.volumeNumber ||
      (a.entryNumber ?? 0) - (b.entryNumber ?? 0) ||
      a.primaryName.localeCompare(b.primaryName, 'ar'),
  )

  // ...but the list is presented to the user ordered by entry number, lowest to
  // highest. Entries without a number sort last; ids break the remaining ties so
  // ordering is stable (entryNumber is not unique across the work).
  const displayNumber = (hit: { entryNumber?: number; sourceEntryNumber?: number }): number =>
    hit.entryNumber ?? hit.sourceEntryNumber ?? Number.POSITIVE_INFINITY

  const results: NarratorSearchResult[] = hits
    .slice(0, safeLimit)
    .sort(
      (a, b) =>
        displayNumber(a) - displayNumber(b) ||
        a.volumeNumber - b.volumeNumber ||
        a.id.localeCompare(b.id),
    )
    .map((hit) => ({
      id: hit.id,
      entryNumber: hit.entryNumber,
      sourceEntryNumber: hit.sourceEntryNumber,
      primaryName: hit.primaryName,
      normalizedName: hit.normalizedName,
      aliases: hit.aliases,
      volumeNumber: hit.volumeNumber,
      startPage: hit.startPage,
      endPage: hit.endPage,
      sourceBookId: hit.sourceBookId,
      matchType: hit.matchType,
      matchedAlias: hit.matchedAlias,
    }))

  return {
    results,
    total: hits.length,
    metadata: pickSearchMetadata(metadata),
  }
}

function pickSearchMetadata(metadata: RijalMetadata): NarratorSearchResponse['metadata'] {
  return {
    title: metadata.title,
    author: metadata.author,
    version: metadata.version,
    counts: metadata.counts,
  }
}
