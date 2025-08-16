'use client'

import dynamic from 'next/dynamic'
import { ReactNode } from 'react'

// Client-only wrapper to prevent hydration mismatches
function NoSSR({ children }: { children: ReactNode }) {
  return <>{children}</>
}

export default dynamic(() => Promise.resolve(NoSSR), {
  ssr: false
})
