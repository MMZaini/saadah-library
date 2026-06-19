import fs from 'node:fs/promises'
import path from 'node:path'
import {
  CURRENT_POINTER_PATH,
  PUBLIC_CURRENT_ROOT,
  RELEASES_ROOT,
  THAQALAYN_ORIGIN,
  copyDir,
  emptyDir,
  fileChecksums,
  getChapterPathFromHadith,
  getVolumeNumberFromLegacyBookId,
  getWorkKeyFromLegacyBookId,
  normalizeArabic,
  normalizeEnglish,
  parseThaqalaynHadithUrl,
  sha256,
  writeJson,
  writeText,
} from './shared.mjs'

function coerceString(value, fallback = '') {
  if (value === null || value === undefined) return fallback
  return String(value)
}

function coerceNumber(value, fallback = 0) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

function localizeCover(value) {
  const cover = coerceString(value)
  const match = cover.match(/^https:\/\/thaqalayn\.net\/css\/images\/([^/?#]+)$/)
  return match ? `/covers/${match[1]}` : cover
}

function normalizeLegacyBookInfo(book, index) {
  const bookId = coerceString(book.bookId, `Unknown-Book-${index + 1}`)
  return {
    bookId,
    BookName: coerceString(book.BookName || book.book || book.englishName || bookId, bookId),
    author: coerceString(book.author),
    idRangeMin: coerceNumber(book.idRangeMin, 1),
    idRangeMax: coerceNumber(book.idRangeMax),
    bookDescription: coerceString(book.bookDescription),
    bookCover: localizeCover(book.bookCover),
    englishName: coerceString(book.englishName || book.BookName || bookId, bookId),
    translator: coerceString(book.translator),
    volume: coerceNumber(book.volume, getVolumeNumberFromLegacyBookId(bookId, 1)),
  }
}

function normalizeGrading(grading) {
  return {
    grade_en: grading?.grade_en ?? null,
    grade_ar: grading?.grade_ar ?? null,
    reference_en: coerceString(grading?.reference_en),
    author: {
      name_en: coerceString(grading?.author?.name_en),
      name_ar: grading?.author?.name_ar ?? null,
      link: grading?.author?.link ?? null,
      death_date: grading?.author?.death_date ?? null,
    },
  }
}

export function normalizeLegacyHadith(rawHadith, bookInfo) {
  const bookId = coerceString(rawHadith.bookId || bookInfo.bookId)
  const id = coerceNumber(rawHadith.id || rawHadith.number || rawHadith.hadithNumber)
  const parsedUrl = parseThaqalaynHadithUrl(rawHadith.URL || rawHadith.sourceUrl)
  const categoryId = coerceString(rawHadith.categoryId ?? parsedUrl?.sectionNumber ?? '')
  const chapterInCategoryId = coerceNumber(
    rawHadith.chapterInCategoryId ?? parsedUrl?.chapterNumber,
  )

  return {
    _id: coerceString(rawHadith._id, `${bookId}:${id}`),
    id,
    bookId,
    book: coerceString(rawHadith.book || bookInfo.BookName || bookInfo.englishName || bookId),
    category: coerceString(rawHadith.category || rawHadith.sectionName || 'Uncategorized'),
    categoryId,
    chapter: coerceString(rawHadith.chapter || rawHadith.chapterName || 'No Chapter'),
    author: coerceString(rawHadith.author || bookInfo.author),
    translator: coerceString(rawHadith.translator || bookInfo.translator),
    englishText: coerceString(rawHadith.englishText || rawHadith.text_en),
    arabicText: coerceString(rawHadith.arabicText || rawHadith.text_ar),
    majlisiGrading: coerceString(rawHadith.majlisiGrading),
    URL: coerceString(rawHadith.URL || rawHadith.sourceUrl),
    volume: coerceNumber(rawHadith.volume, bookInfo.volume),
    frenchText: coerceString(rawHadith.frenchText),
    mohseniGrading: coerceString(rawHadith.mohseniGrading),
    behbudiGrading: coerceString(rawHadith.behbudiGrading),
    chapterInCategoryId,
    thaqalaynSanad: coerceString(rawHadith.thaqalaynSanad),
    thaqalaynMatn: coerceString(rawHadith.thaqalaynMatn),
    gradingsFull: Array.isArray(rawHadith.gradingsFull)
      ? rawHadith.gradingsFull.map(normalizeGrading)
      : Array.isArray(rawHadith.gradings)
        ? rawHadith.gradings.map(normalizeGrading)
        : [],
    __v: coerceNumber(rawHadith.__v),
  }
}

function buildStructureFromHadiths(hadiths) {
  const structure = {}

  for (const hadith of hadiths) {
    const categoryKey = hadith.category || 'Uncategorized'
    const chapterKey = hadith.chapter || 'No Chapter'

    structure[categoryKey] ??= {
      category: categoryKey,
      categoryId: hadith.categoryId || '',
      chapters: {},
      totalHadiths: 0,
      sourceChapterKeys: [],
    }

    structure[categoryKey].chapters[chapterKey] ??= {
      chapter: chapterKey,
      chapterInCategoryId: hadith.chapterInCategoryId || 0,
      hadithCount: 0,
      sourceChapterKey: getChapterPathFromHadith(hadith),
      bookId: hadith.bookId,
      volume: hadith.volume,
    }

    structure[categoryKey].chapters[chapterKey].hadithCount++
    structure[categoryKey].totalHadiths++
    const sourceChapterKey = getChapterPathFromHadith(hadith)
    if (!structure[categoryKey].sourceChapterKeys.includes(sourceChapterKey)) {
      structure[categoryKey].sourceChapterKeys.push(sourceChapterKey)
    }
  }

  for (const category of Object.values(structure)) {
    category.chapters = Object.fromEntries(
      Object.entries(category.chapters).sort(
        ([, a], [, b]) => a.chapterInCategoryId - b.chapterInCategoryId,
      ),
    )
  }

  return structure
}

function mergeStructures(volumeIds, structureByVolume) {
  const merged = {}

  for (const volumeId of volumeIds) {
    const structure = structureByVolume.get(volumeId)
    if (!structure) continue

    for (const [categoryKey, category] of Object.entries(structure)) {
      merged[categoryKey] ??= {
        category: category.category,
        categoryId: category.categoryId,
        chapters: {},
        totalHadiths: 0,
        sourceChapterKeys: [],
      }

      merged[categoryKey].totalHadiths += category.totalHadiths
      for (const key of category.sourceChapterKeys || []) {
        if (!merged[categoryKey].sourceChapterKeys.includes(key)) {
          merged[categoryKey].sourceChapterKeys.push(key)
        }
      }

      for (const [chapterKey, chapter] of Object.entries(category.chapters)) {
        const mergedKey = `${volumeId}:${chapterKey}`
        merged[categoryKey].chapters[mergedKey] = {
          ...chapter,
          bookId: volumeId,
        }
      }
    }
  }

  return merged
}

function buildCanonicalBooks(bookInfos) {
  const workMap = new Map()
  const volumes = []

  for (const book of bookInfos) {
    const workKey = getWorkKeyFromLegacyBookId(book.bookId)
    const work = workMap.get(workKey) ?? {
      id: workKey,
      title: book.BookName,
      englishName: book.englishName,
      author: book.author,
      description: book.bookDescription,
      cover: book.bookCover,
      volumeIds: [],
      legacyBookIds: [],
    }

    work.volumeIds.push(book.bookId)
    work.legacyBookIds.push(book.bookId)
    workMap.set(workKey, work)

    volumes.push({
      id: book.bookId,
      bookId: workKey,
      legacyBookId: book.bookId,
      volumeNumber: book.volume,
      title: book.BookName,
      englishName: book.englishName,
      translator: book.translator,
      sourcePointer: null,
    })
  }

  return {
    books: [...workMap.values()].sort((a, b) => a.title.localeCompare(b.title)),
    volumes: volumes.sort((a, b) => a.id.localeCompare(b.id)),
  }
}

function buildCanonicalChaptersAndHadiths(volumeHadiths) {
  const chapters = new Map()
  const hadithsByVolume = new Map()

  for (const [bookId, hadiths] of volumeHadiths) {
    const canonicalHadiths = []

    for (const hadith of hadiths) {
      const parsed = parseThaqalaynHadithUrl(hadith.URL)
      const chapterKey = getChapterPathFromHadith(hadith)

      chapters.set(chapterKey, {
        id: chapterKey,
        sourcePath: chapterKey.startsWith('/chapter/') ? chapterKey : null,
        bookId: getWorkKeyFromLegacyBookId(bookId),
        volumeId: bookId,
        legacyBookId: bookId,
        volumePointer: parsed?.volumePointer ?? null,
        sectionNumber: parsed?.sectionNumber ?? coerceNumber(hadith.categoryId),
        chapterNumber: parsed?.chapterNumber ?? hadith.chapterInCategoryId,
        categoryId: hadith.categoryId,
        category: hadith.category,
        chapter: hadith.chapter,
      })

      canonicalHadiths.push({
        id: `${bookId}:${hadith.id}`,
        sourceKey: parsed?.pathname || `/legacy/${bookId}/${hadith.id}`,
        sourceUrl: hadith.URL || null,
        bookId: getWorkKeyFromLegacyBookId(bookId),
        volumeId: bookId,
        legacyBookId: bookId,
        legacyHadithId: hadith.id,
        chapterId: chapterKey,
        sourceHadithNumber: parsed?.hadithNumber ?? null,
        englishText: hadith.englishText,
        arabicText: hadith.arabicText,
        sanad: hadith.thaqalaynSanad,
        matn: hadith.thaqalaynMatn,
        gradings: hadith.gradingsFull,
      })
    }

    hadithsByVolume.set(bookId, canonicalHadiths)
  }

  return {
    chapters: [...chapters.values()].sort((a, b) => a.id.localeCompare(b.id)),
    hadithsByVolume,
  }
}

export async function generateReleaseFromLegacy({
  version,
  source,
  booksRaw,
  volumeEntries,
  publishCurrent = true,
}) {
  if (!version) throw new Error('version is required')
  if (!Array.isArray(booksRaw) || booksRaw.length === 0) {
    throw new Error('booksRaw must contain at least one book')
  }
  if (!Array.isArray(volumeEntries) || volumeEntries.length === 0) {
    throw new Error('volumeEntries must contain at least one volume')
  }

  const releaseDir = path.join(RELEASES_ROOT, version)
  const runtimeDir = path.join(releaseDir, 'runtime')
  const canonicalDir = path.join(releaseDir, 'canonical')
  await emptyDir(releaseDir)

  const bookInfos = booksRaw.map(normalizeLegacyBookInfo)
  const bookInfoById = new Map(bookInfos.map((book) => [book.bookId, book]))
  const volumeHadiths = new Map()
  let hadithCount = 0

  for (const entry of volumeEntries) {
    const bookId = entry.bookId
    const bookInfo =
      bookInfoById.get(bookId) ||
      normalizeLegacyBookInfo({ bookId, BookName: bookId, idRangeMax: entry.hadiths.length }, 0)
    const hadiths = entry.hadiths
      .map((hadith) => normalizeLegacyHadith(hadith, bookInfo))
      .sort((a, b) => a.id - b.id)

    hadithCount += hadiths.length
    volumeHadiths.set(bookId, hadiths)
  }

  const { books, volumes } = buildCanonicalBooks(bookInfos)
  const { chapters, hadithsByVolume } = buildCanonicalChaptersAndHadiths(volumeHadiths)

  await writeJson(path.join(canonicalDir, 'books.json'), books)
  await writeJson(path.join(canonicalDir, 'volumes.json'), volumes)
  await writeJson(path.join(canonicalDir, 'chapters.json'), chapters)

  for (const [bookId, hadiths] of hadithsByVolume) {
    await writeJson(path.join(canonicalDir, 'hadiths', `${bookId}.json`), hadiths)
  }

  await writeJson(path.join(runtimeDir, 'books.json'), bookInfos)

  const structureByVolume = new Map()
  const lookup = {
    byBookAndId: {},
    bySourceKey: {},
    bySourceUrl: {},
    byLegacyHadithId: {},
  }
  const random = { allRefs: [], byBook: {} }

  for (const [bookId, hadiths] of volumeHadiths) {
    await writeJson(path.join(runtimeDir, 'volumes', `${bookId}.json`), hadiths)

    const structure = buildStructureFromHadiths(hadiths)
    structureByVolume.set(bookId, structure)
    await writeJson(path.join(runtimeDir, 'structures', `${bookId}.json`), structure)

    const searchShard = hadiths.map((hadith) => {
      const parsed = parseThaqalaynHadithUrl(hadith.URL)
      return {
        bookId,
        id: hadith.id,
        sourceKey: parsed?.pathname || `/legacy/${bookId}/${hadith.id}`,
        english: normalizeEnglish(hadith.englishText || hadith.thaqalaynMatn),
        arabic: normalizeArabic(hadith.arabicText || hadith.thaqalaynMatn),
      }
    })
    await writeJson(path.join(runtimeDir, 'search', `${bookId}.json`), searchShard)

    random.byBook[bookId] = []

    for (const hadith of hadiths) {
      const parsed = parseThaqalaynHadithUrl(hadith.URL)
      const ref = {
        bookId,
        id: hadith.id,
        volume: hadith.volume,
        sourceKey: parsed?.pathname || `/legacy/${bookId}/${hadith.id}`,
      }

      lookup.byBookAndId[`${bookId}:${hadith.id}`] = ref
      lookup.bySourceKey[ref.sourceKey] = ref
      if (hadith.URL) lookup.bySourceUrl[hadith.URL] = ref
      lookup.byLegacyHadithId[String(hadith.id)] ??= []
      lookup.byLegacyHadithId[String(hadith.id)].push(ref)
      random.allRefs.push(ref)
      random.byBook[bookId].push(ref)
    }
  }

  const allStructures = {}
  for (const bookInfo of bookInfos) {
    const structure = structureByVolume.get(bookInfo.bookId) || {}
    allStructures[bookInfo.bookId] = {
      structure,
      totalHadiths: Object.values(structure).reduce(
        (sum, category) => sum + category.totalHadiths,
        0,
      ),
      volumeIds: [bookInfo.bookId],
    }
  }

  const groupedVolumeIds = new Map()
  for (const bookInfo of bookInfos) {
    const workKey = getWorkKeyFromLegacyBookId(bookInfo.bookId)
    groupedVolumeIds.set(workKey, [...(groupedVolumeIds.get(workKey) || []), bookInfo.bookId])
  }

  for (const volumeIds of groupedVolumeIds.values()) {
    if (volumeIds.length < 2) continue
    const sorted = volumeIds.slice().sort()
    const mergedStructure = mergeStructures(sorted, structureByVolume)
    const totalHadiths = Object.values(mergedStructure).reduce(
      (sum, category) => sum + category.totalHadiths,
      0,
    )
    allStructures[`__merged__:${sorted.join('|')}`] = {
      structure: mergedStructure,
      totalHadiths,
      volumeIds: sorted,
    }
  }

  await writeJson(path.join(runtimeDir, 'structures', 'all.json'), allStructures)
  await writeJson(path.join(runtimeDir, 'lookup.json'), lookup)
  await writeJson(path.join(runtimeDir, 'random.json'), random)

  const attribution = [
    '# Thaqalayn Data Attribution',
    '',
    'This generated dataset is derived from public Thaqalayn material and the open-source ThaqalaynAPI dataset.',
    '',
    `Primary website: ${THAQALAYN_ORIGIN}`,
    `Source kind: ${source.kind}`,
    source.url ? `Source URL: ${source.url}` : null,
    source.commitSha ? `Source commit: ${source.commitSha}` : null,
    '',
    'Do not use this dataset for AI training. It is maintained for Saadah Library search and reading access.',
    '',
  ]
    .filter(Boolean)
    .join('\n')
  await writeText(path.join(releaseDir, 'ATTRIBUTION.md'), attribution)

  const checksums = await fileChecksums(releaseDir)
  const manifest = {
    schemaVersion: 1,
    version,
    generatedAt: new Date().toISOString(),
    source: {
      kind: source.kind,
      url: source.url ?? null,
      commitSha: source.commitSha ?? null,
      license: source.license ?? 'GPL-3.0 / upstream terms require attribution and review',
      notes: source.notes ?? [],
    },
    counts: {
      books: books.length,
      volumes: volumeHadiths.size,
      chapters: chapters.length,
      hadiths: hadithCount,
    },
    artifactHash: sha256(JSON.stringify(checksums)),
    checksums,
  }

  await writeJson(path.join(releaseDir, 'manifest.json'), manifest)
  await writeJson(CURRENT_POINTER_PATH, {
    version,
    releasePath: path.relative(path.dirname(CURRENT_POINTER_PATH), releaseDir).replace(/\\/g, '/'),
    updatedAt: manifest.generatedAt,
  })

  if (publishCurrent) {
    await copyDir(runtimeDir, path.join(PUBLIC_CURRENT_ROOT, '..', version, 'runtime'))
    await writeJson(path.join(PUBLIC_CURRENT_ROOT, '..', version, 'manifest.json'), manifest)
    await fs.rm(path.join(PUBLIC_CURRENT_ROOT, 'runtime'), { recursive: true, force: true })
    await writeJson(path.join(PUBLIC_CURRENT_ROOT, 'manifest.json'), manifest)
  }

  await fs.mkdir(path.join(PUBLIC_CURRENT_ROOT), { recursive: true })
  return { releaseDir, manifest }
}
