'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { UseFormRegisterReturn } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getOrgsByEmail, type OrgOption } from '@/lib/api/auth'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const ROLE_LABEL: Record<string, string> = {
  admin: 'Admin', collector: 'Collector', member: 'Member',
  managing_committee: 'Managing Committee', core_committee: 'Core Committee', cashier: 'Cashier',
}

/** Looks up which organisations an email belongs to (for the org-code dropdown). */
export function useOrgOptions() {
  const [options, setOptions] = useState<OrgOption[]>([])
  const [fetching, setFetching] = useState(false)

  const lookup = useCallback(async (rawEmail: string): Promise<OrgOption[]> => {
    const email = rawEmail.trim().toLowerCase()
    if (!EMAIL_RE.test(email)) return []
    setFetching(true)
    try {
      const orgs = await getOrgsByEmail(email)
      setOptions(orgs)
      return orgs
    } catch {
      return [] // user can still type the code manually
    } finally {
      setFetching(false)
    }
  }, [])

  return { options, fetching, lookup }
}

interface OrgCodeFieldProps {
  registration: UseFormRegisterReturn
  options: OrgOption[]
  fetching: boolean
  onSelect: (orgCode: string) => void
  error?: string
}

export function OrgCodeField({ registration, options, fetching, onSelect, error }: OrgCodeFieldProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (options.length > 1) setOpen(true)
  }, [options])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div className="flex flex-col gap-1.5" ref={ref}>
      <Label htmlFor="orgCode">
        Organisation code
        {fetching && <span className="ml-2 text-xs text-muted-foreground animate-pulse">fetching…</span>}
      </Label>
      <div className="relative">
        <Input
          id="orgCode"
          type="text"
          autoComplete="off"
          maxLength={20}
          placeholder="e.g. PUJA3847"
          className="font-mono uppercase tracking-widest pr-8"
          aria-invalid={!!error}
          {...registration}
          onChange={(e) => { setOpen(false); registration.onChange(e) }}
          onFocus={() => options.length > 1 && setOpen(true)}
        />
        {options.length > 1 && (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setOpen((v) => !v)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs"
            aria-label="Show organisations"
          >
            ▾
          </button>
        )}

        {open && options.length > 0 && (
          <div className="absolute z-50 top-full mt-1 w-full rounded-md border border-border bg-white shadow-lg overflow-hidden">
            {options.map((opt) => (
              <button
                key={opt.orgCode}
                type="button"
                onClick={() => { onSelect(opt.orgCode); setOpen(false) }}
                className="w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-muted transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">{opt.orgName}</p>
                  <p className="text-xs text-muted-foreground font-mono">{opt.orgCode}</p>
                </div>
                <span className="text-xs bg-muted text-muted-foreground rounded px-1.5 py-0.5 shrink-0">
                  {ROLE_LABEL[opt.role] ?? opt.role}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
      {error && <p className="text-xs text-destructive" role="alert">{error}</p>}
      <p className="text-xs text-muted-foreground">Found in your welcome email. Enter your email above to auto-fill.</p>
    </div>
  )
}
