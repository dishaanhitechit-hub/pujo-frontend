'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2, IndianRupee, User, Phone, MapPin, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { PageHeader } from '@/components/dashboard/PageHeader'
import { RoleGuard } from '@/lib/auth/role-guard'
import { apiConfig } from '@/config/api'
import { initiatePayment } from '@/lib/api/payments'
import type { ApiError } from '@/types'

const schema = z.object({
  donor_name: z.string().min(1, 'Donor name is required'),
  donor_phone: z.string().optional(),
  donor_address: z.string().optional(),
  donor_notes: z.string().optional(),
  amount: z
    .string()
    .min(1, 'Amount is required')
    .regex(/^\d+(\.\d{1,2})?$/, 'Enter a valid amount (e.g. 500 or 500.00)'),
  method: z.enum(['upi', 'cash'], { message: 'Select a payment method' }),
})

type FormData = z.infer<typeof schema>

export default function CollectPage() {
  return (
    <RoleGuard permission="payment.initiate">
      <CollectContent />
    </RoleGuard>
  )
}

function CollectContent() {
  const [submitting, setSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset,
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const selectedMethod = watch('method')

  async function onSubmit(data: FormData) {
    setSubmitting(true)
    try {
      const result = await initiatePayment(data)
      toast.success(`Payment initiated for ${result.donorName} — ₹${result.amount}`)
      reset()
      // Redirect browser to backend-rendered payment page
      const backendUrl = `${apiConfig.baseUrl}${result.nextUrl}`
      window.location.href = backendUrl
    } catch (err) {
      const apiErr = err as ApiError
      toast.error(apiErr?.message ?? 'Failed to initiate payment. Please try again.')
      setSubmitting(false)
    }
  }

  return (
    <div className="p-6 lg:p-8 max-w-2xl">
      <PageHeader
        title="Collect Payment"
        subtitle="Fill in donor details and initiate UPI or cash collection."
        className="mb-8"
      />

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-6">
        {/* Donor details */}
        <fieldset className="border border-border rounded-xl p-5 flex flex-col gap-5">
          <legend className="text-sm font-semibold text-foreground px-1">Donor Information</legend>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="donor_name" className="flex items-center gap-1.5">
              <User className="size-3.5 text-muted-foreground" /> Donor Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="donor_name"
              placeholder="Full name"
              aria-invalid={!!errors.donor_name}
              {...register('donor_name')}
            />
            {errors.donor_name && <p className="text-xs text-destructive">{errors.donor_name.message}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="donor_phone" className="flex items-center gap-1.5">
                <Phone className="size-3.5 text-muted-foreground" /> Phone
              </Label>
              <Input id="donor_phone" type="tel" placeholder="10-digit mobile" {...register('donor_phone')} />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="donor_address" className="flex items-center gap-1.5">
                <MapPin className="size-3.5 text-muted-foreground" /> Address
              </Label>
              <Input id="donor_address" placeholder="Optional" {...register('donor_address')} />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="donor_notes" className="flex items-center gap-1.5">
              <FileText className="size-3.5 text-muted-foreground" /> Notes
            </Label>
            <Textarea
              id="donor_notes"
              placeholder="Annual member, special occasion, etc."
              rows={2}
              {...register('donor_notes')}
            />
          </div>
        </fieldset>

        {/* Payment details */}
        <fieldset className="border border-border rounded-xl p-5 flex flex-col gap-5">
          <legend className="text-sm font-semibold text-foreground px-1">Payment Details</legend>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="amount" className="flex items-center gap-1.5">
              <IndianRupee className="size-3.5 text-muted-foreground" /> Amount <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">₹</span>
              <Input
                id="amount"
                type="text"
                inputMode="decimal"
                placeholder="500.00"
                className="pl-7"
                aria-invalid={!!errors.amount}
                {...register('amount')}
              />
            </div>
            {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
          </div>

          <div className="flex flex-col gap-2">
            <Label>Payment Method <span className="text-destructive">*</span></Label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'upi', label: 'UPI', emoji: '📱', desc: 'QR code payment' },
                { value: 'cash', label: 'Cash', emoji: '💵', desc: 'Physical cash' },
              ].map(({ value, label, emoji, desc }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setValue('method', value as 'upi' | 'cash', { shouldValidate: true })}
                  className={`flex flex-col items-center gap-1 p-4 rounded-xl border-2 transition-all text-center ${
                    selectedMethod === value
                      ? 'border-brand-orange bg-brand-orange/5 text-brand-navy'
                      : 'border-border bg-white text-muted-foreground hover:border-brand-orange/30'
                  }`}
                >
                  <span className="text-2xl">{emoji}</span>
                  <span className="font-semibold text-sm">{label}</span>
                  <span className="text-xs">{desc}</span>
                </button>
              ))}
            </div>
            {errors.method && <p className="text-xs text-destructive">{errors.method.message}</p>}
          </div>
        </fieldset>

        {/* Info callout */}
        {selectedMethod && (
          <div className="rounded-xl bg-blue-50 border border-blue-200 px-4 py-3 text-sm text-blue-800">
            {selectedMethod === 'upi'
              ? '📱 After submitting, you will be redirected to the UPI payment page with a QR code for the donor to scan.'
              : '💵 After submitting, you will be redirected to the cash confirmation page.'}
          </div>
        )}

        <Button
          type="submit"
          disabled={submitting}
          className="w-full sm:w-auto bg-brand-orange hover:bg-brand-orange/90 text-white h-11 font-semibold px-8 self-start"
        >
          {submitting && <Loader2 className="size-4 animate-spin mr-2" />}
          {submitting ? 'Processing…' : 'Initiate Payment'}
        </Button>
      </form>
    </div>
  )
}
