import type { ExportLayout } from './scan-export'

export function normalizeExportLayout(layout: ExportLayout, selectedCount: number): ExportLayout {
  return layout === 'all-cover' && selectedCount <= 1 ? 'page-cover' : layout
}

/** Clamps a requested PDF cover page to the loaded document. */
export function normalizeCoverPage(page: number, numPages: number): number {
  if (!Number.isFinite(page) || numPages < 1) return 1
  return Math.min(numPages, Math.max(1, Math.trunc(page)))
}
