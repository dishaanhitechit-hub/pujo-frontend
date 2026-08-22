'use client'
import { X } from 'lucide-react'

interface FilterChipProps {
  label: string
  onRemove: () => void
}

export function FilterChip({ label, onRemove }: FilterChipProps) {
  return (
    <span className="inline-flex items-center gap-1 pl-2.5 pr-1.5 py-1 rounded-full text-xs font-medium bg-brand-orange/10 text-brand-orange border border-brand-orange/20">
      {label}
      <button onClick={onRemove} className="hover:text-brand-orange/60 transition-colors">
        <X className="size-3" />
      </button>
    </span>
  )
}
