'use client'

import { useRouter } from 'next/navigation'
import { useAuth } from './auth-provider'
import type { Role } from '@/types'
import { hasPermission } from '@/config/roles'

type Permission = Parameters<typeof hasPermission>[1]

interface RoleGuardProps {
  children: React.ReactNode
  permission?: Permission
  requiredRole?: Role
  fallback?: React.ReactNode
}

export function RoleGuard({ children, permission, requiredRole, fallback }: RoleGuardProps) {
  const { user } = useAuth()
  const router = useRouter()

  if (!user) return null

  const permitted =
    (!permission || hasPermission(user.role, permission)) &&
    (!requiredRole || user.role === requiredRole || user.role === 'admin')

  if (!permitted) {
    if (fallback) return <>{fallback}</>
    router.replace('/forbidden')
    return null
  }

  return <>{children}</>
}
