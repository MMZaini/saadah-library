import { describe, expect, it } from 'vitest'
import {
  chooseUnderlineMoveAxis,
  createHighlightDraft,
  createUnderlineDraft,
  ensureUnderlineHitArea,
  moveHighlight,
  moveUnderlineOnAxis,
  resolveDrawCommit,
  resizeHighlight,
} from '../../lib/scan-highlight-geometry'

const rect = { x: 0.25, y: 0.3, w: 0.2, h: 0.1 }

function expectRect(actual: typeof rect, expected: typeof rect) {
  expect(actual.x).toBeCloseTo(expected.x)
  expect(actual.y).toBeCloseTo(expected.y)
  expect(actual.w).toBeCloseTo(expected.w)
  expect(actual.h).toBeCloseTo(expected.h)
}

describe('scan highlight geometry', () => {
  it('uses the exact current pointer width for underline drafts in either direction', () => {
    expectRect(createUnderlineDraft(0.2, 0.4, 0.65), {
      x: 0.2,
      y: 0.4,
      w: 0.45,
      h: 0,
    })
    expectRect(createUnderlineDraft(0.65, 0.4, 0.2), {
      x: 0.2,
      y: 0.4,
      w: 0.45,
      h: 0,
    })
  })

  it('commits preview width when pointer-up reports an earlier position', () => {
    const preview = createUnderlineDraft(0.2, 0.4, 0.7)
    const regressedRelease = createUnderlineDraft(0.2, 0.4, 0.55)

    expect(resolveDrawCommit(preview, regressedRelease)).toBe(preview)
    expect(resolveDrawCommit(null, regressedRelease)).toBe(regressedRelease)
  })

  it('normalises highlight drafts in every drawing direction', () => {
    expectRect(createHighlightDraft(0.7, 0.6, 0.2, 0.3), {
      x: 0.2,
      y: 0.3,
      w: 0.5,
      h: 0.3,
    })
  })

  it('expands a horizontal underline hit area without moving its baseline', () => {
    expectRect(ensureUnderlineHitArea({ x: 0.2, y: 0.4, w: 0.3, h: 0 }, 0.02), {
      x: 0.2,
      y: 0.38,
      w: 0.3,
      h: 0.02,
    })
  })

  it('keeps expanded underline hit areas within the page edges', () => {
    expectRect(ensureUnderlineHitArea({ x: 0.1, y: 0.005, w: 0.5, h: 0 }, 0.02), {
      x: 0.1,
      y: 0,
      w: 0.5,
      h: 0.02,
    })
    expectRect(ensureUnderlineHitArea({ x: 0.1, y: 0.99, w: 0.5, h: 0 }, 0.02), {
      x: 0.1,
      y: 0.97,
      w: 0.5,
      h: 0.02,
    })
  })

  it('moves highlights without allowing any edge to leave the page', () => {
    expectRect(moveHighlight(rect, 0.1, -0.1), { ...rect, x: 0.35, y: 0.2 })
    expectRect(moveHighlight(rect, -1, 1), { ...rect, x: 0, y: 0.9 })
  })

  it('selects the dominant physical axis for underline movement', () => {
    expect(chooseUnderlineMoveAxis(2, 12)).toBe('vertical')
    expect(chooseUnderlineMoveAxis(12, 2)).toBe('horizontal')
    expect(chooseUnderlineMoveAxis(12, 12)).toBe('horizontal')
  })

  it('honours a locked underline movement axis for diagonal drags', () => {
    expectRect(moveUnderlineOnAxis(rect, 0.15, 0.2, 'vertical'), { ...rect, y: 0.5 })
    expectRect(moveUnderlineOnAxis(rect, 0.15, 0.2, 'horizontal'), { ...rect, x: 0.4 })
    expectRect(moveUnderlineOnAxis(rect, -1, 0.2, 'vertical'), { ...rect, y: 0.5 })
    expectRect(moveUnderlineOnAxis(rect, 0.15, -1, 'horizontal'), { ...rect, x: 0.4 })
  })

  it('preserves horizontal geometry when resizing vertically', () => {
    expectRect(resizeHighlight(rect, 'n', 0.4, -0.1, 0.02, 0.02), {
      ...rect,
      y: 0.2,
      h: 0.2,
    })
    expectRect(resizeHighlight(rect, 's', -0.4, 0.15, 0.02, 0.02), {
      ...rect,
      h: 0.25,
    })
  })

  it('keeps an underline baseline fixed when resizing from either endpoint', () => {
    expectRect(resizeHighlight(rect, 'w', -0.1, -0.5, 0.02, 0.02), {
      ...rect,
      x: 0.15,
      w: 0.3,
    })
    expectRect(resizeHighlight(rect, 'e', 0.15, 0.5, 0.02, 0.02), {
      ...rect,
      w: 0.35,
    })
  })

  it('resizes from corners while preserving the opposite edges', () => {
    expectRect(resizeHighlight(rect, 'nw', -0.05, -0.1, 0.02, 0.02), {
      x: 0.2,
      y: 0.2,
      w: 0.25,
      h: 0.2,
    })
    expectRect(resizeHighlight(rect, 'se', 0.1, 0.2, 0.02, 0.02), {
      x: 0.25,
      y: 0.3,
      w: 0.3,
      h: 0.3,
    })
  })

  it('enforces minimum dimensions and page boundaries', () => {
    expectRect(resizeHighlight(rect, 'nw', 1, 1, 0.04, 0.03), {
      x: 0.41,
      y: 0.37,
      w: 0.04,
      h: 0.03,
    })
    expectRect(resizeHighlight(rect, 'se', 1, 1, 0.04, 0.03), {
      x: 0.25,
      y: 0.3,
      w: 0.75,
      h: 0.7,
    })
  })
})
