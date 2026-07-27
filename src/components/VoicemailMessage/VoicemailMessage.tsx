import { useEffect, useRef, useState } from 'react'
import WaveSurfer from 'wavesurfer.js'

import { FRONT_DESK_VOICE_MESSAGES } from '../../data/frontDeskCallConversation'
import { VoiceChatDrawer } from '../VoiceChatDrawer/VoiceChatDrawer'
import type { VoicemailMessageProps } from './VoicemailMessage.types'

// Fallback static bars when no audioUrl is provided
const WAVE_BARS = [
  14,22,36,28,44,18,32,24,48,30,16,40,26,44,20,34,12,38,28,46,
  22,36,16,42,30,24,40,18,44,28,36,20,46,14,32,26,42,18,36,28,
  20,44,32,16,40,24,36,28,44,20,32,48,24,36,16,40,28,20,44,32,
  24,36,16,28,40,24,32,14,36,28,44,16,32,24,20,
]

function fmtMmSs(secs: number): string {
  const m = Math.floor(secs / 60)
  const s = Math.floor(secs % 60)
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function PlayIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M0.892857 10C1.16071 10 1.39668 9.91448 1.69005 9.76055L9.22194 5.86659C9.77041 5.58153 10 5.35918 10 5C10 4.64082 9.77041 4.42417 9.22194 4.13341L1.69005 0.239453C1.39668 0.0855188 1.16071 0 0.892857 0C0.369898 0 0 0.359179 0 0.92360V9.0764C0 9.64652 0.369898 10 0.892857 10Z" fill="white"/>
    </svg>
  )
}

function PauseIcon() {
  return (
    <svg width="10" height="12" viewBox="0 0 10 12" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="0" width="3.5" height="12" rx="1" fill="white"/>
      <rect x="6.5" y="0" width="3.5" height="12" rx="1" fill="white"/>
    </svg>
  )
}

// Static bar waveform — used when no audioUrl is supplied
function StaticWaveform({ progress, onClick }: { progress: number; onClick: (e: React.MouseEvent<HTMLDivElement>) => void }) {
  return (
    <div
      className="flex flex-1 cursor-pointer items-center gap-[2px]"
      style={{ height: 30 }}
      onClick={onClick}
      role="slider"
      aria-valuenow={progress}
      aria-valuemin={0}
      aria-valuemax={1}
    >
      {WAVE_BARS.map((h, i) => {
        const played = (i / WAVE_BARS.length) <= progress
        return (
          <div
            key={i}
            className="w-[2px] shrink-0 rounded-full"
            style={{ height: Math.max(3, Math.round((h / 48) * 24)), background: played ? '#1f1f1f' : '#bfc4cc' }}
          />
        )
      })}
    </div>
  )
}

export function VoicemailMessage({
  variant = 'voicemail',
  transcript,
  summary,
  duration,
  durationSecs,
  time,
  audioUrl,
  messages = FRONT_DESK_VOICE_MESSAGES,
  contactName,
}: VoicemailMessageProps) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const wsRef = useRef<WaveSurfer | null>(null)

  const [wsReady, setWsReady] = useState(false)

  // Only initialise WaveSurfer when a real audio URL is provided
  useEffect(() => {
    if (!audioUrl || !containerRef.current) return

    const ws = WaveSurfer.create({
      container: containerRef.current,
      waveColor: '#bfc4cc',
      progressColor: '#1f1f1f',
      cursorWidth: 0,
      barWidth: 2,
      barGap: 2,
      barRadius: 2,
      height: 30,
      normalize: true,
      interact: true,
    })
    ws.setMuted(true)

    ws.load(audioUrl)
    ws.on('ready', () => setWsReady(true))
    ws.on('error', () => setWsReady(false))
    ws.on('audioprocess', (t: number) => setElapsed(Math.floor(t)))
    ws.on('finish', () => { setPlaying(false); setElapsed(0) })
    ws.on('seeking', (t: number) => setElapsed(Math.floor(t)))

    wsRef.current = ws
    return () => { ws.destroy(); wsRef.current = null; setWsReady(false) }
  }, [audioUrl])

  // Static playback timer — used when no audioUrl
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  useEffect(() => {
    if (audioUrl) return
    if (playing) {
      timerRef.current = setInterval(() => {
        setElapsed(prev => {
          const next = prev + 1
          if (next >= durationSecs) { setPlaying(false); return durationSecs }
          return next
        })
      }, 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [playing, durationSecs, audioUrl])

  function handlePlayPause() {
    if (wsRef.current) {
      wsRef.current.playPause()
    }
    setPlaying(v => !v)
  }

  function handleStaticSeek(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    const ratio = (e.clientX - rect.left) / rect.width
    setElapsed(Math.round(ratio * durationSecs))
  }

  const progress = durationSecs > 0 ? elapsed / durationSecs : 0
  const displayTime = elapsed > 0 ? fmtMmSs(elapsed) : duration

  return (
    <div className="flex flex-col items-start">
      <div className="max-w-[480px] overflow-hidden rounded-[20px] bg-[#f0f2f5] p-[10px]" style={{ minWidth: 280 }}>
        {/* Waveform row */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePlayPause}
            className="flex size-[30px] shrink-0 items-center justify-center rounded-full bg-[#1f1f1f] hover:opacity-80"
            aria-label={playing ? 'Pause' : 'Play'}
          >
            {playing ? <PauseIcon /> : <PlayIcon />}
          </button>

          {/* WaveSurfer container — always mounted when audioUrl present so it can initialise; hidden until ready */}
          {audioUrl && (
            <div ref={containerRef} className={`flex-1 cursor-pointer ${wsReady ? '' : 'hidden'}`} />
          )}
          {(!audioUrl || !wsReady) && (
            <StaticWaveform progress={progress} onClick={handleStaticSeek} />
          )}

          <p className="shrink-0 text-[13px] leading-[18px] text-[#65676b]" style={{ whiteSpace: 'nowrap' }}>
            {displayTime}
          </p>
        </div>

        {/* Divider */}
        <div
          className="my-2 h-[2px]"
          style={{ backgroundImage: 'repeating-linear-gradient(to right, #d1d5db 0px, #d1d5db 8px, transparent 8px, transparent 14px)' }}
        />

        {/* Transcript / summary */}
        <p className="text-[14px] leading-[20px] text-[#1c1e21]">
          <span className="font-normal">{variant === 'voice-chat' ? 'Call summary:' : 'Voicemail:'}</span>{' '}
          <span>"{variant === 'voice-chat' && summary ? summary : transcript}"</span>
        </p>
      </div>

      <div className="mt-1 flex items-center gap-1 text-[12px] leading-[16px] text-[#65676b]">
        <span>{time}</span>
        {variant === 'voice-chat' && (
          <>
            <span>•</span>
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="text-[12px] text-text-action hover:underline"
            >
              View transcript
            </button>
          </>
        )}
      </div>

      {variant === 'voice-chat' && (
        <VoiceChatDrawer
          open={drawerOpen}
          messages={messages}
          summary={summary}
          audioUrl={audioUrl}
          durationSecs={durationSecs}
          title={contactName ? `Call with ${contactName}` : undefined}
          onClose={() => setDrawerOpen(false)}
        />
      )}
    </div>
  )
}
