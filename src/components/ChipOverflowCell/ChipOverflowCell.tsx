import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { ChipOverflowCellProps } from './ChipOverflowCell.types'

/** Pill-visual chips (copies `Chip`'s neutral styling) with a "+N more" overflow trigger that
 *  reveals the rest in a portaled popover (copies `MoreLabelsCell`'s fixed-positioning code, since
 *  table cells clip overflow) — used by the Fanout queries table's "Fanout queries" column. */
export function ChipOverflowCell({ labels, emptyLabel = '—', maxVisible = 2 }: ChipOverflowCellProps) {
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
    <span className="flex min-w-0 items-center gap-xs whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
      {visible.map((label, i) => (
        <span
          key={`${label}-${i}`}
          className="inline-flex shrink-0 items-center gap-xs whitespace-nowrap rounded-sm bg-chip-neutral-bg px-sm py-xs text-small text-chip-neutral-text"
        >
          {label}
        </span>
      ))}
      {rest.length > 0 && (
        <>
          <button
            ref={btnRef}
            type="button"
            onMouseEnter={handleEnter}
            onMouseLeave={scheduleClose}
            onClick={(e) => e.stopPropagation()}
            className="shrink-0 text-small text-text-secondary"
          >
            +{rest.length} more
          </button>
          {open && createPortal(
            <div
              style={{ position: 'fixed', top: pos.top, left: pos.left, zIndex: 99999 }}
              className="flex max-h-[280px] min-w-[220px] max-w-[320px] flex-wrap gap-xs overflow-y-auto rounded-sm border border-border bg-surface p-sm shadow-dropdown"
              onMouseEnter={clearCloseTimer}
              onMouseLeave={scheduleClose}
            >
              {labels.map((label, i) => (
                <span
                  key={`${label}-${i}`}
                  className="inline-flex shrink-0 items-center gap-xs whitespace-nowrap rounded-sm bg-chip-neutral-bg px-sm py-xs text-small text-chip-neutral-text"
                >
                  {label}
                </span>
              ))}
            </div>,
            document.body,
          )}
        </>
      )}
    </span>
  )
}
