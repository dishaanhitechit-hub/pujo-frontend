'use client'

import { useEffect, useState } from 'react'
import { festivalConfig } from '@/config/festival'

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
}

type Phase = 'countdown' | 'live' | 'ended'

// Module-level constants: parsed once from the config.
// The IST offset (+05:30) in the datetime strings ensures these are
// correct UTC millisecond timestamps regardless of the visitor's timezone.
const TARGET_MS = new Date(festivalConfig.countdownTarget).getTime()
const END_MS    = new Date(festivalConfig.festivalEnd).getTime()

function getPhase(now: number): Phase {
  if (now < TARGET_MS) return 'countdown'
  if (now <= END_MS)   return 'live'
  return 'ended'
}

function calcTimeLeft(now: number): TimeLeft {
  const diff = TARGET_MS - now
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 }
  return {
    days:    Math.floor(diff / 86_400_000),
    hours:   Math.floor((diff % 86_400_000) / 3_600_000),
    minutes: Math.floor((diff % 3_600_000)  /    60_000),
    seconds: Math.floor((diff %    60_000)  /     1_000),
  }
}

export function CountdownTimer() {
  // null initial state prevents SSR/hydration mismatch —
  // server doesn't know the user's clock, client fills in on first tick.
  const [phase, setPhase] = useState<Phase | null>(null)
  const [time, setTime] = useState<TimeLeft | null>(null)

  useEffect(() => {
    function tick() {
      const now = Date.now()
      setPhase(getPhase(now))
      setTime(calcTimeLeft(now))
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  // SSR / first paint: render neutral skeleton to avoid hydration mismatch
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
          {festivalConfig.name} is here! 🙏
        </p>
        <p className="text-white/60 text-sm">
          Join us in {/* siteConfig would create a circular dep — use literal */ 'Kolaghat'} — the celebrations are on!
        </p>
      </div>
    )
  }

  if (phase === 'ended') {
    return (
      <div className="text-center space-y-3">
        <p className="font-heading font-bold text-2xl text-brand-orange">জয় মা দুর্গা 🙏</p>
        <p className="text-white/60 text-sm">
          {festivalConfig.name} {festivalConfig.year} has concluded.
          <br />
          See you next year!
        </p>
      </div>
    )
  }

  // Phase: 'countdown'
  return (
    <div role="timer" aria-live="off">
      {/* Label driven by countdownLabel config — stays in sync with countdownTarget */}
      <p className="text-center text-white/55 text-[10px] uppercase tracking-[0.28em] font-medium mb-5">
        {festivalConfig.countdownLabel}
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
