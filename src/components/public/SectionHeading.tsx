import { cn } from '@/lib/utils'

interface SectionHeadingProps {
  label?: string
  title: string
  subtitle?: string
  align?: 'left' | 'center'
  inverted?: boolean
  className?: string
}

export function SectionHeading({
  label,
  title,
  subtitle,
  align = 'center',
  inverted = false,
  className,
}: SectionHeadingProps) {
  return (
    <div className={cn(align === 'center' ? 'text-center' : 'text-left', className)}>
      {label && (
        <p
          className={cn(
            'text-xs font-bold uppercase tracking-[0.2em] mb-2',
            inverted ? 'text-brand-orange' : 'text-brand-orange',
          )}
        >
          {label}
        </p>
      )}
      <h2
        className={cn(
          'font-heading font-bold leading-tight',
          'text-3xl sm:text-4xl lg:text-5xl',
          inverted ? 'text-white' : 'text-brand-navy',
        )}
      >
        {title}
      </h2>
      {subtitle && (
        <p
          className={cn(
            'mt-4 text-base sm:text-lg max-w-2xl',
            align === 'center' && 'mx-auto',
            inverted ? 'text-white/70' : 'text-muted-foreground',
          )}
        >
          {subtitle}
        </p>
      )}
    </div>
  )
}
