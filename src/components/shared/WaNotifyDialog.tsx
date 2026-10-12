'use client'

import { useEffect, useState } from 'react'
import { Loader2, MessageCircle, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { getUsers } from '@/lib/api/users'
import type { User, ApiError } from '@/types'
import type { WaBulkResult } from '@/lib/api/whatsapp'

interface Props {
  open: boolean
  onOpenChange: (o: boolean) => void
  title: string
  /** Called with the selected ids, or 'all'. Should call the relevant API and return the result. */
  onSend: (payload: { userIds: number[] } | { all: true }) => Promise<WaBulkResult>
}

function userPhone(u: User): string {
  return u.whatsappNo || u.phone || ''
}

export function WaNotifyDialog({ open, onOpenChange, title, onSend }: Props) {
  const [users, setUsers]     = useState<User[]>([])
  const [search, setSearch]   = useState('')
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [result, setResult]   = useState<WaBulkResult | null>(null)
  const [error, setError]     = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setResult(null)
    setError(null)
    setSearch('')
    setSelected(new Set())
    setLoading(true)
    getUsers()
      .then((data) => setUsers(data.filter((u) => u.isActive)))
      .catch((err: ApiError) => setError(err.message ?? 'Failed to load members.'))
      .finally(() => setLoading(false))
  }, [open])

  const q = search.trim().toLowerCase()
  const visible = q
    ? users.filter((u) => u.name.toLowerCase().includes(q) || (u.memberId ?? '').toLowerCase().includes(q))
    : users

  function toggle(id: number) {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function selectAll() { setSelected(new Set(visible.map((u) => u.id))) }
  function clearAll()  { setSelected(new Set()) }

  async function handleSend(all: boolean) {
    setResult(null)
    setError(null)
    setSending(true)
    try {
      const payload = all ? { all: true as const } : { userIds: [...selected] }
      const res = await onSend(payload)
      setResult(res)
    } catch (err: unknown) {
      setError((err as ApiError).message ?? 'Send failed.')
    } finally {
      setSending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="size-4 text-green-600" />
            {title}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Search + select all / clear */}
            <div className="flex items-center gap-2 mb-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search member…"
                  className="pl-8 h-8 text-sm"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>
              <Button variant="outline" size="sm" className="h-8 text-xs shrink-0" onClick={selectAll}>All</Button>
              <Button variant="ghost"   size="sm" className="h-8 text-xs shrink-0" onClick={clearAll}>Clear</Button>
            </div>

            {/* Member list */}
            <div className="border border-border rounded-lg max-h-64 overflow-y-auto divide-y divide-border">
              {visible.length === 0 && (
                <div className="py-8 text-center text-sm text-muted-foreground">No members found.</div>
              )}
              {visible.map((u) => {
                const phone = userPhone(u)
                const isChecked = selected.has(u.id)
                return (
                  <label
                    key={u.id}
                    className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-muted/30 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggle(u.id)}
                      disabled={!phone}
                      className="accent-green-600 size-4 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{u.name}</p>
                      {u.memberId && <p className="text-[11px] text-muted-foreground font-mono">{u.memberId}</p>}
                    </div>
                    <span className={`text-xs shrink-0 ${phone ? 'text-muted-foreground' : 'text-destructive'}`}>
                      {phone || '⚠ no phone'}
                    </span>
                  </label>
                )
              })}
            </div>

            <p className="text-xs text-muted-foreground mt-1">
              {selected.size} selected · {users.filter(u => userPhone(u)).length} members have a phone/WhatsApp number
            </p>

            {/* Result */}
            {result && (
              <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm">
                <span className="font-semibold text-green-700">✅ {result.sent} sent</span>
                {result.failed > 0 && (
                  <span className="font-semibold text-destructive ml-3">⚠ {result.failed} failed</span>
                )}
                {result.errors.length > 0 && (
                  <ul className="mt-1.5 text-xs text-muted-foreground list-none space-y-0.5">
                    {result.errors.slice(0, 5).map((e) => (
                      <li key={e.userId}>{e.name}: {e.error}</li>
                    ))}
                    {result.errors.length > 5 && <li>…and {result.errors.length - 5} more</li>}
                  </ul>
                )}
              </div>
            )}

            {error && (
              <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">{error}</div>
            )}
          </>
        )}

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">Close</Button>
          <Button
            variant="outline"
            disabled={sending || loading}
            onClick={() => handleSend(true)}
            className="flex-1 text-green-700 border-green-200 hover:bg-green-50"
          >
            {sending ? <Loader2 className="size-4 animate-spin mr-1.5" /> : <MessageCircle className="size-4 mr-1.5" />}
            Send All
          </Button>
          <Button
            disabled={sending || loading || selected.size === 0}
            onClick={() => handleSend(false)}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
          >
            {sending ? <Loader2 className="size-4 animate-spin mr-1.5" /> : <MessageCircle className="size-4 mr-1.5" />}
            Send ({selected.size})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
