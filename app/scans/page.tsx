'use client'

import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'

// The studio renders PDFs with pdf.js (browser-only APIs), so it must never run
// during SSR. A client-component dynamic import with `ssr: false` guarantees the
// whole module — and its pdf.js dependency — loads only in the browser.
const ScansStudio = dynamic(() => import('@/components/scans/ScansStudio'), {
  ssr: false,
  loading: () => (
    <div className="flex h-[calc(100dvh-3.5rem)] items-center justify-center gap-2 text-foreground-muted">
      <Loader2 className="h-5 w-5 animate-spin" /> Loading…
    </div>
  ),
})

export default function ScansPage() {
  return <ScansStudio />
}
