#!/usr/bin/env node
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  RIJAL_CURRENT_POINTER,
  RIJAL_RELEASES_ROOT,
  fileChecksums,
  readJson,
  writeJson,
} from './shared.mjs'
import { buildNarratorTransliterations, buildTokenTransliterationList } from './transliteration.mjs'

const write = process.argv.includes('--write')
const current = await readJson(RIJAL_CURRENT_POINTER)
const releaseDir = path.join(RIJAL_RELEASES_ROOT, current.version)
const runtimeDir = path.join(releaseDir, 'runtime')
const index = await readJson(path.join(runtimeDir, 'index.json'))
const transliterations = buildNarratorTransliterations(index)
const tokens = buildTokenTransliterationList(index)

if (write) {
  await writeJson(path.join(runtimeDir, 'transliterations.json'), transliterations)
  await writeJson(path.join(runtimeDir, 'transliteration-tokens.json'), tokens)
  const manifestPath = path.join(releaseDir, 'manifest.json')
  const manifest = await readJson(manifestPath)
  manifest.checksums.runtime = await fileChecksums(runtimeDir)
  await writeJson(manifestPath, manifest)
}

const scriptName = path.relative(process.cwd(), fileURLToPath(import.meta.url))
console.log(
  `${write ? 'Wrote' : 'Would write'} ${Object.keys(transliterations).length} narrator transliterations from ${Object.keys(tokens).length} unique Arabic tokens (${scriptName}).`,
)
