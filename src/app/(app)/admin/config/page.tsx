'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2, Settings, Phone, Mail, MapPin, Globe, Save, Heart, HeartHandshake, Hash, Building2, Upload, X, ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { PageHeader } from '@/components/dashboard/PageHeader'
import { RoleGuard } from '@/lib/auth/role-guard'
import { getAdminConfig, updateAdminConfig, uploadConfigMedia } from '@/lib/api/admin'
import { apiConfig } from '@/config/api'
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
  upiId:                  z.string().min(1, 'UPI ID is required'),
  orgName:                z.string().min(1, 'Organisation name is required'),
  contactPhone:           z.string().max(30).optional(),
  contactEmail:           z.string().max(150).optional(),
  contactWhatsapp:        z.string().max(30).optional(),
  contactAddress:         z.string().max(300).optional(),
  supportTitle:           z.string().max(100).optional(),
  supportDescription:     z.string().max(500).optional(),
  supportWhatsappMessage: z.string().max(300).optional(),
  socialFacebook:         z.string().max(300).optional(),
  socialInstagram:        z.string().max(300).optional(),
  socialYoutube:          z.string().max(300).optional(),
  // Contribution payment details
  contributionUpiId:      z.string().max(100).optional(),
  contributionBankName:   z.string().max(100).optional(),
  contributionAccountName:   z.string().max(100).optional(),
  contributionAccountNumber: z.string().max(50).optional(),
  contributionIfsc:       z.string().max(20).optional(),
  contributionBankBranch: z.string().max(100).optional(),
  // Member ID format
  memberIdPrefix:         z.string().max(20).optional(),
  memberIdDigits:         z.string().optional(),
  // Club identity
  clubNameVernacular:     z.string().max(100).optional(),
  clubNameEn:             z.string().max(100).optional(),
  clubTagline:            z.string().max(200).optional(),
  clubDescription:        z.string().max(500).optional(),
  clubCity:               z.string().max(100).optional(),
  clubState:              z.string().max(100).optional(),
  clubFoundingYear:       z.string().max(4).optional(),
  clubLogoUrl:            z.string().max(500).optional(),
  clubHeroImageUrl:       z.string().max(500).optional(),
  clubAboutText:          z.string().max(5000).optional(),
  clubSiteUrl:            z.string().max(300).optional(),
  clubMetaDescription:    z.string().max(300).optional(),
  clubOgImageUrl:         z.string().max(500).optional(),
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
    setValue,
    watch,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  useEffect(() => {
    getAdminConfig()
      .then((res) => {
        const c = res.config
        reset({
          upiId:                  c['upi_id']                   ?? '',
          orgName:                c['org_name']                 ?? '',
          contactPhone:           stripDialCode(c['contact.phone']    ?? ''),
          contactEmail:           c['contact.email']            ?? '',
          contactWhatsapp:        stripDialCode(c['contact.whatsapp'] ?? ''),
          contactAddress:         c['contact.address']          ?? '',
          supportTitle:           c['support.title']            ?? '',
          supportDescription:     c['support.description']      ?? '',
          supportWhatsappMessage: c['support.whatsapp_message'] ?? '',
          socialFacebook:         c['social.facebook']          ?? '',
          socialInstagram:        c['social.instagram']         ?? '',
          socialYoutube:          c['social.youtube']           ?? '',
          contributionUpiId:         c['contribution.upi_id']        ?? '',
          contributionBankName:      c['contribution.bank_name']     ?? '',
          contributionAccountName:   c['contribution.account_name']  ?? '',
          contributionAccountNumber: c['contribution.account_number'] ?? '',
          contributionIfsc:          c['contribution.ifsc']          ?? '',
          contributionBankBranch:    c['contribution.bank_branch']   ?? '',
          memberIdPrefix:            c['member_id.prefix']           ?? '',
          memberIdDigits:            c['member_id.digits']           ?? '4',
          clubNameVernacular:        c['club.name_vernacular']       ?? '',
          clubNameEn:                c['club.name_en']               ?? '',
          clubTagline:               c['club.tagline']               ?? '',
          clubDescription:           c['club.description']           ?? '',
          clubCity:                  c['club.city']                  ?? '',
          clubState:                 c['club.state']                 ?? '',
          clubFoundingYear:          c['club.founding_year']         ?? '',
          clubLogoUrl:               c['club.logo_url']              ?? '',
          clubHeroImageUrl:          c['club.hero_image_url']        ?? '',
          clubAboutText:             c['club.about_text']            ?? '',
          clubSiteUrl:               c['club.site_url']              ?? '',
          clubMetaDescription:       c['club.meta_description']      ?? '',
          clubOgImageUrl:            c['club.og_image_url']          ?? '',
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
        contributionUpiId:         data.contributionUpiId         ?? '',
        contributionBankName:      data.contributionBankName      ?? '',
        contributionAccountName:   data.contributionAccountName   ?? '',
        contributionAccountNumber: data.contributionAccountNumber ?? '',
        contributionIfsc:          data.contributionIfsc          ?? '',
        contributionBankBranch:    data.contributionBankBranch    ?? '',
        memberIdPrefix:            data.memberIdPrefix            ?? '',
        memberIdDigits:            data.memberIdDigits            ?? '4',
        clubNameVernacular:        data.clubNameVernacular        ?? '',
        clubNameEn:                data.clubNameEn                ?? '',
        clubTagline:               data.clubTagline               ?? '',
        clubDescription:           data.clubDescription           ?? '',
        clubCity:                  data.clubCity                  ?? '',
        clubState:                 data.clubState                 ?? '',
        clubFoundingYear:          data.clubFoundingYear          ?? '',
        clubLogoUrl:               data.clubLogoUrl               ?? '',
        clubHeroImageUrl:          data.clubHeroImageUrl          ?? '',
        clubAboutText:             data.clubAboutText             ?? '',
        clubSiteUrl:               data.clubSiteUrl               ?? '',
        clubMetaDescription:       data.clubMetaDescription       ?? '',
        clubOgImageUrl:            data.clubOgImageUrl            ?? '',
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

          {/* Support */}
          <Section icon={<Heart className="size-4 text-brand-orange" />} title="Support & Contribution CTA"
            hint="Configures the support section at the bottom of the Contact page.">
            <Field label="Section Heading" error={errors.supportTitle?.message}>
              <Input id="support-title" placeholder="Support Our Puja" {...register('supportTitle')} />
            </Field>
            <Field label="Description" error={errors.supportDescription?.message}
              hint="A short sentence explaining how people can contribute.">
              <Input id="support-desc" placeholder="Want to contribute? Contact us for details about donations, sponsorships, or volunteering." {...register('supportDescription')} />
            </Field>
            <Field label="WhatsApp Pre-filled Message" error={errors.supportWhatsappMessage?.message}
              hint="Plain text — sent as the opening message when someone taps the WhatsApp button.">
              <Input id="support-wa-msg" placeholder="I would like to support Shatadal Durga Puja" {...register('supportWhatsappMessage')} />
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

          {/* Contribution payment details */}
          <Section icon={<HeartHandshake className="size-4 text-brand-orange" />} title="Member Contribution Details"
            hint="Shown to members when they submit a contribution. Leave blank to hide a payment method.">
            <Field label="Contribution UPI ID" error={errors.contributionUpiId?.message}
              hint="UPI ID for members to send contributions to.">
              <Input id="contrib-upi" placeholder="contributions@upi" {...register('contributionUpiId')} />
            </Field>
            <Field label="Bank Name" error={errors.contributionBankName?.message}>
              <Input id="contrib-bank-name" placeholder="State Bank of India" {...register('contributionBankName')} />
            </Field>
            <Field label="Account Holder Name" error={errors.contributionAccountName?.message}>
              <Input id="contrib-acc-name" placeholder="Shatadal Durga Puja Committee" {...register('contributionAccountName')} />
            </Field>
            <Field label="Account Number" error={errors.contributionAccountNumber?.message}>
              <Input id="contrib-acc-no" placeholder="00000000000" {...register('contributionAccountNumber')} />
            </Field>
            <Field label="IFSC Code" error={errors.contributionIfsc?.message}>
              <Input id="contrib-ifsc" placeholder="SBIN0000000" {...register('contributionIfsc')} />
            </Field>
            <Field label="Branch" error={errors.contributionBankBranch?.message}>
              <Input id="contrib-branch" placeholder="Kolkata Main Branch" {...register('contributionBankBranch')} />
            </Field>
          </Section>

          {/* Member ID format */}
          <Section icon={<Hash className="size-4 text-brand-orange" />} title="Member ID Format"
            hint="New members get an auto-generated ID like ABC-0001. You can still edit it per member.">
            <Field label="Prefix" error={errors.memberIdPrefix?.message}
              hint="Short text before the number, e.g. ABC. Leave blank for numbers only.">
              <Input id="member-id-prefix" placeholder="ABC" {...register('memberIdPrefix')} />
            </Field>
            <Field label="Number of digits" error={errors.memberIdDigits?.message}
              hint="Zero-padded sequence length. Default 4 → 0001.">
              <select
                id="member-id-digits"
                className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-all outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                {...register('memberIdDigits')}
              >
                {['3', '4', '5', '6'].map((d) => (
                  <option key={d} value={d}>{d} digits</option>
                ))}
              </select>
            </Field>
          </Section>

          {/* Club Identity */}
          <Section icon={<Building2 className="size-4 text-brand-orange" />} title="Club Identity"
            hint="Shown on the public website — homepage, about page, header, footer, and metadata.">
            <Field label="Club Name (Vernacular)" error={errors.clubNameVernacular?.message}
              hint="The name in your local language (e.g. Bengali), used in the header and footer.">
              <Input id="club-name-v" placeholder="শতদল" {...register('clubNameVernacular')} />
            </Field>
            <Field label="Club Name (English)" error={errors.clubNameEn?.message}
              hint="The English name shown across the public site.">
              <Input id="club-name-en" placeholder="Shatadal" {...register('clubNameEn')} />
            </Field>
            <Field label="Tagline / Location" error={errors.clubTagline?.message}
              hint="Short descriptor shown next to the name, e.g. the city or a brief tagline.">
              <Input id="club-tagline" placeholder="Kolaghat · Purba Medinipur" {...register('clubTagline')} />
            </Field>
            <Field label="Short Description" error={errors.clubDescription?.message}
              hint="One-line description shown in the footer and metadata.">
              <Input id="club-desc" placeholder="A community cultural club celebrating togetherness." {...register('clubDescription')} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="City" error={errors.clubCity?.message}>
                <Input id="club-city" placeholder="Kolaghat" {...register('clubCity')} />
              </Field>
              <Field label="State" error={errors.clubState?.message}>
                <Input id="club-state" placeholder="West Bengal" {...register('clubState')} />
              </Field>
            </div>
            <Field label="Founding Year" error={errors.clubFoundingYear?.message}
              hint="4-digit year the club was established.">
              <Input id="club-year" placeholder="1985" maxLength={4} {...register('clubFoundingYear')} />
            </Field>
            <Field label="Club Logo" error={errors.clubLogoUrl?.message}
              hint="The logo shown in the header, footer, and homepage.">
              <ImageUploadField
                value={watch('clubLogoUrl') ?? ''}
                onChange={(url) => setValue('clubLogoUrl', url, { shouldDirty: true })}
                placeholder="https://… or upload below"
                previewClass="h-14 w-14 object-contain rounded-lg"
              />
            </Field>
            <Field label="Hero / Background Image" error={errors.clubHeroImageUrl?.message}
              hint="Full-page background shown on the homepage hero.">
              <ImageUploadField
                value={watch('clubHeroImageUrl') ?? ''}
                onChange={(url) => setValue('clubHeroImageUrl', url, { shouldDirty: true })}
                placeholder="https://… or upload below"
                previewClass="h-20 w-full object-cover rounded-lg"
              />
            </Field>
            <Field label="OG / Social Share Image" error={errors.clubOgImageUrl?.message}
              hint="Image shown when shared on social media (1200×630 px recommended).">
              <ImageUploadField
                value={watch('clubOgImageUrl') ?? ''}
                onChange={(url) => setValue('clubOgImageUrl', url, { shouldDirty: true })}
                placeholder="https://… or upload below"
                previewClass="h-16 w-full object-cover rounded-lg"
              />
            </Field>
            <Field label="Website URL" error={errors.clubSiteUrl?.message}
              hint="The canonical public URL of this site (used in Open Graph metadata).">
              <Input id="club-site" placeholder="https://shatadal.in" {...register('clubSiteUrl')} />
            </Field>
            <Field label="Meta Description" error={errors.clubMetaDescription?.message}
              hint="SEO description shown in Google results (under 160 chars recommended).">
              <Input id="club-meta-desc" placeholder="Shatadal Kolaghat — celebrating Durga Puja and community since 1985." {...register('clubMetaDescription')} />
            </Field>
            <Field label="About Text" error={errors.clubAboutText?.message}
              hint="Full about-page text. Separate paragraphs with a blank line. Leave blank to use the default.">
              <Textarea
                id="club-about"
                rows={6}
                placeholder={"Write your club's story here...\n\nSeparate paragraphs with a blank line."}
                className="resize-y"
                {...register('clubAboutText')}
              />
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

function resolvePreviewUrl(value: string): string | null {
  if (!value) return null
  if (value.startsWith('http://') || value.startsWith('https://') || value.startsWith('//')) return value
  if (value.startsWith('/media/')) return `${apiConfig.baseUrl}${value}`
  return null
}

function ImageUploadField({
  value,
  onChange,
  placeholder,
  previewClass,
}: {
  value: string
  onChange: (url: string) => void
  placeholder?: string
  previewClass?: string
}) {
  const [uploading, setUploading] = useState(false)
  const [localPreview, setLocalPreview] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const previewSrc = localPreview ?? resolvePreviewUrl(value)

  async function handleFile(file: File) {
    const local = URL.createObjectURL(file)
    setLocalPreview(local)
    setUploading(true)
    try {
      const result = await uploadConfigMedia(file)
      onChange(result.url)
    } catch (err) {
      toast.error((err as ApiError).message ?? 'Upload failed. Please try again.')
      setLocalPreview(null)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {previewSrc && (
        <div className="relative inline-flex items-start gap-2 p-2 rounded-lg border border-border bg-muted/30">
          <img
            src={previewSrc}
            alt="Preview"
            className={previewClass ?? 'h-16 w-auto object-contain rounded'}
          />
          <button
            type="button"
            onClick={() => { onChange(''); setLocalPreview(null) }}
            className="absolute top-1 right-1 size-5 rounded-full bg-destructive/80 text-white flex items-center justify-center hover:bg-destructive transition-colors"
            title="Remove image"
          >
            <X className="size-3" />
          </button>
        </div>
      )}
      <div className="flex gap-2">
        <Input
          value={value}
          onChange={(e) => { setLocalPreview(null); onChange(e.target.value) }}
          placeholder={placeholder ?? 'https://…'}
          className="flex-1 text-xs"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="shrink-0 gap-1.5"
        >
          {uploading
            ? <Loader2 className="size-3.5 animate-spin" />
            : <Upload className="size-3.5" />
          }
          {uploading ? 'Uploading…' : 'Upload'}
        </Button>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
          e.target.value = ''
        }}
      />
    </div>
  )
}
