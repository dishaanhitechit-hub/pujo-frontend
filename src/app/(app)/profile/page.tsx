'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth/auth-provider'
import { PageHeader } from '@/components/dashboard/PageHeader'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ActiveBadge } from '@/components/shared/StatusBadge'
import { ROLE_LABELS } from '@/config/roles'
import { getUserLoginQr } from '@/lib/api/users'
import { Loader2, Download, Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function ProfilePage() {
  const { user } = useAuth()
  const [qrUrl, setQrUrl] = useState<string | null>(null)
  const [qrLoading, setQrLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    let objectUrl: string
    getUserLoginQr(user.id)
      .then((url) => { objectUrl = url; setQrUrl(url) })
      .catch(() => {})
      .finally(() => setQrLoading(false))
    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl) }
  }, [user?.id])

  if (!user) return null

  const initials = user.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()

  const fields = [
    { label: 'Full Name',      value: user.name },
    { label: 'Email',          value: user.email },
    { label: 'Role',           value: ROLE_LABELS[user.role] },
    { label: 'Phone',          value: user.phone ?? '—' },
    { label: 'WhatsApp',       value: user.whatsappNo ?? '—' },
    { label: 'Account Status', value: <ActiveBadge isActive={user.isActive} /> },
    { label: 'Member Since',   value: new Date(user.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }) },
  ] as const

  function handleDownload() {
    if (!qrUrl) return
    const a = document.createElement('a')
    a.href = qrUrl
    a.download = `login-qr-${user.name.replace(/\s+/g, '-').toLowerCase()}.png`
    a.click()
  }

  function handlePrint() {
    if (!qrUrl) return
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
    <div className="p-6 lg:p-8 max-w-xl">
      <PageHeader title="Profile" subtitle="Your account information." className="mb-8" />

      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-br from-brand-navy to-[oklch(0.28_0.1_264.5)] p-6 flex items-center gap-4">
          <Avatar className="size-14 bg-sidebar-accent">
            <AvatarFallback className="font-bold text-xl text-white bg-brand-orange/30">{initials}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-heading font-bold text-white text-lg">{user.name}</p>
            <p className="text-white/60 text-sm">{ROLE_LABELS[user.role]}</p>
          </div>
        </div>

        {/* Fields */}
        <div className="divide-y divide-border">
          {fields.map(({ label, value }) => (
            <div key={label} className="flex items-start justify-between gap-6 px-5 py-4">
              <p className="text-sm text-muted-foreground font-medium">{label}</p>
              <div className="text-sm font-medium text-right">{value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Login QR Card */}
      <div className="mt-6 rounded-2xl border border-border bg-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <p className="font-heading font-bold text-base">Your Login QR</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Scan with the PujoPay app to auto-fill your email on sign-in
          </p>
        </div>

        <div className="p-6 flex flex-col items-center gap-4">
          {qrLoading && (
            <div className="size-[180px] flex items-center justify-center">
              <Loader2 className="size-7 animate-spin text-muted-foreground" />
            </div>
          )}
          {!qrLoading && qrUrl && (
            <>
              <img
                src={qrUrl}
                alt="Login QR"
                className="size-[180px] rounded-xl border border-border"
              />
              <div className="flex gap-3 w-full">
                <Button variant="outline" className="flex-1 gap-2" onClick={handlePrint}>
                  <Printer className="size-4" /> Print
                </Button>
                <Button
                  className="flex-1 gap-2 bg-brand-orange hover:bg-brand-orange/90 text-white"
                  onClick={handleDownload}
                >
                  <Download className="size-4" /> Download
                </Button>
              </div>
            </>
          )}
          {!qrLoading && !qrUrl && (
            <p className="text-sm text-muted-foreground">QR not available</p>
          )}
        </div>
      </div>
    </div>
  )
}
