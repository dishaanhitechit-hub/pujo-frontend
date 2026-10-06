'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import {
  Plus, Search, X, ChevronLeft, ChevronRight, Receipt, Eye,
  CheckCircle2, RotateCcw, Loader2,
} from 'lucide-react'
import { PageHeader } from '@/components/dashboard/PageHeader'
import { RoleGuard } from '@/lib/auth/role-guard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { listSlips, closeSlip, reopenSlip } from '@/lib/api/slips'
import { listActiveEvents } from '@/lib/api/events'
import { getCollectorPayments } from '@/lib/api/collector'
import { apiConfig } from '@/config/api'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { cn } from '@/lib/utils'
import type { ContributionSlip, EventSummary, Payment, ApiError } from '@/types'

const STATUS_STYLES: Record<string, string> = {
  open:      'bg-blue-50 text-blue-700 border-blue-200',
  closed:    'bg-green-50 text-green-700 border-green-200',
  cancelled: 'bg-slate-100 text-slate-500 border-slate-200',
}
const fmt = (v: string | number) => `₹${Number(v).toLocaleString('en-IN', { minimumFractionDigits: 0 })}`

export default function MyCollectionsPage() {
  return (
    <RoleGuard requireCanCollect>
      <Shell />
    </RoleGuard>
  )
}

function Shell() {
  const [view, setView] = useState<'slips' | 'payments'>('slips')
  return (
    <div className="p-4 sm:p-6 lg:p-8 flex flex-col gap-5">
      <PageHeader title="My Collections" subtitle="Your contribution slips and their payments.">
        <Button asChild className="bg-brand-orange hover:bg-brand-orange/90 text-white">
          <Link href="/collect"><Plus className="size-4 mr-1.5" /> New Slip</Link>
        </Button>
      </PageHeader>

      <div className="flex gap-1 border-b border-border">
        <button onClick={() => setView('slips')}
          className={cn('px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
            view === 'slips' ? 'border-brand-orange text-brand-orange' : 'border-transparent text-muted-foreground hover:text-foreground')}>
          Slips
        </button>
        <button onClick={() => setView('payments')}
          className={cn('px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
            view === 'payments' ? 'border-brand-orange text-brand-orange' : 'border-transparent text-muted-foreground hover:text-foreground')}>
          All Payments
        </button>
      </div>

      {view === 'slips' ? <Content /> : <PaymentsView />}
    </div>
  )
}

function Content() {
  const [slips, setSlips] = useState<ContributionSlip[]>([])
  const [events, setEvents] = useState<EventSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(1)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search, 350)
  const [eventId, setEventId] = useState('')
  const [status, setStatus] = useState('')
  const [busyId, setBusyId] = useState<number | null>(null)

  useEffect(() => { listActiveEvents().then(setEvents).catch(() => {}) }, [])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await listSlips({
        mine: true, page, perPage: 20,
        search: debouncedSearch || undefined,
        eventId: eventId ? Number(eventId) : undefined,
        status: (status || undefined) as 'open' | 'closed' | 'cancelled' | undefined,
      })
      setSlips(res.slips); setTotal(res.total); setPages(res.pages)
    } catch (err) {
      toast.error((err as ApiError).message ?? 'Failed to load slips.')
    } finally { setLoading(false) }
  }, [page, debouncedSearch, eventId, status])

  useEffect(() => { load() }, [load])
  useEffect(() => { setPage(1) }, [debouncedSearch, eventId, status])

  async function doClose(s: ContributionSlip) {
    setBusyId(s.id)
    try { const u = await closeSlip(s.id); setSlips((p) => p.map((x) => x.id === s.id ? u : x)); toast.success(`${s.slipNumber} closed.`) }
    catch (e) { toast.error((e as ApiError).message ?? 'Failed.') }
    finally { setBusyId(null) }
  }
  async function doReopen(s: ContributionSlip) {
    setBusyId(s.id)
    try { const u = await reopenSlip(s.id); setSlips((p) => p.map((x) => x.id === s.id ? u : x)); toast.success(`${s.slipNumber} reopened.`) }
    catch (e) { toast.error((e as ApiError).message ?? 'Failed.') }
    finally { setBusyId(null) }
  }

  const donorOf = (s: ContributionSlip) => s.donorKind === 'member' ? (s.memberName ?? s.donor?.name) : s.donor?.name

  return (
    <div className="flex flex-col gap-5">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <Input placeholder="Search slip no, donor, phone…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 pr-8" />
          {search && <button className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setSearch('')}><X className="size-3.5" /></button>}
        </div>
        <Select value={eventId || 'all'} onValueChange={(v) => setEventId(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-auto min-w-[140px]"><SelectValue placeholder="All events" /></SelectTrigger>
          <SelectContent position="popper">
            <SelectItem value="all">All events</SelectItem>
            {events.map((e) => <SelectItem key={e.id} value={String(e.id)}>{e.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={status || 'all'} onValueChange={(v) => setStatus(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-auto min-w-[120px]"><SelectValue placeholder="All status" /></SelectTrigger>
          <SelectContent position="popper">
            <SelectItem value="all">All status</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex flex-col gap-2">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}</div>
      ) : slips.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-border bg-card py-16 text-muted-foreground">
          <Receipt className="size-10 opacity-20" />
          <p className="text-sm">{search || eventId || status ? 'No slips match your filters.' : 'No slips yet.'}</p>
          {!search && !eventId && !status && (
            <Button asChild className="bg-brand-orange hover:bg-brand-orange/90 text-white"><Link href="/collect">Create first slip</Link></Button>
          )}
        </div>
      ) : (
        <>
          <p className="text-xs text-muted-foreground">{total} slip{total !== 1 ? 's' : ''}</p>

          {/* Desktop table */}
          <div className="hidden md:block rounded-xl border border-border bg-card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/20">
                  {['Slip No', 'Donor', 'Event', 'Total', 'Paid', 'Outstanding', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {slips.map((s) => (
                  <tr key={s.id} className="border-b border-border last:border-0 hover:bg-muted/10 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs whitespace-nowrap">{s.slipNumber}</td>
                    <td className="px-4 py-3 font-medium max-w-[160px] truncate">{donorOf(s) ?? '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{s.event?.name ?? '—'}</td>
                    <td className="px-4 py-3 tabular-nums whitespace-nowrap">{fmt(s.totalAmount)}</td>
                    <td className="px-4 py-3 tabular-nums whitespace-nowrap text-green-700">{fmt(s.paidAmount)}</td>
                    <td className="px-4 py-3 tabular-nums whitespace-nowrap font-semibold text-brand-navy">
                      {s.status === 'closed' && Number(s.outstanding) > 0 ? (
                        <span title="Written off — slip closed before full payment">
                          <span className="line-through text-muted-foreground/60 font-normal mr-1.5">{fmt(s.outstanding)}</span>
                          <span className="text-green-700">₹0</span>
                        </span>
                      ) : fmt(s.outstanding)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold capitalize', STATUS_STYLES[s.status])}>{s.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Button asChild variant="ghost" size="sm" className="h-7 px-2 gap-1 text-xs text-muted-foreground hover:text-foreground">
                          <Link href={`/collect/${s.id}`}><Eye className="size-3.5" /> Open</Link>
                        </Button>
                        {s.status === 'open' && (
                          <Button variant="ghost" size="sm" className="h-7 px-2 gap-1 text-xs text-muted-foreground hover:text-foreground" disabled={busyId === s.id} onClick={() => doClose(s)}>
                            {busyId === s.id ? <Loader2 className="size-3.5 animate-spin" /> : <CheckCircle2 className="size-3.5" />} Close
                          </Button>
                        )}
                        {s.status === 'closed' && (
                          <Button variant="ghost" size="sm" className="h-7 px-2 gap-1 text-xs text-muted-foreground hover:text-foreground" disabled={busyId === s.id} onClick={() => doReopen(s)}>
                            {busyId === s.id ? <Loader2 className="size-3.5 animate-spin" /> : <RotateCcw className="size-3.5" />} Reopen
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="flex flex-col gap-2 md:hidden">
            {slips.map((s) => (
              <div key={s.id} className="rounded-xl border border-border bg-card p-3.5 flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs text-muted-foreground">{s.slipNumber}</span>
                  <span className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold capitalize', STATUS_STYLES[s.status])}>{s.status}</span>
                </div>
                <p className="text-sm font-medium">{donorOf(s) ?? '—'}</p>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground tabular-nums">{fmt(s.paidAmount)} / {fmt(s.totalAmount)}</span>
                  {s.status === 'closed' && Number(s.outstanding) > 0 ? (
                    <span className="tabular-nums" title="Written off — closed before full payment">
                      <span className="line-through text-muted-foreground/60 mr-1">{fmt(s.outstanding)}</span>
                      <span className="font-semibold text-green-700">₹0 due</span>
                    </span>
                  ) : (
                    <span className="font-semibold text-brand-navy tabular-nums">Out: {fmt(s.outstanding)}</span>
                  )}
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <Button asChild variant="outline" size="sm" className="flex-1 gap-1 text-xs"><Link href={`/collect/${s.id}`}><Eye className="size-3.5" /> Open</Link></Button>
                  {s.status === 'open' && (
                    <Button variant="outline" size="sm" className="flex-1 gap-1 text-xs" disabled={busyId === s.id} onClick={() => doClose(s)}>
                      {busyId === s.id ? <Loader2 className="size-3.5 animate-spin" /> : <CheckCircle2 className="size-3.5" />} Close
                    </Button>
                  )}
                  {s.status === 'closed' && (
                    <Button variant="outline" size="sm" className="flex-1 gap-1 text-xs" disabled={busyId === s.id} onClick={() => doReopen(s)}>
                      {busyId === s.id ? <Loader2 className="size-3.5 animate-spin" /> : <RotateCcw className="size-3.5" />} Reopen
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {pages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Page {page} of {pages}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}><ChevronLeft className="size-4" /></Button>
                <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}><ChevronRight className="size-4" /></Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function PaymentsView() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [events, setEvents] = useState<EventSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(1)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search, 350)
  const [eventId, setEventId] = useState('')
  const [method, setMethod] = useState('')

  useEffect(() => { listActiveEvents().then(setEvents).catch(() => {}) }, [])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getCollectorPayments({
        page, perPage: 20, status: 'completed',
        search: debouncedSearch || undefined,
        eventId: eventId ? Number(eventId) : undefined,
        method: (method || undefined) as 'cash' | 'upi' | 'cheque' | undefined,
      })
      setPayments(res.payments); setTotal(res.total); setPages(res.pages)
    } catch (err) {
      toast.error((err as ApiError).message ?? 'Failed to load payments.')
    } finally { setLoading(false) }
  }, [page, debouncedSearch, eventId, method])

  useEffect(() => { load() }, [load])
  useEffect(() => { setPage(1) }, [debouncedSearch, eventId, method])

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <Input placeholder="Search receipt, donor, phone…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 pr-8" />
          {search && <button className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setSearch('')}><X className="size-3.5" /></button>}
        </div>
        <Select value={eventId || 'all'} onValueChange={(v) => setEventId(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-auto min-w-[140px]"><SelectValue placeholder="All events" /></SelectTrigger>
          <SelectContent position="popper">
            <SelectItem value="all">All events</SelectItem>
            {events.map((e) => <SelectItem key={e.id} value={String(e.id)}>{e.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={method || 'all'} onValueChange={(v) => setMethod(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-auto min-w-[120px]"><SelectValue placeholder="All methods" /></SelectTrigger>
          <SelectContent position="popper">
            <SelectItem value="all">All methods</SelectItem>
            <SelectItem value="cash">Cash</SelectItem>
            <SelectItem value="upi">UPI</SelectItem>
            <SelectItem value="cheque">Cheque</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex flex-col gap-2">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-12 rounded-xl" />)}</div>
      ) : payments.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-border bg-card py-16 text-muted-foreground">
          <Receipt className="size-10 opacity-20" />
          <p className="text-sm">No payments found.</p>
        </div>
      ) : (
        <>
          <p className="text-xs text-muted-foreground">{total} payment{total !== 1 ? 's' : ''}</p>

          {/* Desktop table */}
          <div className="hidden md:block rounded-xl border border-border bg-card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/20">
                  {['Receipt No', 'Slip No', 'Donor', 'Event', 'Amount', 'Method', 'Date'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/10 transition-colors">
                    <td className="px-4 py-3">
                      {p.receiptNo ? (
                        <a href={`${apiConfig.baseUrl}${apiConfig.backendPages.payReceipt(p.id, p.receiptToken, 'my-collections')}`} target="_blank" rel="noopener noreferrer"
                          className="font-mono text-xs text-brand-orange hover:underline">{p.receiptNo}</a>
                      ) : <span className="text-muted-foreground/40 text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground whitespace-nowrap">{p.slipNumber ?? '—'}</td>
                    <td className="px-4 py-3 font-medium max-w-[160px] truncate">{p.donor?.name ?? '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{p.event?.name ?? '—'}</td>
                    <td className="px-4 py-3 tabular-nums font-semibold whitespace-nowrap">{fmt(p.amount)}</td>
                    <td className="px-4 py-3"><span className="text-xs font-bold uppercase">{p.method}</span></td>
                    <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">{(p.receivedDate ?? p.createdAt ?? '').slice(0, 10)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="flex flex-col gap-2 md:hidden">
            {payments.map((p) => (
              <div key={p.id} className="rounded-xl border border-border bg-card p-3.5 flex flex-col gap-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs text-brand-orange">{p.receiptNo ?? '—'}</span>
                  <span className="text-sm font-bold tabular-nums">{fmt(p.amount)} <span className="text-xs font-normal uppercase text-muted-foreground">{p.method}</span></span>
                </div>
                <p className="text-sm font-medium">{p.donor?.name ?? '—'}</p>
                <p className="text-xs text-muted-foreground">{p.slipNumber ?? '—'} · {p.event?.name ?? '—'} · {(p.receivedDate ?? p.createdAt ?? '').slice(0, 10)}</p>
              </div>
            ))}
          </div>

          {pages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Page {page} of {pages}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}><ChevronLeft className="size-4" /></Button>
                <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}><ChevronRight className="size-4" /></Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
