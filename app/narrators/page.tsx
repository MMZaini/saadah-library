'use client'

import NarratorDetail from '@/components/narrators/NarratorDetail'
import NarratorResults from '@/components/narrators/NarratorResults'
import { useNarratorSearch } from '@/lib/use-narrator-search'

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

  return (
    <section className="hadith-reading-container mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-5 flex flex-col gap-2 sm:mb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground sm:text-2xl">Narrators</h1>
          <p className="mt-1 text-sm text-foreground-muted">
            Search al-Khoei’s Muʿjam Rijāl al-Ḥadīth by narrator name or alias.
          </p>
        </div>
        {metadata && (
          <p className="text-xs text-foreground-faint">
            {metadata.counts.narrators.toLocaleString()} entries · {metadata.counts.volumes} volumes
          </p>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-[380px_minmax(0,1fr)] lg:items-start">
        <NarratorResults
          query={query}
          results={results}
          total={total}
          selectedId={selectedId}
          loading={isSearching}
          error={error}
          onSelect={selectNarrator}
          onClear={clear}
        />

        <div className="lg:sticky lg:top-20">
          <NarratorDetail narrator={selected} query={query} loading={isLoadingDetail} />
        </div>
      </div>
    </section>
  )
}
