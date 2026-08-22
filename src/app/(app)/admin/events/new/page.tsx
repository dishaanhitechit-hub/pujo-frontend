'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PageHeader } from '@/components/dashboard/PageHeader'
import { RoleGuard } from '@/lib/auth/role-guard'
import { createEvent } from '@/lib/api/events'
import type { ApiError } from '@/types'

const schema = z.object({
  name: z.string().min(1, 'Event name is required').max(120),
  year: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  location: z.string().max(200).optional(),
  description: z.string().optional(),
  status: z.enum(['draft', 'published', 'archived']),
  collectionEnabled: z.boolean(),
  isFeatured: z.boolean(),
}).refine(
  (d) => !d.startDate || !d.endDate || d.endDate >= d.startDate,
  { message: 'End date must be on or after start date', path: ['endDate'] },
)

type FormData = z.infer<typeof schema>

export default function NewEventPage() {
  return (
    <RoleGuard permission="event.manage">
      <NewEventContent />
    </RoleGuard>
  )
}

function NewEventContent() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)

  const { register, handleSubmit, control, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      status: 'draft',
      collectionEnabled: false,
      isFeatured: false,
    },
  })

  async function onSubmit(data: FormData) {
    setSubmitting(true)
    try {
      const yearNum = data.year ? parseInt(data.year, 10) : null
      const ev = await createEvent({
        name: data.name,
        description: data.description || null,
        startDate: data.startDate || null,
        endDate: data.endDate || null,
        location: data.location || null,
        year: yearNum && !isNaN(yearNum) ? yearNum : null,
        status: data.status,
        collectionEnabled: data.collectionEnabled,
        isFeatured: data.isFeatured,
      })
      toast.success(`Event "${ev.name}" created.`)
      router.push(`/admin/events/${ev.id}`)
    } catch (err) {
      toast.error((err as ApiError).message ?? 'Failed to create event.')
      setSubmitting(false)
    }
  }

  return (
    <div className="p-6 lg:p-8 max-w-2xl">
      <Button asChild variant="ghost" size="sm" className="mb-4 -ml-1 text-muted-foreground">
        <Link href="/admin/events"><ArrowLeft className="size-4 mr-1" />Back to Events</Link>
      </Button>

      <PageHeader title="New Event" subtitle="Create a festival edition. You can add schedule days and media after creating." className="mb-8" />

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-6">
        {/* Core details */}
        <fieldset className="border border-border rounded-xl p-5 flex flex-col gap-5">
          <legend className="text-sm font-semibold text-foreground px-1">Event Details</legend>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Name <span className="text-destructive">*</span></Label>
            <Input id="name" placeholder="e.g. Durga Puja 2026" aria-invalid={!!errors.name} {...register('name')} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="year">Year</Label>
              <Input id="year" type="number" placeholder="2026" min="2000" max="2100" {...register('year')} />
              {errors.year && <p className="text-xs text-destructive">{errors.year.message}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="location">Location</Label>
              <Input id="location" placeholder="e.g. Kolaghat" {...register('location')} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="startDate">Start Date</Label>
              <Input id="startDate" type="date" {...register('startDate')} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="endDate">End Date</Label>
              <Input id="endDate" type="date" {...register('endDate')} />
              {errors.endDate && <p className="text-xs text-destructive">{errors.endDate.message}</p>}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" placeholder="Brief description for the public website…" rows={3} {...register('description')} />
          </div>
        </fieldset>

        {/* State & visibility */}
        <fieldset className="border border-border rounded-xl p-5 flex flex-col gap-5">
          <legend className="text-sm font-semibold text-foreground px-1">State & Visibility</legend>

          <div className="bg-muted/40 rounded-lg p-4 text-xs text-muted-foreground leading-relaxed">
            <strong className="text-foreground">Lifecycle:</strong>
            {' '}Draft → not public, no collection.
            {' '}Published → public, collection depends on toggle.
            {' '}Archived → historical, no collection.
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="status">Status</Label>
            <Controller
              control={control}
              name="status"
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger id="status" className="w-full">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    <SelectItem value="draft">Draft — not public</SelectItem>
                    <SelectItem value="published">Published — public</SelectItem>
                    <SelectItem value="archived">Archived — historical</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex items-start gap-3">
              <Controller
                control={control}
                name="collectionEnabled"
                render={({ field }) => (
                  <input
                    id="collectionEnabled"
                    type="checkbox"
                    className="mt-0.5 size-4 accent-brand-orange cursor-pointer"
                    checked={field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                  />
                )}
              />
              <div>
                <Label htmlFor="collectionEnabled" className="cursor-pointer">Enable Collection</Label>
                <p className="text-xs text-muted-foreground mt-0.5">Allow collectors to record payments against this event. Requires Published status.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Controller
                control={control}
                name="isFeatured"
                render={({ field }) => (
                  <input
                    id="isFeatured"
                    type="checkbox"
                    className="mt-0.5 size-4 accent-brand-orange cursor-pointer"
                    checked={field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                  />
                )}
              />
              <div>
                <Label htmlFor="isFeatured" className="cursor-pointer">Set as Featured</Label>
                <p className="text-xs text-muted-foreground mt-0.5">Featured event drives the public homepage countdown and schedule. Only one event can be featured at a time.</p>
              </div>
            </div>
          </div>
        </fieldset>

        <div className="flex items-center gap-3">
          <Button
            type="submit"
            disabled={submitting}
            className="bg-brand-orange hover:bg-brand-orange/90 text-white h-10 font-semibold px-8"
          >
            {submitting && <Loader2 className="size-4 animate-spin mr-2" />}
            {submitting ? 'Creating…' : 'Create Event'}
          </Button>
          <Button asChild variant="outline" className="h-10">
            <Link href="/admin/events">Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  )
}
