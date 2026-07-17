export interface Highlight {
  id: string
  /** The visual treatment applied to this annotation. */
  kind: 'highlight' | 'underline'
  /** 1-based page number this annotation belongs to. */
  page: number
  /** Normalised rect (0..1 of page width/height) so it maps to any scale. */
  x: number
  y: number
  w: number
  h: number
  color: string
}

// Strong highlight colours that stay readable over text with multiply blend.
export const HIGHLIGHT_COLORS: { name: string; value: string }[] = [
  { name: 'Yellow', value: '#ffe600' },
  { name: 'Green', value: '#8cff66' },
  { name: 'Pink', value: '#ff8ad4' },
  { name: 'Blue', value: '#7cd4ff' },
]

/** Opaque colours chosen to remain clear over monochrome scanned text. */
export const UNDERLINE_COLORS: { name: string; value: string }[] = [
  { name: 'Red', value: '#ef4444' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Green', value: '#22c55e' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Purple', value: '#a855f7' },
  { name: 'Black', value: '#18181b' },
]

export interface UnderlinePaintRect {
  x: number
  y: number
  w: number
  h: number
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

/**
 * Resolves an underline to whole backing-store pixels. Rounding both endpoints
 * independently keeps the normalised width stable, while an integer stroke
 * prevents fractional CSS/device-pixel placement from alternating thickness.
 */
export function underlinePaintRect(
  annotation: Pick<Highlight, 'x' | 'y' | 'w' | 'h'>,
  width: number,
  height: number,
  thickness: number,
): UnderlinePaintRect {
  const pixelWidth = Math.max(1, Math.round(width))
  const pixelHeight = Math.max(1, Math.round(height))
  const stroke = clamp(Math.round(thickness), 1, pixelHeight)
  const left = Math.round(clamp(annotation.x, 0, 1) * pixelWidth)
  const right = Math.round(clamp(annotation.x + annotation.w, 0, 1) * pixelWidth)
  const baseline = Math.round(clamp(annotation.y + annotation.h, 0, 1) * pixelHeight)

  return {
    x: left,
    y: clamp(baseline - stroke, 0, pixelHeight - stroke),
    w: Math.max(0, right - left),
    h: stroke,
  }
}

/** Paints annotations onto an already-rendered page canvas context. */
export function drawHighlights(
  ctx: CanvasRenderingContext2D,
  highlights: Highlight[],
  width: number,
  height: number,
): void {
  for (const annotation of highlights) {
    ctx.save()
    ctx.fillStyle = annotation.color
    if (annotation.kind === 'underline') {
      // The rect height is the editable hit area; only its bottom edge is part
      // of the exported annotation.
      const thickness = Math.max(2, Math.round(height * 0.0025))
      const rect = underlinePaintRect(annotation, width, height, thickness)
      ctx.globalCompositeOperation = 'source-over'
      ctx.fillRect(rect.x, rect.y, rect.w, rect.h)
    } else {
      ctx.globalCompositeOperation = 'multiply'
      ctx.fillRect(
        annotation.x * width,
        annotation.y * height,
        annotation.w * width,
        annotation.h * height,
      )
    }
    ctx.restore()
  }
}
