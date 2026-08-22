import type { Role } from '@/types'
import { can } from '@/config/roles'

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

export function getDashboardNav(role: Role): DashboardNavItem[] {
  const items: DashboardNavItem[] = []

  if (can(role, 'dashboard.view')) {
    items.push({ label: 'Dashboard', href: '/dashboard', iconName: 'LayoutDashboard' })
  }

  if (can(role, 'payment.initiate')) {
    items.push({ label: 'Collect Payment', href: '/collect', iconName: 'IndianRupee' })
  }

  if (can(role, 'collector.view_own')) {
    items.push({ label: 'My Collections', href: '/my-collections', iconName: 'ClipboardList' })
  }

  if (can(role, 'dashboard.view')) {
    items.push({ label: 'All Payments', href: '/payments', iconName: 'CreditCard' })
    items.push({ label: 'Pledges', href: '/pledges', iconName: 'Handshake' })
    items.push({ label: 'Donors', href: '/donors', iconName: 'UserSearch' })
  } else if (can(role, 'payment.initiate')) {
    items.push({ label: 'Pledges', href: '/pledges', iconName: 'Handshake' })
  }

  if (can(role, 'token.view') || can(role, 'token.generate')) {
    items.push({ label: 'Tokens', href: '/tokens', iconName: 'Ticket' })
  }

  if (can(role, 'users.manage')) {
    items.push({ label: 'Users', href: '/admin/users', iconName: 'Users' })
    items.push({ label: 'Token Config', href: '/admin/token-config', iconName: 'SlidersHorizontal' })
    items.push({ label: 'Settings', href: '/admin/config', iconName: 'Settings' })
  }

  items.push({ label: 'Profile', href: '/profile', iconName: 'User' })

  return items
}
