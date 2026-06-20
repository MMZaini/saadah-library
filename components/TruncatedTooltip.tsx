'use client'

import { useRef, useState, useEffect } from 'react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

interface TruncatedTooltipProps {
  /** The full text to display (and reveal in a tooltip when clipped). */
  text: string
  /** Classes for the visible span — include any width cap that drives truncation. */
  className?: string
  /** Tooltip side; defaults to `bottom` since this is used in the top bar. */
  side?: 'top' | 'bottom' | 'left' | 'right'
}

/**
 * Single-line truncated text that reveals its full value in a tooltip **only
 * when actually clipped**. The DOM tree is stable (the span is always the
 * trigger) so the overflow-measurement ref never detaches; a ResizeObserver
 * keeps the clipped/visible decision correct as the layout reflows. The tooltip
 * content is simply omitted while the text fits, so no tooltip fires.
 */
export default function TruncatedTooltip({
  text,
  className,
  side = 'bottom',
}: TruncatedTooltipProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const [clipped, setClipped] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const measure = () => setClipped(el.scrollWidth > el.clientWidth + 1)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [text])

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span ref={ref} className={cn('truncate', className)}>
          {text}
        </span>
      </TooltipTrigger>
      {clipped && (
        <TooltipContent
          side={side}
          className="max-w-[min(88vw,360px)] whitespace-normal break-words"
        >
          {text}
        </TooltipContent>
      )}
    </Tooltip>
  )
}
