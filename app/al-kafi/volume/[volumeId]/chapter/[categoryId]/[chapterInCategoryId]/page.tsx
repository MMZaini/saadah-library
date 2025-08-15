'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { alKafiApi, Hadith } from '@/lib/api'
import HadithCard from '@/components/HadithCard'
import { IconArrowLeft } from '@/components/Icons'
import { useSettings } from '@/lib/settings-context'
import { useChapter } from '@/lib/chapter-context'

export default function ChapterDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { settings } = useSettings()
  const { setChapterInfo } = useChapter()
  
  const volumeId = parseInt(params.volumeId as string)
  const categoryId = params.categoryId as string
  const chapterInCategoryId = parseInt(params.chapterInCategoryId as string)
  
  const [hadiths, setHadiths] = useState<Hadith[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [chapterInfo, setLocalChapterInfo] = useState<{
    category: string
    chapter: string
    hadithCount: number
  } | null>(null)

  useEffect(() => {
    const loadChapterHadiths = async () => {
      setLoading(true)
      setError(null)

      try {
        // Get all hadiths for the volume first
        const allHadiths = await alKafiApi.getVolumeHadiths(volumeId)
        
        // Filter hadiths for this specific chapter
        const chapterHadiths = allHadiths.filter(hadith => 
          hadith.categoryId === categoryId && 
          hadith.chapterInCategoryId === chapterInCategoryId
        )

        if (chapterHadiths.length === 0) {
          setError('No hadiths found for this chapter')
          return
        }

        // Get chapter info from first hadith
        const firstHadith = chapterHadiths[0]
        const info = {
          category: firstHadith.category || 'Unknown Category',
          chapter: firstHadith.chapter || 'Unknown Chapter',
          hadithCount: chapterHadiths.length
        }
        
        setLocalChapterInfo(info)
        
        // Update global chapter context for TopBar
        setChapterInfo({
          volumeId,
          category: info.category,
          chapter: info.chapter,
          hadithCount: info.hadithCount
        })

        // Sort hadiths by hadith id if available
        const sortedHadiths = chapterHadiths.sort((a, b) => {
          return a.id - b.id
        })

        setHadiths(sortedHadiths)
        
      } catch (err) {
        setError('Failed to load chapter hadiths')
        console.error('Error loading chapter hadiths:', err)
      } finally {
        setLoading(false)
      }
    }

    if (volumeId && categoryId && (chapterInCategoryId !== null && chapterInCategoryId !== undefined)) {
      loadChapterHadiths()
    }

    // Clean up chapter context when leaving
    return () => {
      setChapterInfo(null)
    }
  }, [volumeId, categoryId, chapterInCategoryId, setChapterInfo])

  // Scroll to top when page loads
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [volumeId, categoryId, chapterInCategoryId])

  if (loading) {
    return (
      <main className="min-h-screen" data-theme={settings.theme}>
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-card border border-theme rounded-xl p-12 shadow-soft">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-primary"></div>
              <span className="ml-3 text-secondary">Loading chapter hadiths...</span>
            </div>
          </div>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="min-h-screen" data-theme={settings.theme}>
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50/80 dark:bg-red-900/20 border border-red-200/60 dark:border-red-800/30 rounded-xl p-6 shadow-soft">
            <p className="text-red-800 dark:text-red-300">{error}</p>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen" data-theme={settings.theme}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Chapter Header */}
        {chapterInfo && (
          <div className="bg-gradient-to-r from-amber-50/80 to-yellow-50/80 dark:from-amber-900/20 dark:to-yellow-900/20 border border-amber-200/60 dark:border-amber-800/30 rounded-xl p-6 shadow-soft mb-8 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-amber-900 dark:text-amber-100 mb-2">
                  {chapterInfo.chapter}
                </h2>
                <p className="text-amber-700 dark:text-amber-300 mb-3 font-medium">
                  Category: {chapterInfo.category}
                </p>
                <div className="flex items-center gap-3 text-sm">
                  <span className="bg-amber-200/80 dark:bg-amber-800/80 text-amber-900 dark:text-amber-100 px-3 py-1.5 rounded-full font-medium shadow-soft">
                    Volume {volumeId}
                  </span>
                  <span className="bg-amber-200/80 dark:bg-amber-800/80 text-amber-900 dark:text-amber-100 px-3 py-1.5 rounded-full font-medium shadow-soft">
                    {chapterInfo.hadithCount} Hadiths
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Hadiths */}
        <div className="space-y-6">
          {hadiths.map((hadith, index) => (
            <div key={hadith._id || hadith.id || index} className="relative">
              {/* Hadith number indicator */}
              <div className="absolute -left-4 top-6 w-8 h-8 bg-accent-primary rounded-full flex items-center justify-center text-white text-sm font-bold shadow-medium">
                {index + 1}
              </div>
              <div className="ml-8">
                <HadithCard hadith={hadith} />
              </div>
            </div>
          ))}
        </div>

        {/* Navigation */}
        <div className="mt-12 pt-8 border-t border-theme">
          <button
            onClick={() => router.push('/al-kafi')}
            className="inline-flex items-center gap-2 px-4 py-3 bg-card border border-theme rounded-lg hover:bg-hover-color hover:shadow-soft transition-all text-primary active:scale-95 font-medium"
            title="Return to Al-Kāfi main page"
          >
            <IconArrowLeft className="h-4 w-4" />
            <span>Back to Al-Kāfi Explorer</span>
          </button>
        </div>
      </div>
    </main>
  )
}
