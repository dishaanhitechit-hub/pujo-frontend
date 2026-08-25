import type { Role } from '@/types'
import { OVERSIGHT_ROLES } from '@/config/roles'

export interface NavItem {
  label: string
  href: string
  icon?: string
}

export const publicNav: NavItem[] = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/about' },
  { label: 'Upcoming', href: '/upcoming' },
  { label: 'Events', href: '/events' },
  { label: 'Gallery', href: '/gallery' },
  { label: 'Committee', href: '/committee' },
  { label: 'Contact', href: '/contact' },
]

export interface DashboardNavItem {
  label: string
  href: string
  iconName: string
}

/**
 * Build the sidebar nav from the user's live permissions array (from API).
 * This is the strict RBAC path — no hardcoded role assumptions.
 */
export function getDashboardNav(
  role: Role,
  canCollect: boolean,
  permissions: string[],
): DashboardNavItem[] {
  const items: DashboardNavItem[] = []
  const has = (key: string) => permissions.includes(key)
  const isOversight = OVERSIGHT_ROLES.includes(role)

  if (has('dashboard.view')) {
    items.push({ label: 'Dashboard', href: '/dashboard', iconName: 'LayoutDashboard' })
  }

  // Oversight roles never collect regardless of canCollect flag
  if (!isOversight && canCollect && has('payment.initiate')) {
    items.push({ label: 'Collect Payment', href: '/collect', iconName: 'IndianRupee' })
    items.push({ label: 'My Collections', href: '/my-collections', iconName: 'ClipboardList' })
  }

  // Payment records only for non-oversight roles with dashboard access
  if (!isOversight && has('dashboard.view')) {
    items.push({ label: 'All Payments', href: '/payments', iconName: 'CreditCard' })
    items.push({ label: 'Pledges', href: '/pledges', iconName: 'Handshake' })
    items.push({ label: 'Donors', href: '/donors', iconName: 'UserSearch' })
  } else if (!isOversight && has('payment.view_receipt')) {
    items.push({ label: 'Pledges', href: '/pledges', iconName: 'Handshake' })
  }

  if (has('token.view') || has('token.generate')) {
    items.push({ label: 'Tokens', href: '/tokens', iconName: 'Ticket' })
  }

  if (has('event.manage')) {
    items.push({ label: 'Events',  href: '/admin/events',  iconName: 'Calendar' })
    items.push({ label: 'Budget',  href: '/admin/budgets', iconName: 'Wallet' })
  } else {
    items.push({ label: 'Events', href: '/event-overview', iconName: 'Calendar' })
  }

  if (has('expense.manage')) {
    items.push({ label: 'Expenses', href: '/admin/expenses', iconName: 'Receipt' })
  }

  if (has('content.manage')) {
    items.push({ label: 'Announcements', href: '/admin/announcements', iconName: 'Megaphone' })
    items.push({ label: 'Committee', href: '/admin/committee', iconName: 'Users2' })
    items.push({ label: 'Contact Queries', href: '/admin/contact-queries', iconName: 'MessageSquare' })
  } else {
    items.push({ label: 'Announcements', href: '/announcements', iconName: 'Megaphone' })
  }

  if (has('users.manage')) {
    items.push({ label: 'Users', href: '/admin/users', iconName: 'Users' })
    items.push({ label: 'Token Config', href: '/admin/token-config', iconName: 'SlidersHorizontal' })
    items.push({ label: 'Settings', href: '/admin/config', iconName: 'Settings' })
  }

  items.push({ label: 'Profile', href: '/profile', iconName: 'User' })

  return items
}
