import {
  KHOEI_AUTHOR_AR,
  KHOEI_TITLE_AR,
  normalizeArabic,
  normalizeArabicForId,
  parseArabicNumber,
  sha256,
} from './shared.mjs'
import { buildNarratorTransliterations, buildTokenTransliterationList } from './transliteration.mjs'

const INTRO_TERMS = ['مقدمة', 'تقديم', 'الناشر', 'المؤلف', 'تمهيد']
const TOC_TERMS = ['الفهرس', 'فهرست', 'المحتويات']
const APPENDIX_TERMS = ['مستدرك', 'ملحق', 'خاتمة', 'فهارس']
const NON_ENTRY_HEADING_TERMS = [
  ...INTRO_TERMS,
  ...TOC_TERMS,
  ...APPENDIX_TERMS,
  'باب',
  'فصل',
  'تنبيه',
  'خلاصة',
  'الحديث',
  'الجزء',
]

const ENTRY_HEADING_PATTERNS = [
  /^\s*[\(\[]?\s*([0-9٠-٩۰-۹]{1,5})\s*[\)\]]?\s*[-ـ–—]\s*(.{3,160}?)\s*[:：]\s*$/u,
]

export function flattenPageBlocks(page) {
  const blocks = []

  function visit(node, inheritedKind = 'container') {
    const kind = node.kind && node.kind !== 'container' ? node.kind : inheritedKind
    const text = collectNodeText(node).trim()

    if (text) {
      blocks.push({
        kind,
        text,
        pageId: page.id,
        pageNumber: page.number,
        pageLabel: page.label || page.attachmentPageLabel || String(page.number || ''),
        contentId: node.id,
      })
      return
    }

    for (const child of node.children || []) visit(child, kind)
  }

  for (const node of page.contents || []) visit(node)
  return mergeAdjacentTextBlocks(blocks)
}

function collectNodeText(node) {
  const parts = []
  if (node.text && node.kind !== 'ref') parts.push(node.text)
  for (const child of node.children || []) {
    const childText = collectNodeText(child)
    if (childText) parts.push(childText)
  }
  return normalizeBlockWhitespace(parts.join('\n'))
}

function normalizeBlockWhitespace(text) {
  return String(text || '')
    .replace(/[ \t\f\v]+/g, ' ')
    .replace(/\s*\n\s*/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function mergeAdjacentTextBlocks(blocks) {
  const merged = []
  for (const block of blocks) {
    const last = merged[merged.length - 1]
    if (
      last &&
      last.kind === block.kind &&
      last.pageNumber === block.pageNumber &&
      last.contentId === block.contentId
    ) {
      last.text = `${last.text} ${block.text}`.replace(/\s+/g, ' ')
    } else {
      merged.push({ ...block })
    }
  }
  return merged
}

export function parseEntryHeading(text, { strict = false } = {}) {
  const collapsed = String(text || '')
    .replace(/\s+/g, ' ')
    .trim()
  if (!collapsed || collapsed.length > 180) return null

  for (const pattern of ENTRY_HEADING_PATTERNS) {
    const match = collapsed.match(pattern)
    if (!match) continue

    const entryNumber = parseArabicNumber(match[1])
    const heading = cleanupHeadingName(match[2])
    if (!entryNumber || !isLikelyNarratorName(heading)) continue

    return {
      entryNumber,
      heading,
      primaryName: getPrimaryName(heading),
      aliases: extractHeadingAliases(heading),
    }
  }

  if (strict) return null
  return null
}

function cleanupHeadingName(name) {
  return String(name || '')
    .replace(/^[.،؛:\-\s]+/u, '')
    .replace(/[.،؛:]+$/u, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function isLikelyNarratorName(heading) {
  const normalized = normalizeArabic(heading)
  if (normalized.length < 3 || normalized.length > 150) return false
  if (!/[\p{Script=Arabic}]/u.test(heading)) return false
  if (NON_ENTRY_HEADING_TERMS.some((term) => normalized.includes(normalizeArabic(term)))) {
    return false
  }
  if (/^(قال|قوله|ومنهم|منهم|هذا|وهذا|ذكر|ترجمة|كتاب)\b/u.test(normalized)) return false
  return true
}

function getPrimaryName(heading) {
  const withoutParenthetical = heading.replace(/\s*[\(\[][^)\]]+[\)\]]\s*$/u, '').trim()
  return cleanupHeadingName(withoutParenthetical.split(/[،؛/]/u)[0])
}

export function extractHeadingAliases(heading) {
  const variants = new Set()
  const primary = getPrimaryName(heading)
  if (primary) variants.add(primary)

  for (const segment of heading.split(/[،؛/]/u)) {
    const cleaned = cleanupHeadingName(segment)
    if (cleaned && isLikelyNarratorName(cleaned)) variants.add(cleaned)
  }

  for (const match of heading.matchAll(/[\(\[]([^)\]]{3,120})[\)\]]/gu)) {
    const cleaned = cleanupHeadingName(match[1])
    if (cleaned && isLikelyNarratorName(cleaned)) variants.add(cleaned)
  }

  return Array.from(variants)
}

const IDENTITY_SCAN_LENGTH = 1400
const MAX_IDENTITY_LENGTH = 180
const IDENTITY_SOURCE_PATTERN =
  /(?:قال|وقال)\s+(النجاشي|الشيخ(?:\s*\([^)]*\))?)\s*:\s*["“]\s*([^"”\n]{3,240}?)\s*:/gu
const EXPLICIT_ALIAS_PATTERN = /(?:^|\n)\s*=\s*([^\n.]{2,180})\s*\./gu
const IDENTITY_NARRATIVE_START =
  /(?:\s*[،؛.]\s*|\s+)(?:له(?:ما|ا)?\s+(?:كتاب|كتب|أصل|مسائل)|قال|وقال|أخبر(?:نا|ني)?|اخبر(?:نا|ني)?|روى|روي|كان|ذكر|ذكره|ثقة|ضعيف|مولى|مولي|صاحب|سمعت|حدث(?:نا|ني)?|أخو|اخو|وهو|واسم)(?=\s|$).*$/u
const IDENTITY_LEADING_PROSE = /^(?:قال|وقال|أخبر|اخبر|روى|روي|كان|ذكر|له|هذا|وهو)(?=\s|$)/u
const IDENTITY_RELATION_TOKENS = new Set(['بن', 'ابن', 'بنت', 'ابو', 'ابي', 'ابا', 'ام'])
const IDENTITY_FACT_SCAN_LENGTH = 2400
const MAX_IDENTITY_FACT_LENGTH = 72
const IDENTITY_FACT_PROSE_START =
  /^(?:قال|وقال|روي|روى|ذكر|وذكر|عده|وعده|وقع|ووقع|له|وله|من|ومن|هذا|وهذا|تقدم|وتقدم|ياتي|وياتي|طريق|وطريق|هو|وهو)(?=\s|$)/u
const IDENTITY_FACT_NARRATIVE_START =
  /(?:\s*[،؛.]\s*|\s+)(?:وقيل|قيل|قال|وقال|روي|روى|ذكر|وذكر|له|وله)(?=\s|$).*$/u
const IDENTITY_FACT_PROSE_TOKENS = new Set([
  'ثقه',
  'ضعيف',
  'صحيح',
  'جليل',
  'فاضل',
  'صالح',
  'مجهول',
  'كتاب',
  'كتب',
  'روايه',
  'حديث',
  'اصحاب',
  'شيخ',
  'وقيل',
  'قيل',
])
const SUBJECT_NISBA_REJECTIONS = new Set(['العدل', 'الثقه', 'الضعيف', 'الصحيح', 'الشعر'])
const IDENTITY_VALUE_REJECTIONS = new Set([
  'او',
  'انه',
  'فيه',
  'علم',
  'عندنا',
  'ابوه',
  'ابو',
  'ابي',
  'ابا',
  'ابن',
  'ذا',
  'مولي',
])

function identityTokens(text) {
  return normalizeArabic(text)
    .split(/\s+/u)
    .filter((token) => token && !IDENTITY_RELATION_TOKENS.has(token))
}

function cleanIdentityCandidate(value) {
  const cleaned = cleanupHeadingName(
    String(value || '')
      .replace(IDENTITY_NARRATIVE_START, '')
      .replace(/^[=\s]+/u, '')
      .replace(/\s+/gu, ' '),
  )
  const normalized = normalizeArabic(cleaned)
  if (
    !cleaned ||
    cleaned.length > MAX_IDENTITY_LENGTH ||
    normalized.split(/\s+/u).length > 18 ||
    IDENTITY_LEADING_PROSE.test(normalized)
  ) {
    return null
  }
  return { text: cleaned, normalizedText: normalized }
}

function hasIdentityOverlap(primaryName, candidate) {
  const primaryTokens = new Set(identityTokens(primaryName))
  return identityTokens(candidate).some((token) => primaryTokens.has(token))
}

/**
 * Extract only high-confidence name declarations from the opening of a rijal
 * entry. The full biography is deliberately not indexed: it commonly names
 * teachers, students, and transmitters who are not the subject of the entry.
 */
export function extractNarratorIdentityProfiles(entry) {
  const primaryNormalized = normalizeArabic(entry.primaryName)
  const headingAliases = new Set(
    [entry.primaryName, ...(entry.aliases ?? [])].map(normalizeArabic).filter(Boolean),
  )
  const profiles = new Map()

  function add(value, source, { requireOverlap = true } = {}) {
    const candidate = cleanIdentityCandidate(value)
    if (!candidate || headingAliases.has(candidate.normalizedText)) return
    if (requireOverlap && !hasIdentityOverlap(entry.primaryName, candidate.text)) return
    if (candidate.normalizedText === primaryNormalized || profiles.has(candidate.normalizedText)) {
      return
    }
    profiles.set(candidate.normalizedText, { ...candidate, source })
  }

  const opening = String(entry.plainText || '').slice(0, IDENTITY_SCAN_LENGTH)
  for (const match of opening.matchAll(EXPLICIT_ALIAS_PATTERN)) {
    // The source's leading "=" lines are explicit cross-references. They may
    // use a wholly different name, so they do not need token overlap.
    add(match[1], 'crossReference', { requireOverlap: false })
  }

  for (const match of opening.matchAll(IDENTITY_SOURCE_PATTERN)) {
    add(match[2], match[1].startsWith('النجاشي') ? 'najashi' : 'tusi')
  }

  return Array.from(profiles.values())
}

function cleanIdentityFact(value) {
  const cleaned = cleanupHeadingName(
    String(value || '')
      .replace(IDENTITY_FACT_NARRATIVE_START, '')
      .replace(/^[،؛:().\s]+|[،؛:().\s]+$/gu, '')
      .replace(/\s+/gu, ' '),
  )
  const normalizedText = normalizeArabic(cleaned)
  const tokens = normalizedText.split(/\s+/u).filter(Boolean)
  if (
    !cleaned ||
    cleaned.length > MAX_IDENTITY_FACT_LENGTH ||
    tokens.length > 7 ||
    normalizedText === 'الشيخ' ||
    IDENTITY_FACT_PROSE_START.test(normalizedText) ||
    tokens.some((token) => IDENTITY_FACT_PROSE_TOKENS.has(token))
  ) {
    return null
  }
  return { text: cleaned, normalizedText }
}

function inferOpeningFactKind(normalizedText) {
  if (/^(?:ابو|ابي|ابا)(?:\s|$)/u.test(normalizedText)) return 'kunya'
  if (/^ابن(?:\s|$)/u.test(normalizedText)) return 'descriptor'
  return 'nisba'
}

/**
 * Extract small, subject-scoped identity facts. Unlike identity profiles these
 * need not repeat the canonical name, but they must occur in an opening label
 * or in grammar that explicitly points back to the entry's subject. This keeps
 * teachers, students, and transmission-chain names out of the search index.
 */
export function extractNarratorIdentityFacts(entry) {
  const facts = new Map()

  function add(value, kind, source) {
    const fact = cleanIdentityFact(value)
    if (!fact) return
    if (
      IDENTITY_VALUE_REJECTIONS.has(fact.normalizedText) ||
      (kind === 'nisba' &&
        source === 'subjectStatement' &&
        (!fact.normalizedText.startsWith('ال') ||
          SUBJECT_NISBA_REJECTIONS.has(fact.normalizedText)))
    ) {
      return
    }
    const key = `${kind}:${fact.normalizedText}`
    if (!facts.has(key)) facts.set(key, { ...fact, kind, source })
  }

  const bodyBlocks = (entry.textBlocks ?? []).filter((block) => block.kind !== 'heading')
  const openingBlock = String(bodyBlocks[0]?.text || '').slice(0, 300)
  const openingLabel = openingBlock.match(/^([^:\n]{2,72})\s*:/u)?.[1]
  if (openingLabel) {
    const label = cleanIdentityFact(openingLabel)
    if (label) {
      if (/^(?:يكني|يكنى)\s+/u.test(label.normalizedText)) {
        add(openingLabel.replace(/^(?:يكنى|يكني)\s+/u, ''), 'kunya', 'openingFragment')
      } else if (/^المعروف\s+ب/u.test(label.normalizedText)) {
        add(openingLabel.replace(/^المعروف\s+ب/u, ''), 'knownAs', 'openingFragment')
      } else if (/^(?:ال|ابن|أبو|أبي|أبا)/u.test(openingLabel.trim())) {
        add(openingLabel, inferOpeningFactKind(label.normalizedText), 'openingFragment')

        // A compact opening label can contain several independent details,
        // e.g. "السنبسي الكوفي أبو أرقم". Preserve the source phrase above,
        // while also indexing its clearly delimited nisbas and kunya.
        for (const token of label.text.split(/\s+/u)) {
          const normalizedToken = normalizeArabic(token)
          if (/^ال[\p{Script=Arabic}]{2,}$/u.test(normalizedToken) && normalizedToken !== 'الشيخ') {
            add(token, 'nisba', 'openingFragment')
          }
        }
        const kunya = label.text.match(
          /(?:^|\s)((?:أبو|أبي|أبا)\s+(?:عبد\s+)?[\p{Script=Arabic}]{2,30})/u,
        )
        if (kunya) add(kunya[1], 'kunya', 'openingFragment')
      }
    }
  }

  const opening = String(entry.plainText || '').slice(0, IDENTITY_FACT_SCAN_LENGTH)

  // "وصفه بالنوفلي" and "كناه بأبي بكر" explicitly describe the current
  // entry. They are substantially safer than indexing arbitrary nearby nouns.
  for (const match of opening.matchAll(
    /(?:^|[،؛.\s])(?:و?قد\s+)?وصفه\s+ب([\p{Script=Arabic}]{2,40})/gu,
  )) {
    add(match[1], 'nisba', 'subjectStatement')
  }
  for (const match of opening.matchAll(
    /(?:^|[،؛.\s])و?كناه\s+ب?((?:أبو|أبي|أبا)\s+(?:عبد\s+)?[\p{Script=Arabic}]{2,30})/gu,
  )) {
    add(match[1], 'kunya', 'subjectStatement')
  }
  for (const match of opening.matchAll(
    /(?:^|[،؛.\s])(?:و?يلقب|و?لقبه)\s+ب((?:(?:أبو|أبي|أبا|ابن)\s+)?[\p{Script=Arabic}]{2,40})/gu,
  )) {
    add(match[1], 'laqab', 'subjectStatement')
  }

  // "المعروف بـ" can refer to somebody else. Accept it only when the nearby
  // left context repeats a fact already established for this subject.
  for (const match of opening.matchAll(
    /المعروف\s+ب((?:(?:أبو|أبي|أبا|ابن)\s+)?[\p{Script=Arabic}]{2,40})/gu,
  )) {
    const context = normalizeArabic(opening.slice(Math.max(0, match.index - 80), match.index))
    const isAnchored = Array.from(facts.values()).some(
      (fact) => fact.normalizedText.length >= 3 && context.endsWith(fact.normalizedText),
    )
    if (isAnchored) add(match[1], 'knownAs', 'subjectStatement')
  }

  return Array.from(facts.values())
}

export function classifyPage(blocks) {
  if (blocks.some((block) => block.kind === 'ref')) return 'content'
  const pageText = normalizeArabic(
    blocks
      .map((block) => block.text)
      .join(' ')
      .slice(0, 500),
  )
  if (!pageText) return 'empty'
  if (TOC_TERMS.some((term) => pageText.includes(normalizeArabic(term)))) return 'toc'
  if (APPENDIX_TERMS.some((term) => pageText.includes(normalizeArabic(term)))) return 'appendix'
  if (INTRO_TERMS.some((term) => pageText.includes(normalizeArabic(term)))) return 'intro'
  return 'content'
}

export function parseKhoeiVolumes(volumes) {
  const entries = []
  const pageClassifications = []
  const boundaryErrors = []
  let current = null

  function finishCurrent() {
    if (!current) return
    current.endPage =
      current.sourceRefs[current.sourceRefs.length - 1]?.pageNumber ?? current.startPage
    current.textBlocks = current.textBlocks.filter((block) => block.text.trim())
    current.plainText = current.textBlocks
      .map((block) => block.text)
      .join('\n\n')
      .trim()
    if (!current.plainText) {
      boundaryErrors.push({
        type: 'empty-entry',
        volumeNumber: current.volumeNumber,
        entryNumber: current.entryNumber,
        name: current.primaryName,
      })
    } else {
      entries.push(current)
    }
    current = null
  }

  for (const volume of volumes.slice().sort((a, b) => a.volumeNumber - b.volumeNumber)) {
    const pages = (volume.pages || []).slice().sort((a, b) => a.number - b.number)
    const preparedPages = pages.map((page) => ({ page, blocks: flattenPageBlocks(page) }))
    const volumeHasRefBlocks = preparedPages.some(({ blocks }) =>
      blocks.some((block) => block.kind === 'ref'),
    )
    for (const { page, blocks } of preparedPages) {
      const pageKind = classifyPage(blocks)
      const pageEntryStarts = []

      if (pageKind !== 'content') {
        pageClassifications.push({
          volumeNumber: volume.volumeNumber,
          pageNumber: page.number,
          pageId: page.id,
          kind: current ? 'content' : pageKind,
        })
        if (!current) continue
      } else {
        pageClassifications.push({
          volumeNumber: volume.volumeNumber,
          pageNumber: page.number,
          pageId: page.id,
          kind: 'content',
        })
      }

      const expandedBlocks = expandEntryCandidateBlocks(blocks)
      const pageHasRefBlocks = expandedBlocks.some((block) => block.kind === 'ref')
      for (const block of expandedBlocks) {
        const isStructuredHeading =
          block.kind === 'heading' || block.kind === 'highlight' || block.kind === 'ref'
        const canUseFallback = !volumeHasRefBlocks && !pageHasRefBlocks && block.kind === 'text'
        const heading =
          isStructuredHeading || canUseFallback
            ? parseEntryHeading(block.text, { strict: !isStructuredHeading })
            : null

        if (heading) {
          pageEntryStarts.push(heading.entryNumber)
          finishCurrent()
          current = createEntry({ volume, page, block, heading })
          current.textBlocks.push(toEntryTextBlock(block, true))
          current.sourceRefs.push(toSourceRef(block))
          continue
        }

        if (!current) continue
        current.textBlocks.push(toEntryTextBlock(block, false))
        current.sourceRefs.push(toSourceRef(block))
      }

      void pageEntryStarts
    }
    finishCurrent()
  }

  const normalizedEntries = finalizeEntries(entries)

  return {
    entries: normalizedEntries,
    pageClassifications,
    boundaryErrors,
  }
}

function expandEntryCandidateBlocks(blocks) {
  const expanded = []
  for (const block of blocks) {
    const lines = String(block.text || '')
      .split(/\r?\n/u)
      .map((line) => line.trim())
      .filter(Boolean)

    if (lines.length <= 1) {
      expanded.push(block)
      continue
    }

    for (const line of lines) {
      expanded.push({
        ...block,
        text: line,
      })
    }
  }
  return expanded
}

function createEntry({ volume, page, block, heading }) {
  const sourceRefs = []
  return {
    id: '',
    entryNumber: heading.entryNumber,
    primaryName: heading.primaryName,
    normalizedName: normalizeArabic(heading.primaryName),
    aliases: heading.aliases,
    volumeNumber: volume.volumeNumber,
    startPage: page.number,
    endPage: page.number,
    textBlocks: [],
    plainText: '',
    sourceRefs,
    source: {
      title: KHOEI_TITLE_AR,
      author: KHOEI_AUTHOR_AR,
      sourceBookId: volume.book.id,
      sourceBookTitle: volume.book.title,
    },
    _firstContentRef: block.contentId || `${page.id}:${block.text.slice(0, 24)}`,
  }
}

function toEntryTextBlock(block, heading) {
  return {
    kind: heading ? 'heading' : block.kind,
    text: block.text,
    pageNumber: block.pageNumber,
    pageLabel: block.pageLabel,
    contentId: block.contentId,
  }
}

function toSourceRef(block) {
  return {
    pageId: block.pageId,
    pageNumber: block.pageNumber,
    pageLabel: block.pageLabel,
    contentId: block.contentId,
  }
}

function finalizeEntries(entries) {
  const uniqueEntries = dedupeExactEntries(entries)
  const entryNumberCounts = new Map()
  for (const entry of uniqueEntries) {
    if (entry.entryNumber == null) continue
    const key = `${entry.volumeNumber}:${entry.entryNumber}`
    entryNumberCounts.set(key, (entryNumberCounts.get(key) ?? 0) + 1)
  }

  const idCounts = new Map()
  return uniqueEntries.map((entry) => {
    const sourceEntryNumber = entry.entryNumber
    const entryNumberKey =
      sourceEntryNumber != null ? `${entry.volumeNumber}:${sourceEntryNumber}` : null
    const uniqueEntryNumber =
      entryNumberKey && entryNumberCounts.get(entryNumberKey) === 1 ? sourceEntryNumber : undefined
    const baseId =
      sourceEntryNumber != null
        ? `khoei-v${entry.volumeNumber}-${sourceEntryNumber}`
        : `khoei-v${entry.volumeNumber}-${normalizeArabicForId(entry.primaryName)}`
    const count = (idCounts.get(baseId) ?? 0) + 1
    idCounts.set(baseId, count)
    const suffix = sha256(
      `${entry._firstContentRef}:${entry.primaryName}:${entry.startPage}:${entry.plainText.slice(0, 120)}`,
    ).slice(0, 10)
    const id = count === 1 ? baseId : `${baseId}-${suffix}`
    const aliases = Array.from(
      new Map(entry.aliases.map((alias) => [normalizeArabic(alias), alias])).values(),
    )

    return {
      id,
      entryNumber: uniqueEntryNumber,
      sourceEntryNumber,
      primaryName: entry.primaryName,
      normalizedName: entry.normalizedName,
      aliases,
      volumeNumber: entry.volumeNumber,
      startPage: entry.startPage,
      endPage: entry.endPage,
      textBlocks: entry.textBlocks,
      plainText: entry.plainText,
      sourceRefs: compactSourceRefs(entry.sourceRefs),
      source: entry.source,
    }
  })
}

function dedupeExactEntries(entries) {
  const seen = new Set()
  const unique = []
  for (const entry of entries) {
    const key = [
      entry.volumeNumber,
      entry.entryNumber,
      entry.primaryName,
      entry.startPage,
      entry.endPage,
      sha256(entry.plainText),
    ].join('|')
    if (seen.has(key)) continue
    seen.add(key)
    unique.push(entry)
  }
  return unique
}

function compactSourceRefs(refs) {
  const seen = new Set()
  const compact = []
  for (const ref of refs) {
    const key = `${ref.pageId}:${ref.pageNumber}:${ref.contentId ?? ''}`
    if (seen.has(key)) continue
    seen.add(key)
    compact.push(ref)
  }
  return compact
}

export function buildRuntimeArtifacts(entries, { version, source }) {
  const sorted = entries
    .slice()
    .sort(
      (a, b) =>
        a.volumeNumber - b.volumeNumber ||
        (a.entryNumber ?? 0) - (b.entryNumber ?? 0) ||
        a.primaryName.localeCompare(b.primaryName, 'ar'),
    )

  const index = sorted.map((entry) => ({
    id: entry.id,
    entryNumber: entry.entryNumber,
    sourceEntryNumber: entry.sourceEntryNumber,
    primaryName: entry.primaryName,
    normalizedName: entry.normalizedName,
    aliases: entry.aliases,
    volumeNumber: entry.volumeNumber,
    startPage: entry.startPage,
    endPage: entry.endPage,
    sourceBookId: entry.source.sourceBookId,
  }))

  const search = sorted.map(buildNarratorSearchEntry)

  const metadata = {
    schemaVersion: 1,
    title: KHOEI_TITLE_AR,
    author: KHOEI_AUTHOR_AR,
    version,
    generatedAt: new Date().toISOString(),
    counts: {
      narrators: sorted.length,
      volumes: source.volumes.length,
      pages: source.volumes.reduce((sum, volume) => sum + Number(volume.pageCount || 0), 0),
    },
    source: {
      primary: source.primary,
      grpcHost: source.grpcHost,
      volumes: source.volumes.map((volume) => ({
        volumeNumber: volume.volumeNumber,
        rawVolumeNumber: volume.rawVolumeNumber,
        bookId: volume.id,
        title: volume.title,
        pageCount: volume.pageCount,
      })),
    },
  }

  const transliterations = buildNarratorTransliterations(index)
  const transliterationTokens = buildTokenTransliterationList(index)

  return { metadata, index, search, transliterations, transliterationTokens, narrators: sorted }
}

export function buildNarratorSearchEntry(entry) {
  return {
    id: entry.id,
    normalizedName: entry.normalizedName,
    normalizedAliases: entry.aliases.map(normalizeArabic),
    searchText: normalizeArabic([entry.primaryName, ...entry.aliases].join(' ')),
    identityProfiles: extractNarratorIdentityProfiles(entry),
    identityFacts: extractNarratorIdentityFacts(entry),
    entryNumber: entry.entryNumber,
    sourceEntryNumber: entry.sourceEntryNumber,
    volumeNumber: entry.volumeNumber,
    startPage: entry.startPage,
  }
}
