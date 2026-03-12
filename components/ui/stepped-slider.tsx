'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface SteppedSliderProps {
  min: number
  max: number
  step: number
  value: number
  onValueChange: (value: number) => void
  className?: string
}

export function SteppedSlider({
  min,
  max,
  step,
  value,
  onValueChange,
  className,
}: SteppedSliderProps) {
  const trackRef = React.useRef<HTMLDivElement>(null)
  const draggingRef = React.useRef(false)
  const [, forceRender] = React.useState(0)

  const steps = React.useMemo(() => {
    const arr: number[] = []
    for (let v = min; v <= max; v += step) arr.push(v)
    return arr
  }, [min, max, step])

  const stepCount = steps.length - 1
  const currentIndex = steps.indexOf(value)
  const activeIndex =
    currentIndex >= 0 ? currentIndex : Math.round(((value - min) / (max - min)) * stepCount)
  const fraction = stepCount > 0 ? activeIndex / stepCount : 0

  const resolveFromPointer = React.useCallback(
    (clientX: number) => {
      const track = trackRef.current
      if (!track) return
      const rect = track.getBoundingClientRect()
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
      const idx = Math.round(ratio * stepCount)
      onValueChange(steps[idx])
    },
    [stepCount, steps, onValueChange],
  )

  React.useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!draggingRef.current) return
      resolveFromPointer(e.clientX)
    }
    const onUp = () => {
      if (!draggingRef.current) return
      draggingRef.current = false
      forceRender((c) => c + 1)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }
  }, [resolveFromPointer])

  const handlePointerDown = React.useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault()
      e.stopPropagation()
      draggingRef.current = true
      forceRender((c) => c + 1)
      resolveFromPointer(e.clientX)
    },
    [resolveFromPointer],
  )

  return (
    <div
      className={cn('relative flex w-full touch-none select-none items-center', className)}
      style={{ height: 28 }}
      onPointerDown={handlePointerDown}
      role="slider"
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
          e.preventDefault()
          const next = Math.min(activeIndex + 1, stepCount)
          onValueChange(steps[next])
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
          e.preventDefault()
          const prev = Math.max(activeIndex - 1, 0)
          onValueChange(steps[prev])
        }
      }}
    >
      {/* Track */}
      <div ref={trackRef} className="relative h-1 w-full rounded-sm bg-zinc-800">
        {/* Active fill */}
        <div
          className="absolute inset-y-0 left-0 rounded-sm bg-zinc-500"
          style={{ width: `${fraction * 100}%` }}
        />

        {/* Step notches */}
        {steps.map((s, i) => {
          const pct = (i / stepCount) * 100
          const isActive = i <= activeIndex
          return (
            <div
              key={s}
              className={cn(
                'absolute top-1/2 z-10 h-2 w-[3px] -translate-x-1/2 -translate-y-1/2 rounded-[1px] transition-colors duration-100',
                isActive ? 'bg-zinc-400' : 'bg-zinc-700',
              )}
              style={{ left: `${pct}%` }}
            />
          )
        })}

        {/* Thumb */}
        <div
          className={cn(
            'absolute top-1/2 z-20 -translate-x-1/2 -translate-y-1/2',
            'h-3.5 w-2.5 rounded-[2px] border border-zinc-500 bg-zinc-300 shadow-sm',
            draggingRef.current && 'scale-110 bg-zinc-200',
          )}
          style={{ left: `${fraction * 100}%` }}
        />
      </div>
    </div>
  )
}
