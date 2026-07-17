import { describe, expect, it } from 'vitest'
import { moveHighlight, resizeHighlight } from '../../lib/scan-highlight-geometry'

const rect = { x: 0.25, y: 0.3, w: 0.2, h: 0.1 }

function expectRect(actual: typeof rect, expected: typeof rect) {
  expect(actual.x).toBeCloseTo(expected.x)
  expect(actual.y).toBeCloseTo(expected.y)
  expect(actual.w).toBeCloseTo(expected.w)
  expect(actual.h).toBeCloseTo(expected.h)
}

describe('scan highlight geometry', () => {
  it('moves highlights without allowing any edge to leave the page', () => {
    expectRect(moveHighlight(rect, 0.1, -0.1), { ...rect, x: 0.35, y: 0.2 })
    expectRect(moveHighlight(rect, -1, 1), { ...rect, x: 0, y: 0.9 })
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
