#!/usr/bin/env node
import path from 'node:path'
import {
  EXPECTED_VOLUME_COUNT,
  RIJAL_CURRENT_POINTER,
  RIJAL_RELEASES_ROOT,
  fileChecksums,
  readJson,
  writeJson,
} from './shared.mjs'
import { buildNarratorSearchEntry } from './khoei-parser.mjs'
import { validateKhoeiRelease } from './validate.mjs'

const current = await readJson(RIJAL_CURRENT_POINTER)
const releaseDir = path.join(RIJAL_RELEASES_ROOT, current.version)
const runtimeDir = path.join(releaseDir, 'runtime')
const index = await readJson(path.join(runtimeDir, 'index.json'))
const narratorsById = new Map()

for (let volumeNumber = 1; volumeNumber <= EXPECTED_VOLUME_COUNT; volumeNumber++) {
  const shard = await readJson(
    path.join(runtimeDir, 'narrators', `volume-${String(volumeNumber).padStart(2, '0')}.json`),
  )
  for (const narrator of Object.values(shard)) narratorsById.set(narrator.id, narrator)
}

const search = index.map((summary) => {
  const narrator = narratorsById.get(summary.id)
  if (!narrator) throw new Error(`Narrator shard is missing ${summary.id}`)
  return buildNarratorSearchEntry(narrator)
})

await writeJson(path.join(runtimeDir, 'search.json'), search)

const manifestPath = path.join(releaseDir, 'manifest.json')
const manifest = await readJson(manifestPath)
manifest.schemaVersion = 3
manifest.counts.searchEntries = search.length
manifest.checksums.runtime = await fileChecksums(runtimeDir)
await writeJson(manifestPath, manifest)

const issues = await validateKhoeiRelease(releaseDir)
const errors = issues.filter((issue) => issue.severity === 'error')
if (errors.length > 0) {
  for (const issue of issues) {
    const prefix = issue.severity === 'error' ? 'ERROR' : 'WARN'
    console.error(`${prefix}: ${issue.message} ${JSON.stringify(issue.context)}`)
  }
  throw new Error(`Reindexed search failed validation with ${errors.length} errors.`)
}

const profileCount = search.reduce(
  (total, entry) => total + (entry.identityProfiles?.length ?? 0),
  0,
)
const factCount = search.reduce((total, entry) => total + (entry.identityFacts?.length ?? 0), 0)
console.log(
  `Reindexed ${search.length} narrators with ${profileCount} structured identity profiles and ${factCount} subject identity facts (${current.version}).`,
)
