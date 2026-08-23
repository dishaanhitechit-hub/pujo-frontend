import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface StatCardProps {
  label: string
  value: string | number
  icon: LucideIcon
  trend?: string
  variant?: 'default' | 'primary' | 'success' | 'warning'
  className?: string
}

const variantStyles = {
  default: 'bg-card border-border text-foreground',
  primary: 'bg-brand-orange text-white border-brand-orange/20',
  success: 'bg-brand-green/10 border-brand-green/20 text-brand-navy',
  warning: 'bg-yellow-50 border-yellow-200 text-brand-navy',
} as const

const iconStyles = {
  default: 'bg-muted text-muted-foreground',
  primary: 'bg-white/20 text-white',
  success: 'bg-brand-green/15 text-brand-green',
  warning: 'bg-yellow-100 text-yellow-700',
} as const

export function StatCard({ label, value, icon: Icon, trend, variant = 'default', className }: StatCardProps) {
  return (
    <div className={cn('rounded-xl border p-4 sm:p-5 flex items-start gap-3 sm:gap-4', variantStyles[variant], className)}>
      <div className={cn('size-8 sm:size-10 rounded-xl flex items-center justify-center shrink-0', iconStyles[variant])}>
        <Icon className="size-4 sm:size-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className={cn('text-[11px] sm:text-xs font-medium uppercase tracking-wider leading-tight', variant === 'primary' ? 'text-white/70' : 'text-muted-foreground')}>
          {label}
        </p>
        <p className={cn('font-heading font-bold text-lg sm:text-2xl mt-0.5 break-words leading-tight', variant === 'primary' ? 'text-white' : 'text-foreground')}>
          {value}
        </p>
        {trend && (
          <p className={cn('text-xs mt-1', variant === 'primary' ? 'text-white/60' : 'text-muted-foreground')}>
            {trend}
          </p>
        )}
      </div>
    </div>
  )
}
