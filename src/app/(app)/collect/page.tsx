'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Loader2, IndianRupee, User, Phone, MapPin, FileText, Tag, CalendarDays,
  AlertCircle, Users, UserPlus, Search, Check, X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PageHeader } from '@/components/dashboard/PageHeader'
import { RoleGuard } from '@/lib/auth/role-guard'
import { listActiveEvents } from '@/lib/api/events'
import { createSlip, getDonorTypes, getSlipMembers, type SlipMember } from '@/lib/api/slips'
import { DONOR_TYPES } from '@/constants'
import { cn } from '@/lib/utils'
import type { ApiError, EventSummary, DonorKind } from '@/types'

export default function CollectPage() {
  return (
    <RoleGuard requireCanCollect>
      <CollectContent />
    </RoleGuard>
  )
}

function CollectContent() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [events, setEvents] = useState<EventSummary[]>([])
  const [eventsLoading, setEventsLoading] = useState(true)
  const [eventId, setEventId] = useState<number | null>(null)

  const [donorKind, setDonorKind] = useState<DonorKind>('other')

  // member picker
  const [members, setMembers] = useState<SlipMember[]>([])
  const [memberSearch, setMemberSearch] = useState('')
  const [selectedMember, setSelectedMember] = useState<SlipMember | null>(null)

  // other donor
  const [donorTypes, setDonorTypes] = useState<string[]>([])
  const [form, setForm] = useState({ name: '', phone: '', address: '', notes: '', donorType: '' })

  const [amount, setAmount] = useState('')
  const reqRef = useRef(0)

  useEffect(() => {
    const req = ++reqRef.current
    setEventsLoading(true)
    listActiveEvents()
      .then((d) => { if (req === reqRef.current) setEvents(d) })
      .catch(() => { if (req === reqRef.current) setEvents([]) })
      .finally(() => { if (req === reqRef.current) setEventsLoading(false) })
    getSlipMembers().then(setMembers).catch(() => {})
    getDonorTypes().then(setDonorTypes).catch(() => {})
  }, [])

  const noActiveEvents = !eventsLoading && events.length === 0
  const mergedTypes = Array.from(new Set([...donorTypes, ...DONOR_TYPES]))

  const filteredMembers = memberSearch.trim()
    ? members.filter((m) => [m.name, m.phone, m.memberId].some((v) => v?.toLowerCase().includes(memberSearch.toLowerCase())))
    : members

  function set(field: keyof typeof form, value: string) {
    setForm((p) => ({ ...p, [field]: value }))
  }

  function validate(): string | null {
    if (!eventId) return 'Select an event'
    if (donorKind === 'member' && !selectedMember) return 'Select a member'
    if (donorKind === 'other' && !form.name.trim()) return 'Donor name is required'
    if (donorKind === 'other' && !form.donorType) return 'Select a donor type'
    if (!amount || !/^\d+(\.\d{1,2})?$/.test(amount)) return 'Enter a valid amount'
    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const err = validate()
    if (err) { toast.error(err); return }
    setSubmitting(true)
    try {
      const slip = await createSlip({
        eventId: eventId!,
        donorKind,
        memberUserId: donorKind === 'member' ? selectedMember!.id : null,
        donorName: donorKind === 'other' ? form.name.trim() : null,
        donorPhone: donorKind === 'other' ? (form.phone.trim() || null) : null,
        donorAddress: donorKind === 'other' ? (form.address.trim() || null) : null,
        donorNotes: form.notes.trim() || null,
        donorType: donorKind === 'other' ? form.donorType : null,
        totalAmount: Number(amount),
      })
      toast.success(`Slip ${slip.slipNumber} created.`)
      router.push(`/collect/${slip.id}`)
    } catch (err) {
      toast.error((err as ApiError).message ?? 'Failed to create slip.')
      setSubmitting(false)
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl">
      <PageHeader title="Create Contribution Slip" subtitle="Create a slip, then collect payments against it (QR or manual)." className="mb-6" />

      {noActiveEvents && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <AlertCircle className="size-4 mt-0.5 shrink-0" />
          <p>No events are currently accepting collections. Contact an admin to enable an event.</p>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
        {/* Event */}
        <fieldset className="border border-border rounded-xl p-5 flex flex-col gap-3">
          <legend className="text-sm font-semibold px-1">Collection Event</legend>
          <div className="flex flex-col gap-1.5">
            <Label className="flex items-center gap-1.5"><CalendarDays className="size-3.5 text-muted-foreground" /> Event <span className="text-destructive">*</span></Label>
            <Select onValueChange={(v) => setEventId(Number(v))} value={eventId ? String(eventId) : ''} disabled={eventsLoading || noActiveEvents}>
              <SelectTrigger className="w-full"><SelectValue placeholder={eventsLoading ? 'Loading…' : 'Select event'} /></SelectTrigger>
              <SelectContent position="popper">
                {events.map((e) => <SelectItem key={e.id} value={String(e.id)}>{e.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </fieldset>

        {/* Donor */}
        <fieldset className="border border-border rounded-xl p-5 flex flex-col gap-5">
          <legend className="text-sm font-semibold px-1">Donor</legend>

          {/* Donor kind toggle */}
          <div className="grid grid-cols-2 gap-3">
            <KindButton active={donorKind === 'member'} onClick={() => setDonorKind('member')} icon={<Users className="size-4" />} label="Member" desc="Pick an org member" />
            <KindButton active={donorKind === 'other'} onClick={() => setDonorKind('other')} icon={<UserPlus className="size-4" />} label="Other" desc="External donor" />
          </div>

          {donorKind === 'member' ? (
            <div className="flex flex-col gap-2">
              {selectedMember ? (
                <div className="flex items-start gap-3 rounded-xl border border-brand-orange/30 bg-brand-orange/5 px-4 py-3">
                  <div className="size-9 rounded-full bg-brand-orange/10 border border-brand-orange/20 flex items-center justify-center shrink-0">
                    <span className="text-xs font-semibold text-brand-orange">{selectedMember.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{selectedMember.name}</p>
                    <p className="text-xs text-muted-foreground">{[selectedMember.memberId, selectedMember.phone, selectedMember.address].filter(Boolean).join(' · ') || '—'}</p>
                  </div>
                  <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => setSelectedMember(null)}>Change</Button>
                </div>
              ) : (
                <>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                    <Input placeholder="Search member by name, ID, phone…" value={memberSearch} onChange={(e) => setMemberSearch(e.target.value)} className="pl-9" />
                  </div>
                  <div className="max-h-56 overflow-y-auto rounded-lg border border-border divide-y divide-border">
                    {filteredMembers.length === 0 ? (
                      <p className="p-4 text-sm text-muted-foreground text-center">No members found.</p>
                    ) : filteredMembers.map((m) => (
                      <button key={m.id} type="button" onClick={() => { setSelectedMember(m); setMemberSearch('') }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-muted/40 transition-colors">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{m.name}{m.address ? <span className="font-normal text-muted-foreground"> | {m.address}</span> : ''}</p>
                          <p className="text-xs text-muted-foreground truncate">{[m.memberId, m.phone].filter(Boolean).join(' · ') || '—'}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-1.5">
                <Label className="flex items-center gap-1.5"><Tag className="size-3.5 text-muted-foreground" /> Donor Type <span className="text-destructive">*</span></Label>
                <Select onValueChange={(v) => set('donorType', v)} value={form.donorType}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Select donor type" /></SelectTrigger>
                  <SelectContent position="popper">
                    {mergedTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="flex items-center gap-1.5"><User className="size-3.5 text-muted-foreground" /> Donor Name <span className="text-destructive">*</span></Label>
                <Input placeholder="Full name" value={form.name} onChange={(e) => set('name', e.target.value)} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="flex flex-col gap-1.5">
                  <Label className="flex items-center gap-1.5"><Phone className="size-3.5 text-muted-foreground" /> Phone</Label>
                  <Input type="tel" placeholder="10-digit mobile" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="flex items-center gap-1.5"><MapPin className="size-3.5 text-muted-foreground" /> Address</Label>
                  <Input placeholder="Optional" value={form.address} onChange={(e) => set('address', e.target.value)} />
                </div>
              </div>
            </>
          )}

          <div className="flex flex-col gap-1.5">
            <Label className="flex items-center gap-1.5"><FileText className="size-3.5 text-muted-foreground" /> Notes</Label>
            <Textarea placeholder="Optional" rows={2} value={form.notes} onChange={(e) => set('notes', e.target.value)} />
          </div>
        </fieldset>

        {/* Amount */}
        <fieldset className="border border-border rounded-xl p-5 flex flex-col gap-3">
          <legend className="text-sm font-semibold px-1">Slip Amount</legend>
          <div className="flex flex-col gap-1.5">
            <Label className="flex items-center gap-1.5"><IndianRupee className="size-3.5 text-muted-foreground" /> Total Amount <span className="text-destructive">*</span></Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">₹</span>
              <Input type="text" inputMode="decimal" placeholder="500.00" className="pl-7" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
            <p className="text-xs text-muted-foreground">The committed/total amount for this slip. Payments can be collected in parts until it is fully paid.</p>
          </div>
        </fieldset>

        <Button type="submit" disabled={submitting || noActiveEvents || eventsLoading}
          className="w-full sm:w-auto bg-brand-orange hover:bg-brand-orange/90 text-white h-11 font-semibold px-8 self-start disabled:opacity-50">
          {submitting && <Loader2 className="size-4 animate-spin mr-2" />}
          {submitting ? 'Creating…' : 'Create Slip'}
        </Button>
      </form>
    </div>
  )
}

function KindButton({ active, onClick, icon, label, desc }: {
  active: boolean; onClick: () => void; icon: React.ReactNode; label: string; desc: string
}) {
  return (
    <button type="button" onClick={onClick}
      className={cn('flex items-center gap-3 rounded-xl border-2 p-3 text-left transition-all',
        active ? 'border-brand-orange bg-brand-orange/5' : 'border-border hover:border-brand-orange/30')}>
      <div className={cn('size-9 rounded-lg flex items-center justify-center shrink-0', active ? 'bg-brand-orange text-white' : 'bg-muted text-muted-foreground')}>
        {active ? <Check className="size-4" /> : icon}
      </div>
      <div>
        <p className="text-sm font-semibold">{label}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
    </button>
  )
}
