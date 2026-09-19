'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2, Building2, Pencil, X, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PageHeader } from '@/components/dashboard/PageHeader'
import { RoleGuard } from '@/lib/auth/role-guard'
import { getMyOrg, updateMyOrg } from '@/lib/api/org'
import type { OrgInfo } from '@/lib/api/org'
import type { ApiError } from '@/types'
import { Skeleton } from '@/components/ui/skeleton'

const schema = z.object({
  name: z.string().min(2, 'Organisation name must be at least 2 characters'),
})
type FormData = z.infer<typeof schema>

export default function OrgSettingsPage() {
  return (
    <RoleGuard permission="users.manage">
      <OrgSettingsContent />
    </RoleGuard>
  )
}

function OrgSettingsContent() {
  const [org, setOrg] = useState<OrgInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  useEffect(() => {
    getMyOrg()
      .then((data) => {
        setOrg(data)
        reset({ name: data.name })
      })
      .catch(() => toast.error('Failed to load organisation details.'))
      .finally(() => setLoading(false))
  }, [reset])

  function startEdit() {
    if (org) reset({ name: org.name })
    setEditing(true)
  }

  function cancelEdit() {
    setEditing(false)
    if (org) reset({ name: org.name })
  }

  async function onSubmit(data: FormData) {
    try {
      const updated = await updateMyOrg({ name: data.name })
      setOrg(updated)
      setEditing(false)
      toast.success('Organisation name updated.')
    } catch (err) {
      const apiErr = err as ApiError
      toast.error(apiErr?.message ?? 'Failed to update. Please try again.')
    }
  }

  function copySlug() {
    if (org?.slug) {
      navigator.clipboard.writeText(org.slug)
      toast.success('Slug copied to clipboard.')
    }
  }

  return (
    <div className="p-6 max-w-2xl">
      <PageHeader
        title="Organisation"
        subtitle="Manage your organisation's settings."
      />

      {loading ? (
        <div className="mt-6 space-y-3">
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-10 w-48" />
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          {/* Org identity card */}
          <div className="flex items-center gap-4 p-5 rounded-xl border border-border bg-card">
            <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Building2 className="size-6 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-foreground text-base">{org?.name}</p>
              <p className="text-sm text-muted-foreground">/{org?.slug}</p>
            </div>
          </div>

          {/* Detail rows */}
          {!editing ? (
            <div className="space-y-4">
              <InfoRow label="Name" value={org?.name ?? '—'} />
              <InfoRow
                label="Slug"
                value={org?.slug ?? '—'}
                action={
                  <button
                    onClick={copySlug}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    title="Copy slug"
                  >
                    <Copy className="size-3.5" />
                  </button>
                }
              />
              <InfoRow label="Status" value={org?.isActive ? 'Active' : 'Inactive'} />
              <div className="pt-2">
                <Button variant="outline" size="sm" onClick={startEdit} className="gap-2">
                  <Pencil className="size-3.5" />
                  Edit name
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="orgName">Organisation name</Label>
                <Input
                  id="orgName"
                  placeholder="Enter organisation name"
                  aria-invalid={!!errors.name}
                  {...register('name')}
                />
                {errors.name && (
                  <p className="text-xs text-destructive" role="alert">{errors.name.message}</p>
                )}
              </div>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={cancelEdit}
                  disabled={isSubmitting}
                  className="gap-2"
                >
                  <X className="size-3.5" />
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="gap-2"
                >
                  {isSubmitting && <Loader2 className="size-3.5 animate-spin" />}
                  Save changes
                </Button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  )
}

function InfoRow({ label, value, action }: { label: string; value: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0">
      <span className="text-sm text-muted-foreground w-16 shrink-0">{label}</span>
      <span className="text-sm font-medium text-foreground flex-1">{value}</span>
      {action}
    </div>
  )
}
