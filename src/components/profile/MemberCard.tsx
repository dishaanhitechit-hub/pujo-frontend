'use client'

import React, { useRef, useState, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react'
import { toPng } from 'html-to-image'
import { Cinzel, Source_Sans_3 } from 'next/font/google'
import { Download, Loader2, X, MessageCircle, User as UserIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { MEMBER_CATEGORY_LABELS } from '@/config/members'
import type { User } from '@/types'
import { waSendMembershipCard } from '@/lib/api/whatsapp'
import { mediaUrl } from '@/lib/api/public'
import type { ApiError } from '@/types'

const cinzel     = Cinzel({ subsets: ['latin'], weight: ['700', '900'], display: 'swap' })
const sourceSans = Source_Sans_3({ subsets: ['latin'], weight: ['600', '700'], display: 'swap' })

// ── Portrait card dimensions (matches profilecard.png) ──────────────────────
const CARD_W = 1024
const CARD_H = 1536

// Photo circle — fills the transparent hole in profilecard_ring.png
// Hole traced per-pixel from actual ring white interior, ~343px effective radius
// Photo circle r=355 covers the full hole with margin
const PHOTO_CX = 512
const PHOTO_CY = 706
const PHOTO_R  = 355

// Category text — centred inside the dark navy banner
// Pixel analysis: navy band y=1145–1215, center y=1180
const BANNER_CX = 512
const BANNER_CY = 1180

// Name & address text values — after the colon in each label row
// "Name    :" colon ends ~x=285; value starts at x=300 (past the colon+space)
// "Address :" colon ends ~x=285 (template uses extra spaces to align both colons)
// Y: sit slightly above each underline (Name underline y≈1346, Address y≈1416)
const NAME_X    = 302
const NAME_Y    = 1327
const ADDR_X    = 302
const ADDR_Y    = 1391

// ────────────────────────────────────────────────────────────────────────────

function categoryLabel(cat: string | null | undefined): string {
  if (!cat || cat === 'general') return 'MEMBER'
  const label = MEMBER_CATEGORY_LABELS[cat as keyof typeof MEMBER_CATEGORY_LABELS] ?? cat
  return label.toUpperCase()
}

interface Props {
  user: User
  hideHeader?: boolean
}

export interface MemberCardHandle {
  download: () => Promise<void>
  getDataUrl: (pixelRatio?: number) => Promise<string>
}

export const MemberCard = forwardRef<MemberCardHandle, Props>(function MemberCard(
  { user, hideHeader = false },
  ref,
) {
  const captureRef = useRef<HTMLDivElement>(null)
  const wrapRef    = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const [busy,  setBusy]  = useState(false)

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

  async function getDataUrl(pixelRatio = 2): Promise<string> {
    if (!captureRef.current) throw new Error('Card not ready')
    return toPng(captureRef.current, {
      width: CARD_W,
      height: CARD_H,
      pixelRatio,
      cacheBust: true,
      style: { transform: 'none', transformOrigin: 'top left' },
    })
  }

  async function download() {
    if (!captureRef.current) return
    setBusy(true)
    try {
      const url = await getDataUrl()
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

  useImperativeHandle(ref, () => ({ download, getDataUrl: (pr?: number) => getDataUrl(pr) }))

  const photoSrc = mediaUrl(user.photoUrl)
  const catText  = categoryLabel(user.memberCategory)
  const cz = cinzel.style.fontFamily
  const ss = sourceSans.style.fontFamily

  return (
    <div className={hideHeader ? 'overflow-hidden w-full' : 'overflow-hidden'} style={hideHeader ? {} : { borderRadius: 16 }}>
      {/* Header — standalone mode only */}
      {!hideHeader && (
        <div className="relative bg-brand-navy overflow-hidden">
          <div
            className="absolute top-0 right-0 w-0 h-0"
            style={{ borderLeft: '140px solid transparent', borderTop: '80px solid rgba(249,115,22,0.12)' }}
          />
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
      )}

      {/* Card preview */}
      <div
        ref={wrapRef}
        className="w-full px-2 py-3 overflow-hidden"
        style={{ background: 'linear-gradient(160deg,#0d1424 0%,#12203a 60%,#0d1424 100%)' }}
      >
        {/* Outer container — scaled to wrapper width */}
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
              background: '#fff',
            }}
          >
            {/* ── Profile photo — clipped into the ornamental ring ── */}
            <div
              style={{
                position: 'absolute',
                left: PHOTO_CX - PHOTO_R,
                top: PHOTO_CY - PHOTO_R,
                width: PHOTO_R * 2,
                height: PHOTO_R * 2,
                borderRadius: '50%',
                overflow: 'hidden',
                background: '#e8e4dc',
              }}
            >
              {photoSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photoSrc}
                  alt={user.name}
                  crossOrigin="anonymous"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              ) : (
                /* Placeholder when no photo is uploaded */
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'linear-gradient(135deg, #e8dcc8 0%, #d4c4a0 100%)',
                  }}
                >
                  <UserIcon
                    style={{ width: PHOTO_R * 0.7, height: PHOTO_R * 0.7, color: '#a89060', opacity: 0.5 }}
                  />
                </div>
              )}
            </div>

            {/* ── Template PNG — circle area is transparent so photo shows through ── */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/assets/card/profilecard_ring.png"
              alt=""
              crossOrigin="anonymous"
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'block' }}
            />

            {/* ── Category text — centred in the navy banner ── */}
            <span
              style={{
                position: 'absolute',
                left: BANNER_CX,
                top: BANNER_CY,
                transform: 'translate(-50%, -50%)',
                fontFamily: cz,
                fontSize: 44,
                fontWeight: 700,
                color: '#F5E4A0',
                letterSpacing: 4,
                lineHeight: 1,
                whiteSpace: 'nowrap',
                textShadow: '0 1px 6px rgba(0,0,0,0.5)',
              }}
            >
              {catText}
            </span>

            {/* ── Name value ── */}
            <span
              style={{
                position: 'absolute',
                left: NAME_X,
                top: NAME_Y,
                transform: 'translateY(-50%)',
                fontFamily: ss,
                fontSize: 36,
                fontWeight: 700,
                color: 'rgb(215, 8, 9)',
                lineHeight: 1,
                whiteSpace: 'nowrap',
              }}
            >
              {user.name.toUpperCase()}
            </span>

            {/* ── Address value ── */}
            <span
              style={{
                position: 'absolute',
                left: ADDR_X,
                top: ADDR_Y,
                transform: 'translateY(-50%)',
                fontFamily: ss,
                fontSize: 32,
                fontWeight: 600,
                color: 'rgb(1, 8, 88)',
                lineHeight: 1,
                whiteSpace: 'nowrap',
              }}
            >
              {user.address ?? '—'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
})

// ── Dialog wrapper ──────────────────────────────────────────────────────────

export function MemberCardDialog({
  user,
  open,
  onOpenChange,
}: {
  user: User
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const cardRef = useRef<MemberCardHandle>(null)
  const [busy,      setBusy]     = useState(false)
  const [waSending, setWaSending] = useState(false)
  const [waResult,  setWaResult]  = useState<string | null>(null)
  const [waError,   setWaError]   = useState<string | null>(null)

  async function handleDownload() {
    if (!cardRef.current) return
    setBusy(true)
    try { await cardRef.current.download() }
    finally { setBusy(false) }
  }

  async function handleSendWa() {
    if (!cardRef.current) return
    setWaSending(true)
    setWaResult(null)
    setWaError(null)
    try {
      const dataUrl = await cardRef.current.getDataUrl(1)
      await waSendMembershipCard(user.id, dataUrl, 'membership')
      setWaResult(`Sent to ${user.whatsappNo || user.phone || 'member'}`)
    } catch (err: unknown) {
      setWaError((err as ApiError).message ?? 'WhatsApp send failed.')
    } finally {
      setWaSending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="gap-0 p-0 overflow-hidden [&_[data-slot=dialog-close]]:text-white/60 [&_[data-slot=dialog-close]]:hover:text-white [&_[data-slot=dialog-close]]:hover:bg-white/10"
        style={{
          maxWidth: 380,
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

        {/* Card preview — fixed small size so dialog stays compact */}
        <div className="px-5 pt-4 pb-3 flex justify-center overflow-hidden">
          <div
            style={{
              borderRadius: 12,
              padding: '2px',
              overflow: 'hidden',
              width: 280,
              flexShrink: 0,
              background: 'linear-gradient(135deg, rgba(212,168,67,0.35) 0%, rgba(212,168,67,0.08) 60%, rgba(212,168,67,0.18) 100%)',
            }}
          >
            <div style={{ borderRadius: 10, overflow: 'hidden', background: 'rgba(7,14,30,0.5)', width: '100%' }}>
              <MemberCard ref={cardRef} user={user} hideHeader />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className="px-6 py-4 flex flex-col gap-2"
          style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}
        >
          {waResult && <p className="text-xs text-green-400">✅ {waResult}</p>}
          {waError  && <p className="text-xs text-red-400">⚠ {waError}</p>}
          {/* Action buttons — grid so they fill width evenly and never overflow */}
          <div className="grid gap-2" style={{ gridTemplateColumns: (user.whatsappNo || user.phone) ? '1fr 1fr' : '1fr' }}>
            {(user.whatsappNo || user.phone) && (
              <Button
                size="sm"
                onClick={handleSendWa}
                disabled={waSending || busy}
                className="gap-1.5 text-xs text-white w-full"
                style={{ background: 'rgba(22,163,74,0.9)', border: '1px solid rgba(22,163,74,0.5)' }}
              >
                {waSending ? <Loader2 className="size-3.5 animate-spin" /> : <MessageCircle className="size-3.5" />}
                WhatsApp
              </Button>
            )}
            <Button
              size="sm"
              onClick={handleDownload}
              disabled={busy}
              className="gap-1.5 text-xs text-white w-full"
              style={{ background: 'rgba(234,88,12,0.9)', border: '1px solid rgba(234,88,12,0.5)' }}
            >
              {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Download className="size-3.5" />}
              Download PNG
            </Button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="w-full text-xs gap-1.5 hover:bg-white/10 hover:text-white/50"
            style={{ color: 'rgba(255,255,255,0.4)' }}
          >
            <X className="size-3.5" /> Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
