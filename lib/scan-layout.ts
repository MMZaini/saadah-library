import type { ExportLayout } from './scan-export'

export function normalizeExportLayout(layout: ExportLayout, selectedCount: number): ExportLayout {
  return layout === 'all-cover' && selectedCount <= 1 ? 'page-cover' : layout
}
