'use client'

import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getDashboardPayments } from '@/lib/api/dashboard'
import { getUsers } from '@/lib/api/users'
import type { PaginatedPayments, Payment, User, ApiError } from '@/types'
import { RoleGuard } from '@/lib/auth/role-guard'
import { PageHeader } from '@/components/dashboard/PageHeader'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { PaymentDetailDialog } from '@/components/shared/PaymentDetailDialog'
import { FilterChip } from '@/components/shared/FilterChip'
import { FilterModal, FilterButton, FilterField } from '@/components/shared/FilterModal'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ChevronLeft, ChevronRight, Search, X } from 'lucide-react'
import { apiConfig } from '@/config/api'
import { DONOR_TYPES } from '@/constants'

function fmt(v: string | number) {
  return `₹${Number(v).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
}

export default function PaymentsPage() {
  return (
    <RoleGuard permission="dashboard.view">
      <Suspense>
        <PaymentsContent />
      </Suspense>
    </RoleGuard>
  )
}

function PaymentsContent() {
  const router = useRouter()
  const params = useSearchParams()

  // Primary filter state — initialised from URL
  const [search, setSearch] = useState(params.get('search') ?? '')
  const [method, setMethod] = useState<'upi' | 'cash' | 'cheque' | ''>(
    (params.get('method') as 'upi' | 'cash' | 'cheque' | '') ?? ''
  )
  const [status, setStatus] = useState<'pending' | 'completed' | 'expired' | 'cancelled' | ''>(
    (params.get('status') as 'pending' | 'completed' | 'expired' | 'cancelled' | '') ?? ''
  )
  const [page, setPage] = useState(Number(params.get('page') ?? 1))

  // Advanced filter state (Sheet)
  const [donorType, setDonorType] = useState(params.get('donorType') ?? '')
  const [collectorId, setCollectorId] = useState(params.get('collectorId') ?? '')
  const [dateFrom, setDateFrom] = useState(params.get('dateFrom') ?? '')
  const [dateTo, setDateTo] = useState(params.get('dateTo') ?? '')
  const [minAmount, setMinAmount] = useState(params.get('minAmount') ?? '')
  const [maxAmount, setMaxAmount] = useState(params.get('maxAmount') ?? '')

  // Draft state inside Sheet (committed on Apply)
  const [draftDonorType, setDraftDonorType] = useState(donorType)
  const [draftCollectorId, setDraftCollectorId] = useState(collectorId)
  const [draftDateFrom, setDraftDateFrom] = useState(dateFrom)
  const [draftDateTo, setDraftDateTo] = useState(dateTo)
  const [draftMinAmount, setDraftMinAmount] = useState(minAmount)
  const [draftMaxAmount, setDraftMaxAmount] = useState(maxAmount)
  const [sheetOpen, setSheetOpen] = useState(false)

  const [data, setData] = useState<PaginatedPayments | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const [collectors, setCollectors] = useState<User[]>([])

  const reqRef = useRef(0)
  const searchTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  // Sync filters → URL
  const pushUrl = useCallback((overrides: Record<string, string> = {}) => {
    const p = new URLSearchParams()
    const vals: Record<string, string> = {
      search, method, status, donorType, collectorId, dateFrom, dateTo,
      minAmount, maxAmount, page: String(page), ...overrides,
    }
    Object.entries(vals).forEach(([k, v]) => { if (v && v !== '1' || k === 'page') p.set(k, v) })
    router.replace(`?${p.toString()}`, { scroll: false })
  }, [search, method, status, donorType, collectorId, dateFrom, dateTo, minAmount, maxAmount, page, router])

  // Load collectors for dropdown
  useEffect(() => {
    getUsers().then(setCollectors).catch(() => {})
  }, [])

  // Fetch payments when any filter changes
  useEffect(() => {
    const req = ++reqRef.current
    setLoading(true)
    setError(null)
    getDashboardPayments({
      page, perPage: 20,
      method: method || undefined,
      status: status || undefined,
      donorType: donorType || undefined,
      collectorId: collectorId ? Number(collectorId) : undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      minAmount: minAmount || undefined,
      maxAmount: maxAmount || undefined,
      search: search || undefined,
    })
      .then((result) => { if (req === reqRef.current) setData(result) })
      .catch((err: ApiError) => { if (req === reqRef.current) setError(err.message ?? 'Failed to load payments.') })
      .finally(() => { if (req === reqRef.current) setLoading(false) })
  }, [page, method, status, donorType, collectorId, dateFrom, dateTo, minAmount, maxAmount, search])

  function handleSearchChange(val: string) {
    setSearch(val)
    clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => { setPage(1); pushUrl({ search: val, page: '1' }) }, 350)
  }

  function setMethodFilter(m: typeof method) {
    setMethod(m); setPage(1); pushUrl({ method: m, page: '1' })
  }

  function setStatusFilter(s: typeof status) {
    setStatus(s); setPage(1); pushUrl({ status: s, page: '1' })
  }

  function applyAdvanced() {
    setDonorType(draftDonorType)
    setCollectorId(draftCollectorId)
    setDateFrom(draftDateFrom)
    setDateTo(draftDateTo)
    setMinAmount(draftMinAmount)
    setMaxAmount(draftMaxAmount)
    setPage(1)
    pushUrl({
      donorType: draftDonorType, collectorId: draftCollectorId,
      dateFrom: draftDateFrom, dateTo: draftDateTo,
      minAmount: draftMinAmount, maxAmount: draftMaxAmount, page: '1',
    })
    setSheetOpen(false)
  }

  function resetAdvanced() {
    setDraftDonorType(''); setDraftCollectorId('')
    setDraftDateFrom(''); setDraftDateTo('')
    setDraftMinAmount(''); setDraftMaxAmount('')
    // Also clear committed values immediately
    setDonorType(''); setCollectorId('')
    setDateFrom(''); setDateTo('')
    setMinAmount(''); setMaxAmount('')
    setPage(1)
    pushUrl({ donorType: '', collectorId: '', dateFrom: '', dateTo: '', minAmount: '', maxAmount: '', page: '1' })
  }

  const advancedActiveCount = [donorType, collectorId, dateFrom, dateTo, minAmount, maxAmount].filter(Boolean).length
  const collectorName = collectors.find(c => String(c.id) === collectorId)?.name

  return (
    <div className="p-6 lg:p-8">
      <PageHeader title="All Payments" subtitle="Full payment ledger across all collectors." className="mb-6" />

      {/* Primary filter row */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search donor, collector, receipt…"
            className="pl-8 h-8 text-sm"
          />
          {search && (
            <button onClick={() => handleSearchChange('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="size-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-muted-foreground">Method:</span>
          {(['', 'upi', 'cash', 'cheque'] as const).map((m) => (
            <button key={m} onClick={() => setMethodFilter(m)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${method === m ? 'bg-brand-orange text-white' : 'bg-muted text-muted-foreground hover:bg-brand-orange/10 hover:text-brand-orange'}`}>
              {m === '' ? 'All' : m.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-muted-foreground">Status:</span>
          {(['', 'pending', 'completed', 'expired', 'cancelled'] as const).map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${status === s ? 'bg-brand-navy text-white' : 'bg-muted text-muted-foreground hover:bg-brand-navy/10 hover:text-brand-navy'}`}>
              {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        <FilterButton
          onClick={() => {
            setDraftDonorType(donorType); setDraftCollectorId(collectorId)
            setDraftDateFrom(dateFrom); setDraftDateTo(dateTo)
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
          <FilterField label="Donor Type">
            <select value={draftDonorType} onChange={(e) => setDraftDonorType(e.target.value)}
              className="flex h-8 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50">
              <option value="">All Types</option>
              {DONOR_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </FilterField>

          <FilterField label="Collector">
            <select value={draftCollectorId} onChange={(e) => setDraftCollectorId(e.target.value)}
              className="flex h-8 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50">
              <option value="">All Collectors</option>
              {collectors.map((c) => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
            </select>
          </FilterField>

          <FilterField label="Date from">
            <Input type="date" value={draftDateFrom} onChange={(e) => setDraftDateFrom(e.target.value)} className="h-8 text-sm" />
          </FilterField>

          <FilterField label="Date to">
            <Input type="date" value={draftDateTo} onChange={(e) => setDraftDateTo(e.target.value)} className="h-8 text-sm" />
          </FilterField>

          <FilterField label="Min amount (₹)">
            <Input type="number" min={0} placeholder="0" value={draftMinAmount} onChange={(e) => setDraftMinAmount(e.target.value)} className="h-8 text-sm" />
          </FilterField>

          <FilterField label="Max amount (₹)">
            <Input type="number" min={0} placeholder="∞" value={draftMaxAmount} onChange={(e) => setDraftMaxAmount(e.target.value)} className="h-8 text-sm" />
          </FilterField>
        </FilterModal>
      </div>

      {/* Active filter chips */}
      {(donorType || collectorId || dateFrom || dateTo || minAmount || maxAmount) && (
        <div className="flex flex-wrap gap-2 mb-4">
          {donorType && <FilterChip label={`Type: ${donorType}`} onRemove={() => { setDonorType(''); setDraftDonorType(''); setPage(1); pushUrl({ donorType: '', page: '1' }) }} />}
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
        <div className="flex flex-col gap-3">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
      ) : !data || data.payments.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-border p-12 text-center">
          <p className="text-2xl mb-3">💳</p>
          <p className="font-semibold text-foreground">No payments found</p>
          <p className="text-sm text-muted-foreground mt-1">Adjust filters or wait for collectors to start collecting.</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-border bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/20">
                  {['Donor', 'Type', 'Collector', 'Amount', 'Mode', 'Status', 'Date', 'Receipt'].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.payments.map((p) => (
                  <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-5 py-3">
                      <button onClick={() => setSelectedPayment(p)} className="font-medium text-left hover:text-brand-orange transition-colors cursor-pointer">
                        {p.donor.name}
                      </button>
                      {p.donor.phone && <p className="text-xs text-muted-foreground">{p.donor.phone}</p>}
                    </td>
                    <td className="px-5 py-3 text-xs text-muted-foreground">{p.donor.donorType ?? <span className="text-muted-foreground/40">—</span>}</td>
                    <td className="px-5 py-3 text-muted-foreground">{p.collector.name}</td>
                    <td className="px-5 py-3 font-semibold">{fmt(p.amount)}</td>
                    <td className="px-5 py-3"><span className="text-xs font-bold uppercase">{p.method}</span></td>
                    <td className="px-5 py-3"><StatusBadge status={p.status} /></td>
                    <td className="px-5 py-3 text-xs text-muted-foreground">
                      {new Date(p.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-5 py-3">
                      {p.receiptNo ? (
                        <a href={`${apiConfig.baseUrl}${apiConfig.backendPages.payReceipt(p.id)}?from=dashboard`} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-brand-orange hover:underline font-medium">{p.receiptNo}</a>
                      ) : <span className="text-muted-foreground/50">—</span>}
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

      <PaymentDetailDialog payment={selectedPayment} open={!!selectedPayment} onOpenChange={(o) => { if (!o) setSelectedPayment(null) }} />
    </div>
  )
}
