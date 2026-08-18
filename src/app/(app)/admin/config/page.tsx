'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2, Settings, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PageHeader } from '@/components/dashboard/PageHeader'
import { RoleGuard } from '@/lib/auth/role-guard'
import { getAdminConfig, updateAdminConfig } from '@/lib/api/admin'
import type { ApiError } from '@/types'
import { Skeleton } from '@/components/ui/skeleton'

const schema = z.object({
  upi_id: z.string().min(1, 'UPI ID is required'),
  org_name: z.string().min(1, 'Organisation name is required'),
})

type FormData = z.infer<typeof schema>

export default function AdminConfigPage() {
  return (
    <RoleGuard permission="admin.config">
      <ConfigContent />
    </RoleGuard>
  )
}

function ConfigContent() {
  const [loading, setLoading] = useState(true)
  const [configMeta, setConfigMeta] = useState<Record<string, string>>({})
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
        reset(res.config)
        setConfigMeta(res.allowedKeys)
      })
      .catch((err: ApiError) => setError(err.message ?? 'Failed to load configuration.'))
      .finally(() => setLoading(false))
  }, [reset])

  async function onSubmit(data: FormData) {
    try {
      const updated = await updateAdminConfig(data)
      reset(updated)
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
        subtitle="Configure the global UPI ID and organisation name."
        className="mb-8"
      />

      {loading ? (
        <div className="flex flex-col gap-5">
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-10 w-32" />
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-6">
          <div className="rounded-xl border border-border bg-card p-5 flex flex-col gap-5">
            <div className="flex items-center gap-2 pb-3 border-b border-border">
              <div className="size-8 rounded-lg bg-brand-orange/10 flex items-center justify-center">
                <Settings className="size-4 text-brand-orange" />
              </div>
              <h2 className="font-semibold text-sm">Payment Configuration</h2>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="upi_id">
                UPI ID <span className="text-destructive">*</span>
              </Label>
              {configMeta.upi_id && (
                <p className="text-xs text-muted-foreground mb-1">{configMeta.upi_id}</p>
              )}
              <Input
                id="upi_id"
                placeholder="committee@upi"
                aria-invalid={!!errors.upi_id}
                {...register('upi_id')}
              />
              {errors.upi_id && <p className="text-xs text-destructive">{errors.upi_id.message}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="org_name">
                Organisation Name <span className="text-destructive">*</span>
              </Label>
              {configMeta.org_name && (
                <p className="text-xs text-muted-foreground mb-1">{configMeta.org_name}</p>
              )}
              <Input
                id="org_name"
                placeholder="Durga Puja 2026"
                aria-invalid={!!errors.org_name}
                {...register('org_name')}
              />
              {errors.org_name && <p className="text-xs text-destructive">{errors.org_name.message}</p>}
            </div>
          </div>

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
