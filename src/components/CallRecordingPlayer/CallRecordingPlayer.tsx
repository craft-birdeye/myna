import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'
import WaveSurfer from 'wavesurfer.js'

import '../../workflow/Molecules/PreviewPanel/PreviewPanel.css'
import type {
  CallRecordingPlayerHandle,
  CallRecordingPlayerProps,
} from './CallRecordingPlayer.types'

const SPEEDS = [1, 1.5, 2] as const
type Speed = (typeof SPEEDS)[number]

/** Footer clock — existing product format (1.05). */
function fmtTime(secs: number): string {
  const m = Math.floor(secs / 60)
  const s = Math.floor(secs % 60)
  return `${m}.${String(s).padStart(2, '0')}`
}

/** Playhead pill — Figma seeker format (0:15). */
function fmtSeek(secs: number): string {
  const clamped = Math.max(0, secs)
  const m = Math.floor(clamped / 60)
  const s = Math.floor(clamped % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

function speedLabel(s: Speed): string {
  return s === 1 ? '1 x' : s === 1.5 ? '1.5 x' : '2 x'
}

export const CallRecordingPlayer = forwardRef<CallRecordingPlayerHandle, CallRecordingPlayerProps>(
  function CallRecordingPlayer(
    {
      audioUrl,
      durationSecs = 0,
      active = true,
      title,
      padded = true,
      className,
      onProgress,
      onPlayingChange,
      onSeek,
      showSeeker = false,
    },
    ref,
  ) {
    const [playing, setPlaying] = useState(false)
    const [elapsed, setElapsed] = useState(0)
    /** Continuous playhead (seconds) for the vertical dragger. */
    const [playhead, setPlayhead] = useState(0)
    const [wsReady, setWsReady] = useState(false)
    const [speed, setSpeed] = useState<Speed>(1.5)
    const [dragging, setDragging] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)
    const wrapRef = useRef<HTMLDivElement>(null)
    const wsRef = useRef<WaveSurfer | null>(null)
    const onSeekRef = useRef(onSeek)
    onSeekRef.current = onSeek

    const syncTime = useCallback((t: number) => {
      const next = Math.max(0, t)
      setPlayhead(next)
      setElapsed(Math.floor(next))
    }, [])

    const seekTo = useCallback(
      (secs: number) => {
        const ws = wsRef.current
        if (!ws || !wsReady) return
        const duration = ws.getDuration() || durationSecs
        const nextTime = Math.min(Math.max(0, secs), Math.max(duration, 0))
        ws.setTime(nextTime)
        syncTime(nextTime)
        onSeekRef.current?.(nextTime, duration)
      },
      [durationSecs, syncTime, wsReady],
    )

    useImperativeHandle(ref, () => ({ seekTo }), [seekTo])

    useEffect(() => {
      if (active) return
      wsRef.current?.pause()
      setPlaying(false)
      setElapsed(0)
      setPlayhead(0)
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
      ws.on('audioprocess', (t: number) => syncTime(t))
      ws.on('interaction', (t: number) => syncTime(t))
      ws.on('seeking', (t: number) => syncTime(t))
      ws.on('finish', () => {
        setPlaying(false)
        syncTime(0)
      })

      wsRef.current = ws
      return () => {
        ws.destroy()
        wsRef.current = null
        setWsReady(false)
      }
    }, [active, audioUrl, syncTime])

    useEffect(() => {
      wsRef.current?.setPlaybackRate(speed)
    }, [speed])

    const total = wsReady && wsRef.current ? wsRef.current.getDuration() : durationSecs
    const ratio = total > 0 ? Math.min(1, Math.max(0, playhead / total)) : 0

    useEffect(() => {
      onProgress?.(playhead, total)
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [playhead, total])

    useEffect(() => {
      onPlayingChange?.(playing)
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [playing])

    function seekFromClientX(clientX: number) {
      const wrap = wrapRef.current
      const ws = wsRef.current
      if (!wrap || !ws || !wsReady) return
      const rect = wrap.getBoundingClientRect()
      if (rect.width <= 0) return
      const nextRatio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width))
      const duration = ws.getDuration() || total
      const nextTime = nextRatio * duration
      ws.setTime(nextTime)
      syncTime(nextTime)
      onSeek?.(nextTime, duration)
    }

    function handlePlayPause() {
      wsRef.current?.playPause()
      setPlaying((v) => !v)
    }

    function handleNextSpeed() {
      const idx = SPEEDS.indexOf(speed)
      setSpeed(SPEEDS[(idx + 1) % SPEEDS.length])
    }

    function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
      if (!wsReady) return
      e.currentTarget.setPointerCapture(e.pointerId)
      setDragging(true)
      seekFromClientX(e.clientX)
    }

    function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
      if (!dragging) return
      seekFromClientX(e.clientX)
    }

    function handlePointerUp(e: React.PointerEvent<HTMLDivElement>) {
      if (!dragging) return
      setDragging(false)
      try {
        e.currentTarget.releasePointerCapture(e.pointerId)
      } catch {
        /* already released */
      }
    }

    return (
      <div className={className}>
        {title && <p className="mb-md text-body text-text-primary">{title}</p>}
        <div className={padded ? 'pp-details__player-wrap' : undefined}>
          <div
            ref={wrapRef}
            className="group/seek relative mb-[14px] cursor-pointer pt-6"
            style={{ opacity: wsReady ? 1 : 0.3 }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            role="slider"
            aria-label="Seek recording"
            aria-valuemin={0}
            aria-valuemax={Math.floor(total)}
            aria-valuenow={Math.floor(playhead)}
            aria-valuetext={fmtSeek(playhead)}
          >
            <div ref={containerRef} className="min-h-[56px]" />
            {wsReady && total > 0 && (
              <div
                className={`pointer-events-none absolute bottom-0 top-0 z-10 transition-opacity ${
                  dragging || showSeeker
                    ? 'opacity-100'
                    : 'opacity-0 group-hover/seek:opacity-100'
                }`}
                style={{ left: `${ratio * 100}%`, transform: 'translateX(-50%)' }}
              >
                <div className="absolute left-1/2 top-0 z-10 -translate-x-1/2 rounded-sm bg-[#1f1f1f] px-[6px] py-px">
                  <span className="block whitespace-nowrap text-[11px] leading-4 text-white">
                    {fmtSeek(playhead)}
                  </span>
                </div>
                <div className="absolute bottom-0 left-1/2 top-6 w-px -translate-x-1/2 bg-[#1f1f1f]" />
              </div>
            )}
          </div>
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
  },
)
