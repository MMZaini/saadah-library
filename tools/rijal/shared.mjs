import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export const REPO_ROOT = path.resolve(__dirname, '../..')
export const RIJAL_ROOT = path.join(REPO_ROOT, 'data', 'rijal', 'khoei')
export const RIJAL_RELEASES_ROOT = path.join(RIJAL_ROOT, 'releases')
export const RIJAL_CURRENT_POINTER = path.join(RIJAL_ROOT, 'current.json')

export const ABLIBRARY_ORIGIN = 'https://v4.ablibrary.net'
export const ABLIBRARY_GRPC_ORIGIN = 'https://grpc.ablibrary.net'
export const KHOEI_TITLE_AR = 'معجم رجال الحديث'
export const KHOEI_AUTHOR_AR = 'السيد أبو القاسم الخوئي'
export const EXPECTED_VOLUME_COUNT = 24

export const DATA_USER_AGENT =
  'SaadahLibraryRijalDataUpdater/1.0 (+https://github.com/; contact: maintainers)'

const ARABIC_DIACRITICS = /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u08D3-\u08FF]/g
const EASTERN_DIGITS = '٠١٢٣٤٥٦٧٨٩'
const PERSIAN_DIGITS = '۰۱۲۳۴۵۶۷۸۹'

export function normalizeArabic(text = '') {
  return String(text)
    .toLowerCase()
    .normalize('NFKD')
    .replace(ARABIC_DIACRITICS, '')
    .replace(/ـ/g, '')
    .replace(/[إأآٱ]/g, 'ا')
    .replace(/[ىی]/g, 'ي')
    .replace(/ک/g, 'ك')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/[^\p{Script=Arabic}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function normalizeArabicForId(text = '') {
  return normalizeArabic(text).replace(/\s+/g, '-').replace(/^-|-$/g, '')
}

export function normalizeArabicDigit(value) {
  const text = String(value)
  let out = ''
  for (const char of text) {
    const eastern = EASTERN_DIGITS.indexOf(char)
    if (eastern !== -1) {
      out += String(eastern)
      continue
    }
    const persian = PERSIAN_DIGITS.indexOf(char)
    if (persian !== -1) {
      out += String(persian)
      continue
    }
    out += char
  }
  return out
}

export function parseArabicNumber(value) {
  const normalized = normalizeArabicDigit(value).match(/\d+/)?.[0]
  return normalized ? Number(normalized) : undefined
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

export async function listFiles(dirPath, predicate = () => true) {
  const files = []

  async function visit(current) {
    const entries = await fs.readdir(current, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = path.join(current, entry.name)
      if (entry.isDirectory()) await visit(fullPath)
      else if (predicate(fullPath)) files.push(fullPath)
    }
  }

  if (await pathExists(dirPath)) await visit(dirPath)
  return files.sort()
}

export async function fileChecksums(rootDir) {
  const checksums = {}
  const files = await listFiles(rootDir)
  for (const filePath of files) {
    const rel = path.relative(rootDir, filePath).replace(/\\/g, '/')
    checksums[rel] = sha256(await fs.readFile(filePath))
  }
  return checksums
}

export async function fetchWithRetry(url, options = {}, retries = 3) {
  let lastError
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'User-Agent': DATA_USER_AGENT,
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
    if (active >= limit) await new Promise((resolve) => queue.push(resolve))
    active++
    try {
      return await task()
    } finally {
      next()
    }
  }
}

export function stableVersion(prefix, payload) {
  return `${prefix}-${sha256(JSON.stringify(payload)).slice(0, 12)}`
}
