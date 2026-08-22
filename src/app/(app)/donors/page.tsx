'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { listDonors } from '@/lib/api/donors'
import type { PaginatedDonors, ApiError } from '@/types'
import { RoleGuard } from '@/lib/auth/role-guard'
import { PageHeader } from '@/components/dashboard/PageHeader'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ChevronLeft, ChevronRight, Search } from 'lucide-react'
import { DONOR_TYPES } from '@/constants'

function fmt(v: string | number) {
  return `₹${Number(v).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
}

export default function DonorsPage() {
  return (
    <RoleGuard permission="dashboard.view">
      <DonorsContent />
    </RoleGuard>
  )
}

function DonorsContent() {
  const [data, setData] = useState<PaginatedDonors | null>(null)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [donorType, setDonorType] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const reqRef = useRef(0)

  useEffect(() => {
    const req = ++reqRef.current
    setLoading(true)
    setError(null)
    listDonors({ page, search: search || undefined, donorType: donorType || undefined, perPage: 20 })
      .then((result) => {
        if (req !== reqRef.current) return
        setData(result)
      })
      .catch((err: ApiError) => {
        if (req !== reqRef.current) return
        setError(err.message ?? 'Failed to load donors.')
      })
      .finally(() => {
        if (req !== reqRef.current) return
        setLoading(false)
      })
  }, [page, search, donorType])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setSearch(searchInput)
    setPage(1)
  }

  return (
    <div className="p-6 lg:p-8">
      <PageHeader title="Donors" subtitle="All donor records with confirmed payment statistics." className="mb-8" />

      <div className="flex flex-wrap gap-3 mb-5 items-center">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search name or phone…"
              className="pl-8 h-8 w-52 text-sm"
            />
          </div>
          <Button type="submit" size="sm" variant="outline">Search</Button>
          {search && (
            <Button type="button" size="sm" variant="ghost" onClick={() => { setSearch(''); setSearchInput(''); setPage(1) }}>
              Clear
            </Button>
          )}
        </form>
        <select
          value={donorType}
          onChange={(e) => { setDonorType(e.target.value); setPage(1) }}
          className="h-8 rounded-md border border-border bg-muted px-3 text-xs font-semibold text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">All Types</option>
          {DONOR_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {error ? (
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-6 text-sm text-destructive">{error}</div>
      ) : loading ? (
        <div className="flex flex-col gap-3">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}</div>
      ) : !data || data.donors.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-border p-12 text-center">
          <p className="text-2xl mb-3">👤</p>
          <p className="font-semibold text-foreground">No donors found</p>
          <p className="text-sm text-muted-foreground mt-1">Donors appear here after their first payment is collected.</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-border bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/20">
                  {['Donor', 'Type', 'Total Donated', 'Confirmed', 'Last Donation', ''].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.donors.map((d) => (
                  <tr key={d.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-5 py-3">
                      <p className="font-medium">{d.name}</p>
                      {d.phone && <p className="text-xs text-muted-foreground">{d.phone}</p>}
                    </td>
                    <td className="px-5 py-3 text-xs text-muted-foreground">{d.donorType ?? '—'}</td>
                    <td className="px-5 py-3 font-semibold">{fmt(d.totalDonated)}</td>
                    <td className="px-5 py-3 text-muted-foreground">{d.confirmedCount}</td>
                    <td className="px-5 py-3 text-xs text-muted-foreground">
                      {d.lastDonatedAt ? new Date(d.lastDonatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                    </td>
                    <td className="px-5 py-3">
                      <Link href={`/donors/${d.id}`} className="text-xs text-brand-orange hover:underline font-medium">View</Link>
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
