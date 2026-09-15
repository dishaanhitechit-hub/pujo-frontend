'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth/auth-provider'
import { ActiveBadge } from '@/components/shared/StatusBadge'
import { ROLE_LABELS } from '@/config/roles'
import { getUserLoginQr } from '@/lib/api/users'
import {
  Loader2, Download, Printer, HeartHandshake, ChevronRight,
  QrCode, Mail, Phone, MessageCircle, Calendar, ShieldCheck,
  ArrowUpRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { apiConfig } from '@/config/api'
import type { ContributionStats } from '@/types'

const BASE = apiConfig.baseUrl

export default function ProfilePage() {
  const { user, token } = useAuth()
  const [qrUrl, setQrUrl] = useState<string | null>(null)
  const [qrLoading, setQrLoading] = useState(true)
  const [contribStats, setContribStats] = useState<ContributionStats | null>(null)

  useEffect(() => {
    if (!user) return
    let objectUrl: string
    getUserLoginQr(user.id)
      .then((url) => { objectUrl = url; setQrUrl(url) })
      .catch(() => {})
      .finally(() => setQrLoading(false))
    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl) }
  }, [user?.id])

  useEffect(() => {
    if (!token || !user || user.role === 'admin') return
    fetch(`${BASE}${apiConfig.endpoints.contributions.myStats}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(json => { if (json?.data) setContribStats(json.data) })
      .catch(() => {})
  }, [token, user?.id])

  if (!user) return null

  const initials = user.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
  const memberSince = new Date(user.createdAt).toLocaleDateString('en-IN', {
    year: 'numeric', month: 'long', day: 'numeric',
  })

  function handleDownload() {
    if (!qrUrl || !user) return
    const a = document.createElement('a')
    a.href = qrUrl
    a.download = `login-qr-${user.name.replace(/\s+/g, '-').toLowerCase()}.png`
    a.click()
  }

  function handlePrint() {
    if (!qrUrl || !user) return
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(`
      <html><body style="display:flex;flex-direction:column;align-items:center;padding:48px;font-family:sans-serif;text-align:center">
        <h2 style="margin:0 0 4px">${user.name}</h2>
        <p style="margin:0 0 24px;color:#666;font-size:14px">${user.email ?? ''}</p>
        <img src="${qrUrl}" style="width:240px;height:240px" />
        <p style="margin-top:20px;color:#999;font-size:12px">PujoPay Login QR — scan with the PujoPay mobile app</p>
      </body></html>
    `)
    win.document.close()
    win.focus()
    win.print()
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto">

        {/* Page heading */}
        <div className="mb-6">
          <h1 className="font-heading font-bold text-2xl text-brand-navy tracking-tight">My Profile</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Your account information and activity</p>
        </div>

        {/* Responsive grid: 2/3 + 1/3 on lg */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* ── LEFT COLUMN ── */}
          <div className="lg:col-span-2 flex flex-col gap-5">

            {/* Identity card */}
            <div className="rounded-2xl bg-white border border-border/60 overflow-hidden shadow-[0_1px_3px_0_rgb(0,0,0,0.04)]">
              {/* Header */}
              <div className="relative bg-brand-navy overflow-hidden">
                {/* Decorative orange wedge */}
                <div className="absolute top-0 right-0 w-0 h-0"
                  style={{ borderLeft: '120px solid transparent', borderTop: '100px solid rgba(249,115,22,0.15)' }} />
                <div className="absolute bottom-0 right-16 size-24 rounded-full bg-white/[0.04]" />

                <div className="relative flex items-start sm:items-center gap-4 p-5 sm:p-6">
                  {/* Avatar */}
                  <div className="shrink-0 size-16 sm:size-20 rounded-2xl bg-brand-orange/20 ring-2 ring-brand-orange/30 flex items-center justify-center">
                    <span className="font-heading font-bold text-2xl sm:text-3xl text-white select-none">{initials}</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-heading font-bold text-white text-lg sm:text-xl leading-snug truncate">{user.name}</p>
                    <p className="text-white/55 text-sm mt-0.5">{ROLE_LABELS[user.role]}</p>
                    <div className="mt-2.5 flex items-center gap-2 flex-wrap">
                      <ActiveBadge isActive={user.isActive} />
                      <span className="text-xs text-white/40">Member since {new Date(user.createdAt).getFullYear()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Info fields — 2-col grid */}
              <div className="p-5 sm:p-6">
                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground/70 mb-4">
                  Account details
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
                  <InfoField
                    icon={<Mail className="size-3.5" />}
                    label="Email address"
                    value={user.email}
                    mono
                  />
                  <InfoField
                    icon={<ShieldCheck className="size-3.5" />}
                    label="Role"
                    value={ROLE_LABELS[user.role]}
                  />
                  <InfoField
                    icon={<Phone className="size-3.5" />}
                    label="Phone"
                    value={user.phone ?? '—'}
                    mono={!!user.phone}
                  />
                  <InfoField
                    icon={<MessageCircle className="size-3.5" />}
                    label="WhatsApp"
                    value={user.whatsappNo ?? '—'}
                    mono={!!user.whatsappNo}
                  />
                  <InfoField
                    icon={<Calendar className="size-3.5" />}
                    label="Member since"
                    value={memberSince}
                    className="sm:col-span-2"
                  />
                </div>
              </div>
            </div>

            {/* Contributions widget — non-admin only */}
            {user.role !== 'admin' && (
              <div className="rounded-2xl bg-white border border-border/60 overflow-hidden shadow-[0_1px_3px_0_rgb(0,0,0,0.04)]">
                <div className="flex items-center justify-between px-5 py-4 border-b border-border/60">
                  <div className="flex items-center gap-2.5">
                    <div className="size-8 rounded-xl bg-brand-orange/10 flex items-center justify-center">
                      <HeartHandshake className="size-4 text-brand-orange" />
                    </div>
                    <div>
                      <p className="font-heading font-bold text-sm text-brand-navy">My Contributions</p>
                      <p className="text-[11px] text-muted-foreground leading-none mt-0.5">
                        Self-reported payments to the club
                      </p>
                    </div>
                  </div>
                  <Link
                    href="/my-contributions"
                    className="text-xs text-brand-orange flex items-center gap-0.5 hover:underline font-medium"
                  >
                    View all <ChevronRight className="size-3" />
                  </Link>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-3 divide-x divide-border/60">
                  <ContribStat
                    label="Total approved"
                    value={contribStats ? `₹${contribStats.totalApproved.toLocaleString('en-IN')}` : '₹—'}
                    valueClass="text-green-600"
                    bg="bg-green-50/60"
                  />
                  <ContribStat
                    label="Pending review"
                    value={contribStats ? String(contribStats.pendingCount) : '—'}
                    valueClass="text-amber-600"
                    bg="bg-amber-50/60"
                  />
                  <ContribStat
                    label="Payments approved"
                    value={contribStats ? String(contribStats.approvedCount) : '—'}
                    valueClass="text-brand-navy"
                    bg="bg-white"
                  />
                </div>

                {/* CTA */}
                <div className="px-5 py-3.5 border-t border-border/60 flex items-center justify-between gap-3">
                  <p className="text-xs text-muted-foreground">
                    Submit a payment record for admin approval
                  </p>
                  <Button asChild size="sm" className="bg-brand-navy hover:bg-brand-navy/90 text-white shrink-0">
                    <Link href="/contribute" className="flex items-center gap-1.5">
                      <ArrowUpRight className="size-3.5" /> Submit
                    </Link>
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* ── RIGHT COLUMN ── */}
          <div className="flex flex-col gap-5">
            <div className="rounded-2xl bg-white border border-border/60 overflow-hidden shadow-[0_1px_3px_0_rgb(0,0,0,0.04)]">
              <div className="px-5 py-4 border-b border-border/60">
                <div className="flex items-center gap-2">
                  <QrCode className="size-4 text-brand-orange" />
                  <p className="font-heading font-bold text-sm text-brand-navy">Login QR</p>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                  Scan with the PujoPay app to sign in instantly — no typing required.
                </p>
              </div>

              <div className="p-5 flex flex-col items-center gap-4">
                {/* QR image */}
                <div className="rounded-2xl border border-border/60 bg-[#FAFBFD] p-3 flex items-center justify-center w-full aspect-square max-w-[200px]">
                  {qrLoading ? (
                    <Loader2 className="size-7 animate-spin text-muted-foreground" />
                  ) : qrUrl ? (
                    <img src={qrUrl} alt="Login QR" className="w-full h-full object-contain rounded-lg" />
                  ) : (
                    <p className="text-xs text-muted-foreground text-center">QR not available</p>
                  )}
                </div>

                {/* Actions */}
                {!qrLoading && qrUrl && (
                  <div className="grid grid-cols-2 gap-2 w-full">
                    <Button variant="outline" size="sm" onClick={handlePrint} className="gap-1.5 text-xs">
                      <Printer className="size-3.5" /> Print
                    </Button>
                    <Button
                      size="sm"
                      className="gap-1.5 text-xs bg-brand-orange hover:bg-brand-orange/90 text-white"
                      onClick={handleDownload}
                    >
                      <Download className="size-3.5" /> Download
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function InfoField({
  icon, label, value, mono, className,
}: {
  icon: React.ReactNode
  label: string
  value: React.ReactNode
  mono?: boolean
  className?: string
}) {
  return (
    <div className={`flex flex-col gap-1 ${className ?? ''}`}>
      <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground/70">
        {icon} {label}
      </span>
      <span className={`text-sm font-medium text-brand-navy break-all ${mono ? 'font-mono tracking-tight' : ''}`}>
        {value}
      </span>
    </div>
  )
}

function ContribStat({
  label, value, valueClass, bg,
}: {
  label: string
  value: string
  valueClass: string
  bg: string
}) {
  return (
    <div className={`px-4 py-4 text-center ${bg}`}>
      <p className={`font-heading font-bold text-xl tabular-nums ${valueClass}`}>{value}</p>
      <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight uppercase tracking-wide font-medium">{label}</p>
    </div>
  )
}
