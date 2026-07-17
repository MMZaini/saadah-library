import type { Highlight } from './scan-export'

export type HighlightRect = Pick<Highlight, 'x' | 'y' | 'w' | 'h'>
export type ResizeHandle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w'

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

/** Builds the normalised rectangle shown while a highlight is being drawn. */
export function createHighlightDraft(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
): HighlightRect {
  return {
    x: Math.min(startX, endX),
    y: Math.min(startY, endY),
    w: Math.abs(endX - startX),
    h: Math.abs(endY - startY),
  }
}

/**
 * Builds a horizontal underline draft. Its baseline stays at pointer-down while
 * either left-to-right or right-to-left movement controls the exact width.
 */
export function createUnderlineDraft(startX: number, startY: number, endX: number): HighlightRect {
  return {
    x: Math.min(startX, endX),
    y: startY,
    w: Math.abs(endX - startX),
    h: 0,
  }
}

/**
 * The rendered preview is authoritative at release. Captured touch/stylus
 * pointer-up coordinates can report an earlier position than pointer-move.
 */
export function resolveDrawCommit(
  preview: HighlightRect | null,
  releaseFallback: HighlightRect | null,
): HighlightRect | null {
  return preview ?? releaseFallback
}

/** Moves a normalised highlight while keeping the complete rectangle on its page. */
export function moveHighlight(rect: HighlightRect, dx: number, dy: number): HighlightRect {
  return {
    ...rect,
    x: clamp(rect.x + dx, 0, 1 - rect.w),
    y: clamp(rect.y + dy, 0, 1 - rect.h),
  }
}

export type UnderlineMoveAxis = 'horizontal' | 'vertical'

/** Chooses an underline gesture axis from physical pixel distances. */
export function chooseUnderlineMoveAxis(dxPx: number, dyPx: number): UnderlineMoveAxis {
  return Math.abs(dyPx) > Math.abs(dxPx) ? 'vertical' : 'horizontal'
}

/** Moves an underline along an already-decided gesture axis. */
export function moveUnderlineOnAxis(
  rect: HighlightRect,
  dx: number,
  dy: number,
  axis: UnderlineMoveAxis,
): HighlightRect {
  return axis === 'vertical' ? moveHighlight(rect, 0, dy) : moveHighlight(rect, dx, 0)
}

/**
 * Gives a thin underline stroke a usable selection area while keeping its
 * baseline (the rect's bottom edge) stable and the complete rect on the page.
 */
export function ensureUnderlineHitArea(rect: HighlightRect, minHeight: number): HighlightRect {
  const safeHeight = clamp(minHeight, 0, 1)
  if (rect.h >= safeHeight) return rect
  const bottom = clamp(rect.y + rect.h, safeHeight, 1)
  return { ...rect, y: bottom - safeHeight, h: safeHeight }
}

/** Resizes a normalised highlight from one handle, constrained to page bounds and minimum size. */
export function resizeHighlight(
  rect: HighlightRect,
  handle: ResizeHandle,
  dx: number,
  dy: number,
  minW: number,
  minH: number,
): HighlightRect {
  let left = rect.x
  let top = rect.y
  let right = rect.x + rect.w
  let bottom = rect.y + rect.h

  if (handle.includes('w')) left = clamp(rect.x + dx, 0, right - minW)
  if (handle.includes('e')) right = clamp(right + dx, left + minW, 1)
  if (handle.includes('n')) top = clamp(rect.y + dy, 0, bottom - minH)
  if (handle.includes('s')) bottom = clamp(bottom + dy, top + minH, 1)

  return { x: left, y: top, w: right - left, h: bottom - top }
}
