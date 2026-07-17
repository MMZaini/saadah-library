'use client'

import { Fragment, useRef, useState } from 'react'
import { X } from 'lucide-react'
import type { Highlight } from '@/lib/scan-export'
import {
  moveHighlight,
  resizeHighlight,
  type HighlightRect,
  type ResizeHandle,
} from '@/lib/scan-highlight-geometry'
import { cn } from '@/lib/utils'
import type { ScanTool } from './PageCanvas'

const MIN_DRAW_PX = 6
const MIN_RESIZE_PX = 12

type Interaction =
  | { kind: 'draw'; startX: number; startY: number }
  | {
      kind: 'move' | 'resize'
      startX: number
      startY: number
      highlight: Highlight
      handle?: ResizeHandle
    }

interface HighlightOverlayProps {
  pageNum: number
  tool: ScanTool
  activeColor: string
  highlights: Highlight[]
  selectedHighlightId: string | null
  onActivate: (pageNum: number) => void
  onAddHighlight: (pageNum: number, rect: HighlightRect) => void
  onSelectHighlight: (id: string | null) => void
  onUpdateHighlight: (id: string, patch: Partial<HighlightRect>) => void
  onDeleteHighlight: (id: string) => void
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

const HANDLE_POSITIONS: { handle: ResizeHandle; className: string; cursor: string }[] = [
  { handle: 'nw', className: '-left-2 -top-2', cursor: 'nwse-resize' },
  { handle: 'n', className: 'left-1/2 -top-2 -translate-x-1/2', cursor: 'ns-resize' },
  { handle: 'ne', className: '-right-2 -top-2', cursor: 'nesw-resize' },
  { handle: 'e', className: '-right-2 top-1/2 -translate-y-1/2', cursor: 'ew-resize' },
  { handle: 'se', className: '-bottom-2 -right-2', cursor: 'nwse-resize' },
  { handle: 's', className: '-bottom-2 left-1/2 -translate-x-1/2', cursor: 'ns-resize' },
  { handle: 'sw', className: '-bottom-2 -left-2', cursor: 'nesw-resize' },
  { handle: 'w', className: '-left-2 top-1/2 -translate-y-1/2', cursor: 'ew-resize' },
]

export default function HighlightOverlay({
  pageNum,
  tool,
  activeColor,
  highlights,
  selectedHighlightId,
  onActivate,
  onAddHighlight,
  onSelectHighlight,
  onUpdateHighlight,
  onDeleteHighlight,
}: HighlightOverlayProps) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const interactionRef = useRef<Interaction | null>(null)
  const [draft, setDraft] = useState<HighlightRect | null>(null)

  const point = (event: React.PointerEvent) => {
    const bounds = overlayRef.current!.getBoundingClientRect()
    return {
      x: clamp((event.clientX - bounds.left) / bounds.width, 0, 1),
      y: clamp((event.clientY - bounds.top) / bounds.height, 0, 1),
      bounds,
    }
  }

  const capture = (event: React.PointerEvent) => {
    overlayRef.current?.setPointerCapture(event.pointerId)
  }

  const beginDraw = (event: React.PointerEvent) => {
    onActivate(pageNum)
    if (event.button !== 0) return
    if (tool === 'select') {
      onSelectHighlight(null)
      return
    }
    event.preventDefault()
    const { x, y } = point(event)
    capture(event)
    interactionRef.current = { kind: 'draw', startX: x, startY: y }
    setDraft({ x, y, w: 0, h: 0 })
  }

  const beginEdit = (event: React.PointerEvent, highlight: Highlight, handle?: ResizeHandle) => {
    if (tool !== 'select' || event.button !== 0) return
    event.preventDefault()
    event.stopPropagation()
    ;(event.currentTarget.closest('[role="button"]') as HTMLElement | null)?.focus()
    onActivate(pageNum)
    onSelectHighlight(highlight.id)
    const { x, y } = point(event)
    capture(event)
    interactionRef.current = {
      kind: handle ? 'resize' : 'move',
      startX: x,
      startY: y,
      highlight,
      handle,
    }
  }

  const handlePointerMove = (event: React.PointerEvent) => {
    const interaction = interactionRef.current
    if (!interaction) return
    event.preventDefault()
    const { x, y, bounds } = point(event)
    const dx = x - interaction.startX
    const dy = y - interaction.startY

    if (interaction.kind === 'draw') {
      setDraft({
        x: Math.min(interaction.startX, x),
        y: Math.min(interaction.startY, y),
        w: Math.abs(x - interaction.startX),
        h: Math.abs(y - interaction.startY),
      })
      return
    }

    const original = interaction.highlight
    if (interaction.kind === 'move') {
      onUpdateHighlight(original.id, moveHighlight(original, dx, dy))
      return
    }

    const minW = Math.min(original.w, MIN_RESIZE_PX / bounds.width)
    const minH = Math.min(original.h, MIN_RESIZE_PX / bounds.height)
    onUpdateHighlight(
      original.id,
      resizeHighlight(original, interaction.handle!, dx, dy, minW, minH),
    )
  }

  const endInteraction = (event: React.PointerEvent, commit = true) => {
    const interaction = interactionRef.current
    interactionRef.current = null
    if (commit && interaction?.kind === 'draw' && draft) {
      const bounds = overlayRef.current?.getBoundingClientRect()
      if (
        bounds &&
        draft.w * bounds.width >= MIN_DRAW_PX &&
        draft.h * bounds.height >= MIN_DRAW_PX
      ) {
        onAddHighlight(pageNum, draft)
      }
    }
    setDraft(null)
    if (overlayRef.current?.hasPointerCapture(event.pointerId)) {
      overlayRef.current.releasePointerCapture(event.pointerId)
    }
  }

  // Native drag promotion replaces resize cursors with the browser's no-drop
  // cursor and creates a blank drag payload. Suppress it for the entire editor.
  return (
    <div
      ref={overlayRef}
      draggable={false}
      className="absolute inset-0 select-none [-webkit-touch-callout:none] [-webkit-user-drag:none]"
      style={{
        touchAction: tool === 'draw' || interactionRef.current ? 'none' : 'auto',
        cursor: tool === 'draw' ? 'crosshair' : 'default',
      }}
      onDragStartCapture={(event) => event.preventDefault()}
      onPointerDown={beginDraw}
      onPointerMove={handlePointerMove}
      onPointerUp={endInteraction}
      onPointerCancel={(event) => endInteraction(event, false)}
      onLostPointerCapture={(event) => {
        if (interactionRef.current) endInteraction(event, false)
      }}
    >
      {highlights.map((highlight) => {
        const selected = tool === 'select' && selectedHighlightId === highlight.id
        const rightEdge = highlight.x + highlight.w
        const deletePlacement = rightEdge <= 0.92 ? 'right' : highlight.x >= 0.08 ? 'left' : 'above'
        return (
          <Fragment key={highlight.id}>
            <div
              draggable={false}
              role={tool === 'select' ? 'button' : undefined}
              tabIndex={selected ? 0 : -1}
              aria-label={
                tool === 'select' ? `Highlight on page ${pageNum}. Drag to move.` : undefined
              }
              onPointerDown={(event) => beginEdit(event, highlight)}
              onKeyDown={(event) => {
                if (!selected || (event.key !== 'Delete' && event.key !== 'Backspace')) return
                event.preventDefault()
                onDeleteHighlight(highlight.id)
              }}
              className={cn(
                'absolute',
                tool === 'select' ? 'cursor-move' : 'pointer-events-none',
                selected && 'outline outline-2 outline-offset-1 outline-white',
              )}
              style={{
                left: `${highlight.x * 100}%`,
                top: `${highlight.y * 100}%`,
                width: `${highlight.w * 100}%`,
                height: `${highlight.h * 100}%`,
                touchAction: tool === 'select' ? 'none' : undefined,
                boxShadow: selected ? '0 0 0 3px rgba(24, 24, 27, 0.9)' : undefined,
              }}
            >
              <span
                className="pointer-events-none absolute inset-0"
                style={{ backgroundColor: highlight.color, mixBlendMode: 'multiply' }}
              />
              {selected &&
                HANDLE_POSITIONS.map(({ handle, className, cursor }) => (
                  <span
                    key={handle}
                    aria-hidden
                    draggable={false}
                    onPointerDown={(event) => beginEdit(event, highlight, handle)}
                    className={cn(
                      'absolute h-4 w-4 rounded-[3px] border-2 border-zinc-900 bg-white shadow-sm',
                      className,
                    )}
                    style={{ cursor, touchAction: 'none' }}
                  />
                ))}
            </div>
            {selected && (
              <button
                type="button"
                draggable={false}
                onPointerDown={(event) => {
                  event.preventDefault()
                  event.stopPropagation()
                }}
                onClick={(event) => {
                  event.stopPropagation()
                  onDeleteHighlight(highlight.id)
                }}
                className="absolute z-20 flex h-6 w-6 items-center justify-center rounded-full border border-white/25 bg-zinc-950/85 text-zinc-100 shadow-sm backdrop-blur-sm transition-[background-color,border-color,transform] after:absolute after:-inset-1 after:content-[''] hover:scale-105 hover:border-red-400/60 hover:bg-red-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white active:scale-95"
                style={{
                  left:
                    deletePlacement === 'right'
                      ? `calc(${rightEdge * 100}% + 0.5rem)`
                      : deletePlacement === 'left'
                        ? `calc(${highlight.x * 100}% - 2rem)`
                        : `calc(${rightEdge * 100}% - 1.5rem)`,
                  top:
                    deletePlacement === 'above'
                      ? `calc(${highlight.y * 100}% - 2rem)`
                      : `calc(${highlight.y * 100}% - 0.25rem)`,
                  touchAction: 'manipulation',
                }}
                title="Delete highlight"
                aria-label={`Delete highlight on page ${pageNum}`}
              >
                <X className="h-3.5 w-3.5" strokeWidth={2.25} />
              </button>
            )}
          </Fragment>
        )
      })}
      {draft && (
        <div
          className="pointer-events-none absolute"
          style={{
            left: `${draft.x * 100}%`,
            top: `${draft.y * 100}%`,
            width: `${draft.w * 100}%`,
            height: `${draft.h * 100}%`,
            backgroundColor: activeColor,
            mixBlendMode: 'multiply',
          }}
        />
      )}
    </div>
  )
}
