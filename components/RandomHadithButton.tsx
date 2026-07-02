'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Shuffle } from 'lucide-react'
import { fetchRandomHadith } from '@/lib/api'
import { getHadithUrl } from '@/lib/hadith-urls'
import { withBasePath } from '@/lib/assets'
import { Button } from '@/components/ui/button'

/**
 * "Take me somewhere" entry point: fetches one random hadith from the tiny
 * /api/random endpoint and navigates to its page.
 */
export default function RandomHadithButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    setLoading(true)
    try {
      const hadith = await fetchRandomHadith()
      router.push(withBasePath(getHadithUrl(hadith)))
    } catch (err) {
      console.warn('Random hadith failed:', err)
      setLoading(false)
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
      disabled={loading}
      className="gap-1.5"
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Shuffle className="h-3.5 w-3.5" />
      )}
      Random hadith
    </Button>
  )
}
