'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useAuth } from '@/lib/auth/auth-provider'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/dashboard/PageHeader'
import { apiConfig } from '@/config/api'
import { toast } from 'sonner'
import {
  Loader2, CheckCircle2, Clock, XCircle, IndianRupee,
  ImageIcon, X, QrCode, Building2, Banknote, Info,
  Upload, CheckCircle, Copy, Check,
} from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { ContributionList, ContributionStats, Contribution, PaymentInfo, PublicEvent, ApiError } from '@/types'

const BASE = apiConfig.baseUrl
type Method = 'upi' | 'bank_transfer' | 'cash'

// ── helpers ──────────────────────────────────────────────────────────────────

function statusBadge(s: Contribution['status']) {
  if (s === 'approved') return <Badge className="bg-green-100 text-green-700 border-green-200 font-medium">Approved</Badge>
  if (s === 'rejected') return <Badge className="bg-red-100 text-red-700 border-red-200 font-medium">Rejected</Badge>
  return <Badge className="bg-amber-100 text-amber-700 border-amber-200 font-medium">Pending</Badge>
}

function statusIcon(s: Contribution['status']) {
  if (s === 'approved') return <CheckCircle2 className="size-4 text-green-600 shrink-0 mt-0.5" />
  if (s === 'rejected') return <XCircle className="size-4 text-red-500 shrink-0 mt-0.5" />
  return <Clock className="size-4 text-amber-500 shrink-0 mt-0.5" />
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

// ── main page ─────────────────────────────────────────────────────────────────

export default function MyContributionsPage() {
  const { token, user, isLoading } = useAuth()
  const router = useRouter()

  const [stats, setStats] = useState<ContributionStats | null>(null)
  const [list, setList] = useState<ContributionList | null>(null)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    if (isLoading) return
    if (!token) router.replace('/login')
    else if (user?.role === 'admin') router.replace('/admin/contributions')
  }, [isLoading, token, user, router])

  const load = useCallback(() => {
    if (!token) return
    const headers = { Authorization: `Bearer ${token}` }
    Promise.all([
      fetch(`${BASE}${apiConfig.endpoints.contributions.myStats}`, { headers }).then(r => r.ok ? r.json() : null),
      fetch(`${BASE}${apiConfig.endpoints.contributions.myList}?page=${page}&perPage=10`, { headers }).then(r => r.ok ? r.json() : null),
    ]).then(([s, l]) => {
      if (s?.data) setStats(s.data)
      if (l?.data) setList(l.data)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [token, page])

  useEffect(() => {
    if (!token) return
    setLoading(true)
    const headers = { Authorization: `Bearer ${token}` }
    Promise.all([
      fetch(`${BASE}${apiConfig.endpoints.contributions.myStats}`, { headers }).then(r => r.ok ? r.json() : null),
      fetch(`${BASE}${apiConfig.endpoints.contributions.myList}?page=${page}&perPage=10`, { headers }).then(r => r.ok ? r.json() : null),
    ]).then(([s, l]) => {
      if (s?.data) setStats(s.data)
      if (l?.data) setList(l.data)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [token, page])

  if (isLoading || !token || user?.role === 'admin') return null

  return (
    <div className="p-4 sm:p-6 lg:p-8 flex flex-col gap-5 sm:gap-6">
      <PageHeader
        title="My Contributions"
        subtitle="Your self-reported payments to the club"
      >
        <Button onClick={() => setShowModal(true)} className="bg-brand-navy hover:bg-brand-navy/90 text-white">
          + Submit contribution
        </Button>
      </PageHeader>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <StatCard
          label="Total approved"
          value={stats ? `₹${stats.totalApproved.toLocaleString('en-IN')}` : '₹—'}
          sub={stats ? `${stats.approvedCount} payment${stats.approvedCount !== 1 ? 's' : ''}` : ''}
          accent="green"
        />
        <StatCard
          label="Pending review"
          value={stats ? String(stats.pendingCount) : '—'}
          sub="awaiting admin"
          accent="amber"
        />
        <StatCard
          label="Total submitted"
          value={list?.total != null ? String(list.total) : '—'}
          sub="all time"
          accent="neutral"
        />
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : list?.contributions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
          <div className="size-12 rounded-2xl bg-brand-navy/5 flex items-center justify-center">
            <IndianRupee className="size-6 text-brand-navy/30" />
          </div>
          <div>
            <p className="font-semibold text-brand-navy">No contributions yet</p>
            <p className="text-sm text-muted-foreground mt-0.5">Record your first payment to the club.</p>
          </div>
          <Button onClick={() => setShowModal(true)}>Submit contribution</Button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {list?.contributions.map(c => (
            <ContribCard key={c.id} c={c} token={token} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {list && list.pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
          <span className="text-sm text-muted-foreground">Page {page} / {list.pages}</span>
          <Button variant="outline" size="sm" disabled={page === list.pages} onClick={() => setPage(p => p + 1)}>Next</Button>
        </div>
      )}

      {/* Submit modal */}
      {showModal && (
        <SubmitModal
          token={token}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false)
            setPage(1)
            setLoading(true)
            load()
          }}
        />
      )}
    </div>
  )
}

// ── stat card ─────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, accent }: {
  label: string; value: string; sub: string; accent: 'green' | 'amber' | 'neutral'
}) {
  const colors = {
    green:   { val: 'text-green-700', bg: 'bg-green-50 border-green-100' },
    amber:   { val: 'text-amber-700', bg: 'bg-amber-50 border-amber-100' },
    neutral: { val: 'text-brand-navy', bg: 'bg-white border-border' },
  }[accent]

  return (
    <div className={`rounded-xl border p-3 sm:p-4 ${colors.bg}`}>
      <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">{label}</p>
      <p className={`font-heading font-bold text-lg sm:text-2xl tabular-nums leading-none ${colors.val}`}>{value}</p>
      {sub && <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 leading-none">{sub}</p>}
    </div>
  )
}

// ── contribution card ─────────────────────────────────────────────────────────

function ContribCard({ c, token }: { c: Contribution; token: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 flex items-start gap-3 hover:border-brand-orange/20 transition-colors">
      {statusIcon(c.status)}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-heading font-bold text-brand-navy text-base sm:text-lg tabular-nums">
              ₹{c.amount.toLocaleString('en-IN')}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-brand-navy/5 text-brand-navy font-medium">
              {methodLabel(c.paymentMethod)}
            </span>
            {statusBadge(c.status)}
          </div>
          <p className="text-xs text-muted-foreground shrink-0">
            {new Date(c.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
        </div>

        <p className="text-xs text-muted-foreground mt-1">
          {fmtDate(c.paymentDate)}
          {c.paymentTime ? ` · ${c.paymentTime}` : ''}
          {c.event ? <span className="text-brand-orange"> · {c.event.name}</span> : ' · General'}
        </p>

        {c.note && (
          <p className="text-xs text-muted-foreground mt-1.5 italic">"{c.note}"</p>
        )}
        {c.status === 'rejected' && c.adminNote && (
          <div className="mt-2 text-xs bg-red-50 border border-red-100 rounded-lg px-3 py-2 text-red-700">
            <strong>Admin note:</strong> {c.adminNote}
          </div>
        )}
      </div>

      {c.hasScreenshot && c.screenshotUrl && (
        <a
          href={`${BASE}${c.screenshotUrl}`}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 size-8 rounded-lg border border-border bg-muted/40 flex items-center justify-center hover:bg-brand-orange/5 hover:border-brand-orange/30 transition-colors"
          title="View screenshot"
        >
          <ImageIcon className="size-3.5 text-muted-foreground" />
        </a>
      )}
    </div>
  )
}

// ── upi panel ─────────────────────────────────────────────────────────────────

function UpiPanel({ upiId }: { upiId: string }) {
  const [copied, setCopied] = useState(false)
  const upiLink = `upi://pay?pa=${encodeURIComponent(upiId)}&cu=INR`

  function copy() {
    navigator.clipboard.writeText(upiId).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="rounded-xl border border-brand-orange/20 bg-brand-orange/5 overflow-hidden">
      {/* QR */}
      <div className="flex flex-col items-center gap-2 pt-5 pb-4 px-4">
        <div className="rounded-xl bg-white p-3 border border-border shadow-sm">
          <QRCodeSVG
            value={upiLink}
            size={160}
            bgColor="#ffffff"
            fgColor="#0F1C3F"
            level="M"
            includeMargin={false}
          />
        </div>
        <p className="text-xs text-muted-foreground text-center">
          Scan with any UPI app to pay directly
        </p>
      </div>

      {/* UPI ID row */}
      <div className="border-t border-brand-orange/15 bg-white/50 px-4 py-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-0.5">UPI ID</p>
          <p className="font-mono text-sm font-bold text-brand-navy truncate">{upiId}</p>
        </div>
        <button
          type="button"
          onClick={copy}
          className="shrink-0 flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-border bg-white hover:bg-muted/50 transition-colors"
        >
          {copied
            ? <><Check className="size-3 text-green-600" /> Copied</>
            : <><Copy className="size-3" /> Copy</>}
        </button>
      </div>
    </div>
  )
}

// ── submit modal ──────────────────────────────────────────────────────────────

function SubmitModal({ token, onClose, onSuccess }: {
  token: string
  onClose: () => void
  onSuccess: () => void
}) {
  const [info, setInfo] = useState<PaymentInfo | null>(null)
  const [events, setEvents] = useState<PublicEvent[]>([])
  const [eventId, setEventId] = useState<string>('')
  const [method, setMethod] = useState<Method>('upi')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [time, setTime] = useState('')
  const [note, setNote] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch(`${BASE}${apiConfig.endpoints.contributions.paymentInfo}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(json => { if (json?.data) setInfo(json.data) })
      .catch(() => {})

    // Fetch public events and keep only ongoing/upcoming ones
    const today = new Date().toISOString().slice(0, 10)
    fetch(`${BASE}${apiConfig.endpoints.public.events}?perPage=50`)
      .then(r => r.ok ? r.json() : null)
      .then(json => {
        const all: PublicEvent[] = json?.data?.events ?? []
        setEvents(all.filter(e => !e.endDate || e.endDate >= today))
      })
      .catch(() => {})
  }, [token])

  function pickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null
    if (f && f.size > 10 * 1024 * 1024) {
      toast.error('Image too large — maximum 10 MB allowed')
      e.target.value = ''
      return
    }
    setFile(f)
    setPreview(f ? URL.createObjectURL(f) : null)
  }

  function clearFile() {
    setFile(null); setPreview(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast.error('Enter a valid amount'); return
    }
    const fd = new FormData()
    fd.append('paymentMethod', method)
    fd.append('amount', amount)
    fd.append('paymentDate', date)
    if (time) fd.append('paymentTime', time)
    if (note.trim()) fd.append('note', note.trim())
    if (eventId) fd.append('eventId', eventId)
    if (file) fd.append('screenshot', file)
    setSubmitting(true)
    try {
      const res = await fetch(`${BASE}${apiConfig.endpoints.contributions.submit}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.message ?? 'Submission failed')
      setDone(true)
    } catch (err) {
      toast.error((err as ApiError).message ?? 'Submission failed')
    } finally {
      setSubmitting(false)
    }
  }

  // Trap scroll on body while modal open
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
        className="relative bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl max-h-[92dvh] flex flex-col shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Handle (mobile) */}
        <div className="flex justify-center pt-3 sm:hidden shrink-0">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <div>
            <h2 className="font-heading font-bold text-brand-navy text-base">Submit a Contribution</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Record a payment for admin approval</p>
          </div>
          <button
            onClick={onClose}
            className="size-8 rounded-lg flex items-center justify-center hover:bg-muted transition-colors"
          >
            <X className="size-4 text-muted-foreground" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 overscroll-contain">
          {done ? (
            <div className="flex flex-col items-center justify-center gap-4 py-12 px-6 text-center">
              <div className="size-14 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="size-7 text-green-600" />
              </div>
              <div>
                <p className="font-heading font-bold text-brand-navy text-lg">Submitted!</p>
                <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                  Your contribution is pending admin approval. You'll see it in your history once reviewed.
                </p>
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => { setDone(false); setAmount(''); setNote(''); clearFile() }}>
                  Submit another
                </Button>
                <Button className="bg-brand-navy hover:bg-brand-navy/90 text-white" onClick={onSuccess}>
                  Done
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={submit} className="p-5 flex flex-col gap-5">

              {/* Event picker */}
              <div>
                <Label htmlFor="m-event" className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">
                  Contributing towards
                </Label>
                <select
                  id="m-event"
                  value={eventId}
                  onChange={e => setEventId(e.target.value)}
                  disabled={submitting}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">General — not linked to an event</option>
                  {events.length > 0 && (
                    <optgroup label="Ongoing / Upcoming Events">
                      {events.map(e => (
                        <option key={e.id} value={String(e.id)}>
                          {e.name}{e.year ? ` (${e.year})` : ''}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
                {eventId && (
                  <p className="text-xs text-brand-orange mt-1.5">
                    This contribution will be linked to the selected event.
                  </p>
                )}
              </div>

              {/* Method picker */}
              <div>
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">
                  Payment method
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { id: 'upi',           label: 'UPI',           Icon: QrCode   },
                    { id: 'bank_transfer', label: 'Bank Transfer', Icon: Building2 },
                    { id: 'cash',          label: 'Cash',          Icon: Banknote  },
                  ] as { id: Method; label: string; Icon: React.ElementType }[]).map(({ id, label, Icon }) => (
                    <button
                      key={id} type="button" onClick={() => setMethod(id)} disabled={submitting}
                      className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 text-xs font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed
                        ${method === id
                          ? 'border-brand-orange bg-brand-orange/5 text-brand-orange'
                          : 'border-border text-muted-foreground hover:border-brand-orange/30'}`}
                    >
                      <Icon className="size-4" />{label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Payment info panel */}
              {method === 'upi' && info?.upi.id && (
                <UpiPanel upiId={info.upi.id} />
              )}

              {method === 'bank_transfer' && info && (
                <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-blue-700 mb-3">Bank Details</p>
                  <div className="space-y-1.5">
                    {([
                      ['Bank',           info.bank.bankName],
                      ['Account Name',   info.bank.accountName],
                      ['Account Number', info.bank.accountNumber],
                      ['IFSC',           info.bank.ifsc],
                      ['Branch',         info.bank.branch],
                    ] as [string, string | null][]).map(([label, val]) => val && (
                      <div key={label} className="flex justify-between text-xs">
                        <span className="text-muted-foreground">{label}</span>
                        <span className="font-mono font-semibold text-brand-navy">{val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {method === 'cash' && (
                <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3 flex gap-2 text-xs text-amber-800">
                  <Info className="size-3.5 shrink-0 mt-0.5" />
                  Collect a receipt from the treasurer if possible and attach a photo as your screenshot.
                </div>
              )}

              {/* Amount */}
              <div>
                <Label htmlFor="m-amount" className="text-xs font-semibold">Amount (₹) *</Label>
                <Input
                  id="m-amount" type="number" min={1} step={0.01}
                  placeholder="e.g. 500" value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="mt-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  required disabled={submitting}
                />
              </div>

              {/* Date + Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="m-date" className="text-xs font-semibold">Payment date *</Label>
                  <Input
                    id="m-date" type="date" value={date}
                    onChange={e => setDate(e.target.value)}
                    className="mt-1" required disabled={submitting}
                  />
                </div>
                <div>
                  <Label htmlFor="m-time" className="text-xs font-semibold">
                    Time <span className="text-muted-foreground font-normal">(optional)</span>
                  </Label>
                  <Input
                    id="m-time" type="time" value={time}
                    onChange={e => setTime(e.target.value)}
                    className="mt-1" disabled={submitting}
                  />
                </div>
              </div>

              {/* Note */}
              <div>
                <Label htmlFor="m-note" className="text-xs font-semibold">
                  Note <span className="text-muted-foreground font-normal">(optional)</span>
                </Label>
                <Textarea
                  id="m-note" placeholder="Any context to add…"
                  value={note} onChange={e => setNote(e.target.value)}
                  className="mt-1 resize-none text-sm" rows={2} disabled={submitting}
                />
              </div>

              {/* Screenshot */}
              <div>
                <Label className="text-xs font-semibold block mb-1.5">
                  Screenshot <span className="text-muted-foreground font-normal">(optional but recommended)</span>
                </Label>
                {preview ? (
                  <div className="relative w-fit">
                    <img src={preview} alt="preview" className="max-h-40 rounded-xl border border-border object-contain" />
                    <button
                      type="button" onClick={clearFile} disabled={submitting}
                      className="absolute -top-2 -right-2 size-6 rounded-full bg-destructive text-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button" onClick={() => fileRef.current?.click()} disabled={submitting}
                    className="flex items-center justify-center gap-2 w-full py-5 rounded-xl border-2 border-dashed border-border hover:border-brand-orange/40 hover:bg-brand-orange/5 transition-all text-muted-foreground text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Upload className="size-4" /> Upload payment screenshot
                  </button>
                )}
                <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={pickFile} />
              </div>

              {/* Footer */}
              <div className="flex gap-3 pt-1 pb-1">
                <Button type="button" variant="outline" className="flex-1" onClick={onClose} disabled={submitting}>Cancel</Button>
                <Button
                  type="submit"
                  className="flex-1 bg-brand-navy hover:bg-brand-navy/90 text-white"
                  disabled={submitting}
                >
                  {submitting && <Loader2 className="size-3.5 animate-spin mr-2" />}
                  {submitting ? 'Submitting…' : 'Submit for approval'}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
