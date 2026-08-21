import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { TooltipProps } from './Tooltip.types'

const VARIANT_MAX_WIDTH = {
  brief: 'max-w-[140px]',
  detail: 'max-w-[280px]',
}

const HIDE_DELAY_MS = 120
const TRANSITION_MS = 120
const OFFSET_BOTTOM_PX = 8
/** Gap from trigger edge to bubble; caret sits in this space. */
const OFFSET_RIGHT_PX = 6

export function Tooltip({
  content,
  variant = 'detail',
  side = 'bottom',
  children,
  className = '',
  interactive = false,
  disabled = false,
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
    if (disabled || !triggerRef.current) return
    clearHideTimer()
    clearRaf()
    if (unmountTimerRef.current) {
      clearTimeout(unmountTimerRef.current)
      unmountTimerRef.current = null
    }
    // Prefer the interactive child (button/icon) so we hug the glyph, not a wider wrapper.
    const anchor =
      (triggerRef.current.firstElementChild as HTMLElement | null) ?? triggerRef.current
    const r = anchor.getBoundingClientRect()
    if (side === 'right') {
      setPos({ x: r.right + OFFSET_RIGHT_PX, y: r.top + r.height / 2 })
    } else if (side === 'top') {
      setPos({ x: r.left + r.width / 2, y: r.top - OFFSET_BOTTOM_PX })
    } else {
      setPos({ x: r.left + r.width / 2, y: r.bottom + OFFSET_BOTTOM_PX })
    }
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
    if (!mounted) return

    function reposition() {
      if (!triggerRef.current) return
      const anchor =
        (triggerRef.current.firstElementChild as HTMLElement | null) ?? triggerRef.current
      const r = anchor.getBoundingClientRect()
      if (side === 'right') {
        setPos({ x: r.right + OFFSET_RIGHT_PX, y: r.top + r.height / 2 })
      } else if (side === 'top') {
        setPos({ x: r.left + r.width / 2, y: r.top - OFFSET_BOTTOM_PX })
      } else {
        setPos({ x: r.left + r.width / 2, y: r.bottom + OFFSET_BOTTOM_PX })
      }
    }

    function onScroll() {
      hide()
    }

    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', reposition)
    return () => {
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', reposition)
    }
  }, [mounted, side])

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

  useEffect(() => {
    if (disabled && mounted) hide()
    // hide is stable enough for this effect; only react to disabled flipping on.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabled])

  const transform =
    side === 'right'
      ? `translateY(-50%) scale(${entered ? 1 : 0.95})`
      : side === 'top'
        ? `translate(-50%, -100%) scale(${entered ? 1 : 0.95})`
        : `translateX(-50%) scale(${entered ? 1 : 0.95})`

  // Portal to body so `position: fixed` uses the viewport. Ancestors with
  // `transform` (e.g. the left floater's translateY(-50%)) otherwise become the
  // containing block and push the bubble far from the icon.
  const bubble =
    mounted && pos
      ? createPortal(
          <span
            ref={panelRef}
            role="tooltip"
            className={`fixed z-[11000] w-max ${VARIANT_MAX_WIDTH[variant]} rounded-sm bg-tooltip px-sm py-xs text-small text-white transition-all duration-150 ease-out ${
              entered ? 'opacity-100' : 'opacity-0'
            } ${interactive ? 'pointer-events-auto' : 'pointer-events-none'} ${
              side === 'right' ? 'tooltip-caret-left' : ''
            }`}
            style={{ left: pos.x, top: pos.y, transform }}
            onMouseEnter={interactive ? clearHideTimer : undefined}
            onMouseLeave={interactive ? scheduleHide : undefined}
          >
            {content}
          </span>,
          document.body,
        )
      : null

  return (
    <span
      ref={triggerRef}
      className={`relative inline-flex items-center ${className}`}
      onMouseEnter={show}
      onMouseLeave={scheduleHide}
    >
      {children}
      {bubble}
    </span>
  )
}
