import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { MoreLabelsCellProps } from './MoreLabelsCell.types'

/** "Label, Label, +N more" — hovering "+N more" reveals the remaining labels in a popover.
    Portaled to <body> with fixed positioning since table cells truncate/clip overflow.
    Shared by Booking templates list columns and the template editor field-options summary. */
export function MoreLabelsCell({
  labels,
  emptyLabel = '—',
  maxVisible = 1,
  className = 'text-body text-text-primary',
}: MoreLabelsCellProps) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const btnRef = useRef<HTMLButtonElement>(null)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
  }, [])

  if (labels.length === 0) {
    return <span className={className}>{emptyLabel}</span>
  }

  const visible = labels.slice(0, Math.max(1, maxVisible))
  const rest = labels.slice(visible.length)

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
    <span className={`flex min-w-0 items-center gap-xs whitespace-nowrap ${className}`} onClick={(e) => e.stopPropagation()}>
      <span className="min-w-0 truncate">{visible.join(', ')}</span>
      {rest.length > 0 && (
        <>
          <button
            ref={btnRef}
            type="button"
            onMouseEnter={handleEnter}
            onMouseLeave={scheduleClose}
            onClick={(e) => e.stopPropagation()}
            className="shrink-0 text-inherit"
          >
            , +{rest.length} more
          </button>
          {open && createPortal(
            <div
              style={{ position: 'fixed', top: pos.top, left: pos.left, zIndex: 99999 }}
              className="max-h-[280px] min-w-[200px] overflow-y-auto rounded-sm border border-border bg-surface py-xs shadow-dropdown"
              onMouseEnter={clearCloseTimer}
              onMouseLeave={scheduleClose}
            >
              {labels.map((label, i) => (
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
