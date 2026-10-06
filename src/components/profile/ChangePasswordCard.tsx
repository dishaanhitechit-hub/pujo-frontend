'use client'

import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { KeyRound, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { PasswordInput } from '@/components/shared/PasswordInput'
import { useAuth } from '@/lib/auth/auth-provider'
import { changePassword } from '@/lib/api/auth'
import type { ApiError } from '@/types'

const schema = z
  .object({
    currentPassword: z.string().min(1, 'Enter your current password'),
    newPassword:     z.string().min(8, 'At least 8 characters').max(128, 'At most 128 characters'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })
  .refine((d) => d.newPassword !== d.currentPassword, {
    message: 'New password must be different from the current one',
    path: ['newPassword'],
  })
type FormData = z.infer<typeof schema>

export function ChangePasswordCard() {
  const { user, setSession } = useAuth()
  const form = useForm<FormData>({ resolver: zodResolver(schema) })
  const { errors, isSubmitting } = form.formState

  async function onSubmit(data: FormData) {
    try {
      const result = await changePassword({
        currentPassword: data.currentPassword,
        newPassword:     data.newPassword,
      })
      setSession(result.accessToken, result.user)
      form.reset()
      toast.success('Password changed. Other devices have been signed out.')
    } catch (err) {
      toast.error((err as ApiError)?.message ?? 'Could not change the password. Please try again.')
    }
  }

  const forgotHref = user?.email ? `/forgot-password?email=${encodeURIComponent(user.email)}` : '/forgot-password'

  return (
    <div className="rounded-2xl bg-white border border-border/60 overflow-hidden shadow-[0_1px_3px_0_rgb(0,0,0,0.04)]">
      <div className="px-5 py-4 border-b border-border/60">
        <div className="flex items-center gap-2">
          <KeyRound className="size-4 text-brand-orange" />
          <p className="font-heading font-bold text-sm text-brand-navy">Change password</p>
        </div>
        <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
          You stay signed in here; all other devices are signed out.
        </p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="p-5 flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="currentPassword">Current password</Label>
          <PasswordInput
            id="currentPassword"
            autoComplete="current-password"
            aria-invalid={!!errors.currentPassword}
            {...form.register('currentPassword')}
          />
          {errors.currentPassword && <p className="text-xs text-destructive" role="alert">{errors.currentPassword.message}</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="newPassword">New password</Label>
          <PasswordInput
            id="newPassword"
            autoComplete="new-password"
            placeholder="Min. 8 characters"
            aria-invalid={!!errors.newPassword}
            {...form.register('newPassword')}
          />
          {errors.newPassword && <p className="text-xs text-destructive" role="alert">{errors.newPassword.message}</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="confirmPassword">Confirm new password</Label>
          <PasswordInput
            id="confirmPassword"
            autoComplete="new-password"
            aria-invalid={!!errors.confirmPassword}
            {...form.register('confirmPassword')}
          />
          {errors.confirmPassword && <p className="text-xs text-destructive" role="alert">{errors.confirmPassword.message}</p>}
        </div>

        <Button
          type="submit"
          size="sm"
          className="bg-brand-navy hover:bg-brand-navy/90 text-white"
          disabled={isSubmitting}
        >
          {isSubmitting && <Loader2 className="size-3.5 animate-spin mr-1.5" />}
          {isSubmitting ? 'Saving…' : 'Change password'}
        </Button>

        <Link href={forgotHref} className="text-[11px] text-muted-foreground hover:text-brand-orange text-center">
          Forgot your current password?
        </Link>
      </form>
    </div>
  )
}
