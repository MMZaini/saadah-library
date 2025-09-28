'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { thaqalaynApi, Hadith } from '@/lib/api'
import HadithCard from '@/components/HadithCard'
import { IconArrowLeft } from '@/components/Icons'
import { useSettings } from '@/lib/settings-context'
import { useChapter } from '@/lib/chapter-context'

export default function HadithPage() {
  const router = useRouter()
  const params = useParams()
  const { settings } = useSettings()
  const { setChapterInfo } = useChapter()
  
  const hadithId = parseInt(params.hadithId as string)
  
  const [hadith, setHadith] = useState<Hadith | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadHadith = async () => {
      setLoading(true)
      setError(null)
      console.log('Loading ʿUyūn hadith with ID:', hadithId)

      try {
        // Get all hadiths from all ʿUyūn volumes and find the one with matching ID
        let foundHadith: Hadith | null = null
        
        // ʿUyūn akhbār al-Riḍā has 2 volumes
        const uyunVolumes = [
          'Uyun-akhbar-al-Rida-Volume-1-Saduq',
          'Uyun-akhbar-al-Rida-Volume-2-Saduq'
        ]
        
        // Search through each volume
        for (const volumeBookId of uyunVolumes) {
          try {
            console.log(`Searching ${volumeBookId} for hadith ${hadithId}`)
            const volumeHadiths = await thaqalaynApi.getBookHadiths(volumeBookId)
            console.log(`${volumeBookId} has ${volumeHadiths.length} hadiths`)
            foundHadith = volumeHadiths.find(h => h.id === hadithId) || null
            if (foundHadith) {
              console.log(`Found hadith ${hadithId} in ${volumeBookId}`)
              break
            }
          } catch (err) {
            console.error(`Error loading ${volumeBookId}:`, err)
            // Continue to next volume if this one fails
            continue
          }
        }

        if (!foundHadith) {
          console.log(`Hadith ${hadithId} not found in any ʿUyūn volume`)
          setError('Hadith not found')
          return
        }

        console.log('Setting ʿUyūn hadith:', foundHadith)
        setHadith(foundHadith)
        
        // Set chapter context for TopBar navigation
        setChapterInfo({
          volumeId: foundHadith.volume,
          category: foundHadith.category || 'Unknown Category',
          chapter: foundHadith.chapter || 'Unknown Chapter',
          hadithCount: 1,
          categoryId: foundHadith.categoryId,
          chapterInCategoryId: foundHadith.chapterInCategoryId
        })
        
      } catch (err) {
        setError('Failed to load hadith')
      } finally {
        setLoading(false)
      }
    }

    if (hadithId) {
      loadHadith()
    }

    // Clean up chapter context when leaving
    return () => {
      setChapterInfo(null)
    }
  }, [hadithId, setChapterInfo])

  // Scroll to top when page loads
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [hadithId])

  const handleBackClick = () => {
    if (hadith?.volume && hadith?.categoryId && (hadith?.chapterInCategoryId !== null && hadith?.chapterInCategoryId !== undefined)) {
      // Navigate back to the chapter this hadith belongs to
      router.push(`/Uyun-akhbar-al-Rida/volume/${hadith.volume}/chapter/${hadith.categoryId}/${hadith.chapterInCategoryId}`)
    } else {
      // Fallback to ʿUyūn main page
      router.push('/Uyun-akhbar-al-Rida')
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen" data-theme={settings.theme}>
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-primary"></div>
          </div>
        </div>
      </main>
    )
  }

  if (error || !hadith) {
    return (
      <main className="min-h-screen" data-theme={settings.theme}>
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
          <button
            onClick={handleBackClick}
            className="mb-6 flex items-center gap-2 text-primary/70 hover:text-primary transition-colors"
          >
            <IconArrowLeft className="h-4 w-4" />
            Back to ʿUyūn akhbār al-Riḍā
          </button>
          
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-primary mb-4">
                {error || 'Hadith Not Found'}
              </h1>
              <p className="text-secondary mb-6">
                The requested hadith could not be found.
              </p>
              <button
                onClick={handleBackClick}
                className="px-6 py-3 bg-accent-primary text-white rounded-lg hover:bg-accent-secondary transition-colors"
              >
                Return to ʿUyūn akhbār al-Riḍā
              </button>
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen" data-theme={settings.theme}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={handleBackClick}
          className="mb-6 flex items-center gap-2 text-primary/70 hover:text-primary transition-colors"
        >
          <IconArrowLeft className="h-4 w-4" />
          Back to Chapter
        </button>
        
        <div className="space-y-6">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-primary mb-2">
              ʿUyūn akhbār al-Riḍā Hadith #{hadith.id}
            </h1>
            <p className="text-secondary">
              Volume {hadith.volume} • {hadith.category} • {hadith.chapter}
            </p>
          </div>

          {/* Match chapter card layout with index bubble */}
          <div className="relative">
            <div className="absolute -left-4 top-6 w-8 h-8 bg-accent-primary rounded-full flex items-center justify-center text-white text-sm font-bold shadow-medium">
              1
            </div>
            <div className="ml-8">
              <HadithCard 
                hadith={hadith}
                className="mb-6"
                showViewChapter={false}
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
