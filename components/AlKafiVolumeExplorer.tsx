'use client'

import { useState, useEffect } from 'react'
import { alKafiApi, Hadith } from '@/lib/api'
import HadithCard from './HadithCard'
import { cn } from '@/lib/utils'

interface AlKafiVolumeExplorerProps {
  className?: string
}

export default function AlKafiVolumeExplorer({ className }: AlKafiVolumeExplorerProps) {
  const [selectedVolume, setSelectedVolume] = useState<number | 'all'>(1)
  const [randomHadith, setRandomHadith] = useState<Hadith | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const alKafiVolumes = Array.from({ length: 8 }, (_, i) => i + 1)
  const volumeOptions = [
    ...alKafiVolumes.map((vol) => ({ value: vol, label: `Volume ${vol}` })),
    { value: 'all' as const, label: 'All Volumes' },
  ]

  const loadRandomHadithFromVolume = async (volume: number | 'all') => {
    setLoading(true)
    setError(null)

    try {
      let hadith
      if (volume === 'all') {
        // Get random hadith from a random volume
        const randomVolume = Math.floor(Math.random() * 8) + 1
        hadith = await alKafiApi.getRandomHadithFromVolume(randomVolume)
      } else {
        hadith = await alKafiApi.getRandomHadithFromVolume(volume)
      }
      setRandomHadith(hadith)
    } catch {
      setError('Failed to load hadith from this volume')
      // Error logging removed
    } finally {
      setLoading(false)
    }
  }

  const handleVolumeSelect = (volume: number | 'all') => {
    setSelectedVolume(volume)
    loadRandomHadithFromVolume(volume)
  }

  // Load initial hadith from volume 1
  useEffect(() => {
    loadRandomHadithFromVolume(1)
  }, [])

  return (
    <div className={cn('space-y-6', className)}>
      {/* Volume Selector */}
      <div className="rounded-xl border border-border bg-surface-1 p-6">
        <div className="mb-4 flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-2">
            <svg
              className="h-5 w-5 text-foreground-muted"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
          </div>
          <div>
            <h3 className="mb-1 text-lg font-bold text-foreground">Al-Kāfi Volume Explorer</h3>
            <p className="text-sm text-foreground-muted">
              Al-Kāfi consists of 8 volumes. Select a specific volume or &quot;All Volumes&quot; to
              explore random hadiths.
            </p>
          </div>
        </div>

        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <label
              htmlFor="volume-select"
              className="whitespace-nowrap text-sm font-semibold text-foreground-muted"
            >
              Volume:
            </label>
            <div className="relative">
              <select
                id="volume-select"
                value={selectedVolume}
                onChange={(e) =>
                  handleVolumeSelect(e.target.value === 'all' ? 'all' : Number(e.target.value))
                }
                disabled={loading}
                className={cn(
                  'appearance-none border border-border bg-background',
                  'rounded-lg px-4 py-2.5 pr-12 font-semibold text-foreground',
                  'transition-colors duration-200',
                  'focus:border-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-600/20',
                  'min-w-[130px] cursor-pointer hover:border-zinc-600/50',
                  loading && 'cursor-not-allowed opacity-50',
                )}
              >
                {volumeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              {/* Custom dropdown arrow */}
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                <svg
                  className="h-4 w-4 text-foreground-muted"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>
          </div>

          <button
            onClick={() => loadRandomHadithFromVolume(selectedVolume)}
            disabled={loading}
            className={cn(
              'rounded-lg bg-accent px-6 py-2.5 font-semibold text-accent-foreground',
              'hover:bg-accent/90 transition-colors duration-200',
              loading && 'cursor-not-allowed opacity-50',
            )}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
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
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-800/30 dark:bg-red-900/20">
          <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
        </div>
      )}

      {loading && (
        <div className="border-theme bg-card shadow-soft rounded-xl border p-12">
          <div className="flex items-center justify-center">
            <div className="border-primary h-8 w-8 animate-spin rounded-full border-b-2"></div>
            <span className="text-muted ml-3">
              Loading hadith from{' '}
              {selectedVolume === 'all' ? 'All Al-Kāfi Volumes' : `Volume ${selectedVolume}`}...
            </span>
          </div>
        </div>
      )}

      {!loading && !error && randomHadith && (
        <>
          <div className="flex items-center justify-center gap-2 text-sm text-foreground-muted">
            <div className="bg-accent/60 h-2 w-2 rounded-full"></div>
            <span>
              Random hadith from{' '}
              {selectedVolume === 'all'
                ? 'All Al-Kāfi Volumes'
                : `Al-Kāfi Volume ${selectedVolume}`}
            </span>
          </div>
          <HadithCard hadith={randomHadith} />
        </>
      )}
    </div>
  )
}
