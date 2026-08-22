'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { toast } from 'sonner'
import {
  LayoutDashboard, IndianRupee, ClipboardList, CreditCard,
  Users, Settings, User, LogOut, Menu, X, ChevronRight,
  Handshake, UserSearch, Ticket, SlidersHorizontal,
} from 'lucide-react'
import { useAuth } from '@/lib/auth/auth-provider'
import { getDashboardNav } from '@/config/navigation'
import { ROLE_LABELS } from '@/config/roles'
import { siteConfig } from '@/config/site'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

const ICON_MAP = {
  LayoutDashboard,
  IndianRupee,
  ClipboardList,
  CreditCard,
  Users,
  Settings,
  User,
  Handshake,
  UserSearch,
  Ticket,
  SlidersHorizontal,
} as const

type IconName = keyof typeof ICON_MAP

export function AppSidebar() {
  const { user, logout } = useAuth()
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  if (!user) return null

  const navItems = getDashboardNav(user.role)

  async function handleLogout() {
    await logout()
    toast.success('Signed out successfully.')
  }

  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 inset-x-0 z-40 h-14 bg-sidebar flex items-center justify-between px-4 border-b border-sidebar-border">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/assets/branding/club-logo.jpeg" alt={siteConfig.nameEn} width={28} height={28} className="rounded-sm bg-white/10 p-0.5" />
          <span className="font-semibold text-sidebar-foreground text-sm">{siteConfig.nav.appName}</span>
        </Link>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
          className="text-sidebar-foreground hover:bg-sidebar-accent"
        >
          {mobileOpen ? <X className="size-4" /> : <Menu className="size-4" />}
        </Button>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-30 bg-black/50"
          onClick={() => setMobileOpen(false)}
          aria-hidden
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-40 h-full w-64 bg-sidebar flex flex-col border-r border-sidebar-border transition-transform duration-200',
          'lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        {/* Header */}
        <div className="flex items-center gap-2.5 h-16 px-5 border-b border-sidebar-border shrink-0">
          <Image
            src="/assets/branding/club-logo.jpeg"
            alt={siteConfig.nameEn}
            width={32}
            height={32}
            className="rounded-sm bg-white/10 p-0.5 shrink-0"
          />
          <div className="min-w-0">
            <p className="text-sidebar-foreground font-semibold text-sm truncate">{siteConfig.nav.appName}</p>
            <p className="text-sidebar-foreground/40 text-[10px] truncate">{siteConfig.fullName}</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3" aria-label="App navigation">
          <ul className="flex flex-col gap-0.5">
            {navItems.map(({ label, href, iconName }) => {
              const Icon = ICON_MAP[iconName as IconName] ?? User
              const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
              return (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group',
                      active
                        ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-sm'
                        : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground',
                    )}
                    aria-current={active ? 'page' : undefined}
                  >
                    <Icon className={cn('size-4 shrink-0', active ? 'text-inherit' : 'text-sidebar-foreground/50 group-hover:text-sidebar-foreground')} />
                    <span>{label}</span>
                    {active && <ChevronRight className="size-3 ml-auto opacity-60" />}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* User / Logout */}
        <div className="border-t border-sidebar-border p-3 shrink-0">
          <div className="flex items-center gap-3 px-2 py-2 rounded-lg mb-1">
            <Avatar className="size-8 shrink-0 bg-sidebar-accent">
              <AvatarFallback className="text-xs text-sidebar-foreground/80 font-semibold bg-sidebar-accent">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="text-sidebar-foreground text-xs font-semibold truncate">{user.name}</p>
              <p className="text-sidebar-foreground/40 text-[10px] truncate">{ROLE_LABELS[user.role]}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-destructive transition-all"
          >
            <LogOut className="size-4 shrink-0" />
            Sign out
          </button>
        </div>
      </aside>
    </>
  )
}
