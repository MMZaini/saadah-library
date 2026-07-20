export interface RijalManifest {
  schemaVersion: number
  version: string
  generatedAt: string
  source: {
    kind: string
    primaryUrl: string
    grpcHost: string
    title: string
    author: string
    notes?: string[]
  }
  generation?: {
    discoveredVolumes: number
    expectedPages: number
    fetchedPages: number
    unavailablePages: number
    omittedPages: number
    parser: {
      entries: number
      boundaryErrors: number
      classifiedPages: number
    }
  }
  counts: {
    volumes: number
    pages: number
    narrators: number
    narratorShards: number
    searchEntries: number
  }
  artifactHash: string
  checksums: {
    runtime: Record<string, string>
  }
}

export interface NarratorSourceVolume {
  volumeNumber: number
  rawVolumeNumber?: number
  bookId: string
  title: string
  pageCount: number
}

export interface RijalMetadata {
  schemaVersion: number
  title: string
  author: string
  version: string
  generatedAt: string
  counts: {
    narrators: number
    volumes: number
    pages: number
  }
  source: {
    primary: string
    grpcHost: string
    volumes: NarratorSourceVolume[]
  }
}

export interface NarratorSourceRef {
  pageId: string
  pageNumber: number
  pageLabel?: string
  contentId?: string
}

export interface NarratorTextBlock {
  kind: string
  text: string
  pageNumber: number
  pageLabel?: string
  contentId?: string
}

export interface NarratorEntry {
  id: string
  entryNumber?: number
  sourceEntryNumber?: number
  primaryName: string
  transliteratedName: string
  normalizedName: string
  aliases: string[]
  volumeNumber: number
  startPage: number
  endPage: number
  textBlocks: NarratorTextBlock[]
  plainText: string
  sourceRefs: NarratorSourceRef[]
  source: {
    title: string
    author: string
    sourceBookId: string
    sourceBookTitle: string
  }
}

export interface NarratorIndexEntry {
  id: string
  entryNumber?: number
  sourceEntryNumber?: number
  primaryName: string
  transliteratedName: string
  normalizedName: string
  aliases: string[]
  volumeNumber: number
  startPage: number
  endPage: number
  sourceBookId: string
}

export type NarratorIdentitySource = 'crossReference' | 'najashi' | 'tusi'

export interface NarratorIdentityProfile {
  text: string
  normalizedText: string
  source: NarratorIdentitySource
}

export type NarratorIdentityFactKind = 'kunya' | 'nisba' | 'knownAs' | 'laqab' | 'descriptor'
export type NarratorIdentityFactSource = 'openingFragment' | 'subjectStatement'

export interface NarratorIdentityFact {
  text: string
  normalizedText: string
  kind: NarratorIdentityFactKind
  source: NarratorIdentityFactSource
}

export interface NarratorSearchEntry {
  id: string
  normalizedName: string
  normalizedAliases: string[]
  searchText: string
  identityProfiles?: NarratorIdentityProfile[]
  identityFacts?: NarratorIdentityFact[]
  // Derived in memory for order-independent identity-profile matching.
  identityProfileTokens?: string[][]
  // Derived in memory for subject-fact composition; not duplicated in search.json.
  identityFactTokens?: string[][]
  // Derived in memory; not duplicated in search.json.
  compactArabicNames?: string[]
  compactArabicNameBoundaries?: number[][]
  entryNumber?: number
  sourceEntryNumber?: number
  volumeNumber: number
  startPage: number
  // Enriched in memory from transliterations.json; not duplicated in search.json.
  transliteratedName?: string
  transliteratedAliases?: string[]
  normalizedTransliterations?: string[]
  phoneticTransliterations?: string[]
  transliterationSkeletons?: string[]
}

export interface NarratorTransliteration {
  primary: string
  aliases: string[]
}

export type NarratorTransliterationIndex = Record<string, NarratorTransliteration>

export interface NarratorSearchResult extends NarratorIndexEntry {
  matchType: 'exact' | 'startsWith' | 'contains' | 'words'
  matchedAlias?: string
  matchedIdentity?: string
  matchedDetails?: string[]
}

export interface NarratorSearchResponse {
  results: NarratorSearchResult[]
  total: number
  metadata: Pick<RijalMetadata, 'title' | 'author' | 'version' | 'counts'>
}
