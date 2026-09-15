'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/lib/auth/auth-provider'
import { useRouter } from 'next/navigation'
import { apiConfig } from '@/config/api'
import { toast } from 'sonner'
import {
  Loader2, CheckCircle2, XCircle, ImageIcon, X,
  IndianRupee, ChevronDown,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import type { ContributionList, Contribution, ApiError } from '@/types'

const BASE = apiConfig.baseUrl

function statusBadge(s: Contribution['status']) {
  if (s === 'approved') return <Badge className="bg-green-100 text-green-700 border-green-200">Approved</Badge>
  if (s === 'rejected') return <Badge className="bg-red-100 text-red-700 border-red-200">Rejected</Badge>
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

export default function AdminContributionsPage() {
  const { token, user, isLoading } = useAuth()
  const router = useRouter()

  const [list, setList] = useState<ContributionList | null>(null)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<string>('pending')
  const [loading, setLoading] = useState(true)

  // Review modal
  const [reviewing, setReviewing] = useState<Contribution | null>(null)
  const [action, setAction] = useState<'approve' | 'reject'>('approve')
  const [adminNote, setAdminNote] = useState('')
  const [saving, setSaving] = useState(false)

  // Screenshot preview
  const [screenshotSrc, setScreenshotSrc] = useState<string | null>(null)

  useEffect(() => {
    if (!isLoading && (!token || user?.role !== 'admin')) router.replace('/dashboard')
  }, [isLoading, token, user, router])

  const load = useCallback(() => {
    if (!token) return
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), perPage: '20' })
    if (statusFilter) params.set('status', statusFilter)
    fetch(`${BASE}${apiConfig.endpoints.contributions.adminList}?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.ok ? res.json() : null)
      .then(json => { if (json?.data) setList(json.data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [token, page, statusFilter])

  useEffect(() => {
    if (!token) return
    let active = true
    const params = new URLSearchParams({ page: String(page), perPage: '20' })
    if (statusFilter) params.set('status', statusFilter)
    fetch(`${BASE}${apiConfig.endpoints.contributions.adminList}?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.ok ? res.json() : null)
      .then(json => { if (!active) return; if (json?.data) setList(json.data); setLoading(false) })
      .catch(() => { if (!active) return; setLoading(false) })
    return () => { active = false }
  }, [token, page, statusFilter])

  async function review() {
    if (!token || !reviewing) return
    if (action === 'reject' && !adminNote.trim()) {
      toast.error('Please add a note explaining the rejection')
      return
    }
    setSaving(true)
    try {
      const res = await fetch(`${BASE}${apiConfig.endpoints.contributions.adminReview(reviewing.id)}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, adminNote: adminNote.trim() || null }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.message ?? 'Review failed')
      toast.success(`Contribution ${action}d`)
      setReviewing(null)
      setAdminNote('')
      load()
    } catch (err) {
      toast.error((err as ApiError).message ?? 'Failed')
    } finally {
      setSaving(false)
    }
  }

  function openReview(c: Contribution, a: 'approve' | 'reject') {
    setReviewing(c)
    setAction(a)
    setAdminNote('')
  }

  function openScreenshot(c: Contribution) {
    if (!c.screenshotUrl || !token) return
    setScreenshotSrc(`${BASE}${c.screenshotUrl}`)
  }

  if (isLoading || !token) return null

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading font-bold text-2xl text-brand-navy">Member Contributions</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Review and approve self-reported payments</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {['pending', 'approved', 'rejected', ''].map((s) => (
          <button
            key={s || 'all'}
            onClick={() => { setStatusFilter(s); setPage(1) }}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all
              ${statusFilter === s
                ? 'bg-brand-navy text-white border-brand-navy'
                : 'border-border text-muted-foreground hover:border-brand-navy/30'}`}
          >
            {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>
      ) : list?.contributions.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <IndianRupee className="size-10 mx-auto mb-4 opacity-30" />
          <p className="font-semibold text-brand-navy">No contributions found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {list?.contributions.map(c => (
            <div key={c.id} className="rounded-xl border border-border bg-white p-4 hover:border-brand-orange/20 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-heading font-bold text-lg text-brand-navy">₹{c.amount.toLocaleString('en-IN')}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-brand-navy/5 text-brand-navy">{methodLabel(c.paymentMethod)}</span>
                    {statusBadge(c.status)}
                  </div>
                  <p className="text-sm font-semibold text-brand-navy">{c.user?.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {fmtDate(c.paymentDate)}{c.paymentTime ? ` · ${c.paymentTime}` : ''}
                    {c.event ? ` · ${c.event.name}` : ' · General'}
                  </p>
                  {c.note && <p className="text-xs text-muted-foreground mt-1 italic">"{c.note}"</p>}
                  {c.adminNote && (
                    <p className="text-xs mt-1 text-muted-foreground">
                      <strong>Admin note:</strong> {c.adminNote}
                      {c.reviewer && ` — ${c.reviewer.name}`}
                    </p>
                  )}
                </div>

                <div className="flex flex-col items-end gap-2 shrink-0">
                  {c.hasScreenshot && (
                    <button
                      onClick={() => openScreenshot(c)}
                      className="flex items-center gap-1 text-xs text-brand-orange hover:underline"
                    >
                      <ImageIcon className="size-3" /> View screenshot
                    </button>
                  )}
                  {c.status === 'pending' && (
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="text-green-700 border-green-200 hover:bg-green-50" onClick={() => openReview(c, 'approve')}>
                        <CheckCircle2 className="size-3.5 mr-1" /> Approve
                      </Button>
                      <Button size="sm" variant="outline" className="text-red-700 border-red-200 hover:bg-red-50" onClick={() => openReview(c, 'reject')}>
                        <XCircle className="size-3.5 mr-1" /> Reject
                      </Button>
                    </div>
                  )}
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

      {/* Review modal */}
      {reviewing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setReviewing(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading font-bold text-brand-navy">
                {action === 'approve' ? 'Approve' : 'Reject'} contribution
              </h3>
              <button onClick={() => setReviewing(null)}><X className="size-4 text-muted-foreground" /></button>
            </div>

            <div className="bg-muted/30 rounded-xl p-3 mb-4 text-sm space-y-1">
              <p><strong>{reviewing.user?.name}</strong> — ₹{reviewing.amount.toLocaleString('en-IN')}</p>
              <p className="text-muted-foreground">{methodLabel(reviewing.paymentMethod)} · {fmtDate(reviewing.paymentDate)}</p>
              {reviewing.note && <p className="text-muted-foreground italic">"{reviewing.note}"</p>}
            </div>

            {reviewing.hasScreenshot && (
              <button
                onClick={() => openScreenshot(reviewing)}
                className="flex items-center gap-2 text-sm text-brand-orange hover:underline mb-4"
              >
                <ImageIcon className="size-4" /> Preview screenshot before deciding
              </button>
            )}

            <div className="mb-4">
              <label className="text-sm font-medium text-brand-navy block mb-1.5">
                {action === 'reject' ? 'Reason for rejection *' : 'Note (optional)'}
              </label>
              <Textarea
                value={adminNote}
                onChange={e => setAdminNote(e.target.value)}
                placeholder={action === 'reject' ? 'Explain why the contribution is being rejected…' : 'Any remarks…'}
                rows={3}
                className="resize-none"
              />
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setReviewing(null)}>Cancel</Button>
              <Button
                className={`flex-1 ${action === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'} text-white`}
                disabled={saving}
                onClick={review}
              >
                {saving && <Loader2 className="size-4 animate-spin mr-2" />}
                {action === 'approve' ? 'Approve' : 'Reject'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Screenshot preview modal */}
      {screenshotSrc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={() => setScreenshotSrc(null)}>
          <div className="relative max-w-2xl w-full" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setScreenshotSrc(null)}
              className="absolute -top-4 -right-4 size-8 rounded-full bg-white flex items-center justify-center shadow"
            >
              <X className="size-4" />
            </button>
            <img
              src={`${screenshotSrc}?t=${Date.now()}`}
              alt="Payment screenshot"
              className="w-full rounded-xl shadow-2xl object-contain max-h-[80vh]"
            />
          </div>
        </div>
      )}
    </div>
  )
}
