'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2, User, Phone, MapPin, FileText, Tag, IndianRupee } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PageHeader } from '@/components/dashboard/PageHeader'
import { RoleGuard } from '@/lib/auth/role-guard'
import { createPledge } from '@/lib/api/pledges'
import { useAuth } from '@/lib/auth/auth-provider'
import { DONOR_TYPES } from '@/constants'
import type { ApiError } from '@/types'

const schema = z.object({
  donorName: z.string().min(1, 'Donor name is required'),
  donorPhone: z.string().optional(),
  donorAddress: z.string().optional(),
  donorType: z.string().optional(),
  donorNotes: z.string().optional(),
  totalAmount: z
    .string()
    .min(1, 'Total amount is required')
    .regex(/^\d+(\.\d{1,2})?$/, 'Enter a valid amount'),
  notes: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export default function NewPledgePage() {
  return (
    <RoleGuard permission="payment.initiate">
      <NewPledgeContent />
    </RoleGuard>
  )
}

function NewPledgeContent() {
  const { user } = useAuth()
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)

  // Backend blocks admin from POST /api/pledge/ — redirect rather than letting it fail.
  useEffect(() => {
    if (user?.role === 'admin') router.replace('/forbidden')
  }, [user, router])

  if (!user || user.role === 'admin') return null

  const { register, handleSubmit, control, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { donorType: 'House-to-House' },
  })

  async function onSubmit(data: FormData) {
    setSubmitting(true)
    try {
      const pledge = await createPledge(data)
      toast.success(`Pledge created for ${pledge.donor.name} — ₹${pledge.totalAmount}`)
      router.push(`/pledges/${pledge.id}`)
    } catch (err) {
      const apiErr = err as ApiError
      toast.error(apiErr?.message ?? 'Failed to create pledge.')
      setSubmitting(false)
    }
  }

  return (
    <div className="p-6 lg:p-8 max-w-2xl">
      <PageHeader title="New Pledge" subtitle="Record a donor's multi-installment commitment." className="mb-8" />

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-6">
        <fieldset className="border border-border rounded-xl p-5 flex flex-col gap-5">
          <legend className="text-sm font-semibold text-foreground px-1">Donor Information</legend>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="donorName" className="flex items-center gap-1.5">
              <User className="size-3.5 text-muted-foreground" /> Donor Name <span className="text-destructive">*</span>
            </Label>
            <Input id="donorName" placeholder="Full name" aria-invalid={!!errors.donorName} {...register('donorName')} />
            {errors.donorName && <p className="text-xs text-destructive">{errors.donorName.message}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="donorPhone" className="flex items-center gap-1.5"><Phone className="size-3.5 text-muted-foreground" /> Phone</Label>
              <Input id="donorPhone" type="tel" placeholder="10-digit mobile" {...register('donorPhone')} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="donorAddress" className="flex items-center gap-1.5"><MapPin className="size-3.5 text-muted-foreground" /> Address</Label>
              <Input id="donorAddress" placeholder="Optional" {...register('donorAddress')} />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="donorType" className="flex items-center gap-1.5"><Tag className="size-3.5 text-muted-foreground" /> Donor Type</Label>
            <Controller
              control={control}
              name="donorType"
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger id="donorType" className="w-full"><SelectValue placeholder="Select donor type" /></SelectTrigger>
                  <SelectContent position="popper">
                    {DONOR_TYPES.map((type) => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="donorNotes" className="flex items-center gap-1.5"><FileText className="size-3.5 text-muted-foreground" /> Donor Notes</Label>
            <Textarea id="donorNotes" placeholder="Optional" rows={2} {...register('donorNotes')} />
          </div>
        </fieldset>

        <fieldset className="border border-border rounded-xl p-5 flex flex-col gap-5">
          <legend className="text-sm font-semibold text-foreground px-1">Pledge Details</legend>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="totalAmount" className="flex items-center gap-1.5">
              <IndianRupee className="size-3.5 text-muted-foreground" /> Total Pledge Amount <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">₹</span>
              <Input id="totalAmount" type="text" inputMode="decimal" placeholder="10000.00" className="pl-7" aria-invalid={!!errors.totalAmount} {...register('totalAmount')} />
            </div>
            {errors.totalAmount && <p className="text-xs text-destructive">{errors.totalAmount.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="notes" className="flex items-center gap-1.5"><FileText className="size-3.5 text-muted-foreground" /> Pledge Notes</Label>
            <Textarea id="notes" placeholder="Paying in 2 installments, etc." rows={2} {...register('notes')} />
          </div>
        </fieldset>

        <Button type="submit" disabled={submitting} className="w-full sm:w-auto bg-brand-orange hover:bg-brand-orange/90 text-white h-11 font-semibold px-8 self-start">
          {submitting && <Loader2 className="size-4 animate-spin mr-2" />}
          {submitting ? 'Creating…' : 'Create Pledge'}
        </Button>
      </form>
    </div>
  )
}
