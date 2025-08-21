 'use client'

import { useState, useEffect } from 'react'
import { thaqalaynApi, Hadith } from '@/lib/api'
import HadithCard from './HadithCard'
import clsx from 'clsx'
import { makeVolumeOptions, getVolumeLabelForValue } from '@/lib/volume-utils'

export default function GenericVolumeExplorer({ bookConfig, className }: any) {
  const [selectedVolume, setSelectedVolume] = useState<string | 'all'>(() => {
    if (bookConfig?.hasMultipleVolumes) return bookConfig?.volumes?.[0] ?? 'all'
    return bookConfig?.volumes?.[0] ?? bookConfig?.bookId ?? 'all'
  })

  const [randomHadith, setRandomHadith] = useState<Hadith | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const volumesList: string[] = bookConfig?.hasMultipleVolumes ? bookConfig.volumes : [bookConfig?.bookId]
  const isMulti = !!bookConfig?.hasMultipleVolumes
  const volumeOptions = makeVolumeOptions(volumesList)
  const displayTitle = bookConfig?.englishName || bookConfig?.bookId || 'This Book'
  const volumesCount = (Array.isArray(volumesList) && volumesList.length) || 1

  const loadRandomHadithFromVolume = async (volume: string | 'all') => {
    setLoading(true)
    setError(null)
    setRandomHadith(null)

    try {
      let hadith: Hadith | null = null
      if (volume === 'all') {
        const candidates = (volumesList || []).filter(Boolean)
        if (candidates.length === 0) throw new Error('No volumes available')
        const randomBook = candidates[Math.floor(Math.random() * candidates.length)]
        hadith = await thaqalaynApi.getRandomHadithFromBook(randomBook)
      } else {
        hadith = await thaqalaynApi.getRandomHadithFromBook(volume)
      }

      setRandomHadith(hadith)
    } catch (err) {
      // Error logging removed
      setError('Failed to load hadith from this volume')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // load initial random hadith for the first volume
    loadRandomHadithFromVolume(selectedVolume)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleVolumeSelect = (volume: string | 'all') => {
    setSelectedVolume(volume)
    loadRandomHadithFromVolume(volume)
  }

  return (
    <div className={clsx('space-y-6', className)}>
      {/* Volume Selector */}
      <div className="bg-gradient-to-r from-white to-slate-50/80 dark:from-slate-800/50 dark:to-slate-900/30 border border-slate-200/60 dark:border-slate-700/50 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl flex items-center justify-center">
            <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">{displayTitle} Volume Explorer</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">{displayTitle} consists of {volumesCount} volume{volumesCount === 1 ? '' : 's'}. Select a specific volume or "All Volumes" to explore random hadiths.</p>
          </div>
        </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {isMulti ? (
              <>
                <label htmlFor="volume-select" className="text-sm font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                  Volume:
                </label>
                <div className="relative">
                  <select
                    id="volume-select"
                    value={selectedVolume}
                    onChange={(e) => handleVolumeSelect(e.target.value === 'all' ? 'all' : e.target.value)}
                    disabled={loading}
                    className={clsx(
                      'appearance-none bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600',
                      'rounded-xl px-4 py-2.5 pr-12 font-semibold text-slate-900 dark:text-slate-100',
                      'shadow-sm hover:shadow-md transition-all duration-200',
                      'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary',
                      'hover:border-primary/50 cursor-pointer min-w-[130px]',
                      loading && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    {volumeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>

                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg className="w-4 h-4 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">Volume: <span className="font-medium">{getVolumeLabelForValue(volumesList, volumeOptions[0]?.value)}</span></div>
            )}

          </div>

          <button
            onClick={() => loadRandomHadithFromVolume(selectedVolume)}
            disabled={loading}
            className={clsx(
              'px-6 py-2.5 rounded-xl font-semibold transition-all duration-200 shadow-sm hover:shadow-md',
              'bg-gradient-to-r from-primary to-primary/90 text-white',
              'hover:from-primary/90 hover:to-primary/80 hover:scale-105',
              loading && 'opacity-50 cursor-not-allowed hover:scale-100'
            )}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Loading...
              </div>
            ) : (
              'New Hadith'
            )}
          </button>
        </div>
      </div>

      {/* Hadith Display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-xl p-4">
          <p className="text-red-800 dark:text-red-300 text-sm">{error}</p>
        </div>
      )}

      {loading && (
        <div className="bg-card border border-theme rounded-xl p-12 shadow-soft">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-3 text-muted">Loading hadith...</span>
          </div>
        </div>
      )}

      {!loading && !error && randomHadith && (
        <>
          <div className="flex items-center justify-center gap-2 text-sm text-slate-600 dark:text-slate-400">
            <div className="w-2 h-2 rounded-full bg-primary/60"></div>
            <span>
              Random hadith from {selectedVolume === 'all' ? `All ${displayTitle} Volumes` : `${displayTitle} ${getVolumeLabelForValue(volumesList, selectedVolume)}`}
            </span>
          </div>
          <HadithCard hadith={randomHadith} />
        </>
      )}
    </div>
  )
}
