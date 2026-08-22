'use client'

import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { generateToken, bulkGenerateTokens, listTokens } from '@/lib/api/tokens'
import type { PaginatedTokens, ApiError } from '@/types'
import { RoleGuard } from '@/lib/auth/role-guard'
import { PageHeader } from '@/components/dashboard/PageHeader'
import { TokenStatusBadge } from '@/components/shared/StatusBadge'
import { FilterChip } from '@/components/shared/FilterChip'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ChevronLeft, ChevronRight, Loader2, ExternalLink, Printer, Search, X } from 'lucide-react'
import { apiConfig } from '@/config/api'
import { useAuth } from '@/lib/auth/auth-provider'
import { useDebouncedValue } from '@/hooks/use-debounced-value'

const singleSchema = z.object({
  type: z.enum(['single', 'dual']),
  participantName: z.string().min(1, 'Name is required'),
  topic: z.string().optional(),
})

type SingleForm = z.infer<typeof singleSchema>

export default function TokensPage() {
  return (
    <RoleGuard permission="token.generate">
      <TokensContent />
    </RoleGuard>
  )
}

function TokensContent() {
  const { user } = useAuth()
  const canBulk = user?.role === 'admin'

  const [data, setData] = useState<PaginatedTokens | null>(null)
  const [page, setPage] = useState(1)
  // search = raw input; debouncedSearch gates the API
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search, 350)
  const [tokenStatus, setTokenStatus] = useState<'active' | 'void' | ''>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [generatingBulk, setGeneratingBulk] = useState(false)
  // Increment to force a refresh without changing other filter state (e.g. after token generation)
  const [refreshKey, setRefreshKey] = useState(0)
  const reqRef = useRef(0)

  const { register: regSingle, handleSubmit: handleSingle, reset: resetSingle, formState: { errors: errSingle, isSubmitting: isSingle } } = useForm<SingleForm>({
    resolver: zodResolver(singleSchema),
    defaultValues: { type: 'dual' },
  })

  const [bulkCount, setBulkCount] = useState(10)

  // Reset to page 1 when search changes (skip initial mount)
  const searchSyncedRef = useRef(false)
  useEffect(() => {
    if (!searchSyncedRef.current) { searchSyncedRef.current = true; return }
    setPage(1)
  }, [debouncedSearch])

  // Single data fetch effect — debouncedSearch, not raw search, drives the API
  useEffect(() => {
    const req = ++reqRef.current
    setLoading(true)
    setError(null)
    listTokens({ page, search: debouncedSearch || undefined, status: tokenStatus || undefined })
      .then((result) => { if (req === reqRef.current) setData(result) })
      .catch((err: ApiError) => { if (req === reqRef.current) setError(err.message ?? 'Failed to load tokens.') })
      .finally(() => { if (req === reqRef.current) setLoading(false) })
  }, [page, debouncedSearch, tokenStatus, refreshKey])

  function handleSearchChange(val: string) {
    setSearch(val)
  }

  function setStatusFilter(s: typeof tokenStatus) {
    setTokenStatus(s)
    setPage(1)
  }

  async function onSingleSubmit(formData: SingleForm) {
    try {
      const token = await generateToken(formData)
      toast.success(`Token ${token.tokenNo} generated.`)
      resetSingle()
      window.open(`${apiConfig.baseUrl}${token.printUrl}`, '_blank')
      setRefreshKey(k => k + 1)
    } catch (err) {
      const apiErr = err as ApiError
      toast.error(apiErr?.message ?? 'Failed to generate token.')
    }
  }

  async function onBulkSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (bulkCount < 1 || bulkCount > 500) return
    setGeneratingBulk(true)
    try {
      const result = await bulkGenerateTokens({ count: bulkCount })
      toast.success(`${result.count} bulk tokens generated.`)
      window.open(`${apiConfig.baseUrl}${result.printUrl}`, '_blank')
      setRefreshKey(k => k + 1)
    } catch (err) {
      const apiErr = err as ApiError
      toast.error(apiErr?.message ?? 'Failed to generate bulk tokens.')
    } finally {
      setGeneratingBulk(false)
    }
  }

  return (
    <div className="p-6 lg:p-8 flex flex-col gap-8">
      <PageHeader title="Tokens" subtitle="Generate and manage entry tokens." />

      {/* Generate forms */}
      <div className={`grid grid-cols-1 gap-6 ${canBulk ? 'lg:grid-cols-2' : ''}`}>
        <div className="rounded-xl border border-border bg-card p-5 flex flex-col gap-4">
          <h2 className="font-semibold text-sm">Generate Single / Dual Token</h2>
          <form onSubmit={handleSingle(onSingleSubmit)} className="flex flex-col gap-4">
            <div className="flex gap-3">
              {(['single', 'dual'] as const).map((t) => (
                <label key={t} className="flex items-center gap-2 cursor-pointer text-sm">
                  <input type="radio" value={t} {...regSingle('type')} className="accent-brand-orange" />
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </label>
              ))}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="participantName">Participant Name <span className="text-destructive">*</span></Label>
              <Input id="participantName" placeholder="Full name" {...regSingle('participantName')} aria-invalid={!!errSingle.participantName} />
              {errSingle.participantName && <p className="text-xs text-destructive">{errSingle.participantName.message}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="topic">Topic (optional)</Label>
              <Input id="topic" placeholder="Durga Puja 2024" {...regSingle('topic')} />
            </div>
            <Button type="submit" disabled={isSingle} className="bg-brand-orange hover:bg-brand-orange/90 text-white self-start">
              {isSingle && <Loader2 className="size-4 animate-spin mr-2" />}
              Generate & Print
            </Button>
          </form>
        </div>

        {canBulk && (
          <div className="rounded-xl border border-border bg-card p-5 flex flex-col gap-4">
            <h2 className="font-semibold text-sm">Bulk Generate (Admin)</h2>
            <form onSubmit={onBulkSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="count">Count (1–500)</Label>
                <Input
                  id="count"
                  type="number"
                  min={1}
                  max={500}
                  value={bulkCount}
                  onChange={(e) => setBulkCount(Number(e.target.value))}
                />
              </div>
              <Button type="submit" disabled={generatingBulk} variant="outline" className="self-start">
                {generatingBulk && <Loader2 className="size-4 animate-spin mr-2" />}
                Generate Bulk & Print
              </Button>
            </form>
          </div>
        )}
      </div>

      {/* Token list */}
      <div className="rounded-xl border border-border bg-card">
        <div className="p-5 border-b border-border flex flex-wrap items-center gap-3">
          <h2 className="font-semibold text-sm mr-auto">All Tokens</h2>
          <div className="relative min-w-[180px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
            <Input value={search} onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Token no. or participant…" className="pl-8 h-8 text-sm" />
            {search && (
              <button onClick={() => handleSearchChange('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="size-3.5" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            {(['', 'active', 'void'] as const).map((s) => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${tokenStatus === s ? 'bg-brand-navy text-white' : 'bg-muted text-muted-foreground hover:bg-brand-navy/10 hover:text-brand-navy'}`}>
                {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>
        {(search || tokenStatus) && (
          <div className="px-5 py-2 flex flex-wrap gap-2 border-b border-border bg-muted/10">
            {search && <FilterChip label={`Search: ${search}`} onRemove={() => handleSearchChange('')} />}
            {tokenStatus && <FilterChip label={`Status: ${tokenStatus}`} onRemove={() => setStatusFilter('')} />}
          </div>
        )}
        {error ? (
          <div className="p-6 text-sm text-destructive">{error}</div>
        ) : loading ? (
          <div className="p-4 flex flex-col gap-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
        ) : !data || data.tokens.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">No tokens generated yet.</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/20">
                    {['Token No', 'Type', 'Participant', 'Topic', 'Status', 'Generated', 'Actions'].map((h) => (
                      <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.tokens.map((t) => (
                    <tr key={t.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                      <td className="px-5 py-3 font-mono font-semibold text-xs">{t.tokenNo}</td>
                      <td className="px-5 py-3 text-xs capitalize">{t.type}</td>
                      <td className="px-5 py-3">{t.participantName ?? '—'}</td>
                      <td className="px-5 py-3 text-xs text-muted-foreground">{t.topic ?? '—'}</td>
                      <td className="px-5 py-3"><TokenStatusBadge status={t.status} /></td>
                      <td className="px-5 py-3 text-xs text-muted-foreground">
                        {new Date(t.generatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-5 py-3 flex items-center gap-2">
                        <a href={`${apiConfig.baseUrl}${t.viewUrl}`} target="_blank" rel="noopener noreferrer" title="View token" className="text-muted-foreground hover:text-foreground">
                          <ExternalLink className="size-3.5" />
                        </a>
                        <a href={`${apiConfig.baseUrl}${t.printUrl}`} target="_blank" rel="noopener noreferrer" title="Print token" className="text-muted-foreground hover:text-foreground">
                          <Printer className="size-3.5" />
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {data.pages > 1 && (
              <div className="flex items-center justify-between px-5 py-4 border-t border-border">
                <p className="text-xs text-muted-foreground">Page {data.page} of {data.pages} · {data.total} total</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}><ChevronLeft className="size-4" /></Button>
                  <Button variant="outline" size="sm" disabled={page >= data.pages} onClick={() => setPage(p => p + 1)}><ChevronRight className="size-4" /></Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
