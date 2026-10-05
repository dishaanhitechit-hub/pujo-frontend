'use client'

import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Loader2, Check, X, Clock, CheckCircle2, XCircle, HandCoins } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PageHeader } from '@/components/dashboard/PageHeader'
import { RoleGuard } from '@/lib/auth/role-guard'
import { Skeleton } from '@/components/ui/skeleton'
import { listHandovers, acceptHandover, rejectHandover } from '@/lib/api/handovers'
import { listActiveEvents } from '@/lib/api/events'
import { cn } from '@/lib/utils'
import type { Handover, EventSummary, ApiError } from '@/types'

const fmt = (v: string | number) => `₹${Number(v).toLocaleString('en-IN', { minimumFractionDigits: 0 })}`
const STATUS: Record<string, { cls: string; icon: React.ReactNode }> = {
  pending:  { cls: 'bg-amber-50 text-amber-700 border-amber-200', icon: <Clock className="size-3" /> },
  accepted: { cls: 'bg-green-50 text-green-700 border-green-200', icon: <CheckCircle2 className="size-3" /> },
  rejected: { cls: 'bg-red-50 text-red-700 border-red-200', icon: <XCircle className="size-3" /> },
}

export default function HandoverApprovalsPage() {
  return (
    <RoleGuard permission="handover.manage">
      <Content />
    </RoleGuard>
  )
}

function Content() {
  const [rows, setRows] = useState<Handover[]>([])
  const [events, setEvents] = useState<EventSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('pending')
  const [eventId, setEventId] = useState('')
  const [busyId, setBusyId] = useState<number | null>(null)
  const [rejectTarget, setRejectTarget] = useState<Handover | null>(null)

  useEffect(() => { listActiveEvents().then(setEvents).catch(() => {}) }, [])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setRows(await listHandovers({ status: status || undefined, eventId: eventId ? Number(eventId) : undefined }))
    } catch { toast.error('Failed to load handovers.') }
    finally { setLoading(false) }
  }, [status, eventId])

  useEffect(() => { load() }, [load])

  async function doAccept(h: Handover) {
    setBusyId(h.id)
    try { await acceptHandover(h.id); toast.success('Handover accepted.'); load() }
    catch (e) { toast.error((e as ApiError).message ?? 'Failed.') }
    finally { setBusyId(null) }
  }

  const pendingTotal = rows.filter((r) => r.status === 'pending').reduce((s, r) => s + Number(r.amount), 0)

  return (
    <div className="p-4 sm:p-6 lg:p-8 flex flex-col gap-5">
      <PageHeader title="Handover Approvals" subtitle="Review and accept cash handed over to you by collectors." />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <Select value={status || 'all'} onValueChange={(v) => setStatus(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-auto min-w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent position="popper">
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="accepted">Accepted</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="all">All</SelectItem>
          </SelectContent>
        </Select>
        <Select value={eventId || 'all'} onValueChange={(v) => setEventId(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-auto min-w-[140px]"><SelectValue placeholder="All events" /></SelectTrigger>
          <SelectContent position="popper">
            <SelectItem value="all">All events</SelectItem>
            {events.map((e) => <SelectItem key={e.id} value={String(e.id)}>{e.name}</SelectItem>)}
          </SelectContent>
        </Select>
        {status === 'pending' && rows.length > 0 && (
          <span className="ml-auto text-sm text-muted-foreground">Pending total: <span className="font-bold text-brand-navy tabular-nums">{fmt(pendingTotal)}</span></span>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col gap-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-border bg-card py-16 text-muted-foreground">
          <HandCoins className="size-10 opacity-20" />
          <p className="text-sm">No handovers {status ? `(${status})` : ''}.</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden sm:block rounded-xl border border-border bg-card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/20">
                  {['Collector', 'Handed to', 'Event', 'Amount', 'Date', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((h) => (
                  <tr key={h.id} className="border-b border-border last:border-0 hover:bg-muted/10 transition-colors">
                    <td className="px-5 py-3 font-medium">{h.collector?.name ?? '—'}</td>
                    <td className="px-5 py-3 text-muted-foreground">{h.handoverTo?.name ?? '—'}</td>
                    <td className="px-5 py-3 text-muted-foreground">{h.event?.name ?? '—'}</td>
                    <td className="px-5 py-3 font-semibold tabular-nums">{fmt(h.amount)}</td>
                    <td className="px-5 py-3 text-muted-foreground whitespace-nowrap">{h.handoverDate}</td>
                    <td className="px-5 py-3">
                      <span className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold capitalize', STATUS[h.status].cls)}>
                        {STATUS[h.status].icon}{h.status}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      {h.status === 'pending' ? (
                        <div className="flex items-center gap-1">
                          <Button size="sm" className="h-7 px-2 gap-1 text-xs bg-green-600 hover:bg-green-700 text-white" disabled={busyId === h.id} onClick={() => doAccept(h)}>
                            {busyId === h.id ? <Loader2 className="size-3 animate-spin" /> : <Check className="size-3" />} Accept
                          </Button>
                          <Button size="sm" variant="outline" className="h-7 px-2 gap-1 text-xs text-destructive border-destructive/20 hover:bg-destructive/5" onClick={() => setRejectTarget(h)}>
                            <X className="size-3" /> Reject
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">{h.reviewedBy ? `by ${h.reviewedBy.name}` : '—'}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="flex flex-col gap-2 sm:hidden">
            {rows.map((h) => (
              <div key={h.id} className="rounded-xl border border-border bg-card p-4 flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-sm">{h.collector?.name ?? '—'}</p>
                  <span className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold capitalize', STATUS[h.status].cls)}>
                    {STATUS[h.status].icon}{h.status}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{h.event?.name} · {h.handoverDate}{h.handoverTo ? ` · to ${h.handoverTo.name}` : ''}</p>
                <p className="text-lg font-bold tabular-nums text-brand-navy">{fmt(h.amount)}</p>
                {h.status === 'pending' && (
                  <div className="flex items-center gap-2 pt-1">
                    <Button size="sm" className="flex-1 gap-1 bg-green-600 hover:bg-green-700 text-white" disabled={busyId === h.id} onClick={() => doAccept(h)}>
                      {busyId === h.id ? <Loader2 className="size-3 animate-spin" /> : <Check className="size-3" />} Accept
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1 gap-1 text-destructive border-destructive/20" onClick={() => setRejectTarget(h)}>
                      <X className="size-3" /> Reject
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      <RejectDialog target={rejectTarget} onOpenChange={(o) => { if (!o) setRejectTarget(null) }} onDone={() => { setRejectTarget(null); load() }} />
    </div>
  )
}

function RejectDialog({ target, onOpenChange, onDone }: {
  target: Handover | null; onOpenChange: (o: boolean) => void; onDone: () => void
}) {
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)
  useEffect(() => { if (target) setReason('') }, [target])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!target) return
    setSaving(true)
    try {
      await rejectHandover(target.id, reason.trim() || undefined)
      toast.success('Handover rejected.')
      onDone()
    } catch (err) {
      toast.error((err as ApiError).message ?? 'Failed to reject.')
    } finally { setSaving(false) }
  }

  return (
    <Dialog open={!!target} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Reject Handover</DialogTitle></DialogHeader>
        {target && (
          <form onSubmit={submit} className="flex flex-col gap-4 pt-1">
            <p className="text-xs text-muted-foreground">{target.collector?.name} · {fmt(target.amount)} · {target.event?.name}</p>
            <div className="flex flex-col gap-1.5">
              <Label>Reason (optional)</Label>
              <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. amount mismatch" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={saving} className="bg-destructive hover:bg-destructive/90 text-white">
                {saving && <Loader2 className="size-4 animate-spin mr-2" />}Reject
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
