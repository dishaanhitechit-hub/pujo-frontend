'use client'

import { useEffect } from 'react'
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

  const permitted =
    !!user &&
    (!permission || hasPermission(user.role, permission)) &&
    (!requiredRole || user.role === requiredRole || user.role === 'admin')

  useEffect(() => {
    if (user && !permitted && !fallback) {
      router.replace('/forbidden')
    }
  }, [user, permitted, fallback, router])

  if (!user) return null
  if (!permitted) return fallback ? <>{fallback}</> : null

  return <>{children}</>
}
