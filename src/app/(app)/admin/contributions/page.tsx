'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import {
  Users, CreditCard, Search, X, ChevronLeft, ChevronRight, Loader2,
  CheckCircle2, XCircle, Clock, ImageIcon, Receipt,
} from 'lucide-react'
import { PageHeader } from '@/components/dashboard/PageHeader'
import { RoleGuard } from '@/lib/auth/role-guard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { PaymentDetailDialog } from '@/components/shared/PaymentDetailDialog'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { useAuth } from '@/lib/auth/auth-provider'
import { userHasPermission } from '@/config/roles'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { apiConfig } from '@/config/api'
import { cn } from '@/lib/utils'
import { getDashboardEvents, getDashboardPayments, getDashboardSummary } from '@/lib/api/dashboard'
import { getAdminContributions, reviewContribution } from '@/lib/api/contributions'
import type { EventStats, Contribution, Payment, PaginatedPayments, DashboardSummary, ApiError } from '@/types'

const BASE = apiConfig.baseUrl
const fmt = (v: string | number) => `₹${Number(v).toLocaleString('en-IN', { minimumFractionDigits: 0 })}`
const fmtDate = (d: string | null) => d ? new Date((d.length === 10 ? d + 'T12:00:00' : d)).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'

export default function ContributionsPage() {
  return (
    <RoleGuard permission="payment.view_all">
      <Content />
    </RoleGuard>
  )
}

function Content() {
  const { user } = useAuth()
  const canReview = !!user && userHasPermission(user, 'contribution.manage')

  const [tab, setTab] = useState<'members' | 'payments'>(canReview ? 'members' : 'payments')
  const [events, setEvents] = useState<EventStats[]>([])
  const [eventId, setEventId] = useState<string>('')
  const [summary, setSummary] = useState<DashboardSummary | null>(null)

  // Load events once; default to the most recent event.
  useEffect(() => {
    getDashboardEvents().then((d) => {
      setEvents(d ?? [])
      if (d && d.length) setEventId(String(d[0].event.id))
    }).catch(() => {})
  }, [])

  // Summary for the selected event — one shared call, refetched only when the event changes.
  useEffect(() => {
    getDashboardSummary(eventId ? Number(eventId) : undefined).then(setSummary).catch(() => setSummary(null))
  }, [eventId])

  return (
    <div className="p-4 sm:p-6 lg:p-8 flex flex-col gap-5">
      <PageHeader
        title="Contributions"
        subtitle={canReview ? 'Review member contributions and view all collected payments.' : 'Member contributions and all collected payments.'}
      />

      {/* Tabs + shared event filter */}
      <div className="flex items-center justify-between gap-3 border-b border-border flex-wrap">
        <div className="flex gap-1">
          <TabBtn active={tab === 'members'} onClick={() => setTab('members')} icon={<Users className="size-4" />}>Members</TabBtn>
          <TabBtn active={tab === 'payments'} onClick={() => setTab('payments')} icon={<CreditCard className="size-4" />}>All Payments</TabBtn>
        </div>
        <div className="pb-2">
          <Select value={eventId || 'all'} onValueChange={(v) => setEventId(v === 'all' ? '' : v)}>
            <SelectTrigger className="h-8 w-auto min-w-[160px] text-sm"><SelectValue placeholder="All events" /></SelectTrigger>
            <SelectContent position="popper">
              <SelectItem value="all">All events</SelectItem>
              {events.map((e) => <SelectItem key={e.event.id} value={String(e.event.id)}>{e.event.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Shared summary for the selected event — spans both tabs */}
      <SummaryBar summary={summary} eventName={eventId ? events.find(e => String(e.event.id) === eventId)?.event.name : null} />

      {tab === 'members'
        ? <MembersTab eventId={eventId} canReview={canReview} />
        : <AllPaymentsTab eventId={eventId} />}
    </div>
  )
}

function SummaryBar({ summary, eventName }: { summary: DashboardSummary | null; eventName?: string | null }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <SummaryTile
        label="Collection Received"
        hint={`Money actually collected${eventName ? ` · ${eventName}` : ' · all events'}`}
        value={summary ? fmt(summary.grandTotal) : null}
        accent="green"
      />
      <SummaryTile
        label="Total Slip Value (Booked)"
        hint="Total amount committed across contribution slips"
        value={summary ? fmt(summary.totalPledged) : null}
        accent="orange"
      />
    </div>
  )
}

function SummaryTile({ label, hint, value, accent }: { label: string; hint: string; value: string | null; accent: 'green' | 'orange' }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <span className={cn('size-2 rounded-full', accent === 'green' ? 'bg-green-500' : 'bg-brand-orange')} />
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      </div>
      {value === null
        ? <Skeleton className="h-8 w-28 mt-0.5" />
        : <p className="text-2xl font-bold tabular-nums">{value}</p>}
      <p className="text-[11px] text-muted-foreground">{hint}</p>
    </div>
  )
}

function TabBtn({ active, onClick, icon, children }: { active: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={cn(
      'inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
      active ? 'border-brand-orange text-brand-orange' : 'border-transparent text-muted-foreground hover:text-foreground',
    )}>{icon}{children}</button>
  )
}

/* ── Members tab (self-reported, approval) ──────────────────────────────────── */

function MembersTab({ eventId, canReview }: { eventId: string; canReview: boolean }) {
  const [rows, setRows] = useState<Contribution[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(1)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search, 350)
  const [status, setStatus] = useState<'' | 'pending' | 'approved' | 'rejected'>(canReview ? 'pending' : '')
  const [reviewTarget, setReviewTarget] = useState<Contribution | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getAdminContributions({
        status: (status || undefined) as 'pending' | 'approved' | 'rejected' | undefined,
        eventId: eventId ? Number(eventId) : undefined,
        search: debouncedSearch || undefined,
        page, perPage: 20,
      })
      setRows(res.contributions); setTotal(res.total); setPages(res.pages)
    } catch (err) { toast.error((err as ApiError).message ?? 'Failed to load.') }
    finally { setLoading(false) }
  }, [status, eventId, debouncedSearch, page])

  useEffect(() => { load() }, [load])
  useEffect(() => { setPage(1) }, [status, eventId, debouncedSearch])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <SearchBox value={search} onChange={setSearch} placeholder="Search member, note…" />
        <div className="flex gap-1 flex-wrap">
          {([['', 'All'], ['pending', 'Pending'], ['approved', 'Approved'], ['rejected', 'Rejected']] as const)
            .filter(([v]) => canReview || v === '' || v === 'approved')  // finance: only All/Approved
            .map(([v, label]) => (
            <FilterPill key={v} active={status === v} onClick={() => setStatus(v)}>{label}</FilterPill>
          ))}
        </div>
      </div>

      {loading ? <ListSkeleton /> : rows.length === 0 ? (
        <Empty icon={<Users className="size-8 opacity-20" />} text="No member contributions found." />
      ) : (
        <>
          <p className="text-xs text-muted-foreground">{total} contribution{total !== 1 ? 's' : ''}</p>
          {/* Desktop table */}
          <div className="hidden md:block rounded-xl border border-border bg-card overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border bg-muted/20">
                {['Member', 'Amount', 'Method', 'Date', 'Event', 'Status', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {rows.map(c => (
                  <tr key={c.id} className="border-b border-border last:border-0 hover:bg-muted/10 transition-colors">
                    <td className="px-4 py-3">
                      <button onClick={() => setReviewTarget(c)} className="font-medium text-left hover:text-brand-orange">{c.user?.name ?? '—'}</button>
                      {c.source === 'collected' ? (
                        <p className="text-[11px] text-muted-foreground">
                          via slip {c.slipNumber ?? '—'}{c.collector ? ` · ${c.collector.name}` : ''}
                        </p>
                      ) : c.slipNumber ? (
                        <p className="text-[11px] font-mono text-brand-orange">{c.slipNumber}</p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 font-semibold tabular-nums whitespace-nowrap">₹{c.amount.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3 text-xs">{methodLabel(c.paymentMethod)}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">{fmtDate(c.paymentDate)}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{c.event?.name ?? 'General'}</td>
                    <td className="px-4 py-3">{statusBadge(c.status)}</td>
                    <td className="px-4 py-3 text-right">
                      {canReview && c.status === 'pending'
                        ? <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setReviewTarget(c)}>Review</Button>
                        : <button onClick={() => setReviewTarget(c)} className="text-xs text-brand-orange hover:underline">View</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Mobile cards */}
          <div className="flex flex-col gap-2 md:hidden">
            {rows.map(c => (
              <button key={c.id} onClick={() => setReviewTarget(c)} className="rounded-xl border border-border bg-card p-3.5 flex flex-col gap-1 text-left">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{c.user?.name ?? '—'}</span>{statusBadge(c.status)}
                </div>
                <span className="font-bold tabular-nums">₹{c.amount.toLocaleString('en-IN')} <span className="text-xs font-normal text-muted-foreground">{methodLabel(c.paymentMethod)}</span></span>
                <span className="text-xs text-muted-foreground">{fmtDate(c.paymentDate)} · {c.event?.name ?? 'General'}</span>
                {c.source === 'collected' ? (
                  <span className="text-[11px] text-muted-foreground">via slip {c.slipNumber ?? '—'}{c.collector ? ` · ${c.collector.name}` : ''}</span>
                ) : c.slipNumber ? (
                  <span className="text-[11px] font-mono text-brand-orange">{c.slipNumber}</span>
                ) : null}
              </button>
            ))}
          </div>
          <Pager page={page} pages={pages} onPrev={() => setPage(p => p - 1)} onNext={() => setPage(p => p + 1)} />
        </>
      )}

      <ReviewDialog target={reviewTarget} canReview={canReview} onOpenChange={(o) => { if (!o) setReviewTarget(null) }} onDone={() => { setReviewTarget(null); load() }} />
    </div>
  )
}

/* ── All Payments tab (collected) ───────────────────────────────────────────── */

function AllPaymentsTab({ eventId }: { eventId: string }) {
  const [data, setData] = useState<PaginatedPayments | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search, 350)
  const [method, setMethod] = useState<'' | 'cash' | 'upi' | 'cheque'>('')
  const [selected, setSelected] = useState<Payment | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setData(await getDashboardPayments({
        eventId: eventId ? Number(eventId) : undefined,
        search: debouncedSearch || undefined,
        method: (method || undefined) as 'cash' | 'upi' | 'cheque' | undefined,
        page, perPage: 20,
      }))
    } catch (err) { toast.error((err as ApiError).message ?? 'Failed to load payments.') }
    finally { setLoading(false) }
  }, [eventId, debouncedSearch, method, page])

  useEffect(() => { load() }, [load])
  useEffect(() => { setPage(1) }, [eventId, debouncedSearch, method])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <SearchBox value={search} onChange={setSearch} placeholder="Search donor, slip, receipt…" />
        <div className="flex gap-1 flex-wrap">
          {([['', 'All'], ['cash', 'Cash'], ['upi', 'UPI'], ['cheque', 'Cheque']] as const).map(([v, label]) => (
            <FilterPill key={v} active={method === v} onClick={() => setMethod(v)}>{label}</FilterPill>
          ))}
        </div>
      </div>

      {loading ? <ListSkeleton /> : !data || data.payments.length === 0 ? (
        <Empty icon={<Receipt className="size-8 opacity-20" />} text="No payments found." />
      ) : (
        <>
          <p className="text-xs text-muted-foreground">{data.total} payment{data.total !== 1 ? 's' : ''}</p>
          <div className="hidden md:block rounded-xl border border-border bg-card overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border bg-muted/20">
                {['Donor', 'Slip', 'Event', 'Collector', 'Amount', 'Mode', 'Status', 'Date', 'Receipt'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {data.payments.map(p => (
                  <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/10 transition-colors">
                    <td className="px-4 py-3">
                      <button onClick={() => setSelected(p)} className="font-medium text-left hover:text-brand-orange">{p.donor?.name ?? '—'}</button>
                      {p.donor?.phone && <p className="text-xs text-muted-foreground">{p.donor.phone}</p>}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="font-mono text-xs text-muted-foreground">{p.slipNumber ?? '—'}</span>
                      {p.slipTotal != null && <SlipProgress total={p.slipTotal} paid={p.slipPaid} status={p.slipStatus} />}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{p.event?.name ?? '—'}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{p.collector?.name ?? '—'}</td>
                    <td className="px-4 py-3 font-semibold tabular-nums whitespace-nowrap">{fmt(p.amount)}</td>
                    <td className="px-4 py-3 text-xs font-bold uppercase">{p.method}</td>
                    <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{(p.receivedDate ?? p.createdAt ?? '').slice(0, 10)}</td>
                    <td className="px-4 py-3">
                      {p.receiptNo
                        ? <a href={`${BASE}/pay/receipt/${p.id}?from=dashboard`} target="_blank" rel="noopener noreferrer" className="font-mono text-xs text-brand-orange hover:underline">{p.receiptNo}</a>
                        : <span className="text-muted-foreground/40 text-xs">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-col gap-2 md:hidden">
            {data.payments.map(p => (
              <div key={p.id} className="rounded-xl border border-border bg-card p-3.5 flex flex-col gap-1">
                <div className="flex items-center justify-between gap-2">
                  <button onClick={() => setSelected(p)} className="font-medium hover:text-brand-orange">{p.donor?.name ?? '—'}</button>
                  <span className="font-bold tabular-nums">{fmt(p.amount)}</span>
                </div>
                <p className="text-xs text-muted-foreground">{p.slipNumber ?? '—'} · {p.event?.name ?? '—'} · <span className="uppercase">{p.method}</span></p>
                {p.slipTotal != null && <SlipProgress total={p.slipTotal} paid={p.slipPaid} status={p.slipStatus} />}
              </div>
            ))}
          </div>
          <Pager page={page} pages={data.pages} onPrev={() => setPage(p => p - 1)} onNext={() => setPage(p => p + 1)} />
        </>
      )}

      {selected && <PaymentDetailDialog payment={selected} open={!!selected} onOpenChange={(o) => { if (!o) setSelected(null) }} />}
    </div>
  )
}

/* ── Review dialog (members) ────────────────────────────────────────────────── */

function ReviewDialog({ target, canReview, onOpenChange, onDone }: {
  target: Contribution | null; canReview: boolean; onOpenChange: (o: boolean) => void; onDone: () => void
}) {
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState<'approve' | 'reject' | null>(null)
  useEffect(() => { if (target) setNote('') }, [target])

  async function act(action: 'approve' | 'reject') {
    if (!target) return
    if (action === 'reject' && !note.trim()) { toast.error('Add a note explaining the rejection'); return }
    setBusy(action)
    try {
      await reviewContribution(target.id, action, note.trim() || undefined)
      toast.success(`Contribution ${action === 'approve' ? 'approved' : 'rejected'}`)
      onDone()
    } catch (err) { toast.error((err as ApiError).message ?? 'Failed.') }
    finally { setBusy(null) }
  }

  return (
    <Dialog open={!!target} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{target?.user?.name ?? 'Contribution'}</DialogTitle></DialogHeader>
        {target && (
          <div className="flex flex-col gap-3 pt-1 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Amount" value={`₹${target.amount.toLocaleString('en-IN')}`} />
              <Field label="Method" value={methodLabel(target.paymentMethod)} />
              <Field label="Date" value={fmtDate(target.paymentDate)} />
              <Field label="Event" value={target.event?.name ?? 'General'} />
              <Field label="Status" value={<span>{statusBadge(target.status)}</span>} />
              {target.slipNumber && <Field label="Slip" value={<span className="font-mono">{target.slipNumber}</span>} />}
              {target.source === 'collected' && target.collector && <Field label="Collected by" value={target.collector.name} />}
            </div>
            {target.source === 'collected' && (
              <p className="text-xs text-muted-foreground">Collected from this member via a contribution slip — recorded automatically, no review needed.</p>
            )}
            {target.source === 'collected' && target.receiptNo && (
              <a href={`${BASE}/pay/receipt/${target.id}?from=detail`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-brand-orange hover:underline">
                <Receipt className="size-4" /> View receipt {target.receiptNo}
              </a>
            )}
            {target.note && <Field label="Member note" value={<span className="italic">&quot;{target.note}&quot;</span>} />}
            {target.adminNote && <Field label="Admin note" value={target.adminNote} />}
            {target.hasScreenshot && target.screenshotUrl && (
              <a href={`${BASE}${target.screenshotUrl}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-brand-orange hover:underline">
                <ImageIcon className="size-4" /> View payment screenshot
              </a>
            )}
            {canReview && target.status === 'pending' && (
              <>
                <div className="flex flex-col gap-1.5">
                  <Label>Note (required to reject)</Label>
                  <Textarea rows={2} value={note} onChange={e => setNote(e.target.value)} placeholder="Optional for approve; required for reject" />
                </div>
                <DialogFooter>
                  <Button variant="outline" className="text-destructive border-destructive/20 hover:bg-destructive/5" disabled={!!busy} onClick={() => act('reject')}>
                    {busy === 'reject' ? <Loader2 className="size-4 animate-spin mr-1.5" /> : <XCircle className="size-4 mr-1.5" />}Reject
                  </Button>
                  <Button className="bg-green-600 hover:bg-green-700 text-white" disabled={!!busy} onClick={() => act('approve')}>
                    {busy === 'approve' ? <Loader2 className="size-4 animate-spin mr-1.5" /> : <CheckCircle2 className="size-4 mr-1.5" />}Approve
                  </Button>
                </DialogFooter>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

/* ── small shared bits ──────────────────────────────────────────────────────── */

function methodLabel(m: string) { return m === 'upi' ? 'UPI' : m === 'bank_transfer' ? 'Bank Transfer' : m === 'cheque' ? 'Cheque' : 'Cash' }
function statusBadge(s: string) {
  if (s === 'approved' || s === 'received') return <span className="inline-flex items-center rounded-full border border-green-200 bg-green-50 text-green-700 px-2 py-0.5 text-xs font-semibold">{s === 'received' ? 'Received' : 'Approved'}</span>
  if (s === 'rejected') return <span className="inline-flex items-center rounded-full border border-red-200 bg-red-50 text-red-700 px-2 py-0.5 text-xs font-semibold">Rejected</span>
  return <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 text-amber-700 px-2 py-0.5 text-xs font-semibold">Pending</span>
}

function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="relative flex-1 min-w-[180px] max-w-xs">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
      <Input placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)} className="pl-9 pr-8" />
      {value && <button className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => onChange('')}><X className="size-3.5" /></button>}
    </div>
  )
}
function FilterPill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button onClick={onClick} className={cn('px-3 py-1.5 rounded-full text-xs font-semibold transition-colors', active ? 'bg-brand-orange text-white' : 'bg-muted text-muted-foreground hover:bg-brand-orange/10 hover:text-brand-orange')}>{children}</button>
}
function SlipProgress({ total, paid, status }: { total: string; paid?: string | null; status?: string | null }) {
  const t = Number(total), pd = Number(paid ?? 0)
  const closedEarly = status === 'closed' && pd < t
  return (
    <p className="text-[11px] text-muted-foreground mt-0.5 tabular-nums">
      Slip paid ₹{pd.toLocaleString('en-IN')} / ₹{t.toLocaleString('en-IN')}
      {closedEarly && <> · <span className="line-through">₹{(t - pd).toLocaleString('en-IN')}</span> written off</>}
    </p>
  )
}
function ListSkeleton() { return <div className="flex flex-col gap-2">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-12 rounded-xl" />)}</div> }
function Empty({ icon, text }: { icon: React.ReactNode; text: string }) {
  return <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-border bg-card py-16 text-muted-foreground">{icon}<p className="text-sm">{text}</p></div>
}
function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return <div><p className="text-[11px] text-muted-foreground uppercase tracking-wide">{label}</p><p className="font-medium">{value}</p></div>
}
function Pager({ page, pages, onPrev, onNext }: { page: number; pages: number; onPrev: () => void; onNext: () => void }) {
  if (pages <= 1) return null
  return (
    <div className="flex items-center justify-between">
      <p className="text-xs text-muted-foreground">Page {page} of {pages}</p>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" disabled={page <= 1} onClick={onPrev}><ChevronLeft className="size-4" /></Button>
        <Button variant="outline" size="sm" disabled={page >= pages} onClick={onNext}><ChevronRight className="size-4" /></Button>
      </div>
    </div>
  )
}
