'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { KeyRound, Loader2, MailCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AuthShell } from '@/components/shared/AuthShell'
import { OrgCodeField, useOrgOptions } from '@/components/shared/OrgCodeField'
import { PasswordInput } from '@/components/shared/PasswordInput'
import { useAuth } from '@/lib/auth/auth-provider'
import { getDefaultRoute } from '@/config/roles'
import { requestPasswordReset, resetPassword } from '@/lib/api/auth'
import type { ApiError } from '@/types'

// Must match the backend: code lifetime and per-account resend cooldown.
const CODE_TTL_SECONDS = 5 * 60
const RESEND_COOLDOWN_SECONDS = 60

const requestSchema = z.object({
  email:   z.string().email('Enter a valid email'),
  orgCode: z.string().min(1, 'Select or enter your organisation code'),
})
type RequestData = z.infer<typeof requestSchema>

const resetSchema = z
  .object({
    otp:             z.string().length(6, 'Code must be 6 digits').regex(/^\d+$/, 'Digits only'),
    newPassword:     z.string().min(8, 'At least 8 characters').max(128, 'At most 128 characters'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })
type ResetData = z.infer<typeof resetSchema>

export default function ForgotPasswordPage() {
  return (
    <Suspense>
      <ForgotPasswordContent />
    </Suspense>
  )
}

function useCountdown(): [number, (seconds: number) => void] {
  const [endsAt, setEndsAt] = useState<number | null>(null)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (endsAt === null) return
    const id = setInterval(() => {
      const t = Date.now()
      setNow(t)
      if (t >= endsAt) clearInterval(id)
    }, 1000)
    return () => clearInterval(id)
  }, [endsAt])

  const remaining = endsAt === null ? 0 : Math.max(0, Math.ceil((endsAt - now) / 1000))
  const start = (seconds: number) => {
    const t = Date.now()
    setNow(t)
    setEndsAt(t + seconds * 1000)
  }
  return [remaining, start]
}

function fmtClock(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
}

function maskEmail(email: string): string {
  const [local, domain] = email.split('@')
  if (!domain) return email
  return `${local.slice(0, 2)}${'*'.repeat(Math.max(1, local.length - 2))}@${domain}`
}

function ForgotPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { setSession } = useAuth()
  const orgs = useOrgOptions()

  const [step, setStep]       = useState<'request' | 'reset'>('request')
  const [account, setAccount] = useState<RequestData | null>(null)
  const [sending, setSending] = useState(false)
  const [expiresIn, startExpiry] = useCountdown()
  const [resendIn, startResend]  = useCountdown()

  const requestForm = useForm<RequestData>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      email:   searchParams.get('email') ?? '',
      orgCode: searchParams.get('orgCode') ?? '',
    },
  })
  const resetForm = useForm<ResetData>({ resolver: zodResolver(resetSchema) })

  // Arrived from the login page with an email but no org code — offer that email's orgs.
  useEffect(() => {
    const email = searchParams.get('email')
    if (!email || searchParams.get('orgCode')) return
    orgs.lookup(email).then((found) => {
      if (found.length === 1) requestForm.setValue('orgCode', found[0].orgCode)
    })
  }, [searchParams, orgs.lookup, requestForm])

  async function onEmailBlur() {
    const found = await orgs.lookup(requestForm.getValues('email'))
    if (found.length === 1) {
      requestForm.setValue('orgCode', found[0].orgCode, { shouldValidate: true })
    }
  }

  async function sendCode(data: RequestData) {
    setSending(true)
    try {
      const message = await requestPasswordReset({
        email:   data.email.trim().toLowerCase(),
        orgCode: data.orgCode.trim().toUpperCase(),
      })
      setAccount(data)
      setStep('reset')
      resetForm.reset()
      startExpiry(CODE_TTL_SECONDS)
      startResend(RESEND_COOLDOWN_SECONDS)
      toast.success(message)
    } catch (err) {
      toast.error((err as ApiError)?.message ?? 'Could not send the code. Please try again.')
    } finally {
      setSending(false)
    }
  }

  async function onReset(data: ResetData) {
    if (!account) return
    try {
      const result = await resetPassword({
        email:       account.email.trim().toLowerCase(),
        orgCode:     account.orgCode.trim().toUpperCase(),
        otpCode:     data.otp,
        newPassword: data.newPassword,
      })
      setSession(result.accessToken, result.user)
      toast.success('Password changed. You are now signed in.')
      router.replace(getDefaultRoute(result.user.role))
    } catch (err) {
      toast.error((err as ApiError)?.message ?? 'Could not reset the password. Please try again.')
    }
  }

  if (step === 'request') {
    const { errors, isSubmitting } = requestForm.formState
    return (
      <AuthShell>
        <div className="mb-8 flex items-start gap-3">
          <div className="size-10 rounded-xl bg-brand-orange/10 flex items-center justify-center shrink-0 mt-0.5">
            <KeyRound className="size-5 text-brand-orange" />
          </div>
          <div>
            <h2 className="font-heading font-bold text-2xl text-brand-navy">Forgot password?</h2>
            <p className="text-muted-foreground text-sm mt-1">
              Enter your email and organisation code. We&apos;ll email you a 6-digit code.
            </p>
          </div>
        </div>

        <form onSubmit={requestForm.handleSubmit(sendCode)} noValidate className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Email address</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              aria-invalid={!!errors.email}
              {...requestForm.register('email', { onBlur: onEmailBlur })}
            />
            {errors.email && <p className="text-xs text-destructive" role="alert">{errors.email.message}</p>}
          </div>

          <OrgCodeField
            registration={requestForm.register('orgCode')}
            options={orgs.options}
            fetching={orgs.fetching}
            onSelect={(code) => requestForm.setValue('orgCode', code, { shouldValidate: true })}
            error={errors.orgCode?.message}
          />

          <Button
            type="submit"
            className="w-full bg-brand-orange hover:bg-brand-orange/90 text-white h-10 font-semibold"
            disabled={isSubmitting || sending}
          >
            {(isSubmitting || sending) && <Loader2 className="size-4 animate-spin mr-2" />}
            {isSubmitting || sending ? 'Sending…' : 'Send code'}
          </Button>

          <Link href="/login" className="text-xs text-muted-foreground hover:text-brand-orange transition-colors text-center">
            ← Back to sign in
          </Link>
        </form>
      </AuthShell>
    )
  }

  const { errors, isSubmitting } = resetForm.formState
  const expired = expiresIn === 0
  return (
    <AuthShell>
      <div className="mb-6 flex items-start gap-3">
        <div className="size-10 rounded-xl bg-brand-orange/10 flex items-center justify-center shrink-0 mt-0.5">
          <MailCheck className="size-5 text-brand-orange" />
        </div>
        <div>
          <h2 className="font-heading font-bold text-2xl text-brand-navy">Check your email</h2>
          <p className="text-muted-foreground text-sm mt-1">
            If an account matches, we sent a 6-digit code to{' '}
            <span className="font-semibold text-foreground">{account ? maskEmail(account.email) : ''}</span>.
          </p>
        </div>
      </div>

      <div className="mb-5 flex items-center justify-between gap-3 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
        <span className="min-w-0 truncate">
          {account?.email} · <span className="font-mono font-semibold">{account?.orgCode.toUpperCase()}</span>
        </span>
        <button
          type="button"
          onClick={() => setStep('request')}
          className="text-xs font-semibold text-amber-900 hover:underline shrink-0"
        >
          Change
        </button>
      </div>

      <form onSubmit={resetForm.handleSubmit(onReset)} noValidate className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="otp">6-digit code</Label>
            <span className={expired ? 'text-xs font-medium text-destructive' : 'text-xs text-muted-foreground tabular-nums'}>
              {expired ? 'Code expired — request a new one' : `Expires in ${fmtClock(expiresIn)}`}
            </span>
          </div>
          <Input
            id="otp"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="Code from your email"
            maxLength={6}
            className="font-mono tracking-[0.4em]"
            aria-invalid={!!errors.otp}
            {...resetForm.register('otp')}
          />
          {errors.otp && <p className="text-xs text-destructive" role="alert">{errors.otp.message}</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="newPassword">New password</Label>
          <PasswordInput
            id="newPassword"
            autoComplete="new-password"
            placeholder="Min. 8 characters"
            aria-invalid={!!errors.newPassword}
            {...resetForm.register('newPassword')}
          />
          {errors.newPassword && <p className="text-xs text-destructive" role="alert">{errors.newPassword.message}</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="confirmPassword">Confirm new password</Label>
          <PasswordInput
            id="confirmPassword"
            autoComplete="new-password"
            placeholder="Repeat new password"
            aria-invalid={!!errors.confirmPassword}
            {...resetForm.register('confirmPassword')}
          />
          {errors.confirmPassword && <p className="text-xs text-destructive" role="alert">{errors.confirmPassword.message}</p>}
        </div>

        <Button
          type="submit"
          className="w-full bg-brand-orange hover:bg-brand-orange/90 text-white h-10 font-semibold"
          disabled={isSubmitting || expired}
        >
          {isSubmitting && <Loader2 className="size-4 animate-spin mr-2" />}
          {isSubmitting ? 'Resetting…' : 'Reset password'}
        </Button>

        <button
          type="button"
          onClick={() => account && sendCode(account)}
          disabled={resendIn > 0 || sending}
          className="text-xs font-medium text-brand-orange hover:underline disabled:text-muted-foreground disabled:no-underline disabled:cursor-not-allowed text-center"
        >
          {sending ? 'Sending…' : resendIn > 0 ? `Resend code in ${fmtClock(resendIn)}` : 'Resend code'}
        </button>

        <Link href="/login" className="text-xs text-muted-foreground hover:text-brand-orange transition-colors text-center">
          ← Back to sign in
        </Link>
      </form>
    </AuthShell>
  )
}
