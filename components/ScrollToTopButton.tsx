'use client'

import { useEffect, useState } from 'react'
import { ArrowUp } from 'lucide-react'
import { throttle } from '@/lib/performance'
import { cn } from '@/lib/utils'

/**
 * Floating "back to top" affordance for long reading pages. Appears after a
 * screenful of scrolling; sits above the mobile bottom nav.
 */
export default function ScrollToTopButton() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = throttle(() => {
      setVisible(window.scrollY > window.innerHeight)
    }, 150)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <button
      type="button"
      aria-label="Back to top"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className={cn(
        'fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom))] right-4 z-40 md:bottom-6 md:right-6',
        'flex h-10 w-10 items-center justify-center rounded-full border border-border',
        'bg-surface-1/95 text-foreground-muted shadow-lg backdrop-blur transition-all',
        'hover:bg-surface-2 hover:text-foreground',
        visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-2 opacity-0',
      )}
    >
      <ArrowUp className="h-4 w-4" />
    </button>
  )
}
