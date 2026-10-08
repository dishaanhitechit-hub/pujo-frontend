import type { ThemeColors } from '@/types'

export const DEFAULT_THEME: ThemeColors = {
  primary:       'oklch(0.638 0.211 35.2)',
  primaryMid:    'oklch(0.62 0.20 30)',
  primaryDeep:   'oklch(0.58 0.22 25)',
  secondary:     'oklch(0.23 0.092 264.5)',
  secondaryMid:  'oklch(0.25 0.09 264.5)',
  secondaryDeep: 'oklch(0.20 0.08 264.5)',
  secondaryHero: 'oklch(0.28 0.10 264.5)',
  cream:         'oklch(0.985 0.01 90)',
}

/**
 * Build a full CSS :root override from a ThemeColors object.
 *
 * Applied to BOTH the public site (server-side <style> tag) and the
 * member/admin portal (client-side ThemeProvider), so branding is
 * consistent everywhere — just like editing globals.css directly was.
 *
 * Intentionally NOT overriding:
 *   - --background  → stays white; page bg is set per-component via brand-cream
 *   - --foreground / --muted / --border → neutral tokens, never part of theme
 *   - --brand-pink / --brand-green → fixed accent colours, not the brand pair
 */
export function buildThemeStyle(theme: ThemeColors | null): string | null {
  if (!theme) return null

  const {
    primary, primaryMid, primaryDeep,
    secondary, secondaryMid, secondaryDeep, secondaryHero,
    cream,
  } = theme

  const primaryLight   = `color-mix(in oklch, ${primary} 15%, white)`
  const secondaryLight = `color-mix(in oklch, ${secondary} 50%, white)`

  const vars = [
    // ── brand tokens ──────────────────────────────────────────────
    `  --brand-orange:       ${primary};`,
    `  --brand-orange-light: ${primaryLight};`,
    `  --brand-orange-mid:   ${primaryMid};`,
    `  --brand-orange-deep:  ${primaryDeep};`,
    `  --brand-navy:         ${secondary};`,
    `  --brand-navy-light:   ${secondaryLight};`,
    `  --brand-navy-mid:     ${secondaryMid};`,
    `  --brand-navy-deep:    ${secondaryDeep};`,
    `  --brand-navy-hero:    ${secondaryHero};`,
    `  --brand-cream:        ${cream};`,

    // ── shadcn component tokens ────────────────────────────────────
    `  --primary:            ${primary};`,
    `  --primary-foreground: oklch(1 0 0);`,
    `  --secondary:          ${secondary};`,
    `  --secondary-foreground: oklch(1 0 0);`,
    `  --ring:               ${primary};`,

    // ── sidebar (member portal) ────────────────────────────────────
    `  --sidebar:            ${secondaryDeep};`,
    `  --sidebar-primary:    ${primary};`,
    `  --sidebar-primary-foreground: oklch(1 0 0);`,
    `  --sidebar-accent:     ${secondaryMid};`,
    `  --sidebar-accent-foreground: oklch(0.9 0.01 280);`,
    `  --sidebar-border:     ${secondaryHero};`,
    `  --sidebar-ring:       ${primary};`,

    // ── charts ────────────────────────────────────────────────────
    `  --chart-1:            ${primary};`,
    `  --chart-2:            ${secondary};`,
  ].join('\n')

  return `:root {\n${vars}\n}`
}

/** Inject / update / remove the org theme override <style> on any page. */
export function applyThemeToDocument(theme: ThemeColors | null): void {
  const ID = 'org-theme-override'
  let el = document.getElementById(ID) as HTMLStyleElement | null
  if (!theme) {
    el?.remove()
    return
  }
  if (!el) {
    el = document.createElement('style')
    el.id = ID
    document.head.appendChild(el)
  }
  el.textContent = buildThemeStyle(theme) ?? ''
}
