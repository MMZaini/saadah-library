const SCRIPT_PUSH_RE = /self\.__next_f\.push\(\[1,"((?:\\.|[^"\\])*)"\]\)/g
const FLIGHT_TEXT_REF_RE = /^\$[0-9a-f]+$/i
const FLIGHT_TEXT_RECORD_RE = /([0-9a-f]+):T([0-9a-f]+),/gi

function decodeFlightString(raw) {
  try {
    return JSON.parse(`"${raw}"`)
  } catch {
    return ''
  }
}

export function extractFlightStrings(html) {
  const chunks = []
  for (const match of html.matchAll(SCRIPT_PUSH_RE)) {
    const decoded = decodeFlightString(match[1])
    if (decoded) chunks.push(decoded)
  }
  return chunks
}

function utf8ByteLengthAt(source, index) {
  const codePoint = source.codePointAt(index)
  if (codePoint <= 0x7f) return { bytes: 1, width: 1 }
  if (codePoint <= 0x7ff) return { bytes: 2, width: 1 }
  if (codePoint <= 0xffff) return { bytes: 3, width: 1 }
  return { bytes: 4, width: 2 }
}

function sliceByUtf8ByteLength(source, startIndex, byteLength) {
  let bytes = 0
  let index = startIndex

  while (index < source.length && bytes < byteLength) {
    const next = utf8ByteLengthAt(source, index)
    bytes += next.bytes
    index += next.width
  }

  return source.slice(startIndex, index)
}

export function extractFlightTextReferences(source) {
  const refs = new Map()

  for (const match of source.matchAll(FLIGHT_TEXT_RECORD_RE)) {
    const previous = match.index > 0 ? source[match.index - 1] : ''
    if (previous && /[A-Za-z0-9_$]/.test(previous)) continue

    const id = match[1]
    const byteLength = Number.parseInt(match[2], 16)
    if (!Number.isFinite(byteLength)) continue

    const start = match.index + match[0].length
    refs.set(`$${id}`, sliceByUtf8ByteLength(source, start, byteLength))
  }

  return refs
}

function resolveFlightTextReference(value, textRefs) {
  if (typeof value !== 'string' || !FLIGHT_TEXT_REF_RE.test(value)) return value
  return textRefs.get(value) ?? value
}

function resolveHadithTextReferences(hadith, textRefs) {
  return {
    ...hadith,
    text_en: resolveFlightTextReference(hadith.text_en, textRefs),
    text_ar: resolveFlightTextReference(hadith.text_ar, textRefs),
    summary_en: resolveFlightTextReference(hadith.summary_en, textRefs),
    summary_ar: resolveFlightTextReference(hadith.summary_ar, textRefs),
  }
}

function readJsonValue(source, startIndex) {
  const open = source[startIndex]
  const close = open === '[' ? ']' : '}'
  let depth = 0
  let inString = false
  let escaped = false

  for (let i = startIndex; i < source.length; i++) {
    const ch = source[i]
    if (inString) {
      if (escaped) {
        escaped = false
      } else if (ch === '\\') {
        escaped = true
      } else if (ch === '"') {
        inString = false
      }
      continue
    }

    if (ch === '"') {
      inString = true
    } else if (ch === open) {
      depth++
    } else if (ch === close) {
      depth--
      if (depth === 0) {
        return source.slice(startIndex, i + 1)
      }
    }
  }

  return null
}

// Escapes raw control characters (U+0000–U+001F) that appear *inside* JSON
// string literals. Strict JSON forbids unescaped control characters in strings,
// but rendered/streamed payloads can occasionally contain them. Control
// characters outside of strings (structural whitespace) are left untouched.
function escapeControlCharsInJsonStrings(raw) {
  let result = ''
  let inString = false
  let escaped = false

  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i]
    if (inString) {
      if (escaped) {
        escaped = false
        result += ch
        continue
      }
      if (ch === '\\') {
        escaped = true
        result += ch
        continue
      }
      if (ch === '"') {
        inString = false
        result += ch
        continue
      }
      const code = raw.charCodeAt(i)
      if (code < 0x20) {
        const SHORT = { 8: '\\b', 9: '\\t', 10: '\\n', 12: '\\f', 13: '\\r' }
        result += SHORT[code] || `\\u${code.toString(16).padStart(4, '0')}`
        continue
      }
      result += ch
      continue
    }

    if (ch === '"') inString = true
    result += ch
  }

  return result
}

export function extractJsonValueAfter(source, token) {
  const tokenIndex = source.indexOf(token)
  if (tokenIndex === -1) return null
  const valueStart = source.indexOf(token.endsWith(':') ? '' : ':', tokenIndex)
  const startSearch = token.endsWith(':') ? tokenIndex + token.length : valueStart + 1
  const arrayStart = source.slice(startSearch).search(/[\[{]/)
  if (arrayStart === -1) return null
  const start = startSearch + arrayStart
  const raw = readJsonValue(source, start)
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    // Safety net: tolerate stray raw control characters inside string literals.
    return JSON.parse(escapeControlCharsInJsonStrings(raw))
  }
}

function extractScalar(source, key) {
  const match = source.match(new RegExp(`"${key}":(?:"([^"]*)"|(-?\\d+)|null)`))
  if (!match) return null
  if (match[1] !== undefined) return match[1]
  if (match[2] !== undefined) return Number(match[2])
  return null
}

export function parseChapterPage(html, sourceUrl = null) {
  const chunks = extractFlightStrings(html)
  // Flight chunks are pieces of one continuous RSC stream split at arbitrary
  // byte boundaries; concatenate them directly. Joining with a separator would
  // inject characters into values that straddle a chunk boundary (a separating
  // newline lands inside a string literal and breaks JSON.parse).
  const joined = chunks.join('')
  const textRefs = extractFlightTextReferences(joined)
  const hadiths = (extractJsonValueAfter(joined, '"hadiths":') || []).map((hadith) =>
    resolveHadithTextReferences(hadith, textRefs),
  )

  return {
    sourceUrl,
    meta: {
      chapterName: extractScalar(joined, 'chapterName'),
      bookName: extractScalar(joined, 'bookName'),
      volumeNumber: extractScalar(joined, 'volumeNumber'),
      bookSectionNumber: extractScalar(joined, 'bookSectionNumber'),
      chapterNumber: extractScalar(joined, 'chapterNumber'),
      urlPointer: extractScalar(joined, 'urlPointer'),
    },
    hadiths,
    warnings: hadiths.length === 0 ? ['No hadiths array found in chapter page'] : [],
  }
}

export function deriveFallbackHadithIdFromSourceUrl(url) {
  if (!url) return null
  let pathname = String(url)
  try {
    pathname = new URL(url).pathname
  } catch {
    // Already a path.
  }

  const match = pathname.match(/^\/hadith\/[^/]+\/(\d+)\/(\d+)\/(\d+)$/)
  if (!match) return null

  const [, sectionNumber, chapterNumber, hadithNumber] = match.map(Number)
  const id = sectionNumber * 10_000_000 + chapterNumber * 10_000 + hadithNumber
  return Number.isSafeInteger(id) ? id : null
}

export function parseBookPage(html, sourceUrl = null) {
  const titleMatch = html.match(/<title>(.*?)<\/title>/)
  const chapterLinks = [...html.matchAll(/href="(\/chapter\/[^"]+)"/g)]
    .map((match) => match[1])
    .filter((value, index, array) => array.indexOf(value) === index)

  return {
    sourceUrl,
    title: titleMatch?.[1] ?? null,
    chapterLinks,
    warnings: chapterLinks.length === 0 ? ['No chapter links found in book page'] : [],
  }
}

export function classifySitemapUrls(urls) {
  return {
    urls,
    bookUrls: urls.filter((url) => /\/book\/[^/]+$/.test(url)),
    chapterUrls: urls.filter((url) => /\/chapter\/[^/]+\/[^/]+\/[^/]+$/.test(url)),
  }
}

export function parseSitemap(xmlText) {
  return classifySitemapUrls([...xmlText.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]))
}

/**
 * Sitemap URLs declared via `Sitemap:` directives in robots.txt. The site
 * replaced its single /sitemap.xml (now a 404) with split per-content
 * sitemaps that are only discoverable through these directives.
 */
export function parseRobotsSitemapUrls(robotsText, origin) {
  const urls = new Set()
  for (const match of String(robotsText || '').matchAll(/^\s*sitemap:\s*(\S+)/gim)) {
    try {
      urls.add(new URL(match[1], origin).href)
    } catch {
      // Ignore malformed directives.
    }
  }
  return [...urls]
}

/** True for a <sitemapindex> document (whose <loc> entries are more sitemaps). */
export function isSitemapIndex(xmlText) {
  return /<sitemapindex[\s>]/i.test(String(xmlText || ''))
}

export function websiteHadithToLegacyShape({ hadith, meta, sourceUrl, legacyRef, fallbackBookId }) {
  const hadithNumber = Number(hadith.number ?? hadith.hadithNumber ?? hadith.id)
  const bookId = legacyRef?.bookId || fallbackBookId
  const url = `${sourceUrl.replace(/\/chapter\//, '/hadith/')}/${hadithNumber}`
  const id = Number(
    legacyRef?.id ??
      hadith.number_by_book ??
      deriveFallbackHadithIdFromSourceUrl(url) ??
      hadithNumber,
  )

  const majlisi = (hadith.gradings || []).find((grading) =>
    String(grading?.author?.name_en || '')
      .toLowerCase()
      .includes('majlisi'),
  )
  const behbudi = (hadith.gradings || []).find((grading) =>
    String(grading?.author?.name_en || '')
      .toLowerCase()
      .includes('behbudi'),
  )
  const mohseni = (hadith.gradings || []).find((grading) =>
    String(grading?.author?.name_en || '')
      .toLowerCase()
      .includes('mohseni'),
  )

  return {
    id,
    bookId,
    book: meta.bookName || bookId,
    volume: Number(meta.volumeNumber || 1),
    category: meta.chapterName || 'Uncategorized',
    categoryId: String(meta.bookSectionNumber ?? ''),
    chapter: meta.chapterName || 'No Chapter',
    author: '',
    translator: '',
    englishText: hadith.text_en || '',
    arabicText: hadith.text_ar || '',
    frenchText: '',
    URL: url,
    mohseniGrading: mohseni?.grade_en || mohseni?.grade_ar || '',
    behbudiGrading: behbudi?.grade_en || behbudi?.grade_ar || '',
    majlisiGrading: majlisi?.grade_en || majlisi?.grade_ar || '',
    chapterInCategoryId: Number(meta.chapterNumber ?? 0),
    thaqalaynSanad: '',
    thaqalaynMatn: '',
    gradingsFull: hadith.gradings || [],
    sourceHadithId: hadith.id,
    legacyMatched: Boolean(legacyRef),
  }
}
