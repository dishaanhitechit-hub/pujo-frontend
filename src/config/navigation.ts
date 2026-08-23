import type { Role } from '@/types'
import { can, OVERSIGHT_ROLES } from '@/config/roles'

export interface NavItem {
  label: string
  href: string
  icon?: string
}

export const publicNav: NavItem[] = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/about' },
  { label: 'Puja', href: '/puja' },
  { label: 'Events', href: '/events' },
  { label: 'Gallery', href: '/gallery' },
  { label: 'Committee', href: '/committee' },
  { label: 'Contact', href: '/contact' },
]

export interface DashboardNavItem {
  label: string
  href: string
  iconName: string
  permission?: Parameters<typeof can>[1]
}

export function getDashboardNav(role: Role, canCollect?: boolean): DashboardNavItem[] {
  const items: DashboardNavItem[] = []
  const isOversight = OVERSIGHT_ROLES.includes(role)

  if (can(role, 'dashboard.view')) {
    items.push({ label: 'Dashboard', href: '/dashboard', iconName: 'LayoutDashboard' })
  }

  // Collection navigation: oversight roles never collect regardless of canCollect flag
  if (!isOversight && canCollect) {
    items.push({ label: 'Collect Payment', href: '/collect', iconName: 'IndianRupee' })
    items.push({ label: 'My Collections', href: '/my-collections', iconName: 'ClipboardList' })
  }

  // Payment records: oversight roles see only the aggregate dashboard, not individual records
  if (!isOversight && can(role, 'dashboard.view')) {
    items.push({ label: 'All Payments', href: '/payments', iconName: 'CreditCard' })
    items.push({ label: 'Pledges', href: '/pledges', iconName: 'Handshake' })
    items.push({ label: 'Donors', href: '/donors', iconName: 'UserSearch' })
  } else if (!isOversight && can(role, 'payment.view_receipt')) {
    items.push({ label: 'Pledges', href: '/pledges', iconName: 'Handshake' })
  }

  if (can(role, 'token.view') || can(role, 'token.generate')) {
    items.push({ label: 'Tokens', href: '/tokens', iconName: 'Ticket' })
  }

  if (can(role, 'event.manage')) {
    items.push({ label: 'Events',  href: '/admin/events',  iconName: 'Calendar' })
    items.push({ label: 'Budget',  href: '/admin/budgets', iconName: 'Wallet' })
  } else {
    // All other authenticated users get a read-only events view
    items.push({ label: 'Events', href: '/event-overview', iconName: 'Calendar' })
  }

  if (can(role, 'expense.manage')) {
    items.push({ label: 'Expenses', href: '/admin/expenses', iconName: 'Receipt' })
  }

  if (!can(role, 'content.manage')) {
    items.push({ label: 'Announcements', href: '/announcements', iconName: 'Megaphone' })
  }

  if (can(role, 'content.manage')) {
    items.push({ label: 'Announcements', href: '/admin/announcements', iconName: 'Megaphone' })
    items.push({ label: 'Committee', href: '/admin/committee', iconName: 'Users2' })
    items.push({ label: 'Contact Queries', href: '/admin/contact-queries', iconName: 'MessageSquare' })
  }

  if (can(role, 'users.manage')) {
    items.push({ label: 'Users', href: '/admin/users', iconName: 'Users' })
    items.push({ label: 'Token Config', href: '/admin/token-config', iconName: 'SlidersHorizontal' })
    items.push({ label: 'Settings', href: '/admin/config', iconName: 'Settings' })
  }

  items.push({ label: 'Profile', href: '/profile', iconName: 'User' })

  return items
}
