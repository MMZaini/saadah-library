import fs from 'node:fs/promises'
import path from 'node:path'
import {
  compactArabicNarratorName,
  containsArabic,
  normalizeArabicNarratorName,
  normalizeEnglishForSearch,
  type SearchMode,
  normalizeSearchModes,
  matchesSearchMode,
} from '@/lib/search-utils'
import {
  narratorTransliterationSkeleton,
  normalizeNarratorTransliteration,
} from '@/lib/data/rijal-transliteration'
import type {
  NarratorEntry,
  NarratorIndexEntry,
  NarratorSearchEntry,
  NarratorSearchResponse,
  NarratorSearchResult,
  NarratorTransliterationIndex,
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

async function getNarratorTransliterations(): Promise<NarratorTransliterationIndex> {
  return readJson<NarratorTransliterationIndex>(await runtimePath('transliterations.json'))
}

interface SearchStructure {
  searchIndex: NarratorSearchEntry[]
  indexById: Map<string, NarratorIndexEntry>
}

function compactNameTokenBoundaries(name: string): number[] {
  const boundaries = [0]
  let length = 0
  for (const word of normalizeArabicNarratorName(name).split(/\s+/).filter(Boolean)) {
    length += Array.from(word).length
    boundaries.push(length)
  }
  return boundaries
}

function compactNameMatchKind(
  name: string,
  boundaries: readonly number[],
  query: string,
): 'exact' | 'startsWith' | 'contains' | null {
  if (name === query) return 'exact'

  let start = name.indexOf(query)
  while (start !== -1) {
    const end = start + query.length
    // Only remove boundaries between complete tokens. This accepts ما هويه as
    // ماهويه, but rejects a synthetic word spanning part of بن and part of
    // ادريس (e.g. نادر from بن ادريس).
    if (boundaries.includes(start) && boundaries.includes(end)) {
      return start === 0 ? 'startsWith' : 'contains'
    }
    start = name.indexOf(query, start + 1)
  }
  return null
}

const IDENTITY_RELATION_TOKENS = new Set(['بن', 'ابو', 'ام'])

function identitySearchTokens(value: string): string[] {
  return normalizeArabicNarratorName(value)
    .split(/\s+/)
    .filter(Boolean)
    .map((token) => {
      if (token === 'ابن') return 'بن'
      if (token === 'ابي' || token === 'ابا') return 'ابو'
      return token
    })
}

function longestOrderedTokenRun(query: readonly string[], candidate: readonly string[]): number {
  let longest = 0
  for (let queryStart = 0; queryStart < query.length; queryStart++) {
    for (let candidateStart = 0; candidateStart < candidate.length; candidateStart++) {
      let length = 0
      while (
        queryStart + length < query.length &&
        candidateStart + length < candidate.length &&
        query[queryStart + length] === candidate[candidateStart + length]
      ) {
        length++
      }
      longest = Math.max(longest, length)
    }
  }
  return longest
}

function findTokenSequence(haystack: readonly string[], needle: readonly string[]): number {
  if (needle.length === 0 || needle.length > haystack.length) return -1
  for (let start = 0; start <= haystack.length - needle.length; start++) {
    if (needle.every((token, offset) => haystack[start + offset] === token)) return start
  }
  return -1
}

function splitLineage(tokens: readonly string[]): string[] | null {
  if (!tokens.includes('بن')) return null
  const segments: string[][] = [[]]
  for (const token of tokens) {
    if (token === 'بن') {
      if (segments.at(-1)?.length === 0) return null
      segments.push([])
    } else {
      // Kunyahs and unrelated relation words are facts, not lineage segments.
      if (token === 'ابو' || token === 'ام') return null
      segments.at(-1)?.push(token)
    }
  }
  if (segments.at(-1)?.length === 0) return null
  return segments.map((segment) => compactArabicNarratorName(segment.join(' ')))
}

function countLineageSkips(query: readonly string[], candidate: readonly string[]): number | null {
  if (
    query.length < 2 ||
    candidate.length < query.length ||
    query[0] !== candidate[0] ||
    query.at(-1) !== candidate.at(-1)
  ) {
    return null
  }

  let queryIndex = 1
  for (let candidateIndex = 1; candidateIndex < candidate.length - 1; candidateIndex++) {
    if (queryIndex < query.length - 1 && query[queryIndex] === candidate[candidateIndex]) {
      queryIndex++
    }
  }
  if (queryIndex !== query.length - 1) return null
  const skips = candidate.length - query.length
  // A short two-segment lineage is safe when it is reproduced exactly and a
  // trusted subject fact makes the query specific. Once an ancestor is
  // omitted, retain the stricter minimum of three visible lineage segments.
  if (skips > 0 && query.length < 3) return null
  return skips
}

function matchComposedIdentity(
  entry: NarratorSearchEntry,
  queryTokens: readonly string[],
  aliases: readonly string[],
): { score: number; matchedDetails: string[] } | null {
  const facts = entry.identityFacts ?? []
  if (facts.length === 0) return null
  const factTokens =
    entry.identityFactTokens ?? facts.map((fact) => identitySearchTokens(fact.normalizedText))

  // Consume complete, non-overlapping fact phrases from the query. Longest
  // phrases win, preventing a one-word nisba from partially consuming a kunya
  // or descriptor that happens to contain it.
  const occupied = new Set<number>()
  const matches: Array<{ factIndex: number; start: number; length: number }> = []
  const orderedFactIndexes = factTokens
    .map((tokens, index) => ({ index, length: tokens.length }))
    .filter(({ length }) => length > 0)
    .sort((a, b) => b.length - a.length || a.index - b.index)

  for (const { index: factIndex } of orderedFactIndexes) {
    const tokens = factTokens[factIndex]
    let searchFrom = 0
    while (searchFrom <= queryTokens.length - tokens.length) {
      const relative = findTokenSequence(queryTokens.slice(searchFrom), tokens)
      if (relative === -1) break
      const start = searchFrom + relative
      const positions = tokens.map((_, offset) => start + offset)
      if (positions.every((position) => !occupied.has(position))) {
        positions.forEach((position) => occupied.add(position))
        matches.push({ factIndex, start, length: tokens.length })
        break
      }
      searchFrom = start + 1
    }
  }
  if (matches.length === 0) return null

  const remainingTokens = queryTokens.filter((_, index) => !occupied.has(index))
  const queryLineage = splitLineage(remainingTokens)
  if (!queryLineage) return null

  let bestSkips: number | null = null
  for (const alias of aliases) {
    const candidateLineage = splitLineage(identitySearchTokens(alias))
    if (!candidateLineage) continue
    const skips = countLineageSkips(queryLineage, candidateLineage)
    if (skips == null || skips > 2) continue
    if (bestSkips == null || skips < bestSkips) bestSkips = skips
  }
  if (bestSkips == null) return null

  matches.sort((a, b) => a.start - b.start)
  const matchedDetails = matches.map(({ factIndex }) => facts[factIndex].text)
  // A composed match is deliberately below a verbatim identity profile but
  // above generic word matching. Skipped ancestors receive a small penalty.
  return { score: 2.7 + bestSkips * 0.1, matchedDetails }
}

// id → lightweight index entry, joined once per dataset version and reused. Both
// the search join and the single-narrator summary lookup share this map, so a
// summary never builds a fresh 15.6K-entry Map and never touches search.json.
let indexMapCache: {
  version: string
  promise: Promise<Map<string, NarratorIndexEntry>>
} | null = null

async function getNarratorIndexMap(): Promise<Map<string, NarratorIndexEntry>> {
  const manifest = await getRijalManifest()
  if (indexMapCache && indexMapCache.version === manifest.version) {
    return indexMapCache.promise
  }

  const promise = Promise.all([getNarratorIndex(), getNarratorTransliterations()]).then(
    ([index, transliterations]) =>
      new Map(
        index.map((entry) => [
          entry.id,
          {
            ...entry,
            transliteratedName: transliterations[entry.id]?.primary ?? entry.primaryName,
          },
        ]),
      ),
  )
  promise.catch(() => {
    if (indexMapCache?.promise === promise) indexMapCache = null
  })
  indexMapCache = { version: manifest.version, promise }
  return promise
}

// Lightweight lookup for callers that only need volume + page range + name (e.g.
// the PDF viewer). Reads the small shared index map instead of the 2–4 MB
// per-volume detail shard that getNarrator() loads, and returns a ~1KB record
// rather than the full (up to ~300KB) entry with all text blocks.
export async function getNarratorSummary(id: string): Promise<NarratorIndexEntry | null> {
  if (!ID_PATTERN.test(id)) return null
  try {
    const map = await getNarratorIndexMap()
    return map.get(id) ?? null
  } catch {
    return null
  }
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
    const [rawSearchIndex, indexById, transliterations] = await Promise.all([
      getNarratorSearchIndex(),
      getNarratorIndexMap(),
      getNarratorTransliterations(),
    ])
    const searchIndex = rawSearchIndex.map((entry) => {
      const transliteration = transliterations[entry.id]
      const names = [transliteration?.primary, ...(transliteration?.aliases ?? [])].filter(
        (name): name is string => Boolean(name),
      )
      const normalizedName = normalizeArabicNarratorName(entry.normalizedName)
      const normalizedAliases = entry.normalizedAliases.map(normalizeArabicNarratorName)
      const identityProfiles = (entry.identityProfiles ?? []).map((profile) => ({
        ...profile,
        normalizedText: normalizeArabicNarratorName(profile.normalizedText || profile.text),
      }))
      const identityFacts = (entry.identityFacts ?? []).map((fact) => ({
        ...fact,
        normalizedText: normalizeArabicNarratorName(fact.normalizedText || fact.text),
      }))
      return {
        ...entry,
        // Canonicalize artifacts again at the read boundary so loaded names and
        // live queries always pass through the same narrator-specific contract.
        normalizedName,
        normalizedAliases,
        searchText: normalizeArabicNarratorName(entry.searchText),
        identityProfiles,
        identityFacts,
        identityProfileTokens: identityProfiles.map((profile) =>
          identitySearchTokens(profile.normalizedText),
        ),
        identityFactTokens: identityFacts.map((fact) => identitySearchTokens(fact.normalizedText)),
        compactArabicNames: [normalizedName, ...normalizedAliases].map(compactArabicNarratorName),
        compactArabicNameBoundaries: [normalizedName, ...normalizedAliases].map(
          compactNameTokenBoundaries,
        ),
        transliteratedName: transliteration?.primary,
        transliteratedAliases: transliteration?.aliases,
        normalizedTransliterations: names.map(normalizeEnglishForSearch),
        phoneticTransliterations: names.map(normalizeNarratorTransliteration),
        transliterationSkeletons: names.map(narratorTransliterationSkeleton),
      }
    })
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
    const [shard, summary] = await Promise.all([
      getNarratorShard(volumeNumber),
      getNarratorSummary(id),
    ])
    const narrator = shard[id]
    if (!narrator || !summary) return null
    return { ...narrator, transliteratedName: summary.transliteratedName }
  } catch {
    return null
  }
}

export function rankNarratorSearchEntry(
  entry: NarratorSearchEntry,
  query: string,
  modes: SearchMode[] = ['exactPhrase'],
  // Callers iterating thousands of entries can pass the query normalized once.
  precomputedNormalizedQuery?: string,
): {
  score: number
  matchType: NarratorSearchResult['matchType']
  matchedAlias?: string
  matchedIdentity?: string
  matchedDetails?: string[]
} | null {
  if (!containsArabic(query)) {
    const normalizedQuery = precomputedNormalizedQuery ?? normalizeEnglishForSearch(query)
    if (!normalizedQuery) return null
    const names = [entry.transliteratedName, ...(entry.transliteratedAliases ?? [])].filter(
      (name): name is string => Boolean(name),
    )
    const normalizedNames = entry.normalizedTransliterations ?? names.map(normalizeEnglishForSearch)

    const exactIndex = normalizedNames.findIndex((name) => name === normalizedQuery)
    if (exactIndex !== -1) {
      return { score: 0, matchType: 'exact', matchedAlias: names[exactIndex] }
    }
    const startsIndex = normalizedNames.findIndex((name) => name.startsWith(normalizedQuery))
    if (startsIndex !== -1) {
      return { score: 1, matchType: 'startsWith', matchedAlias: names[startsIndex] }
    }
    const containsIndex = normalizedNames.findIndex((name) => name.includes(normalizedQuery))
    if (containsIndex !== -1) {
      return { score: 2, matchType: 'contains', matchedAlias: names[containsIndex] }
    }

    const phoneticQuery = normalizeNarratorTransliteration(normalizedQuery)
    const phoneticNames =
      entry.phoneticTransliterations ?? names.map(normalizeNarratorTransliteration)
    const phoneticExact = phoneticNames.findIndex((name) => name === phoneticQuery)
    if (phoneticExact !== -1) {
      return { score: 0, matchType: 'exact', matchedAlias: names[phoneticExact] }
    }
    const phoneticStarts = phoneticNames.findIndex((name) => name.startsWith(phoneticQuery))
    if (phoneticStarts !== -1) {
      return { score: 1, matchType: 'startsWith', matchedAlias: names[phoneticStarts] }
    }
    const queryWords = phoneticQuery.split(' ').filter(Boolean)
    const phoneticWordMatch = phoneticNames.some((name) => {
      const words = name.split(' ').filter(Boolean)
      return queryWords.length > 0 && queryWords.every((queryWord) => words.includes(queryWord))
    })
    if (phoneticWordMatch) return { score: 3, matchType: 'words' }

    // Generated fallback spellings preserve every Arabic consonant even when
    // the source has no short vowels. Match a sufficiently specific consonant
    // skeleton so a user's vocalized spelling can still find those rare names.
    const skeletonQuery = narratorTransliterationSkeleton(normalizedQuery)
    const skeletonWords = skeletonQuery.split(' ').filter((word) => word.length >= 3)
    const skeletonNames =
      entry.transliterationSkeletons ?? names.map(narratorTransliterationSkeleton)
    const skeletonMatch = skeletonNames.some((name) => {
      const words = name.split(' ').filter(Boolean)
      return skeletonWords.length > 0 && skeletonWords.every((word) => words.includes(word))
    })
    return skeletonMatch ? { score: 3, matchType: 'words' } : null
  }

  const normalizedQuery = precomputedNormalizedQuery ?? normalizeArabicNarratorName(query)
  if (!normalizedQuery) return null

  const aliases = [entry.normalizedName, ...entry.normalizedAliases].filter(Boolean)
  for (const alias of aliases) {
    if (alias === normalizedQuery) {
      return { score: 0, matchType: 'exact', matchedAlias: alias }
    }
  }

  const identityProfiles = entry.identityProfiles ?? []
  for (const profile of identityProfiles) {
    if (profile.normalizedText === normalizedQuery) {
      return { score: 0.25, matchType: 'exact', matchedIdentity: profile.text }
    }
  }

  // Arabic compounds are inconsistently split in names and in common usage
  // (e.g. ماهويه/ما هويه, عبدالله/عبد الله). Compare a secondary letters-only
  // key for sufficiently specific queries; the minimum prevents short fragments
  // from gaining accidental cross-word matches such as د بن -> دبن.
  const compactQuery = compactArabicNarratorName(normalizedQuery)
  const compactAliases = entry.compactArabicNames ?? aliases.map(compactArabicNarratorName)
  const compactBoundaries =
    entry.compactArabicNameBoundaries ?? aliases.map(compactNameTokenBoundaries)
  const allowCompactMatch = compactQuery.length >= 4
  const compactMatchKinds = allowCompactMatch
    ? compactAliases.map((alias, index) =>
        compactNameMatchKind(alias, compactBoundaries[index], compactQuery),
      )
    : []
  if (allowCompactMatch) {
    const exactIndex = compactMatchKinds.findIndex((kind) => kind === 'exact')
    if (exactIndex !== -1) {
      return { score: 0, matchType: 'exact', matchedAlias: aliases[exactIndex] }
    }
  }

  for (const alias of aliases) {
    if (alias.startsWith(normalizedQuery)) {
      return { score: 1, matchType: 'startsWith', matchedAlias: alias }
    }
  }
  for (const profile of identityProfiles) {
    if (profile.normalizedText.startsWith(normalizedQuery)) {
      return { score: 1.25, matchType: 'startsWith', matchedIdentity: profile.text }
    }
  }
  if (allowCompactMatch) {
    const startsIndex = compactMatchKinds.findIndex((kind) => kind === 'startsWith')
    if (startsIndex !== -1) {
      return { score: 1, matchType: 'startsWith', matchedAlias: aliases[startsIndex] }
    }
  }

  for (const alias of aliases) {
    if (alias.includes(normalizedQuery)) {
      return { score: 2, matchType: 'contains', matchedAlias: alias }
    }
  }
  for (const profile of identityProfiles) {
    if (profile.normalizedText.includes(normalizedQuery)) {
      return { score: 2.25, matchType: 'contains', matchedIdentity: profile.text }
    }
  }
  if (allowCompactMatch) {
    const containsIndex = compactMatchKinds.findIndex((kind) => kind === 'contains')
    if (containsIndex !== -1) {
      return { score: 2, matchType: 'contains', matchedAlias: aliases[containsIndex] }
    }
  }

  // Full narrator identities are commonly written in a different order: a
  // user may put the kunya first even when the source puts it after the given
  // name. Require every query token to occur in one trusted identity profile,
  // and only enable this for specific queries with at least three substantive
  // tokens. Profiles never share tokens with each other or with biography prose.
  const queryIdentityTokens = identitySearchTokens(normalizedQuery)
  const informativeQueryTokens = new Set(
    queryIdentityTokens.filter((token) => !IDENTITY_RELATION_TOKENS.has(token)),
  )
  if (informativeQueryTokens.size >= 3) {
    const profileTokens =
      entry.identityProfileTokens ??
      identityProfiles.map((profile) => identitySearchTokens(profile.normalizedText))
    let bestIdentityMatch:
      | { score: number; matchType: NarratorSearchResult['matchType']; matchedIdentity: string }
      | undefined

    for (let index = 0; index < identityProfiles.length; index++) {
      const tokens = profileTokens[index]
      const tokenSet = new Set(tokens)
      if (!queryIdentityTokens.every((token) => tokenSet.has(token))) continue

      const informativeProfileTokens = new Set(
        tokens.filter((token) => !IDENTITY_RELATION_TOKENS.has(token)),
      )
      const extraTokens = Math.max(0, informativeProfileTokens.size - informativeQueryTokens.size)
      const orderedRun = longestOrderedTokenRun(queryIdentityTokens, tokens)
      const sourcePenalty = identityProfiles[index].source === 'tusi' ? 0.01 : 0
      const score = 2.5 + Math.max(0, 4 - orderedRun) * 0.05 + extraTokens * 0.005 + sourcePenalty
      if (!bestIdentityMatch || score < bestIdentityMatch.score) {
        bestIdentityMatch = {
          score,
          matchType: 'words',
          matchedIdentity: identityProfiles[index].text,
        }
      }
    }

    if (bestIdentityMatch) return bestIdentityMatch
  }

  const composedIdentityMatch = matchComposedIdentity(entry, queryIdentityTokens, aliases)
  if (composedIdentityMatch) {
    return {
      score: composedIdentityMatch.score,
      matchType: 'words',
      matchedDetails: composedIdentityMatch.matchedDetails,
    }
  }

  const activeModes = normalizeSearchModes(modes)
  const wordMatch = activeModes.some((mode) =>
    matchesSearchMode({
      query: normalizedQuery,
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
  const normalizedQuery = containsArabic(trimmed)
    ? normalizeArabicNarratorName(trimmed)
    : normalizeEnglishForSearch(trimmed)

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
      matchedIdentity: rank.matchedIdentity,
      matchedDetails: rank.matchedDetails,
      _score: rank.score,
    })
  }

  // Display order is relevance first, then the visible narrator entry number.
  // Keep this ordering before applying the limit so a low-numbered weak match
  // can never displace a higher-numbered exact/prefix match.
  const displayNumber = (hit: { entryNumber?: number; sourceEntryNumber?: number }): number =>
    hit.entryNumber ?? hit.sourceEntryNumber ?? Number.POSITIVE_INFINITY

  hits.sort(
    (a, b) =>
      a._score - b._score ||
      displayNumber(a) - displayNumber(b) ||
      a.volumeNumber - b.volumeNumber ||
      a.id.localeCompare(b.id),
  )

  const results: NarratorSearchResult[] = hits.slice(0, safeLimit).map((hit) => ({
    id: hit.id,
    entryNumber: hit.entryNumber,
    sourceEntryNumber: hit.sourceEntryNumber,
    primaryName: hit.primaryName,
    transliteratedName: hit.transliteratedName,
    normalizedName: hit.normalizedName,
    aliases: hit.aliases,
    volumeNumber: hit.volumeNumber,
    startPage: hit.startPage,
    endPage: hit.endPage,
    sourceBookId: hit.sourceBookId,
    matchType: hit.matchType,
    matchedAlias: hit.matchedAlias,
    matchedIdentity: hit.matchedIdentity,
    matchedDetails: hit.matchedDetails,
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
