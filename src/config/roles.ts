import type { Role } from '@/types'

export const ROLES = {
  ADMIN: 'admin' as const,
  EXECUTIVE: 'executive' as const,
  COMMITTEE: 'committee' as const,
  GENERAL: 'general' as const,
}

export const ROLE_LABELS: Record<Role, string> = {
  admin: 'Administrator',
  executive: 'Executive',
  committee: 'Committee Member',
  general: 'General Member',
}

type Permission =
  | 'payment.initiate'
  | 'payment.confirm'
  | 'payment.view_receipt'
  | 'collector.view_own'
  | 'dashboard.view'
  | 'users.manage'
  | 'permissions.manage'
  | 'admin.config'
  | 'token.generate'
  | 'token.bulk'
  | 'token.view'

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  admin: [
    'payment.initiate',
    'payment.confirm',
    'payment.view_receipt',
    'collector.view_own',
    'dashboard.view',
    'users.manage',
    'permissions.manage',
    'admin.config',
    'token.generate',
    'token.bulk',
    'token.view',
  ],
  executive: [
    'payment.initiate',
    'payment.confirm',
    'payment.view_receipt',
    'collector.view_own',
    'dashboard.view',
    'token.generate',
    'token.view',
  ],
  committee: [
    'payment.initiate',
    'payment.confirm',
    'payment.view_receipt',
    'collector.view_own',
    'token.generate',
  ],
  general: [
    'payment.initiate',
    'payment.confirm',
    'payment.view_receipt',
    'token.generate',
  ],
}

export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false
}

export function hasRole(userRole: Role, requiredRole: Role): boolean {
  const hierarchy: Role[] = ['general', 'committee', 'executive', 'admin']
  return hierarchy.indexOf(userRole) >= hierarchy.indexOf(requiredRole)
}

export function can(role: Role, permission: Permission): boolean {
  return hasPermission(role, permission)
}

export function getDefaultRoute(role: Role): string {
  if (can(role, 'dashboard.view')) return '/dashboard'
  if (can(role, 'collector.view_own')) return '/collect'
  return '/collect'
}
