'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2, Eye, EyeOff, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { registerOrg } from '@/lib/api/org'
import { saveAuth } from '@/lib/storage'
import { siteConfig } from '@/config/site'
import type { ApiError } from '@/types'

const IN_MOBILE_RE = /^[6-9]\d{9}$/

const schema = z.object({
  orgName:         z.string().min(2, 'Organisation name must be at least 2 characters'),
  adminName:       z.string().min(2, 'Admin name is required'),
  email:           z.string().email('Enter a valid email'),
  phone:           z.string().regex(IN_MOBILE_RE, 'Enter a valid 10-digit Indian mobile number'),
  password:        z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

type FormData = z.infer<typeof schema>

export default function RegisterOrgPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  async function onSubmit(data: FormData) {
    try {
      const result = await registerOrg({
        orgName:   data.orgName,
        adminName: data.adminName,
        email:     data.email,
        phone:     data.phone,
        password:  data.password,
      })
      saveAuth(result.accessToken, result.user)
      toast.success(`Welcome! ${result.org.name} is ready.`)
      router.replace('/dashboard')
    } catch (err) {
      const apiErr = err as ApiError
      toast.error(apiErr?.message ?? 'Registration failed. Please try again.')
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left branding panel */}
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
            Get started
          </p>
          <h1 className="font-heading font-bold text-4xl text-white leading-tight mb-4">
            Register your organisation
          </h1>
          <p className="text-white/60 text-base leading-relaxed">
            Set up your club or committee on PujoPay. Once registered you get your own isolated
            workspace — events, donors, tokens, and members are all kept separate.
          </p>
        </div>
        <p className="relative text-white/25 text-xs">
          © {new Date().getFullYear()} {siteConfig.fullName}
        </p>
      </div>

      {/* Right form panel */}
      <div className="flex flex-1 items-center justify-center p-6 sm:p-12 bg-white overflow-y-auto">
        <div className="w-full max-w-md py-8">
          {/* Mobile logo */}
          <Link href="/" className="lg:hidden flex items-center gap-2 mb-8">
            <Image src="/assets/branding/club-logo.jpeg" alt={siteConfig.nameEn} width={36} height={36} className="rounded-md" />
            <p className="font-bengali font-bold text-brand-navy">{siteConfig.name}</p>
          </Link>

          <div className="mb-8 flex items-center gap-3">
            <div className="size-10 rounded-xl bg-brand-orange/10 flex items-center justify-center shrink-0">
              <Building2 className="size-5 text-brand-orange" />
            </div>
            <div>
              <h2 className="font-heading font-bold text-2xl text-brand-navy">New organisation</h2>
              <p className="text-muted-foreground text-sm">Create your workspace and admin account</p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
            {/* Org name */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="orgName">Organisation name</Label>
              <Input
                id="orgName"
                placeholder="e.g. Kalaghat Sarbojanin Durgotsav"
                aria-invalid={!!errors.orgName}
                {...register('orgName')}
              />
              {errors.orgName && <p className="text-xs text-destructive" role="alert">{errors.orgName.message}</p>}
            </div>

            <div className="border-t border-border pt-4 mt-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">Admin account</p>
            </div>

            {/* Admin name */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="adminName">Full name</Label>
              <Input
                id="adminName"
                placeholder="Your name"
                aria-invalid={!!errors.adminName}
                {...register('adminName')}
              />
              {errors.adminName && <p className="text-xs text-destructive" role="alert">{errors.adminName.message}</p>}
            </div>

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

            {/* Phone */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="phone">Mobile number</Label>
              <Input
                id="phone"
                type="tel"
                inputMode="numeric"
                placeholder="10-digit number"
                aria-invalid={!!errors.phone}
                {...register('phone')}
              />
              {errors.phone && <p className="text-xs text-destructive" role="alert">{errors.phone.message}</p>}
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Min. 8 characters"
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
              {errors.password && <p className="text-xs text-destructive" role="alert">{errors.password.message}</p>}
            </div>

            {/* Confirm password */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="confirmPassword">Confirm password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirm ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Repeat password"
                  className="pr-10"
                  aria-invalid={!!errors.confirmPassword}
                  {...register('confirmPassword')}
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
              {errors.confirmPassword && <p className="text-xs text-destructive" role="alert">{errors.confirmPassword.message}</p>}
            </div>

            <Button
              type="submit"
              className="w-full bg-brand-orange hover:bg-brand-orange/90 text-white h-10 font-semibold mt-2"
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="size-4 animate-spin mr-2" />}
              {isSubmitting ? 'Creating…' : 'Create organisation'}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-border flex items-center justify-between">
            <Link href="/login" className="text-xs text-muted-foreground hover:text-brand-orange transition-colors">
              ← Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
