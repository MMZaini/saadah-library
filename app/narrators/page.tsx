'use client'

import { useEffect, useState } from 'react'
import { ChevronLeft } from 'lucide-react'
import NarratorDetail from '@/components/narrators/NarratorDetail'
import NarratorResults from '@/components/narrators/NarratorResults'
import { useNarratorSearch } from '@/lib/use-narrator-search'
import { cn } from '@/lib/utils'

export default function NarratorsPage() {
  const {
    query,
    results,
    selected,
    selectedId,
    total,
    metadata,
    error,
    isSearching,
    isLoadingDetail,
    selectNarrator,
    clear,
  } = useNarratorSearch()

  // On phones the results list and the entry detail occupy the same screen, so
  // we show one at a time: picking a narrator swaps to the detail (with a back
  // button); on lg+ both panes are always visible side by side.
  const [mobileDetail, setMobileDetail] = useState(false)
  const handleSelect = (id: string) => {
    selectNarrator(id)
    setMobileDetail(true)
  }
  // A new search should bring the (mobile) results list back into view.
  useEffect(() => {
    setMobileDetail(false)
  }, [query])

  return (
    <section className="hadith-reading-container mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-5 flex flex-col gap-2 sm:mb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground sm:text-2xl">Narrators</h1>
          <p className="mt-1 text-sm text-foreground-muted">
            Search al-Khoei’s Muʿjam Rijāl al-Ḥadīth by narrator name.
          </p>
        </div>
        {metadata && (
          <p className="text-xs text-foreground-faint">
            {metadata.counts.narrators.toLocaleString()} entries · {metadata.counts.volumes} volumes
          </p>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-[380px_minmax(0,1fr)] lg:items-start">
        <div className={cn(mobileDetail && 'hidden lg:block')}>
          <NarratorResults
            query={query}
            results={results}
            total={total}
            selectedId={selectedId}
            loading={isSearching}
            error={error}
            onSelect={handleSelect}
            onClear={clear}
          />
        </div>

        <div className={cn('lg:sticky lg:top-20', !mobileDetail && 'hidden lg:block')}>
          <button
            onClick={() => setMobileDetail(false)}
            className="mb-3 flex items-center gap-1.5 text-sm font-medium text-foreground-muted transition-colors hover:text-foreground lg:hidden"
          >
            <ChevronLeft className="h-4 w-4" />
            Results
          </button>
          <NarratorDetail narrator={selected} query={query} loading={isLoadingDetail} />
        </div>
      </div>
    </section>
  )
}
