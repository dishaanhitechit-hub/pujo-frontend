'use client'

import React, { useRef, useState, useEffect, useCallback } from 'react'
import { toPng } from 'html-to-image'
import { Source_Sans_3, Marcellus } from 'next/font/google'
import { Download, Loader2 } from 'lucide-react'
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
  // e.g. "LIFETIME EXECUTIVE MEMBER" → "LIFETIME EXECUTIVE" / "MEMBER"
  const mid = Math.ceil(words.length / 2)
  return [words.slice(0, mid).join(' '), words.slice(mid).join(' ')]
}

interface Props { user: User }

export function MemberCard({ user }: Props) {
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

  const ss = sourceSans.style.fontFamily
  const mc = marcellus.style.fontFamily

  // Common text style factory
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
    <div className="rounded-2xl bg-white border border-border/60 overflow-hidden shadow-[0_1px_3px_0_rgb(0,0,0,0.04)]">
      {/* Header — navy banner matching identity card style */}
      <div className="relative bg-brand-navy overflow-hidden">
        <div className="absolute top-0 right-0 w-0 h-0"
          style={{ borderLeft: '140px solid transparent', borderTop: '80px solid rgba(249,115,22,0.12)' }} />
        <div className="absolute bottom-0 right-20 size-20 rounded-full bg-white/[0.04]" />
        <div className="relative flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-xl bg-brand-orange/20 ring-1 ring-brand-orange/30 flex items-center justify-center shrink-0">
              <Download className="size-4 text-brand-orange" />
            </div>
            <div>
              <p className="font-heading font-bold text-white text-sm leading-snug">Membership Card</p>
              <p className="text-white/50 text-[11px] mt-0.5">Official club membership card</p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={download}
            disabled={busy}
            className="gap-1.5 text-xs bg-brand-orange hover:bg-brand-orange/90 text-white shrink-0"
          >
            {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Download className="size-3.5" />}
            Download PNG
          </Button>
        </div>
      </div>

      {/* Card preview */}
      <div ref={wrapRef} className="w-full px-5 py-6" style={{ background: 'linear-gradient(160deg,#0d1424 0%,#12203a 60%,#0d1424 100%)' }}>
        {/* Outer container — sized to scaled dimensions */}
        <div
          style={{
            width: CARD_W * scale,
            height: CARD_H * scale,
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
}

export function MemberCardDialog({ user, open, onOpenChange }: {
  user: User
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[1200px] w-[calc(100vw-32px)] p-0 gap-0 overflow-hidden rounded-2xl shadow-2xl">
        <MemberCard user={user} />
      </DialogContent>
    </Dialog>
  )
}
