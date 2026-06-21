import { withBasePath } from './assets'

export interface KhoeiRijalPdf {
  volumeNumber: number
  path: string
  sourcePageCount: number
  pdfPageCount: number
  bytes: number
  sha256: string
}

// Offset added to a narrator's source page (`startPage`/`endPage`, which is the
// dataset's `pageNumber`) to reach the 1-based PHYSICAL page in the scanned PDF.
//
// This is NOT `pdfPageCount - sourcePageCount`: the surplus pages in each scan are
// mostly end-matter (indexes), so for 22 of the 24 volumes the source page already
// equals the physical page (offset 0). It was determined empirically by reading the
// scans (running-header page numbers cross-checked against entry content):
//   - Vol. 1 has a ~25-page muqaddima, but the dataset's `pageNumber` already runs
//     +24 ahead of the printed label, so the net offset to the physical page is +1.
//   - Vol. 8's scan has one extra leading page, giving +1.
//   - Every other volume is 0.
// Keep this map in sync with the PDFs; a wrong value opens the wrong page.
const PAGE_OFFSET_BY_VOLUME: Readonly<Record<number, number>> = {
  1: 1,
  8: 1,
}

export function getKhoeiRijalPageOffset(volumeNumber: number): number {
  return PAGE_OFFSET_BY_VOLUME[volumeNumber] ?? 0
}

export interface SourcePageRange {
  volumeNumber: number
  startPage: number
  endPage: number
}

export interface PdfPageRange extends KhoeiRijalPdf {
  pdfStartPage: number
  pdfEndPage: number
  sourceStartPage: number
  sourceEndPage: number
}

export const KHOEI_RIJAL_TITLE = "Mu'jam Rijal al-Hadith"
export const KHOEI_RIJAL_PDF_ROOT = '/pdfs/rijal/khoei'

export const KHOEI_RIJAL_PDFS: readonly KhoeiRijalPdf[] = [
  {
    volumeNumber: 1,
    path: '/pdfs/rijal/khoei/volume-01.pdf',
    sourcePageCount: 506,
    pdfPageCount: 528,
    bytes: 13712625,
    sha256: 'b81317b367fad4f198ad037bae3c5afb9ec19a3fa56236691b003b3fa6dc6ec9',
  },
  {
    volumeNumber: 2,
    path: '/pdfs/rijal/khoei/volume-02.pdf',
    sourcePageCount: 417,
    pdfPageCount: 435,
    bytes: 11645846,
    sha256: '4c77fc88b9c2c6421b9709a9866ad37568222e68b6d542bdee104c2bd4304201',
  },
  {
    volumeNumber: 3,
    path: '/pdfs/rijal/khoei/volume-03.pdf',
    sourcePageCount: 385,
    pdfPageCount: 407,
    bytes: 10863598,
    sha256: '0546e28d7788cd473711b88a3fba93e7d73309461a7dc68a9f1e0b4c9128ac56',
  },
  {
    volumeNumber: 4,
    path: '/pdfs/rijal/khoei/volume-04.pdf',
    sourcePageCount: 447,
    pdfPageCount: 478,
    bytes: 12072573,
    sha256: '3bb68a742aa2bd5ad22bb255a6ecc0b206ff7068343b86fce5c41bd9d9bb88e1',
  },
  {
    volumeNumber: 5,
    path: '/pdfs/rijal/khoei/volume-05.pdf',
    sourcePageCount: 490,
    pdfPageCount: 520,
    bytes: 12964234,
    sha256: '8d75253c134ed65b113a047a9e592fa36d323dd53f2c05c937776328d3aa1d70',
  },
  {
    volumeNumber: 6,
    path: '/pdfs/rijal/khoei/volume-06.pdf',
    sourcePageCount: 489,
    pdfPageCount: 512,
    bytes: 13091649,
    sha256: 'ccf547ee4d8c7705c8b7dc3342af7907dd811b5bc1aafe245427f7b6c90e738a',
  },
  {
    volumeNumber: 7,
    path: '/pdfs/rijal/khoei/volume-07.pdf',
    sourcePageCount: 467,
    pdfPageCount: 496,
    bytes: 12686434,
    sha256: 'f7f0c0623691cb5cc456955c1c3967abf8990048b52feceaa98d2dc7f54813d6',
  },
  {
    volumeNumber: 8,
    path: '/pdfs/rijal/khoei/volume-08.pdf',
    sourcePageCount: 491,
    pdfPageCount: 521,
    bytes: 12782658,
    sha256: '4a3946dec7c89d2cb68a4aca303f35bbeb440ada7d114e8d9dc96e429ead608f',
  },
  {
    volumeNumber: 9,
    path: '/pdfs/rijal/khoei/volume-09.pdf',
    sourcePageCount: 546,
    pdfPageCount: 575,
    bytes: 14522840,
    sha256: 'a0ad54242980c0dd94ea4488141d9a8c004a848524d159c75808870aced98690',
  },
  {
    volumeNumber: 10,
    path: '/pdfs/rijal/khoei/volume-10.pdf',
    sourcePageCount: 551,
    pdfPageCount: 583,
    bytes: 14191516,
    sha256: '278cc013d898c97993602536c2f6b182da5eb81b5d233d91d444dc64c66e8ffe',
  },
  {
    volumeNumber: 11,
    path: '/pdfs/rijal/khoei/volume-11.pdf',
    sourcePageCount: 536,
    pdfPageCount: 564,
    bytes: 14614865,
    sha256: '01a1b21146c9674479fe249df8ebc5d91fd45e9c9b5e24e2b15c76eb7b66edc0',
  },
  {
    volumeNumber: 12,
    path: '/pdfs/rijal/khoei/volume-12.pdf',
    sourcePageCount: 620,
    pdfPageCount: 648,
    bytes: 16106411,
    sha256: '0b0672d55ca99a965ddb2c932be9159161516e7701fc3634f421136b9109e51f',
  },
  {
    volumeNumber: 13,
    path: '/pdfs/rijal/khoei/volume-13.pdf',
    sourcePageCount: 384,
    pdfPageCount: 404,
    bytes: 10824169,
    sha256: 'd4b8bb2ba01cd83992da4da956f9cd717e71050068e0e0d4e58a05cdfe793dcd',
  },
  {
    volumeNumber: 14,
    path: '/pdfs/rijal/khoei/volume-14.pdf',
    sourcePageCount: 483,
    pdfPageCount: 510,
    bytes: 12697767,
    sha256: '13482590e1c03e3e27566de0ca8d560386c25c4fdfbade987b118626524e5303',
  },
  {
    volumeNumber: 15,
    path: '/pdfs/rijal/khoei/volume-15.pdf',
    sourcePageCount: 451,
    pdfPageCount: 476,
    bytes: 12287836,
    sha256: '4ffdfe66911c30cf1b965d885b444e3401f15b0b69bbe6cdf33fe3362e76b64d',
  },
  {
    volumeNumber: 16,
    path: '/pdfs/rijal/khoei/volume-16.pdf',
    sourcePageCount: 438,
    pdfPageCount: 455,
    bytes: 12081458,
    sha256: '686d6a3c638c93124d4f23953125ff2016f730761fbe0be07ad2b08754d87f03',
  },
  {
    volumeNumber: 17,
    path: '/pdfs/rijal/khoei/volume-17.pdf',
    sourcePageCount: 465,
    pdfPageCount: 496,
    bytes: 12507469,
    sha256: '4b1a0ab816d743495c4f375d005ca545e5413ffe81910ecaeed74dcc1bccf9c5',
  },
  {
    volumeNumber: 18,
    path: '/pdfs/rijal/khoei/volume-18.pdf',
    sourcePageCount: 461,
    pdfPageCount: 486,
    bytes: 12688708,
    sha256: '32178be92889c4b275da2105a5cff657240054e41bb58438d736a44b021bb356',
  },
  {
    volumeNumber: 19,
    path: '/pdfs/rijal/khoei/volume-19.pdf',
    sourcePageCount: 513,
    pdfPageCount: 536,
    bytes: 13924389,
    sha256: '99b12ce3f052d19c7d25848a0d482e2678f74b55a62048855aaeb105d188eb96',
  },
  {
    volumeNumber: 20,
    path: '/pdfs/rijal/khoei/volume-20.pdf',
    sourcePageCount: 450,
    pdfPageCount: 474,
    bytes: 12087836,
    sha256: '5a0f5a1f334b738dad54dc2fccfdbc48d818ccdd8dfc4a008fe58dd21806c37f',
  },
  {
    volumeNumber: 21,
    path: '/pdfs/rijal/khoei/volume-21.pdf',
    sourcePageCount: 341,
    pdfPageCount: 358,
    bytes: 8909602,
    sha256: '071f539fca769d2a0bd1f62df2a058158367000c155a0002b7c238abedd59726',
  },
  {
    volumeNumber: 22,
    path: '/pdfs/rijal/khoei/volume-22.pdf',
    sourcePageCount: 429,
    pdfPageCount: 452,
    bytes: 10693420,
    sha256: '1918282242b816c39e49b655a867660d5f31790343fbff3267170ba261779f03',
  },
  {
    volumeNumber: 23,
    path: '/pdfs/rijal/khoei/volume-23.pdf',
    sourcePageCount: 383,
    pdfPageCount: 398,
    bytes: 9886250,
    sha256: '7c43a8a85fba6219f3cb6928eaf13ebdf6d95d815c98a15b52e08f28ca9367dd',
  },
  {
    volumeNumber: 24,
    path: '/pdfs/rijal/khoei/volume-24.pdf',
    sourcePageCount: 352,
    pdfPageCount: 367,
    bytes: 8288841,
    sha256: '3f1d9208aecee54ff5129367893ccc8dfc45a0d04ba0a31434b1d6341917d8dd',
  },
]

const PDF_BY_VOLUME = new Map(KHOEI_RIJAL_PDFS.map((pdf) => [pdf.volumeNumber, pdf]))

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value))

export function getKhoeiRijalPdf(volumeNumber: number): KhoeiRijalPdf | null {
  return PDF_BY_VOLUME.get(volumeNumber) ?? null
}

export function getKhoeiRijalPdfUrl(volumeNumber: number, page?: number): string | null {
  const pdf = getKhoeiRijalPdf(volumeNumber)
  if (!pdf) return null
  const pageHash = page ? `#page=${clamp(Math.floor(page), 1, pdf.pdfPageCount)}` : ''
  return `${withBasePath(pdf.path)}${pageHash}`
}

export function getKhoeiRijalPdfPageRange(range: SourcePageRange): PdfPageRange | null {
  const pdf = getKhoeiRijalPdf(range.volumeNumber)
  if (!pdf) return null

  const pageOffset = getKhoeiRijalPageOffset(pdf.volumeNumber)
  const sourceStartPage = clamp(Math.floor(range.startPage), 1, pdf.sourcePageCount)
  const sourceEndPage = clamp(Math.floor(range.endPage), sourceStartPage, pdf.sourcePageCount)
  const pdfStartPage = clamp(sourceStartPage + pageOffset, 1, pdf.pdfPageCount)
  const pdfEndPage = clamp(sourceEndPage + pageOffset, pdfStartPage, pdf.pdfPageCount)

  return {
    ...pdf,
    sourceStartPage,
    sourceEndPage,
    pdfStartPage,
    pdfEndPage,
  }
}

export function formatPageRange(startPage: number, endPage: number): string {
  return startPage === endPage ? `p. ${startPage}` : `pp. ${startPage}-${endPage}`
}

export function getKhoeiRijalScanUrl(range: SourcePageRange): string | null {
  const pdfRange = getKhoeiRijalPdfPageRange(range)
  if (!pdfRange) return null

  const params = new URLSearchParams({
    source: 'rijal-khoei',
    volume: String(pdfRange.volumeNumber),
    pages: `${pdfRange.pdfStartPage}-${pdfRange.pdfEndPage}`,
  })

  return `/scans?${params.toString()}`
}

export function getKhoeiRijalViewerUrl(id: string): string {
  return `/narrators/${encodeURIComponent(id)}/pdf`
}

export function getAllKhoeiRijalPdfPaths(): string[] {
  return KHOEI_RIJAL_PDFS.map((pdf) => pdf.path)
}
