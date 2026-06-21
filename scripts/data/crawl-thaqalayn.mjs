#!/usr/bin/env node
import fs from 'node:fs/promises'
import path from 'node:path'
import {
  DATA_ROOT,
  PUBLIC_CURRENT_ROOT,
  THAQALAYN_ORIGIN,
  emptyDir,
  fetchWithRetry,
  listFiles,
  makeConcurrency,
  parseThaqalaynHadithUrl,
  readJson,
  writeJson,
  writeText,
} from './shared.mjs'
import { generateReleaseFromLegacy } from './generate-release.mjs'
import {
  parseBookPage,
  parseChapterPage,
  parseSitemap,
  websiteHadithToLegacyShape,
} from './thaqalayn-page-parser.mjs'

function hasFlag(name) {
  return process.argv.includes(name)
}

function getArg(name, fallback = null) {
  const idx = process.argv.indexOf(name)
  if (idx === -1) return fallback
  return process.argv[idx + 1] ?? fallback
}

function todayRunId() {
  return new Date().toISOString().replace(/[:.]/g, '-')
}

async function assertRobotsAllowsSearch() {
  const robotsUrl = `${THAQALAYN_ORIGIN}/robots.txt`
  const text = await fetchWithRetry(robotsUrl, { headers: { Accept: 'text/plain' } }).then((r) =>
    r.text(),
  )

  if (/Content-Signal:\s*[^#\n]*search\s*=\s*no/i.test(text)) {
    throw new Error('thaqalayn.net robots.txt declares Content-Signal search=no')
  }

  const userAgentStar = text.match(/User-agent:\s*\*\s*([\s\S]*?)(?:\nUser-agent:|\z)/i)
  if (userAgentStar && /Disallow:\s*\/\s*(?:\n|$)/i.test(userAgentStar[1])) {
    throw new Error('thaqalayn.net robots.txt disallows User-agent: *')
  }

  return text
}

// The published runtime artifacts do not live under current/runtime; the
// current/ folder only holds manifest.json, and the artifacts are at
// <version>/runtime (the version is resolved via the manifest, exactly as the
// app's server-repository does). Resolving the wrong path silently yields an
// empty legacy map and forces every hadith onto a fallback volume id.
async function resolveCurrentRuntimePath(...segments) {
  const manifest = await readJson(path.join(PUBLIC_CURRENT_ROOT, 'manifest.json'))
  return path.join(PUBLIC_CURRENT_ROOT, '..', manifest.version, 'runtime', ...segments)
}

function sourceUrlKey(url) {
  const parsed = parseThaqalaynHadithUrl(url)
  if (parsed) return `${THAQALAYN_ORIGIN}${parsed.pathname}`

  try {
    const parsedUrl = new URL(url, THAQALAYN_ORIGIN)
    return `${THAQALAYN_ORIGIN}${parsedUrl.pathname}`
  } catch {
    return String(url)
  }
}

function scopedSourceKey(bookId, sourceUrl) {
  return `${bookId}\0${sourceUrlKey(sourceUrl)}`
}

function scopedHadithIdKey(bookId, id) {
  return `${bookId}\0${id}`
}

function sourceUrlWithVolumePointer(sourceUrl, volumePointer) {
  const parsed = parseThaqalaynHadithUrl(sourceUrl)
  if (!parsed || !volumePointer) return sourceUrl

  const parts = parsed.pathname.split('/')
  parts[2] = String(volumePointer)
  return `${THAQALAYN_ORIGIN}${parts.join('/')}`
}

function incrementMap(map, key) {
  map.set(key, (map.get(key) || 0) + 1)
}

function mostCommonKey(counts) {
  let bestKey = null
  let bestCount = 0
  for (const [key, count] of counts) {
    if (count > bestCount) {
      bestKey = key
      bestCount = count
    }
  }
  return bestKey
}

function normalizeBookTitle(value) {
  return String(value || '')
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}]+/gu, ' ')
    .trim()
}

function titleVolumeKey(title, volume) {
  const normalizedTitle = normalizeBookTitle(title)
  const normalizedVolume = Number(volume || 1)
  if (!normalizedTitle || !Number.isFinite(normalizedVolume)) return null
  return `${normalizedTitle}:${normalizedVolume}`
}

function buildBookIdByTitleAndVolume(currentBooksById) {
  const candidates = new Map()

  for (const book of currentBooksById.values()) {
    for (const title of [book.BookName, book.book]) {
      const key = titleVolumeKey(title, book.volume)
      if (!key) continue
      const ids = candidates.get(key) || new Set()
      ids.add(book.bookId)
      candidates.set(key, ids)
    }
  }

  const resolved = new Map()
  for (const [key, ids] of candidates) {
    if (ids.size === 1) resolved.set(key, [...ids][0])
  }
  return resolved
}

function resolveBookIdFromMetadata(meta, bookIdByTitleAndVolume) {
  const key = titleVolumeKey(meta.bookName, meta.volumeNumber)
  return key ? (bookIdByTitleAndVolume.get(key) ?? null) : null
}

async function loadCurrentLegacyContext() {
  try {
    const runtimeDir = await resolveCurrentRuntimePath()
    const lookup = await readJson(path.join(runtimeDir, 'lookup.json'))
    const bySourceUrl = lookup.bySourceUrl || {}
    const byBookAndSourceUrl = new Map()
    const byBookAndId = new Map()
    const basePointerByBookId = new Map()
    const maxIdByBookId = new Map()
    const volumeFiles = await listFiles(path.join(runtimeDir, 'volumes'), (file) =>
      file.endsWith('.json'),
    )

    await Promise.all(
      volumeFiles.map(async (file) => {
        const bookId = path.basename(file, '.json')
        const hadiths = await readJson(file)
        const pointerCounts = new Map()

        for (const hadith of hadiths) {
          if (!hadith.URL) continue
          byBookAndSourceUrl.set(scopedSourceKey(bookId, hadith.URL), {
            bookId,
            id: hadith.id,
            volume: hadith.volume,
            sourceKey: parseThaqalaynHadithUrl(hadith.URL)?.pathname || sourceUrlKey(hadith.URL),
          })
          byBookAndId.set(scopedHadithIdKey(bookId, hadith.id), hadith)
          maxIdByBookId.set(bookId, Math.max(maxIdByBookId.get(bookId) || 0, Number(hadith.id)))

          const parsed = parseThaqalaynHadithUrl(hadith.URL)
          if (parsed?.volumePointer) incrementMap(pointerCounts, parsed.volumePointer)
        }

        const basePointer = mostCommonKey(pointerCounts)
        if (basePointer) basePointerByBookId.set(bookId, basePointer)
      }),
    )

    return {
      bySourceUrl,
      byBookAndSourceUrl,
      byBookAndId,
      basePointerByBookId,
      maxIdByBookId,
    }
  } catch (error) {
    process.stderr.write(`Warning: could not load current legacy context: ${error.message}\n`)
    return {
      bySourceUrl: {},
      byBookAndSourceUrl: new Map(),
      byBookAndId: new Map(),
      basePointerByBookId: new Map(),
      maxIdByBookId: new Map(),
    }
  }
}

function resolveLegacyRef({ sourceUrl, candidateBookId, legacyContext }) {
  if (candidateBookId) {
    const scopedExact = legacyContext.byBookAndSourceUrl.get(
      scopedSourceKey(candidateBookId, sourceUrl),
    )
    if (scopedExact) return scopedExact

    const basePointer = legacyContext.basePointerByBookId.get(candidateBookId)
    const normalizedSourceUrl = sourceUrlWithVolumePointer(sourceUrl, basePointer)
    const scopedNormalized = legacyContext.byBookAndSourceUrl.get(
      scopedSourceKey(candidateBookId, normalizedSourceUrl),
    )
    if (scopedNormalized) return scopedNormalized

    const exact = legacyContext.bySourceUrl[sourceUrlKey(sourceUrl)]
    return exact?.bookId === candidateBookId ? exact : null
  }

  return legacyContext.bySourceUrl[sourceUrlKey(sourceUrl)] || null
}

function readableText(hadith) {
  return [hadith.englishText, hadith.arabicText, hadith.thaqalaynMatn].filter(Boolean).join(' ')
}

function comparableText(value) {
  return String(value || '')
    .normalize('NFKD')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

function sharedPrefixLength(a, b) {
  const limit = Math.min(a.length, b.length)
  let index = 0
  while (index < limit && a[index] === b[index]) index++
  return index
}

function legacyMatchScore(bookId, id, hadith, legacyContext) {
  const legacy = legacyContext.byBookAndId.get(scopedHadithIdKey(bookId, id))
  let score = readableText(hadith) ? 1 : 0
  if (!legacy) return score

  if (legacy.URL && hadith.URL && sourceUrlKey(legacy.URL) === sourceUrlKey(hadith.URL)) {
    score += 5
  }

  const legacyText = comparableText(readableText(legacy))
  const candidateText = comparableText(readableText(hadith))
  if (!legacyText || !candidateText) return score

  if (legacyText === candidateText) return score + 100

  const legacyHead = legacyText.slice(0, 240)
  const candidateHead = candidateText.slice(0, 240)
  if (legacyHead && candidateText.includes(legacyHead)) score += 70
  if (candidateHead && legacyText.includes(candidateHead)) score += 70
  score += Math.min(sharedPrefixLength(legacyText, candidateText) / 12, 40)
  return score
}

function compareHadithSourceOrder(a, b) {
  return (
    sourceUrlKey(a.URL).localeCompare(sourceUrlKey(b.URL)) ||
    Number(a.sourceHadithId || 0) - Number(b.sourceHadithId || 0) ||
    comparableText(readableText(a)).localeCompare(comparableText(readableText(b)))
  )
}

function chooseHadithToKeepDuplicateId(bookId, id, hadiths, legacyContext) {
  return hadiths
    .slice()
    .sort(
      (a, b) =>
        legacyMatchScore(bookId, id, b, legacyContext) -
          legacyMatchScore(bookId, id, a, legacyContext) || compareHadithSourceOrder(a, b),
    )[0]
}

function nextAvailableHadithId(bookId, usedIds, nextIdByBookId, legacyContext) {
  let nextId =
    nextIdByBookId.get(bookId) ??
    (legacyContext.maxIdByBookId.get(bookId) || Math.max(0, ...usedIds)) + 1

  while (usedIds.has(nextId)) nextId++
  usedIds.add(nextId)
  nextIdByBookId.set(bookId, nextId + 1)
  return nextId
}

function shouldCompactGeneratedHadithId(bookId, hadith, legacyContext, hadithCount) {
  const maxLegacyId = legacyContext.maxIdByBookId.get(bookId)
  if (!maxLegacyId || hadith.legacyMatched) return false
  return Number(hadith.id) > maxLegacyId + hadithCount
}

function reassignGeneratedHadithIds(bookId, hadiths, legacyContext, warnings) {
  const groupsById = new Map()
  for (const hadith of hadiths) {
    const group = groupsById.get(hadith.id) || []
    group.push(hadith)
    groupsById.set(hadith.id, group)
  }

  const reassignments = new Set(
    hadiths.filter((hadith) =>
      shouldCompactGeneratedHadithId(bookId, hadith, legacyContext, hadiths.length),
    ),
  )

  const nextIdByBookId = new Map()
  for (const [id, group] of groupsById) {
    if (group.length === 1) continue

    const keep = chooseHadithToKeepDuplicateId(bookId, id, group, legacyContext)
    for (const hadith of group) {
      if (hadith !== keep) reassignments.add(hadith)
    }
  }

  if (reassignments.size === 0) return

  const usedIds = new Set(
    hadiths.filter((hadith) => !reassignments.has(hadith)).map((hadith) => hadith.id),
  )
  for (const hadith of [...reassignments].sort(compareHadithSourceOrder)) {
    const previousId = hadith.id
    hadith.id = nextAvailableHadithId(bookId, usedIds, nextIdByBookId, legacyContext)
    warnings.push({
      url: hadith.URL,
      warning: `Reassigned generated hadith id ${previousId} in ${bookId} to ${hadith.id}`,
    })
  }
}

async function loadCurrentBooksById() {
  try {
    const books = await readJson(await resolveCurrentRuntimePath('books.json'))
    return new Map(books.map((book) => [book.bookId, book]))
  } catch (error) {
    process.stderr.write(`Warning: could not load current books map: ${error.message}\n`)
    return new Map()
  }
}

async function fetchTextCached(url, cacheDir = null) {
  const response = await fetchWithRetry(url, { headers: { Accept: 'text/html' } })
  const text = await response.text()

  if (cacheDir) {
    const safeName = url
      .replace(/^https?:\/\//, '')
      .replace(/[^a-zA-Z0-9._-]+/g, '_')
      .replace(/^_+|_+$/g, '')
    await writeText(path.join(cacheDir, `${safeName}.html`), text)
  }

  return text
}

function fallbackBookIdForChapterUrl(url) {
  const match = String(url).match(/\/chapter\/([^/]+)\//)
  return `Thaqalayn-Volume-${match?.[1] || 'unknown'}`
}

function buildBookInfoFromFallback(bookId, sample, currentBooksById) {
  const current = currentBooksById.get(bookId)
  if (current) return current
  return {
    bookId,
    BookName: sample?.book || bookId,
    author: '',
    idRangeMin: 1,
    idRangeMax: 0,
    bookDescription: '',
    bookCover: '',
    englishName: sample?.book || bookId,
    translator: '',
    volume: sample?.volume || 1,
  }
}

async function main() {
  const dryRun = hasFlag('--dry-run')
  const generateRelease = hasFlag('--generate-release')
  const keepRaw = hasFlag('--keep-raw')
  const limit = Number(getArg('--limit', '0'))
  const concurrency = Number(getArg('--concurrency', '2'))
  const runId = getArg('--run-id', todayRunId())
  const crawlDir = path.join(DATA_ROOT, 'crawls', runId)
  const rawDir = keepRaw || !generateRelease ? path.join(crawlDir, 'raw') : null

  await emptyDir(crawlDir)
  const robots = await assertRobotsAllowsSearch()
  await writeText(path.join(crawlDir, 'robots.txt'), robots)

  const sitemapXml = await fetchWithRetry(`${THAQALAYN_ORIGIN}/sitemap.xml`, {
    headers: { Accept: 'application/xml,text/xml' },
  }).then((response) => response.text())
  await writeText(path.join(crawlDir, 'sitemap.xml'), sitemapXml)

  const sitemap = parseSitemap(sitemapXml)
  const chapterUrls = limit > 0 ? sitemap.chapterUrls.slice(0, limit) : sitemap.chapterUrls
  const bookUrls = sitemap.bookUrls

  if (dryRun && !generateRelease) {
    await writeJson(path.join(crawlDir, 'crawl-report.json'), {
      runId,
      dryRun: true,
      counts: {
        sitemapUrls: sitemap.urls.length,
        bookUrls: bookUrls.length,
        chapterUrls: sitemap.chapterUrls.length,
        selectedChapterUrls: chapterUrls.length,
      },
    })
    process.stdout.write(
      `Dry run OK: ${bookUrls.length} book URLs, ${sitemap.chapterUrls.length} chapter URLs.\n`,
    )
    return
  }

  const runLimited = makeConcurrency(concurrency)
  const bookReports = []
  await Promise.all(
    bookUrls.map((url) =>
      runLimited(async () => {
        const html = await fetchTextCached(url, rawDir)
        bookReports.push({ url, ...parseBookPage(html, url) })
      }),
    ),
  )

  const legacyContext = await loadCurrentLegacyContext()
  const currentBooksById = await loadCurrentBooksById()
  const bookIdByTitleAndVolume = buildBookIdByTitleAndVolume(currentBooksById)

  // The crawler maps freshly scraped hadiths back onto the blessed dataset's
  // legacy book ids via this map. An empty map means every hadith would fall
  // back to a synthetic Thaqalayn-Volume-* id, producing a garbage release —
  // fail fast instead of silently shipping that as a candidate.
  if (generateRelease && Object.keys(legacyContext.bySourceUrl).length === 0) {
    throw new Error(
      'Legacy source-URL map is empty; refusing to generate a release. ' +
        'Verify public/data/thaqalayn/current points at a runtime dataset with lookup.json.',
    )
  }

  const volumeMap = new Map()
  const warnings = []

  await Promise.all(
    chapterUrls.map((url) =>
      runLimited(async () => {
        const html = await fetchTextCached(url, rawDir)
        let parsed
        try {
          parsed = parseChapterPage(html, url)
        } catch (error) {
          warnings.push({ url, warning: `Failed to parse chapter page: ${error.message}` })
          return
        }
        warnings.push(...parsed.warnings.map((warning) => ({ url, warning })))

        for (const websiteHadith of parsed.hadiths) {
          const sourceUrl = `${url.replace('/chapter/', '/hadith/')}/${websiteHadith.number}`
          const candidateBookId = resolveBookIdFromMetadata(parsed.meta, bookIdByTitleAndVolume)
          const legacyRef = resolveLegacyRef({ sourceUrl, candidateBookId, legacyContext })
          const fallbackBookId =
            legacyRef?.bookId || candidateBookId || fallbackBookIdForChapterUrl(url)
          const legacyHadith = websiteHadithToLegacyShape({
            hadith: websiteHadith,
            meta: parsed.meta,
            sourceUrl: url,
            legacyRef,
            fallbackBookId,
          })
          if (!readableText(legacyHadith)) {
            warnings.push({ url: sourceUrl, warning: 'Skipped hadith with no readable text' })
            continue
          }
          const bucket = volumeMap.get(legacyHadith.bookId) || []
          bucket.push(legacyHadith)
          volumeMap.set(legacyHadith.bookId, bucket)
        }
      }),
    ),
  )

  for (const [bookId, hadiths] of volumeMap) {
    reassignGeneratedHadithIds(bookId, hadiths, legacyContext, warnings)
    hadiths.sort((a, b) => a.id - b.id)
    const maxId = Math.max(...hadiths.map((hadith) => hadith.id), 0)
    const book = buildBookInfoFromFallback(bookId, hadiths[0], currentBooksById)
    book.idRangeMax = Math.max(book.idRangeMax || 0, maxId)
    currentBooksById.set(bookId, book)
  }

  const booksRaw = [...currentBooksById.values()].filter((book) => volumeMap.has(book.bookId))
  const volumeEntries = [...volumeMap.entries()].map(([bookId, hadiths]) => ({
    fileName: `${bookId}.json`,
    bookId,
    hadiths,
  }))

  await writeJson(path.join(crawlDir, 'crawl-report.json'), {
    runId,
    generatedAt: new Date().toISOString(),
    source: THAQALAYN_ORIGIN,
    counts: {
      sitemapUrls: sitemap.urls.length,
      bookUrls: bookUrls.length,
      chapterUrls: sitemap.chapterUrls.length,
      selectedChapterUrls: chapterUrls.length,
      parsedVolumes: volumeEntries.length,
      parsedHadiths: volumeEntries.reduce((sum, entry) => sum + entry.hadiths.length, 0),
    },
    warnings,
    bookReports: bookReports.map((report) => ({
      sourceUrl: report.sourceUrl,
      title: report.title,
      chapterLinkCount: report.chapterLinks.length,
      warnings: report.warnings,
    })),
  })

  if (!generateRelease) {
    process.stdout.write(
      `Crawl captured at ${crawlDir}. Use --generate-release to publish artifacts.\n`,
    )
    return
  }

  if (volumeEntries.length === 0) {
    throw new Error('Crawler parsed no volumes; refusing to generate release')
  }

  // Only flip the blessed public "current" dataset when auto-publish is
  // explicitly enabled. By default the crawl produces a reviewable candidate
  // release (written under data/thaqalayn/releases) without replacing the
  // served data, so tests/validation/build keep running against the blessed
  // dataset and a human blesses the candidate via the PR.
  const autoPublish = process.env.DATA_AUTO_PUBLISH === 'true'
  const version = getArg('--version', `website-${runId.slice(0, 10)}`)
  const { manifest, releaseDir } = await generateReleaseFromLegacy({
    version,
    booksRaw,
    volumeEntries,
    publishCurrent: autoPublish,
    source: {
      kind: 'thaqalayn-website-crawl',
      url: THAQALAYN_ORIGIN,
      commitSha: null,
      license: 'Thaqalayn website terms and robots/content signals',
      notes: [
        'Discovered from sitemap.xml.',
        'Parsed from rendered Next page data.',
        'Legacy IDs were mapped from the previous blessed dataset when possible.',
      ],
    },
  })
  process.stdout.write(
    autoPublish
      ? 'Auto-publish enabled: blessed current dataset was updated.\n'
      : 'Auto-publish disabled: generated a candidate release without changing the served dataset.\n',
  )

  if (!keepRaw) {
    await fs.rm(crawlDir, { recursive: true, force: true })
  }

  process.stdout.write(
    `Generated ${manifest.version} from website crawl with ${manifest.counts.hadiths} hadiths.\n`,
  )

  const unresolved = manifest.counts.hadiths
    ? volumeEntries
        .flatMap((entry) => entry.hadiths)
        .filter(
          (hadith) =>
            parseThaqalaynHadithUrl(hadith.URL) && hadith.bookId.startsWith('Thaqalayn-Volume-'),
        ).length
    : 0
  if (unresolved > 0) {
    process.stdout.write(
      `Warning: ${unresolved} hadiths used fallback volume IDs and require review before auto-publish.\n`,
    )
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
