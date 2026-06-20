'use client'

import { useRef, useState } from 'react'
import { Search, Loader2, Clock, SlidersHorizontal } from 'lucide-react'
import { useSearchShortcuts } from '@/lib/use-search-shortcuts'
import { cn } from '@/lib/utils'

interface SearchBarProps {
  value: string
  /** Called on every input change and on history selection. Parent owns debouncing/searching. */
  onChange: (value: string) => void
  placeholder?: string
  isSearching?: boolean
  showFilterButton?: boolean
  filtersOpen?: boolean
  onFilterClick?: () => void
  /** Tailwind classes for the outer container (e.g. a max-width override). */
  className?: string
  /**
   * `page` is the large, centered field used in page bodies; `topbar` is the
   * compact field that lives in the persistent top navigation bar.
   */
  variant?: 'page' | 'topbar'
}

/**
 * Shared search input used by the home, Al-Kāfi, and generic book pages.
 * Owns the input ref, keyboard shortcuts (Ctrl+K / "/"), and the recent-search
 * history dropdown so each page only needs to wire value + onChange.
 */
export default function SearchBar({
  value,
  onChange,
  placeholder = 'Search hadith… (Ctrl+K)',
  isSearching = false,
  showFilterButton = false,
  filtersOpen = false,
  onFilterClick,
  className,
  variant = 'page',
}: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const { history, addToHistory, clearHistory } = useSearchShortcuts(inputRef)
  const [showHistory, setShowHistory] = useState(false)

  const isTopbar = variant === 'topbar'

  const handleChange = (next: string) => {
    setShowHistory(false)
    onChange(next)
  }

  return (
    <div className={cn(isTopbar ? '' : 'mx-auto max-w-2xl px-4 pt-6 sm:px-6', className)}>
      <div className="relative">
        <div
          className={cn(
            'flex items-center rounded-lg border border-border bg-surface-1 transition-colors focus-within:border-ring focus-within:ring-1 focus-within:ring-ring',
            isTopbar ? 'gap-2 px-2.5 py-1.5' : 'gap-3 px-3.5 py-2.5',
          )}
        >
          <Search className="h-4 w-4 shrink-0 text-foreground-faint" />
          <input
            ref={inputRef}
            placeholder={placeholder}
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            onFocus={() => {
              if (!value && history.length > 0) setShowHistory(true)
            }}
            onBlur={() => setTimeout(() => setShowHistory(false), 200)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                if (value.trim()) addToHistory(value.trim())
                setShowHistory(false)
              }
              if (e.key === 'Escape') {
                setShowHistory(false)
                inputRef.current?.blur()
              }
            }}
            className="w-full min-w-0 bg-transparent text-sm text-foreground outline-none placeholder:text-foreground-faint"
          />
          {isSearching && (
            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-foreground-muted" />
          )}
          {isTopbar && showFilterButton && (
            <button
              type="button"
              aria-label={filtersOpen ? 'Close hadith filters' : 'Open hadith filters'}
              aria-pressed={filtersOpen}
              title={filtersOpen ? 'Close hadith filters' : 'Hadith filters'}
              onMouseDown={(e) => e.preventDefault()}
              onClick={onFilterClick}
              className={cn(
                'flex h-6 w-6 shrink-0 items-center justify-center rounded border transition-colors',
                filtersOpen
                  ? 'border-accent bg-accent text-accent-foreground'
                  : 'border-border text-foreground-faint hover:bg-surface-2 hover:text-foreground-muted',
              )}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Search history dropdown */}
        {showHistory && history.length > 0 && (
          <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-lg border border-border bg-surface-1 shadow-lg">
            <div className="flex items-center justify-between px-3 py-1.5">
              <span className="text-xs font-medium text-foreground-muted">Recent searches</span>
              <button
                onMouseDown={(e) => e.preventDefault()}
                onClick={clearHistory}
                className="text-xs text-foreground-faint transition-colors hover:text-foreground-muted"
              >
                Clear
              </button>
            </div>
            {history.map((q, i) => (
              <button
                key={i}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleChange(q)}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-surface-2"
              >
                <Clock className="h-3 w-3 shrink-0 text-foreground-faint" />
                <span className="truncate">{q}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
