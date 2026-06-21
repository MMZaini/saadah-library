'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, UserSearch } from 'lucide-react'
import NarratorDetail from '@/components/narrators/NarratorDetail'
import { Button } from '@/components/ui/button'
import { usePageSearch } from '@/lib/search-context'
import { cleanNarratorName } from '@/lib/data/rijal-display'
import type { NarratorEntry } from '@/lib/data/rijal-types'

type LoadStatus = 'loading' | 'ready' | 'notfound' | 'error'

export default function NarratorEntryPage() {
  const params = useParams()
  const id = Array.isArray(params.id) ? (params.id[0] ?? '') : (params.id ?? '')

  // Reuse the persistent TopBar search field as an in-entry "find" box. It resets
  // to empty whenever the id changes (resetKey), so the entry always opens with
  // no highlighting; typing then highlights matches within the text below.
  const { query } = usePageSearch({ placeholder: 'Find in this entry…', resetKey: id })

  const [narrator, setNarrator] = useState<NarratorEntry | null>(null)
  const [status, setStatus] = useState<LoadStatus>('loading')

  useEffect(() => {
    if (!id) return
    let cancelled = false
    setStatus('loading')
    setNarrator(null)

    async function load() {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/api/narrators/${id}`)
        if (res.status === 404) {
          if (!cancelled) setStatus('notfound')
          return
        }
        const data = await res.json()
        if (!res.ok || data.error) throw new Error(data.error || 'Narrator lookup failed')
        if (cancelled) return
        setNarrator(data)
        setStatus('ready')
      } catch {
        if (!cancelled) setStatus('error')
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [id])

  // Give the new tab a meaningful title.
  useEffect(() => {
    if (narrator) document.title = `${cleanNarratorName(narrator.primaryName)} · Narrators`
  }, [narrator])

  return (
    <section className="hadith-reading-container mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-4">
        <Button variant="ghost" size="sm" className="-ml-2 h-8 gap-1.5" asChild>
          <Link href="/narrators">
            <ArrowLeft className="h-4 w-4" />
            Back to search
          </Link>
        </Button>
      </div>

      {status === 'notfound' || status === 'error' ? (
        <div className="bg-surface-1/60 rounded-lg border border-dashed border-border p-10 text-center">
          <UserSearch className="mx-auto mb-3 h-8 w-8 text-foreground-faint" />
          <h1 className="text-base font-semibold text-foreground">
            {status === 'notfound' ? 'Narrator not found' : 'Could not load this entry'}
          </h1>
          <p className="mt-1 text-sm text-foreground-muted">
            {status === 'notfound'
              ? 'This narrator entry does not exist in al-Khoei’s Muʿjam.'
              : 'Something went wrong loading this entry. Please try again.'}
          </p>
          <Button variant="outline" size="sm" className="mt-4" asChild>
            <Link href="/narrators">Go to narrator search</Link>
          </Button>
        </div>
      ) : (
        <NarratorDetail
          narrator={narrator}
          query={query}
          loading={status === 'loading'}
          standalone
        />
      )}
    </section>
  )
}
