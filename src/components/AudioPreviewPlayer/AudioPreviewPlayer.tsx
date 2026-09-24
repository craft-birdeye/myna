import { useEffect, useRef, useState } from 'react'
import WaveSurfer from 'wavesurfer.js'

import '../../workflow/Molecules/PreviewPanel/PreviewPanel.css'
import { Icon } from '../Icon/Icon'
import type { AudioPreviewPlayerProps } from './AudioPreviewPlayer.types'

function fmtTime(secs: number): string {
  const m = Math.floor(secs / 60)
  const s = Math.floor(secs % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

export function AudioPreviewPlayer({
  audioUrl,
  durationSecs = 11,
  className = '',
  caption = 'Preview',
}: AudioPreviewPlayerProps) {
  const [playing, setPlaying] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [wsReady, setWsReady] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const wsRef = useRef<WaveSurfer | null>(null)

  useEffect(() => {
    if (!audioUrl || !containerRef.current) return

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
      fillParent: true,
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
    ws.on('play', () => setPlaying(true))
    ws.on('pause', () => setPlaying(false))

    wsRef.current = ws
    return () => {
      ws.destroy()
      wsRef.current = null
      setWsReady(false)
    }
  }, [audioUrl])

  const total = wsReady && wsRef.current ? wsRef.current.getDuration() : durationSecs

  function handlePlayPause() {
    if (!wsRef.current) return
    wsRef.current.playPause()
  }

  return (
    <div
      className={`flex w-full flex-col gap-md rounded-sm border border-border bg-surface px-lg py-md transition-colors duration-150 ease-out ${className}`}
    >
      {audioUrl && (
        <div
          ref={containerRef}
          className="min-h-[56px] w-full cursor-pointer transition-opacity duration-200 ease-out"
          style={{ opacity: wsReady ? 1 : 0.3 }}
          onClick={handlePlayPause}
          role="presentation"
        />
      )}
      <div className="pp-player w-full">
        <button
          className="pp-player__play-btn flex items-center justify-center"
          type="button"
          onClick={handlePlayPause}
          disabled={!audioUrl || !wsReady}
          aria-label={playing ? 'Pause preview' : 'Play preview'}
        >
          <Icon name={playing ? 'pause' : 'play_arrow'} size={14} fill className="leading-none text-white" />
        </button>
        <span className="pp-player__spacer" />
        <div className="flex items-center gap-xs">
          <span className="pp-player__time">
            <span className="text-primary">{fmtTime(elapsed)}</span>
            {' / '}
            {fmtTime(total)}
          </span>
          {caption && (
            <>
              <span className="size-1 shrink-0 rounded-full bg-border" aria-hidden />
              <span className="text-small text-text-secondary">{caption}</span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
