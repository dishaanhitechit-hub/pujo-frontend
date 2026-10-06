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

export function buildDashboardNav(role: Role, canCollect?: boolean, perms?: string[]): DashboardNav {
  const isAdmin     = role === 'admin'
  const isOversight = OVERSIGHT_ROLES.includes(role)
  // Prefer the server-resolved effective permissions; fall back to role-based grants.
  const has = (perm: Parameters<typeof can>[1]) => perms ? perms.includes(perm) : can(role, perm)

  const standalone: DashboardNavItem[] = []
  const groups: NavGroup[] = []

  // ── Dashboard — standalone, top ──────────────────────────────────────────
  if (has('dashboard.view')) {
    standalone.push({ label: 'Dashboard', href: '/dashboard', iconName: 'LayoutDashboard' })
  }

  // ── Profile group ─────────────────────────────────────────────────────────
  const profileItems: DashboardNavItem[] = []
  profileItems.push({ label: 'My Profile', href: '/profile', iconName: 'User' })

  if (has('users.manage')) {
    profileItems.push({ label: 'Users',         href: '/admin/users',         iconName: 'Users' })
    profileItems.push({ label: 'Contact Diary', href: '/admin/contact-diary', iconName: 'BookUser' })
  }

  // Admins manage the committee; everyone else gets the read-only committee view.
  if (has('content.manage')) {
    profileItems.push({ label: 'Committee', href: '/admin/committee', iconName: 'Users2' })
  } else {
    profileItems.push({ label: 'Committee', href: '/committee', iconName: 'Users2' })
  }

  if (!isAdmin) {
    profileItems.push({ label: 'My Contributions', href: '/my-contributions', iconName: 'HeartHandshake' })
  }

  groups.push({ id: 'profile', label: 'Profile', iconName: 'User', items: profileItems })

  // ── Events group ──────────────────────────────────────────────────────────
  const eventItems: DashboardNavItem[] = []

  if (has('event.manage')) {
    eventItems.push({ label: 'Events', href: '/admin/events', iconName: 'Calendar' })
    eventItems.push({ label: 'Budget', href: '/admin/budgets', iconName: 'Wallet' })
  } else {
    eventItems.push({ label: 'Events', href: '/event-overview', iconName: 'Calendar' })
  }

  if (has('expense.manage')) {
    eventItems.push({ label: 'Expenses', href: '/admin/expenses', iconName: 'Receipt' })
  }

  if (has('meeting.manage')) {
    eventItems.push({ label: 'Meetings',     href: '/admin/meetings',     iconName: 'Users2' })
    eventItems.push({ label: 'Action Plans', href: '/admin/action-plans', iconName: 'ClipboardList' })
  } else {
    eventItems.push({ label: 'Meetings',            href: '/meetings',     iconName: 'CalendarCheck' })
    eventItems.push({ label: 'My Responsibilities', href: '/action-plan',  iconName: 'ClipboardList' })
  }

  // Merged contributions page (Members review + All Payments tabs). Admins get it here;
  // non-admin finance roles get it in the Payments group below (avoids duplication).
  if (isAdmin && has('payment.view_all')) {
    eventItems.push({ label: 'Contributions', href: '/admin/contributions', iconName: 'HeartHandshake' })
    eventItems.push({ label: 'Donors',        href: '/donors',              iconName: 'UserSearch' })
  }

  // Admins get Handover Approvals here (the Payments group below is non-admin only).
  if (isAdmin && has('handover.manage')) {
    eventItems.push({ label: 'Handover Approvals', href: '/admin/handovers', iconName: 'HandCoins' })
  }

  if (isAdmin && (has('token.view') || has('token.generate'))) {
    eventItems.push({ label: 'Tokens', href: '/tokens', iconName: 'Ticket' })
  }

  if (has('users.manage')) {
    eventItems.push({ label: 'Token Config', href: '/admin/token-config', iconName: 'SlidersHorizontal' })
  }

  groups.push({ id: 'events', label: 'Events', iconName: 'Calendar', items: eventItems })

  // ── Circulars group ───────────────────────────────────────────────────────
  const circularItems: DashboardNavItem[] = []

  if (has('content.manage')) {
    circularItems.push({ label: 'Circulars',     href: '/admin/circulars',     iconName: 'ScrollText' })
    circularItems.push({ label: 'Announcements', href: '/admin/announcements', iconName: 'Megaphone' })
  } else {
    circularItems.push({ label: 'Circulars',     href: '/circulars',     iconName: 'ScrollText' })
    circularItems.push({ label: 'Announcements', href: '/announcements', iconName: 'Megaphone' })
  }

  groups.push({ id: 'circulars', label: 'Circulars', iconName: 'ScrollText', items: circularItems })

  // ── Payments group (non-admin only) ───────────────────────────────────────
  if (!isAdmin) {
    const paymentItems: DashboardNavItem[] = []

    if (canCollect) {
      paymentItems.push({ label: 'Contribution Slip', href: '/collect',        iconName: 'IndianRupee' })
      paymentItems.push({ label: 'My Collections',  href: '/my-collections', iconName: 'ClipboardList' })
      paymentItems.push({ label: 'Cash Handover',   href: '/handovers',      iconName: 'HandCoins' })
    }

    if (has('handover.manage')) {
      paymentItems.push({ label: 'Handover Approvals', href: '/admin/handovers', iconName: 'HandCoins' })
    }

    // Org-wide contributions/donors are for finance roles only — collectors use My Collections.
    if (has('payment.view_all')) {
      paymentItems.push({ label: 'Contributions', href: '/admin/contributions', iconName: 'HeartHandshake' })
      paymentItems.push({ label: 'Donors',        href: '/donors',              iconName: 'UserSearch' })
    }

    if (has('token.view') || has('token.generate')) {
      paymentItems.push({ label: 'Tokens', href: '/tokens', iconName: 'Ticket' })
    }

    if (paymentItems.length > 0) {
      groups.push({ id: 'payments', label: 'Donations', iconName: 'IndianRupee', items: paymentItems })
    }
  }

  // ── Settings group (admin only) ───────────────────────────────────────────
  if (has('users.manage')) {
    const settingsItems: DashboardNavItem[] = [
      { label: 'Config',       href: '/admin/config',       iconName: 'Settings' },
      { label: 'Organisation', href: '/admin/org-settings', iconName: 'Building2' },
    ]

    if (has('content.manage')) {
      settingsItems.push({ label: 'Contact Queries', href: '/admin/contact-queries', iconName: 'MessageSquare' })
    }

    groups.push({ id: 'settings', label: 'Settings', iconName: 'Settings', items: settingsItems })
  }

  return { standalone, groups }
}
