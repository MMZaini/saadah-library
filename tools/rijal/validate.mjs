#!/usr/bin/env node
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  EXPECTED_VOLUME_COUNT,
  RIJAL_CURRENT_POINTER,
  RIJAL_RELEASES_ROOT,
  fileChecksums,
  listFiles,
  normalizeArabic,
  pathExists,
  readJson,
} from './shared.mjs'

function getArg(name, fallback = null) {
  const idx = process.argv.indexOf(name)
  if (idx === -1) return fallback
  return process.argv[idx + 1] ?? fallback
}

function addIssue(issues, severity, message, context = {}) {
  issues.push({ severity, message, context })
}

async function resolveReleaseDir() {
  const explicit = getArg('--release')
  if (explicit) return path.resolve(explicit)

  const version = getArg('--version')
  if (version) return path.join(RIJAL_RELEASES_ROOT, version)

  const pointer = await readJson(RIJAL_CURRENT_POINTER)
  return path.join(RIJAL_RELEASES_ROOT, pointer.version)
}

export async function validateKhoeiRelease(releaseDir) {
  const issues = []
  const manifestPath = path.join(releaseDir, 'manifest.json')
  if (!(await pathExists(manifestPath))) {
    addIssue(issues, 'error', 'manifest.json is missing', { releaseDir })
    return issues
  }

  const manifest = await readJson(manifestPath)
  const runtimeDir = path.join(releaseDir, 'runtime')

  const metadataPath = path.join(runtimeDir, 'metadata.json')
  const indexPath = path.join(runtimeDir, 'index.json')
  const searchPath = path.join(runtimeDir, 'search.json')
  const transliterationsPath = path.join(runtimeDir, 'transliterations.json')
  const transliterationTokensPath = path.join(runtimeDir, 'transliteration-tokens.json')
  const narratorsDir = path.join(runtimeDir, 'narrators')

  for (const required of [
    metadataPath,
    indexPath,
    searchPath,
    transliterationsPath,
    transliterationTokensPath,
  ]) {
    if (!(await pathExists(required))) {
      addIssue(issues, 'error', 'runtime artifact is missing', { path: required })
    }
  }
  if (issues.some((issue) => issue.severity === 'error')) return issues

  const metadata = await readJson(metadataPath)
  const index = await readJson(indexPath)
  const search = await readJson(searchPath)
  const transliterations = await readJson(transliterationsPath)
  const transliterationTokens = await readJson(transliterationTokensPath)
  const narratorShardFiles = await listFiles(narratorsDir, (file) => file.endsWith('.json'))

  if (metadata.counts?.volumes !== EXPECTED_VOLUME_COUNT) {
    addIssue(issues, 'error', 'metadata must list exactly 24 volumes', {
      actual: metadata.counts?.volumes,
    })
  }
  if ((metadata.source?.volumes ?? []).length !== EXPECTED_VOLUME_COUNT) {
    addIssue(issues, 'error', 'source volume metadata must list exactly 24 volumes', {
      actual: metadata.source?.volumes?.length,
    })
  }
  if (!Array.isArray(index) || index.length === 0) {
    addIssue(issues, 'error', 'index.json must contain narrator records')
  }
  if (index.length !== search.length) {
    addIssue(issues, 'error', 'search index count must equal narrator index count', {
      index: index.length,
      search: search.length,
    })
  }
  if (Object.keys(transliterations).length !== index.length) {
    addIssue(issues, 'error', 'transliteration count must equal narrator index count', {
      index: index.length,
      transliterations: Object.keys(transliterations).length,
    })
  }
  if (Object.keys(transliterationTokens).length === 0) {
    addIssue(issues, 'error', 'transliteration token lexicon must not be empty')
  }
  if (narratorShardFiles.length !== EXPECTED_VOLUME_COUNT) {
    addIssue(issues, 'error', 'narrator shards must be one JSON file per volume', {
      files: narratorShardFiles.length,
      expected: EXPECTED_VOLUME_COUNT,
    })
  }

  const ids = new Set()
  const entryRefs = new Set()
  for (const item of index) {
    if (!item.id || !item.primaryName || !item.normalizedName) {
      addIssue(issues, 'error', 'index entry is missing required name/id fields', item)
    }
    if (ids.has(item.id)) addIssue(issues, 'error', 'duplicate narrator id', { id: item.id })
    ids.add(item.id)

    const transliteration = transliterations[item.id]
    if (!transliteration?.primary || !Array.isArray(transliteration.aliases)) {
      addIssue(issues, 'error', 'index entry is missing its transliteration', { id: item.id })
    }

    if (item.entryNumber != null) {
      const key = `${item.volumeNumber}:${item.entryNumber}`
      if (entryRefs.has(key)) {
        addIssue(issues, 'error', 'duplicate entry number within volume', {
          volumeNumber: item.volumeNumber,
          entryNumber: item.entryNumber,
        })
      }
      entryRefs.add(key)
    }

    if (!Number.isInteger(item.volumeNumber) || item.volumeNumber < 1 || item.volumeNumber > 24) {
      addIssue(issues, 'error', 'index entry has invalid volume number', item)
    }
    if (!Number.isInteger(item.startPage) || !Number.isInteger(item.endPage)) {
      addIssue(issues, 'error', 'index entry has invalid page refs', item)
    }
    if (item.endPage < item.startPage) {
      addIssue(issues, 'error', 'index entry ends before it starts', item)
    }
  }

  const searchIds = new Set()
  let identityProfileCount = 0
  let identityFactCount = 0
  const identitySources = new Set(['crossReference', 'najashi', 'tusi'])
  const identityFactKinds = new Set(['kunya', 'nisba', 'knownAs', 'laqab', 'descriptor'])
  const identityFactSources = new Set(['openingFragment', 'subjectStatement'])
  const identityProseTokens = new Set([
    'قال',
    'اخبرنا',
    'اخبرني',
    'روي',
    'ثقه',
    'ضعيف',
    'كان',
    'حدثنا',
    'حدثني',
    'سمعت',
  ])
  for (const item of search) {
    if (!item.id || !ids.has(item.id)) {
      addIssue(issues, 'error', 'search entry references unknown narrator id', item)
    }
    if (searchIds.has(item.id)) addIssue(issues, 'error', 'duplicate search id', { id: item.id })
    searchIds.add(item.id)
    if (!item.searchText || !Array.isArray(item.normalizedAliases)) {
      addIssue(issues, 'error', 'search entry is missing normalized text', item)
    }
    if (!Array.isArray(item.identityProfiles)) {
      addIssue(issues, 'error', 'search entry is missing identity profiles', { id: item.id })
      continue
    }
    const normalizedProfiles = new Set()
    for (const profile of item.identityProfiles) {
      identityProfileCount++
      if (
        !profile?.text ||
        !profile.normalizedText ||
        !identitySources.has(profile.source) ||
        profile.text.length > 180
      ) {
        addIssue(issues, 'error', 'search identity profile is invalid', {
          id: item.id,
          profile,
        })
        continue
      }
      if (normalizeArabic(profile.text) !== profile.normalizedText) {
        addIssue(issues, 'error', 'search identity profile normalization is stale', {
          id: item.id,
          profile,
        })
      }
      if (profile.normalizedText.split(/\s+/u).some((token) => identityProseTokens.has(token))) {
        addIssue(issues, 'error', 'search identity profile contains biography prose', {
          id: item.id,
          profile,
        })
      }
      if (normalizedProfiles.has(profile.normalizedText)) {
        addIssue(issues, 'error', 'search identity profile is duplicated', {
          id: item.id,
          normalizedText: profile.normalizedText,
        })
      }
      normalizedProfiles.add(profile.normalizedText)
    }
    if (!Array.isArray(item.identityFacts)) {
      addIssue(issues, 'error', 'search entry is missing subject identity facts', { id: item.id })
      continue
    }
    const normalizedFacts = new Set()
    for (const fact of item.identityFacts) {
      identityFactCount++
      const factKey = `${fact?.kind}:${fact?.normalizedText}`
      if (
        !fact?.text ||
        !fact.normalizedText ||
        !identityFactKinds.has(fact.kind) ||
        !identityFactSources.has(fact.source) ||
        fact.text.length > 72
      ) {
        addIssue(issues, 'error', 'search subject identity fact is invalid', {
          id: item.id,
          fact,
        })
        continue
      }
      if (normalizeArabic(fact.text) !== fact.normalizedText) {
        addIssue(issues, 'error', 'search subject identity fact normalization is stale', {
          id: item.id,
          fact,
        })
      }
      if (fact.normalizedText.split(/\s+/u).some((token) => identityProseTokens.has(token))) {
        addIssue(issues, 'error', 'search subject identity fact contains biography prose', {
          id: item.id,
          fact,
        })
      }
      if (normalizedFacts.has(factKey)) {
        addIssue(issues, 'error', 'search subject identity fact is duplicated', {
          id: item.id,
          factKey,
        })
      }
      normalizedFacts.add(factKey)
    }
  }
  if (manifest.schemaVersion >= 2 && identityProfileCount === 0) {
    addIssue(issues, 'error', 'schema v2 search index has no structured identity profiles')
  }
  if (manifest.schemaVersion >= 3 && identityFactCount === 0) {
    addIssue(issues, 'error', 'schema v3 search index has no subject identity facts')
  }

  const narratorIdsFromShards = new Set()
  for (let volumeNumber = 1; volumeNumber <= EXPECTED_VOLUME_COUNT; volumeNumber++) {
    const shardPath = path.join(
      narratorsDir,
      `volume-${String(volumeNumber).padStart(2, '0')}.json`,
    )
    if (!(await pathExists(shardPath))) {
      addIssue(issues, 'error', 'narrator shard is missing for volume', { volumeNumber })
      continue
    }

    const shard = await readJson(shardPath)
    if (!shard || Array.isArray(shard) || typeof shard !== 'object') {
      addIssue(issues, 'error', 'narrator shard must be an id-keyed object', { volumeNumber })
      continue
    }

    for (const [id, narrator] of Object.entries(shard)) {
      if (id !== narrator.id) {
        addIssue(issues, 'error', 'narrator shard key does not match id', {
          volumeNumber,
          key: id,
          id: narrator.id,
        })
      }
      if (narrator.volumeNumber !== volumeNumber) {
        addIssue(issues, 'error', 'narrator stored in wrong volume shard', {
          id: narrator.id,
          expectedVolumeNumber: volumeNumber,
          actualVolumeNumber: narrator.volumeNumber,
        })
      }
      if (!ids.has(narrator.id)) {
        addIssue(issues, 'error', 'narrator shard entry is not in index', { id: narrator.id })
      }
      if (narratorIdsFromShards.has(narrator.id)) {
        addIssue(issues, 'error', 'duplicate narrator id across shards', { id: narrator.id })
      }
      narratorIdsFromShards.add(narrator.id)

      if (!narrator.primaryName || !narrator.plainText || !Array.isArray(narrator.textBlocks)) {
        addIssue(issues, 'error', 'narrator entry has empty name/text', { id: narrator.id })
      }
      if (!Array.isArray(narrator.sourceRefs) || narrator.sourceRefs.length === 0) {
        addIssue(issues, 'error', 'narrator entry has no source refs', { id: narrator.id })
      }
      for (const ref of narrator.sourceRefs ?? []) {
        if (!ref.pageId || !Number.isInteger(ref.pageNumber)) {
          addIssue(issues, 'error', 'narrator source ref is invalid', { id: narrator.id, ref })
        }
      }
    }
  }

  if (narratorIdsFromShards.size !== index.length) {
    addIssue(issues, 'error', 'narrator shard entry count must equal index count', {
      shardEntries: narratorIdsFromShards.size,
      index: index.length,
    })
  }

  for (const id of ids) {
    if (!narratorIdsFromShards.has(id)) {
      addIssue(issues, 'error', 'index narrator is missing from shards', { id })
    }
  }

  const generation = manifest.generation
  if (!generation) {
    addIssue(issues, 'error', 'manifest generation summary is missing')
  } else {
    if (generation.discoveredVolumes !== EXPECTED_VOLUME_COUNT) {
      addIssue(issues, 'error', 'generation did not discover exactly 24 volumes', {
        actual: generation.discoveredVolumes,
      })
    }
    if (generation.expectedPages !== metadata.counts?.pages) {
      addIssue(issues, 'error', 'generation expected page count is stale', {
        generation: generation.expectedPages,
        metadata: metadata.counts?.pages,
      })
    }
    if (generation.fetchedPages + generation.unavailablePages !== generation.expectedPages) {
      addIssue(issues, 'error', 'generation page coverage is incomplete', {
        expectedPages: generation.expectedPages,
        fetchedPages: generation.fetchedPages,
        unavailablePages: generation.unavailablePages,
      })
    }
    if (generation.omittedPages !== 0) {
      addIssue(issues, 'error', 'generation has omitted pages', {
        omittedPages: generation.omittedPages,
      })
    }
    if (generation.parser?.boundaryErrors !== 0) {
      addIssue(issues, 'error', 'parser has entry-boundary errors', {
        count: generation.parser?.boundaryErrors,
      })
    }
    if (generation.parser?.entries !== index.length) {
      addIssue(issues, 'error', 'parser entry count is stale', {
        parser: generation.parser?.entries,
        index: index.length,
      })
    }
  }

  if (manifest.counts?.volumes !== EXPECTED_VOLUME_COUNT) {
    addIssue(issues, 'error', 'manifest volume count is stale', {
      manifest: manifest.counts?.volumes,
    })
  }
  if (manifest.counts?.pages !== metadata.counts?.pages) {
    addIssue(issues, 'error', 'manifest page count is stale', {
      manifest: manifest.counts?.pages,
      metadata: metadata.counts?.pages,
    })
  }
  if (manifest.counts?.narrators !== index.length) {
    addIssue(issues, 'error', 'manifest narrator count is stale', {
      manifest: manifest.counts?.narrators,
      actual: index.length,
    })
  }
  if (manifest.counts?.narratorShards !== EXPECTED_VOLUME_COUNT) {
    addIssue(issues, 'error', 'manifest narrator shard count is stale', {
      manifest: manifest.counts?.narratorShards,
      expected: EXPECTED_VOLUME_COUNT,
    })
  }
  if (manifest.counts?.searchEntries !== search.length) {
    addIssue(issues, 'error', 'manifest search count is stale', {
      manifest: manifest.counts?.searchEntries,
      actual: search.length,
    })
  }

  const actualChecksums = await fileChecksums(runtimeDir)
  if (JSON.stringify(actualChecksums) !== JSON.stringify(manifest.checksums?.runtime ?? {})) {
    addIssue(issues, 'error', 'runtime checksums are stale')
  }

  return issues
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const releaseDir = await resolveReleaseDir()
  const issues = await validateKhoeiRelease(releaseDir)
  const errors = issues.filter((issue) => issue.severity === 'error')
  const warnings = issues.filter((issue) => issue.severity === 'warning')

  for (const issue of issues) {
    const prefix = issue.severity === 'error' ? 'ERROR' : 'WARN'
    console.log(`${prefix}: ${issue.message} ${JSON.stringify(issue.context)}`)
  }

  if (errors.length > 0) {
    console.error(
      `Rijal data validation failed with ${errors.length} errors and ${warnings.length} warnings.`,
    )
    process.exit(1)
  }

  await fs.stat(releaseDir)
  console.log(`Rijal data validation passed for ${releaseDir} with ${warnings.length} warnings.`)
}
