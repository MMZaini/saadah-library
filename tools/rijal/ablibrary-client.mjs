import {
  ABLIBRARY_GRPC_ORIGIN,
  DATA_USER_AGENT,
  EXPECTED_VOLUME_COUNT,
  KHOEI_TITLE_AR,
  normalizeArabic,
  parseArabicNumber,
  fetchWithRetry,
} from './shared.mjs'
import {
  ProtoWriter,
  WIRE_BYTES,
  WIRE_VARINT,
  decodeGrpcWebFrames,
  decodeMessage,
  decodeUtf8,
  firstNumber,
  firstString,
  grpcWebFrame,
  messages,
  toDebugValue,
} from './protobuf.mjs'

const BOOK_SERVICE = 'ablibrary.services.book_service.BookService'
const DEFAULT_LIST_PAGE_SIZE = 250

function encodeListRequest({ page = 1, perPage = DEFAULT_LIST_PAGE_SIZE, query = '' } = {}) {
  return new ProtoWriter().uint32(1, page).uint32(2, perPage).string(5, query).finish()
}

function encodeBookIdRequest(bookId) {
  return new ProtoWriter().string(1, bookId).finish()
}

function encodeContentsRequest({ bookId, pageNumbers = [], pageIds = [] }) {
  const writer = new ProtoWriter().string(1, bookId)
  for (const pageNumber of pageNumbers) writer.uint32(2, pageNumber)
  for (const pageId of pageIds) writer.string(3, pageId)
  return writer.finish()
}

async function callBookService(method, message) {
  const response = await fetchWithRetry(`${ABLIBRARY_GRPC_ORIGIN}/${BOOK_SERVICE}/${method}`, {
    method: 'POST',
    headers: {
      Accept: 'application/grpc-web+proto',
      'Content-Type': 'application/grpc-web+proto',
      'User-Agent': DATA_USER_AGENT,
      'X-Grpc-Web': '1',
      'X-Language-Id': 'ar',
    },
    body: grpcWebFrame(message),
  })
  const frames = decodeGrpcWebFrames(new Uint8Array(await response.arrayBuffer()))
  return decodeMessage(frames.data)
}

function decodePagination(fields) {
  const payload = messages(fields, 2)[0]
  if (!payload) return null
  return {
    currentPage: firstNumber(payload, 1) ?? 0,
    perPage: firstNumber(payload, 2) ?? 0,
    totalPages: firstNumber(payload, 3) ?? 0,
    totalItems: firstNumber(payload, 4) ?? 0,
    currentPageItems: firstNumber(payload, 5) ?? 0,
  }
}

export function decodeBook(fields) {
  return {
    id: firstString(fields, 1) ?? '',
    title: firstString(fields, 2) ?? '',
    subtitle: firstString(fields, 3) ?? '',
    pageCount: firstNumber(fields, 6) ?? 0,
    language: firstString(messages(fields, 8)[0] ?? [], 2) ?? undefined,
    category: firstString(messages(fields, 9)[0] ?? [], 2) ?? undefined,
    raw: fields.map((field) => ({
      fieldNo: field.fieldNo,
      wireType: field.wireType,
      value: toDebugValue(field.value),
    })),
  }
}

export function decodeListResponse(fields) {
  return {
    books: messages(fields, 1).map(decodeBook),
    pagination: decodePagination(fields),
  }
}

export async function listBooks({ page = 1, perPage = DEFAULT_LIST_PAGE_SIZE, query = '' } = {}) {
  const fields = await callBookService('List', encodeListRequest({ page, perPage, query }))
  return decodeListResponse(fields)
}

export async function listAllBooks({ perPage = DEFAULT_LIST_PAGE_SIZE } = {}) {
  const first = await listBooks({ page: 1, perPage })
  const all = [...first.books]
  const totalPages = first.pagination?.totalPages ?? 1

  for (let page = 2; page <= totalPages; page++) {
    const next = await listBooks({ page, perPage })
    all.push(...next.books)
  }

  return { books: all, pagination: first.pagination }
}

export function parseVolumeNumberFromTitle(title) {
  const normalizedDigits = title.replace(/[٠-٩۰-۹]/g, (char) => String(parseArabicNumber(char)))
  const candidates = [
    normalizedDigits.match(/(?:ج|جزء|الجزء|جلد|مجلد)\s*[:\-]?\s*(\d{1,2})/u),
    normalizedDigits.match(/\((\d{1,2})\)/u),
    normalizedDigits.match(/(\d{1,2})\s*$/u),
  ]
  for (const match of candidates) {
    const value = match?.[1] ? Number(match[1]) : undefined
    if (value && value >= 1 && value <= EXPECTED_VOLUME_COUNT) return value
  }
  return undefined
}

export function isKhoeiMujamBook(book) {
  const title = normalizeArabic(book.title)
  return title === normalizeArabic(KHOEI_TITLE_AR)
}

export function selectKhoeiVolumes(books) {
  const candidates = books.filter(isKhoeiMujamBook)

  const byVolume = new Map()
  for (const candidate of candidates.map((book) => ({
    ...book,
    volumeNumber: parseVolumeNumberFromTitle(book.title),
  }))) {
    if (!candidate.volumeNumber) continue
    const current = byVolume.get(candidate.volumeNumber)
    if (!current || candidate.pageCount > current.pageCount) {
      byVolume.set(candidate.volumeNumber, candidate)
    }
  }

  const explicitVolumes = Array.from(byVolume.values()).sort(
    (a, b) => a.volumeNumber - b.volumeNumber,
  )
  if (explicitVolumes.length === EXPECTED_VOLUME_COUNT) return explicitVolumes

  const exactTitleSequence = candidates
    .slice()
    .sort((a, b) => Number(a.id) - Number(b.id))
    .slice(0, EXPECTED_VOLUME_COUNT)

  if (exactTitleSequence.length === EXPECTED_VOLUME_COUNT) {
    return exactTitleSequence.map((book, index) => ({
      ...book,
      volumeNumber: index + 1,
    }))
  }

  return explicitVolumes
}

export async function discoverKhoeiVolumes() {
  const all = await listAllBooks()
  return {
    booksScanned: all.books.length,
    pagination: all.pagination,
    candidates: all.books.filter(isKhoeiMujamBook),
    volumes: selectKhoeiVolumes(all.books),
  }
}

export function decodePageContent(fields) {
  const node = {
    id: firstString(fields, 1),
    bookId: firstString(fields, 2),
    parentId: firstString(fields, 3),
    languageId: firstString(fields, 4),
    pageId: firstString(fields, 5),
    pageNumber: firstNumber(fields, 6),
    weight: firstNumber(fields, 7),
    style: firstString(fields, 8),
    attributes: messages(fields, 9).map((item) => item.map((field) => toDebugValue(field.value))),
    kind: 'container',
    text: '',
    children: [],
    rawFieldNos: fields.map((field) => field.fieldNo),
  }

  for (const field of fields) {
    if (field.wireType !== WIRE_BYTES) continue

    if (field.fieldNo === 10) {
      node.children.push(decodePageContent(decodeMessage(field.value)))
      continue
    }

    const kind = contentKindFromField(field.fieldNo)
    if (!kind) continue
    node.kind = kind

    if (kind === 'text') {
      node.text = decodeTextPayload(field.value)
      continue
    }

    const nested = safeDecodeMessage(field.value)
    if (nested) {
      const text = kind === 'ref' ? '' : extractFirstText(nested)
      if (text) node.text = text
      const children = nested
        .filter((child) => child.wireType === WIRE_BYTES)
        .flatMap((child) => {
          const decoded = safeDecodeMessage(child.value)
          return decoded ? [decodePageContent(decoded)] : []
        })
      node.children.push(...children)
    }
  }

  return node
}

function contentKindFromField(fieldNo) {
  return (
    {
      11: 'footnote',
      12: 'heading',
      13: 'highlight',
      14: 'horizontal_line',
      15: 'image',
      16: 'line_break',
      17: 'paragraph',
      18: 'poem',
      19: 'ref',
      20: 'remark',
      21: 'table',
      22: 'table_cell',
      23: 'table_row',
      24: 'text',
    }[fieldNo] ?? null
  )
}

function safeDecodeMessage(value) {
  try {
    return decodeMessage(value)
  } catch {
    return null
  }
}

function decodeTextPayload(value) {
  const fields = safeDecodeMessage(value)
  if (!fields) return decodeUtf8(value)
  const textField = fields.find((field) => field.fieldNo === 1 && field.wireType === WIRE_BYTES)
  if (textField) return decodeUtf8(textField.value)
  return extractFirstText(fields) ?? ''
}

function extractFirstText(fields) {
  for (const field of fields) {
    if (field.wireType === WIRE_BYTES) {
      const text = decodeUtf8(field.value)
      if (text && /[\p{Script=Arabic}\p{L}\p{N}]/u.test(text)) return text
      const nested = safeDecodeMessage(field.value)
      if (nested) {
        const nestedText = extractFirstText(nested)
        if (nestedText) return nestedText
      }
    }
  }
  return ''
}

export function decodePage(fields) {
  return {
    id: firstString(fields, 1) ?? '',
    bookId: firstString(fields, 2) ?? '',
    number: firstNumber(fields, 3) ?? firstNumber(fields, 2) ?? 0,
    label: firstString(fields, 4) ?? '',
    attachmentPageLabel: firstString(fields, 9) ?? '',
    contents: messages(fields, 7).map(decodePageContent),
    rawFieldNos: fields.map((field) => field.fieldNo),
  }
}

export function decodeContentsResponse(fields) {
  const pages = []

  function visit(candidateFields) {
    for (const field of candidateFields) {
      if (field.wireType !== WIRE_BYTES) continue
      const nested = safeDecodeMessage(field.value)
      if (!nested) continue

      const hasPageShape =
        nested.some((item) => item.fieldNo === 1 && item.wireType === WIRE_BYTES) &&
        nested.some((item) => item.fieldNo === 3 && item.wireType === WIRE_VARINT)
      if (hasPageShape) pages.push(decodePage(nested))
      else if (field.fieldNo === 1) visit(nested)
    }
  }

  visit(fields)
  return pages
}

export async function fetchPagesMeta(bookId) {
  const fields = await callBookService('PagesMeta', encodeBookIdRequest(bookId))
  const pages = []

  function visit(candidateFields) {
    for (const field of candidateFields) {
      if (field.wireType !== WIRE_BYTES) continue
      const nested = safeDecodeMessage(field.value)
      if (!nested) continue
      const hasPageShape =
        nested.some((item) => item.fieldNo === 1 && item.wireType === WIRE_BYTES) &&
        nested.some((item) => item.fieldNo === 3 && item.wireType === WIRE_VARINT)
      if (hasPageShape) pages.push(decodePage(nested))
      else visit(nested)
    }
  }

  visit(fields)
  return {
    pages,
    raw: fields.map((field) => ({
      fieldNo: field.fieldNo,
      wireType: field.wireType,
      value: toDebugValue(field.value),
    })),
  }
}

export async function fetchTableOfContents(bookId) {
  const fields = await callBookService('TableOfContents', encodeBookIdRequest(bookId))
  return fields.map((field) => ({
    fieldNo: field.fieldNo,
    wireType: field.wireType,
    value: toDebugValue(field.value),
  }))
}

export async function fetchContents(bookId, pageNumbers) {
  const fields = await callBookService('Contents', encodeContentsRequest({ bookId, pageNumbers }))
  return decodeContentsResponse(fields)
}
