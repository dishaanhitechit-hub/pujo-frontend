'use client'

import { useAuth } from '@/lib/auth/auth-provider'
import { PageHeader } from '@/components/dashboard/PageHeader'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ActiveBadge } from '@/components/shared/StatusBadge'
import { ROLE_LABELS } from '@/config/roles'

export default function ProfilePage() {
  const { user } = useAuth()

  if (!user) return null

  const initials = user.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()

  const fields = [
    { label: 'Full Name', value: user.name },
    { label: 'Email', value: user.email },
    { label: 'Role', value: ROLE_LABELS[user.role] },
    { label: 'Phone', value: user.phone ?? '—' },
    { label: 'WhatsApp', value: user.whatsappNo ?? '—' },
    { label: 'Account Status', value: <ActiveBadge isActive={user.isActive} /> },
    { label: 'Member Since', value: new Date(user.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }) },
  ] as const

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
    </div>
  )
}
