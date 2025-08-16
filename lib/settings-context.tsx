'use client'

import { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react'

// Check localStorage availability
const isLocalStorageAvailable = () => {
  try {
    if (typeof window === 'undefined') return false
    const test = '__localStorage_test__'
    localStorage.setItem(test, test)
    localStorage.removeItem(test)
    return true
  } catch {
    return false
  }
}

type Settings = {
  theme: 'dark' | 'light'
  arabicFontSize: number // percentage (100 = 100% = default)
  englishFontSize: number // percentage (100 = 100% = default)
  alwaysShowFullHadith: boolean // whether to show full hadith text by default
}

type SettingsContextType = {
  settings: Settings
  updateSettings: (settings: Partial<Settings>) => void
  isSettingsOpen: boolean
  toggleSettings: () => void
  resetFontSizes: () => void
  resetArabicFontSize: () => void
  resetEnglishFontSize: () => void
  isHydrated: boolean
}

const defaultSettings: Settings = {
  theme: 'dark',
  arabicFontSize: 100, // 100%
  englishFontSize: 100, // 100%
  alwaysShowFullHadith: false // false = collapsed by default (current behavior)
}

const SettingsContext = createContext<SettingsContextType | null>(null)

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(defaultSettings)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    // Mark as hydrated and load settings from localStorage
    setIsHydrated(true)
    
    // Check if localStorage is available
    if (!isLocalStorageAvailable()) {
      setSettings(defaultSettings)
      return
    }
    
    try {
      const savedSettings = localStorage.getItem('siteSettings')
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings)
        
        // Merge with defaults to handle new settings that might not be in saved data
        const mergedSettings = {
          ...defaultSettings,
          ...parsed,
          theme: 'dark' // Always force dark mode
        }
        
        setSettings(mergedSettings)
      } else {
        setSettings(defaultSettings)
      }
    } catch (error) {
      setSettings(defaultSettings)
    }
  }, [])

  useEffect(() => {
    // Only update DOM after hydration to avoid mismatch
    if (isHydrated) {
      const root = document.documentElement
      root.setAttribute('data-theme', settings.theme)
      
      // Set font size CSS custom properties
      root.style.setProperty('--hadith-arabic-font-size', `${settings.arabicFontSize}%`)
      root.style.setProperty('--hadith-english-font-size', `${settings.englishFontSize}%`)
    } else {
      // Set initial theme immediately on load to prevent flash
      if (typeof document !== 'undefined') {
        document.documentElement.setAttribute('data-theme', 'dark')
      }
    }
  }, [settings.theme, settings.arabicFontSize, settings.englishFontSize, settings.alwaysShowFullHadith, isHydrated])

  const updateSettings = useCallback((newSettings: Partial<Settings>) => {
    // If called before hydration, allow the state update to proceed so UI sliders are responsive.
    // Persistence to localStorage will only be attempted when hydrated to avoid DOM/storage races.

    setSettings(prev => {
      const updated = { ...prev, ...newSettings }

      // Immediately reflect font size changes on the root so CSS-variable-driven
      // styles respond to the slider without waiting for the hydration effect.
      // This is safe because it's a client-side mutation triggered by user input.
      try {
        if (typeof document !== 'undefined') {
          const root = document.documentElement
          if (updated.arabicFontSize !== undefined) {
            root.style.setProperty('--hadith-arabic-font-size', `${updated.arabicFontSize}%`)
          }
          if (updated.englishFontSize !== undefined) {
            root.style.setProperty('--hadith-english-font-size', `${updated.englishFontSize}%`)
          }
        }
      } catch (e) {
        // Fail silently — not critical
      }

      // Persist only when hydrated and localStorage is available
      if (isHydrated && isLocalStorageAvailable()) {
        try {
          localStorage.setItem('siteSettings', JSON.stringify(updated))
        } catch (error) {

          // Try to clear localStorage if it's full
          if (error instanceof Error && error.message.includes('QuotaExceededError')) {
            try {
              localStorage.clear()
              localStorage.setItem('siteSettings', JSON.stringify(updated))
            } catch (clearError) {
              // Silent fail
            }
          }
        }
      }

      return updated
    })
  }, [isHydrated])

  const toggleSettings = useCallback(() => setIsSettingsOpen(prev => !prev), [])

  const resetFontSizes = useCallback(() => {
    updateSettings({ 
      arabicFontSize: 100, 
      englishFontSize: 100 
    })
  }, [updateSettings])

  const resetArabicFontSize = useCallback(() => {
    updateSettings({ arabicFontSize: 100 })
  }, [updateSettings])

  const resetEnglishFontSize = useCallback(() => {
    updateSettings({ englishFontSize: 100 })
  }, [updateSettings])

  const contextValue = useMemo(() => ({
    settings,
    updateSettings,
    isSettingsOpen,
    toggleSettings,
    resetFontSizes,
    resetArabicFontSize,
    resetEnglishFontSize,
    isHydrated // Expose hydration state
  }), [settings, updateSettings, isSettingsOpen, toggleSettings, resetFontSizes, resetArabicFontSize, resetEnglishFontSize, isHydrated])

  return (
    <SettingsContext.Provider value={contextValue}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const context = useContext(SettingsContext)
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider')
  }
  return context
}
