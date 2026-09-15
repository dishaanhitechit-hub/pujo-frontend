'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useAuth } from '@/lib/auth/auth-provider'
import { apiConfig } from '@/config/api'
import { toast } from 'sonner'
import {
  Loader2, Upload, X, Building2, QrCode, Banknote,
  CheckCircle2, Info, ImageIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { PaymentInfo, ApiError } from '@/types'

const BASE = apiConfig.baseUrl

type Method = 'upi' | 'bank_transfer' | 'cash'

async function fetchPaymentInfo(token: string): Promise<PaymentInfo | null> {
  const res = await fetch(`${BASE}${apiConfig.endpoints.contributions.paymentInfo}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) return null
  const json = await res.json()
  return json.data ?? null
}

export default function ContributePage() {
  const { token, isLoading, user } = useAuth()
  const router = useRouter()

  const [info, setInfo] = useState<PaymentInfo | null>(null)
  const [method, setMethod] = useState<Method>('upi')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [time, setTime] = useState('')
  const [note, setNote] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!isLoading && !token) router.replace('/login')
    if (!isLoading && user?.role === 'admin') router.replace('/dashboard')
  }, [isLoading, token, user, router])

  useEffect(() => {
    if (!token) return
    fetchPaymentInfo(token).then(setInfo)
  }, [token])

  function pickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null
    setFile(f)
    if (f) setPreview(URL.createObjectURL(f))
    else setPreview(null)
  }

  function clearFile() {
    setFile(null)
    setPreview(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!token) return
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast.error('Enter a valid amount')
      return
    }

    const fd = new FormData()
    fd.append('paymentMethod', method)
    fd.append('amount', amount)
    fd.append('paymentDate', date)
    if (time) fd.append('paymentTime', time)
    if (note.trim()) fd.append('note', note.trim())
    if (file) fd.append('screenshot', file)

    setSubmitting(true)
    try {
      const res = await fetch(`${BASE}${apiConfig.endpoints.contributions.submit}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.message ?? 'Submission failed')
      setDone(true)
    } catch (err) {
      toast.error((err as ApiError).message ?? 'Submission failed')
    } finally {
      setSubmitting(false)
    }
  }

  if (isLoading || !token) return null

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4 text-center">
        <div className="size-16 rounded-full bg-green-100 flex items-center justify-center">
          <CheckCircle2 className="size-8 text-green-600" />
        </div>
        <h2 className="font-heading font-bold text-xl text-brand-navy">Request submitted!</h2>
        <p className="text-sm text-muted-foreground max-w-sm">
          Your contribution has been submitted for admin approval. You'll see it in your history once reviewed.
        </p>
        <div className="flex gap-3 mt-2">
          <Button variant="outline" onClick={() => { setDone(false); setAmount(''); setNote(''); clearFile() }}>
            Submit another
          </Button>
          <Button onClick={() => router.push('/my-contributions')}>
            View my contributions
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="font-heading font-bold text-2xl text-brand-navy">Submit a Contribution</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Made a payment toward the club? Record it here — admin will verify and approve.
        </p>
      </div>

      {/* Step 1: Choose method */}
      <section className="mb-6">
        <Label className="text-sm font-semibold text-brand-navy mb-3 block">Payment method</Label>
        <div className="grid grid-cols-3 gap-3">
          {([
            { id: 'upi',          label: 'UPI',          Icon: QrCode },
            { id: 'bank_transfer', label: 'Bank Transfer', Icon: Building2 },
            { id: 'cash',         label: 'Cash',          Icon: Banknote },
          ] as { id: Method; label: string; Icon: React.ElementType }[]).map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setMethod(id)}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 text-sm font-medium transition-all
                ${method === id
                  ? 'border-brand-orange bg-brand-orange/5 text-brand-orange'
                  : 'border-border text-muted-foreground hover:border-brand-orange/30'}`}
            >
              <Icon className="size-5" />
              {label}
            </button>
          ))}
        </div>
      </section>

      {/* Payment details panel */}
      {method === 'upi' && info && (info.upi.id || info.upi.qrUrl) && (
        <div className="mb-6 p-4 rounded-xl border border-brand-orange/20 bg-brand-orange/5 flex flex-col sm:flex-row gap-4 items-center">
          {info.upi.qrUrl && (
            <div className="shrink-0">
              <Image
                src={`${BASE}${info.upi.qrUrl}`}
                alt="UPI QR Code"
                width={120}
                height={120}
                className="rounded-lg border border-border"
              />
            </div>
          )}
          <div>
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">UPI ID</p>
            <p className="font-mono text-sm font-bold text-brand-navy">{info.upi.id ?? '—'}</p>
            <p className="text-xs text-muted-foreground mt-2">
              Scan the QR or copy the UPI ID to pay, then upload your screenshot below.
            </p>
          </div>
        </div>
      )}

      {method === 'bank_transfer' && info && (
        <div className="mb-6 p-4 rounded-xl border border-blue-200 bg-blue-50/50 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-700 mb-2">Bank Details</p>
          {[
            ['Bank', info.bank.bankName],
            ['Account Name', info.bank.accountName],
            ['Account Number', info.bank.accountNumber],
            ['IFSC', info.bank.ifsc],
            ['Branch', info.bank.branch],
          ].map(([label, val]) => val && (
            <div key={label} className="flex justify-between text-sm">
              <span className="text-muted-foreground">{label}</span>
              <span className="font-mono font-semibold text-brand-navy">{val}</span>
            </div>
          ))}
        </div>
      )}

      {method === 'cash' && (
        <div className="mb-6 p-4 rounded-xl border border-amber-200 bg-amber-50/50 flex gap-2 text-sm text-amber-800">
          <Info className="size-4 shrink-0 mt-0.5" />
          <span>For cash contributions, collect a receipt from the treasurer if possible and attach a photo of it as your screenshot.</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={submit} className="space-y-5">
        <div>
          <Label htmlFor="amount">Amount (₹) *</Label>
          <Input
            id="amount"
            type="number"
            min={1}
            step={0.01}
            placeholder="e.g. 500"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            className="mt-1"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="date">Payment date *</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="mt-1"
              required
            />
          </div>
          <div>
            <Label htmlFor="time">Approx. time <span className="text-muted-foreground">(optional)</span></Label>
            <Input
              id="time"
              type="time"
              value={time}
              onChange={e => setTime(e.target.value)}
              className="mt-1"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="note">Note <span className="text-muted-foreground">(optional)</span></Label>
          <Textarea
            id="note"
            placeholder="Any context you'd like to add..."
            value={note}
            onChange={e => setNote(e.target.value)}
            className="mt-1 resize-none"
            rows={3}
          />
        </div>

        {/* Screenshot upload */}
        <div>
          <Label className="mb-2 block">
            Screenshot / proof <span className="text-muted-foreground">(optional but recommended)</span>
          </Label>
          {preview ? (
            <div className="relative w-fit">
              <img
                src={preview}
                alt="preview"
                className="max-h-48 rounded-xl border border-border object-contain"
              />
              <button
                type="button"
                onClick={clearFile}
                className="absolute -top-2 -right-2 size-6 rounded-full bg-destructive text-white flex items-center justify-center hover:bg-destructive/80"
              >
                <X className="size-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex flex-col items-center gap-2 w-full py-8 rounded-xl border-2 border-dashed border-border hover:border-brand-orange/40 hover:bg-brand-orange/5 transition-all text-muted-foreground text-sm"
            >
              <ImageIcon className="size-6" />
              Click to upload payment screenshot
            </button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={pickFile}
          />
        </div>

        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting && <Loader2 className="size-4 animate-spin mr-2" />}
          {submitting ? 'Submitting…' : 'Submit for approval'}
        </Button>
      </form>
    </div>
  )
}
