'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from './auth-provider'
import type { Role } from '@/types'
import { userCanCollect } from '@/config/roles'

interface RoleGuardProps {
  children: React.ReactNode
  permission?: string
  requiredRole?: Role
  /** When true, requires the user to have collection capability (canCollect). */
  requireCanCollect?: boolean
  fallback?: React.ReactNode
}

export function RoleGuard({ children, permission, requiredRole, requireCanCollect, fallback }: RoleGuardProps) {
  const { user } = useAuth()
  const router = useRouter()

  const permitted =
    !!user &&
    (!permission || (user.permissions ?? []).includes(permission)) &&
    (!requiredRole || user.role === requiredRole || user.role === 'admin') &&
    (!requireCanCollect || userCanCollect(user))

  useEffect(() => {
    if (user && !permitted && !fallback) {
      router.replace('/forbidden')
    }
  }, [user, permitted, fallback, router])

  if (!user) return null
  if (!permitted) return fallback ? <>{fallback}</> : null

  return <>{children}</>
}
