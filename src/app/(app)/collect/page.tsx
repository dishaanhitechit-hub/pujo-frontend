'use client'

import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2, IndianRupee, User, Phone, MapPin, FileText, Tag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PageHeader } from '@/components/dashboard/PageHeader'
import { RoleGuard } from '@/lib/auth/role-guard'
import { apiConfig } from '@/config/api'
import { initiatePayment } from '@/lib/api/payments'
import { DONOR_TYPES } from '@/constants'
import type { ApiError } from '@/types'

const schema = z.object({
  donorName: z.string().min(1, 'Donor name is required'),
  donorPhone: z.string().optional(),
  donorAddress: z.string().optional(),
  donorType: z.string().min(1, 'Donor type is required'),
  donorNotes: z.string().optional(),
  amount: z
    .string()
    .min(1, 'Amount is required')
    .regex(/^\d+(\.\d{1,2})?$/, 'Enter a valid amount (e.g. 500 or 500.00)'),
  method: z.enum(['upi', 'cash', 'cheque'], { message: 'Select a payment method' }),
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
    control,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { donorType: 'House-to-House' },
  })

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
            <Label htmlFor="donorName" className="flex items-center gap-1.5">
              <User className="size-3.5 text-muted-foreground" /> Donor Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="donorName"
              placeholder="Full name"
              aria-invalid={!!errors.donorName}
              {...register('donorName')}
            />
            {errors.donorName && <p className="text-xs text-destructive">{errors.donorName.message}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="donorPhone" className="flex items-center gap-1.5">
                <Phone className="size-3.5 text-muted-foreground" /> Phone
              </Label>
              <Input id="donorPhone" type="tel" placeholder="10-digit mobile" {...register('donorPhone')} />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="donorAddress" className="flex items-center gap-1.5">
                <MapPin className="size-3.5 text-muted-foreground" /> Address
              </Label>
              <Input id="donorAddress" placeholder="Optional" {...register('donorAddress')} />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="donorType" className="flex items-center gap-1.5">
              <Tag className="size-3.5 text-muted-foreground" /> Donor Type <span className="text-destructive">*</span>
            </Label>
            <Controller
              control={control}
              name="donorType"
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger id="donorType" className="w-full" aria-invalid={!!errors.donorType}>
                    <SelectValue placeholder="Select donor type" />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    {DONOR_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.donorType && <p className="text-xs text-destructive">{errors.donorType.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="donorNotes" className="flex items-center gap-1.5">
              <FileText className="size-3.5 text-muted-foreground" /> Notes
            </Label>
            <Textarea
              id="donorNotes"
              placeholder="Annual member, special occasion, etc."
              rows={2}
              {...register('donorNotes')}
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
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: 'upi', label: 'UPI', emoji: '📱', desc: 'QR code payment' },
                { value: 'cash', label: 'Cash', emoji: '💵', desc: 'Physical cash' },
                { value: 'cheque', label: 'Cheque', emoji: '📝', desc: 'Cheque payment' },
              ].map(({ value, label, emoji, desc }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setValue('method', value as 'upi' | 'cash' | 'cheque', { shouldValidate: true })}
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
              : selectedMethod === 'cheque'
              ? '📝 After submitting, you will be redirected to the cheque details entry page.'
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
