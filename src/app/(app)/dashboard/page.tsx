'use client'

import { useEffect, useRef, useState } from 'react'
import { getDashboardSummary, getDashboardCollectors, getDashboardPayments } from '@/lib/api/dashboard'
import type { DashboardSummary, CollectorBreakdown, PaginatedPayments, Payment } from '@/types'
import { RoleGuard } from '@/lib/auth/role-guard'
import { StatCard } from '@/components/dashboard/StatCard'
import { PageHeader } from '@/components/dashboard/PageHeader'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { PaymentDetailDialog } from '@/components/shared/PaymentDetailDialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { IndianRupee, Smartphone, Banknote, CheckCircle2, Clock, Users, ChevronLeft, ChevronRight, FileText, TrendingUp } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { apiConfig } from '@/config/api'
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
  const [payments, setPayments] = useState<PaginatedPayments | null>(null)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const reqRef = useRef(0)

  useEffect(() => {
    const req = ++reqRef.current
    setLoading(true)
    setError(null)
    Promise.all([
      getDashboardSummary(),
      getDashboardCollectors(),
      getDashboardPayments({ page, perPage: 10 }),
    ])
      .then(([s, c, p]) => {
        if (req !== reqRef.current) return
        setSummary(s)
        setCollectors(c)
        setPayments(p)
      })
      .catch((err: ApiError) => {
        if (req !== reqRef.current) return
        setError(err.message ?? 'Failed to load dashboard.')
      })
      .finally(() => {
        if (req !== reqRef.current) return
        setLoading(false)
      })
  }, [page])

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

      {/* Summary */}
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
            <StatCard label="Confirmed" value={summary.confirmedCount} icon={CheckCircle2} variant="success" />
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Collector chart */}
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

        {/* Collector breakdown */}
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
                    <th className="pb-2 text-right text-muted-foreground font-semibold hidden sm:table-cell">Confirmed</th>
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

      {/* Recent Payments */}
      <div className="rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="font-semibold text-sm">Recent Payments</h2>
        </div>

        {loading ? (
          <div className="p-4 flex flex-col gap-3">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14" />)}
          </div>
        ) : !payments || payments.payments.length === 0 ? (
          <div className="p-12 text-center text-sm text-muted-foreground">No payments yet.</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/20">
                    <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Donor</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Collector</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Amount</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Method</th>
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
                        <p className="text-xs text-muted-foreground/60">{p.donor.donorType ?? 'Not specified'}</p>
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
      </div>

      <PaymentDetailDialog
        payment={selectedPayment}
        open={!!selectedPayment}
        onOpenChange={(o) => { if (!o) setSelectedPayment(null) }}
      />
    </div>
  )
}
