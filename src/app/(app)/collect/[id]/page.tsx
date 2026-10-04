'use client'

import { use, useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import {
  Loader2, ArrowLeft, IndianRupee, QrCode, PlusCircle, CheckCircle2, XCircle,
  RotateCcw, CalendarDays, Receipt,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PageHeader } from '@/components/dashboard/PageHeader'
import { RoleGuard } from '@/lib/auth/role-guard'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { Skeleton } from '@/components/ui/skeleton'
import { apiConfig } from '@/config/api'
import {
  getSlip, addSlipPayment, closeSlip, reopenSlip, cancelSlip, initiateSlipPayment,
} from '@/lib/api/slips'
import { cn } from '@/lib/utils'
import type { ApiError, ContributionSlip, PaymentMethod } from '@/types'

export default function SlipDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  return (
    <RoleGuard requireCanCollect>
      <SlipDetail slipId={Number(id)} />
    </RoleGuard>
  )
}

const STATUS_STYLES: Record<string, string> = {
  open:      'bg-blue-50 text-blue-700 border-blue-200',
  closed:    'bg-green-50 text-green-700 border-green-200',
  cancelled: 'bg-slate-100 text-slate-500 border-slate-200',
}

function fmt(v: string | number) {
  return `₹${Number(v).toLocaleString('en-IN', { minimumFractionDigits: 0 })}`
}
function fmtDate(v: string | null) {
  if (!v) return '—'
  return new Date(v.length === 10 ? v + 'T12:00:00' : v).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function SlipDetail({ slipId }: { slipId: number }) {
  const [slip, setSlip] = useState<ContributionSlip | null>(null)
  const [loading, setLoading] = useState(true)
  const [manualOpen, setManualOpen] = useState(false)
  const [onlineOpen, setOnlineOpen] = useState(false)
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try { setSlip(await getSlip(slipId)) }
    catch { toast.error('Failed to load slip.') }
    finally { setLoading(false) }
  }, [slipId])

  useEffect(() => { load() }, [load])

  async function doClose() {
    setBusy(true)
    try { setSlip(await closeSlip(slipId)); toast.success('Slip closed.') }
    catch (e) { toast.error((e as ApiError).message ?? 'Failed.') }
    finally { setBusy(false) }
  }
  async function doReopen() {
    setBusy(true)
    try { setSlip(await reopenSlip(slipId)); toast.success('Slip reopened.') }
    catch (e) { toast.error((e as ApiError).message ?? 'Failed.') }
    finally { setBusy(false) }
  }
  async function doCancel() {
    setBusy(true)
    try { setSlip(await cancelSlip(slipId)); toast.success('Slip cancelled.'); setConfirmCancel(false) }
    catch (e) { toast.error((e as ApiError).message ?? 'Failed.') }
    finally { setBusy(false) }
  }

  if (loading) return <div className="p-4 sm:p-6 lg:p-8 max-w-3xl"><Skeleton className="h-64 rounded-xl" /></div>
  if (!slip) return <div className="p-8 text-sm text-muted-foreground">Slip not found.</div>

  const donorName = slip.donorKind === 'member' ? (slip.memberName ?? slip.donor?.name) : slip.donor?.name
  const pct = Math.min(100, Math.round((Number(slip.paidAmount) / Number(slip.totalAmount)) * 100))
  const isOpen = slip.status === 'open'
  const writtenOff = slip.status === 'closed' && Number(slip.outstanding) > 0

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl flex flex-col gap-5">
      <Link href="/my-collections" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> My Collections
      </Link>

      <PageHeader title={slip.slipNumber} subtitle={slip.event?.name ?? undefined}>
        <span className={cn('inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize', STATUS_STYLES[slip.status])}>
          {slip.status}
        </span>
      </PageHeader>

      {/* Donor + progress */}
      <div className="rounded-xl border border-border bg-card p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <p className="text-sm font-semibold">{donorName ?? '—'}</p>
            <p className="text-xs text-muted-foreground">
              {slip.donorKind === 'member' ? 'Member' : (slip.donor?.donorType ?? 'Other')}
              {slip.donor?.phone ? ` · ${slip.donor.phone}` : ''}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Outstanding</p>
            {writtenOff ? (
              <p className="text-lg font-bold tabular-nums">
                <span className="line-through text-muted-foreground/60 font-normal text-base mr-1.5">{fmt(slip.outstanding)}</span>
                <span className="text-green-700">₹0</span>
              </p>
            ) : (
              <p className="text-lg font-bold tabular-nums text-brand-navy">{fmt(slip.outstanding)}</p>
            )}
          </div>
        </div>
        <div>
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>Paid {fmt(slip.paidAmount)}</span>
            <span>of {fmt(slip.totalAmount)}</span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden flex">
            <div className={cn('h-full', pct >= 100 ? 'bg-green-600' : 'bg-brand-orange')} style={{ width: `${pct}%` }} />
            {writtenOff && <div className="h-full bg-muted-foreground/25 bg-[repeating-linear-gradient(45deg,transparent,transparent_4px,rgba(0,0,0,0.08)_4px,rgba(0,0,0,0.08)_8px)]" style={{ width: `${100 - pct}%` }} />}
          </div>
          {writtenOff && (
            <p className="text-xs text-muted-foreground mt-1.5">
              {fmt(slip.outstanding)} unpaid was <span className="font-medium">written off</span> when the slip was closed. Reopen to collect it.
            </p>
          )}
        </div>

        {/* Actions */}
        {isOpen && (
          <div className="flex flex-wrap gap-2 pt-1">
            <Button onClick={() => setOnlineOpen(true)} className="bg-brand-orange hover:bg-brand-orange/90 text-white">
              <QrCode className="size-4 mr-1.5" /> Collect via QR / Online
            </Button>
            <Button variant="outline" onClick={() => setManualOpen(true)}>
              <PlusCircle className="size-4 mr-1.5" /> Record Payment
            </Button>
            <Button variant="outline" onClick={doClose} disabled={busy}>
              <CheckCircle2 className="size-4 mr-1.5" /> Close Slip
            </Button>
            <Button variant="outline" className="text-destructive border-destructive/20 hover:bg-destructive/5" onClick={() => setConfirmCancel(true)}>
              <XCircle className="size-4 mr-1.5" /> Cancel
            </Button>
          </div>
        )}
        {slip.status === 'closed' && (
          <div className="pt-1">
            <Button variant="outline" onClick={doReopen} disabled={busy}>
              <RotateCcw className="size-4 mr-1.5" /> Reopen Slip
            </Button>
          </div>
        )}
      </div>

      {/* Payment history */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-5 py-3 border-b border-border flex items-center gap-2">
          <Receipt className="size-4 text-brand-orange" />
          <h3 className="font-semibold text-sm">Payments ({slip.payments?.length ?? 0})</h3>
        </div>
        {(slip.payments?.length ?? 0) === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">No payments recorded yet.</p>
        ) : (
          <div className="divide-y divide-border">
            {slip.payments!.map((p) => (
              <div key={p.id} className="flex items-center gap-3 px-5 py-3">
                <div className="size-9 rounded-full bg-green-50 border border-green-200 flex items-center justify-center shrink-0">
                  <IndianRupee className="size-4 text-green-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium tabular-nums">{fmt(p.amount)} <span className="uppercase text-xs text-muted-foreground font-normal">{p.method}</span></p>
                  <p className="text-xs text-muted-foreground">
                    {p.receiptNo ? `${p.receiptNo} · ` : ''}{fmtDate(p.receivedDate ?? p.createdAt)}
                    {p.status === 'pending' ? ' · pending' : ''}
                  </p>
                </div>
                {p.status !== 'pending' && (
                  <a href={`${apiConfig.baseUrl}/pay/receipt/${p.id}?from=my-collections`} target="_blank" rel="noopener noreferrer"
                    className="text-xs text-brand-orange hover:underline shrink-0">Receipt</a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <ManualPaymentDialog open={manualOpen} onOpenChange={setManualOpen} slipId={slipId} outstanding={slip.outstanding} onDone={load} />
      <OnlinePaymentDialog open={onlineOpen} onOpenChange={setOnlineOpen} slipId={slipId} outstanding={slip.outstanding} />
      <ConfirmDialog open={confirmCancel} onOpenChange={setConfirmCancel}
        title="Cancel this slip?" description="The slip will be marked cancelled. Recorded payments stay on record."
        confirmLabel="Cancel Slip" variant="destructive" onConfirm={doCancel} />
    </div>
  )
}

const METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'cash', label: 'Cash' }, { value: 'upi', label: 'UPI' }, { value: 'cheque', label: 'Cheque' },
]

function ManualPaymentDialog({ open, onOpenChange, slipId, outstanding, onDone }: {
  open: boolean; onOpenChange: (o: boolean) => void; slipId: number; outstanding: string; onDone: () => void
}) {
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState<PaymentMethod>('cash')
  const [date, setDate] = useState('')
  const [utr, setUtr] = useState('')
  const [chequeNo, setChequeNo] = useState('')
  const [bank, setBank] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) { setAmount(outstanding); setMethod('cash'); setDate(new Date().toISOString().slice(0, 10)); setUtr(''); setChequeNo(''); setBank('') }
  }, [open, outstanding])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!amount || !/^\d+(\.\d{1,2})?$/.test(amount)) { toast.error('Enter a valid amount'); return }
    setSaving(true)
    try {
      await addSlipPayment(slipId, {
        amount: Number(amount), method, receivedDate: date || null,
        utrNumber: method === 'upi' ? (utr.trim() || null) : null,
        chequeNumber: method === 'cheque' ? (chequeNo.trim() || null) : null,
        bankName: method === 'cheque' ? (bank.trim() || null) : null,
      })
      toast.success('Payment recorded.')
      onOpenChange(false)
      onDone()
    } catch (err) {
      toast.error((err as ApiError).message ?? 'Failed to record payment.')
    } finally { setSaving(false) }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Record Payment</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="flex flex-col gap-4 pt-1">
          <div className="flex flex-col gap-1.5">
            <Label>Amount <span className="text-destructive">*</span></Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
              <Input className="pl-7" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
            <p className="text-xs text-muted-foreground">Outstanding: {fmt(outstanding)}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Method</Label>
              <Select value={method} onValueChange={(v) => setMethod(v as PaymentMethod)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent position="popper">
                  {METHODS.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Received date</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>
          {method === 'upi' && (
            <div className="flex flex-col gap-1.5">
              <Label>UTR / Ref (optional)</Label>
              <Input value={utr} onChange={(e) => setUtr(e.target.value)} />
            </div>
          )}
          {method === 'cheque' && (
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5"><Label>Cheque no.</Label><Input value={chequeNo} onChange={(e) => setChequeNo(e.target.value)} /></div>
              <div className="flex flex-col gap-1.5"><Label>Bank</Label><Input value={bank} onChange={(e) => setBank(e.target.value)} /></div>
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={saving} className="bg-brand-orange hover:bg-brand-orange/90 text-white">
              {saving && <Loader2 className="size-4 animate-spin mr-2" />}Record
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function OnlinePaymentDialog({ open, onOpenChange, slipId, outstanding }: {
  open: boolean; onOpenChange: (o: boolean) => void; slipId: number; outstanding: string
}) {
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState<PaymentMethod>('upi')
  const [saving, setSaving] = useState(false)

  useEffect(() => { if (open) { setAmount(outstanding); setMethod('upi') } }, [open, outstanding])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!amount || !/^\d+(\.\d{1,2})?$/.test(amount)) { toast.error('Enter a valid amount'); return }
    setSaving(true)
    try {
      const r = await initiateSlipPayment({ slipId, amount, method })
      window.location.href = `${apiConfig.baseUrl}${r.nextUrl}`
    } catch (err) {
      toast.error((err as ApiError).message ?? 'Failed to start payment.')
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Collect via QR / Online</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="flex flex-col gap-4 pt-1">
          <div className="flex flex-col gap-1.5">
            <Label>Amount <span className="text-destructive">*</span></Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
              <Input className="pl-7" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
            <p className="text-xs text-muted-foreground">Outstanding: {fmt(outstanding)}</p>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Method</Label>
            <Select value={method} onValueChange={(v) => setMethod(v as PaymentMethod)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent position="popper">
                {METHODS.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">You'll go to the payment page (QR for UPI) to complete and confirm.</p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={saving} className="bg-brand-orange hover:bg-brand-orange/90 text-white">
              {saving && <Loader2 className="size-4 animate-spin mr-2" />}Continue
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
