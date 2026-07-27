import { useEffect, useRef, useState } from 'react'
import WaveSurfer from 'wavesurfer.js'

import '../../workflow/Molecules/PreviewPanel/PreviewPanel.css'
import type { CallRecordingPlayerProps } from './CallRecordingPlayer.types'

const SPEEDS = [1, 1.5, 2] as const
type Speed = (typeof SPEEDS)[number]

function fmtTime(secs: number): string {
  const m = Math.floor(secs / 60)
  const s = Math.floor(secs % 60)
  return `${m}.${String(s).padStart(2, '0')}`
}

function speedLabel(s: Speed): string {
  return s === 1 ? '1 x' : s === 1.5 ? '1.5 x' : '2 x'
}

export function CallRecordingPlayer({
  audioUrl,
  durationSecs = 0,
  active = true,
  title,
  padded = true,
  className,
}: CallRecordingPlayerProps) {
  const [playing, setPlaying] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [wsReady, setWsReady] = useState(false)
  const [speed, setSpeed] = useState<Speed>(1.5)
  const containerRef = useRef<HTMLDivElement>(null)
  const wsRef = useRef<WaveSurfer | null>(null)

  useEffect(() => {
    if (active) return
    wsRef.current?.pause()
    setPlaying(false)
    setElapsed(0)
  }, [active])

  useEffect(() => {
    if (!active || !audioUrl || !containerRef.current) return

    const ws = WaveSurfer.create({
      container: containerRef.current,
      waveColor: '#d8dde6',
      progressColor: '#1976d2',
      cursorWidth: 0,
      barWidth: 2,
      barGap: 2,
      barRadius: 2,
      height: 56,
      normalize: true,
      interact: true,
    })
    ws.setMuted(true)

    ws.load(audioUrl)
    ws.on('ready', () => setWsReady(true))
    ws.on('audioprocess', (t: number) => setElapsed(Math.floor(t)))
    ws.on('finish', () => {
      setPlaying(false)
      setElapsed(0)
    })
    ws.on('seeking', (t: number) => setElapsed(Math.floor(t)))

    wsRef.current = ws
    return () => {
      ws.destroy()
      wsRef.current = null
      setWsReady(false)
    }
  }, [active, audioUrl])

  useEffect(() => {
    wsRef.current?.setPlaybackRate(speed)
  }, [speed])

  const total = wsReady && wsRef.current ? wsRef.current.getDuration() : durationSecs

  function handlePlayPause() {
    wsRef.current?.playPause()
    setPlaying((v) => !v)
  }

  function handleNextSpeed() {
    const idx = SPEEDS.indexOf(speed)
    setSpeed(SPEEDS[(idx + 1) % SPEEDS.length])
  }

  return (
    <div className={className}>
      {title && <p className="mb-md text-body text-text-primary">{title}</p>}
      <div className={padded ? 'pp-details__player-wrap' : undefined}>
        <div
          ref={containerRef}
          className="mb-[14px] min-h-[56px] cursor-pointer"
          style={{ opacity: wsReady ? 1 : 0.3 }}
        />
        <div className="pp-player">
          <button
            className="pp-player__play-btn"
            type="button"
            onClick={handlePlayPause}
            disabled={!wsReady}
            aria-label={playing ? 'Pause' : 'Play'}
          >
            <span className="material-symbols-outlined">
              {playing ? 'pause' : 'play_arrow'}
            </span>
          </button>
          <button className="pp-player__speed" type="button" onClick={handleNextSpeed}>
            {speedLabel(speed)}
          </button>
          <span className="pp-player__spacer" />
          <span className="pp-player__time">
            <span className="text-primary">{fmtTime(elapsed)}</span>
            {' / '}
            {fmtTime(total)}
          </span>
        </div>
      </div>
    </div>
  )
}
