'use client'

import { useSettings } from '@/lib/settings-context'
import { IconX } from './Icons'
import clsx from 'clsx'
import { useEffect, useRef } from 'react'

export default function SettingsSidebar() {
  const {
    settings,
    updateSettings,
    isSettingsOpen,
    toggleSettings,
    resetArabicFontSize,
    resetEnglishFontSize,
  } = useSettings()
  const sidebarRef = useRef<HTMLDivElement>(null)
  const scrollYRef = useRef(0)

  // Prevent body scroll when sidebar is open (mobile optimization)
  useEffect(() => {
    const body = document.body
    if (isSettingsOpen) {
      scrollYRef.current = window.scrollY
      body.style.top = `-${scrollYRef.current}px`
      body.style.position = 'fixed'
      body.style.width = '100%'
      body.style.touchAction = 'none'
    } else {
      body.style.position = ''
      body.style.top = ''
      body.style.width = ''
      body.style.touchAction = ''
      window.scrollTo(0, scrollYRef.current)
    }

    // Cleanup on unmount
    return () => {
      body.style.position = ''
      body.style.top = ''
      body.style.width = ''
      body.style.touchAction = ''
    }
  }, [isSettingsOpen])

  // Handle swipe gestures on mobile
  useEffect(() => {
    if (!isSettingsOpen || !sidebarRef.current) return

    let startX = 0
    let startY = 0
    let currentX = 0
    let currentY = 0
    let isDragging = false

    const handleTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX
      startY = e.touches[0].clientY
      currentX = startX
      currentY = startY
      isDragging = false
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging) {
        currentX = e.touches[0].clientX
        currentY = e.touches[0].clientY

        const deltaX = currentX - startX
        const deltaY = Math.abs(currentY - startY)

        // Start dragging if horizontal movement is greater than vertical
        if (Math.abs(deltaX) > deltaY && Math.abs(deltaX) > 10) {
          isDragging = true
        }
      }

      if (isDragging) {
        e.preventDefault()
        currentX = e.touches[0].clientX
        const deltaX = currentX - startX

        // Only allow swiping to the right (positive deltaX)
        if (deltaX > 0) {
          const sidebar = sidebarRef.current
          if (sidebar) {
            sidebar.style.transform = `translateX(${deltaX}px)`
          }
        }
      }
    }

    const handleTouchEnd = () => {
      if (isDragging) {
        const deltaX = currentX - startX
        const sidebar = sidebarRef.current

        if (sidebar) {
          sidebar.style.transform = ''

          // Close if swiped more than 100px to the right
          if (deltaX > 100) {
            toggleSettings()
          }
        }
      }

      isDragging = false
    }

    const sidebar = sidebarRef.current
    sidebar.addEventListener('touchstart', handleTouchStart, { passive: true })
    sidebar.addEventListener('touchmove', handleTouchMove, { passive: false })
    sidebar.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      if (sidebar) {
        sidebar.removeEventListener('touchstart', handleTouchStart)
        sidebar.removeEventListener('touchmove', handleTouchMove)
        sidebar.removeEventListener('touchend', handleTouchEnd)
      }
    }
  }, [isSettingsOpen, toggleSettings])

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm transition-opacity duration-300 ease-in-out ${isSettingsOpen ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        onClick={toggleSettings}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <div
        ref={sidebarRef}
        className={`border-theme fixed right-0 top-0 z-[60] flex h-full w-full max-w-sm flex-col border-l bg-card p-0 shadow-2xl transition-transform duration-300 ease-out will-change-transform sm:w-80 ${isSettingsOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Swipe handle (mobile only) */}
        <div className="bg-theme/20 absolute left-0 top-1/2 h-16 w-1 -translate-y-1/2 rounded-r-full sm:hidden" />

        <div
          className={`flex flex-1 flex-col overflow-hidden p-4 transition-opacity delay-100 duration-300 ease-out sm:p-6 ${isSettingsOpen ? 'opacity-100' : 'opacity-0'}`}
        >
          <div className="mb-6 flex items-center justify-between sm:mb-8">
            <h2 className="text-primary text-lg font-semibold">Settings</h2>
            <button
              onClick={toggleSettings}
              className="hover:bg-card-hover active:bg-card-hover flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg p-2 transition-colors active:scale-95"
            >
              <IconX className="text-primary h-5 w-5" />
            </button>
          </div>

          <div
            className={`min-h-0 flex-1 space-y-4 overflow-y-auto transition-all delay-150 duration-300 ease-out sm:space-y-6 ${isSettingsOpen ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
          >
            {/* Theme Selection */}
            <div className="space-y-2">
              <label className="text-secondary block text-sm font-medium">Theme</label>
              <div className="flex justify-center">
                <button
                  className="cursor-default rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow-sm sm:px-6 sm:py-3 sm:text-base"
                  disabled
                >
                  Dark Mode
                </button>
              </div>
              <p className="mt-2 text-center text-xs text-muted">
                Dark mode provides the optimal reading experience
              </p>
            </div>

            {/* Hadith Display Options */}
            <div className="space-y-2">
              <label className="text-secondary block text-sm font-medium">Hadith Display</label>
              <div className="border-theme/50 bg-card-hover/30 flex items-center justify-between rounded-lg border p-3">
                <div className="mr-3 min-w-0 flex-1">
                  <p className="text-primary text-sm font-medium">Always Show Full Text</p>
                  <p className="mt-1 text-xs text-muted">Expand all hadith text by default</p>
                </div>
                <button
                  onClick={() =>
                    updateSettings({ alwaysShowFullHadith: !settings.alwaysShowFullHadith })
                  }
                  className={clsx(
                    'focus:ring-accent-primary relative inline-flex h-8 min-h-[44px] w-16 min-w-[64px] flex-shrink-0 items-center rounded-full px-1 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 active:scale-95',
                    settings.alwaysShowFullHadith ? 'bg-accent-primary' : 'bg-input',
                  )}
                >
                  <span
                    className={clsx(
                      'inline-block h-6 w-6 transform rounded-full bg-white shadow-sm transition-transform',
                      settings.alwaysShowFullHadith ? 'translate-x-8' : 'translate-x-0',
                    )}
                  />
                </button>
              </div>
            </div>

            {/* Font Size Controls */}
            <div className="space-y-4">
              <div className="mb-2">
                <h3 className="text-primary text-sm font-semibold">Hadith Text Size</h3>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-secondary block text-sm font-medium">
                    Arabic Font Size
                  </label>
                  <button
                    onClick={resetArabicFontSize}
                    className="bg-accent-primary/10 hover:bg-accent-primary/20 text-accent-primary min-h-[36px] rounded-lg px-3 py-2 text-xs transition-colors"
                  >
                    Reset
                  </button>
                </div>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="70"
                    max="200"
                    step="5"
                    value={settings.arabicFontSize}
                    onChange={(e) => updateSettings({ arabicFontSize: Number(e.target.value) })}
                    className="bg-input [&::-webkit-slider-thumb]:bg-accent-primary hover:[&::-webkit-slider-thumb]:bg-accent-secondary h-3 flex-1 appearance-none rounded-full [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-sm [&::-webkit-slider-thumb]:transition-colors"
                  />
                  <span className="text-secondary min-w-[50px] text-right text-sm tabular-nums">
                    {settings.arabicFontSize}%
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-secondary block text-sm font-medium">
                    English Font Size
                  </label>
                  <button
                    onClick={resetEnglishFontSize}
                    className="bg-accent-primary/10 hover:bg-accent-primary/20 text-accent-primary min-h-[36px] rounded-lg px-3 py-2 text-xs transition-colors"
                  >
                    Reset
                  </button>
                </div>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="70"
                    max="200"
                    step="5"
                    value={settings.englishFontSize}
                    onChange={(e) => updateSettings({ englishFontSize: Number(e.target.value) })}
                    className="bg-input [&::-webkit-slider-thumb]:bg-accent-primary hover:[&::-webkit-slider-thumb]:bg-accent-secondary h-3 flex-1 appearance-none rounded-full [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-sm [&::-webkit-slider-thumb]:transition-colors"
                  />
                  <span className="text-secondary min-w-[50px] text-right text-sm tabular-nums">
                    {settings.englishFontSize}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Sidebar Footer */}
        <footer className="flex w-full items-center justify-center border-t border-gray-200 bg-white/70 py-4 dark:border-gray-700 dark:bg-black/30">
          <p className="text-center text-xs text-gray-700 dark:text-gray-300">
            Found a bug or have a feature request? Contact{' '}
            <span className="font-semibold">@deleteooom</span> on Discord.
          </p>
        </footer>
      </div>
    </>
  )
}
