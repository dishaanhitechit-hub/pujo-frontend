'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2, Eye, EyeOff, KeyRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { firstSetup } from '@/lib/api/auth'
import { saveAuth } from '@/lib/storage'
import { getDefaultRoute } from '@/config/roles'
import { siteConfig } from '@/config/site'
import type { ApiError } from '@/types'

const schema = z
  .object({
    email:       z.string().email('Enter a valid email'),
    password:    z.string().min(1, 'Temporary password is required'),
    otpCode:     z.string().length(6, 'Setup code must be 6 digits').regex(/^\d+$/, 'Setup code must be digits only'),
    orgCode:     z.string().min(3, 'Organisation code is required').max(20).regex(/^[A-Za-z0-9\-]+$/, 'Only letters, digits and hyphens allowed'),
    newPassword: z.string().min(6, 'New password must be at least 6 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type FormData = z.infer<typeof schema>

export default function FirstSetupPage() {
  return (
    <Suspense>
      <FirstSetupContent />
    </Suspense>
  )
}

function FirstSetupContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const emailFromQuery = searchParams.get('email') ?? ''

  const [showTemp, setShowTemp]       = useState(false)
  const [showNew, setShowNew]         = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: emailFromQuery },
  })

  async function onSubmit(data: FormData) {
    try {
      const { accessToken, user } = await firstSetup({
        email:       data.email,
        password:    data.password,
        otpCode:     data.otpCode,
        orgCode:     data.orgCode.trim().toUpperCase(),
        newPassword: data.newPassword,
      })
      saveAuth(accessToken, user)
      toast.success('Account activated! Welcome.')
      router.replace(getDefaultRoute(user.role))
    } catch (err) {
      const apiErr = err as ApiError
      toast.error(apiErr?.message ?? 'Setup failed. Please try again.')
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
            First-time setup
          </p>
          <h1 className="font-heading font-bold text-4xl text-white leading-tight mb-4">
            Activate your account
          </h1>
          <p className="text-white/60 text-base leading-relaxed">
            Enter the temporary password and the 6-digit one-time code from your welcome email,
            then set a new password you'll use from now on.
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
            <div className="flex items-center gap-2 mb-2">
              <KeyRound className="size-5 text-brand-orange" />
              <h2 className="font-heading font-bold text-2xl text-brand-navy">Account setup</h2>
            </div>
            <p className="text-muted-foreground text-sm">
              Check your welcome email for the temporary password and 6-digit setup code.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">

            {/* Email */}
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
              {errors.email && <p className="text-xs text-destructive" role="alert">{errors.email.message}</p>}
            </div>

            {/* Temp password */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">Temporary password <span className="text-muted-foreground font-normal">(from email)</span></Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showTemp ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="pr-10"
                  aria-invalid={!!errors.password}
                  {...register('password')}
                />
                <button type="button" onClick={() => setShowTemp(!showTemp)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showTemp ? 'Hide' : 'Show'}>
                  {showTemp ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-destructive" role="alert">{errors.password.message}</p>}
            </div>

            {/* OTP */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="otpCode">One-time setup code <span className="text-muted-foreground font-normal">(6 digits from email)</span></Label>
              <Input
                id="otpCode"
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="______"
                className="tracking-[0.4em] font-mono text-center text-lg"
                aria-invalid={!!errors.otpCode}
                {...register('otpCode')}
              />
              {errors.otpCode && <p className="text-xs text-destructive" role="alert">{errors.otpCode.message}</p>}
            </div>

            {/* Org code */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="orgCode">Organisation code <span className="text-muted-foreground font-normal">(from email)</span></Label>
              <Input
                id="orgCode"
                type="text"
                autoComplete="off"
                maxLength={20}
                placeholder="e.g. PUJA3847"
                className="tracking-widest font-mono uppercase"
                aria-invalid={!!errors.orgCode}
                {...register('orgCode')}
              />
              <p className="text-xs text-muted-foreground">Unique code assigned to your organisation — cannot be changed after activation.</p>
              {errors.orgCode && <p className="text-xs text-destructive" role="alert">{errors.orgCode.message}</p>}
            </div>

            <div className="border-t border-border pt-4 flex flex-col gap-4">
              {/* New password */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="newPassword">New password</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNew ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="Min. 6 characters"
                    className="pr-10"
                    aria-invalid={!!errors.newPassword}
                    {...register('newPassword')}
                  />
                  <button type="button" onClick={() => setShowNew(!showNew)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={showNew ? 'Hide' : 'Show'}>
                    {showNew ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                {errors.newPassword && <p className="text-xs text-destructive" role="alert">{errors.newPassword.message}</p>}
              </div>

              {/* Confirm password */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="confirmPassword">Confirm new password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirm ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="Repeat new password"
                    className="pr-10"
                    aria-invalid={!!errors.confirmPassword}
                    {...register('confirmPassword')}
                  />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={showConfirm ? 'Hide' : 'Show'}>
                    {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-xs text-destructive" role="alert">{errors.confirmPassword.message}</p>}
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-brand-orange hover:bg-brand-orange/90 text-white h-10 font-semibold"
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="size-4 animate-spin mr-2" />}
              {isSubmitting ? 'Activating…' : 'Activate account'}
            </Button>
          </form>

          <div className="mt-6 pt-5 border-t border-border">
            <Link href="/login" className="text-xs text-muted-foreground hover:text-brand-orange transition-colors">
              ← Back to login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
