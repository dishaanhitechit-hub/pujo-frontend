'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/lib/auth/auth-provider'
import { getDefaultRoute } from '@/config/roles'
import { siteConfig } from '@/config/site'
import type { ApiError } from '@/types'

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})

type FormData = z.infer<typeof schema>

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  )
}

function LoginContent() {
  const { login, isAuthenticated, isLoading, user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  // Redirect already-authenticated users away from /login
  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      const from = searchParams.get('from')
      const isValidFrom = from && from.startsWith('/') && from !== '/login'
      router.replace(isValidFrom ? from : getDefaultRoute(user.role))
    }
  }, [isAuthenticated, isLoading, user, router, searchParams])

  // Prevent login form flash while auth state is being determined or redirect is pending
  if (isLoading || isAuthenticated) return null

  async function onSubmit(data: FormData) {
    try {
      await login(data)
      const { getStoredUser } = await import('@/lib/storage')
      const loggedInUser = getStoredUser()
      const from = searchParams.get('from')
      const isValidFrom = from && from.startsWith('/') && from !== '/login'
      const redirect = isValidFrom ? from : (loggedInUser ? getDefaultRoute(loggedInUser.role) : '/collect')
      router.replace(redirect)
    } catch (err) {
      const apiErr = err as ApiError
      toast.error(apiErr?.message ?? 'Login failed. Please try again.')
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-gradient-to-br from-brand-navy via-[oklch(0.25_0.09_264.5)] to-[oklch(0.2_0.08_264.5)] p-12 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
          <div className="absolute top-1/3 right-0 w-96 h-96 rounded-full bg-brand-orange/5 blur-3xl" />
          <div className="absolute bottom-1/4 left-0 w-80 h-80 rounded-full bg-brand-pink/5 blur-3xl" />
        </div>
        <Link href="/" className="relative flex items-center gap-3">
          <Image src="/assets/branding/club-logo.jpeg" alt={siteConfig.nameEn} width={44} height={44} className="rounded-lg bg-white/5 p-0.5" />
          <div>
            <p className="font-bengali font-bold text-white text-lg">{siteConfig.name}</p>
            <p className="text-white/40 text-xs tracking-widest uppercase">Kolaghat</p>
          </div>
        </Link>
        <div className="relative">
          <p className="text-brand-orange/80 text-xs uppercase tracking-widest font-semibold mb-3">
            {siteConfig.nav.appName}
          </p>
          <h1 className="font-heading font-bold text-4xl text-white leading-tight mb-4">
            Member Portal
          </h1>
          <p className="text-white/60 text-base leading-relaxed">
            One place for collectors, admins, and committee members — manage donations,
            generate digital receipts, and keep the community's celebration running smoothly.
          </p>
        </div>
        <p className="relative text-white/25 text-xs">
          © {new Date().getFullYear()} {siteConfig.fullName}
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex flex-1 items-center justify-center p-6 sm:p-12 bg-white">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <Link href="/" className="lg:hidden flex items-center gap-2 mb-8">
            <Image src="/assets/branding/club-logo.jpeg" alt={siteConfig.nameEn} width={36} height={36} className="rounded-md" />
            <p className="font-bengali font-bold text-brand-navy">{siteConfig.name}</p>
          </Link>

          <div className="mb-8">
            <h2 className="font-heading font-bold text-2xl text-brand-navy">Welcome back</h2>
            <p className="text-muted-foreground text-sm mt-1">Sign in to your account to continue</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                aria-invalid={!!errors.email}
                {...register('email')}
              />
              {errors.email && (
                <p className="text-xs text-destructive" role="alert">{errors.email.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="pr-10"
                  aria-invalid={!!errors.password}
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-destructive" role="alert">{errors.password.message}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full bg-brand-orange hover:bg-brand-orange/90 text-white h-10 font-semibold"
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="size-4 animate-spin mr-2" />}
              {isSubmitting ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-border">
            <Link href="/" className="text-xs text-muted-foreground hover:text-brand-orange transition-colors">
              ← Back to public website
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
