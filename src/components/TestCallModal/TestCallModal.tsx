import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Phone, PhoneOff, X, ChevronDown, ChevronUp } from 'lucide-react'
import type { TestCallModalProps } from './TestCallModal.types'

const AGENTS = [
  'Front desk agent',
  'Reminder agent',
  'Outreach agent',
  'Waitlist agent',
]

const COUNTRY_CODES = [
  { code: '+1', flag: '🇺🇸', label: 'US' },
  { code: '+44', flag: '🇬🇧', label: 'UK' },
  { code: '+61', flag: '🇦🇺', label: 'AU' },
  { code: '+91', flag: '🇮🇳', label: 'IN' },
]

type Phase = 'idle' | 'calling' | 'connected' | 'ended'

export function TestCallModal({ open, agentName, onClose }: TestCallModalProps) {
  const [selectedAgent, setSelectedAgent] = useState(agentName ?? AGENTS[0])
  const [countryCode, setCountryCode] = useState(COUNTRY_CODES[0])
  const [phone, setPhone] = useState('')
  const [phase, setPhase] = useState<Phase>('idle')
  const [elapsed, setElapsed] = useState(0)
  const [agentOpen, setAgentOpen] = useState(false)
  const [ccOpen, setCcOpen] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Sync agent when prop changes (e.g. opening from different agent pages)
  useEffect(() => {
    if (agentName) setSelectedAgent(agentName)
  }, [agentName])

  // Reset when closed
  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setPhase('idle')
        setElapsed(0)
        setPhone('')
      }, 300)
    }
  }, [open])

  // Call duration timer
  useEffect(() => {
    if (phase === 'connected') {
      timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [phase])

  const fmtElapsed = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${String(sec).padStart(2, '0')}`
  }

  const handleSend = () => {
    if (!phone.trim()) return
    setPhase('calling')
    setTimeout(() => setPhase('connected'), 2800)
  }

  const handleEndCall = () => {
    setPhase('ended')
    setElapsed(0)
  }

  const handleClose = () => {
    if (phase === 'connected') handleEndCall()
    onClose()
  }

  if (!open) return null

  const canSend = phone.trim().length >= 7 && phase === 'idle'

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) handleClose() }}
    >
      <div
        className="relative w-[480px] rounded-xl bg-surface shadow-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-xl py-lg">
          <div className="flex items-center gap-sm">
            <Phone className="size-5 text-text-primary" strokeWidth={1.6} absoluteStrokeWidth />
            <span className="text-h3 text-text-primary">Test call</span>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="flex size-7 items-center justify-center rounded-md text-text-icon hover:bg-surface-hover"
          >
            <X className="size-5" strokeWidth={1.6} absoluteStrokeWidth />
          </button>
        </div>

        <div className="px-xl py-lg">

          {/* Idle / form state */}
          {(phase === 'idle') && (
            <>
              <p className="mb-lg text-body text-text-secondary">
                Enter a phone number to receive a call from one of your agents.
              </p>

              {/* Agent selector */}
              <div className="relative mb-lg">
                <button
                  type="button"
                  onClick={() => setAgentOpen((v) => !v)}
                  className="flex h-11 w-full items-center justify-between rounded-sm border border-border bg-surface px-md text-body text-text-primary hover:border-border-strong"
                >
                  <span>{selectedAgent}</span>
                  {agentOpen
                    ? <ChevronUp className="size-5 text-text-icon" strokeWidth={1.6} absoluteStrokeWidth />
                    : <ChevronDown className="size-5 text-text-icon" strokeWidth={1.6} absoluteStrokeWidth />}
                </button>
                {agentOpen && (
                  <>
                    <div className="fixed inset-0 z-[10]" onClick={() => setAgentOpen(false)} aria-hidden />
                    <div className="absolute left-0 right-0 top-full z-[20] mt-xs rounded-sm border border-border bg-surface py-xs shadow-dropdown">
                      {AGENTS.map((a) => (
                        <button
                          key={a}
                          type="button"
                          className="block w-full px-md py-sm text-left text-body text-text-primary hover:bg-surface-hover"
                          onClick={() => { setSelectedAgent(a); setAgentOpen(false) }}
                        >
                          {a}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Phone number */}
              <label className="mb-sm block text-body text-text-primary">Phone number</label>
              <div className="flex gap-sm">
                {/* Country code picker */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setCcOpen((v) => !v)}
                    className="flex h-11 items-center gap-xs rounded-sm border border-border bg-surface px-sm text-body text-text-primary hover:border-border-strong"
                  >
                    <span className="text-lg leading-none">{countryCode.flag}</span>
                    <span>{countryCode.code}</span>
                    <ChevronDown className="size-4 text-text-icon" strokeWidth={1.6} absoluteStrokeWidth />
                  </button>
                  {ccOpen && (
                    <>
                      <div className="fixed inset-0 z-[10]" onClick={() => setCcOpen(false)} aria-hidden />
                      <div className="absolute left-0 top-full z-[20] mt-xs min-w-[120px] rounded-sm border border-border bg-surface py-xs shadow-dropdown">
                        {COUNTRY_CODES.map((c) => (
                          <button
                            key={c.code}
                            type="button"
                            className="flex w-full items-center gap-sm px-md py-sm text-left text-body text-text-primary hover:bg-surface-hover"
                            onClick={() => { setCountryCode(c); setCcOpen(false) }}
                          >
                            <span>{c.flag}</span>
                            <span>{c.code}</span>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* Number input */}
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(555) 000-0000"
                  className="h-11 flex-1 rounded-sm border border-border bg-surface px-md text-body text-text-primary placeholder:text-text-tertiary focus:border-primary focus:outline-none"
                />
              </div>
            </>
          )}

          {/* Calling state */}
          {phase === 'calling' && (
            <div className="flex flex-col items-center gap-lg py-xl">
              <div className="relative flex size-20 items-center justify-center rounded-full bg-primary/10">
                <Phone className="size-5 text-primary" strokeWidth={1.6} absoluteStrokeWidth />
                {/* Pulsing rings */}
                <span className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
              </div>
              <div className="flex flex-col items-center gap-xs">
                <span className="text-h3 text-text-primary">Calling {countryCode.code} {phone}...</span>
                <span className="text-body text-text-secondary">Connecting via {selectedAgent}</span>
              </div>
              <button
                type="button"
                onClick={() => setPhase('idle')}
                className="flex h-[34px] items-center rounded-md border border-border-selected bg-surface px-lg text-body text-text-primary hover:bg-surface-l2"
              >
                Cancel
              </button>
            </div>
          )}

          {/* Connected state */}
          {phase === 'connected' && (
            <div className="flex flex-col items-center gap-lg py-xl">
              <div className="flex size-20 items-center justify-center rounded-full bg-success/10">
                <Phone className="size-5 text-success" strokeWidth={1.6} absoluteStrokeWidth />
              </div>
              <div className="flex flex-col items-center gap-xs">
                <span className="text-h3 text-text-primary">Connected</span>
                <span className="text-body text-text-secondary">{selectedAgent} · {fmtElapsed(elapsed)}</span>
              </div>
              <div className="flex items-center gap-sm">
                <button
                  type="button"
                  onClick={handleEndCall}
                  className="flex h-12 w-12 items-center justify-center rounded-full bg-danger text-white hover:bg-danger/90"
                  aria-label="End call"
                >
                  <PhoneOff className="size-5" strokeWidth={1.6} absoluteStrokeWidth />
                </button>
              </div>
              <p className="text-center text-small text-text-tertiary">
                Pick up your phone — the agent is calling you now.
              </p>
            </div>
          )}

          {/* Ended state */}
          {phase === 'ended' && (
            <div className="flex flex-col items-center gap-lg py-xl">
              <div className="flex size-20 items-center justify-center rounded-full bg-surface-subtle">
                <PhoneOff className="size-5 text-text-secondary" strokeWidth={1.6} absoluteStrokeWidth />
              </div>
              <div className="flex flex-col items-center gap-xs">
                <span className="text-h3 text-text-primary">Call ended</span>
                <span className="text-body text-text-secondary">How did it go?</span>
              </div>
              <div className="flex items-center gap-sm">
                <button
                  type="button"
                  onClick={() => { setPhase('idle'); setPhone('') }}
                  className="flex h-[34px] items-center rounded-md border border-border-selected bg-surface px-lg text-body text-text-primary hover:bg-surface-l2"
                >
                  Try again
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex h-[34px] items-center rounded-md bg-primary px-lg text-body text-white hover:bg-primary-hover"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer — only shown during idle */}
        {phase === 'idle' && (
          <div className="flex items-center justify-end gap-sm border-t border-border px-xl py-lg">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-sm px-md py-xs text-body text-text-action hover:bg-surface-hover"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleSend}
              disabled={!canSend}
              className={`flex h-[34px] items-center gap-sm rounded-md px-lg text-body text-white transition-colors ${
                canSend
                  ? 'bg-primary hover:bg-primary-hover'
                  : 'cursor-not-allowed bg-surface-selected text-text-tertiary'
              }`}
            >
              <Phone className="size-4" strokeWidth={1.6} absoluteStrokeWidth />
              Send test call
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
