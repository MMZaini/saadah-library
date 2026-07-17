import type { ExportCover, ExportLayout } from './scan-export'
import { normalizeCoverPage } from './scan-layout'

export type CoverSource = 'book' | 'page'

interface ResolveExportCoverOptions {
  enabled: boolean
  layout: ExportLayout
  source: CoverSource
  /** Base-path-prefixed book artwork, or null when the PDF has no library cover. */
  bookCoverSrc: string | null
  page: number
  numPages: number
}

/** Resolves the user's cover choice into the renderer's concrete cover source. */
export function resolveExportCover({
  enabled,
  layout,
  source,
  bookCoverSrc,
  page,
  numPages,
}: ResolveExportCoverOptions): ExportCover | null {
  if (!enabled || layout === 'each') return null
  if (source === 'book' && bookCoverSrc) return { kind: 'image', src: bookCoverSrc }
  return { kind: 'page', pageNumber: normalizeCoverPage(page, numPages) }
}
