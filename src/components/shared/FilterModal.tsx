'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Filter } from 'lucide-react'
import { cn } from '@/lib/utils'

// ── Trigger button ─────────────────────────────────────────────────────────

interface FilterButtonProps {
  onClick: () => void
  activeCount?: number
  className?: string
}

export function FilterButton({ onClick, activeCount = 0, className }: FilterButtonProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      className={cn('h-8 gap-1.5 text-xs', className)}
    >
      <Filter className="size-3.5" />
      Filters
      {activeCount > 0 && (
        <span className="flex items-center justify-center size-4 rounded-full bg-brand-orange text-white text-[10px] font-bold leading-none">
          {activeCount}
        </span>
      )}
    </Button>
  )
}

// ── Modal wrapper ──────────────────────────────────────────────────────────

interface FilterModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  children: React.ReactNode
  onApply: () => void
  onReset: () => void
}

export function FilterModal({
  open,
  onOpenChange,
  title = 'Filter',
  children,
  onApply,
  onReset,
}: FilterModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-lg p-0 gap-0 overflow-hidden"
      >
        <DialogHeader className="px-5 pt-5 pb-4 border-b border-border">
          <DialogTitle className="text-base">{title}</DialogTitle>
        </DialogHeader>

        <div className="px-5 py-5 grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4">
          {children}
        </div>

        <DialogFooter className="-mx-0 -mb-0 rounded-b-xl">
          <Button variant="ghost" size="sm" onClick={onReset} className="text-muted-foreground">
            Clear all
          </Button>
          <DialogClose asChild>
            <Button variant="outline" size="sm">Cancel</Button>
          </DialogClose>
          <Button
            size="sm"
            onClick={onApply}
            className="bg-brand-orange hover:bg-brand-orange/90 text-white"
          >
            Apply filters
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Field wrapper for consistent spacing ───────────────────────────────────

interface FilterFieldProps {
  label: string
  children: React.ReactNode
  /** span 2 columns (e.g. for date range side-by-side) */
  wide?: boolean
}

export function FilterField({ label, children, wide }: FilterFieldProps) {
  return (
    <div className={cn('flex flex-col gap-1.5', wide && 'sm:col-span-2')}>
      <span className="text-xs font-medium text-foreground">{label}</span>
      {children}
    </div>
  )
}
