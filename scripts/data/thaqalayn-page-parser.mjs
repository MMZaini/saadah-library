const SCRIPT_PUSH_RE = /self\.__next_f\.push\(\[1,"((?:\\.|[^"\\])*)"\]\)/g

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
  return JSON.parse(raw)
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
  const joined = chunks.join('\n')
  const hadiths = extractJsonValueAfter(joined, '"hadiths":') || []

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

export function parseSitemap(xmlText) {
  const urls = [...xmlText.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1])
  return {
    urls,
    bookUrls: urls.filter((url) => /\/book\/[^/]+$/.test(url)),
    chapterUrls: urls.filter((url) => /\/chapter\/[^/]+\/[^/]+\/[^/]+$/.test(url)),
  }
}

export function websiteHadithToLegacyShape({ hadith, meta, sourceUrl, legacyRef, fallbackBookId }) {
  const hadithNumber = Number(hadith.number ?? hadith.hadithNumber ?? hadith.id)
  const bookId = legacyRef?.bookId || fallbackBookId
  const id = Number(legacyRef?.id ?? hadith.number_by_book ?? hadithNumber)
  const url = `${sourceUrl.replace(/\/chapter\//, '/hadith/')}/${hadithNumber}`

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
  }
}
