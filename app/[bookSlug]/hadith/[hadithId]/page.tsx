'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { thaqalaynApi, Hadith } from '@/lib/api'
import { getBookConfig, getBookIdFromUrlSlug, getBookUrlSlug } from '@/lib/books-config'
import HadithCard from '@/components/HadithCard'
import { IconArrowLeft } from '@/components/Icons'
import { useSettings } from '@/lib/settings-context'
import { useChapter } from '@/lib/chapter-context'

export default function HadithPage() {
  const router = useRouter()
  const params = useParams()
  const { settings } = useSettings()
  const { setChapterInfo } = useChapter()

  const urlSlug = params?.bookSlug as string
  const bookId = getBookIdFromUrlSlug(urlSlug)
  const hadithId = parseInt(params.hadithId as string)

  const [hadith, setHadith] = useState<Hadith | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadHadith = async () => {
      if (!bookId) {
        setError('Book not found')
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      try {
        console.log('Loading hadith with ID:', hadithId, 'from book:', bookId, 'urlSlug:', urlSlug)
        console.log('hadithId type:', typeof hadithId, 'isNaN:', isNaN(hadithId))

        let foundHadith: Hadith | null = null

        // Check if this is a multi-volume book that needs special handling
        console.log(
          'Checking if bookId contains Uyun-akhbar-al-Rida:',
          bookId?.includes('Uyun-akhbar-al-Rida'),
        )
        console.log(
          'urlSlug:',
          urlSlug,
          'urlSlug === Uyun-akhbar-al-Rida:',
          urlSlug === 'Uyun-akhbar-al-Rida',
        )

        if (
          (bookId && bookId.includes('Uyun-akhbar-al-Rida')) ||
          urlSlug === 'Uyun-akhbar-al-Rida'
        ) {
          // Handle ʿUyūn akhbār al-Riḍā multi-volume search
          const uyunVolumes = [
            'Uyun-akhbar-al-Rida-Volume-1-Saduq',
            'Uyun-akhbar-al-Rida-Volume-2-Saduq',
          ]

          console.log('Starting multi-volume search for ʿUyūn hadith', hadithId)

          for (const volumeBookId of uyunVolumes) {
            try {
              console.log(`Searching ${volumeBookId} for hadith ${hadithId}`)
              const volumeHadiths = await thaqalaynApi.getBookHadiths(volumeBookId)
              console.log(`${volumeBookId} has ${volumeHadiths.length} hadiths`)

              // Log first few hadith IDs to see what we're working with
              if (volumeHadiths.length > 0) {
                console.log(
                  'First 5 hadith IDs in',
                  volumeBookId,
                  ':',
                  volumeHadiths.slice(0, 5).map((h) => h.id),
                )
              }

              foundHadith = volumeHadiths.find((h) => h.id === hadithId) || null
              if (foundHadith) {
                console.log(`Found hadith ${hadithId} in ${volumeBookId}:`, foundHadith)
                break
              } else {
                console.log(`Hadith ${hadithId} not found in ${volumeBookId}`)
              }
            } catch (err) {
              console.error(`Error loading ${volumeBookId}:`, err)
              continue
            }
          }
        } else {
          // Handle single-volume books
          console.log('Loading single-volume book:', bookId)
          const allHadiths = await thaqalaynApi.getBookHadiths(bookId)
          foundHadith = allHadiths.find((h) => h.id === hadithId) || null
        }

        if (!foundHadith) {
          console.log(`Hadith ${hadithId} not found`)
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
          chapterInCategoryId: foundHadith.chapterInCategoryId,
        })
      } catch (err) {
        setError('Failed to load hadith')
      } finally {
        setLoading(false)
      }
    }

    if (hadithId && bookId) {
      loadHadith()
    }

    // Clean up chapter context when leaving
    return () => {
      setChapterInfo(null)
    }
  }, [hadithId, bookId, setChapterInfo])

  // Scroll to top when page loads
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [hadithId])

  const handleBackClick = () => {
    if (
      hadith?.volume &&
      hadith?.categoryId &&
      hadith?.chapterInCategoryId !== null &&
      hadith?.chapterInCategoryId !== undefined
    ) {
      // Navigate back to the chapter this hadith belongs to
      router.push(`/${urlSlug}/chapter/${hadith.categoryId}/${hadith.chapterInCategoryId}`)
    } else {
      // Fallback to book main page
      router.push(`/${urlSlug}`)
    }
  }

  const displayBookTitle =
    getBookConfig(bookId || '')?.englishName || urlSlug?.replace(/-/g, ' ') || 'Book'

  if (loading) {
    return (
      <main className="min-h-screen" data-theme={settings.theme}>
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex min-h-[50vh] items-center justify-center">
            <div className="border-accent-primary h-8 w-8 animate-spin rounded-full border-b-2"></div>
          </div>
        </div>
      </main>
    )
  }

  if (error || !hadith) {
    return (
      <main className="min-h-screen" data-theme={settings.theme}>
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <button
            onClick={handleBackClick}
            className="text-primary/70 hover:text-primary mb-6 flex items-center gap-2 transition-colors"
          >
            <IconArrowLeft className="h-4 w-4" />
            Back to {displayBookTitle}
          </button>

          <div className="flex min-h-[50vh] items-center justify-center">
            <div className="text-center">
              <h1 className="text-primary mb-4 text-2xl font-bold">
                {error || 'Hadith Not Found'}
              </h1>
              <p className="text-secondary mb-6">The requested hadith could not be found.</p>
              <button
                onClick={handleBackClick}
                className="bg-accent-primary hover:bg-accent-secondary rounded-lg px-6 py-3 text-white transition-colors"
              >
                Return to {displayBookTitle}
              </button>
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen" data-theme={settings.theme}>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <button
          onClick={handleBackClick}
          className="text-primary/70 hover:text-primary mb-6 flex items-center gap-2 transition-colors"
        >
          <IconArrowLeft className="h-4 w-4" />
          Back to Chapter
        </button>

        <div className="space-y-6">
          <div className="mb-8 text-center">
            <h1 className="text-primary mb-2 text-2xl font-bold">
              {displayBookTitle} Hadith #{hadith.id}
            </h1>
            <p className="text-secondary">
              Volume {hadith.volume} • {hadith.category} • {hadith.chapter}
            </p>
          </div>

          {/* Match chapter card layout with index bubble */}
          <div className="relative">
            <div className="bg-accent-primary shadow-medium absolute -left-4 top-6 flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white">
              1
            </div>
            <div className="ml-8">
              <HadithCard hadith={hadith} className="mb-6" showViewChapter={false} />
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
