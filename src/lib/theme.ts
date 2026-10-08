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
 * Build a CSS :root override for the PUBLIC site only.
 *
 * Overrides:
 *   - --brand-* tokens (used directly in public page components)
 *   - shadcn --primary / --secondary / --ring / --chart-1 / --chart-2
 *     (hardcoded literals in globals.css that shadcn components read)
 *
 * Intentionally NOT overriding:
 *   - --background  → stays oklch(1 0 0) as in globals.css
 *   - --sidebar / --sidebar-* → admin-only, must never be touched here
 *   - --foreground / --muted / --border → neutral tokens, never change with theme
 *   - --brand-pink / --brand-green → fixed accent colours, not part of the brand pair
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
    // brand tokens
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

    // shadcn tokens used by shared components on the public site
    `  --primary:            ${primary};`,
    `  --primary-foreground: oklch(1 0 0);`,
    `  --secondary:          ${secondary};`,
    `  --secondary-foreground: oklch(1 0 0);`,
    `  --ring:               ${primary};`,

    // charts
    `  --chart-1:            ${primary};`,
    `  --chart-2:            ${secondary};`,
  ].join('\n')

  return `:root {\n${vars}\n}`
}

/** Inject / update / remove the org theme override <style> on the public site. */
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
