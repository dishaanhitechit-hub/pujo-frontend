'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/lib/auth/auth-provider'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/dashboard/PageHeader'
import { apiConfig } from '@/config/api'
import { toast } from 'sonner'
import {
  Loader2, CheckCircle2, XCircle, ImageIcon, X,
  IndianRupee, Clock, User,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import type { ContributionList, Contribution, ApiError } from '@/types'

const BASE = apiConfig.baseUrl

const STATUS_FILTERS = [
  { key: 'pending',  label: 'Pending',  color: 'text-amber-700  bg-amber-50  border-amber-200'  },
  { key: 'approved', label: 'Approved', color: 'text-green-700  bg-green-50  border-green-200'  },
  { key: 'rejected', label: 'Rejected', color: 'text-red-700    bg-red-50    border-red-200'    },
  { key: '',         label: 'All',      color: ''                                                },
]

function statusBadge(s: Contribution['status']) {
  if (s === 'approved') return <Badge className="bg-green-100 text-green-700 border-green-200 font-medium">Approved</Badge>
  if (s === 'rejected') return <Badge className="bg-red-100 text-red-700 border-red-200 font-medium">Rejected</Badge>
  return <Badge className="bg-amber-100 text-amber-700 border-amber-200 font-medium">Pending</Badge>
}

function statusIcon(s: Contribution['status']) {
  if (s === 'approved') return <CheckCircle2 className="size-4 text-green-600 shrink-0" />
  if (s === 'rejected') return <XCircle className="size-4 text-red-500 shrink-0" />
  return <Clock className="size-4 text-amber-500 shrink-0" />
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

function initials(name = '') {
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
}

export default function AdminContributionsPage() {
  const { token, user, isLoading } = useAuth()
  const router = useRouter()

  const [list, setList] = useState<ContributionList | null>(null)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<string>('pending')
  const [loading, setLoading] = useState(true)

  const [reviewing, setReviewing] = useState<Contribution | null>(null)
  const [action, setAction] = useState<'approve' | 'reject'>('approve')
  const [adminNote, setAdminNote] = useState('')
  const [saving, setSaving] = useState(false)

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
      .then(r => r.ok ? r.json() : null)
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
      .then(r => r.ok ? r.json() : null)
      .then(json => {
        if (!active) return
        if (json?.data) setList(json.data)
        setLoading(false)
      })
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
      toast.success(`Contribution ${action === 'approve' ? 'approved' : 'rejected'}`)
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
    setReviewing(c); setAction(a); setAdminNote('')
  }

  function openScreenshot(c: Contribution) {
    if (!c.screenshotUrl) return
    setScreenshotSrc(`${BASE}${c.screenshotUrl}`)
  }

  if (isLoading || !token) return null

  return (
    <div className="p-4 sm:p-6 lg:p-8 flex flex-col gap-5 sm:gap-6">
      <PageHeader
        title="Member Contributions"
        subtitle="Review and approve self-reported payments from members"
      />

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {STATUS_FILTERS.map(({ key, label }) => (
          <button
            key={key || 'all'}
            onClick={() => { setStatusFilter(key); setPage(1) }}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all
              ${statusFilter === key
                ? 'bg-brand-navy text-white border-brand-navy'
                : 'border-border text-muted-foreground hover:border-brand-navy/40 bg-card'}`}
          >
            {label}
            {key === statusFilter && list && (
              <span className="ml-1.5 text-xs opacity-70">{list.total}</span>
            )}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : list?.contributions.length === 0 ? (
        <div className="flex flex-col items-center py-20 gap-3 text-center">
          <div className="size-12 rounded-2xl bg-brand-navy/5 flex items-center justify-center">
            <IndianRupee className="size-5 text-brand-navy/30" />
          </div>
          <p className="font-semibold text-brand-navy">No {statusFilter || ''} contributions</p>
          <p className="text-sm text-muted-foreground">
            {statusFilter === 'pending' ? 'All caught up — nothing waiting for review.' : 'No records match this filter.'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {list?.contributions.map(c => (
            <ContribCard
              key={c.id}
              c={c}
              onApprove={() => openReview(c, 'approve')}
              onReject={() => openReview(c, 'reject')}
              onScreenshot={() => openScreenshot(c)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {list && list.pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
          <span className="text-sm text-muted-foreground">Page {page} of {list.pages}</span>
          <Button variant="outline" size="sm" disabled={page === list.pages} onClick={() => setPage(p => p + 1)}>Next</Button>
        </div>
      )}

      {/* Review modal */}
      {reviewing && (
        <ReviewModal
          contribution={reviewing}
          action={action}
          adminNote={adminNote}
          setAdminNote={setAdminNote}
          saving={saving}
          onClose={() => setReviewing(null)}
          onSubmit={review}
          onScreenshot={() => openScreenshot(reviewing)}
        />
      )}

      {/* Screenshot lightbox */}
      {screenshotSrc && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
          onClick={() => setScreenshotSrc(null)}
        >
          <div className="relative max-w-2xl w-full max-h-[90dvh]" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setScreenshotSrc(null)}
              className="absolute -top-3 -right-3 z-10 size-8 rounded-full bg-white shadow-lg flex items-center justify-center hover:bg-muted transition-colors"
            >
              <X className="size-4" />
            </button>
            <img
              src={screenshotSrc}
              alt="Payment screenshot"
              className="w-full rounded-2xl shadow-2xl object-contain max-h-[85dvh]"
            />
          </div>
        </div>
      )}
    </div>
  )
}

// ── contribution card ──────────────────────────────────────────────────────────

function ContribCard({ c, onApprove, onReject, onScreenshot }: {
  c: Contribution
  onApprove: () => void
  onReject: () => void
  onScreenshot: () => void
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 hover:border-brand-orange/20 transition-colors">
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="size-9 rounded-xl bg-brand-navy/10 flex items-center justify-center shrink-0 mt-0.5">
          <span className="text-xs font-bold text-brand-navy">{initials(c.user?.name)}</span>
        </div>

        <div className="flex-1 min-w-0">
          {/* Top row */}
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div>
              <span className="font-semibold text-sm text-brand-navy">{c.user?.name ?? '—'}</span>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <span className="font-heading font-bold text-base text-brand-navy tabular-nums">
                  ₹{c.amount.toLocaleString('en-IN')}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-brand-navy/5 text-brand-navy font-medium">
                  {methodLabel(c.paymentMethod)}
                </span>
                {statusBadge(c.status)}
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {statusIcon(c.status)}
            </div>
          </div>

          {/* Meta */}
          <p className="text-xs text-muted-foreground mt-1.5">
            {fmtDate(c.paymentDate)}
            {c.paymentTime ? ` · ${c.paymentTime}` : ''}
            {c.event
              ? <span className="text-brand-orange"> · {c.event.name}</span>
              : <span> · General</span>}
          </p>

          {c.note && (
            <p className="text-xs text-muted-foreground mt-1 italic">"{c.note}"</p>
          )}

          {c.adminNote && (
            <div className="mt-2 text-xs bg-muted/50 rounded-lg px-3 py-2 text-muted-foreground">
              <strong className="text-foreground">Admin note:</strong> {c.adminNote}
              {c.reviewer && <span className="text-brand-orange"> — {c.reviewer.name}</span>}
            </div>
          )}

          {/* Actions row */}
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            {c.hasScreenshot && (
              <button
                onClick={onScreenshot}
                className="flex items-center gap-1.5 text-xs text-brand-orange hover:underline font-medium"
              >
                <ImageIcon className="size-3.5" /> View screenshot
              </button>
            )}
            {c.status === 'pending' && (
              <>
                {c.hasScreenshot && <span className="text-border">·</span>}
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs px-3 text-green-700 border-green-200 hover:bg-green-50"
                  onClick={onApprove}
                >
                  <CheckCircle2 className="size-3.5 mr-1" /> Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs px-3 text-red-700 border-red-200 hover:bg-red-50"
                  onClick={onReject}
                >
                  <XCircle className="size-3.5 mr-1" /> Reject
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── review modal ───────────────────────────────────────────────────────────────

function ReviewModal({ contribution: c, action, adminNote, setAdminNote, saving, onClose, onSubmit, onScreenshot }: {
  contribution: Contribution
  action: 'approve' | 'reject'
  adminNote: string
  setAdminNote: (v: string) => void
  saving: boolean
  onClose: () => void
  onSubmit: () => void
  onScreenshot: () => void
}) {
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className={`size-8 rounded-lg flex items-center justify-center ${action === 'approve' ? 'bg-green-100' : 'bg-red-100'}`}>
              {action === 'approve'
                ? <CheckCircle2 className="size-4 text-green-600" />
                : <XCircle className="size-4 text-red-600" />}
            </div>
            <h3 className="font-heading font-bold text-brand-navy text-base">
              {action === 'approve' ? 'Approve' : 'Reject'} contribution
            </h3>
          </div>
          <button onClick={onClose} className="size-8 rounded-lg flex items-center justify-center hover:bg-muted transition-colors">
            <X className="size-4 text-muted-foreground" />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-4">
          {/* Contribution summary */}
          <div className="rounded-xl bg-muted/40 border border-border p-3.5 space-y-1">
            <div className="flex items-center gap-2">
              <div className="size-7 rounded-lg bg-brand-navy/10 flex items-center justify-center">
                <span className="text-[10px] font-bold text-brand-navy">{initials(c.user?.name)}</span>
              </div>
              <span className="font-semibold text-sm text-brand-navy">{c.user?.name}</span>
              <span className="font-heading font-bold text-brand-navy ml-auto tabular-nums">₹{c.amount.toLocaleString('en-IN')}</span>
            </div>
            <p className="text-xs text-muted-foreground pl-9">
              {methodLabel(c.paymentMethod)} · {fmtDate(c.paymentDate)}
              {c.event ? ` · ${c.event.name}` : ' · General'}
            </p>
            {c.note && <p className="text-xs text-muted-foreground pl-9 italic">"{c.note}"</p>}
          </div>

          {/* Screenshot link */}
          {c.hasScreenshot && (
            <button
              onClick={onScreenshot}
              className="flex items-center gap-2 text-sm text-brand-orange hover:underline font-medium w-fit"
            >
              <ImageIcon className="size-4" /> Preview payment screenshot
            </button>
          )}

          {/* Note textarea */}
          <div>
            <label className="text-xs font-semibold text-brand-navy block mb-1.5 uppercase tracking-wide">
              {action === 'reject' ? 'Reason for rejection *' : 'Admin note (optional)'}
            </label>
            <Textarea
              value={adminNote}
              onChange={e => setAdminNote(e.target.value)}
              placeholder={action === 'reject'
                ? 'Explain why this contribution is being rejected…'
                : 'Any remarks to add…'}
              rows={3}
              className="resize-none text-sm"
              autoFocus
            />
            {action === 'reject' && !adminNote.trim() && (
              <p className="text-xs text-muted-foreground mt-1">Required for rejections.</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button
              className={`flex-1 text-white ${action === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
              disabled={saving}
              onClick={onSubmit}
            >
              {saving && <Loader2 className="size-4 animate-spin mr-2" />}
              {action === 'approve' ? 'Approve' : 'Reject'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
