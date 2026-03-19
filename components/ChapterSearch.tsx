'use client'

import { useRef, useEffect } from 'react'
import { Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ChapterSearchProps {
  value: string
  onChange: (value: string) => void
  resultCount: number
  totalCount: number
  className?: string
}

export default function ChapterSearch({
  value,
  onChange,
  resultCount,
  totalCount,
  className,
}: ChapterSearchProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault()
        inputRef.current?.focus()
      }
      if (e.key === 'Escape' && document.activeElement === inputRef.current) {
        onChange('')
        inputRef.current?.blur()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onChange])

  const isFiltered = value.trim().length > 0

  return (
    <div className={cn('relative', className)}>
      <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-foreground-faint" />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search within chapter…"
        className="h-8 w-full rounded-md border border-border bg-surface-1 pl-8 pr-16 text-xs text-foreground placeholder:text-foreground-faint focus:border-border focus:outline-none"
      />
      <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
        {isFiltered && (
          <>
            <span className="text-[10px] tabular-nums text-foreground-faint">
              {resultCount}/{totalCount}
            </span>
            <button
              onClick={() => onChange('')}
              className="rounded p-0.5 text-foreground-faint transition-colors hover:text-foreground"
            >
              <X className="h-3 w-3" />
            </button>
          </>
        )}
      </div>
    </div>
  )
}
