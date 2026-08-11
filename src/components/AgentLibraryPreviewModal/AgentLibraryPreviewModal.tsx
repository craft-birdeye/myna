import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Icon } from '../Icon/Icon'
import type { AgentLibraryPreviewModalProps } from './AgentLibraryPreviewModal.types'

const ZOOM_OPTIONS = [50, 75, 100, 125, 150] as const
const ZOOM_MIN = 50
const ZOOM_MAX = 150
const ZOOM_STEP = 25

function clampZoom(value: number) {
  return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round(value)))
}

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable
}

function SparkleMark({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden>
      <path
        d="M10 2.5 10.95 7.05 15.5 8 10.95 8.95 10 13.5 9.05 8.95 4.5 8 9.05 7.05 10 2.5Z"
        fill="#6834B7"
      />
      <path
        d="M15.2 1.8 15.55 3.45 17.2 3.8 15.55 4.15 15.2 5.8 14.85 4.15 13.2 3.8 14.85 3.45 15.2 1.8Z"
        fill="#6834B7"
      />
      <path
        d="M16.6 6.4 16.85 7.55 18 7.8 16.85 8.05 16.6 9.2 16.35 8.05 15.2 7.8 16.35 7.55 16.6 6.4Z"
        fill="#6834B7"
      />
    </svg>
  )
}

export function AgentLibraryPreviewModal({
  open,
  data,
  onClose,
  onUseAgent,
}: AgentLibraryPreviewModalProps) {
  const [zoom, setZoom] = useState(100)
  const [zoomOpen, setZoomOpen] = useState(false)
  const zoomRef = useRef<HTMLDivElement | null>(null)
  const dialogRef = useRef<HTMLDivElement | null>(null)
  const canvasRef = useRef<HTMLDivElement | null>(null)
  const zoomValueRef = useRef(zoom)
  const gestureStartZoomRef = useRef(100)

  useEffect(() => {
    zoomValueRef.current = zoom
  }, [zoom])

  useEffect(() => {
    if (!open) {
      setZoom(100)
      setZoomOpen(false)
      return
    }
    // Focus the dialog so keyboard shortcuts work immediately.
    const id = window.requestAnimationFrame(() => dialogRef.current?.focus())
    return () => window.cancelAnimationFrame(id)
  }, [open])

  // Keyboard zoom (+ / - / = / 0, with or without ⌘/Ctrl), capture phase so browser page-zoom doesn't win.
  useEffect(() => {
    if (!open) return

    const onKeyDown = (e: KeyboardEvent) => {
      if (isEditableTarget(e.target)) return

      const key = e.key
      const code = e.code
      const withMod = e.metaKey || e.ctrlKey

      const zoomIn =
        key === '+' ||
        key === '=' ||
        code === 'NumpadAdd' ||
        code === 'Equal' ||
        (withMod && (key === '+' || key === '=' || code === 'Equal' || code === 'NumpadAdd'))
      const zoomOut =
        key === '-' ||
        key === '_' ||
        code === 'NumpadSubtract' ||
        code === 'Minus' ||
        (withMod && (key === '-' || key === '_' || code === 'Minus' || code === 'NumpadSubtract'))
      const zoomReset =
        !withMod && (key === '0' || code === 'Digit0' || code === 'Numpad0')

      if (zoomIn) {
        e.preventDefault()
        e.stopPropagation()
        setZoom((z) => clampZoom(z + ZOOM_STEP))
        setZoomOpen(false)
        return
      }
      if (zoomOut) {
        e.preventDefault()
        e.stopPropagation()
        setZoom((z) => clampZoom(z - ZOOM_STEP))
        setZoomOpen(false)
        return
      }
      if (zoomReset) {
        e.preventDefault()
        e.stopPropagation()
        setZoom(100)
        setZoomOpen(false)
      }
    }

    window.addEventListener('keydown', onKeyDown, true)
    return () => window.removeEventListener('keydown', onKeyDown, true)
  }, [open])

  // Trackpad pinch (wheel + ctrl/meta) and Safari gesture events on the canvas.
  useEffect(() => {
    if (!open) return
    const el = canvasRef.current
    if (!el) return

    const onWheel = (e: WheelEvent) => {
      // Trackpad pinch is delivered as a ctrl/meta wheel event in Chromium/Firefox.
      if (!(e.ctrlKey || e.metaKey)) return
      e.preventDefault()
      e.stopPropagation()
      const next = clampZoom(zoomValueRef.current - e.deltaY * 0.45)
      zoomValueRef.current = next
      setZoom(next)
      setZoomOpen(false)
    }

    const onGestureStart = (e: Event) => {
      e.preventDefault()
      gestureStartZoomRef.current = zoomValueRef.current
    }

    const onGestureChange = (e: Event) => {
      e.preventDefault()
      const scale = (e as Event & { scale?: number }).scale ?? 1
      const next = clampZoom(gestureStartZoomRef.current * scale)
      zoomValueRef.current = next
      setZoom(next)
      setZoomOpen(false)
    }

    const onGestureEnd = (e: Event) => {
      e.preventDefault()
    }

    el.addEventListener('wheel', onWheel, { passive: false })
    el.addEventListener('gesturestart', onGestureStart as EventListener, { passive: false })
    el.addEventListener('gesturechange', onGestureChange as EventListener, { passive: false })
    el.addEventListener('gestureend', onGestureEnd as EventListener, { passive: false })

    return () => {
      el.removeEventListener('wheel', onWheel)
      el.removeEventListener('gesturestart', onGestureStart as EventListener)
      el.removeEventListener('gesturechange', onGestureChange as EventListener)
      el.removeEventListener('gestureend', onGestureEnd as EventListener)
    }
  }, [open, data])

  useEffect(() => {
    if (!zoomOpen) return
    const onPointerDown = (e: MouseEvent) => {
      if (zoomRef.current && !zoomRef.current.contains(e.target as Node)) {
        setZoomOpen(false)
      }
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setZoomOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [zoomOpen])

  if (!open || !data) return null

  return createPortal(
    <div
      ref={dialogRef}
      tabIndex={-1}
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-lg outline-none"
      role="dialog"
      aria-modal
      aria-label="Preview"
    >
      <div className="flex h-[min(720px,90vh)] w-full max-w-[1100px] flex-col overflow-hidden rounded-lg border border-border bg-surface shadow-modal">
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-border px-lg">
          <h2 className="text-h3 text-text-primary">Preview</h2>
          <div className="flex items-center gap-sm">
            <button
              type="button"
              onClick={onUseAgent}
              className="flex h-9 items-center rounded-sm bg-primary px-lg text-body text-white transition-colors hover:bg-primary-hover"
            >
              Use agent
            </button>
            <button
              type="button"
              aria-label="Close"
              onClick={onClose}
              className="flex size-8 items-center justify-center rounded-sm text-text-icon hover:bg-surface-hover"
            >
              <Icon name="close" size={20} />
            </button>
          </div>
        </div>

        <div className="flex min-h-0 flex-1">
          {/* pr-xl = lg (16) + 4px extra right padding */}
          <aside className="flex w-[300px] shrink-0 flex-col gap-xl overflow-y-auto border-r border-border py-xl pl-lg pr-xl">
            <div className="flex flex-col gap-xs">
              <span className="text-small text-text-secondary">Name</span>
              <p className="text-body text-text-primary">{data.name}</p>
            </div>
            <div className="flex flex-col gap-xs">
              <span className="text-small text-text-secondary">Goal</span>
              <p className="text-body text-text-primary">{data.goal}</p>
            </div>
            <div className="flex flex-col gap-xs">
              <span className="text-small text-text-secondary">Outcome</span>
              <p className="text-body text-text-primary">{data.outcome}</p>
            </div>
          </aside>

          <div ref={canvasRef} className="relative min-w-0 flex-1 overflow-auto bg-surface-l2 overscroll-contain">
            <div className="absolute right-lg top-lg z-10" ref={zoomRef}>
              <div className="flex h-9 items-center rounded-full border border-border bg-surface shadow-dropdown">
                <button
                  type="button"
                  aria-label="Zoom out"
                  disabled={zoom <= ZOOM_MIN}
                  onClick={() => setZoom((z) => clampZoom(z - ZOOM_STEP))}
                  className="flex size-8 items-center justify-center rounded-full text-text-icon hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Icon name="remove" size={18} />
                </button>
                <button
                  type="button"
                  aria-haspopup="listbox"
                  aria-expanded={zoomOpen}
                  aria-label="Zoom level"
                  onClick={() => setZoomOpen((open) => !open)}
                  className="flex min-w-[52px] items-center justify-center px-xs text-small text-text-primary hover:bg-surface-hover"
                >
                  {zoom}%
                </button>
                <button
                  type="button"
                  aria-label="Zoom in"
                  disabled={zoom >= ZOOM_MAX}
                  onClick={() => setZoom((z) => clampZoom(z + ZOOM_STEP))}
                  className="flex size-8 items-center justify-center rounded-full text-text-icon hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Icon name="add" size={18} />
                </button>
              </div>
              {zoomOpen && (
                <div
                  role="listbox"
                  aria-label="Zoom level"
                  className="absolute right-0 top-[calc(100%+4px)] z-20 min-w-[88px] rounded-sm border border-border bg-surface py-xs shadow-dropdown"
                >
                  {ZOOM_OPTIONS.map((option) => (
                    <button
                      key={option}
                      type="button"
                      role="option"
                      aria-selected={zoom === option}
                      onClick={() => {
                        setZoom(option)
                        setZoomOpen(false)
                      }}
                      className={`block w-full px-md py-sm text-left text-small hover:bg-surface-hover ${
                        zoom === option ? 'bg-surface-selected text-text-primary' : 'text-text-primary'
                      }`}
                    >
                      {option}%
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex origin-top justify-center px-2xl py-3xl">
              <div
                className="flex flex-col items-center gap-0 will-change-transform"
                style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
              >
                <div className="flex w-full max-w-[420px] items-center gap-sm rounded-lg border border-border bg-surface px-md py-md shadow-dropdown">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-sm bg-ai-summary">
                    <SparkleMark size={18} />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-body text-text-primary">{data.name}</p>
                    <p className="text-small text-text-secondary">{data.locationsLabel ?? 'All locations'}</p>
                  </div>
                </div>

                <div className="h-8 w-px bg-ai-summary-border" />

                {data.steps.map((step, index) => (
                  <div key={`${step.title}-${index}`} className="flex w-full max-w-[420px] flex-col items-center">
                    <div className="w-full rounded-md border border-border bg-surface p-lg shadow-dropdown">
                      <div className="mb-sm flex items-center gap-xs">
                        <Icon
                          name={step.kind === 'trigger' ? 'bolt' : 'task_alt'}
                          size={16}
                          className={step.kind === 'trigger' ? 'text-chip-danger-text' : 'text-text-action'}
                        />
                        <span className={`text-small ${step.kind === 'trigger' ? 'text-chip-danger-text' : 'text-text-action'}`}>
                          {step.kind === 'trigger' ? 'Trigger' : 'Task'}
                        </span>
                      </div>
                      <p className="text-body text-text-primary">{step.title}</p>
                      <p className="mt-xs text-small text-text-secondary">{step.description}</p>
                    </div>
                    {index < data.steps.length - 1 && <div className="h-8 w-px bg-ai-summary-border" />}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
