'use client'

import { use, useEffect, useState } from 'react'
import { getDonor } from '@/lib/api/donors'
import type { DonorDetail, ApiError } from '@/types'
import { RoleGuard } from '@/lib/auth/role-guard'
import { PageHeader } from '@/components/dashboard/PageHeader'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Skeleton } from '@/components/ui/skeleton'
import { apiConfig } from '@/config/api'

function fmt(v: string | number) {
  return `₹${Number(v).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
}

export default function DonorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <RoleGuard permission="dashboard.view">
      <DonorDetailContent params={params} />
    </RoleGuard>
  )
}

function DonorDetailContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [detail, setDetail] = useState<DonorDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getDonor(Number(id))
      .then(setDetail)
      .catch((err: ApiError) => setError(err.message ?? 'Failed to load donor.'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="p-6 lg:p-8 flex flex-col gap-4">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
  if (error) return <div className="p-6 lg:p-8"><div className="rounded-xl border border-destructive/20 bg-destructive/5 p-6 text-sm text-destructive">{error}</div></div>
  if (!detail) return null

  const { donor, payments } = detail

  return (
    <div className="p-6 lg:p-8 max-w-3xl flex flex-col gap-6">
      <PageHeader title={donor.name} subtitle={`Donor profile — ${donor.donorType ?? 'Type not specified'}`} />

      <div className="rounded-xl border border-border bg-card p-5 grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
        <div><p className="text-muted-foreground text-xs mb-1">Phone</p><p className="font-medium">{donor.phone ?? '—'}</p></div>
        <div><p className="text-muted-foreground text-xs mb-1">Address</p><p className="font-medium">{donor.address ?? '—'}</p></div>
        <div><p className="text-muted-foreground text-xs mb-1">Donor Type</p><p className="font-medium">{donor.donorType ?? '—'}</p></div>
        <div><p className="text-muted-foreground text-xs mb-1">Total Donated</p><p className="font-semibold text-lg">{fmt(donor.totalDonated)}</p></div>
        <div><p className="text-muted-foreground text-xs mb-1">Completed Payments</p><p className="font-semibold text-lg">{donor.confirmedCount}</p></div>
        <div><p className="text-muted-foreground text-xs mb-1">Last Donation</p><p className="font-medium">{donor.lastDonatedAt ? new Date(donor.lastDonatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}</p></div>
        {donor.notes && <div className="col-span-3"><p className="text-muted-foreground text-xs mb-1">Notes</p><p className="font-medium">{donor.notes}</p></div>}
      </div>

      <div className="rounded-xl border border-border bg-card">
        <div className="p-5 border-b border-border">
          <h2 className="font-semibold text-sm">Payment History</h2>
        </div>
        {payments.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">No payments found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/20">
                  {['Receipt', 'Event', 'Amount', 'Mode', 'Collector', 'Status', 'Date'].map((h) => (
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
                    <td className="px-5 py-3 text-xs text-muted-foreground">{p.event?.name ?? <span className="text-muted-foreground/40">—</span>}</td>
                    <td className="px-5 py-3 font-semibold">{fmt(p.amount)}</td>
                    <td className="px-5 py-3 text-xs font-bold uppercase">{p.method}</td>
                    <td className="px-5 py-3 text-muted-foreground">{p.collector.name}</td>
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
    </div>
  )
}
