import type { Highlight } from './scan-export'

export type HighlightRect = Pick<Highlight, 'x' | 'y' | 'w' | 'h'>
export type ResizeHandle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w'

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

/** Moves a normalised highlight while keeping the complete rectangle on its page. */
export function moveHighlight(rect: HighlightRect, dx: number, dy: number): HighlightRect {
  return {
    ...rect,
    x: clamp(rect.x + dx, 0, 1 - rect.w),
    y: clamp(rect.y + dy, 0, 1 - rect.h),
  }
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
