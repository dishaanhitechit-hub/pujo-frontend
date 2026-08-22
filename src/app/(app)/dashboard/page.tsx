'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { getDashboardSummary, getDashboardCollectors, getDashboardPayments } from '@/lib/api/dashboard'
import type { DashboardPaymentsQuery } from '@/lib/api/dashboard'
import type { DashboardSummary, CollectorBreakdown, PaginatedPayments, Payment } from '@/types'
import { RoleGuard } from '@/lib/auth/role-guard'
import { StatCard } from '@/components/dashboard/StatCard'
import { PageHeader } from '@/components/dashboard/PageHeader'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { PaymentDetailDialog } from '@/components/shared/PaymentDetailDialog'
import { FilterChip } from '@/components/shared/FilterChip'
import { FilterModal, FilterButton, FilterField } from '@/components/shared/FilterModal'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  IndianRupee, Smartphone, Banknote, CheckCircle2, Clock, Users,
  ChevronLeft, ChevronRight, FileText, TrendingUp, Search, X, Loader2, ExternalLink,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { apiConfig } from '@/config/api'
import { DONOR_TYPES } from '@/constants'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import type { ApiError } from '@/types'

function fmt(val: string | number) {
  return `₹${Number(val).toLocaleString('en-IN', { minimumFractionDigits: 0 })}`
}

export default function DashboardPage() {
  return (
    <RoleGuard permission="dashboard.view">
      <DashboardContent />
    </RoleGuard>
  )
}

function DashboardContent() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [collectors, setCollectors] = useState<CollectorBreakdown[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Summary and collectors load once; payment history has its own state below
  useEffect(() => {
    setLoading(true)
    Promise.all([getDashboardSummary(), getDashboardCollectors()])
      .then(([s, c]) => { setSummary(s); setCollectors(c) })
      .catch((err: ApiError) => setError(err.message ?? 'Failed to load dashboard.'))
      .finally(() => setLoading(false))
  }, [])

  if (error) {
    return (
      <div className="p-6 lg:p-8">
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-6 text-sm text-destructive">{error}</div>
      </div>
    )
  }

  const chartData = collectors.slice(0, 10).map((c) => ({
    name: c.collector.name.split(' ')[0],
    UPI: Number(c.upiTotal),
    Cash: Number(c.cashTotal),
  }))

  return (
    <div className="p-6 lg:p-8 flex flex-col gap-8">
      <PageHeader title="Dashboard" subtitle="Overall collection overview across all collectors." />

      {/* Summary cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      ) : summary && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <div className="xl:col-span-2">
              <StatCard label="Grand Total" value={fmt(summary.grandTotal)} icon={IndianRupee} variant="primary" />
            </div>
            <StatCard label="UPI Total" value={fmt(summary.upiTotal)} icon={Smartphone} />
            <StatCard label="Cash Total" value={fmt(summary.cashTotal)} icon={Banknote} />
            <StatCard label="Cheque Total" value={fmt(summary.chequeTotal)} icon={FileText} />
            <StatCard label="Completed" value={summary.confirmedCount} icon={CheckCircle2} variant="success" />
            <StatCard label="Pending" value={summary.pendingCount} icon={Clock} variant="warning" />
            <StatCard label="Total Donors" value={summary.totalDonors} icon={Users} />
          </div>
          {(Number(summary.totalPledged) > 0 || summary.openPledgeCount > 0) && (
            <div className="rounded-xl border border-border bg-card p-5">
              <h2 className="font-semibold text-sm mb-4 flex items-center gap-2"><TrendingUp className="size-4" /> Pledge Summary</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Total Pledged</p>
                  <p className="font-semibold text-lg">{fmt(summary.totalPledged)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Paid</p>
                  <p className="font-semibold text-lg text-green-700">{fmt(summary.totalPledgePaid)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Outstanding</p>
                  <p className="font-semibold text-lg text-yellow-700">{fmt(summary.totalPledgeOutstanding)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Open Pledges</p>
                  <p className="font-semibold text-lg">{summary.openPledgeCount}</p>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="font-semibold text-sm mb-4">Collections by Collector</h2>
          {loading ? (
            <Skeleton className="h-56 w-full" />
          ) : chartData.length === 0 ? (
            <div className="h-56 flex items-center justify-center text-sm text-muted-foreground">No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} margin={{ left: -10 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v) => `₹${Number(v).toLocaleString('en-IN')}`} />
                <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="UPI" fill="oklch(0.638 0.211 35.2)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Cash" fill="oklch(0.55 0.11 138)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="font-semibold text-sm mb-4 flex items-center gap-2"><Users className="size-4" /> Collector Breakdown</h2>
          {loading ? (
            <div className="flex flex-col gap-2">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12" />)}
            </div>
          ) : collectors.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No collectors yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border">
                    <th className="pb-2 text-left text-muted-foreground font-semibold">Collector</th>
                    <th className="pb-2 text-right text-muted-foreground font-semibold">Total</th>
                    <th className="pb-2 text-right text-muted-foreground font-semibold hidden sm:table-cell">Completed</th>
                  </tr>
                </thead>
                <tbody>
                  {collectors.map((c) => (
                    <tr key={c.collector.id} className="border-b border-border/50 last:border-0">
                      <td className="py-2.5">
                        <p className="font-medium">{c.collector.name}</p>
                        <p className="text-muted-foreground capitalize">{c.collector.role}</p>
                      </td>
                      <td className="py-2.5 text-right font-semibold">{fmt(c.grandTotal)}</td>
                      <td className="py-2.5 text-right text-muted-foreground hidden sm:table-cell">{c.confirmedCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Recent payment history — has its own filter/search state */}
      <DashboardPaymentsSection collectors={collectors} />
    </div>
  )
}

// ── Dashboard payments section ─────────────────────────────────────────────
// Separate component so its filter state does not cause summary/chart re-fetches.

interface DashboardPaymentsSectionProps {
  collectors: CollectorBreakdown[]
}

function DashboardPaymentsSection({ collectors }: DashboardPaymentsSectionProps) {
  const [payments, setPayments] = useState<PaginatedPayments | null>(null)
  const [page, setPage] = useState(1)
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const [loading, setLoading] = useState(true)
  const [isFetching, setIsFetching] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // search = raw input; debouncedSearch gates the API
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search, 350)

  const [method, setMethod] = useState<'upi' | 'cash' | 'cheque' | ''>('')
  const [status, setStatus] = useState<'pending' | 'completed' | 'expired' | 'cancelled' | ''>('')

  // Advanced filter state (modal draft pattern)
  const [collectorId, setCollectorId] = useState('')
  const [donorType, setDonorType] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [draftCollectorId, setDraftCollectorId] = useState('')
  const [draftDonorType, setDraftDonorType] = useState('')
  const [draftDateFrom, setDraftDateFrom] = useState('')
  const [draftDateTo, setDraftDateTo] = useState('')
  const [sheetOpen, setSheetOpen] = useState(false)

  const reqRef = useRef(0)
  // Track whether any data has loaded so we can show skeleton only on first load
  const hasDataRef = useRef(false)

  // Reset to page 1 when debounced search changes (skip initial mount)
  const searchSyncedRef = useRef(false)
  useEffect(() => {
    if (!searchSyncedRef.current) { searchSyncedRef.current = true; return }
    setPage(1)
  }, [debouncedSearch])

  useEffect(() => {
    const req = ++reqRef.current
    // Show skeleton only on very first load; subsequent fetches use isFetching overlay
    if (!hasDataRef.current) setLoading(true)
    setIsFetching(true)
    setError(null)

    const query: DashboardPaymentsQuery = {
      page,
      perPage: 10,
      search: debouncedSearch || undefined,
      method: method || undefined,
      status: status || undefined,
      collectorId: collectorId ? Number(collectorId) : undefined,
      donorType: donorType || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    }

    getDashboardPayments(query)
      .then((result) => { if (req === reqRef.current) { hasDataRef.current = true; setPayments(result) } })
      .catch((err: ApiError) => { if (req === reqRef.current) setError(err.message ?? 'Failed to load payments.') })
      .finally(() => {
        if (req === reqRef.current) {
          setLoading(false)
          setIsFetching(false)
        }
      })
  }, [page, debouncedSearch, method, status, collectorId, donorType, dateFrom, dateTo])

  function applyAdvanced() {
    setCollectorId(draftCollectorId)
    setDonorType(draftDonorType)
    setDateFrom(draftDateFrom)
    setDateTo(draftDateTo)
    setPage(1)
    setSheetOpen(false)
  }

  function resetAdvanced() {
    setDraftCollectorId(''); setDraftDonorType(''); setDraftDateFrom(''); setDraftDateTo('')
    setCollectorId(''); setDonorType(''); setDateFrom(''); setDateTo('')
    setPage(1)
  }

  const advancedActiveCount = [collectorId, donorType, dateFrom, dateTo].filter(Boolean).length
  const collectorName = collectors.find(c => String(c.collector.id) === collectorId)?.collector.name

  return (
    <div className="rounded-xl border border-border bg-card">
      {/* Section header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold text-sm">Recent Payment History</h2>
          {isFetching && !loading && <Loader2 className="size-3.5 animate-spin text-muted-foreground" />}
        </div>
        <Link
          href="/payments"
          className="text-xs text-brand-orange hover:underline font-medium flex items-center gap-1"
        >
          View All <ExternalLink className="size-3" />
        </Link>
      </div>

      {/* Compact filter row */}
      <div className="px-5 py-3 border-b border-border flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[160px] max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search donor, collector…"
            className="pl-8 h-8 text-xs"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="size-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground">Mode:</span>
          {(['', 'upi', 'cash', 'cheque'] as const).map((m) => (
            <button key={m} onClick={() => { setMethod(m); setPage(1) }}
              className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${method === m ? 'bg-brand-orange text-white' : 'bg-muted text-muted-foreground hover:bg-brand-orange/10 hover:text-brand-orange'}`}>
              {m === '' ? 'All' : m.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground">Status:</span>
          {(['', 'pending', 'completed', 'expired'] as const).map((s) => (
            <button key={s} onClick={() => { setStatus(s); setPage(1) }}
              className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${status === s ? 'bg-brand-navy text-white' : 'bg-muted text-muted-foreground hover:bg-brand-navy/10 hover:text-brand-navy'}`}>
              {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        <FilterButton
          onClick={() => {
            setDraftCollectorId(collectorId); setDraftDonorType(donorType)
            setDraftDateFrom(dateFrom); setDraftDateTo(dateTo)
            setSheetOpen(true)
          }}
          activeCount={advancedActiveCount}
          className="ml-auto h-8 text-xs"
        />

        <FilterModal
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          title="Payment Filters"
          onApply={applyAdvanced}
          onReset={resetAdvanced}
        >
          {collectors.length > 0 && (
            <FilterField label="Collector" wide>
              <select value={draftCollectorId} onChange={(e) => setDraftCollectorId(e.target.value)}
                className="flex h-8 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50">
                <option value="">All Collectors</option>
                {collectors.map((c) => (
                  <option key={c.collector.id} value={String(c.collector.id)}>{c.collector.name}</option>
                ))}
              </select>
            </FilterField>
          )}

          <FilterField label="Donor Type" wide>
            <select value={draftDonorType} onChange={(e) => setDraftDonorType(e.target.value)}
              className="flex h-8 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50">
              <option value="">All Types</option>
              {DONOR_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </FilterField>

          <FilterField label="Date from">
            <Input type="date" value={draftDateFrom} onChange={(e) => setDraftDateFrom(e.target.value)} className="h-8 text-sm" />
          </FilterField>
          <FilterField label="Date to">
            <Input type="date" value={draftDateTo} onChange={(e) => setDraftDateTo(e.target.value)} className="h-8 text-sm" />
          </FilterField>
        </FilterModal>
      </div>

      {/* Active filter chips */}
      {(collectorId || donorType || dateFrom || dateTo) && (
        <div className="px-5 py-2 flex flex-wrap gap-2 border-b border-border bg-muted/10">
          {collectorId && <FilterChip label={`Collector: ${collectorName ?? collectorId}`} onRemove={() => { setCollectorId(''); setDraftCollectorId(''); setPage(1) }} />}
          {donorType && <FilterChip label={`Type: ${donorType}`} onRemove={() => { setDonorType(''); setDraftDonorType(''); setPage(1) }} />}
          {dateFrom && <FilterChip label={`From: ${dateFrom}`} onRemove={() => { setDateFrom(''); setDraftDateFrom(''); setPage(1) }} />}
          {dateTo && <FilterChip label={`To: ${dateTo}`} onRemove={() => { setDateTo(''); setDraftDateTo(''); setPage(1) }} />}
        </div>
      )}

      {/* Table */}
      {error ? (
        <div className="p-6 text-sm text-destructive">{error}</div>
      ) : loading ? (
        <div className="p-4 flex flex-col gap-3">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14" />)}
        </div>
      ) : !payments || payments.payments.length === 0 ? (
        <div className="p-12 text-center text-sm text-muted-foreground">No payments match the current filters.</div>
      ) : (
        <>
          <div className={`overflow-x-auto transition-opacity ${isFetching ? 'opacity-60' : 'opacity-100'}`}>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/20">
                  <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Donor</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Collector</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Amount</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Mode</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Receipt</th>
                </tr>
              </thead>
              <tbody>
                {payments.payments.map((p) => (
                  <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-5 py-3">
                      <button
                        onClick={() => setSelectedPayment(p)}
                        className="font-medium text-left hover:text-brand-orange transition-colors cursor-pointer"
                      >
                        {p.donor.name}
                      </button>
                      {p.donor.phone && <p className="text-xs text-muted-foreground">{p.donor.phone}</p>}
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">{p.collector.name}</td>
                    <td className="px-5 py-3 font-semibold">{fmt(p.amount)}</td>
                    <td className="px-5 py-3">
                      <span className="text-xs font-bold uppercase">{p.method}</span>
                    </td>
                    <td className="px-5 py-3"><StatusBadge status={p.status} /></td>
                    <td className="px-5 py-3">
                      {p.receiptNo ? (
                        <a
                          href={`${apiConfig.baseUrl}${apiConfig.backendPages.payReceipt(p.id)}?from=dashboard`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-brand-orange hover:underline font-medium"
                        >
                          {p.receiptNo}
                        </a>
                      ) : <span className="text-muted-foreground/50">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {payments.pages > 1 && (
            <div className="flex items-center justify-between px-5 py-4 border-t border-border">
              <p className="text-xs text-muted-foreground">
                Page {payments.page} of {payments.pages} · {payments.total} payments
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                  <ChevronLeft className="size-4" />
                </Button>
                <Button variant="outline" size="sm" disabled={page >= payments.pages} onClick={() => setPage(p => p + 1)}>
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      <PaymentDetailDialog
        payment={selectedPayment}
        open={!!selectedPayment}
        onOpenChange={(o) => { if (!o) setSelectedPayment(null) }}
      />
    </div>
  )
}
