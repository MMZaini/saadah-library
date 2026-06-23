'use client'

import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'

const NarratorPdfViewer = dynamic(() => import('@/components/narrators/NarratorPdfViewer'), {
  ssr: false,
  loading: () => (
    <div className="flex h-[calc(100dvh-7.5rem-env(safe-area-inset-bottom))] items-center justify-center gap-2 text-foreground-muted md:h-[calc(100dvh-3.5rem)]">
      <Loader2 className="h-5 w-5 animate-spin" />
      Loading PDF…
    </div>
  ),
})

export default function NarratorPdfPage() {
  return <NarratorPdfViewer />
}
