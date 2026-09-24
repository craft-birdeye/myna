import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent } from 'react'
import { createPortal } from 'react-dom'
import { TooltipProps, TooltipSide } from './Tooltip.types'

const VARIANT_CLASS = {
  brief: 'whitespace-nowrap',
  detail: 'max-w-[280px]',
}

const HIDE_DELAY_MS = 120
const TRANSITION_MS = 120
const DEFAULT_OFFSET_PX = 8
/** Gap from trigger edge to bubble; caret sits in this space. */
const DEFAULT_OFFSET_RIGHT_PX = 6

function positionFromAnchor(
  anchor: HTMLElement,
  side: TooltipSide,
  offset: number,
): { x: number; y: number } {
  const r = anchor.getBoundingClientRect()
  if (side === 'right') {
    return { x: r.right + offset, y: r.top + r.height / 2 }
  }
  if (side === 'top') {
    return { x: r.left + r.width / 2, y: r.top - offset }
  }
  return { x: r.left + r.width / 2, y: r.bottom + offset }
}

function positionFromCursor(clientX: number, clientY: number, side: TooltipSide, offset: number) {
  if (side === 'right') {
    return { x: clientX + offset, y: clientY }
  }
  if (side === 'top') {
    return { x: clientX, y: clientY - offset }
  }
  return { x: clientX, y: clientY + offset }
}

export function Tooltip({
  content,
  variant = 'detail',
  side = 'bottom',
  children,
  className = '',
  interactive = false,
  disabled = false,
  followCursor = false,
  offset = DEFAULT_OFFSET_PX,
  showDelay = 0,
}: TooltipProps) {
  // `mounted` keeps the bubble in the DOM through the fade-out; `entered` toggles
  // the opacity/scale classes that drive the ease-in/ease-out transition.
  const [mounted, setMounted] = useState(false)
  const [entered, setEntered] = useState(false)
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null)
  const triggerRef = useRef<HTMLSpanElement>(null)
  const panelRef = useRef<HTMLSpanElement>(null)
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const showTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const unmountTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const rafRef = useRef<number | null>(null)
  const pendingCursorRef = useRef<{ x: number; y: number } | null>(null)

  function clearHideTimer() {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current)
      hideTimerRef.current = null
    }
  }

  function clearShowTimer() {
    if (showTimerRef.current) {
      clearTimeout(showTimerRef.current)
      showTimerRef.current = null
    }
  }

  function clearRaf() {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }

  function openAtCursor(clientX: number, clientY: number) {
    setPos(positionFromCursor(clientX, clientY, side, offset))
  }

  function openAtAnchor() {
    if (!triggerRef.current) return
    // Prefer the interactive child (button/icon) so we hug the glyph, not a wider wrapper.
    const anchor =
      (triggerRef.current.firstElementChild as HTMLElement | null) ?? triggerRef.current
    const edgeOffset = side === 'right' ? DEFAULT_OFFSET_RIGHT_PX : offset
    setPos(positionFromAnchor(anchor, side, edgeOffset))
  }

  function showNow() {
    if (disabled || !triggerRef.current) return
    clearHideTimer()
    clearShowTimer()
    clearRaf()
    if (unmountTimerRef.current) {
      clearTimeout(unmountTimerRef.current)
      unmountTimerRef.current = null
    }
    if (followCursor && pendingCursorRef.current) {
      openAtCursor(pendingCursorRef.current.x, pendingCursorRef.current.y)
    } else {
      openAtAnchor()
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

  function scheduleShow(e?: ReactMouseEvent) {
    if (disabled || !triggerRef.current) return
    clearHideTimer()
    if (followCursor && e) {
      pendingCursorRef.current = { x: e.clientX, y: e.clientY }
    }
    clearShowTimer()
    if (showDelay > 0) {
      showTimerRef.current = setTimeout(showNow, showDelay)
      return
    }
    showNow()
  }

  function hide() {
    clearHideTimer()
    clearShowTimer()
    clearRaf()
    pendingCursorRef.current = null
    setEntered(false)
    unmountTimerRef.current = setTimeout(() => setMounted(false), TRANSITION_MS)
  }

  function scheduleHide() {
    clearShowTimer()
    pendingCursorRef.current = null
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
      clearShowTimer()
      clearRaf()
      if (unmountTimerRef.current) clearTimeout(unmountTimerRef.current)
    }
  }, [])

  useEffect(() => {
    if (!mounted || followCursor) return

    function reposition() {
      if (!triggerRef.current) return
      const anchor =
        (triggerRef.current.firstElementChild as HTMLElement | null) ?? triggerRef.current
      const edgeOffset = side === 'right' ? DEFAULT_OFFSET_RIGHT_PX : offset
      setPos(positionFromAnchor(anchor, side, edgeOffset))
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
  }, [mounted, side, followCursor, offset])

  function handleMouseMove(e: ReactMouseEvent) {
    if (!followCursor) return
    pendingCursorRef.current = { x: e.clientX, y: e.clientY }
    if (mounted) {
      openAtCursor(e.clientX, e.clientY)
    }
  }

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
            className={`fixed z-[11000] w-max ${VARIANT_CLASS[variant]} rounded-sm bg-tooltip px-sm py-xs text-small text-white transition-all duration-150 ease-out ${
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
      onMouseEnter={scheduleShow}
      onMouseMove={handleMouseMove}
      onMouseLeave={scheduleHide}
    >
      {children}
      {bubble}
    </span>
  )
}
