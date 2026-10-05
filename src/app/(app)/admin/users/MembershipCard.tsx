'use client'

import React, { useRef, useState, useEffect } from 'react'
import html2canvas from 'html2canvas'
import { Download, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { MEMBER_CATEGORY_LABELS } from '@/config/members'
import type { User } from '@/types'

const CARD_W = 720
const CARD_H = 380
const BORDER = 2

// Design tokens
const CREAM    = '#F5EDE0'
const NAVY     = '#0D2137'
const GOLD     = '#B8882A'
const GOLD_LT  = '#E8C060'
const GOLD_GRAD = 'linear-gradient(90deg,#b8872a,#e8c060,#f5d878,#e8c060,#b8872a)'

// Hex overrides injected into the html2canvas clone to avoid oklch/lab errors
const OKLCH_FIX_CSS = `
:root {
  --brand-orange:#F05A22;--brand-orange-light:#fde8e0;
  --brand-navy:#1B2A6B;--brand-navy-light:#2d4a9e;
  --brand-pink:#F075B2;--brand-pink-light:#fce4f0;
  --brand-green:#5E8733;--brand-cream:#fdfaf5;
  --background:#ffffff;--foreground:#1a1a1a;
  --card:#ffffff;--card-foreground:#1a1a1a;
  --popover:#ffffff;--popover-foreground:#1a1a1a;
  --primary:#F05A22;--primary-foreground:#ffffff;
  --secondary:#1B2A6B;--secondary-foreground:#ffffff;
  --muted:#f5f5f8;--muted-foreground:#717180;
  --accent:#fce4f0;--accent-foreground:#1B2A6B;
  --destructive:#e03d3d;--destructive-foreground:#ffffff;
  --border:#e0e0e8;--input:#ebebf0;--ring:#F05A22;
  --chart-1:#F05A22;--chart-2:#1B2A6B;--chart-3:#F075B2;
  --chart-4:#5E8733;--chart-5:#cc9933;
  --sidebar:#141d3a;--sidebar-foreground:#e0e0e8;
  --sidebar-primary:#F05A22;--sidebar-primary-foreground:#ffffff;
  --sidebar-accent:#1e2d58;--sidebar-accent-foreground:#e0e0e8;
  --sidebar-border:#2a3d70;--sidebar-ring:#F05A22;
}
`

function initials(name: string) {
  return name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('')
}

function fmtSince(v: string | null | undefined) {
  if (!v) return '—'
  try { return new Date(v).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) }
  catch { return v }
}

// ── Circular field icons: navy circle + white SVG ───────────────────────────
function CircleIcon({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      width: 34, height: 34, borderRadius: '50%',
      background: NAVY, flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      marginTop: 1,
    }}>
      {children}
    </div>
  )
}

function FieldRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 9 }}>
      <CircleIcon>{icon}</CircleIcon>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase' as const, color: GOLD }}>
          {label}
        </div>
        <div style={{ fontSize: 15, fontWeight: 400, color: NAVY, lineHeight: 1.25, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
          {value || '—'}
        </div>
      </div>
    </div>
  )
}

// White icons for inside navy circles
const IdSvg = (
  <svg width="16" height="16" viewBox="0 0 12 12" fill="none">
    <rect x="0.5" y="1.5" width="11" height="9" rx="1.5" stroke="white" strokeWidth="1.1"/>
    <line x1="3" y1="4.5" x2="9" y2="4.5" stroke="white" strokeWidth="1" strokeLinecap="round"/>
    <line x1="3" y1="6.5" x2="7" y2="6.5" stroke="white" strokeWidth="1" strokeLinecap="round"/>
    <circle cx="6" cy="4" r="1" fill="white" opacity="0.8"/>
  </svg>
)
const CalSvg = (
  <svg width="16" height="16" viewBox="0 0 12 12" fill="none">
    <rect x="0.5" y="1.5" width="11" height="9.5" rx="1.5" stroke="white" strokeWidth="1.1"/>
    <line x1="0.5" y1="4.5" x2="11.5" y2="4.5" stroke="white" strokeWidth="1"/>
    <line x1="4" y1="0.5" x2="4" y2="3" stroke="white" strokeWidth="1.1" strokeLinecap="round"/>
    <line x1="8" y1="0.5" x2="8" y2="3" stroke="white" strokeWidth="1.1" strokeLinecap="round"/>
  </svg>
)
const PhoneSvg = (
  <svg width="16" height="16" viewBox="0 0 12 12" fill="none">
    <path d="M2.5 1.5C2.5 1.5 1.5 3 2 4.5C3 7 5.5 9.5 8 10.5C9.5 11 11 10 11 10L9.5 8L8 8.5L5.5 5.5L6.5 4L5 2Z" stroke="white" strokeWidth="1.1" fill="none" strokeLinejoin="round"/>
  </svg>
)
const EmailSvg = (
  <svg width="16" height="16" viewBox="0 0 12 12" fill="none">
    <rect x="0.5" y="2" width="11" height="8" rx="1.5" stroke="white" strokeWidth="1.1"/>
    <path d="M1 2.5L6 7L11 2.5" stroke="white" strokeWidth="1.1" strokeLinecap="round"/>
  </svg>
)
const PinSvg = (
  <svg width="16" height="16" viewBox="0 0 12 12" fill="none">
    <path d="M6 1C4 1 2.5 2.5 2.5 4.5C2.5 7 6 11 6 11C6 11 9.5 7 9.5 4.5C9.5 2.5 8 1 6 1Z" stroke="white" strokeWidth="1.1"/>
    <circle cx="6" cy="4.5" r="1.5" stroke="white" strokeWidth="1.1"/>
  </svg>
)

/** Card face — 720 × 380, all inline styles for html2canvas compatibility */
function CardContent({ user, logoSrc, nameVer, nameEn, tagline, estYear, cat }: {
  user: User; logoSrc: string | null; nameVer: string; nameEn: string
  tagline: string; estYear: string; cat: string | null
}) {
  const LEFT_W    = 255
  const firstName = user.name.split(' ')[0]

  return (
    <div
      style={{
        width: CARD_W, height: CARD_H,
        display: 'flex',
        fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
        position: 'relative', overflow: 'hidden',
      }}
    >
      {/* ════════════════ LEFT PANEL ════════════════ */}
      <div style={{ width: LEFT_W, flexShrink: 0, position: 'relative', overflow: 'hidden' }}>

        {/* Scenic photo */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/card/left-bg.png" alt="" crossOrigin="anonymous"
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />

        {/* Botanical leaf frame — transparent PNG */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/card/left-leaves.png" alt="" crossOrigin="anonymous"
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.85, display: 'block' }} />

        {/* Top dark gradient — only covers logo area at very top */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '38%', background: 'linear-gradient(180deg,rgba(5,15,40,0.72) 0%,rgba(5,15,40,0.10) 80%,transparent 100%)', zIndex: 2 }} />

        {/* Bottom solid dark navy section */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '34%', background: 'linear-gradient(0deg,rgba(4,10,30,0.97) 55%,rgba(4,10,30,0.60) 80%,transparent 100%)', zIndex: 2 }} />

        {/* Left-side dark strip */}
        <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '15%', background: 'linear-gradient(90deg,rgba(5,15,40,0.40) 0%,transparent 100%)', zIndex: 2 }} />

        {/* Content */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '18px 14px 14px' }}>

          {/* Gold brushstroke ring + logo */}
          <div style={{ position: 'relative', width: 84, height: 84, flexShrink: 0 }}>
            {/* Brushstroke ring — SVG organic path (hand-painted look) */}
            <svg width="108" height="108" viewBox="0 0 108 108"
              style={{ position: 'absolute', top: -12, left: -12, zIndex: 1 }}>
              {/* outer glow */}
              <circle cx="54" cy="54" r="51" fill="none" stroke="rgba(201,152,42,0.18)" strokeWidth="2" />
              {/* main brushstroke — slightly irregular path */}
              <path
                d="M54 6C68 4 83 12 92 25C101 38 103 56 97 70C91 84 79 93 64 97C49 101 33 97 22 87C11 77 6 62 7 47C8 32 17 18 30 11C39 7 47 7 54 6Z"
                fill="none"
                stroke="rgba(201,152,42,0.82)"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* inner soft ring */}
              <circle cx="54" cy="54" r="44" fill="none" stroke="rgba(201,152,42,0.18)" strokeWidth="1" />
            </svg>
            {/* Logo circle */}
            <div style={{
              width: 84, height: 84, borderRadius: '50%',
              background: logoSrc ? '#ffffff' : `linear-gradient(135deg,${NAVY},#1a3a60)`,
              overflow: 'hidden',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxSizing: 'border-box' as const,
              position: 'relative', zIndex: 2,
              boxShadow: '0 4px 20px rgba(0,0,0,0.35)',
            }}>
              {logoSrc
                ? <img src={logoSrc} alt="club" crossOrigin="anonymous" style={{ width: '80%', height: '80%', objectFit: 'contain' }} />  // eslint-disable-line @next/next/no-img-element
                : <span style={{ fontSize: 30, fontWeight: 800, color: GOLD_LT, fontFamily: 'Georgia,serif', fontStyle: 'italic' }}>
                    {nameEn ? nameEn[0] : nameVer ? nameVer[0] : 'C'}
                  </span>
              }
            </div>
          </div>

          {/* Club name vernacular — large, dark navy */}
          {nameVer && (
            <div style={{ marginTop: 10, color: NAVY, fontSize: 34, fontWeight: 800, textAlign: 'center', lineHeight: 1.05, letterSpacing: 0.5 }}>
              {nameVer}
            </div>
          )}
          {/* Club name English — dark navy tracked caps */}
          {nameEn && (
            <div style={{ marginTop: 7, color: NAVY, fontSize: 11, fontWeight: 700, letterSpacing: 5, textTransform: 'uppercase' as const, textAlign: 'center' }}>
              {nameEn}
            </div>
          )}
          {/* Tagline / location — clearly visible muted navy */}
          {tagline && (
            <div style={{ marginTop: 6, color: 'rgba(13,33,55,0.70)', fontSize: 8.5, letterSpacing: 2, textAlign: 'center', lineHeight: 1.4, fontWeight: 500 }}>
              {tagline}
            </div>
          )}

          <div style={{ flex: 1 }} />

          {/* EST. year with flanking gold lines */}
          {estYear && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, width: '82%', marginBottom: 8 }}>
              <div style={{ flex: 1, height: 1, background: 'linear-gradient(270deg,rgba(232,192,96,0.85),transparent)' }} />
              <div style={{ color: GOLD_LT, fontSize: 8, letterSpacing: 2.5, whiteSpace: 'nowrap' as const, fontWeight: 500 }}>EST. {estYear}</div>
              <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg,rgba(232,192,96,0.85),transparent)' }} />
            </div>
          )}

          {/* MEMBERSHIP CARD */}
          <div style={{ color: GOLD_LT, fontSize: 9, fontWeight: 800, letterSpacing: 4, textTransform: 'uppercase' as const, textAlign: 'center' }}>
            Membership Card
          </div>
        </div>
      </div>

      {/* ════════════════ RIGHT PANEL ════════════════ */}
      <div style={{ flex: 1, background: CREAM, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', padding: '16px 20px 13px' }}>

        {/* Lotus watermark — transparent PNG, bottom-right */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/card/right-lotus.png" alt="" crossOrigin="anonymous"
          style={{ position: 'absolute', bottom: -15, right: -15, width: 260, height: 260, opacity: 0.4, pointerEvents: 'none', display: 'block' }} />

        {/* Blue wave — bottom accent */}
        <svg viewBox="0 0 250 70" xmlns="http://www.w3.org/2000/svg"
          style={{ position: 'absolute', bottom: 0, right: 0, width: 250, height: 70, opacity: 0.10, pointerEvents: 'none' }}>
          <path d="M250,70 L250,12 Q220,0 190,12 Q160,24 130,10 Q100,0 70,12 Q40,22 0,16 L0,70 Z" fill="#5A9EC4"/>
        </svg>

        {/* ── TOP ROW: avatar (left) + name/badge (center) + welcome (right) ── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>

          {/* Avatar — club logo or member initials */}
          <div style={{
            width: 68, height: 68, borderRadius: '50%',
            background: logoSrc ? '#ffffff' : `linear-gradient(135deg,${NAVY},#1a3a60)`,
            border: `2.5px solid ${GOLD}`,
            overflow: 'hidden', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 4px 14px rgba(0,0,0,0.22), 0 0 0 1.5px rgba(232,192,96,0.25)`,
            boxSizing: 'border-box' as const,
          }}>
            {logoSrc
              ? <img src={logoSrc} alt="club" crossOrigin="anonymous" style={{ width: '80%', height: '80%', objectFit: 'contain' }} />  // eslint-disable-line @next/next/no-img-element
              : <span style={{ fontSize: 21, fontWeight: 800, color: GOLD_LT, letterSpacing: 0.5 }}>{initials(user.name)}</span>
            }
          </div>

          {/* Name + badge */}
          <div style={{ flex: 1, paddingTop: 5, minWidth: 0 }}>
            <div style={{ fontSize: 26, fontWeight: 800, color: NAVY, lineHeight: 1.0, letterSpacing: -0.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
              {user.name}
            </div>
            {cat && (
              <div style={{ marginTop: 7 }}>
                <span style={{
                  display: 'inline-block',
                  background: 'rgba(184,136,42,0.18)',
                  border: `1.5px solid rgba(184,136,42,0.65)`,
                  color: '#6A4008',
                  fontSize: 9.5, fontWeight: 700, letterSpacing: 2.5,
                  textTransform: 'uppercase' as const,
                  padding: '4px 18px', borderRadius: 20,
                }}>
                  {cat}
                </span>
              </div>
            )}
          </div>

          {/* Welcome text — top right */}
          <div style={{ flexShrink: 0, textAlign: 'right', minWidth: 148 }}>
            {/* "Welcome," — navy, elegant serif italic */}
            <div style={{
              fontSize: 22,
              color: NAVY,
              fontFamily: '"Palatino Linotype", "Book Antiqua", Palatino, Georgia, serif',
              fontStyle: 'italic',
              fontWeight: 700,
              lineHeight: 1.0,
              letterSpacing: -0.3,
            }}>
              Welcome,
            </div>
            {/* "{firstName}!" — gold, larger, same script style */}
            <div style={{
              fontSize: 32,
              color: GOLD,
              fontFamily: '"Palatino Linotype", "Book Antiqua", Palatino, Georgia, serif',
              fontStyle: 'italic',
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: -0.5,
              marginTop: -2,
            }}>
              {firstName}!
            </div>
            {/* Subtitle */}
            <div style={{
              fontSize: 7.5, letterSpacing: 2, textTransform: 'uppercase' as const,
              color: '#6B5B45', marginTop: 5, fontWeight: 600, lineHeight: 1.7,
              textAlign: 'right',
            }}>
              We&apos;re proud to have<br />you with us.
            </div>
            {/* Gold dash underline */}
            <div style={{ height: 2, width: 48, marginLeft: 'auto', background: GOLD_GRAD, borderRadius: 2, marginTop: 4 }} />
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: 'linear-gradient(90deg,rgba(184,136,42,0.6),rgba(184,136,42,0.08))', marginBottom: 9, flexShrink: 0 }} />

        {/* ── Fields grid ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 18px', flex: 1, minHeight: 0 }}>
          <FieldRow icon={IdSvg}    label="Member ID"    value={user.memberId ?? '—'} />
          <FieldRow icon={CalSvg}   label="Member Since" value={fmtSince(user.memberSince ?? user.createdAt)} />
          <FieldRow icon={PhoneSvg} label="Phone"        value={user.phone ?? '—'} />
          <FieldRow icon={EmailSvg} label="Email"        value={user.email ?? '—'} />
          {user.address && (
            <div style={{ gridColumn: '1 / -1' }}>
              <FieldRow icon={PinSvg} label="Address" value={user.address} />
            </div>
          )}
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: 'linear-gradient(90deg,rgba(184,136,42,0.5),rgba(184,136,42,0.06))', margin: '8px 0', flexShrink: 0 }} />

        {/* ── Footer ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ fontSize: 9.5, letterSpacing: 2.5, color: '#8A7056', fontWeight: 600 }}>
            | People | Culture | Community |
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 15, fontStyle: 'italic', color: GOLD, fontFamily: 'Georgia,serif', fontWeight: 700, whiteSpace: 'nowrap' as const, lineHeight: 1 }}>
              More Than a Club
            </div>
            <div style={{ height: 2.5, background: GOLD_GRAD, borderRadius: 2, marginTop: 3 }} />
          </div>
        </div>
      </div>
    </div>
  )
}

interface Props {
  user: User
  config: Record<string, string>
  open: boolean
  onOpenChange: (v: boolean) => void
  apiBase: string
}

export function MembershipCardDialog({ user, config, open, onOpenChange, apiBase }: Props) {
  const captureRef   = useRef<HTMLDivElement>(null)
  const wrapRef      = useRef<HTMLDivElement>(null)
  const [scale,    setScale]    = useState(1)
  const [busy,     setBusy]     = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  const rawLogo = config['club.logo_url'] || ''
  const logoSrc = rawLogo ? (rawLogo.startsWith('http') ? rawLogo : `${apiBase}${rawLogo}`) : null
  const nameVer = config['club.name_vernacular'] || ''
  const nameEn  = config['club.name_en']  || ''
  const tagline = config['club.tagline']  || ''
  const estYear = config['club.founding_year'] || ''
  const cat = user.memberCategory ? (MEMBER_CATEGORY_LABELS[user.memberCategory] ?? user.memberCategory) : null

  useEffect(() => {
    if (!open) return
    const el = wrapRef.current
    if (!el) return

    function measure() {
      const vw = window.innerWidth
      setIsMobile(vw < 640)
      const w = (el?.clientWidth ?? 0) - 32
      if (w > 0) setScale(Math.min(1, w / (CARD_W + BORDER * 2)))
    }

    const ro = new ResizeObserver(measure)
    ro.observe(el)
    measure()
    return () => ro.disconnect()
  }, [open])

  async function download() {
    const el = captureRef.current
    if (!el) return
    setBusy(true)

    // Render the card in a clean, isolated iframe that has ZERO Tailwind/shadcn
    // CSS — only our safe hex-colour overrides. This is the only reliable way to
    // prevent html2canvas from encountering lab()/oklch() computed values.
    const iframe = document.createElement('iframe')
    iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:720px;height:380px;border:0;visibility:hidden;'
    document.body.appendChild(iframe)

    try {
      const iDoc = iframe.contentDocument!
      iDoc.open()
      // Use el.innerHTML (the CardContent div itself) — NOT outerHTML which
      // carries the preview wrapper's transform:scale().
      iDoc.write(`<!doctype html><html><head><style>
        ${OKLCH_FIX_CSS}
        *{box-sizing:border-box;margin:0;padding:0;}
        html,body{margin:0;padding:0;width:${CARD_W}px;height:${CARD_H}px;overflow:hidden;background:${CREAM};}
      </style></head><body>${el.innerHTML}</body></html>`)
      iDoc.close()

      // Wait for images to load
      const imgs = Array.from(iDoc.querySelectorAll('img'))
      await Promise.all(imgs.map(img =>
        img.complete ? Promise.resolve() : new Promise(res => { img.onload = res; img.onerror = res })
      ))

      const target = iDoc.body.firstElementChild as HTMLElement

      const canvas = await html2canvas(target, {
        scale: 3,
        useCORS: true,
        allowTaint: true,
        backgroundColor: CREAM,
        logging: false,
        width: CARD_W,
        height: CARD_H,
      })

      const link = document.createElement('a')
      link.download = `${user.name.replace(/\s+/g, '-')}-membership.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (err) {
      console.error('Card download failed:', err)
    } finally {
      document.body.removeChild(iframe)
      setBusy(false)
    }
  }

  const outerW = CARD_W + BORDER * 2
  const outerH = CARD_H + BORDER * 2

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="gap-0 p-0"
        style={{
          maxWidth: 860,
          width: 'calc(100vw - 32px)',
          background: 'rgba(7, 14, 30, 0.82)',
          backdropFilter: 'blur(28px)',
          WebkitBackdropFilter: 'blur(28px)',
          border: '1px solid rgba(212,168,67,0.22)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)',
        }}
      >
        {/* Header */}
        <div className="px-6 pt-5 pb-4 flex items-start justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div>
            <p className="text-sm font-semibold text-white leading-snug">{user.name}</p>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(212,168,67,0.7)' }}>Membership Card</p>
          </div>
          {!isMobile && (
            <span className="text-[11px] text-zinc-500 mt-0.5 shrink-0 ml-4">Preview</span>
          )}
        </div>

        {/* Body */}
        <div ref={wrapRef} className="w-full">
          {isMobile ? (
            <>
              <div className="flex flex-col items-center gap-5 px-6 py-8 text-center">
                <div style={{
                  width: 64, height: 64, borderRadius: '50%',
                  background: logoSrc ? '#ffffff' : `linear-gradient(135deg,${NAVY},#1a3a60)`,
                  border: `2px solid ${GOLD}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  overflow: 'hidden', fontSize: 22, fontWeight: 800, color: GOLD_LT,
                }}>
                  {logoSrc
                    ? <img src={logoSrc} alt="club" style={{ width: '80%', height: '80%', objectFit: 'contain' }} />
                    : initials(user.name)
                  }
                </div>
                <div>
                  <p className="text-base font-semibold text-white">{user.name}</p>
                  {cat && <p className="text-xs mt-1" style={{ color: 'rgba(212,168,67,0.75)' }}>{cat}</p>}
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed max-w-[260px]">
                  Your membership card will be downloaded as a high-resolution PNG (2160 × 1140 px) — ready to print or share.
                </p>
              </div>
              {/* Hidden card inside dialog — shares CSS context for correct html2canvas capture */}
              <div aria-hidden style={{ position: 'absolute', top: -(CARD_H + 20), left: 0, pointerEvents: 'none' }}>
                <div ref={captureRef} style={{ width: CARD_W, height: CARD_H, overflow: 'hidden' }}>
                  <CardContent user={user} logoSrc={logoSrc} nameVer={nameVer} nameEn={nameEn} tagline={tagline} estYear={estYear} cat={cat} />
                </div>
              </div>
            </>
          ) : (
            <div className="px-4 pt-6 pb-4">
              <div
                style={{
                  width: outerW * scale, height: outerH * scale,
                  borderRadius: 16 * scale, overflow: 'hidden',
                  padding: BORDER * scale,
                  background: GOLD_GRAD,
                  boxShadow: '0 0 60px rgba(212,168,67,0.22), 0 20px 50px rgba(0,0,0,0.7)',
                  boxSizing: 'border-box',
                }}
              >
                <div
                  ref={captureRef}
                  style={{
                    transformOrigin: 'top left',
                    transform: scale < 1 ? `scale(${scale})` : 'none',
                    width: CARD_W, height: CARD_H,
                    borderRadius: 14, overflow: 'hidden',
                  }}
                >
                  <CardContent user={user} logoSrc={logoSrc} nameVer={nameVer} nameEn={nameEn} tagline={tagline} estYear={estYear} cat={cat} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between gap-3 px-6 py-4"
          style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}
        >
          <p className="text-[11px] leading-snug" style={{ color: 'rgba(255,255,255,0.35)' }}>
            {isMobile ? 'Saves as PNG · 720 × 380 · 3× resolution' : 'High-resolution PNG · 720 × 380 · 3× scale'}
          </p>
          <div className="flex gap-2 shrink-0">
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="text-zinc-400 hover:text-white hover:bg-white/10 px-3"
            >
              Cancel
            </Button>
            <Button
              onClick={download}
              disabled={busy}
              className="bg-brand-orange hover:bg-brand-orange/90 text-white gap-2"
            >
              {busy ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
              Download PNG
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
