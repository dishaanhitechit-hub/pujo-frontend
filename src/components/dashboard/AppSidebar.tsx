'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { toast } from 'sonner'
import {
  LayoutDashboard, IndianRupee, ClipboardList, CreditCard,
  Users, Settings, User, LogOut, Menu, X, ChevronDown,
  Handshake, UserSearch, Ticket, SlidersHorizontal, Calendar, MessageSquare,
  Megaphone, Users2, Wallet, Receipt, CalendarCheck, HeartHandshake,
  ScrollText, Building2, BookUser,
} from 'lucide-react'
import { useAuth } from '@/lib/auth/auth-provider'
import { buildDashboardNav } from '@/config/navigation'
import { ROLE_LABELS, userCanCollect } from '@/config/roles'
import { siteConfig } from '@/config/site'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

const ICON_MAP = {
  LayoutDashboard, IndianRupee, ClipboardList, CreditCard,
  Users, Settings, User,
  Handshake, UserSearch, Ticket, SlidersHorizontal, Calendar, MessageSquare,
  Megaphone, Users2, Wallet, Receipt, CalendarCheck, HeartHandshake,
  ScrollText, Building2, BookUser,
} as const

type IconName = keyof typeof ICON_MAP

function NavIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICON_MAP[name as IconName] ?? User
  return <Icon className={className} />
}

export function AppSidebar() {
  const { user, logout } = useAuth()
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({})

  const canCollect = user ? userCanCollect(user) : false
  const { standalone, groups } = user
    ? buildDashboardNav(user.role, canCollect)
    : { standalone: [], groups: [] }

  // Auto-open groups that contain the active route
  useEffect(() => {
    if (!user) return
    setOpenGroups((prev) => {
      const next = { ...prev }
      for (const g of groups) {
        const hasActive = g.items.some(
          (item) => pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href)),
        )
        if (hasActive) next[g.id] = true
      }
      return next
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, user])

  if (!user) return null

  function toggleGroup(id: string) {
    setOpenGroups((prev) => ({ ...prev, [id]: !prev[id] }))
  }

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

  function isActive(href: string) {
    return pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
  }

  const sidebarContent = (
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
      <nav className="flex-1 overflow-y-auto py-3 px-3" aria-label="App navigation">
        {/* Standalone items (Dashboard) */}
        {standalone.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group mb-0.5',
              isActive(item.href)
                ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-sm'
                : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground',
            )}
            aria-current={isActive(item.href) ? 'page' : undefined}
          >
            <NavIcon
              name={item.iconName}
              className={cn('size-4 shrink-0', isActive(item.href) ? 'text-inherit' : 'text-sidebar-foreground/50 group-hover:text-sidebar-foreground')}
            />
            <span>{item.label}</span>
          </Link>
        ))}

        {/* Grouped items */}
        <div className="flex flex-col gap-0.5 mt-1">
          {groups.map((group) => {
            const groupActive = group.items.some((i) => isActive(i.href))
            const isOpen = openGroups[group.id] ?? groupActive

            return (
              <div key={group.id}>
                {/* Group header */}
                <button
                  type="button"
                  onClick={() => toggleGroup(group.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold uppercase tracking-wide transition-all',
                    groupActive
                      ? 'text-sidebar-foreground'
                      : 'text-sidebar-foreground/40 hover:text-sidebar-foreground/70 hover:bg-sidebar-accent/50',
                  )}
                >
                  <NavIcon
                    name={group.iconName}
                    className={cn('size-3.5 shrink-0', groupActive ? 'text-sidebar-foreground/70' : 'text-sidebar-foreground/30')}
                  />
                  <span className="flex-1 text-left">{group.label}</span>
                  <ChevronDown
                    className={cn(
                      'size-3 shrink-0 transition-transform duration-150',
                      isOpen ? 'rotate-0' : '-rotate-90',
                      groupActive ? 'text-sidebar-foreground/50' : 'text-sidebar-foreground/25',
                    )}
                  />
                </button>

                {/* Group items */}
                {isOpen && (
                  <div className="ml-3 pl-3 border-l border-sidebar-border/40 flex flex-col gap-0.5 mt-0.5 mb-1">
                    {group.items.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                          'flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm font-medium transition-all group',
                          isActive(item.href)
                            ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-sm'
                            : 'text-sidebar-foreground/65 hover:bg-sidebar-accent hover:text-sidebar-foreground',
                        )}
                        aria-current={isActive(item.href) ? 'page' : undefined}
                      >
                        <NavIcon
                          name={item.iconName}
                          className={cn('size-3.5 shrink-0', isActive(item.href) ? 'text-inherit' : 'text-sidebar-foreground/40 group-hover:text-sidebar-foreground/70')}
                        />
                        <span>{item.label}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
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
  )

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

      {sidebarContent}
    </>
  )
}
