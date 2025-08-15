'use client'

import { useSettings } from '@/lib/settings-context'
import { IconX } from './Icons'
import clsx from 'clsx'

export default function SettingsSidebar() {
  const { settings, updateSettings, isSettingsOpen, toggleSettings, resetArabicFontSize, resetEnglishFontSize } = useSettings()

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
        className={`fixed right-0 top-0 h-full w-72 sm:w-80 bg-card border-l border-theme shadow-2xl z-[60] p-4 sm:p-6
          transition-transform duration-300 ease-out will-change-transform
          ${isSettingsOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div 
          className={`transition-opacity duration-300 delay-100 ease-out
            ${isSettingsOpen ? 'opacity-100' : 'opacity-0'}`}
        >
          <div className="flex items-center justify-between mb-6 sm:mb-8">
            <h2 className="text-lg font-semibold text-primary">Settings</h2>
            <button 
              onClick={toggleSettings}
              className="p-2 rounded-lg transition-colors hover:bg-card-hover active:bg-card-hover active:scale-95"
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
                    "relative inline-flex w-16 items-center rounded-full px-1 transition-colors focus:outline-none focus:ring-2 focus:ring-accent-primary focus:ring-offset-2 active:scale-95 flex-shrink-0",
                    settings.alwaysShowFullHadith 
                      ? "bg-accent-primary" 
                      : "bg-input"
                  )}
                >
                  <span
                    className={clsx(
                      "inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow-sm",
                      settings.alwaysShowFullHadith ? "translate-x-9" : "translate-x-0"
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
                    className="px-3 py-1 text-xs bg-accent-primary/10 hover:bg-accent-primary/20 text-accent-primary rounded-lg transition-colors"
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
                    className="flex-1 h-2 rounded-full bg-input appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent-primary hover:[&::-webkit-slider-thumb]:bg-accent-secondary [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:transition-colors [&::-webkit-slider-thumb]:shadow-sm"
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
                    className="px-3 py-1 text-xs bg-accent-primary/10 hover:bg-accent-primary/20 text-accent-primary rounded-lg transition-colors"
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
                    className="flex-1 h-2 rounded-full bg-input appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent-primary hover:[&::-webkit-slider-thumb]:bg-accent-secondary [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:transition-colors [&::-webkit-slider-thumb]:shadow-sm"
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
