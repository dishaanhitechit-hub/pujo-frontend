import type { Role } from '@/types'

export const ROLES = {
  ADMIN:               'admin' as const,
  MANAGING_COMMITTEE:  'managing_committee' as const,
  CORE_COMMITTEE:      'core_committee' as const,
  EXECUTIVE:           'executive' as const,
  CASHIER:             'cashier' as const,
  COLLECTOR:           'collector' as const,
  // Legacy — kept for backward compat
  COMMITTEE:           'committee' as const,
  GENERAL:             'general' as const,
}

export const ROLE_LABELS: Record<Role, string> = {
  admin:               'Administrator',
  managing_committee:  'Managing Committee Member',
  core_committee:      'Core Committee Member',
  executive:           'Executive Member',
  cashier:             'Cashier / Treasurer',
  collector:           'Collection Representative',
  // Legacy display labels
  committee:           'Committee Member',
  general:             'General Member',
}

/** Roles available in add/edit dropdowns — excludes legacy committee/general */
export const SELECTABLE_ROLES: Role[] = [
  'admin',
  'managing_committee',
  'core_committee',
  'executive',
  'cashier',
  'collector',
]

type Permission =
  | 'payment.initiate'
  | 'payment.confirm'
  | 'payment.view_receipt'
  | 'collector.view_own'
  | 'dashboard.view'
  | 'users.manage'
  | 'permissions.manage'
  | 'token.generate'
  | 'token.bulk'
  | 'token.view'
  | 'event.manage'
  | 'content.manage'
  | 'expense.manage'

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  admin: [
    'payment.confirm',
    'payment.view_receipt',
    'dashboard.view',
    'users.manage',
    'permissions.manage',
    'token.generate',
    'token.bulk',
    'token.view',
    'event.manage',
    'content.manage',
    'expense.manage',
  ],
  managing_committee: [
    'dashboard.view',
  ],
  core_committee: [
    'dashboard.view',
  ],
  executive: [
    'dashboard.view',
  ],
  cashier: [
    'payment.initiate',
    'payment.confirm',
    'payment.view_receipt',
    'collector.view_own',
    'dashboard.view',
    'expense.manage',
  ],
  collector: [
    'payment.initiate',
    'payment.confirm',
    'payment.view_receipt',
    'collector.view_own',
    'token.generate',
  ],
  // Legacy — mirrors old defaults
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
    'collector.view_own',
    'token.generate',
  ],
}

export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false
}

/** Check against the live permissions array from the API (preferred over role-based lookup). */
export function perm(permissions: string[], key: Permission | string): boolean {
  return permissions.includes(key)
}

export function hasRole(userRole: Role, requiredRole: Role): boolean {
  const hierarchy: Role[] = ['general', 'collector', 'committee', 'cashier', 'core_committee', 'executive', 'managing_committee', 'admin']
  return hierarchy.indexOf(userRole) >= hierarchy.indexOf(requiredRole)
}

export function can(role: Role, permission: Permission): boolean {
  return hasPermission(role, permission)
}

export function getDefaultRoute(role: Role): string {
  if (can(role, 'dashboard.view')) return '/dashboard'
  return '/collect'
}

// Oversight roles — attend meetings / review reports, never handle collections
const OVERSIGHT_ROLES: Role[] = ['managing_committee', 'executive', 'core_committee']

/**
 * Whether a user has collection capability.
 * - admin / oversight roles: never
 * - collector: always
 * - cashier + others: only when canCollect flag is explicitly true
 */
export function userCanCollect(user: { role: Role; canCollect?: boolean }): boolean {
  if (user.role === 'admin') return false
  if (OVERSIGHT_ROLES.includes(user.role)) return false
  if (user.role === 'collector') return true
  return user.canCollect === true
}

export { OVERSIGHT_ROLES }
