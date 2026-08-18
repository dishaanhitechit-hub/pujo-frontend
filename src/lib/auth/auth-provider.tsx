'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import type { User } from '@/types'
import { login as apiLogin, logout as apiLogout, getMe } from '@/lib/api/auth'
import { saveAuth, clearAuth, getStoredToken, getStoredUser } from '@/lib/storage'
import type { LoginInput } from '@/lib/api/auth'

interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
}

interface AuthContextValue extends AuthState {
  login: (input: LoginInput) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Lazy initializer reads localStorage synchronously so no effect is needed
  // for the initial token/cache check — avoids cascading renders.
  // Guard for SSR: localStorage doesn't exist during server-side prerendering.
  const [state, setState] = useState<AuthState>(() => {
    if (typeof window === 'undefined') {
      return { user: null, isLoading: false, isAuthenticated: false }
    }
    const token = getStoredToken()
    if (!token) return { user: null, isLoading: false, isAuthenticated: false }
    const cached = getStoredUser()
    if (cached) return { user: cached, isLoading: false, isAuthenticated: true }
    return { user: null, isLoading: true, isAuthenticated: false }
  })

  const setUser = (user: User | null) =>
    setState({ user, isLoading: false, isAuthenticated: !!user })

  useEffect(() => {
    const token = getStoredToken()
    if (!token) return
    // Validate token with server; cached user shown optimistically while waiting.
    getMe()
      .then(setUser)
      .catch(() => {
        clearAuth()
        setState({ user: null, isLoading: false, isAuthenticated: false })
      })
  }, [])

  const login = useCallback(async (input: LoginInput) => {
    const { accessToken, user } = await apiLogin(input)
    saveAuth(accessToken, user)
    setState({ user, isLoading: false, isAuthenticated: true })
  }, [])

  const logout = useCallback(async () => {
    try {
      await apiLogout()
    } catch {}
    clearAuth()
    setState({ user: null, isLoading: false, isAuthenticated: false })
  }, [])

  const refreshUser = useCallback(async () => {
    const user = await getMe()
    setUser(user)
  }, [])

  return (
    <AuthContext.Provider value={{ ...state, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
