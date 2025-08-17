'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { alKafiApi, thaqalaynApi, Hadith } from '@/lib/api'
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
      console.log('Loading Al-Kafi hadith with ID:', hadithId)

      try {
        // Get all hadiths from all Al-Kafi volumes and find the one with matching ID
        let foundHadith: Hadith | null = null
        
        // Try volumes 1-8 (Al-Kafi typically has 8 volumes)
        for (let volumeId = 1; volumeId <= 8; volumeId++) {
          try {
            console.log(`Searching volume ${volumeId} for hadith ${hadithId}`)
            const volumeHadiths = await alKafiApi.getVolumeHadiths(volumeId)
            console.log(`Volume ${volumeId} has ${volumeHadiths.length} hadiths`)
            foundHadith = volumeHadiths.find(h => h.id === hadithId) || null
            if (foundHadith) {
              console.log(`Found hadith ${hadithId} in volume ${volumeId}`)
              break
            }
          } catch (err) {
            console.error(`Error loading volume ${volumeId}:`, err)
            // Continue to next volume if this one fails
            continue
          }
        }

        if (!foundHadith) {
          console.log(`Hadith ${hadithId} not found in any volume`)
          setError('Hadith not found')
          return
        }

        console.log('Setting hadith:', foundHadith)
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
      router.push(`/al-kafi/volume/${hadith.volume}/chapter/${hadith.categoryId}/${hadith.chapterInCategoryId}`)
    } else {
      // Fallback to Al-Kafi main page
      router.push('/al-kafi')
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen" data-theme={settings.theme}>
        <div className="mx-auto max-w-4xl px-4 py-8">
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
        <div className="mx-auto max-w-4xl px-4 py-8">
          <button
            onClick={handleBackClick}
            className="mb-6 flex items-center gap-2 text-primary/70 hover:text-primary transition-colors"
          >
            <IconArrowLeft className="h-4 w-4" />
            Back to Al-Kāfi
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
                Return to Al-Kāfi
              </button>
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen" data-theme={settings.theme}>
      <div className="mx-auto max-w-4xl px-4 py-8">
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
              Al-Kāfi Hadith #{hadith.id}
            </h1>
            <p className="text-secondary">
              Volume {hadith.volume} • {hadith.category} • {hadith.chapter}
            </p>
          </div>
          
          <HadithCard 
            hadith={hadith}
            className="mb-6"
            showViewChapter={false}
          />
        </div>
      </div>
    </main>
  )
}
