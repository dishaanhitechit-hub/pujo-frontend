'use client'

import React, { useRef, useState, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react'
import { toPng } from 'html-to-image'
import { Source_Sans_3, Marcellus } from 'next/font/google'
import { Download, Loader2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { MEMBER_CATEGORY_LABELS } from '@/config/members'
import type { User } from '@/types'

const sourceSans = Source_Sans_3({ subsets: ['latin'], weight: ['600', '700'], display: 'swap' })
const marcellus  = Marcellus({ subsets: ['latin'], weight: ['400'], display: 'swap' })

const CARD_W = 1536
const CARD_H = 1024

// Positions measured from the 1536×1024 template (y = vertical centre of each text row)
const ROWS = {
  name:     { x: 663, y: 578, size: 36.7, color: 'rgb(215,8,9)', weight: 700 },
  address:  { x: 663, y: 635, size: 26.0, color: 'rgb(1,8,88)',  weight: 600 },
  mobile:   { x: 662, y: 692, size: 27.3, color: 'rgb(1,8,88)',  weight: 600 },
  memberid: { x: 663, y: 750, size: 32.4, color: 'rgb(1,8,88)',  weight: 600 },
  since:    { x: 664, y: 808, size: 31.4, color: 'rgb(1,8,88)',  weight: 600 },
}

// Seal area centre in t7 template: cx=1324, single line y=661, two lines y=648/674
const SEAL = { cx: 1324, y1: 648, y2: 674, size: 15 }

function formatSince(v: string | null | undefined): string {
  if (!v) return '—'
  try {
    const d = new Date(v.length === 10 ? v + 'T12:00:00' : v)
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
      .replace(/\s/g, ' - ')
  } catch { return v }
}

// Split category label into two seal lines, max 2 words each line
function sealLines(cat: string): [string, string] {
  const words = cat.toUpperCase().split(' ')
  if (words.length <= 2) return [words[0] ?? '', words.slice(1).join(' ')]
  const mid = Math.ceil(words.length / 2)
  return [words.slice(0, mid).join(' '), words.slice(mid).join(' ')]
}

interface Props {
  user: User
  hideHeader?: boolean
}

export interface MemberCardHandle {
  download: () => Promise<void>
}

export const MemberCard = forwardRef<MemberCardHandle, Props>(function MemberCard({ user, hideHeader = false }, ref) {
  const captureRef = useRef<HTMLDivElement>(null)
  const wrapRef    = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const [busy,  setBusy]  = useState(false)

  // Measure wrapper width and compute scale so the card fills it
  const measure = useCallback(() => {
    const w = wrapRef.current?.clientWidth ?? 0
    if (w > 0) setScale(Math.min(1, w / CARD_W))
  }, [])

  useEffect(() => {
    measure()
    const ro = new ResizeObserver(measure)
    if (wrapRef.current) ro.observe(wrapRef.current)
    return () => ro.disconnect()
  }, [measure])

  const isGeneral = user.memberCategory === 'general'
  const catLabel = user.memberCategory ? (MEMBER_CATEGORY_LABELS[user.memberCategory] ?? '') : ''
  const [seal1, seal2] = sealLines(catLabel || 'MEMBER')

  async function download() {
    if (!captureRef.current) return
    setBusy(true)
    try {
      const url = await toPng(captureRef.current, {
        width: CARD_W,
        height: CARD_H,
        pixelRatio: 2,
        cacheBust: true,
        style: { transform: 'none', transformOrigin: 'top left' },
      })
      const a = document.createElement('a')
      a.download = `${user.name.replace(/\s+/g, '-').toLowerCase()}-member-card.png`
      a.href = url
      a.click()
    } catch (e) {
      console.error('Card download failed:', e)
    } finally {
      setBusy(false)
    }
  }

  useImperativeHandle(ref, () => ({ download }))

  const ss = sourceSans.style.fontFamily
  const mc = marcellus.style.fontFamily

  const txt = (r: typeof ROWS[keyof typeof ROWS], extra?: React.CSSProperties): React.CSSProperties => ({
    position: 'absolute',
    left: r.x,
    top: r.y,
    transform: 'translateY(-50%)',
    fontFamily: ss,
    fontSize: r.size,
    fontWeight: r.weight,
    color: r.color,
    lineHeight: 1,
    whiteSpace: 'nowrap',
    ...extra,
  })

  return (
    <div className={hideHeader ? 'overflow-hidden w-full' : 'rounded-2xl bg-white border border-border/60 overflow-hidden shadow-[0_1px_3px_0_rgb(0,0,0,0.04)]'}>
      {/* Header — only when not controlled by a parent dialog */}
      {!hideHeader && (
        <div className="px-5 py-4 border-b border-border/60 flex items-center justify-between">
          <div>
            <p className="font-heading font-bold text-sm text-brand-navy">Membership Card</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Your official club membership card</p>
          </div>
          <Button
            size="sm"
            onClick={download}
            disabled={busy}
            className="gap-1.5 text-xs bg-brand-orange hover:bg-brand-orange/90 text-white"
          >
            {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Download className="size-3.5" />}
            Download PNG
          </Button>
        </div>
      )}

      {/* Card preview */}
      <div ref={wrapRef} className="w-full p-4 overflow-hidden">
        {/* Outer container — sized to scaled dimensions */}
        <div
          style={{
            width: CARD_W * scale,
            height: CARD_H * scale,
            maxWidth: '100%',
            overflow: 'hidden',
            borderRadius: 10,
            boxShadow: '0 8px 48px rgba(0,0,0,0.55), 0 2px 8px rgba(0,0,0,0.3)',
          }}
        >
          {/* Inner card — always CARD_W × CARD_H, scaled via CSS transform */}
          <div
            ref={captureRef}
            style={{
              width: CARD_W,
              height: CARD_H,
              position: 'relative',
              transformOrigin: 'top left',
              transform: scale < 1 ? `scale(${scale})` : 'none',
            }}
          >
            {/* Template background */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={isGeneral ? '/assets/member-card/template-general.png' : '/assets/member-card/template.png'}
              alt=""
              crossOrigin="anonymous"
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'block' }}
            />

            {/* ── Text overlays ── */}
            <span style={txt(ROWS.name)}>
              {user.name.toUpperCase()}
            </span>

            <span style={txt(ROWS.address)}>
              {user.address ?? '—'}
            </span>

            <span style={txt(ROWS.mobile)}>
              {user.phone ?? '—'}
            </span>

            <span style={txt(ROWS.memberid)}>
              {user.memberId ?? '—'}
            </span>

            <span style={txt(ROWS.since)}>
              {formatSince(user.memberSince ?? user.createdAt)}
            </span>

            {/* Seal text */}
            {isGeneral ? (
              <span style={{
                position: 'absolute',
                left: SEAL.cx,
                top: 661,
                transform: 'translate(-50%, -50%)',
                fontFamily: mc,
                fontSize: SEAL.size,
                fontWeight: 400,
                color: 'rgb(1,8,88)',
                letterSpacing: 1,
                lineHeight: 1,
                whiteSpace: 'nowrap',
                textAlign: 'center',
              }}>MEMBER</span>
            ) : (
              <>
                <span style={{
                  position: 'absolute',
                  left: SEAL.cx,
                  top: SEAL.y1,
                  transform: 'translate(-50%, -50%)',
                  fontFamily: mc,
                  fontSize: SEAL.size,
                  fontWeight: 400,
                  color: 'rgb(1,8,88)',
                  letterSpacing: 1,
                  lineHeight: 1,
                  whiteSpace: 'nowrap',
                  textAlign: 'center',
                }}>{seal1}</span>
                <span style={{
                  position: 'absolute',
                  left: SEAL.cx,
                  top: SEAL.y2,
                  transform: 'translate(-50%, -50%)',
                  fontFamily: mc,
                  fontSize: SEAL.size,
                  fontWeight: 400,
                  color: 'rgb(1,8,88)',
                  letterSpacing: 1,
                  lineHeight: 1,
                  whiteSpace: 'nowrap',
                  textAlign: 'center',
                }}>{seal2}</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
})

export function MemberCardDialog({ user, open, onOpenChange }: {
  user: User
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const cardRef = useRef<MemberCardHandle>(null)
  const [busy, setBusy] = useState(false)

  async function handleDownload() {
    if (!cardRef.current) return
    setBusy(true)
    try {
      await cardRef.current.download()
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="gap-0 p-0 overflow-hidden"
        style={{
          maxWidth: 680,
          width: 'calc(100vw - 32px)',
          background: 'rgba(7, 14, 30, 0.90)',
          backdropFilter: 'blur(28px)',
          WebkitBackdropFilter: 'blur(28px)',
          border: '1px solid rgba(212,168,67,0.22)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)',
          borderRadius: 20,
        }}
      >
        {/* Header */}
        <div
          className="px-6 pt-5 pb-4 flex items-start justify-between"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}
        >
          <div>
            <p className="text-base font-semibold text-white leading-snug">{user.name}</p>
            <p className="text-xs mt-0.5 font-medium" style={{ color: 'rgba(212,168,67,0.85)' }}>
              Membership Card
            </p>
          </div>
        </div>

        {/* Card preview area */}
        <div className="px-4 pt-5 pb-4 overflow-hidden min-w-0">
          <div
            style={{
              borderRadius: 12,
              padding: '2px',
              background: 'linear-gradient(135deg, rgba(212,168,67,0.35) 0%, rgba(212,168,67,0.08) 60%, rgba(212,168,67,0.18) 100%)',
              overflow: 'hidden',
              minWidth: 0,
            }}
          >
            <div style={{ borderRadius: 10, overflow: 'hidden', background: 'rgba(7,14,30,0.5)', minWidth: 0 }}>
              <MemberCard ref={cardRef} user={user} hideHeader />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className="px-6 py-4 flex items-center justify-between gap-3"
          style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}
        >
          <p className="text-xs hidden sm:block" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Download to save your official membership card
          </p>
          <div className="flex items-center gap-2 ml-auto">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs gap-1.5"
              style={{ color: 'rgba(255,255,255,0.55)' }}
            >
              <X className="size-3.5" />
              Close
            </Button>
            <Button
              size="sm"
              onClick={handleDownload}
              disabled={busy}
              className="gap-1.5 text-xs text-white"
              style={{ background: 'rgba(234,88,12,0.9)', border: '1px solid rgba(234,88,12,0.5)' }}
            >
              {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Download className="size-3.5" />}
              Download PNG
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
