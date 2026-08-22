'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { listDonors } from '@/lib/api/donors'
import type { PaginatedDonors, ApiError } from '@/types'
import { RoleGuard } from '@/lib/auth/role-guard'
import { PageHeader } from '@/components/dashboard/PageHeader'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from '@/components/ui/sheet'
import { ChevronLeft, ChevronRight, Search, SlidersHorizontal, X } from 'lucide-react'
import { DONOR_TYPES } from '@/constants'
import { useDebouncedValue } from '@/hooks/use-debounced-value'

function fmt(v: string | number) {
  return `₹${Number(v).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
}

interface ExtraFilters {
  dateFrom: string
  dateTo: string
  minAmount: string
  maxAmount: string
}

const EMPTY_EXTRA: ExtraFilters = { dateFrom: '', dateTo: '', minAmount: '', maxAmount: '' }

function activeFilterCount(f: ExtraFilters) {
  return [f.dateFrom, f.dateTo, f.minAmount, f.maxAmount].filter(Boolean).length
}

/** Validate the extra filter form; returns an error string or null. */
function validateExtra(f: ExtraFilters): string | null {
  if (f.minAmount && f.maxAmount) {
    const mn = Number(f.minAmount)
    const mx = Number(f.maxAmount)
    if (isNaN(mn) || mn < 0) return 'Min amount must be a positive number.'
    if (isNaN(mx) || mx < 0) return 'Max amount must be a positive number.'
    if (mn > mx) return 'Min amount cannot exceed max amount.'
  }
  if (f.dateFrom && f.dateTo && f.dateFrom > f.dateTo) {
    return 'Date From cannot be after Date To.'
  }
  return null
}

export default function DonorsPage() {
  return (
    <RoleGuard permission="dashboard.view">
      <DonorsContent />
    </RoleGuard>
  )
}

function DonorsContent() {
  const [data, setData] = useState<PaginatedDonors | null>(null)
  const [page, setPage] = useState(1)

  // Inline filters
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search, 350)
  const [donorType, setDonorType] = useState('')

  // Secondary filters (sheet)
  const [extra, setExtra] = useState<ExtraFilters>(EMPTY_EXTRA)
  // Draft state while the sheet is open
  const [draft, setDraft] = useState<ExtraFilters>(EMPTY_EXTRA)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [draftError, setDraftError] = useState<string | null>(null)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const reqRef = useRef(0)

  // Reset page to 1 when debounced search changes (skip initial mount)
  const searchSyncedRef = useRef(false)
  useEffect(() => {
    if (!searchSyncedRef.current) { searchSyncedRef.current = true; return }
    setPage(1)
  }, [debouncedSearch])

  useEffect(() => {
    const req = ++reqRef.current
    setLoading(true)
    setError(null)
    listDonors({
      page,
      perPage: 20,
      search: debouncedSearch || undefined,
      donorType: donorType || undefined,
      dateFrom: extra.dateFrom || undefined,
      dateTo: extra.dateTo || undefined,
      minAmount: extra.minAmount || undefined,
      maxAmount: extra.maxAmount || undefined,
    })
      .then((result) => { if (req === reqRef.current) setData(result) })
      .catch((err: ApiError) => { if (req === reqRef.current) setError(err.message ?? 'Failed to load donors.') })
      .finally(() => { if (req === reqRef.current) setLoading(false) })
  }, [page, debouncedSearch, donorType, extra])

  function openSheet() {
    setDraft(extra)
    setDraftError(null)
    setSheetOpen(true)
  }

  function applyDraft() {
    const err = validateExtra(draft)
    if (err) { setDraftError(err); return }
    setExtra(draft)
    setPage(1)
    setSheetOpen(false)
  }

  function clearExtra() {
    setExtra(EMPTY_EXTRA)
    setDraft(EMPTY_EXTRA)
    setDraftError(null)
    setPage(1)
    setSheetOpen(false)
  }

  const extraCount = activeFilterCount(extra)
  const anyFilter = !!debouncedSearch || !!donorType || extraCount > 0

  return (
    <div className="p-6 lg:p-8">
      <PageHeader title="Donors" subtitle="All donor records with completed payment statistics." className="mb-8" />

      {/* Filter bar */}
      <div className="flex flex-wrap gap-2 mb-5 items-center">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name or phone…"
            className="pl-8 h-8 w-52 text-sm"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {/* Donor Type */}
        <select
          value={donorType}
          onChange={(e) => { setDonorType(e.target.value); setPage(1) }}
          className="h-8 rounded-md border border-border bg-muted px-3 text-xs font-semibold text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">All Types</option>
          {DONOR_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>

        {/* More Filters sheet trigger */}
        <Sheet open={sheetOpen} onOpenChange={(open) => { if (!open) setSheetOpen(false) }}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={openSheet}
              className={`h-8 gap-1.5 text-xs ${extraCount > 0 ? 'border-brand-orange text-brand-orange' : ''}`}
            >
              <SlidersHorizontal className="size-3.5" />
              Filters
              {extraCount > 0 && (
                <span className="ml-0.5 flex size-4 items-center justify-center rounded-full bg-brand-orange text-white text-[10px] font-bold">
                  {extraCount}
                </span>
              )}
            </Button>
          </SheetTrigger>

          <SheetContent side="right" className="w-80 sm:w-96 flex flex-col">
            <SheetHeader className="border-b border-border pb-4">
              <SheetTitle className="text-base">More Filters</SheetTitle>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto py-5 flex flex-col gap-6">
              {/* Date range */}
              <fieldset className="flex flex-col gap-3">
                <legend className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Last Donation Date
                </legend>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="df-dateFrom" className="text-xs">From</Label>
                  <Input
                    id="df-dateFrom"
                    type="date"
                    value={draft.dateFrom}
                    max={draft.dateTo || undefined}
                    onChange={(e) => { setDraft(d => ({ ...d, dateFrom: e.target.value })); setDraftError(null) }}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="df-dateTo" className="text-xs">To</Label>
                  <Input
                    id="df-dateTo"
                    type="date"
                    value={draft.dateTo}
                    min={draft.dateFrom || undefined}
                    onChange={(e) => { setDraft(d => ({ ...d, dateTo: e.target.value })); setDraftError(null) }}
                    className="h-8 text-sm"
                  />
                </div>
              </fieldset>

              {/* Amount range */}
              <fieldset className="flex flex-col gap-3">
                <legend className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Total Donated (₹)
                </legend>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="df-minAmount" className="text-xs">Minimum</Label>
                  <Input
                    id="df-minAmount"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="e.g. 500"
                    value={draft.minAmount}
                    onChange={(e) => { setDraft(d => ({ ...d, minAmount: e.target.value })); setDraftError(null) }}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="df-maxAmount" className="text-xs">Maximum</Label>
                  <Input
                    id="df-maxAmount"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="e.g. 5000"
                    value={draft.maxAmount}
                    onChange={(e) => { setDraft(d => ({ ...d, maxAmount: e.target.value })); setDraftError(null) }}
                    className="h-8 text-sm"
                  />
                </div>
              </fieldset>

              {draftError && (
                <p className="text-xs text-destructive">{draftError}</p>
              )}
            </div>

            <div className="border-t border-border pt-4 flex gap-2">
              <Button
                variant="outline"
                className="flex-1 h-9 text-sm"
                onClick={clearExtra}
              >
                Clear
              </Button>
              <Button
                className="flex-1 h-9 text-sm bg-brand-orange hover:bg-brand-orange/90 text-white"
                onClick={applyDraft}
              >
                Apply
              </Button>
            </div>
          </SheetContent>
        </Sheet>

        {/* Clear all active filters */}
        {anyFilter && (
          <button
            onClick={() => {
              setSearch('')
              setDonorType('')
              clearExtra()
            }}
            className="h-8 px-2 text-xs text-muted-foreground hover:text-destructive flex items-center gap-1 transition-colors"
          >
            <X className="size-3" /> Clear all
          </button>
        )}
      </div>

      {error ? (
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-6 text-sm text-destructive">{error}</div>
      ) : loading ? (
        <div className="flex flex-col gap-3">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}</div>
      ) : !data || data.donors.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-border p-12 text-center">
          <p className="text-2xl mb-3">👤</p>
          <p className="font-semibold text-foreground">No donors found</p>
          <p className="text-sm text-muted-foreground mt-1">
            {anyFilter ? 'Try adjusting your filters.' : 'Donors appear here after their first payment is collected.'}
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-border bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/20">
                  {['Donor', 'Type', 'Total Donated', 'Completed', 'Last Donation', ''].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.donors.map((d) => (
                  <tr key={d.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-5 py-3">
                      <p className="font-medium">{d.name}</p>
                      {d.phone && <p className="text-xs text-muted-foreground">{d.phone}</p>}
                    </td>
                    <td className="px-5 py-3 text-xs text-muted-foreground">{d.donorType ?? '—'}</td>
                    <td className="px-5 py-3 font-semibold">{fmt(d.totalDonated)}</td>
                    <td className="px-5 py-3 text-muted-foreground">{d.confirmedCount}</td>
                    <td className="px-5 py-3 text-xs text-muted-foreground">
                      {d.lastDonatedAt ? new Date(d.lastDonatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                    </td>
                    <td className="px-5 py-3">
                      <Link href={`/donors/${d.id}`} className="text-xs text-brand-orange hover:underline font-medium">View</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {data.pages > 1 && (
            <div className="flex items-center justify-between mt-5">
              <p className="text-xs text-muted-foreground">Page {data.page} of {data.pages} · {data.total} total</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}><ChevronLeft className="size-4" /></Button>
                <Button variant="outline" size="sm" disabled={page >= data.pages} onClick={() => setPage(p => p + 1)}><ChevronRight className="size-4" /></Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
