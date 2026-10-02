import type { Role } from '@/types'
import { can, OVERSIGHT_ROLES } from '@/config/roles'

export interface NavItem {
  label: string
  href: string
  icon?: string
}

export const publicNav: NavItem[] = [
  { label: 'Home',          href: '/' },
  { label: 'About',         href: '/about' },
  { label: 'Upcoming',      href: '/upcoming' },
  { label: 'Events',        href: '/events' },
  { label: 'Announcements', href: '/announcements-to-all' },
  { label: 'Gallery',       href: '/gallery' },
  { label: 'Our Team',      href: '/our-team' },
  { label: 'Contact',       href: '/contact' },
]

export interface DashboardNavItem {
  label: string
  href: string
  iconName: string
}

export interface NavGroup {
  id: string
  label: string
  iconName: string
  items: DashboardNavItem[]
}

export interface DashboardNav {
  /** Top-level items not inside any group (e.g. Dashboard) */
  standalone: DashboardNavItem[]
  groups: NavGroup[]
}

export function buildDashboardNav(role: Role, canCollect?: boolean): DashboardNav {
  const isAdmin     = role === 'admin'
  const isOversight = OVERSIGHT_ROLES.includes(role)

  const standalone: DashboardNavItem[] = []
  const groups: NavGroup[] = []

  // ── Dashboard — standalone, top ──────────────────────────────────────────
  if (can(role, 'dashboard.view')) {
    standalone.push({ label: 'Dashboard', href: '/dashboard', iconName: 'LayoutDashboard' })
  }

  // ── Profile group ─────────────────────────────────────────────────────────
  const profileItems: DashboardNavItem[] = []
  profileItems.push({ label: 'My Profile', href: '/profile', iconName: 'User' })

  if (can(role, 'users.manage')) {
    profileItems.push({ label: 'Users',         href: '/admin/users',         iconName: 'Users' })
    profileItems.push({ label: 'Contact Diary', href: '/admin/contact-diary', iconName: 'BookUser' })
  }

  if (can(role, 'content.manage')) {
    profileItems.push({ label: 'Committee', href: '/admin/committee', iconName: 'Users2' })
  }

  if (!isAdmin) {
    profileItems.push({ label: 'My Contributions', href: '/my-contributions', iconName: 'HeartHandshake' })
  }

  groups.push({ id: 'profile', label: 'Profile', iconName: 'User', items: profileItems })

  // ── Events group ──────────────────────────────────────────────────────────
  const eventItems: DashboardNavItem[] = []

  if (can(role, 'event.manage')) {
    eventItems.push({ label: 'Events', href: '/admin/events', iconName: 'Calendar' })
    eventItems.push({ label: 'Budget', href: '/admin/budgets', iconName: 'Wallet' })
  } else {
    eventItems.push({ label: 'Events', href: '/event-overview', iconName: 'Calendar' })
  }

  if (can(role, 'expense.manage')) {
    eventItems.push({ label: 'Expenses', href: '/admin/expenses', iconName: 'Receipt' })
  }

  if (can(role, 'meeting.manage')) {
    eventItems.push({ label: 'Meetings',     href: '/admin/meetings',     iconName: 'Users2' })
    eventItems.push({ label: 'Action Plans', href: '/admin/action-plans', iconName: 'ClipboardList' })
  } else {
    eventItems.push({ label: 'Meetings',            href: '/meetings',     iconName: 'CalendarCheck' })
    eventItems.push({ label: 'My Responsibilities', href: '/action-plan',  iconName: 'ClipboardList' })
  }

  if (can(role, 'content.manage')) {
    eventItems.push({ label: 'Contributions', href: '/admin/contributions', iconName: 'HeartHandshake' })
  }

  if (can(role, 'dashboard.view') && !isOversight && isAdmin) {
    eventItems.push({ label: 'All Payments', href: '/payments', iconName: 'CreditCard' })
    eventItems.push({ label: 'Donors',       href: '/donors',   iconName: 'UserSearch' })
  }

  if (isAdmin && (can(role, 'token.view') || can(role, 'token.generate'))) {
    eventItems.push({ label: 'Tokens', href: '/tokens', iconName: 'Ticket' })
  }

  if (can(role, 'users.manage')) {
    eventItems.push({ label: 'Token Config', href: '/admin/token-config', iconName: 'SlidersHorizontal' })
  }

  groups.push({ id: 'events', label: 'Events', iconName: 'Calendar', items: eventItems })

  // ── Circulars group ───────────────────────────────────────────────────────
  const circularItems: DashboardNavItem[] = []

  if (can(role, 'content.manage')) {
    circularItems.push({ label: 'Circulars',     href: '/admin/circulars',     iconName: 'ScrollText' })
    circularItems.push({ label: 'Announcements', href: '/admin/announcements', iconName: 'Megaphone' })
  } else {
    circularItems.push({ label: 'Circulars', href: '/circulars', iconName: 'ScrollText' })
  }

  groups.push({ id: 'circulars', label: 'Circulars', iconName: 'ScrollText', items: circularItems })

  // ── Payments group (non-admin only) ───────────────────────────────────────
  if (!isAdmin) {
    const paymentItems: DashboardNavItem[] = []

    if (canCollect) {
      paymentItems.push({ label: 'Collect Payment', href: '/collect',        iconName: 'IndianRupee' })
      paymentItems.push({ label: 'My Collections',  href: '/my-collections', iconName: 'ClipboardList' })
    }

    if (!isOversight && can(role, 'dashboard.view')) {
      paymentItems.push({ label: 'All Payments', href: '/payments', iconName: 'CreditCard' })
      paymentItems.push({ label: 'Donors',       href: '/donors',   iconName: 'UserSearch' })
    }

    if (can(role, 'token.view') || can(role, 'token.generate')) {
      paymentItems.push({ label: 'Tokens', href: '/tokens', iconName: 'Ticket' })
    }

    if (paymentItems.length > 0) {
      groups.push({ id: 'payments', label: 'Payments', iconName: 'IndianRupee', items: paymentItems })
    }
  }

  // ── Settings group (admin only) ───────────────────────────────────────────
  if (can(role, 'users.manage')) {
    const settingsItems: DashboardNavItem[] = [
      { label: 'Config',       href: '/admin/config',       iconName: 'Settings' },
      { label: 'Organisation', href: '/admin/org-settings', iconName: 'Building2' },
    ]

    if (can(role, 'content.manage')) {
      settingsItems.push({ label: 'Contact Queries', href: '/admin/contact-queries', iconName: 'MessageSquare' })
    }

    groups.push({ id: 'settings', label: 'Settings', iconName: 'Settings', items: settingsItems })
  }

  return { standalone, groups }
}

/** Legacy flat-list helper — kept so nothing else breaks */
export function getDashboardNav(role: Role, canCollect?: boolean): DashboardNavItem[] {
  const { standalone, groups } = buildDashboardNav(role, canCollect)
  return [...standalone, ...groups.flatMap(g => g.items)]
}
