'use client'

import { useEffect, useRef, useState } from 'react'
import { getDashboardPayments } from '@/lib/api/dashboard'
import type { PaginatedPayments, Payment, ApiError } from '@/types'
import { RoleGuard } from '@/lib/auth/role-guard'
import { PageHeader } from '@/components/dashboard/PageHeader'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { PaymentDetailDialog } from '@/components/shared/PaymentDetailDialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Filter } from 'lucide-react'
import { apiConfig } from '@/config/api'
import { DONOR_TYPES } from '@/constants'

function fmt(v: string | number) {
  return `₹${Number(v).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
}

export default function PaymentsPage() {
  return (
    <RoleGuard permission="dashboard.view">
      <PaymentsContent />
    </RoleGuard>
  )
}

function PaymentsContent() {
  const [data, setData] = useState<PaginatedPayments | null>(null)
  const [page, setPage] = useState(1)
  const [method, setMethod] = useState<'upi' | 'cash' | 'cheque' | ''>('')
  const [status, setStatus] = useState<'pending' | 'confirmed' | 'expired' | 'cancelled' | ''>('')
  const [donorType, setDonorType] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  // Stale-response guard: only the latest request's result updates state.
  const reqRef = useRef(0)

  useEffect(() => {
    const req = ++reqRef.current
    setLoading(true)
    setError(null)
    getDashboardPayments({
      page,
      method: method || undefined,
      status: status || undefined,
      donorType: donorType || undefined,
      perPage: 20,
    })
      .then((result) => {
        if (req !== reqRef.current) return
        setData(result)
      })
      .catch((err: ApiError) => {
        if (req !== reqRef.current) return
        setError(err.message ?? 'Failed to load payments.')
      })
      .finally(() => {
        if (req !== reqRef.current) return
        setLoading(false)
      })
  }, [page, method, status, donorType])

  return (
    <div className="p-6 lg:p-8">
      <PageHeader title="All Payments" subtitle="Full payment ledger across all collectors." className="mb-8" />

      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <span className="text-xs font-medium text-muted-foreground flex items-center gap-1"><Filter className="size-3" /> Method:</span>
        {(['', 'upi', 'cash', 'cheque'] as const).map((m) => (
          <button key={m} onClick={() => { setMethod(m); setPage(1) }}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${method === m ? 'bg-brand-orange text-white' : 'bg-muted text-muted-foreground hover:bg-brand-orange/10 hover:text-brand-orange'}`}>
            {m === '' ? 'All' : m.toUpperCase()}
          </button>
        ))}
        <span className="text-xs font-medium text-muted-foreground ml-3">Status:</span>
        {(['', 'pending', 'confirmed', 'expired', 'cancelled'] as const).map((s) => (
          <button key={s} onClick={() => { setStatus(s); setPage(1) }}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${status === s ? 'bg-brand-navy text-white' : 'bg-muted text-muted-foreground hover:bg-brand-navy/10 hover:text-brand-navy'}`}>
            {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
        <span className="text-xs font-medium text-muted-foreground ml-3">Type:</span>
        <select
          value={donorType}
          onChange={(e) => { setDonorType(e.target.value); setPage(1) }}
          className="h-7 rounded-full border border-border bg-muted px-3 text-xs font-semibold text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">All Types</option>
          {DONOR_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

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
                  {['Donor', 'Type', 'Collector', 'Amount', 'Method', 'Status', 'Date', 'Receipt'].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.payments.map((p) => (
                  <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-5 py-3">
                      <button
                        onClick={() => setSelectedPayment(p)}
                        className="font-medium text-left hover:text-brand-orange transition-colors cursor-pointer"
                      >
                        {p.donor.name}
                      </button>
                    </td>
                    <td className="px-5 py-3 text-xs text-muted-foreground">{p.donor.donorType ?? <span className="text-muted-foreground/40">Not specified</span>}</td>
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
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}><ChevronLeft className="size-4" /></Button>
                <Button variant="outline" size="sm" disabled={page >= data.pages} onClick={() => setPage(p => p + 1)}><ChevronRight className="size-4" /></Button>
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
