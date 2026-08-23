'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { submitContactQuery } from '@/lib/api/public'

const schema = z.object({
  name:     z.string().min(1, 'Name is required').max(150),
  phone:    z.string().min(1, 'Phone is required').max(20),
  location: z.string().max(200).optional(),
  message:  z.string().min(1, 'Message is required'),
})

type FormValues = z.infer<typeof schema>

export function ContactQueryForm() {
  const [submitted, setSubmitted] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  async function onSubmit(values: FormValues) {
    try {
      await submitContactQuery({
        name:     values.name,
        phone:    values.phone,
        message:  values.message,
        location: values.location || undefined,
      })
      toast.success('Message sent! We\'ll get back to you soon.')
      reset()
      setSubmitted(true)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Submission failed. Please try again.')
    }
  }

  if (submitted) {
    return (
      <div className="rounded-2xl border border-green-200 bg-green-50 p-8 text-center">
        <div className="size-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <Send className="size-5 text-green-600" />
        </div>
        <h3 className="font-heading font-bold text-brand-navy text-lg mb-2">Message Received!</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Thank you for reaching out. We'll get back to you as soon as possible.
        </p>
        <button
          onClick={() => setSubmitted(false)}
          className="text-sm text-brand-orange hover:underline"
        >
          Send another message
        </button>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-border bg-white p-6 sm:p-8">
      <h3 className="font-heading font-bold text-brand-navy text-xl mb-1">Send Us a Message</h3>
      <p className="text-sm text-muted-foreground mb-6">
        Have a question or want to get involved? We'd love to hear from you.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-foreground/70 uppercase tracking-wide">
              Name <span className="text-destructive">*</span>
            </label>
            <Input
              {...register('name')}
              placeholder="Your name"
              className={errors.name ? 'border-destructive focus-visible:ring-destructive/30' : ''}
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-foreground/70 uppercase tracking-wide">
              Phone <span className="text-destructive">*</span>
            </label>
            <Input
              {...register('phone')}
              type="tel"
              placeholder="+91 98765 43210"
              className={errors.phone ? 'border-destructive focus-visible:ring-destructive/30' : ''}
            />
            {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-foreground/70 uppercase tracking-wide">
            Location <span className="text-muted-foreground font-normal normal-case">(optional)</span>
          </label>
          <Input
            {...register('location')}
            placeholder="City or neighbourhood"
            className={errors.location ? 'border-destructive focus-visible:ring-destructive/30' : ''}
          />
          {errors.location && <p className="text-xs text-destructive">{errors.location.message}</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-foreground/70 uppercase tracking-wide">
            Message <span className="text-destructive">*</span>
          </label>
          <Textarea
            {...register('message')}
            rows={4}
            placeholder="How can we help you?"
            className={errors.message ? 'border-destructive focus-visible:ring-destructive/30' : ''}
          />
          {errors.message && <p className="text-xs text-destructive">{errors.message.message}</p>}
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="self-start bg-brand-orange hover:bg-brand-orange/90 text-white px-6"
        >
          {isSubmitting ? (
            <><Loader2 className="size-4 mr-2 animate-spin" />Sending…</>
          ) : (
            <><Send className="size-4 mr-2" />Send Message</>
          )}
        </Button>
      </form>
    </div>
  )
}
