'use client'

import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Loader2, HandCoins, Wallet, Clock, CheckCircle2, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { PageHeader } from '@/components/dashboard/PageHeader'
import { RoleGuard } from '@/lib/auth/role-guard'
import { Skeleton } from '@/components/ui/skeleton'
import { getMyHandoverSummary, getMyHandovers, getHandoverReceivers, createHandover } from '@/lib/api/handovers'
import { cn } from '@/lib/utils'
import type { HandoverSummary, Handover, HandoverReceiver, ApiError } from '@/types'

const fmt = (v: string | number) => `₹${Number(v).toLocaleString('en-IN', { minimumFractionDigits: 0 })}`
const STATUS: Record<string, { cls: string; icon: React.ReactNode }> = {
  pending:  { cls: 'bg-amber-50 text-amber-700 border-amber-200', icon: <Clock className="size-3" /> },
  accepted: { cls: 'bg-green-50 text-green-700 border-green-200', icon: <CheckCircle2 className="size-3" /> },
  rejected: { cls: 'bg-red-50 text-red-700 border-red-200', icon: <XCircle className="size-3" /> },
}

export default function HandoversPage() {
  return (
    <RoleGuard requireCanCollect>
      <Content />
    </RoleGuard>
  )
}

function Content() {
  const [summary, setSummary] = useState<HandoverSummary[]>([])
  const [history, setHistory] = useState<Handover[]>([])
  const [loading, setLoading] = useState(true)
  const [target, setTarget] = useState<HandoverSummary | null>(null)
  const [eventFilter, setEventFilter] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [s, h] = await Promise.all([getMyHandoverSummary(), getMyHandovers()])
      setSummary(s); setHistory(h)
    } catch { toast.error('Failed to load handovers.') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  return (
    <div className="p-4 sm:p-6 lg:p-8 flex flex-col gap-6">
      <PageHeader title="Cash Handover" subtitle="Hand over collected cash to the treasurer, per event." />

      {loading ? (
        <Skeleton className="h-40 rounded-xl" />
      ) : (
        <>
          {/* Per-event in-hand summary */}
          <div className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold text-muted-foreground">Cash in hand by event</h2>
            {summary.length === 0 ? (
              <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
                No cash collected yet.
              </div>
            ) : summary.map((s) => (
              <div key={s.eventId} className="rounded-xl border border-border bg-card p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <p className="font-semibold text-sm">{s.eventName}</p>
                  <Button size="sm" disabled={Number(s.available) <= 0}
                    onClick={() => setTarget(s)}
                    className="bg-brand-orange hover:bg-brand-orange/90 text-white">
                    <HandCoins className="size-4 mr-1.5" /> Hand Over
                  </Button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <Stat label="Total collected" value={fmt(s.totalCollected)} />
                  <Stat label="Cash collected" value={fmt(s.cashCollected)} />
                  <Stat label="Handed over" value={fmt(s.handedOver)} tone="green" />
                  <Stat label="Pending" value={fmt(s.pending)} tone="amber" />
                  <Stat label="In hand" value={fmt(s.inHand)} tone="navy" />
                </div>
                {Number(s.onlineCollected) > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {fmt(s.onlineCollected)} collected online (UPI/cheque) goes directly to the account — only cash is handed over.
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* History */}
          <div className="flex flex-col gap-3">
            {(() => {
              const eventOptions = Array.from(
                new Map(history.filter(h => h.event).map(h => [h.event!.id, h.event!.name])).entries()
              )
              const rows = eventFilter ? history.filter(h => String(h.event?.id) === eventFilter) : history
              return (
            <>
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <h2 className="text-sm font-semibold text-muted-foreground">My handovers</h2>
              {eventOptions.length > 1 && (
                <select
                  value={eventFilter}
                  onChange={e => setEventFilter(e.target.value)}
                  className="h-8 rounded-lg border border-input bg-transparent px-2 text-xs shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <option value="">All events</option>
                  {eventOptions.map(([id, name]) => <option key={id} value={String(id)}>{name}</option>)}
                </select>
              )}
            </div>
            {rows.length === 0 ? (
              <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">{history.length === 0 ? 'No handovers yet.' : 'No handovers for this event.'}</div>
            ) : (
              <>
                {/* Desktop table */}
                <div className="hidden md:block rounded-xl border border-border bg-card overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/20">
                        {['Event', 'Amount', 'Date', 'Status', 'Reviewed by / Reason'].map((h) => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((h) => (
                        <tr key={h.id} className="border-b border-border last:border-0 hover:bg-muted/10 transition-colors">
                          <td className="px-4 py-3">{h.event?.name ?? '—'}</td>
                          <td className="px-4 py-3 font-semibold tabular-nums whitespace-nowrap">{fmt(h.amount)}</td>
                          <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{h.handoverDate}</td>
                          <td className="px-4 py-3">
                            <span className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold capitalize', STATUS[h.status].cls)}>
                              {STATUS[h.status].icon}{h.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">
                            {h.reviewedBy ? h.reviewedBy.name : '—'}
                            {h.status === 'rejected' && h.rejectReason ? ` · ${h.rejectReason}` : ''}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile cards */}
                <div className="flex flex-col gap-2 md:hidden">
                  {rows.map((h) => (
                    <div key={h.id} className="rounded-xl border border-border bg-card px-4 py-3 flex items-center gap-3">
                      <div className="size-9 rounded-full bg-brand-orange/10 border border-brand-orange/20 flex items-center justify-center shrink-0">
                        <Wallet className="size-4 text-brand-orange" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold tabular-nums">{fmt(h.amount)} <span className="font-normal text-xs text-muted-foreground">· {h.event?.name}</span></p>
                        <p className="text-xs text-muted-foreground">
                          {h.handoverDate} {h.reviewedBy ? `· by ${h.reviewedBy.name}` : ''}
                          {h.status === 'rejected' && h.rejectReason ? ` · ${h.rejectReason}` : ''}
                        </p>
                      </div>
                      <span className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold capitalize', STATUS[h.status].cls)}>
                        {STATUS[h.status].icon}{h.status}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
            </>
            )
            })()}
          </div>
        </>
      )}

      <HandoverDialog target={target} onOpenChange={(o) => { if (!o) setTarget(null) }} onDone={() => { setTarget(null); load() }} />
    </div>
  )
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: 'green' | 'amber' | 'navy' }) {
  const toneCls = tone === 'green' ? 'text-green-700' : tone === 'amber' ? 'text-amber-700' : tone === 'navy' ? 'text-brand-navy' : 'text-foreground'
  return (
    <div>
      <p className="text-[11px] text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className={cn('text-base font-bold tabular-nums', toneCls)}>{value}</p>
    </div>
  )
}

function HandoverDialog({ target, onOpenChange, onDone }: {
  target: HandoverSummary | null; onOpenChange: (o: boolean) => void; onDone: () => void
}) {
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState('')
  const [note, setNote] = useState('')
  const [receiverId, setReceiverId] = useState('')
  const [receivers, setReceivers] = useState<HandoverReceiver[]>([])
  const [loadingReceivers, setLoadingReceivers] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (target) {
      setAmount(target.available)
      setDate(new Date().toISOString().slice(0, 10))
      setNote('')
      setReceiverId('')
      setLoadingReceivers(true)
      getHandoverReceivers()
        .then(setReceivers)
        .catch(() => toast.error('Failed to load receivers.'))
        .finally(() => setLoadingReceivers(false))
    }
  }, [target])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!target) return
    if (!amount || !/^\d+(\.\d{1,2})?$/.test(amount)) { toast.error('Enter a valid amount'); return }
    if (!receiverId) { toast.error('Please select who you are handing over to'); return }
    setSaving(true)
    try {
      await createHandover({
        eventId: target.eventId,
        amount: Number(amount),
        handoverDate: date || null,
        note: note.trim() || null,
        handoverToId: Number(receiverId),
      })
      toast.success('Handover submitted. The recipient will be notified to confirm.')
      onDone()
    } catch (err) {
      toast.error((err as ApiError).message ?? 'Failed to submit handover.')
    } finally { setSaving(false) }
  }

  return (
    <Dialog open={!!target} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Hand Over Cash</DialogTitle></DialogHeader>
        {target && (
          <form onSubmit={submit} className="flex flex-col gap-4 pt-1">
            <p className="text-xs text-muted-foreground">{target.eventName} · available {fmt(target.available)}</p>

            <div className="flex flex-col gap-1.5">
              <Label>Hand over to <span className="text-destructive">*</span></Label>
              {loadingReceivers ? (
                <div className="h-9 rounded-lg border border-input bg-muted/30 animate-pulse" />
              ) : receivers.length === 0 ? (
                <p className="text-xs text-muted-foreground">No cashier or treasurer found for this organisation.</p>
              ) : (
                <select
                  required
                  value={receiverId}
                  onChange={e => setReceiverId(e.target.value)}
                  className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <option value="">Select recipient…</option>
                  {receivers.map(r => (
                    <option key={r.id} value={String(r.id)}>{r.name}</option>
                  ))}
                </select>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Amount <span className="text-destructive">*</span></Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                <Input className="pl-7" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Handover date</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Note</Label>
              <Textarea rows={2} placeholder="Optional" value={note} onChange={(e) => setNote(e.target.value)} />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={saving || receivers.length === 0} className="bg-brand-orange hover:bg-brand-orange/90 text-white">
                {saving && <Loader2 className="size-4 animate-spin mr-2" />}Submit
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
