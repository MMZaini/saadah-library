#!/usr/bin/env node
import path from 'node:path'
import {
  ABLIBRARY_GRPC_ORIGIN,
  ABLIBRARY_ORIGIN,
  EXPECTED_VOLUME_COUNT,
  RIJAL_CURRENT_POINTER,
  RIJAL_RELEASES_ROOT,
  emptyDir,
  fileChecksums,
  makeConcurrency,
  stableVersion,
  writeJson,
} from './shared.mjs'
import {
  discoverKhoeiVolumes,
  fetchContents,
  fetchPagesMeta,
  fetchTableOfContents,
} from './ablibrary-client.mjs'
import { buildRuntimeArtifacts, parseKhoeiVolumes } from './khoei-parser.mjs'
import { validateKhoeiRelease } from './validate.mjs'

function getFlag(name) {
  return process.argv.includes(name)
}

function getArg(name, fallback = null) {
  const idx = process.argv.indexOf(name)
  if (idx === -1) return fallback
  return process.argv[idx + 1] ?? fallback
}

function chunk(values, size) {
  const chunks = []
  for (let i = 0; i < values.length; i += size) chunks.push(values.slice(i, i + size))
  return chunks
}

async function fetchVolume(volume, releaseDir, { keepRaw = false } = {}) {
  const volumeDir = path.join(
    releaseDir,
    'raw',
    'volumes',
    String(volume.volumeNumber).padStart(2, '0'),
  )

  if (keepRaw) await writeJson(path.join(volumeDir, 'book.json'), volume)

  const pageCountHint = Number(volume.pageCount || 0)
  let pagesMeta = { pages: [] }
  if (keepRaw || !pageCountHint) {
    const [fetchedPagesMeta, toc] = await Promise.all([
      fetchPagesMeta(volume.id),
      keepRaw
        ? fetchTableOfContents(volume.id).catch((error) => ({ error: error.message }))
        : Promise.resolve(null),
    ])
    pagesMeta = fetchedPagesMeta
    if (keepRaw) {
      await writeJson(path.join(volumeDir, 'pages-meta.json'), pagesMeta)
      await writeJson(path.join(volumeDir, 'table-of-contents.json'), toc)
    }
  }

  const expectedPageNumbers = Array.from(
    { length: Number(volume.pageCount || pagesMeta.pages.length || 0) },
    (_, index) => index + 1,
  )
  if (expectedPageNumbers.length === 0) {
    throw new Error(`Volume ${volume.id} has no page count in discovery or page metadata.`)
  }

  const run = makeConcurrency(2)
  const batches = chunk(expectedPageNumbers, Number(getArg('--batch-size', 20)))
  const pageBatches = await Promise.all(
    batches.map((pageNumbers) => run(() => fetchContents(volume.id, pageNumbers))),
  )
  const pagesByNumber = new Map()
  for (const page of pageBatches.flat()) {
    if (page.number) pagesByNumber.set(page.number, page)
  }

  const pages = expectedPageNumbers
    .filter((pageNumber) => pagesByNumber.has(pageNumber))
    .map((pageNumber) => pagesByNumber.get(pageNumber))
  const unavailable = expectedPageNumbers
    .filter((pageNumber) => !pagesByNumber.has(pageNumber))
    .map((pageNumber) => ({
      pageNumber,
      sourceUnavailable: false,
      reason: 'Contents response omitted this page; validate gate treats this as an error.',
    }))

  if (keepRaw) {
    await writeJson(path.join(volumeDir, 'pages.json'), pages)
    await writeJson(path.join(volumeDir, 'unavailable-pages.json'), unavailable)
  }

  return {
    volumeNumber: volume.volumeNumber,
    book: volume,
    pages,
    unavailable,
    pageCount: expectedPageNumbers.length,
  }
}

async function writeRuntimeArtifacts(releaseDir, version, volumes) {
  const parseResult = parseKhoeiVolumes(volumes)
  const parserReport = {
    generatedAt: new Date().toISOString(),
    entryCount: parseResult.entries.length,
    boundaryErrors: parseResult.boundaryErrors,
    classifiedPages: parseResult.pageClassifications.length,
  }

  const artifacts = buildRuntimeArtifacts(parseResult.entries, {
    version,
    source: {
      primary: ABLIBRARY_ORIGIN,
      grpcHost: ABLIBRARY_GRPC_ORIGIN,
      volumes: volumes.map((volume) => ({
        id: volume.book.id,
        title: volume.book.title,
        volumeNumber: volume.volumeNumber,
        rawVolumeNumber: volume.originalSourceOrder,
        pageCount: volume.pageCount,
      })),
    },
  })

  const runtimeDir = path.join(releaseDir, 'runtime')
  await writeJson(path.join(runtimeDir, 'metadata.json'), artifacts.metadata)
  await writeJson(path.join(runtimeDir, 'index.json'), artifacts.index)
  await writeJson(path.join(runtimeDir, 'search.json'), artifacts.search)
  await writeJson(path.join(runtimeDir, 'transliterations.json'), artifacts.transliterations)
  await writeJson(
    path.join(runtimeDir, 'transliteration-tokens.json'),
    artifacts.transliterationTokens,
  )
  await writeNarratorShards(runtimeDir, artifacts.narrators)

  return { artifacts, parserReport }
}

async function writeNarratorShards(runtimeDir, narrators) {
  const byVolume = new Map()
  for (const narrator of narrators) {
    const volumeNumber = narrator.volumeNumber
    if (!byVolume.has(volumeNumber)) byVolume.set(volumeNumber, [])
    byVolume.get(volumeNumber).push(narrator)
  }

  for (const [volumeNumber, entries] of byVolume) {
    entries.sort(
      (a, b) =>
        (a.sourceEntryNumber ?? a.entryNumber ?? 0) - (b.sourceEntryNumber ?? b.entryNumber ?? 0) ||
        a.startPage - b.startPage ||
        a.primaryName.localeCompare(b.primaryName, 'ar'),
    )
    const shard = Object.fromEntries(entries.map((entry) => [entry.id, entry]))
    await writeJson(
      path.join(runtimeDir, 'narrators', `volume-${String(volumeNumber).padStart(2, '0')}.json`),
      shard,
    )
  }
}

function orderVolumesByContent(volumes) {
  return volumes
    .map((volume) => {
      const parsed = parseKhoeiVolumes([{ ...volume, volumeNumber: 1 }])
      const firstEntry = parsed.entries[0]
      return {
        volume,
        firstEntryNumber: firstEntry?.sourceEntryNumber ?? firstEntry?.entryNumber ?? 999999,
      }
    })
    .sort((a, b) => a.firstEntryNumber - b.firstEntryNumber)
    .map(({ volume }, index) => ({
      ...volume,
      originalSourceOrder: volume.volumeNumber,
      volumeNumber: index + 1,
    }))
}

async function main() {
  const publish = !getFlag('--no-publish')
  const keepRaw = getFlag('--keep-raw')
  const discovery = await discoverKhoeiVolumes()

  if (discovery.volumes.length !== EXPECTED_VOLUME_COUNT) {
    throw new Error(
      `Expected exactly ${EXPECTED_VOLUME_COUNT} Khoei Mu'jam volumes, found ${discovery.volumes.length}`,
    )
  }

  const version = getArg('--version') ?? stableVersion('ablibrary-khoei', discovery.volumes)
  const releaseDir = path.join(RIJAL_RELEASES_ROOT, version)
  await emptyDir(releaseDir)
  if (keepRaw) await writeJson(path.join(releaseDir, 'raw', 'discovery.json'), discovery)

  const run = makeConcurrency(Number(getArg('--concurrency', 2)))
  const fetchedVolumes = await Promise.all(
    discovery.volumes.map((volume) => run(() => fetchVolume(volume, releaseDir, { keepRaw }))),
  )
  const volumes = orderVolumesByContent(fetchedVolumes)
  if (keepRaw) {
    await writeJson(
      path.join(releaseDir, 'raw', 'volume-order.json'),
      volumes.map((volume) => ({
        volumeNumber: volume.volumeNumber,
        originalSourceOrder: volume.originalSourceOrder,
        bookId: volume.book.id,
        title: volume.book.title,
        pageCount: volume.pageCount,
      })),
    )
  }

  const expectedPages = volumes.reduce((sum, volume) => sum + volume.pageCount, 0)
  const fetchedPages = volumes.reduce((sum, volume) => sum + volume.pages.length, 0)
  const unavailablePages = volumes.reduce(
    (sum, volume) =>
      sum + volume.unavailable.filter((page) => page.sourceUnavailable === true).length,
    0,
  )
  const omittedPages = volumes.reduce(
    (sum, volume) =>
      sum + volume.unavailable.filter((page) => page.sourceUnavailable !== true).length,
    0,
  )
  if (omittedPages > 0) {
    throw new Error(
      `Fetched ${fetchedPages}/${expectedPages} expected pages; ${omittedPages} pages were omitted by the source response.`,
    )
  }

  const { artifacts, parserReport } = await writeRuntimeArtifacts(releaseDir, version, volumes)
  const runtimeChecksums = await fileChecksums(path.join(releaseDir, 'runtime'))

  const manifest = {
    schemaVersion: 3,
    version,
    generatedAt: new Date().toISOString(),
    source: {
      kind: 'ablibrary-grpc-web-snapshot',
      primaryUrl: ABLIBRARY_ORIGIN,
      grpcHost: ABLIBRARY_GRPC_ORIGIN,
      title: artifacts.metadata.title,
      author: artifacts.metadata.author,
      notes: [
        'One-time optimized snapshot; the app runtime reads local JSON only.',
        'Narrator text is original Arabic from the source without generated summaries.',
        keepRaw
          ? 'Raw maintainer scrape snapshots were retained for this generated release.'
          : 'Raw maintainer scrape snapshots are intentionally omitted from committed artifacts.',
      ],
    },
    generation: {
      discoveredVolumes: discovery.volumes.length,
      expectedPages,
      fetchedPages,
      unavailablePages,
      omittedPages,
      parser: {
        entries: parserReport.entryCount,
        boundaryErrors: parserReport.boundaryErrors.length,
        classifiedPages: parserReport.classifiedPages,
      },
    },
    counts: {
      volumes: artifacts.metadata.counts.volumes,
      pages: artifacts.metadata.counts.pages,
      narrators: artifacts.index.length,
      narratorShards: EXPECTED_VOLUME_COUNT,
      searchEntries: artifacts.search.length,
    },
    artifactHash: runtimeChecksums['index.json'],
    checksums: {
      runtime: runtimeChecksums,
    },
  }
  await writeJson(path.join(releaseDir, 'manifest.json'), manifest)

  const issues = await validateKhoeiRelease(releaseDir)
  const errors = issues.filter((issue) => issue.severity === 'error')
  if (errors.length > 0) {
    for (const issue of issues) {
      const prefix = issue.severity === 'error' ? 'ERROR' : 'WARN'
      console.log(`${prefix}: ${issue.message} ${JSON.stringify(issue.context)}`)
    }
    throw new Error(`Validation failed; not publishing current (${errors.length} errors).`)
  }

  if (publish) {
    await writeJson(RIJAL_CURRENT_POINTER, { version, updatedAt: new Date().toISOString() })
  }

  console.log(
    `Generated ${artifacts.index.length} narrator entries from ${EXPECTED_VOLUME_COUNT} volumes (${version}).`,
  )
}

await main()
