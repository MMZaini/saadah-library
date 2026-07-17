import { describe, expect, it } from 'vitest'
import { drawHighlights, underlinePaintRect, type Highlight } from '../../lib/scan-annotations'

function recordingContext() {
  const fills: Array<{
    color: string
    composite: GlobalCompositeOperation
    x: number
    y: number
    w: number
    h: number
  }> = []
  let color = ''
  let composite: GlobalCompositeOperation = 'source-over'

  const context = {
    save() {},
    restore() {},
    get fillStyle() {
      return color
    },
    set fillStyle(value: string | CanvasGradient | CanvasPattern) {
      color = String(value)
    },
    get globalCompositeOperation() {
      return composite
    },
    set globalCompositeOperation(value: GlobalCompositeOperation) {
      composite = value
    },
    fillRect(x: number, y: number, w: number, h: number) {
      fills.push({ color, composite, x, y, w, h })
    },
  } as unknown as CanvasRenderingContext2D

  return { context, fills }
}

describe('scan annotation rendering', () => {
  it('renders highlights as multiply-blended rectangles', () => {
    const { context, fills } = recordingContext()
    const annotation: Highlight = {
      id: 'highlight-1',
      kind: 'highlight',
      page: 1,
      x: 0.1,
      y: 0.2,
      w: 0.3,
      h: 0.04,
      color: '#ffe600',
    }

    drawHighlights(context, [annotation], 1000, 2000)

    expect(fills).toEqual([
      {
        color: '#ffe600',
        composite: 'multiply',
        x: 100,
        y: 400,
        w: 300,
        h: 80,
      },
    ])
  })

  it('renders an opaque underline only along the annotation baseline', () => {
    const { context, fills } = recordingContext()
    const annotation: Highlight = {
      id: 'underline-1',
      kind: 'underline',
      page: 1,
      x: 0.1,
      y: 0.2,
      w: 0.3,
      h: 0.05,
      color: '#ef4444',
    }

    drawHighlights(context, [annotation], 1000, 2000)

    expect(fills).toEqual([
      {
        color: '#ef4444',
        composite: 'source-over',
        x: 100,
        y: 495,
        w: 300,
        h: 5,
      },
    ])
  })

  it('pixel-aligns underline endpoints and thickness at fractional zoom scales', () => {
    const annotation = { x: 0.101, y: 0.201, w: 0.303, h: 0.019 }

    expect(underlinePaintRect(annotation, 997.4, 1403.6, 3.75)).toEqual({
      x: 101,
      y: 305,
      w: 302,
      h: 4,
    })
    expect(underlinePaintRect(annotation, 1246.75, 1754.5, 3.75)).toEqual({
      x: 126,
      y: 382,
      w: 378,
      h: 4,
    })
  })

  it('paints preview and committed hit-area geometry identically', () => {
    const preview = { x: 0.2, y: 0.4, w: 0.45, h: 0 }
    const committed = { x: 0.2, y: 0.38, w: 0.45, h: 0.02 }

    for (const [width, height, thickness] of [
      [800, 1120, 3],
      [997, 1404, 4],
      [1600, 2240, 6],
    ]) {
      expect(underlinePaintRect(committed, width, height, thickness)).toEqual(
        underlinePaintRect(preview, width, height, thickness),
      )
    }
  })

  it('keeps edge underlines fully visible inside the backing store', () => {
    expect(underlinePaintRect({ x: 0, y: 0, w: 1, h: 0 }, 100, 200, 3)).toEqual({
      x: 0,
      y: 0,
      w: 100,
      h: 3,
    })
    expect(underlinePaintRect({ x: 0, y: 1, w: 1, h: 0 }, 100, 200, 3)).toEqual({
      x: 0,
      y: 197,
      w: 100,
      h: 3,
    })
  })
})
