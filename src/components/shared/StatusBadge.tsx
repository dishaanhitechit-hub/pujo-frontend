import { cn } from '@/lib/utils'
import type { PaymentStatus } from '@/types'

const statusConfig = {
  pending: { label: 'Pending', classes: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  confirmed: { label: 'Confirmed', classes: 'bg-green-50 text-green-700 border-green-200' },
  expired: { label: 'Expired', classes: 'bg-red-50 text-red-700 border-red-200' },
} as const

interface StatusBadgeProps {
  status: PaymentStatus
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] ?? { label: status ?? 'Unknown', classes: 'bg-slate-50 text-slate-500 border-slate-200' }
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold',
        config.classes,
        className,
      )}
    >
      {config.label}
    </span>
  )
}

interface ActiveBadgeProps {
  isActive: boolean
  className?: string
}

export function ActiveBadge({ isActive, className }: ActiveBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold',
        isActive
          ? 'bg-green-50 text-green-700 border-green-200'
          : 'bg-slate-50 text-slate-500 border-slate-200',
        className,
      )}
    >
      {isActive ? 'Active' : 'Inactive'}
    </span>
  )
}
