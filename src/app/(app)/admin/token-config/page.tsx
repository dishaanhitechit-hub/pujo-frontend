'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { getTokenConfig, updateTokenConfig, resetTokenCounter } from '@/lib/api/tokens'
import type { TokenConfig, ApiError } from '@/types'
import { RoleGuard } from '@/lib/auth/role-guard'
import { PageHeader } from '@/components/dashboard/PageHeader'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, RefreshCw } from 'lucide-react'
import { useAuth } from '@/lib/auth/auth-provider'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'

const schema = z.object({
  tokenPrefix: z.string().max(10).optional(),
  tokenSuffix: z.string().max(10).optional(),
  tokenPadWidth: z.string().regex(/^\d+$/, 'Must be a number').optional(),
  tokenStartNumber: z.string().regex(/^\d+$/, 'Must be a number').optional(),
  tokenDefaultTopic: z.string().max(200).optional(),
})

type FormData = z.infer<typeof schema>

export default function TokenConfigPage() {
  return (
    <RoleGuard permission="users.manage">
      <TokenConfigContent />
    </RoleGuard>
  )
}

function TokenConfigContent() {
  const { user } = useAuth()
  const [config, setConfig] = useState<TokenConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [resetting, setResetting] = useState(false)
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false)

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  function loadConfig() {
    setLoading(true)
    getTokenConfig()
      .then((c) => {
        setConfig(c)
        reset({
          tokenPrefix: c.tokenPrefix,
          tokenSuffix: c.tokenSuffix,
          tokenPadWidth: c.tokenPadWidth,
          tokenStartNumber: c.tokenStartNumber,
          tokenDefaultTopic: c.tokenDefaultTopic,
        })
      })
      .catch((err: ApiError) => toast.error(err.message ?? 'Failed to load token config.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadConfig() }, [])

  async function onSubmit(data: FormData) {
    try {
      await updateTokenConfig(data)
      toast.success('Token config updated.')
      loadConfig()
    } catch (err) {
      const apiErr = err as ApiError
      toast.error(apiErr?.message ?? 'Failed to update config.')
    }
  }

  async function handleReset() {
    setResetting(true)
    try {
      const result = await resetTokenCounter()
      toast.success(`Counter reset. Next token starts at ${result.nextTokenStartsAt}.`)
      loadConfig()
    } catch (err) {
      const apiErr = err as ApiError
      toast.error(apiErr?.message ?? 'Failed to reset counter.')
    } finally {
      setResetting(false)
    }
  }

  return (
    <div className="p-6 lg:p-8 max-w-2xl">
      <PageHeader title="Token Configuration" subtitle="Configure token numbering format and defaults." className="mb-8" />

      {loading ? (
        <div className="flex flex-col gap-4">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}</div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
          <div className="rounded-xl border border-border bg-card p-5 flex flex-col gap-5">
            <h2 className="font-semibold text-sm">Number Format</h2>

            {config?.tokenCurrentNumber && (
              <div className="rounded-lg bg-muted/50 px-4 py-3 text-sm">
                <span className="text-muted-foreground">Current token number: </span>
                <span className="font-mono font-semibold">{config.tokenCurrentNumber}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="tokenPrefix">Prefix</Label>
                <Input id="tokenPrefix" placeholder="PP" {...register('tokenPrefix')} />
                {errors.tokenPrefix && <p className="text-xs text-destructive">{errors.tokenPrefix.message}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="tokenSuffix">Suffix</Label>
                <Input id="tokenSuffix" placeholder="SS" {...register('tokenSuffix')} />
                {errors.tokenSuffix && <p className="text-xs text-destructive">{errors.tokenSuffix.message}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="tokenPadWidth">Pad Width</Label>
                <Input id="tokenPadWidth" placeholder="4" {...register('tokenPadWidth')} />
                {errors.tokenPadWidth && <p className="text-xs text-destructive">{errors.tokenPadWidth.message}</p>}
                <p className="text-xs text-muted-foreground">Zero-pad width, e.g. 4 → 0001</p>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="tokenStartNumber">Start Number</Label>
                <Input id="tokenStartNumber" placeholder="1" {...register('tokenStartNumber')} />
                {errors.tokenStartNumber && <p className="text-xs text-destructive">{errors.tokenStartNumber.message}</p>}
                <p className="text-xs text-muted-foreground">Used after a counter reset</p>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="tokenDefaultTopic">Default Topic</Label>
              <Input id="tokenDefaultTopic" placeholder="Durga Puja 2024" {...register('tokenDefaultTopic')} />
              <p className="text-xs text-muted-foreground">Fallback topic when none is provided</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={isSubmitting} className="bg-brand-orange hover:bg-brand-orange/90 text-white">
              {isSubmitting && <Loader2 className="size-4 animate-spin mr-2" />}
              Save Configuration
            </Button>
            {user?.role === 'admin' && (
              <Button type="button" variant="outline" onClick={() => setResetConfirmOpen(true)} disabled={resetting} className="text-destructive border-destructive/30 hover:bg-destructive/5">
                {resetting ? <Loader2 className="size-4 animate-spin mr-2" /> : <RefreshCw className="size-4 mr-2" />}
                Reset Counter
              </Button>
            )}
          </div>
        </form>
      )}
      <ConfirmDialog
        open={resetConfirmOpen}
        onOpenChange={setResetConfirmOpen}
        title="Reset Token Counter?"
        description="This will restart token numbering from the configured start number. Existing issued tokens are not affected."
        confirmLabel="Reset Counter"
        cancelLabel="Keep current"
        onConfirm={handleReset}
      />
    </div>
  )
}
