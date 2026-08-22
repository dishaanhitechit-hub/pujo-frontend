import { cn } from '@/lib/utils'
import type { PaymentStatus, PledgeStatus, TokenStatus } from '@/types'

const paymentStatusConfig: Record<PaymentStatus, { label: string; classes: string }> = {
  pending: { label: 'Pending', classes: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  confirmed: { label: 'Confirmed', classes: 'bg-green-50 text-green-700 border-green-200' },
  expired: { label: 'Expired', classes: 'bg-red-50 text-red-700 border-red-200' },
  cancelled: { label: 'Cancelled', classes: 'bg-slate-50 text-slate-500 border-slate-200' },
}

const pledgeStatusConfig: Record<PledgeStatus, { label: string; classes: string }> = {
  open: { label: 'Open', classes: 'bg-blue-50 text-blue-700 border-blue-200' },
  complete: { label: 'Complete', classes: 'bg-green-50 text-green-700 border-green-200' },
  cancelled: { label: 'Cancelled', classes: 'bg-slate-50 text-slate-500 border-slate-200' },
}

const tokenStatusConfig: Record<TokenStatus, { label: string; classes: string }> = {
  active: { label: 'Active', classes: 'bg-green-50 text-green-700 border-green-200' },
  void: { label: 'Void', classes: 'bg-red-50 text-red-700 border-red-200' },
}

interface StatusBadgeProps {
  status: PaymentStatus
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = paymentStatusConfig[status] ?? { label: status ?? 'Unknown', classes: 'bg-slate-50 text-slate-500 border-slate-200' }
  return (
    <span className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold', config.classes, className)}>
      {config.label}
    </span>
  )
}

interface PledgeStatusBadgeProps {
  status: PledgeStatus
  className?: string
}

export function PledgeStatusBadge({ status, className }: PledgeStatusBadgeProps) {
  const config = pledgeStatusConfig[status] ?? { label: status ?? 'Unknown', classes: 'bg-slate-50 text-slate-500 border-slate-200' }
  return (
    <span className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold', config.classes, className)}>
      {config.label}
    </span>
  )
}

interface TokenStatusBadgeProps {
  status: TokenStatus
  className?: string
}

export function TokenStatusBadge({ status, className }: TokenStatusBadgeProps) {
  const config = tokenStatusConfig[status] ?? { label: status ?? 'Unknown', classes: 'bg-slate-50 text-slate-500 border-slate-200' }
  return (
    <span className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold', config.classes, className)}>
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
        isActive ? 'bg-green-50 text-green-700 border-green-200' : 'bg-slate-50 text-slate-500 border-slate-200',
        className,
      )}
    >
      {isActive ? 'Active' : 'Inactive'}
    </span>
  )
}
