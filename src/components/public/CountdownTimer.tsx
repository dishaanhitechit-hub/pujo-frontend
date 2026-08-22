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
  /** ISO datetime with tz offset — overrides festivalConfig.countdownTarget */
  targetISO?: string
  /** ISO datetime with tz offset — overrides festivalConfig.festivalEnd */
  endISO?: string
  /** Label above the digits — overrides festivalConfig.countdownLabel */
  label?: string
  /** Festival name used in live/ended states — overrides festivalConfig.name */
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
  const targetMs = useMemo(
    () => new Date(targetISO ?? festivalConfig.countdownTarget).getTime(),
    [targetISO],
  )
  const endMs = useMemo(
    () => new Date(endISO ?? festivalConfig.festivalEnd).getTime(),
    [endISO],
  )
  const displayLabel  = label       ?? festivalConfig.countdownLabel
  const displayName   = festivalName ?? festivalConfig.name

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
          {displayName} is here! 🙏
        </p>
        <p className="text-white/60 text-sm">
          Join us in Kolaghat — the celebrations are on!
        </p>
      </div>
    )
  }

  if (phase === 'ended') {
    return (
      <div className="text-center space-y-3">
        <p className="font-heading font-bold text-2xl text-brand-orange">জয় মা দুর্গা 🙏</p>
        <p className="text-white/60 text-sm">
          {displayName} has concluded.
          <br />
          See you next year!
        </p>
      </div>
    )
  }

  return (
    <div role="timer" aria-live="off">
      <p className="text-center text-white/55 text-[10px] uppercase tracking-[0.28em] font-medium mb-5">
        {displayLabel}
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
