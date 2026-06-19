#!/usr/bin/env node
import path from 'node:path'
import {
  CURRENT_POINTER_PATH,
  PUBLIC_CURRENT_ROOT,
  RELEASES_ROOT,
  listFiles,
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
  if (version) return path.join(RELEASES_ROOT, version)

  const pointer = await readJson(CURRENT_POINTER_PATH)
  return path.join(RELEASES_ROOT, pointer.version)
}

function countStructureHadiths(structure) {
  return Object.values(structure).reduce(
    (sum, category) => sum + Number(category.totalHadiths || 0),
    0,
  )
}

async function validateRelease(releaseDir) {
  const issues = []
  const manifestPath = path.join(releaseDir, 'manifest.json')
  if (!(await pathExists(manifestPath))) {
    addIssue(issues, 'error', 'manifest.json is missing', { releaseDir })
    return issues
  }

  const manifest = await readJson(manifestPath)
  const runtimeDir = path.join(releaseDir, 'runtime')
  const canonicalDir = path.join(releaseDir, 'canonical')

  const books = await readJson(path.join(runtimeDir, 'books.json'))
  const canonicalBooks = await readJson(path.join(canonicalDir, 'books.json'))
  if (!Array.isArray(books) || books.length === 0) {
    addIssue(issues, 'error', 'runtime/books.json must contain at least one book')
  }

  const volumeFiles = await listFiles(path.join(runtimeDir, 'volumes'), (file) =>
    file.endsWith('.json'),
  )
  const searchFiles = await listFiles(path.join(runtimeDir, 'search'), (file) =>
    file.endsWith('.json'),
  )
  const canonicalHadithFiles = await listFiles(path.join(canonicalDir, 'hadiths'), (file) =>
    file.endsWith('.json'),
  )

  const bookIds = new Set(books.map((book) => book.bookId))
  let hadithCount = 0
  const seenGlobalRefs = new Set()

  for (const book of books) {
    const volumePath = path.join(runtimeDir, 'volumes', `${book.bookId}.json`)
    const structurePath = path.join(runtimeDir, 'structures', `${book.bookId}.json`)
    const searchPath = path.join(runtimeDir, 'search', `${book.bookId}.json`)

    if (!(await pathExists(volumePath))) {
      addIssue(issues, 'error', 'volume file is missing for book', { bookId: book.bookId })
      continue
    }
    if (!(await pathExists(structurePath))) {
      addIssue(issues, 'error', 'structure file is missing for book', { bookId: book.bookId })
    }
    if (!(await pathExists(searchPath))) {
      addIssue(issues, 'error', 'search shard is missing for book', { bookId: book.bookId })
    }

    const hadiths = await readJson(volumePath)
    const structure = await readJson(structurePath)
    const searchShard = await readJson(searchPath)
    const localIds = new Set()

    if (searchShard.length !== hadiths.length) {
      addIssue(issues, 'error', 'search shard length differs from volume length', {
        bookId: book.bookId,
        hadiths: hadiths.length,
        search: searchShard.length,
      })
    }

    if (countStructureHadiths(structure) !== hadiths.length) {
      addIssue(issues, 'error', 'structure count differs from volume length', {
        bookId: book.bookId,
        structure: countStructureHadiths(structure),
        hadiths: hadiths.length,
      })
    }

    for (const hadith of hadiths) {
      hadithCount++
      const ref = `${hadith.bookId}:${hadith.id}`
      if (localIds.has(hadith.id)) {
        addIssue(issues, 'error', 'duplicate hadith id in volume', {
          bookId: book.bookId,
          id: hadith.id,
        })
      }
      localIds.add(hadith.id)
      seenGlobalRefs.add(ref)

      if (!bookIds.has(hadith.bookId)) {
        addIssue(issues, 'error', 'hadith references unknown bookId', {
          bookId: hadith.bookId,
          id: hadith.id,
        })
      }
      if (!hadith.URL) {
        addIssue(issues, 'warning', 'hadith has no source URL', {
          bookId: hadith.bookId,
          id: hadith.id,
        })
      }
      if (!hadith.englishText && !hadith.arabicText && !hadith.thaqalaynMatn) {
        addIssue(issues, 'error', 'hadith has no searchable/readable text', {
          bookId: hadith.bookId,
          id: hadith.id,
        })
      }
      if (hadith.categoryId === undefined || hadith.chapterInCategoryId === undefined) {
        addIssue(issues, 'error', 'hadith is missing chapter identity', {
          bookId: hadith.bookId,
          id: hadith.id,
        })
      }
    }
  }

  const lookup = await readJson(path.join(runtimeDir, 'lookup.json'))
  const random = await readJson(path.join(runtimeDir, 'random.json'))
  for (const ref of random.allRefs || []) {
    if (!seenGlobalRefs.has(`${ref.bookId}:${ref.id}`)) {
      addIssue(issues, 'error', 'random table references missing hadith', ref)
    }
  }

  for (const [key, ref] of Object.entries(lookup.byBookAndId || {})) {
    if (!seenGlobalRefs.has(`${ref.bookId}:${ref.id}`)) {
      addIssue(issues, 'error', 'lookup references missing hadith', { key, ref })
    }
  }

  if (manifest.counts?.books !== canonicalBooks.length) {
    addIssue(issues, 'error', 'manifest book count is stale', {
      manifest: manifest.counts?.books,
      actual: canonicalBooks.length,
    })
  }
  if (
    manifest.counts?.volumes !== volumeFiles.length ||
    manifest.counts?.volumes !== books.length
  ) {
    addIssue(issues, 'error', 'manifest volume count is stale', {
      manifest: manifest.counts?.volumes,
      volumeFiles: volumeFiles.length,
      runtimeBooks: books.length,
    })
  }
  if (manifest.counts?.hadiths !== hadithCount) {
    addIssue(issues, 'error', 'manifest hadith count is stale', {
      manifest: manifest.counts?.hadiths,
      actual: hadithCount,
    })
  }
  if (searchFiles.length !== volumeFiles.length) {
    addIssue(issues, 'error', 'search shard count differs from volume count', {
      searchFiles: searchFiles.length,
      volumeFiles: volumeFiles.length,
    })
  }
  if (canonicalHadithFiles.length !== volumeFiles.length) {
    addIssue(issues, 'error', 'canonical hadith shard count differs from volume count', {
      canonicalHadithFiles: canonicalHadithFiles.length,
      volumeFiles: volumeFiles.length,
    })
  }

  if (await pathExists(PUBLIC_CURRENT_ROOT)) {
    const publicManifest = await readJson(path.join(PUBLIC_CURRENT_ROOT, 'manifest.json'))
    if (publicManifest.version !== manifest.version) {
      addIssue(issues, 'warning', 'public current manifest points at a different version', {
        releaseVersion: manifest.version,
        publicVersion: publicManifest.version,
      })
    }
  }

  return issues
}

const releaseDir = await resolveReleaseDir()
const issues = await validateRelease(releaseDir)
const errors = issues.filter((issue) => issue.severity === 'error')
const warnings = issues.filter((issue) => issue.severity === 'warning')

for (const issue of issues) {
  const prefix = issue.severity === 'error' ? 'ERROR' : 'WARN'
  console.log(`${prefix}: ${issue.message} ${JSON.stringify(issue.context)}`)
}

if (errors.length > 0) {
  console.error(
    `Data validation failed with ${errors.length} errors and ${warnings.length} warnings.`,
  )
  process.exit(1)
}

console.log(`Data validation passed for ${releaseDir} with ${warnings.length} warnings.`)
