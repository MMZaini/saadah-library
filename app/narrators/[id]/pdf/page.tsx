'use client'

import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'

const NarratorPdfViewer = dynamic(() => import('@/components/narrators/NarratorPdfViewer'), {
  ssr: false,
  loading: () => (
    <div className="flex h-[calc(100dvh-3.5rem)] items-center justify-center gap-2 text-foreground-muted">
      <Loader2 className="h-5 w-5 animate-spin" />
      Loading PDF…
    </div>
  ),
})

export default function NarratorPdfPage() {
  return <NarratorPdfViewer />
}
