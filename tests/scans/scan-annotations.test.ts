import { describe, expect, it } from 'vitest'
import { drawHighlights, type Highlight } from '../../lib/scan-annotations'

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
})
