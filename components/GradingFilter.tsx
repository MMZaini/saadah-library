'use client'

import { useMemo } from 'react'
import { Hadith } from '@/lib/api'
import { cn } from '@/lib/utils'
import { Filter } from 'lucide-react'

export type GradingCategory = 'all' | 'sahih' | 'hasan' | 'daif' | 'other'

/** Classify a single grading string into a category. */
function classifyGrading(grading: string): 'sahih' | 'hasan' | 'daif' | 'other' {
  const g = grading.toLowerCase()
  if (g.includes('sahih') || g.includes('\u0635\u062d\u064a\u062d')) return 'sahih'
  if (g.includes('hasan') || g.includes('\u062d\u0633\u0646') || g.includes('good')) return 'hasan'
  if (g.includes('daif') || g.includes('\u0636\u0639\u064a\u0641') || g.includes('weak'))
    return 'daif'
  return 'other'
}

/**
 * Classify a hadith by its strongest grading across all scholars.
 * Priority: sahih > hasan > daif > other > null (ungraded).
 */
export function classifyHadith(hadith: Hadith): GradingCategory {
  const gradings = [hadith.majlisiGrading, hadith.mohseniGrading, hadith.behbudiGrading].filter(
    Boolean,
  )

  if (gradings.length === 0) return 'other'

  const categories = gradings.map(classifyGrading)
  if (categories.includes('sahih')) return 'sahih'
  if (categories.includes('hasan')) return 'hasan'
  if (categories.includes('daif')) return 'daif'
  return 'other'
}

type FilterableCategory = 'sahih' | 'hasan' | 'daif' | 'other'

const FILTER_OPTIONS: {
  value: FilterableCategory
  label: string
  activeClass: string
}[] = [
  {
    value: 'sahih',
    label: 'Sahih',
    activeClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40',
  },
  {
    value: 'hasan',
    label: 'Hasan',
    activeClass: 'bg-green-500/15 text-green-400 border-green-500/40',
  },
  {
    value: 'daif',
    label: 'Weak',
    activeClass: 'bg-red-500/15 text-red-400 border-red-500/40',
  },
  {
    value: 'other',
    label: 'Other',
    activeClass: 'bg-surface-2 text-foreground-muted border-foreground-muted/30',
  },
]

interface GradingFilterProps {
  hadiths: Hadith[]
  selected: Set<FilterableCategory>
  onChange: (selected: Set<FilterableCategory>) => void
}

export default function GradingFilter({ hadiths, selected, onChange }: GradingFilterProps) {
  const counts = useMemo(() => {
    const map: Record<FilterableCategory, number> = {
      sahih: 0,
      hasan: 0,
      daif: 0,
      other: 0,
    }
    for (const h of hadiths) {
      const cat = classifyHadith(h)
      if (cat !== 'all') map[cat]++
    }
    return map
  }, [hadiths])

  const toggle = (value: FilterableCategory) => {
    const next = new Set(selected)
    if (next.has(value)) {
      next.delete(value)
    } else {
      next.add(value)
    }
    onChange(next)
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Filter className="mr-0.5 h-3.5 w-3.5 text-foreground-faint" />
      {FILTER_OPTIONS.map((opt) => {
        const count = counts[opt.value]
        if (count === 0) return null

        const isActive = selected.has(opt.value)

        return (
          <button
            key={opt.value}
            onClick={() => toggle(opt.value)}
            className={cn(
              'inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium transition-colors',
              isActive
                ? opt.activeClass
                : 'border-border bg-transparent text-foreground-muted hover:bg-surface-2',
            )}
          >
            {opt.label}
            <span className={cn('tabular-nums', isActive ? 'opacity-80' : 'opacity-50')}>
              {count}
            </span>
          </button>
        )
      })}
    </div>
  )
}
