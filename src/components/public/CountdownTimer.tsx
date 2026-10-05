'use client'

import { useEffect, useMemo, useState } from 'react'
import { festivalConfig } from '@/config/festival'

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
}

type Phase = 'countdown' | 'live' | 'ended'

export interface CountdownTimerProps {
  /** ISO datetime with tz offset. When null (no event configured) the timer is hidden. */
  targetISO?: string | null
  /** ISO datetime with tz offset. When null (no event configured) the timer is hidden. */
  endISO?: string | null
  /** Label above the digits */
  label?: string
  /** Festival name used in live/ended states */
  festivalName?: string
}

function calcTimeLeft(targetMs: number, now: number): TimeLeft {
  const diff = targetMs - now
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 }
  return {
    days:    Math.floor(diff / 86_400_000),
    hours:   Math.floor((diff % 86_400_000) / 3_600_000),
    minutes: Math.floor((diff %  3_600_000) /    60_000),
    seconds: Math.floor((diff %     60_000) /     1_000),
  }
}

export function CountdownTimer({
  targetISO,
  endISO,
  label,
  festivalName,
}: CountdownTimerProps = {}) {
  const resolvedTarget = targetISO ?? festivalConfig.countdownTarget
  const resolvedEnd    = endISO    ?? festivalConfig.festivalEnd

  // If no event is configured at all, show a "coming soon" placeholder
  if (!resolvedTarget || !resolvedEnd) {
    return (
      <div className="text-center space-y-2 py-4">
        <p className="text-white/50 text-sm italic">Event dates will be announced soon.</p>
      </div>
    )
  }

  return (
    <CountdownInner
      targetISO={resolvedTarget}
      endISO={resolvedEnd}
      label={label ?? festivalConfig.countdownLabel}
      festivalName={festivalName ?? festivalConfig.name}
    />
  )
}

function CountdownInner({
  targetISO,
  endISO,
  label,
  festivalName,
}: {
  targetISO: string
  endISO: string
  label: string
  festivalName: string
}) {
  const targetMs = useMemo(() => new Date(targetISO).getTime(), [targetISO])
  const endMs    = useMemo(() => new Date(endISO).getTime(),    [endISO])

  const [phase, setPhase] = useState<Phase | null>(null)
  const [time,  setTime]  = useState<TimeLeft | null>(null)

  useEffect(() => {
    function tick() {
      const now = Date.now()
      if (now < targetMs)       setPhase('countdown')
      else if (now <= endMs)    setPhase('live')
      else                      setPhase('ended')
      setTime(calcTimeLeft(targetMs, now))
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [targetMs, endMs])

  if (phase === null || time === null) {
    return (
      <div className="flex gap-3 sm:gap-4 justify-center" aria-hidden>
        {[...Array(4)].map((_, i) => <TimeBox key={i} value="--" label="--" />)}
      </div>
    )
  }

  if (phase === 'live') {
    return (
      <div className="text-center space-y-2">
        <p className="font-heading font-bold text-3xl text-brand-orange">
          {festivalName} is here! 🙏
        </p>
        <p className="text-white/60 text-sm">
          The celebrations are on — join us!
        </p>
      </div>
    )
  }

  if (phase === 'ended') {
    return (
      <div className="text-center space-y-3">
        <p className="font-heading font-bold text-2xl text-brand-orange">জয় মা দুর্গা 🙏</p>
        <p className="text-white/60 text-sm">
          {festivalName} has concluded.
          <br />
          See you next year!
        </p>
      </div>
    )
  }

  return (
    <div role="timer" aria-live="off">
      <p className="text-center text-white/55 text-[10px] uppercase tracking-[0.28em] font-medium mb-5">
        {label}
      </p>
      <div className="flex gap-3 sm:gap-4 justify-center">
        <TimeBox value={time.days}    label="Days" />
        <Colon />
        <TimeBox value={time.hours}   label="Hours" />
        <Colon />
        <TimeBox value={time.minutes} label="Minutes" />
        <Colon />
        <TimeBox value={time.seconds} label="Seconds" />
      </div>
    </div>
  )
}

function TimeBox({ value, label }: { value: number | string; label: string }) {
  const display = typeof value === 'number' ? String(value).padStart(2, '0') : value
  return (
    <div className="flex flex-col items-center">
      <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3 min-w-[60px] sm:min-w-[72px] text-center">
        <span className="font-heading font-bold text-2xl sm:text-3xl text-white tabular-nums">
          {display}
        </span>
      </div>
      <span className="text-[10px] text-white/45 mt-1.5 uppercase tracking-wider">{label}</span>
    </div>
  )
}

function Colon() {
  return <span className="font-bold text-2xl text-white/35 self-start mt-3" aria-hidden>:</span>
}
