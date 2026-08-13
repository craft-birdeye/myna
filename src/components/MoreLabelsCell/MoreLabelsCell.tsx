import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { MoreLabelsCellProps } from './MoreLabelsCell.types'

/** "First label, +N more" — hovering "+N more" reveals the rest in a small popover. Portaled
    to <body> with fixed positioning since table cells truncate/clip overflow. A short close
    delay lets the mouse travel from the trigger to the popover without it disappearing.
    Shared by the Booking templates list (Services column) and the template editor's Field
    groups table (Mapped services / Extra fields columns). */
export function MoreLabelsCell({ labels, emptyLabel = '—' }: MoreLabelsCellProps) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const btnRef = useRef<HTMLButtonElement>(null)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
  }, [])

  if (labels.length === 0) {
    return <span className="text-body text-text-primary">{emptyLabel}</span>
  }

  const [first, ...rest] = labels

  function clearCloseTimer() {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current)
      closeTimer.current = null
    }
  }

  function scheduleClose() {
    clearCloseTimer()
    closeTimer.current = setTimeout(() => setOpen(false), 150)
  }

  function handleEnter() {
    clearCloseTimer()
    const rect = btnRef.current!.getBoundingClientRect()
    setPos({ top: rect.bottom + 4, left: rect.left })
    setOpen(true)
  }

  return (
    <span className="inline-flex items-center gap-xs" onClick={(e) => e.stopPropagation()}>
      <span className="text-body text-text-primary">{first}</span>
      {rest.length > 0 && (
        <>
          <button
            ref={btnRef}
            type="button"
            onMouseEnter={handleEnter}
            onMouseLeave={scheduleClose}
            onClick={(e) => e.stopPropagation()}
            className="text-body text-text-primary"
          >
            , +{rest.length} more
          </button>
          {open && createPortal(
            <div
              style={{ position: 'fixed', top: pos.top, left: pos.left, zIndex: 99999 }}
              className="min-w-[200px] rounded-sm border border-border bg-surface py-xs shadow-dropdown"
              onMouseEnter={clearCloseTimer}
              onMouseLeave={scheduleClose}
            >
              {rest.map((label, i) => (
                <div key={`${label}-${i}`} className="px-md py-sm text-body text-text-primary">
                  {label}
                </div>
              ))}
            </div>,
            document.body,
          )}
        </>
      )}
    </span>
  )
}
