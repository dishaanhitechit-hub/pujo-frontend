'use client'

import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import Link from 'next/link'
import { listPledges } from '@/lib/api/pledges'
import { getUsers } from '@/lib/api/users'
import type { PaginatedPledges, User, ApiError } from '@/types'
import { RoleGuard } from '@/lib/auth/role-guard'
import { useAuth } from '@/lib/auth/auth-provider'
import { can } from '@/lib/auth/permissions'
import { PageHeader } from '@/components/dashboard/PageHeader'
import { PledgeStatusBadge } from '@/components/shared/StatusBadge'
import { FilterChip } from '@/components/shared/FilterChip'
import { FilterModal, FilterButton, FilterField } from '@/components/shared/FilterModal'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ChevronLeft, ChevronRight, Plus, Search, X } from 'lucide-react'

function fmt(v: string | number) {
  return `₹${Number(v).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
}

export default function PledgesPage() {
  return (
    <RoleGuard permission="payment.view_receipt">
      <Suspense>
        <PledgesContent />
      </Suspense>
    </RoleGuard>
  )
}

function PledgesContent() {
  const router = useRouter()
  const params = useSearchParams()
  const { user } = useAuth()

  const canViewAll = user ? can(user.role, 'dashboard.view') : false

  // search = raw input; debouncedSearch gates the API
  const [search, setSearch] = useState(params.get('search') ?? '')
  const debouncedSearch = useDebouncedValue(search, 350)
  const [status, setStatus] = useState<'open' | 'complete' | 'cancelled' | ''>(
    (params.get('status') as 'open' | 'complete' | 'cancelled' | '') ?? ''
  )
  const [page, setPage] = useState(Number(params.get('page') ?? 1))
  const [collectorId, setCollectorId] = useState(params.get('collectorId') ?? '')
  const [dateFrom, setDateFrom] = useState(params.get('dateFrom') ?? '')
  const [dateTo, setDateTo] = useState(params.get('dateTo') ?? '')
  const [minAmount, setMinAmount] = useState(params.get('minAmount') ?? '')
  const [maxAmount, setMaxAmount] = useState(params.get('maxAmount') ?? '')

  const [draftCollectorId, setDraftCollectorId] = useState(collectorId)
  const [draftDateFrom, setDraftDateFrom] = useState(dateFrom)
  const [draftDateTo, setDraftDateTo] = useState(dateTo)
  const [draftMinAmount, setDraftMinAmount] = useState(minAmount)
  const [draftMaxAmount, setDraftMaxAmount] = useState(maxAmount)
  const [sheetOpen, setSheetOpen] = useState(false)

  const [data, setData] = useState<PaginatedPledges | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [collectors, setCollectors] = useState<User[]>([])
  const reqRef = useRef(0)

  const pushUrl = useCallback((overrides: Record<string, string> = {}) => {
    const p = new URLSearchParams()
    const vals: Record<string, string> = {
      search: debouncedSearch, status, collectorId, dateFrom, dateTo, minAmount, maxAmount, page: String(page), ...overrides,
    }
    Object.entries(vals).forEach(([k, v]) => { if (v) p.set(k, v) })
    router.replace(`?${p.toString()}`, { scroll: false })
  }, [debouncedSearch, status, collectorId, dateFrom, dateTo, minAmount, maxAmount, page, router])

  // When debounced search settles: reset page and sync URL (skip initial mount)
  const searchSyncedRef = useRef(false)
  useEffect(() => {
    if (!searchSyncedRef.current) { searchSyncedRef.current = true; return }
    setPage(1)
    pushUrl({ search: debouncedSearch, page: '1' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch])

  useEffect(() => {
    if (canViewAll) getUsers().then(setCollectors).catch(() => {})
  }, [canViewAll])

  useEffect(() => {
    const req = ++reqRef.current
    setLoading(true)
    setError(null)
    listPledges({
      page, perPage: 20,
      status: status || undefined,
      collectorId: collectorId ? Number(collectorId) : undefined,
      search: debouncedSearch || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      minAmount: minAmount || undefined,
      maxAmount: maxAmount || undefined,
    })
      .then((result) => { if (req === reqRef.current) setData(result) })
      .catch((err: ApiError) => { if (req === reqRef.current) setError(err.message ?? 'Failed to load pledges.') })
      .finally(() => { if (req === reqRef.current) setLoading(false) })
  }, [page, status, collectorId, debouncedSearch, dateFrom, dateTo, minAmount, maxAmount])

  function handleSearchChange(val: string) {
    setSearch(val)
  }

  function setStatusFilter(s: typeof status) { setStatus(s); setPage(1); pushUrl({ status: s, page: '1' }) }

  function applyAdvanced() {
    setCollectorId(draftCollectorId); setDateFrom(draftDateFrom); setDateTo(draftDateTo)
    setMinAmount(draftMinAmount); setMaxAmount(draftMaxAmount)
    setPage(1)
    pushUrl({ collectorId: draftCollectorId, dateFrom: draftDateFrom, dateTo: draftDateTo, minAmount: draftMinAmount, maxAmount: draftMaxAmount, page: '1' })
    setSheetOpen(false)
  }

  function resetAdvanced() {
    setDraftCollectorId(''); setDraftDateFrom(''); setDraftDateTo(''); setDraftMinAmount(''); setDraftMaxAmount('')
    setCollectorId(''); setDateFrom(''); setDateTo(''); setMinAmount(''); setMaxAmount('')
    setPage(1)
    pushUrl({ collectorId: '', dateFrom: '', dateTo: '', minAmount: '', maxAmount: '', page: '1' })
  }

  const advancedActiveCount = [collectorId, dateFrom, dateTo, minAmount, maxAmount].filter(Boolean).length
  const collectorName = collectors.find(c => String(c.id) === collectorId)?.name

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <PageHeader title="Pledges" subtitle="Multi-installment donation commitments." />
        {user?.role !== 'admin' && (
          <Link href="/pledges/new">
            <Button className="bg-brand-orange hover:bg-brand-orange/90 text-white">
              <Plus className="size-4 mr-2" /> New Pledge
            </Button>
          </Link>
        )}
      </div>

      {/* Filter row */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <div className="relative flex-1 min-w-[160px] max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
          <Input value={search} onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search donor name or phone…" className="pl-8 h-8 text-sm" />
          {search && (
            <button onClick={() => handleSearchChange('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="size-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-muted-foreground">Status:</span>
          {(['', 'open', 'complete', 'cancelled'] as const).map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${status === s ? 'bg-brand-navy text-white' : 'bg-muted text-muted-foreground hover:bg-brand-navy/10 hover:text-brand-navy'}`}>
              {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        <FilterButton
          onClick={() => {
            setDraftCollectorId(collectorId); setDraftDateFrom(dateFrom); setDraftDateTo(dateTo)
            setDraftMinAmount(minAmount); setDraftMaxAmount(maxAmount)
            setSheetOpen(true)
          }}
          activeCount={advancedActiveCount}
          className="ml-auto"
        />
        <FilterModal
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          title="Advanced Filters"
          onApply={applyAdvanced}
          onReset={resetAdvanced}
        >
          {canViewAll && (
            <FilterField label="Collector" wide>
              <select value={draftCollectorId} onChange={(e) => setDraftCollectorId(e.target.value)}
                className="flex h-8 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50">
                <option value="">All Collectors</option>
                {collectors.map((c) => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
              </select>
            </FilterField>
          )}

          <FilterField label="Date from">
            <Input type="date" value={draftDateFrom} onChange={(e) => setDraftDateFrom(e.target.value)} className="h-8 text-sm" />
          </FilterField>
          <FilterField label="Date to">
            <Input type="date" value={draftDateTo} onChange={(e) => setDraftDateTo(e.target.value)} className="h-8 text-sm" />
          </FilterField>

          <FilterField label="Min total (₹)">
            <Input type="number" min={0} placeholder="0" value={draftMinAmount} onChange={(e) => setDraftMinAmount(e.target.value)} className="h-8 text-sm" />
          </FilterField>
          <FilterField label="Max total (₹)">
            <Input type="number" min={0} placeholder="∞" value={draftMaxAmount} onChange={(e) => setDraftMaxAmount(e.target.value)} className="h-8 text-sm" />
          </FilterField>
        </FilterModal>
      </div>

      {/* Active chips */}
      {(collectorId || dateFrom || dateTo || minAmount || maxAmount) && (
        <div className="flex flex-wrap gap-2 mb-4">
          {collectorId && <FilterChip label={`Collector: ${collectorName ?? collectorId}`} onRemove={() => { setCollectorId(''); setDraftCollectorId(''); setPage(1); pushUrl({ collectorId: '', page: '1' }) }} />}
          {dateFrom && <FilterChip label={`From: ${dateFrom}`} onRemove={() => { setDateFrom(''); setDraftDateFrom(''); setPage(1); pushUrl({ dateFrom: '', page: '1' }) }} />}
          {dateTo && <FilterChip label={`To: ${dateTo}`} onRemove={() => { setDateTo(''); setDraftDateTo(''); setPage(1); pushUrl({ dateTo: '', page: '1' }) }} />}
          {minAmount && <FilterChip label={`Min: ₹${minAmount}`} onRemove={() => { setMinAmount(''); setDraftMinAmount(''); setPage(1); pushUrl({ minAmount: '', page: '1' }) }} />}
          {maxAmount && <FilterChip label={`Max: ₹${maxAmount}`} onRemove={() => { setMaxAmount(''); setDraftMaxAmount(''); setPage(1); pushUrl({ maxAmount: '', page: '1' }) }} />}
        </div>
      )}

      {error ? (
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-6 text-sm text-destructive">{error}</div>
      ) : loading ? (
        <div className="flex flex-col gap-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
      ) : !data || data.pledges.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-border p-12 text-center">
          <p className="text-2xl mb-3">🤝</p>
          <p className="font-semibold text-foreground">No pledges found</p>
          <p className="text-sm text-muted-foreground mt-1">Adjust filters or create the first pledge.</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-border bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/20">
                  {['Donor', 'Collector', 'Total', 'Paid', 'Outstanding', 'Status', 'Date', ''].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.pledges.map((p) => (
                  <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-5 py-3">
                      <p className="font-medium">{p.donor.name}</p>
                      {p.donor.phone && <p className="text-xs text-muted-foreground">{p.donor.phone}</p>}
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">{p.collector.name}</td>
                    <td className="px-5 py-3 font-semibold">{fmt(p.totalAmount)}</td>
                    <td className="px-5 py-3 text-green-700 font-medium">{fmt(p.paidAmount)}</td>
                    <td className="px-5 py-3 text-yellow-700 font-medium">{fmt(p.outstandingAmount)}</td>
                    <td className="px-5 py-3"><PledgeStatusBadge status={p.status} /></td>
                    <td className="px-5 py-3 text-xs text-muted-foreground">
                      {new Date(p.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-5 py-3">
                      <Link href={`/pledges/${p.id}`} className="text-xs text-brand-orange hover:underline font-medium">View</Link>
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
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => { setPage(p => p - 1); pushUrl({ page: String(page - 1) }) }}><ChevronLeft className="size-4" /></Button>
                <Button variant="outline" size="sm" disabled={page >= data.pages} onClick={() => { setPage(p => p + 1); pushUrl({ page: String(page + 1) }) }}><ChevronRight className="size-4" /></Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
