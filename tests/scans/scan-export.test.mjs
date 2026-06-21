import { describe, expect, it } from 'vitest'
import { normalizeExportLayout } from '../../lib/scan-layout.ts'

describe('scan export layout selection', () => {
  it('only allows all-pages cover layout for multi-page exports', () => {
    expect(normalizeExportLayout('all-cover', 0)).toBe('page-cover')
    expect(normalizeExportLayout('all-cover', 1)).toBe('page-cover')
    expect(normalizeExportLayout('all-cover', 2)).toBe('all-cover')
  })

  it('keeps single-page-compatible layouts unchanged', () => {
    expect(normalizeExportLayout('each', 1)).toBe('each')
    expect(normalizeExportLayout('page-cover', 1)).toBe('page-cover')
  })
})
