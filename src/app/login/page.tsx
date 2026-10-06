'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2, Eye, EyeOff, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AuthShell } from '@/components/shared/AuthShell'
import { OrgCodeField, useOrgOptions } from '@/components/shared/OrgCodeField'
import { useAuth } from '@/lib/auth/auth-provider'
import { getDefaultRoute } from '@/config/roles'
import { firstSetup } from '@/lib/api/auth'
import type { ApiError } from '@/types'

// ── Step 1: email + orgCode + password ───────────────────────────────────────
const loginSchema = z.object({
  email:    z.string().email('Enter a valid email'),
  orgCode:  z.string().min(1, 'Select or enter your organisation code'),
  password: z.string().min(1, 'Password is required'),
})
type LoginData = z.infer<typeof loginSchema>

// ── Step 2: OTP + new password (SETUP_REQUIRED flow) ─────────────────────────
const setupSchema = z
  .object({
    otp:             z.string().length(6, 'OTP must be 6 digits').regex(/^\d+$/, 'Digits only'),
    newPassword:     z.string().min(8, 'New password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })
type SetupData = z.infer<typeof setupSchema>

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  )
}

function LoginContent() {
  const { login, setSession, isAuthenticated, isLoading, user } = useAuth()
  const router      = useRouter()
  const searchParams = useSearchParams()

  const [showPassword, setShowPassword] = useState(false)
  const [showNew, setShowNew]           = useState(false)
  const [showConfirm, setShowConfirm]   = useState(false)

  const [step, setStep]           = useState<'login' | 'setup'>('login')
  const [tempCreds, setTempCreds] = useState<{ email: string; password: string; orgCode: string } | null>(null)

  const orgs = useOrgOptions()

  const loginForm = useForm<LoginData>({ resolver: zodResolver(loginSchema) })
  const setupForm = useForm<SetupData>({ resolver: zodResolver(setupSchema) })

  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      const from = searchParams.get('from')
      const isValidFrom = from && from.startsWith('/') && from !== '/login'
      router.replace(isValidFrom ? from : getDefaultRoute(user.role))
    }
  }, [isAuthenticated, isLoading, user, router, searchParams])

  if (isLoading || isAuthenticated) return null

  async function onEmailBlur() {
    const found = await orgs.lookup(loginForm.getValues('email'))
    if (found.length === 1) {
      loginForm.setValue('orgCode', found[0].orgCode, { shouldValidate: true })
    }
  }

  function forgotPasswordHref() {
    const params = new URLSearchParams()
    const email = loginForm.getValues('email')?.trim()
    const orgCode = loginForm.getValues('orgCode')?.trim()
    if (email) params.set('email', email)
    if (orgCode) params.set('orgCode', orgCode)
    const qs = params.toString()
    return qs ? `/forgot-password?${qs}` : '/forgot-password'
  }

  async function onLoginSubmit(data: LoginData) {
    try {
      await login({ email: data.email, password: data.password, orgCode: data.orgCode })
      const { getStoredUser } = await import('@/lib/storage')
      const loggedInUser = getStoredUser()
      const from = searchParams.get('from')
      const isValidFrom = from && from.startsWith('/') && from !== '/login'
      router.replace(isValidFrom ? from : (loggedInUser ? getDefaultRoute(loggedInUser.role) : '/collect'))
    } catch (err) {
      const apiErr = err as ApiError
      if (apiErr?.fieldErrors?.code === 'SETUP_REQUIRED') {
        setTempCreds({ email: data.email, password: data.password, orgCode: data.orgCode })
        setStep('setup')
        return
      }
      toast.error(apiErr?.message ?? 'Login failed. Please try again.')
    }
  }

  async function onSetupSubmit(data: SetupData) {
    if (!tempCreds) return
    try {
      const result = await firstSetup({
        email:       tempCreds.email,
        password:    tempCreds.password,
        orgCode:     tempCreds.orgCode,
        otpCode:     data.otp,
        newPassword: data.newPassword,
      })
      setSession(result.accessToken, result.user)
      toast.success('Account set up! Welcome.')
      const from = searchParams.get('from')
      const isValidFrom = from && from.startsWith('/') && from !== '/login'
      router.replace(isValidFrom ? from : getDefaultRoute(result.user.role))
    } catch (err) {
      const apiErr = err as ApiError
      toast.error(apiErr?.message ?? 'Setup failed. Please check your OTP and try again.')
    }
  }

  return (
    <AuthShell>
          {step === 'login' ? (
            <>
              <div className="mb-8">
                <h2 className="font-heading font-bold text-2xl text-brand-navy">Welcome back</h2>
                <p className="text-muted-foreground text-sm mt-1">Sign in to your account to continue</p>
              </div>

              <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} noValidate className="flex flex-col gap-5">

                {/* Email */}
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="email">Email address</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    aria-invalid={!!loginForm.formState.errors.email}
                    {...loginForm.register('email', { onBlur: onEmailBlur })}
                  />
                  {loginForm.formState.errors.email && (
                    <p className="text-xs text-destructive" role="alert">{loginForm.formState.errors.email.message}</p>
                  )}
                </div>

                <OrgCodeField
                  registration={loginForm.register('orgCode')}
                  options={orgs.options}
                  fetching={orgs.fetching}
                  onSelect={(code) => loginForm.setValue('orgCode', code, { shouldValidate: true })}
                  error={loginForm.formState.errors.orgCode?.message}
                />

                {/* Password */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <button
                      type="button"
                      onClick={() => router.push(forgotPasswordHref())}
                      className="text-xs font-medium text-brand-orange hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      placeholder="••••••••"
                      className="pr-10"
                      aria-invalid={!!loginForm.formState.errors.password}
                      {...loginForm.register('password')}
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
                  {loginForm.formState.errors.password && (
                    <p className="text-xs text-destructive" role="alert">{loginForm.formState.errors.password.message}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full bg-brand-orange hover:bg-brand-orange/90 text-white h-10 font-semibold"
                  disabled={loginForm.formState.isSubmitting}
                >
                  {loginForm.formState.isSubmitting && <Loader2 className="size-4 animate-spin mr-2" />}
                  {loginForm.formState.isSubmitting ? 'Signing in…' : 'Sign in'}
                </Button>
              </form>
            </>
          ) : (
            <>
              <div className="mb-6 flex items-start gap-3">
                <div className="size-10 rounded-xl bg-brand-orange/10 flex items-center justify-center shrink-0 mt-0.5">
                  <ShieldCheck className="size-5 text-brand-orange" />
                </div>
                <div>
                  <h2 className="font-heading font-bold text-2xl text-brand-navy">Set up your account</h2>
                  <p className="text-muted-foreground text-sm mt-1">
                    Check your email for a 6-digit OTP and set a new password.
                  </p>
                </div>
              </div>

              <div className="mb-5 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
                Signing in as <span className="font-semibold">{tempCreds?.email}</span>
                {tempCreds?.orgCode && (
                  <span className="ml-1">· <span className="font-mono font-semibold">{tempCreds.orgCode}</span></span>
                )}
              </div>

              <form onSubmit={setupForm.handleSubmit(onSetupSubmit)} noValidate className="flex flex-col gap-5">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="otp">One-time code (OTP)</Label>
                  <Input
                    id="otp"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="6-digit code from your email"
                    maxLength={6}
                    aria-invalid={!!setupForm.formState.errors.otp}
                    {...setupForm.register('otp')}
                  />
                  {setupForm.formState.errors.otp && (
                    <p className="text-xs text-destructive" role="alert">{setupForm.formState.errors.otp.message}</p>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="newPassword">New password</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showNew ? 'text' : 'password'}
                      autoComplete="new-password"
                      placeholder="Min. 8 characters"
                      className="pr-10"
                      aria-invalid={!!setupForm.formState.errors.newPassword}
                      {...setupForm.register('newPassword')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew(!showNew)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      aria-label={showNew ? 'Hide password' : 'Show password'}
                    >
                      {showNew ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                  {setupForm.formState.errors.newPassword && (
                    <p className="text-xs text-destructive" role="alert">{setupForm.formState.errors.newPassword.message}</p>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="confirmPassword">Confirm new password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirm ? 'text' : 'password'}
                      autoComplete="new-password"
                      placeholder="Repeat new password"
                      className="pr-10"
                      aria-invalid={!!setupForm.formState.errors.confirmPassword}
                      {...setupForm.register('confirmPassword')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      aria-label={showConfirm ? 'Hide password' : 'Show password'}
                    >
                      {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                  {setupForm.formState.errors.confirmPassword && (
                    <p className="text-xs text-destructive" role="alert">{setupForm.formState.errors.confirmPassword.message}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full bg-brand-orange hover:bg-brand-orange/90 text-white h-10 font-semibold"
                  disabled={setupForm.formState.isSubmitting}
                >
                  {setupForm.formState.isSubmitting && <Loader2 className="size-4 animate-spin mr-2" />}
                  {setupForm.formState.isSubmitting ? 'Setting up…' : 'Activate account'}
                </Button>

                <button
                  type="button"
                  onClick={() => { setStep('login'); setTempCreds(null) }}
                  className="text-xs text-muted-foreground hover:text-brand-orange transition-colors text-center"
                >
                  ← Back to sign in
                </button>
              </form>
            </>
          )}

          {step === 'login' && (
            <div className="mt-8 pt-6 border-t border-border space-y-4">
              <Link
                href="/register-org"
                className="flex items-center justify-center gap-2 w-full h-10 rounded-md border border-brand-orange text-brand-orange text-sm font-semibold hover:bg-brand-orange/5 transition-colors"
              >
                Register new organisation
              </Link>
              <Link href="/" className="block text-xs text-muted-foreground hover:text-brand-orange transition-colors">
                ← Back to public website
              </Link>
            </div>
          )}
    </AuthShell>
  )
}
