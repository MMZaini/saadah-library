'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { uyunApi, Hadith } from '@/lib/api'
import HadithCard from '@/components/HadithCard'
import { IconArrowLeft } from '@/components/Icons'
import { useSettings } from '@/lib/settings-context'
import { useChapter } from '@/lib/chapter-context'

export default function UyunChapterDetailPage() {
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
        const allHadiths = await uyunApi.getVolumeHadiths(volumeId)
        
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
        const chapterData = {
          volumeId,
          category: firstHadith.category || 'Unknown Category',
          chapter: firstHadith.chapter || 'Unknown Chapter',
          hadithCount: chapterHadiths.length
        }

        setLocalChapterInfo({
          category: chapterData.category,
          chapter: chapterData.chapter,
          hadithCount: chapterData.hadithCount
        })
        setChapterInfo(chapterData)
        setHadiths(chapterHadiths)
      } catch (error) {
        console.error('Error loading chapter hadiths:', error)
        setError('Failed to load chapter content')
      } finally {
        setLoading(false)
      }
    }

    if (volumeId && categoryId && (chapterInCategoryId !== null && chapterInCategoryId !== undefined)) {
      loadChapterHadiths()
    }
  }, [volumeId, categoryId, chapterInCategoryId, setChapterInfo])

  const handleBackNavigation = () => {
  router.push('/book/Uyun-akhbar-al-Rida')
  }

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
          <div className="bg-gradient-to-r from-emerald-50/80 to-teal-50/80 dark:from-emerald-900/20 dark:to-teal-900/20 border border-emerald-200/60 dark:border-emerald-800/30 rounded-xl p-6 shadow-soft mb-8 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-emerald-900 dark:text-emerald-100 mb-2">
                  {chapterInfo.chapter}
                </h2>
                <p className="text-emerald-700 dark:text-emerald-300 mb-3 font-medium">
                  Category: {chapterInfo.category}
                </p>
                <div className="flex items-center gap-3 text-sm">
                  <span className="bg-emerald-200/80 dark:bg-emerald-800/80 text-emerald-900 dark:text-emerald-100 px-3 py-1.5 rounded-full font-medium shadow-soft">
                    Volume {volumeId}
                  </span>
                  <span className="bg-emerald-200/80 dark:bg-emerald-800/80 text-emerald-900 dark:text-emerald-100 px-3 py-1.5 rounded-full font-medium shadow-soft">
                    {chapterInfo.hadithCount} Hadiths
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mb-8">
        </div>

        {/* Hadiths */}
        <div className="space-y-8">
          {hadiths.map((hadith, index) => (
            <HadithCard
              key={hadith.id}
              hadith={hadith}
            />
          ))}
        </div>
      </div>
    </main>
  )
}
