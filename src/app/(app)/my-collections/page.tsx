'use client'

import { useEffect, useRef, useState } from 'react'
import { getCollectorSummary, getCollectorPayments } from '@/lib/api/collector'
import type { CollectorSummary, PaginatedPayments, Payment } from '@/types'
import { StatCard } from '@/components/dashboard/StatCard'
import { PageHeader } from '@/components/dashboard/PageHeader'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { PaymentDetailDialog } from '@/components/shared/PaymentDetailDialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { IndianRupee, Banknote, Smartphone, CheckCircle2, ChevronLeft, ChevronRight, Filter } from 'lucide-react'
import { apiConfig } from '@/config/api'
import { DONOR_TYPES } from '@/constants'
import type { ApiError } from '@/types'
import { RoleGuard } from '@/lib/auth/role-guard'

function formatCurrency(val: string | number) {
  return `₹${Number(val).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
}

export default function MyCollectionsPage() {
  return (
    <RoleGuard permission="collector.view_own">
      <MyCollectionsContent />
    </RoleGuard>
  )
}

function MyCollectionsContent() {
  const [summary, setSummary] = useState<CollectorSummary | null>(null)
  const [payments, setPayments] = useState<PaginatedPayments | null>(null)
  const [page, setPage] = useState(1)
  const [method, setMethod] = useState<'upi' | 'cash' | 'cheque' | ''>('')
  const [donorType, setDonorType] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const reqRef = useRef(0)

  useEffect(() => {
    const req = ++reqRef.current
    setLoading(true)
    setError(null)
    Promise.all([
      getCollectorSummary(),
      getCollectorPayments({ page, method: method || undefined, donorType: donorType || undefined, perPage: 20 }),
    ])
      .then(([s, p]) => {
        if (req !== reqRef.current) return
        setSummary(s)
        setPayments(p)
      })
      .catch((err: ApiError) => {
        if (req !== reqRef.current) return
        setError(err.message ?? 'Failed to load data.')
      })
      .finally(() => {
        if (req !== reqRef.current) return
        setLoading(false)
      })
  }, [page, method, donorType])

  return (
    <div className="p-6 lg:p-8">
      <PageHeader title="My Collections" subtitle="Your personal collection summary and payment history." className="mb-8" />

      {/* Summary stats */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      ) : summary ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard label="Grand Total" value={formatCurrency(summary.grandTotal)} icon={IndianRupee} variant="primary" />
          <StatCard label="UPI Collections" value={formatCurrency(summary.upiTotal)} icon={Smartphone} />
          <StatCard label="Cash Collections" value={formatCurrency(summary.cashTotal)} icon={Banknote} />
          <StatCard label="Confirmed Payments" value={summary.confirmedCount} icon={CheckCircle2} variant="success" />
        </div>
      ) : null}

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <span className="text-xs font-medium text-muted-foreground flex items-center gap-1"><Filter className="size-3" /> Method:</span>
        {(['', 'upi', 'cash', 'cheque'] as const).map((m) => (
          <button
            key={m}
            onClick={() => { setMethod(m); setPage(1) }}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
              method === m
                ? 'bg-brand-orange text-white'
                : 'bg-muted text-muted-foreground hover:bg-brand-orange/10 hover:text-brand-orange'
            }`}
          >
            {m === '' ? 'All' : m.toUpperCase()}
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

      {/* Payments table */}
      {error ? (
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-6 text-sm text-destructive">{error}</div>
      ) : loading ? (
        <div className="flex flex-col gap-3">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
        </div>
      ) : !payments || payments.payments.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-border p-12 text-center">
          <p className="text-2xl mb-3">📋</p>
          <p className="font-semibold text-foreground">No payments found</p>
          <p className="text-sm text-muted-foreground mt-1">
            {method ? `No ${method.toUpperCase()} payments recorded yet.` : 'No payments recorded yet.'}
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-border bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Donor</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Method</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Receipt</th>
                </tr>
              </thead>
              <tbody>
                {payments.payments.map((p) => (
                  <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setSelectedPayment(p)}
                        className="font-medium text-foreground text-left hover:text-brand-orange transition-colors cursor-pointer"
                      >
                        {p.donor.name}
                      </button>
                      {p.donor.phone && <p className="text-xs text-muted-foreground">{p.donor.phone}</p>}
                      <p className="text-xs text-muted-foreground/60">{p.donor.donorType ?? 'Not specified'}</p>
                    </td>
                    <td className="px-4 py-3 font-semibold text-foreground">{formatCurrency(p.amount)}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-bold uppercase">{p.method}</span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {new Date(p.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3">
                      {p.receiptNo ? (
                        <a
                          href={`${apiConfig.baseUrl}${apiConfig.backendPages.payReceipt(p.id)}?from=my-collections`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-brand-orange hover:underline font-medium"
                        >
                          {p.receiptNo}
                        </a>
                      ) : (
                        <span className="text-xs text-muted-foreground/50">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {payments.pages > 1 && (
            <div className="flex items-center justify-between mt-5">
              <p className="text-xs text-muted-foreground">
                Page {payments.page} of {payments.pages} · {payments.total} total
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
