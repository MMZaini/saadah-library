import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-accent/15 text-accent',
        secondary: 'bg-surface-2 text-foreground-muted',
        outline: 'border border-border text-foreground-muted',
        sahih: 'bg-emerald-500/15 text-emerald-400',
        hasan: 'bg-green-500/15 text-green-400',
        daif: 'bg-red-500/15 text-red-400',
        warning: 'bg-orange-500/15 text-orange-400',
        info: 'bg-blue-500/15 text-blue-400',
        purple: 'bg-purple-500/15 text-purple-400',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
