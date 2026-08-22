'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { ExternalLink } from 'lucide-react'
import type { Payment } from '@/types'
import { apiConfig } from '@/config/api'

interface PaymentDetailDialogProps {
  payment: Payment | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

function fmtAmount(v: string | number) {
  return `₹${Number(v).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
}

function fmtDate(d: string | null | undefined) {
  if (!d) return null
  return new Date(d).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function Field({ label, value }: { label: string; value?: string | number | boolean | null }) {
  const isEmpty = value === null || value === undefined || value === ''
  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      {isEmpty ? (
        <p className="text-sm text-muted-foreground/40 italic">Not provided</p>
      ) : typeof value === 'boolean' ? (
        <p className="text-sm font-medium">{value ? 'Yes' : 'No'}</p>
      ) : (
        <p className="text-sm font-medium text-foreground">{String(value)}</p>
      )}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground border-b border-border pb-1.5">
        {title}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">{children}</div>
    </div>
  )
}

export function PaymentDetailDialog({ payment, open, onOpenChange }: PaymentDetailDialogProps) {
  if (!payment) return null

  const { donor } = payment
  const hasReceiptUrl = !!payment.receiptNo

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2.5 pr-8">
            <DialogTitle>{donor.name}</DialogTitle>
            <StatusBadge status={payment.status} />
          </div>
        </DialogHeader>

        <div className="flex flex-col gap-5 pt-1">
          <Section title="Donor Information">
            <Field label="Full Name" value={donor.name} />
            <Field label="Donor Type" value={donor.donorType} />
            <Field label="Phone" value={donor.phone} />
            <Field label="Address" value={donor.address} />
            {donor.notes && <Field label="Notes" value={donor.notes} />}
            <Field label="Registered" value={fmtDate(donor.createdAt)} />
          </Section>

          <Section title="Payment Details">
            <Field label="Payment ID" value={`#${payment.id}`} />
            <Field label="Amount" value={fmtAmount(payment.amount)} />
            <Field label="Method" value={payment.method.toUpperCase()} />
            <Field label="Receipt No." value={payment.receiptNo ?? null} />
            {payment.utrNumber && <Field label="UTR Number" value={payment.utrNumber} />}
            {payment.chequeNumber && <Field label="Cheque No." value={payment.chequeNumber} />}
            {payment.bankName && <Field label="Bank Name" value={payment.bankName} />}
            {payment.chequeDate && <Field label="Cheque Date" value={payment.chequeDate} />}
            {payment.pledgeId && <Field label="Pledge ID" value={`#${payment.pledgeId}`} />}
            <Field label="Collector" value={payment.collector.name} />
            <Field label="Initiated" value={fmtDate(payment.createdAt)} />
            {payment.confirmedAt && <Field label="Confirmed" value={fmtDate(payment.confirmedAt)} />}
            {payment.cancelledAt && <Field label="Cancelled" value={fmtDate(payment.cancelledAt)} />}
            {payment.whatsappSent !== undefined && (
              <Field label="WhatsApp Sent" value={payment.whatsappSent} />
            )}
          </Section>
        </div>

        <DialogFooter showCloseButton>
          {hasReceiptUrl && (
            <Button asChild variant="outline" size="sm">
              <a
                href={`${apiConfig.baseUrl}${apiConfig.backendPages.payReceipt(payment.id)}?from=detail`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="size-3.5 mr-1.5" />
                View Receipt
              </a>
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
