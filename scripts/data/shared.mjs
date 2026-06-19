import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export const REPO_ROOT = path.resolve(__dirname, '../..')
export const DATA_ROOT = path.join(REPO_ROOT, 'data', 'thaqalayn')
export const RELEASES_ROOT = path.join(DATA_ROOT, 'releases')
export const PUBLIC_DATA_ROOT = path.join(REPO_ROOT, 'public', 'data', 'thaqalayn')
export const PUBLIC_CURRENT_ROOT = path.join(PUBLIC_DATA_ROOT, 'current')
export const CURRENT_POINTER_PATH = path.join(DATA_ROOT, 'current.json')

export const THAQALAYN_ORIGIN = 'https://thaqalayn.net'
export const THAQALAYN_API_ORIGIN = 'https://www.thaqalayn-api.net'
export const GITHUB_DATA_DIR =
  'https://github.com/MohammedArab1/ThaqalaynAPI/tree/main/V2/ThaqalaynData'

export const DATA_USER_AGENT =
  'SaadahLibraryDataUpdater/1.0 (+https://github.com/; contact: maintainers)'

const ARABIC_DIACRITICS = /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u08D3-\u08FF]/g

export function normalizeArabic(text = '') {
  return String(text)
    .normalize('NFKD')
    .replace(ARABIC_DIACRITICS, '')
    .replace(/[إأآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/\s+/g, ' ')
    .trim()
}

export function normalizeEnglish(text = '') {
  return String(text).toLowerCase().replace(/\s+/g, ' ').trim()
}

export function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex')
}

export async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, 'utf8'))
}

export async function writeJson(filePath, data) {
  await fs.mkdir(path.dirname(filePath), { recursive: true })
  await fs.writeFile(filePath, `${JSON.stringify(data)}\n`, 'utf8')
}

export async function writeText(filePath, text) {
  await fs.mkdir(path.dirname(filePath), { recursive: true })
  await fs.writeFile(filePath, text, 'utf8')
}

export async function pathExists(filePath) {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

export async function emptyDir(dirPath) {
  await fs.rm(dirPath, { recursive: true, force: true })
  await fs.mkdir(dirPath, { recursive: true })
}

export async function copyDir(source, destination) {
  await fs.rm(destination, { recursive: true, force: true })
  await fs.mkdir(path.dirname(destination), { recursive: true })
  await fs.cp(source, destination, { recursive: true })
}

export async function listFiles(dirPath, predicate = () => true) {
  const result = []

  async function visit(current) {
    const entries = await fs.readdir(current, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = path.join(current, entry.name)
      if (entry.isDirectory()) {
        await visit(fullPath)
      } else if (predicate(fullPath)) {
        result.push(fullPath)
      }
    }
  }

  if (await pathExists(dirPath)) await visit(dirPath)
  return result.sort()
}

export async function fileChecksums(rootDir) {
  const files = await listFiles(rootDir)
  const checksums = {}
  for (const filePath of files) {
    const rel = path.relative(rootDir, filePath).replace(/\\/g, '/')
    checksums[rel] = sha256(await fs.readFile(filePath))
  }
  return checksums
}

export function parseThaqalaynHadithUrl(url) {
  if (!url) return null
  let pathname = String(url)
  try {
    pathname = new URL(url).pathname
  } catch {
    // Already a path.
  }

  const match = pathname.match(/^\/hadith\/([^/]+)\/([^/]+)\/([^/]+)\/([^/]+)$/)
  if (!match) return null

  return {
    pathname,
    volumePointer: match[1],
    sectionNumber: Number(match[2]),
    chapterNumber: Number(match[3]),
    hadithNumber: Number(match[4]),
    chapterPath: `/chapter/${match[1]}/${match[2]}/${match[3]}`,
  }
}

export function getChapterPathFromHadith(hadith) {
  const parsed = parseThaqalaynHadithUrl(hadith.URL || hadith.sourceUrl)
  if (parsed) return parsed.chapterPath
  return `/legacy/${hadith.bookId}/${hadith.categoryId}/${hadith.chapterInCategoryId}`
}

export function getWorkKeyFromLegacyBookId(bookId) {
  const match = String(bookId).match(/^(.*)-Volume-\d+-[^-]+$/)
  return match ? match[1] : String(bookId)
}

export function getVolumeNumberFromLegacyBookId(bookId, fallback = 1) {
  const match = String(bookId).match(/-Volume-(\d+)-/)
  return match ? Number(match[1]) : Number(fallback || 1)
}

export function stableVersion(prefix, sourceId) {
  return `${prefix}-${String(sourceId).slice(0, 12)}`
}

export async function fetchWithRetry(url, options = {}, retries = 3) {
  let lastError
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'User-Agent': DATA_USER_AGENT,
          Accept: 'application/json,text/html,application/xml,text/xml,*/*',
          ...options.headers,
        },
      })
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText} for ${url}`)
      }
      return response
    } catch (error) {
      lastError = error
      if (attempt === retries) break
      await new Promise((resolve) => setTimeout(resolve, 500 * 2 ** attempt))
    }
  }
  throw lastError
}

export function makeConcurrency(limit) {
  const queue = []
  let active = 0

  function next() {
    active--
    const pending = queue.shift()
    if (pending) pending()
  }

  return async function run(task) {
    if (active >= limit) {
      await new Promise((resolve) => queue.push(resolve))
    }
    active++
    try {
      return await task()
    } finally {
      next()
    }
  }
}
