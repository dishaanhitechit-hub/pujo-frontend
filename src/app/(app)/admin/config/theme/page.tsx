'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Check, RotateCcw, Save, Loader2, Palette, Pipette } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { RoleGuard } from '@/lib/auth/role-guard'
import { getAdminTheme, saveAdminTheme } from '@/lib/api/admin'
import { DEFAULT_THEME } from '@/lib/theme'
import type { ThemeColors } from '@/types'
import { toast } from 'sonner'

// ── Palette definitions ────────────────────────────────────────────

interface PaletteOption {
  id: string
  name: string
  description: string
  hex: { primary: string; secondary: string; cream: string }
  colors: ThemeColors
}

const PALETTES: PaletteOption[] = [
  {
    id: 'navy-orange', name: 'Navy & Orange', description: 'Classic — bold navy with vibrant orange',
    hex: { primary: '#d45f10', secondary: '#1e2f52', cream: '#fafaf2' },
    colors: {
      primary: 'oklch(0.638 0.211 35.2)', primaryMid: 'oklch(0.62 0.20 30)', primaryDeep: 'oklch(0.58 0.22 25)',
      secondary: 'oklch(0.23 0.092 264.5)', secondaryMid: 'oklch(0.25 0.09 264.5)',
      secondaryDeep: 'oklch(0.20 0.08 264.5)', secondaryHero: 'oklch(0.28 0.10 264.5)',
      cream: 'oklch(0.985 0.01 90)',
    },
  },
  {
    id: 'forest-gold', name: 'Forest & Gold', description: 'Earthy — deep forest green with warm gold',
    hex: { primary: '#b8860b', secondary: '#1a3a1a', cream: '#fafaf0' },
    colors: {
      primary: 'oklch(0.72 0.16 60)', primaryMid: 'oklch(0.68 0.15 58)', primaryDeep: 'oklch(0.62 0.14 55)',
      secondary: 'oklch(0.25 0.09 145)', secondaryMid: 'oklch(0.28 0.08 145)',
      secondaryDeep: 'oklch(0.20 0.08 145)', secondaryHero: 'oklch(0.32 0.08 145)',
      cream: 'oklch(0.987 0.015 95)',
    },
  },
  {
    id: 'maroon-cream', name: 'Maroon & Cream', description: 'Traditional — deep maroon with warm ivory',
    hex: { primary: '#c8a422', secondary: '#4a1010', cream: '#fdf5e6' },
    colors: {
      primary: 'oklch(0.74 0.10 80)', primaryMid: 'oklch(0.70 0.09 78)', primaryDeep: 'oklch(0.64 0.09 75)',
      secondary: 'oklch(0.28 0.10 15)', secondaryMid: 'oklch(0.31 0.09 15)',
      secondaryDeep: 'oklch(0.23 0.09 15)', secondaryHero: 'oklch(0.34 0.09 15)',
      cream: 'oklch(0.984 0.022 85)',
    },
  },
  {
    id: 'midnight-teal', name: 'Midnight & Teal', description: 'Modern — deep midnight with teal accent',
    hex: { primary: '#009688', secondary: '#0d0d2b', cream: '#f0fafa' },
    colors: {
      primary: 'oklch(0.68 0.13 185)', primaryMid: 'oklch(0.64 0.12 183)', primaryDeep: 'oklch(0.58 0.12 180)',
      secondary: 'oklch(0.20 0.05 255)', secondaryMid: 'oklch(0.22 0.05 255)',
      secondaryDeep: 'oklch(0.17 0.04 255)', secondaryHero: 'oklch(0.26 0.05 255)',
      cream: 'oklch(0.985 0.008 200)',
    },
  },
  {
    id: 'baby-pink-ivory', name: 'Baby Pink & Ivory', description: 'Soft — lotus pink with warm ivory',
    hex: { primary: '#f075b2', secondary: '#3d1a30', cream: '#fdf5e8' },
    colors: {
      primary:       'oklch(0.73 0.17 350)',
      primaryMid:    'oklch(0.68 0.18 350)',
      primaryDeep:   'oklch(0.60 0.18 348)',
      secondary:     'oklch(0.28 0.08 340)',
      secondaryMid:  'oklch(0.32 0.07 340)',
      secondaryDeep: 'oklch(0.22 0.07 340)',
      secondaryHero: 'oklch(0.35 0.07 340)',
      cream:         'oklch(0.980 0.015 85)',
    },
  },
  {
    id: 'plum-rose', name: 'Plum & Rose', description: 'Elegant — deep plum with soft baby pink',
    hex: { primary: '#e87ca0', secondary: '#3d1a30', cream: '#fff5f8' },
    colors: {
      primary: 'oklch(0.68 0.14 355)', primaryMid: 'oklch(0.62 0.16 355)', primaryDeep: 'oklch(0.55 0.14 355)',
      secondary: 'oklch(0.26 0.08 340)', secondaryMid: 'oklch(0.22 0.07 340)',
      secondaryDeep: 'oklch(0.18 0.06 340)', secondaryHero: 'oklch(0.30 0.08 340)',
      cream: 'oklch(0.978 0.018 80)',
    },
  },
  {
    id: 'indigo-amber', name: 'Indigo & Amber', description: 'Rich — deep indigo with warm amber',
    hex: { primary: '#f0a030', secondary: '#1a1060', cream: '#fffbf0' },
    colors: {
      primary: 'oklch(0.74 0.16 65)', primaryMid: 'oklch(0.70 0.15 62)', primaryDeep: 'oklch(0.64 0.15 58)',
      secondary: 'oklch(0.24 0.10 280)', secondaryMid: 'oklch(0.27 0.09 280)',
      secondaryDeep: 'oklch(0.20 0.09 280)', secondaryHero: 'oklch(0.30 0.09 280)',
      cream: 'oklch(0.984 0.018 88)',
    },
  },
  {
    id: 'slate-emerald', name: 'Slate & Emerald', description: 'Contemporary — cool slate with emerald pop',
    hex: { primary: '#2e7d5a', secondary: '#2a2f3f', cream: '#f0faf5' },
    colors: {
      primary: 'oklch(0.65 0.15 155)', primaryMid: 'oklch(0.61 0.14 153)', primaryDeep: 'oklch(0.55 0.13 150)',
      secondary: 'oklch(0.25 0.03 250)', secondaryMid: 'oklch(0.27 0.03 250)',
      secondaryDeep: 'oklch(0.21 0.03 250)', secondaryHero: 'oklch(0.31 0.03 250)',
      cream: 'oklch(0.985 0.006 200)',
    },
  },
  {
    id: 'crimson-gold', name: 'Crimson & Gold', description: 'Festive — deep crimson with ceremonial gold',
    hex: { primary: '#d4a017', secondary: '#6b0f1a', cream: '#fdf8ef' },
    colors: {
      primary: 'oklch(0.76 0.14 60)', primaryMid: 'oklch(0.72 0.13 57)', primaryDeep: 'oklch(0.65 0.13 54)',
      secondary: 'oklch(0.28 0.14 22)', secondaryMid: 'oklch(0.31 0.13 22)',
      secondaryDeep: 'oklch(0.23 0.13 22)', secondaryHero: 'oklch(0.34 0.12 22)',
      cream: 'oklch(0.986 0.020 88)',
    },
  },
]

// Derive a full ThemeColors from 3 hex picks using CSS color-mix for variants
function hexToThemeColors(primary: string, secondary: string, cream: string): ThemeColors {
  return {
    primary,
    primaryMid:    `color-mix(in oklch, ${primary}, black 8%)`,
    primaryDeep:   `color-mix(in oklch, ${primary}, black 18%)`,
    secondary,
    secondaryMid:  `color-mix(in oklch, ${secondary}, white 10%)`,
    secondaryDeep: `color-mix(in oklch, ${secondary}, black 12%)`,
    secondaryHero: `color-mix(in oklch, ${secondary}, white 18%)`,
    cream,
  }
}

// ── Mini preview ───────────────────────────────────────────────────

function ThemePreview({ colors }: { colors: ThemeColors }) {
  const navBg  = colors.secondary
  const accent = colors.primary
  const bg     = colors.cream
  const darkBg = colors.secondaryDeep
  const heroBg = `linear-gradient(135deg, ${colors.secondaryDeep}, ${colors.secondary})`

  return (
    <div className="rounded-xl overflow-hidden border border-border/60 shadow-sm text-[0px] select-none" aria-hidden>
      <div className="flex items-center justify-between px-3 py-1.5" style={{ background: navBg }}>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full" style={{ background: accent }} />
          <div className="w-10 h-1.5 rounded-full bg-white/40" />
        </div>
        <div className="flex items-center gap-1">
          {[1,2,3].map(i => <div key={i} className="w-5 h-1 rounded-full bg-white/30" />)}
        </div>
        <div className="px-2 py-0.5 rounded" style={{ background: accent }}>
          <div className="w-6 h-1 rounded-full bg-white/80" />
        </div>
      </div>
      <div className="px-4 py-4 flex items-center gap-3" style={{ background: heroBg }}>
        <div className="flex-1 space-y-1.5">
          <div className="w-3/4 h-2.5 rounded-full bg-white/80" />
          <div className="w-1/2 h-1.5 rounded-full bg-white/40" />
          <div className="mt-2 flex gap-1.5">
            <div className="px-2.5 py-1 rounded" style={{ background: accent }}>
              <div className="w-8 h-1 rounded-full bg-white/80" />
            </div>
            <div className="px-2.5 py-1 rounded border border-white/30">
              <div className="w-8 h-1 rounded-full bg-white/50" />
            </div>
          </div>
        </div>
        <div className="w-14 h-10 rounded-lg" style={{ background: `color-mix(in srgb, ${accent} 20%, transparent)` }} />
      </div>
      <div className="grid grid-cols-3 gap-2 p-3" style={{ background: bg }}>
        {[0.9, 0.7, 0.5].map((op, i) => (
          <div key={i} className="rounded-lg p-2 border border-border/40 bg-white space-y-1">
            <div className="w-4 h-4 rounded" style={{ background: `color-mix(in srgb, ${accent} ${Math.round(op * 100)}%, transparent)` }} />
            <div className="w-full h-1 rounded-full bg-slate-200" />
            <div className="w-3/4 h-1 rounded-full bg-slate-100" />
          </div>
        ))}
      </div>
      <div className="px-3 py-2" style={{ background: darkBg }}>
        <div className="flex justify-between items-center">
          <div className="w-12 h-1.5 rounded-full bg-white/30" />
          <div className="flex gap-1">
            {[1,2,3].map(i => <div key={i} className="w-3 h-3 rounded-full bg-white/20" />)}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Hidden color input helper ──────────────────────────────────────

function ColorSwatch({ label, value, onChange }: {
  label: string
  value: string
  onChange: (hex: string) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      className="flex items-center gap-3 w-full rounded-xl border border-border hover:border-brand-orange/50 bg-card p-3 transition-all group"
      title={`Change ${label}`}
    >
      <div
        className="w-9 h-9 rounded-lg border border-border/40 shadow-sm flex-shrink-0 relative overflow-hidden"
        style={{ background: value }}
      >
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/20 transition-opacity">
          <Pipette className="size-3.5 text-white drop-shadow" />
        </div>
      </div>
      <div className="flex-1 text-left min-w-0">
        <p className="text-xs font-medium text-foreground">{label}</p>
        <p className="text-[11px] text-muted-foreground font-mono mt-0.5 truncate">{value}</p>
      </div>
      <input
        ref={inputRef}
        type="color"
        className="sr-only"
        value={value.startsWith('#') ? value : '#888888'}
        onChange={e => onChange(e.target.value)}
      />
    </button>
  )
}

// ── Main page ──────────────────────────────────────────────────────

const DEFAULT_CUSTOM_HEX = { primary: '#d45f10', secondary: '#1e2f52', cream: '#fafaf2' }

function ThemePage() {
  const [current,    setCurrent]   = useState<ThemeColors | null>(null)
  const [currentId,  setCurrentId] = useState<string>('navy-orange') // which palette is SAVED
  const [selected,   setSelected]  = useState<ThemeColors>(DEFAULT_THEME)
  const [selectedId, setSelectedId] = useState<string>('navy-orange') // which palette is CLICKED
  const [customHex,  setCustomHex] = useState(DEFAULT_CUSTOM_HEX)
  const [loading,    setLoading]   = useState(true)
  const [saving,     setSaving]    = useState(false)
  const [preview,    setPreview]   = useState<ThemeColors>(DEFAULT_THEME)

  const isDirty = JSON.stringify(selected) !== JSON.stringify(current ?? DEFAULT_THEME)

  useEffect(() => {
    getAdminTheme().then(theme => {
      setCurrent(theme)
      if (theme) {
        setSelected(theme)
        setPreview(theme)
        const match = PALETTES.find(p => JSON.stringify(p.colors) === JSON.stringify(theme))
        const id = match?.id ?? 'custom'
        setSelectedId(id)
        setCurrentId(id)
        if (match) setCustomHex(match.hex)
      }
      // no saved theme → default navy-orange is current
    }).finally(() => setLoading(false))
  }, [])

  const selectPalette = useCallback((p: PaletteOption) => {
    setSelected(p.colors)
    setSelectedId(p.id)
    setPreview(p.colors)
    setCustomHex(p.hex)
  }, [])

  const applyCustom = useCallback((hex: typeof customHex) => {
    const colors = hexToThemeColors(hex.primary, hex.secondary, hex.cream)
    setSelected(colors)
    setSelectedId('custom')
    setPreview(colors)
  }, [])

  const handleCustomChange = useCallback((key: keyof typeof DEFAULT_CUSTOM_HEX, hex: string) => {
    const next = { ...customHex, [key]: hex }
    setCustomHex(next)
    applyCustom(next)
  }, [customHex, applyCustom])

  const handleSave = useCallback(async () => {
    setSaving(true)
    // Save null when the default palette is selected — no override needed
    const isDefault = JSON.stringify(selected) === JSON.stringify(DEFAULT_THEME)
    const toSave = isDefault ? null : selected
    try {
      await saveAdminTheme(toSave)
      setCurrent(toSave)
      setCurrentId(isDefault ? 'navy-orange' : selectedId)
      toast.success(
        isDefault
          ? 'Theme reset to default — public site updates within 5 minutes'
          : 'Theme saved — public site updates within 5 minutes'
      )
    } catch {
      toast.error('Failed to save theme')
    } finally {
      setSaving(false)
    }
  }, [selected])

  const handleReset = useCallback(async () => {
    setSaving(true)
    try {
      await saveAdminTheme(null)
      setCurrent(null)
      setCurrentId('navy-orange')
      setSelected(DEFAULT_THEME)
      setSelectedId('navy-orange')
      setPreview(DEFAULT_THEME)
      setCustomHex(DEFAULT_CUSTOM_HEX)
      toast.success('Theme reset to default — public site updates within 5 minutes')
    } catch {
      toast.error('Failed to reset theme')
    } finally {
      setSaving(false)
    }
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">

      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-brand-orange/10 flex items-center justify-center shrink-0">
            <Palette className="size-5 text-brand-orange" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-brand-navy">Theme & Colours</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Choose a colour palette for your public website</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {current && (
            <Button variant="outline" size="sm" onClick={handleReset} disabled={saving} className="gap-1.5">
              <RotateCcw className="size-3.5" />
              <span className="hidden sm:inline">Reset to default</span>
              <span className="sm:hidden">Reset</span>
            </Button>
          )}
          <Button size="sm" onClick={handleSave} disabled={saving || !isDirty} className="gap-1.5">
            {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
            Save theme
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8">

        {/* Left — palette + custom */}
        <div className="lg:col-span-3 space-y-6">

          {/* Pre-built palettes */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
              Pre-built palettes
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PALETTES.map(p => {
                const isSelected = selectedId === p.id
                const isLive     = currentId === p.id
                return (
                  <button
                    key={p.id}
                    onClick={() => selectPalette(p)}
                    className={`relative rounded-2xl border-2 p-4 text-left transition-all ${
                      isSelected
                        ? 'border-brand-orange shadow-md shadow-brand-orange/10 bg-brand-orange/[0.03]'
                        : 'border-border hover:border-brand-orange/40 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex gap-1.5 mb-3">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg shadow-sm" style={{ background: p.colors.secondary }} />
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg shadow-sm" style={{ background: p.colors.primary }} />
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg shadow-sm border border-border" style={{ background: p.colors.cream }} />
                    </div>
                    <p className="font-semibold text-sm text-foreground">{p.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{p.description}</p>

                    {/* Top-right badges */}
                    <div className="absolute top-3 right-3 flex items-center gap-1.5">
                      {isLive && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-green-500 text-white leading-none">
                          Live
                        </span>
                      )}
                      {isSelected && (
                        <div className="size-5 rounded-full bg-brand-orange flex items-center justify-center">
                          <Check className="size-3 text-white" />
                        </div>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Custom colors */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                Custom colours
              </p>
              {currentId === 'custom' && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-green-500 text-white leading-none">
                  Live
                </span>
              )}
              {selectedId === 'custom' && currentId !== 'custom' && (
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-brand-orange text-white leading-none">
                  Selected
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Pick your own colours — mid tones and dark shades are derived automatically.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <ColorSwatch
                label="Primary (Buttons / CTA)"
                value={customHex.primary}
                onChange={hex => handleCustomChange('primary', hex)}
              />
              <ColorSwatch
                label="Secondary (Navbar / Dark BG)"
                value={customHex.secondary}
                onChange={hex => handleCustomChange('secondary', hex)}
              />
              <ColorSwatch
                label="Surface (Light backgrounds)"
                value={customHex.cream}
                onChange={hex => handleCustomChange('cream', hex)}
              />
            </div>
          </div>
        </div>

        {/* Right — preview + info */}
        <div className="lg:col-span-2 space-y-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
            Live preview
          </p>

          <div className="lg:sticky lg:top-6 space-y-4">
            <ThemePreview colors={preview} />

            {/* Colour values panel */}
            <div className="rounded-xl border border-border bg-card p-4 space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                Current colours
              </p>
              <div className="space-y-3">
                {([
                  { label: 'Primary', sub: 'Buttons & CTAs', key: 'primary' as const },
                  { label: 'Secondary', sub: 'Navbar & sidebar', key: 'secondary' as const },
                  { label: 'Surface', sub: 'Backgrounds', key: 'cream' as const },
                ] as const).map(({ label, sub, key }) => (
                  <div key={key} className="flex items-start gap-2.5">
                    <div
                      className="w-6 h-6 rounded-md shadow-sm border border-border/40 shrink-0 mt-0.5"
                      style={{ background: preview[key] }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground leading-tight">{label}</p>
                      <p className="text-[10px] text-muted-foreground">{sub}</p>
                      <p className="text-[10px] font-mono text-muted-foreground mt-0.5 break-all leading-relaxed">
                        {preview[key]}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {isDirty && (
              <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5 leading-relaxed">
                You have unsaved changes. Click <strong>Save theme</strong> to apply to your public site.
              </div>
            )}

            {!isDirty && current && (
              <div className="text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2.5">
                This theme is currently active on your public site.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ThemeSettingsPage() {
  return (
    <RoleGuard permission="users.manage">
      <ThemePage />
    </RoleGuard>
  )
}
