#!/usr/bin/env node
import path from 'node:path'
import {
  DATA_ROOT,
  PUBLIC_CURRENT_ROOT,
  THAQALAYN_ORIGIN,
  copyDir,
  emptyDir,
  fetchWithRetry,
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

async function loadCurrentLegacyMap() {
  const lookupPath = path.join(PUBLIC_CURRENT_ROOT, 'runtime', 'lookup.json')
  try {
    const lookup = await readJson(lookupPath)
    return lookup.bySourceUrl || {}
  } catch {
    return {}
  }
}

async function loadCurrentBooksById() {
  const booksPath = path.join(PUBLIC_CURRENT_ROOT, 'runtime', 'books.json')
  try {
    const books = await readJson(booksPath)
    return new Map(books.map((book) => [book.bookId, book]))
  } catch {
    return new Map()
  }
}

async function fetchTextCached(url, cacheDir) {
  const safeName = url
    .replace(/^https?:\/\//, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '_')
    .replace(/^_+|_+$/g, '')
  const filePath = path.join(cacheDir, `${safeName}.html`)
  const response = await fetchWithRetry(url, { headers: { Accept: 'text/html' } })
  const text = await response.text()
  await writeText(filePath, text)
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
  const limit = Number(getArg('--limit', '0'))
  const concurrency = Number(getArg('--concurrency', '2'))
  const runId = getArg('--run-id', todayRunId())
  const crawlDir = path.join(DATA_ROOT, 'crawls', runId)
  const rawDir = path.join(crawlDir, 'raw')

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

  const legacyBySourceUrl = await loadCurrentLegacyMap()
  const currentBooksById = await loadCurrentBooksById()
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
          const legacyRef = legacyBySourceUrl[sourceUrl]
          const fallbackBookId = legacyRef?.bookId || fallbackBookIdForChapterUrl(url)
          const legacyHadith = websiteHadithToLegacyShape({
            hadith: websiteHadith,
            meta: parsed.meta,
            sourceUrl: url,
            legacyRef,
            fallbackBookId,
          })
          const bucket = volumeMap.get(legacyHadith.bookId) || []
          bucket.push(legacyHadith)
          volumeMap.set(legacyHadith.bookId, bucket)
        }
      }),
    ),
  )

  for (const [bookId, hadiths] of volumeMap) {
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

  const version = getArg('--version', `website-${runId.slice(0, 10)}`)
  const { manifest, releaseDir } = await generateReleaseFromLegacy({
    version,
    booksRaw,
    volumeEntries,
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

  await copyDir(crawlDir, path.join(releaseDir, 'crawl'))
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
