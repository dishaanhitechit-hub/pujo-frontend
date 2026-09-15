'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth/auth-provider'
import { apiConfig } from '@/config/api'
import {
  Loader2, CheckCircle2, Clock, XCircle, IndianRupee,
  ChevronRight, ImageIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { ContributionList, ContributionStats, Contribution, ApiError } from '@/types'

const BASE = apiConfig.baseUrl

function statusBadge(status: Contribution['status']) {
  if (status === 'approved') return <Badge className="bg-green-100 text-green-700 border-green-200">Approved</Badge>
  if (status === 'rejected') return <Badge className="bg-red-100 text-red-700 border-red-200">Rejected</Badge>
  return <Badge className="bg-amber-100 text-amber-700 border-amber-200">Pending</Badge>
}

function methodLabel(m: string) {
  if (m === 'upi') return 'UPI'
  if (m === 'bank_transfer') return 'Bank Transfer'
  return 'Cash'
}

function fmtDate(d: string) {
  return new Date(d + 'T12:00:00+05:30').toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

export default function MyContributionsPage() {
  const { token, isLoading } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState<ContributionStats | null>(null)
  const [list, setList] = useState<ContributionList | null>(null)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isLoading && !token) router.replace('/login')
  }, [isLoading, token, router])

  const load = useCallback(async () => {
    if (!token) return
    setLoading(true)
    const headers = { Authorization: `Bearer ${token}` }
    const [statsRes, listRes] = await Promise.all([
      fetch(`${BASE}${apiConfig.endpoints.contributions.myStats}`, { headers }),
      fetch(`${BASE}${apiConfig.endpoints.contributions.myList}?page=${page}&perPage=10`, { headers }),
    ])
    if (statsRes.ok) setStats((await statsRes.json()).data)
    if (listRes.ok) setList((await listRes.json()).data)
    setLoading(false)
  }, [token, page])

  useEffect(() => { load() }, [load])

  if (isLoading || !token) return null

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading font-bold text-2xl text-brand-navy">My Contributions</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Your self-reported payments to the club</p>
        </div>
        <Button asChild>
          <Link href="/contribute">+ New contribution</Link>
        </Button>
      </div>

      {/* Stats bar */}
      {stats && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="p-4 rounded-xl border border-border bg-green-50/50">
            <p className="text-xs text-muted-foreground mb-1">Total approved</p>
            <p className="font-heading font-bold text-xl text-green-700">₹{stats.totalApproved.toLocaleString('en-IN')}</p>
            <p className="text-xs text-muted-foreground">{stats.approvedCount} payment{stats.approvedCount !== 1 ? 's' : ''}</p>
          </div>
          <div className="p-4 rounded-xl border border-border bg-amber-50/50">
            <p className="text-xs text-muted-foreground mb-1">Pending review</p>
            <p className="font-heading font-bold text-xl text-amber-700">{stats.pendingCount}</p>
            <p className="text-xs text-muted-foreground">awaiting admin</p>
          </div>
          <div className="p-4 rounded-xl border border-border bg-white">
            <p className="text-xs text-muted-foreground mb-1">Total submitted</p>
            <p className="font-heading font-bold text-xl text-brand-navy">{list?.total ?? '—'}</p>
            <p className="text-xs text-muted-foreground">all time</p>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>
      ) : list?.contributions.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <IndianRupee className="size-10 mx-auto mb-4 opacity-30" />
          <p className="font-semibold text-brand-navy mb-1">No contributions yet</p>
          <p className="text-sm">Record your first payment to the club.</p>
          <Button className="mt-4" asChild><Link href="/contribute">Submit contribution</Link></Button>
        </div>
      ) : (
        <div className="space-y-3">
          {list?.contributions.map(c => (
            <div key={c.id} className="p-4 rounded-xl border border-border bg-white hover:border-brand-orange/20 transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-heading font-bold text-brand-navy">₹{c.amount.toLocaleString('en-IN')}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-brand-navy/5 text-brand-navy">{methodLabel(c.paymentMethod)}</span>
                    {statusBadge(c.status)}
                  </div>
                  <p className="text-xs text-muted-foreground">{fmtDate(c.paymentDate)}{c.paymentTime ? ` · ${c.paymentTime}` : ''}</p>
                  {c.event && (
                    <p className="text-xs text-brand-orange mt-0.5">{c.event.name}</p>
                  )}
                  {c.note && <p className="text-xs text-muted-foreground mt-1 italic">{c.note}</p>}
                  {c.status === 'rejected' && c.adminNote && (
                    <p className="text-xs text-red-600 mt-1 bg-red-50 px-2 py-1 rounded">
                      <strong>Admin note:</strong> {c.adminNote}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  {c.hasScreenshot && (
                    <a
                      href={`${BASE}${c.screenshotUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs flex items-center gap-1 text-brand-orange hover:underline"
                    >
                      <ImageIcon className="size-3" /> Screenshot
                    </a>
                  )}
                  <p className="text-[10px] text-muted-foreground">
                    {new Date(c.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {list && list.pages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
          <span className="text-sm text-muted-foreground self-center">Page {page} / {list.pages}</span>
          <Button variant="outline" size="sm" disabled={page === list.pages} onClick={() => setPage(p => p + 1)}>Next</Button>
        </div>
      )}
    </div>
  )
}
