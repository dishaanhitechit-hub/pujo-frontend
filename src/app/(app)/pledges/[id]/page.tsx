'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { getPledge, payPledgeInstallment, cancelPledge } from '@/lib/api/pledges'
import type { PledgeDetail, ApiError } from '@/types'
import { RoleGuard } from '@/lib/auth/role-guard'
import { PageHeader } from '@/components/dashboard/PageHeader'
import { PledgeStatusBadge, StatusBadge } from '@/components/shared/StatusBadge'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { ShieldAlert } from 'lucide-react'
import { apiConfig } from '@/config/api'
import { useAuth } from '@/lib/auth/auth-provider'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'

function fmt(v: string | number) {
  return `₹${Number(v).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
}

export default function PledgeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <RoleGuard permission="payment.view_receipt">
      <PledgeDetailContent params={params} />
    </RoleGuard>
  )
}

function PledgeDetailContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { user } = useAuth()
  const router = useRouter()
  const [detail, setDetail] = useState<PledgeDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [forbidden, setForbidden] = useState(false)
  const [payAmount, setPayAmount] = useState('')
  const [payMethod, setPayMethod] = useState<'cash' | 'upi' | 'cheque'>('cash')
  const [paying, setPaying] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false)

  function load() {
    setLoading(true)
    setForbidden(false)
    getPledge(Number(id))
      .then(setDetail)
      .catch((err: ApiError) => {
        if (err.status === 403) {
          setForbidden(true)
        } else {
          setError(err.message ?? 'Failed to load pledge.')
        }
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [id])

  async function handlePay() {
    if (!payAmount) return
    setPaying(true)
    try {
      const result = await payPledgeInstallment(Number(id), { amount: payAmount, method: payMethod })
      toast.success('Installment initiated — redirecting to payment page.')
      window.location.href = `${apiConfig.baseUrl}${result.nextUrl}`
    } catch (err) {
      const apiErr = err as ApiError
      toast.error(apiErr?.message ?? 'Failed to initiate payment.')
      setPaying(false)
    }
  }

  async function handleCancel() {
    setCancelling(true)
    try {
      await cancelPledge(Number(id))
      toast.success('Pledge cancelled.')
      router.push('/pledges')
    } catch (err) {
      const apiErr = err as ApiError
      toast.error(apiErr?.message ?? 'Failed to cancel pledge.')
      setCancelling(false)
    }
  }

  if (loading) return <div className="p-6 lg:p-8 flex flex-col gap-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
  if (forbidden) return (
    <div className="p-6 lg:p-8">
      <div className="rounded-xl border border-border bg-card p-10 flex flex-col items-center gap-3 text-center max-w-sm">
        <ShieldAlert className="size-10 text-muted-foreground" />
        <p className="font-semibold text-foreground">Access Denied</p>
        <p className="text-sm text-muted-foreground">This pledge belongs to another collector.</p>
        <Button variant="outline" size="sm" onClick={() => router.push('/pledges')} className="mt-2">Back to Pledges</Button>
      </div>
    </div>
  )
  if (error) return <div className="p-6 lg:p-8"><div className="rounded-xl border border-destructive/20 bg-destructive/5 p-6 text-sm text-destructive">{error}</div></div>
  if (!detail) return null

  const { pledge, payments } = detail
  const canManage = user?.role === 'admin'
  const canPay = pledge.status === 'open' && user?.role !== 'admin'

  return (
    <div className="p-6 lg:p-8 max-w-3xl flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <PageHeader title={`Pledge #${pledge.id}`} subtitle={`Created ${new Date(pledge.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`} />
        <PledgeStatusBadge status={pledge.status} />
      </div>

      {/* Pledge summary */}
      <div className="rounded-xl border border-border bg-card p-5 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
        <div><p className="text-muted-foreground text-xs mb-1">Donor</p><p className="font-semibold">{pledge.donor.name}</p>{pledge.donor.phone && <p className="text-xs text-muted-foreground">{pledge.donor.phone}</p>}</div>
        <div><p className="text-muted-foreground text-xs mb-1">Collector</p><p className="font-semibold">{pledge.collector.name}</p></div>
        <div><p className="text-muted-foreground text-xs mb-1">Total Pledged</p><p className="font-semibold text-lg">{fmt(pledge.totalAmount)}</p></div>
        <div><p className="text-muted-foreground text-xs mb-1">Outstanding</p><p className="font-semibold text-lg text-yellow-700">{fmt(pledge.outstandingAmount)}</p></div>
        <div><p className="text-muted-foreground text-xs mb-1">Paid</p><p className="font-semibold text-green-700">{fmt(pledge.paidAmount)}</p></div>
        <div className="col-span-3"><p className="text-muted-foreground text-xs mb-1">Notes</p><p className="text-foreground">{pledge.notes ?? '—'}</p></div>
      </div>

      {/* Pay installment */}
      {canPay && (
        <div className="rounded-xl border border-border bg-card p-5 flex flex-col gap-4">
          <h2 className="font-semibold text-sm">Record Installment</h2>
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="payAmount">Amount (max {fmt(pledge.outstandingAmount)})</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">₹</span>
                <Input id="payAmount" className="pl-7 w-40" type="text" inputMode="decimal" placeholder="5000.00" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="payMethod">Method</Label>
              <select id="payMethod" value={payMethod} onChange={(e) => setPayMethod(e.target.value as 'cash' | 'upi' | 'cheque')}
                className="h-10 rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="cash">Cash</option>
                <option value="upi">UPI</option>
                <option value="cheque">Cheque</option>
              </select>
            </div>
            <Button onClick={handlePay} disabled={paying || !payAmount} className="bg-brand-orange hover:bg-brand-orange/90 text-white">
              {paying ? 'Processing…' : 'Pay Installment'}
            </Button>
          </div>
        </div>
      )}

      {/* Installment history */}
      <div className="rounded-xl border border-border bg-card">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <h2 className="font-semibold text-sm">Installment History</h2>
          {canManage && pledge.status === 'open' && (
            <Button variant="outline" size="sm" onClick={() => setCancelConfirmOpen(true)} disabled={cancelling} className="text-destructive border-destructive/30 hover:bg-destructive/5">
              {cancelling ? 'Cancelling…' : 'Cancel Pledge'}
            </Button>
          )}
        </div>
        {payments.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">No installments recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/20">
                  {['Receipt', 'Amount', 'Method', 'Status', 'Date'].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                    <td className="px-5 py-3">
                      {p.receiptNo ? (
                        <a href={`${apiConfig.baseUrl}${apiConfig.backendPages.payReceipt(p.id)}?from=dashboard`} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-brand-orange hover:underline font-medium">{p.receiptNo}</a>
                      ) : <span className="text-muted-foreground/50 text-xs">—</span>}
                    </td>
                    <td className="px-5 py-3 font-semibold">{fmt(p.amount)}</td>
                    <td className="px-5 py-3 text-xs font-bold uppercase">{p.method}</td>
                    <td className="px-5 py-3"><StatusBadge status={p.status} /></td>
                    <td className="px-5 py-3 text-xs text-muted-foreground">
                      {new Date(p.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={cancelConfirmOpen}
        onOpenChange={setCancelConfirmOpen}
        title="Cancel Pledge"
        description="This will permanently cancel the pledge and no further installments can be collected. This cannot be undone."
        confirmLabel="Yes, cancel pledge"
        cancelLabel="Keep pledge"
        onConfirm={handleCancel}
      />
    </div>
  )
}
