import { useEffect, useRef, useState } from 'react'
import { TooltipProps } from './Tooltip.types'

const VARIANT_MAX_WIDTH = {
  brief: 'max-w-[140px]',
  detail: 'max-w-[280px]',
}

const HIDE_DELAY_MS = 120

export function Tooltip({
  content,
  variant = 'detail',
  children,
  className = '',
  interactive = false,
}: TooltipProps) {
  const [visible, setVisible] = useState(false)
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null)
  const triggerRef = useRef<HTMLSpanElement>(null)
  const panelRef = useRef<HTMLSpanElement>(null)
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function clearHideTimer() {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current)
      hideTimerRef.current = null
    }
  }

  function show() {
    if (!triggerRef.current) return
    clearHideTimer()
    const r = triggerRef.current.getBoundingClientRect()
    setPos({ x: r.left + r.width / 2, y: r.bottom + 8 })
    setVisible(true)
  }

  function hide() {
    clearHideTimer()
    setVisible(false)
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
    return () => clearHideTimer()
  }, [])

  useEffect(() => {
    if (!interactive || !visible) return

    function onPointerDown(e: MouseEvent) {
      const target = e.target as Node
      if (triggerRef.current?.contains(target)) return
      if (panelRef.current?.contains(target)) return
      hide()
    }

    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [interactive, visible])

  return (
    <span
      ref={triggerRef}
      className={`relative inline-flex items-center ${className}`}
      onMouseEnter={show}
      onMouseLeave={scheduleHide}
    >
      {children}
      {visible && pos && (
        <span
          ref={panelRef}
          role="tooltip"
          className={`fixed z-[120] w-max ${VARIANT_MAX_WIDTH[variant]} rounded-sm bg-tooltip px-sm py-xs text-small text-white shadow-tooltip ${
            interactive ? 'pointer-events-auto' : 'pointer-events-none'
          }`}
          style={{ left: pos.x, top: pos.y, transform: 'translateX(-50%)' }}
          onMouseEnter={interactive ? clearHideTimer : undefined}
          onMouseLeave={interactive ? scheduleHide : undefined}
        >
          {content}
        </span>
      )}
    </span>
  )
}
