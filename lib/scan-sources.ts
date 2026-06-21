// Builds the list of PDFs available to the /scans studio by joining the
// existing book metadata (titles, round covers) with the PDF path config.
// No new data is introduced here — everything is derived from lib/books.ts and
// lib/book-pdfs.ts so the picker stays in sync with the rest of the app.
import { books, BOOK_ID_BY_NUMERIC_ID } from './books'
import { getBookConfig } from './books-config'
import { PDF_PATHS_BY_VOLUME_ID, EXTRA_BOOK_PDF_PATHS } from './book-pdfs'

export interface ScanVolume {
  label: string
  /** Unprefixed public path, e.g. /pdfs/books/al-kafi/volume-1.pdf */
  path: string
}

export interface ScanBook {
  bookId: string
  title: string
  author?: string
  /** Unprefixed round-cover path, e.g. /covers/1-round.jpeg */
  cover: string
  volumes: ScanVolume[]
}

export interface CoverOption {
  bookId: string
  title: string
  cover: string
}

// Ordered, de-duplicated list of physical PDF paths for a logical book. Handles
// multi-volume books (via book config volume sets) plus the extra physical
// volumes tracked in EXTRA_BOOK_PDF_PATHS, and tolerates missing volumes (e.g.
// a volume with no scanned PDF is simply skipped).
function getVolumePathsForBook(bookId: string): string[] {
  const config = getBookConfig(bookId)
  const volumeIds = config?.volumes?.length ? config.volumes : [bookId]

  const ordered: string[] = []
  const seen = new Set<string>()
  const push = (path?: string) => {
    if (path && !seen.has(path)) {
      seen.add(path)
      ordered.push(path)
    }
  }

  for (const volumeId of volumeIds) push(PDF_PATHS_BY_VOLUME_ID[volumeId])

  const extraKeys = new Set<string>([bookId, config?.bookId ?? bookId, ...volumeIds])
  for (const key of extraKeys) {
    for (const path of EXTRA_BOOK_PDF_PATHS[key] ?? []) push(path)
  }

  return ordered
}

function volumeLabel(path: string, index: number, total: number): string {
  const match = path.match(/volume-(\d+)\.pdf$/i)
  if (match) return `Volume ${Number(match[1])}`
  if (total === 1) return 'Single volume'
  return `Volume ${index + 1}`
}

export const SCAN_BOOKS: ScanBook[] = books
  .map((book): ScanBook | null => {
    const bookId = BOOK_ID_BY_NUMERIC_ID[book.id]
    if (!bookId) return null

    const paths = getVolumePathsForBook(bookId)
    if (paths.length === 0) return null

    const volumes: ScanVolume[] = paths.map((path, index) => ({
      label: volumeLabel(path, index, paths.length),
      path,
    }))

    return { bookId, title: book.title, author: book.author, cover: book.image, volumes }
  })
  .filter((entry): entry is ScanBook => entry !== null)

// Covers offered in the collage cover-override picker.
export const COVER_OPTIONS: CoverOption[] = SCAN_BOOKS.map((book) => ({
  bookId: book.bookId,
  title: book.title,
  cover: book.cover,
}))

export function getScanBookByPath(path: string): ScanBook | undefined {
  return SCAN_BOOKS.find((book) => book.volumes.some((volume) => volume.path === path))
}
