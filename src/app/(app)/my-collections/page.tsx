'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import {
  Plus, Search, X, ChevronLeft, ChevronRight, Receipt, ChevronRight as Arrow,
} from 'lucide-react'
import { PageHeader } from '@/components/dashboard/PageHeader'
import { RoleGuard } from '@/lib/auth/role-guard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { listSlips } from '@/lib/api/slips'
import { listActiveEvents } from '@/lib/api/events'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { cn } from '@/lib/utils'
import type { ContributionSlip, EventSummary, ApiError } from '@/types'

const STATUS_STYLES: Record<string, string> = {
  open:      'bg-blue-50 text-blue-700 border-blue-200',
  closed:    'bg-green-50 text-green-700 border-green-200',
  cancelled: 'bg-slate-100 text-slate-500 border-slate-200',
}
const fmt = (v: string | number) => `₹${Number(v).toLocaleString('en-IN', { minimumFractionDigits: 0 })}`

export default function MyCollectionsPage() {
  return (
    <RoleGuard requireCanCollect>
      <Content />
    </RoleGuard>
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

  return (
    <div className="p-4 sm:p-6 lg:p-8 flex flex-col gap-5">
      <PageHeader title="My Collections" subtitle="Your contribution slips and their payments.">
        <Button asChild className="bg-brand-orange hover:bg-brand-orange/90 text-white">
          <Link href="/collect"><Plus className="size-4 mr-1.5" /> New Slip</Link>
        </Button>
      </PageHeader>

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
        <div className="flex flex-col gap-2">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
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
          <div className="flex flex-col gap-2">
            {slips.map((s) => {
              const donorName = s.donorKind === 'member' ? (s.memberName ?? s.donor?.name) : s.donor?.name
              const pct = Math.min(100, Math.round((Number(s.paidAmount) / Number(s.totalAmount)) * 100))
              return (
                <Link key={s.id} href={`/collect/${s.id}`}
                  className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 hover:bg-muted/10 transition-colors">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs text-muted-foreground">{s.slipNumber}</span>
                      <span className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold capitalize', STATUS_STYLES[s.status])}>{s.status}</span>
                    </div>
                    <p className="text-sm font-medium truncate mt-0.5">{donorName ?? '—'}</p>
                    <div className="mt-1.5 flex items-center gap-2">
                      <div className="h-1.5 w-24 rounded-full bg-muted overflow-hidden">
                        <div className={cn('h-full rounded-full', pct >= 100 ? 'bg-green-600' : 'bg-brand-orange')} style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs text-muted-foreground tabular-nums">{fmt(s.paidAmount)} / {fmt(s.totalAmount)}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Outstanding</p>
                    <p className="text-sm font-bold tabular-nums text-brand-navy">{fmt(s.outstanding)}</p>
                  </div>
                  <Arrow className="size-4 text-muted-foreground shrink-0" />
                </Link>
              )
            })}
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
