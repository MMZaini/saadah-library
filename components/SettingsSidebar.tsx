'use client'

import { useSettings } from '@/lib/settings-context'
import { IconX } from './Icons'
import clsx from 'clsx'
import { useEffect, useRef } from 'react'

export default function SettingsSidebar() {
  const { settings, updateSettings, isSettingsOpen, toggleSettings, resetArabicFontSize, resetEnglishFontSize } = useSettings()
  const sidebarRef = useRef<HTMLDivElement>(null)

  // Prevent body scroll when sidebar is open (mobile optimization)
  useEffect(() => {
    if (isSettingsOpen) {
      document.body.style.overflow = 'hidden'
      document.body.style.touchAction = 'none'
    } else {
      document.body.style.overflow = ''
      document.body.style.touchAction = ''
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = ''
      document.body.style.touchAction = ''
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
        className={`fixed inset-0 bg-black/50 backdrop-blur-[2px] z-[60] transition-opacity duration-300 ease-in-out
          ${isSettingsOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={toggleSettings}
        aria-hidden="true"
      />
      
      {/* Sidebar */}
      <div 
        ref={sidebarRef}
        className={`fixed right-0 top-0 h-full w-full sm:w-80 max-w-sm bg-card border-l border-theme shadow-2xl z-[60] p-4 sm:p-6
          transition-transform duration-300 ease-out will-change-transform
          ${isSettingsOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Swipe handle (mobile only) */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-16 bg-theme/20 rounded-r-full sm:hidden" />
        
        <div 
          className={`transition-opacity duration-300 delay-100 ease-out
            ${isSettingsOpen ? 'opacity-100' : 'opacity-0'}`}
        >
          <div className="flex items-center justify-between mb-6 sm:mb-8">
            <h2 className="text-lg font-semibold text-primary">Settings</h2>
            <button 
              onClick={toggleSettings}
              className="p-2 rounded-lg transition-colors hover:bg-card-hover active:bg-card-hover active:scale-95 min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <IconX className="w-5 h-5 text-primary" />
            </button>
          </div>

          <div 
            className={`space-y-4 sm:space-y-6 transition-all duration-300 delay-150 ease-out max-h-[calc(100vh-120px)] overflow-y-auto
              ${isSettingsOpen ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
          >
            {/* Theme Selection */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-secondary">Theme</label>
              <div className="flex justify-center">
                <button
                  className="px-4 sm:px-6 py-2 sm:py-3 rounded-lg border bg-zinc-900 text-white border-zinc-700 shadow-sm font-medium cursor-default text-sm sm:text-base"
                  disabled
                >
                  Dark Mode
                </button>
              </div>
              <p className="text-xs text-muted text-center mt-2">
                Dark mode provides the optimal reading experience
              </p>
            </div>

            {/* Hadith Display Options */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-secondary">Hadith Display</label>
              <div className="flex items-center justify-between p-3 rounded-lg border border-theme/50 bg-card-hover/30">
                <div className="min-w-0 flex-1 mr-3">
                  <p className="text-sm font-medium text-primary">Always Show Full Text</p>
                  <p className="text-xs text-muted mt-1">Expand all hadith text by default</p>
                </div>
                <button
                  onClick={() => updateSettings({ alwaysShowFullHadith: !settings.alwaysShowFullHadith })}
                  className={clsx(
                    "relative inline-flex w-16 h-8 items-center rounded-full px-1 transition-colors focus:outline-none focus:ring-2 focus:ring-accent-primary focus:ring-offset-2 active:scale-95 flex-shrink-0 min-h-[44px] min-w-[64px]",
                    settings.alwaysShowFullHadith 
                      ? "bg-accent-primary" 
                      : "bg-input"
                  )}
                >
                  <span
                    className={clsx(
                      "inline-block h-6 w-6 transform rounded-full bg-white transition-transform shadow-sm",
                      settings.alwaysShowFullHadith ? "translate-x-8" : "translate-x-0"
                    )}
                  />
                </button>
              </div>
            </div>

            {/* Font Size Controls */}
            <div className="space-y-4">
              <div className="mb-2">
                <h3 className="text-sm font-semibold text-primary">Hadith Text Size</h3>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-secondary">
                    Arabic Font Size
                  </label>
                  <button
                    onClick={resetArabicFontSize}
                    className="px-3 py-2 text-xs bg-accent-primary/10 hover:bg-accent-primary/20 text-accent-primary rounded-lg transition-colors min-h-[36px]"
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
                    className="flex-1 h-3 rounded-full bg-input appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent-primary hover:[&::-webkit-slider-thumb]:bg-accent-secondary [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:transition-colors [&::-webkit-slider-thumb]:shadow-sm"
                  />
                  <span className="text-sm tabular-nums text-secondary min-w-[50px] text-right">
                    {settings.arabicFontSize}%
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-secondary">
                    English Font Size
                  </label>
                  <button
                    onClick={resetEnglishFontSize}
                    className="px-3 py-2 text-xs bg-accent-primary/10 hover:bg-accent-primary/20 text-accent-primary rounded-lg transition-colors min-h-[36px]"
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
                    className="flex-1 h-3 rounded-full bg-input appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent-primary hover:[&::-webkit-slider-thumb]:bg-accent-secondary [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:transition-colors [&::-webkit-slider-thumb]:shadow-sm"
                  />
                  <span className="text-sm tabular-nums text-secondary min-w-[50px] text-right">
                    {settings.englishFontSize}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
