import { useEffect, useRef, useState } from 'react'
import { TooltipProps } from './Tooltip.types'

const VARIANT_MAX_WIDTH = {
  brief: 'max-w-[140px]',
  detail: 'max-w-[280px]',
}

const HIDE_DELAY_MS = 120
const TRANSITION_MS = 120

export function Tooltip({
  content,
  variant = 'detail',
  children,
  className = '',
  interactive = false,
}: TooltipProps) {
  // `mounted` keeps the bubble in the DOM through the fade-out; `entered` toggles
  // the opacity/scale classes that drive the ease-in/ease-out transition.
  const [mounted, setMounted] = useState(false)
  const [entered, setEntered] = useState(false)
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null)
  const triggerRef = useRef<HTMLSpanElement>(null)
  const panelRef = useRef<HTMLSpanElement>(null)
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const unmountTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const rafRef = useRef<number | null>(null)

  function clearHideTimer() {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current)
      hideTimerRef.current = null
    }
  }

  function clearRaf() {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }

  function show() {
    if (!triggerRef.current) return
    clearHideTimer()
    clearRaf()
    if (unmountTimerRef.current) {
      clearTimeout(unmountTimerRef.current)
      unmountTimerRef.current = null
    }
    const r = triggerRef.current.getBoundingClientRect()
    setPos({ x: r.left + r.width / 2, y: r.bottom + 8 })
    setMounted(true)
    // Double rAF: setMounted and this call both happen inside the same mouseenter
    // handler, so a single rAF can land in the same paint and skip the transition
    // entirely. Waiting a full extra frame guarantees the "hidden" state actually
    // paints before flipping to "entered".
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = requestAnimationFrame(() => setEntered(true))
    })
  }

  function hide() {
    clearHideTimer()
    clearRaf()
    setEntered(false)
    unmountTimerRef.current = setTimeout(() => setMounted(false), TRANSITION_MS)
  }

  function scheduleHide() {
    if (!interactive) {
      hide()
      return
    }
    clearHideTimer()
    hideTimerRef.current = setTimeout(hide, HIDE_DELAY_MS)
  }

  useEffect(() => {
    return () => {
      clearHideTimer()
      clearRaf()
      if (unmountTimerRef.current) clearTimeout(unmountTimerRef.current)
    }
  }, [])

  useEffect(() => {
    if (!interactive || !mounted) return

    function onPointerDown(e: MouseEvent) {
      const target = e.target as Node
      if (triggerRef.current?.contains(target)) return
      if (panelRef.current?.contains(target)) return
      hide()
    }

    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [interactive, mounted])

  return (
    <span
      ref={triggerRef}
      className={`relative inline-flex items-center ${className}`}
      onMouseEnter={show}
      onMouseLeave={scheduleHide}
    >
      {children}
      {mounted && pos && (
        <span
          ref={panelRef}
          role="tooltip"
          className={`fixed z-[120] w-max ${VARIANT_MAX_WIDTH[variant]} rounded-sm bg-tooltip px-sm py-xs text-small text-white transition-all duration-150 ease-out ${
            entered ? 'opacity-100' : 'opacity-0'
          } ${interactive ? 'pointer-events-auto' : 'pointer-events-none'}`}
          style={{ left: pos.x, top: pos.y, transform: `translateX(-50%) scale(${entered ? 1 : 0.95})` }}
          onMouseEnter={interactive ? clearHideTimer : undefined}
          onMouseLeave={interactive ? scheduleHide : undefined}
        >
          {content}
        </span>
      )}
    </span>
  )
}
