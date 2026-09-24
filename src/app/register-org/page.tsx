'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2, Building2, CheckCircle2, QrCode } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { submitOrgRequest } from '@/lib/api/public'
import { apiConfig } from '@/config/api'
import { siteConfig } from '@/config/site'
import type { ApiError } from '@/types'

const IN_MOBILE_RE = /^[6-9]\d{9}$/

const schema = z.object({
  orgName:     z.string().min(2, 'Organisation name must be at least 2 characters'),
  adminName:   z.string().min(2, 'Contact name is required'),
  email:       z.string().email('Enter a valid email'),
  phone:       z.string().regex(IN_MOBILE_RE, 'Enter a valid 10-digit Indian mobile number'),
})

type FormData = z.infer<typeof schema>

const QR_URL = `${apiConfig.baseUrl}${apiConfig.endpoints.public.platformUpiQr}`

export default function RegisterOrgPage() {
  const [submitted, setSubmitted] = useState(false)
  const [submittedOrg, setSubmittedOrg] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  async function onSubmit(data: FormData) {
    try {
      await submitOrgRequest({
        orgName:      data.orgName,
        contactName:  data.adminName,
        contactEmail: data.email,
        contactPhone: data.phone,
      })
      setSubmittedOrg(data.orgName)
      setSubmitted(true)
    } catch (err) {
      const apiErr = err as ApiError
      toast.error(apiErr?.message ?? 'Submission failed. Please try again.')
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
            Fill in your details and complete the one-time payment. Once we confirm,
            your admin credentials will be sent to your email within 24 hours.
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

          {submitted ? (
            <div className="flex flex-col items-center text-center gap-5 py-8">
              <div className="size-16 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="size-8 text-green-600" />
              </div>
              <div>
                <h2 className="font-heading font-bold text-2xl text-brand-navy mb-2">Request submitted!</h2>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Your request for <span className="font-semibold text-foreground">{submittedOrg}</span> has been received.
                  Once we confirm your payment, we will send your admin credentials to your email.
                </p>
              </div>
              <Link
                href="/login"
                className="mt-2 text-sm font-semibold text-brand-orange hover:underline"
              >
                Back to sign in
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-6 flex items-center gap-3">
                <div className="size-10 rounded-xl bg-brand-orange/10 flex items-center justify-center shrink-0">
                  <Building2 className="size-5 text-brand-orange" />
                </div>
                <div>
                  <h2 className="font-heading font-bold text-2xl text-brand-navy">New organisation</h2>
                  <p className="text-muted-foreground text-sm">Submit your details and pay the registration fee</p>
                </div>
              </div>

              {/* Payment QR */}
              <div className="mb-6 rounded-xl border border-border bg-muted/30 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <QrCode className="size-4 text-brand-orange" />
                  <p className="text-sm font-semibold text-foreground">Pay registration fee via UPI</p>
                </div>
                <div className="flex flex-col items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={QR_URL}
                    alt="Payment QR code"
                    width={180}
                    height={180}
                    className="rounded-lg border border-border bg-white p-2"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
                  />
                  <p className="text-xs text-muted-foreground text-center">
                    Scan the QR code to pay. After payment, submit the form and we will verify and activate your account.
                  </p>
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
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">Contact details</p>
                </div>

                {/* Contact name */}
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

                <Button
                  type="submit"
                  className="w-full bg-brand-orange hover:bg-brand-orange/90 text-white h-10 font-semibold mt-2"
                  disabled={isSubmitting}
                >
                  {isSubmitting && <Loader2 className="size-4 animate-spin mr-2" />}
                  {isSubmitting ? 'Submitting…' : 'Submit registration request'}
                </Button>
              </form>

              <div className="mt-6 pt-6 border-t border-border">
                <Link href="/login" className="text-xs text-muted-foreground hover:text-brand-orange transition-colors">
                  ← Back to sign in
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
