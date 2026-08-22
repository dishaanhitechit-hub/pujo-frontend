'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { listPledges } from '@/lib/api/pledges'
import type { PaginatedPledges, ApiError } from '@/types'
import { RoleGuard } from '@/lib/auth/role-guard'
import { useAuth } from '@/lib/auth/auth-provider'
import { PageHeader } from '@/components/dashboard/PageHeader'
import { PledgeStatusBadge } from '@/components/shared/StatusBadge'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Plus, Filter } from 'lucide-react'

function fmt(v: string | number) {
  return `₹${Number(v).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
}

export default function PledgesPage() {
  return (
    <RoleGuard permission="payment.view_receipt">
      <PledgesContent />
    </RoleGuard>
  )
}

function PledgesContent() {
  const { user } = useAuth()
  const [data, setData] = useState<PaginatedPledges | null>(null)
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState<'open' | 'complete' | 'cancelled' | ''>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const reqRef = useRef(0)

  useEffect(() => {
    const req = ++reqRef.current
    setLoading(true)
    setError(null)
    listPledges({ page, status: status || undefined, perPage: 20 })
      .then((result) => {
        if (req !== reqRef.current) return
        setData(result)
      })
      .catch((err: ApiError) => {
        if (req !== reqRef.current) return
        setError(err.message ?? 'Failed to load pledges.')
      })
      .finally(() => {
        if (req !== reqRef.current) return
        setLoading(false)
      })
  }, [page, status])

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-8">
        <PageHeader title="Pledges" subtitle="Multi-installment donation commitments." />
        {user?.role !== 'admin' && (
          <Link href="/pledges/new">
            <Button className="bg-brand-orange hover:bg-brand-orange/90 text-white">
              <Plus className="size-4 mr-2" /> New Pledge
            </Button>
          </Link>
        )}
      </div>

      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <span className="text-xs font-medium text-muted-foreground flex items-center gap-1"><Filter className="size-3" /> Status:</span>
        {(['', 'open', 'complete', 'cancelled'] as const).map((s) => (
          <button key={s} onClick={() => { setStatus(s); setPage(1) }}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${status === s ? 'bg-brand-navy text-white' : 'bg-muted text-muted-foreground hover:bg-brand-navy/10 hover:text-brand-navy'}`}>
            {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {error ? (
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-6 text-sm text-destructive">{error}</div>
      ) : loading ? (
        <div className="flex flex-col gap-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
      ) : !data || data.pledges.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-border p-12 text-center">
          <p className="text-2xl mb-3">🤝</p>
          <p className="font-semibold text-foreground">No pledges found</p>
          <p className="text-sm text-muted-foreground mt-1">Create the first pledge to get started.</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-border bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/20">
                  {['Donor', 'Collector', 'Total', 'Paid', 'Outstanding', 'Status', 'Date', ''].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.pledges.map((p) => (
                  <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-5 py-3">
                      <p className="font-medium">{p.donor.name}</p>
                      {p.donor.phone && <p className="text-xs text-muted-foreground">{p.donor.phone}</p>}
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">{p.collector.name}</td>
                    <td className="px-5 py-3 font-semibold">{fmt(p.totalAmount)}</td>
                    <td className="px-5 py-3 text-green-700 font-medium">{fmt(p.paidAmount)}</td>
                    <td className="px-5 py-3 text-yellow-700 font-medium">{fmt(p.outstandingAmount)}</td>
                    <td className="px-5 py-3"><PledgeStatusBadge status={p.status} /></td>
                    <td className="px-5 py-3 text-xs text-muted-foreground">
                      {new Date(p.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-5 py-3">
                      <Link href={`/pledges/${p.id}`} className="text-xs text-brand-orange hover:underline font-medium">View</Link>
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
    </div>
  )
}
