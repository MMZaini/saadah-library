'use client'

import { useCallback } from 'react'

const globalFunctionCandidates = [
  'openAuthPopup',
  'toggleAuthPopup',
  'openAuthModal',
  'toggleAuthModal',
  'showAuthPopup',
  'showAuthModal',
  'openSignInPopup',
  'openSignInModal',
  'triggerAuthPopup'
] as const

const fallbackSelectors = [
  '[data-auth-popup-trigger]',
  '[data-action="open-auth-popup"]',
  '#auth-popup-trigger',
  '#sign-in-trigger',
  '#sign-up-trigger',
]

type MaybeWindowWithAuth = typeof window & {
  [K in (typeof globalFunctionCandidates)[number]]?: () => void
}

const SparkleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
    <path
      d="M12 3.5l1.4 3.2a2 2 0 001 1l3.1 1.1-3.1 1.1a2 2 0 00-1 1L12 14.1l-1.4-3.2a2 2 0 00-1-1l-3.1-1.1 3.1-1.1a2 2 0 001-1L12 3.5z"
      strokeWidth="1.4"
      strokeLinejoin="round"
    />
    <path d="M18.5 5.5l.6 1.2.6 1.2-1.2.4-1.2.4.6-1.2z" strokeWidth="1" strokeLinejoin="round" />
    <path d="M5.5 16.5l.7 1.5.7 1.5-1.5.5-1.5.5.7-1.5z" strokeWidth="1" strokeLinejoin="round" />
  </svg>
)

function tryTriggerPopup(win: MaybeWindowWithAuth) {
  for (const fnName of globalFunctionCandidates) {
    const maybeFn = win[fnName]
    if (typeof maybeFn === 'function') {
      maybeFn()
      return true
    }
  }

  for (const selector of fallbackSelectors) {
    const element = document.querySelector(selector)
    if (element instanceof HTMLElement) {
      element.click()
      return true
    }
  }

  return false
}

export default function SignInButton() {
  const handleClick = useCallback(() => {
    if (typeof window === 'undefined') return

    const win = window as MaybeWindowWithAuth

    const dispatched = window.dispatchEvent(
      new CustomEvent('open-auth-popup', { bubbles: true })
    )

    if (!dispatched || !tryTriggerPopup(win)) {
      // As a final fallback, try focusing a generic auth portal button if present
      const fallbackElement = document.querySelector<HTMLElement>('[data-portal="auth"] button')
      fallbackElement?.click()
    }
  }, [])

  return (
    <button
      type="button"
      onClick={handleClick}
      className="group relative flex flex-shrink-0 items-center gap-3 overflow-hidden rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 px-4 py-1.5 text-sm font-semibold text-white shadow-[0_12px_30px_-12px_rgba(245,158,11,0.85)] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-14px_rgba(249,115,22,0.75)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
      aria-label="Open sign in or sign up"
    >
      <span
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        aria-hidden="true"
      >
        <span className="absolute inset-0 bg-gradient-to-r from-white/15 via-transparent to-white/15" />
        <span className="absolute -left-10 top-0 h-full w-16 rotate-12 bg-white/30 blur-2xl" />
      </span>
      <span className="relative flex items-center gap-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
          <SparkleIcon className="h-4 w-4 text-white drop-shadow-sm" />
        </span>
        <span className="flex flex-col text-left leading-tight">
          <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/70">Account</span>
          <span className="text-sm font-semibold">Sign in / Join</span>
        </span>
      </span>
    </button>
  )
}
