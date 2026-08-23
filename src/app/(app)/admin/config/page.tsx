'use client'

import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2, Settings, Phone, Mail, MapPin, Globe, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PageHeader } from '@/components/dashboard/PageHeader'
import { RoleGuard } from '@/lib/auth/role-guard'
import { getAdminConfig, updateAdminConfig } from '@/lib/api/admin'
import type { ApiError } from '@/types'
import { Skeleton } from '@/components/ui/skeleton'

function stripDialCode(val: string): string {
  return val.replace(/^\+91[\s-]?/, '').trim()
}

function withDialCode(val: string | undefined): string {
  const stripped = val?.trim() ? stripDialCode(val.trim()) : ''
  return stripped ? `+91 ${stripped}` : ''
}

const schema = z.object({
  upiId:           z.string().min(1, 'UPI ID is required'),
  orgName:         z.string().min(1, 'Organisation name is required'),
  contactPhone:    z.string().max(30).optional(),
  contactEmail:    z.string().max(150).optional(),
  contactWhatsapp: z.string().max(30).optional(),
  contactAddress:  z.string().max(300).optional(),
  socialFacebook:  z.string().max(300).optional(),
  socialInstagram: z.string().max(300).optional(),
  socialYoutube:   z.string().max(300).optional(),
})

type FormData = z.infer<typeof schema>

export default function AdminConfigPage() {
  return (
    <RoleGuard permission="users.manage">
      <ConfigContent />
    </RoleGuard>
  )
}

function ConfigContent() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  useEffect(() => {
    getAdminConfig()
      .then((res) => {
        const c = res.config
        reset({
          upiId:           c['upi_id']           ?? '',
          orgName:         c['org_name']          ?? '',
          contactPhone:    stripDialCode(c['contact.phone']    ?? ''),
          contactEmail:    c['contact.email']     ?? '',
          contactWhatsapp: stripDialCode(c['contact.whatsapp'] ?? ''),
          contactAddress:  c['contact.address']   ?? '',
          socialFacebook:  c['social.facebook']   ?? '',
          socialInstagram: c['social.instagram']  ?? '',
          socialYoutube:   c['social.youtube']    ?? '',
        })
      })
      .catch((err: ApiError) => setError(err.message ?? 'Failed to load configuration.'))
      .finally(() => setLoading(false))
  }, [reset])

  async function onSubmit(data: FormData) {
    try {
      await updateAdminConfig({
        ...data,
        contactPhone:    withDialCode(data.contactPhone),
        contactWhatsapp: withDialCode(data.contactWhatsapp),
      })
      reset(data)
      toast.success('Configuration saved successfully.')
    } catch (err) {
      toast.error((err as ApiError).message ?? 'Failed to save configuration.')
    }
  }

  if (error) {
    return (
      <div className="p-6 lg:p-8">
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">{error}</div>
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8 max-w-2xl">
      <PageHeader
        title="App Configuration"
        subtitle="Configure global settings, contact info, and social links."
        className="mb-8"
      />

      {loading ? (
        <div className="flex flex-col gap-5">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
          <Skeleton className="h-10 w-32" />
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-6">

          {/* Payment */}
          <Section icon={<Settings className="size-4 text-brand-orange" />} title="Payment Configuration">
            <Field label="UPI ID" required error={errors.upiId?.message}>
              <Input id="upi-id" placeholder="committee@upi" {...register('upiId')} aria-invalid={!!errors.upiId} />
            </Field>
            <Field label="Organisation Name" required error={errors.orgName?.message}
              hint="Shown on QR code pages and receipts.">
              <Input id="org-name" placeholder="Shatadal Durga Puja" {...register('orgName')} aria-invalid={!!errors.orgName} />
            </Field>
          </Section>

          {/* Contact */}
          <Section icon={<Phone className="size-4 text-brand-orange" />} title="Contact Information"
            hint="Shown on the public Contact page.">
            <Field label="Phone" error={errors.contactPhone?.message}>
              <PhoneInput id="c-phone" placeholder="98765 43210" {...register('contactPhone')} />
            </Field>
            <Field label="Email" error={errors.contactEmail?.message}>
              <Input id="c-email" type="email" placeholder="info@example.com" {...register('contactEmail')} />
            </Field>
            <Field label="WhatsApp Number" error={errors.contactWhatsapp?.message}>
              <PhoneInput id="c-whatsapp" placeholder="98765 43210" {...register('contactWhatsapp')} />
            </Field>
            <Field label="Address" error={errors.contactAddress?.message}>
              <Input id="c-address" placeholder="123 Main St, Kolkata 700001" {...register('contactAddress')} />
            </Field>
          </Section>

          {/* Social */}
          <Section icon={<Globe className="size-4 text-brand-orange" />} title="Social Media Links"
            hint="Used in the public website footer and contact page.">
            <Field label="Facebook URL" error={errors.socialFacebook?.message}>
              <Input id="s-fb" placeholder="https://facebook.com/yourpage" {...register('socialFacebook')} />
            </Field>
            <Field label="Instagram URL" error={errors.socialInstagram?.message}>
              <Input id="s-ig" placeholder="https://instagram.com/yourhandle" {...register('socialInstagram')} />
            </Field>
            <Field label="YouTube URL" error={errors.socialYoutube?.message}>
              <Input id="s-yt" placeholder="https://youtube.com/@yourchannel" {...register('socialYoutube')} />
            </Field>
          </Section>

          <div className="rounded-xl bg-blue-50 border border-blue-200 p-4 text-xs text-blue-800">
            <strong>Note:</strong> The UPI ID is shown on all QR code payment pages and receipts.
            Set this before allowing collectors to start collecting payments.
          </div>

          <Button
            type="submit"
            disabled={isSubmitting || !isDirty}
            className="self-start bg-brand-orange hover:bg-brand-orange/90 text-white px-6 h-10"
          >
            {isSubmitting ? <Loader2 className="size-4 animate-spin mr-2" /> : <Save className="size-4 mr-2" />}
            {isSubmitting ? 'Saving…' : 'Save Configuration'}
          </Button>
        </form>
      )}
    </div>
  )
}

function Section({
  icon, title, hint, children,
}: {
  icon: React.ReactNode
  title: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 flex flex-col gap-5">
      <div className="flex items-start gap-2 pb-3 border-b border-border">
        <div className="size-8 rounded-lg bg-brand-orange/10 flex items-center justify-center shrink-0">
          {icon}
        </div>
        <div>
          <h2 className="font-semibold text-sm">{title}</h2>
          {hint && <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>}
        </div>
      </div>
      {children}
    </div>
  )
}

function Field({
  label, required, hint, error, children,
}: {
  label: string
  required?: boolean
  hint?: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>
        {label}{required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      {hint && <p className="text-xs text-muted-foreground -mt-0.5">{hint}</p>}
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

const PhoneInput = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ id, className, ...props }, ref) => (
  <div className="flex rounded-lg border border-input overflow-hidden shadow-xs focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50">
    <span className="inline-flex items-center px-3 bg-muted text-sm text-muted-foreground border-r border-input select-none shrink-0">
      +91
    </span>
    <input
      id={id}
      ref={ref}
      type="tel"
      inputMode="numeric"
      className="flex-1 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
      {...props}
    />
  </div>
))
