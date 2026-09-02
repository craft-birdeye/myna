import type { ReactNode } from 'react'

export type TooltipVariant = 'brief' | 'detail'

/** Placement relative to the trigger. Defaults to `bottom` (Aero default). */
export type TooltipSide = 'bottom' | 'right' | 'top'

export interface TooltipProps {
  /** Tooltip copy. Keep `brief` to a short phrase; keep `detail` to ~2 lines. */
  content: ReactNode
  /** `brief` for a single word/short phrase, `detail` for explaining a feature. Defaults to `detail`. */
  variant?: TooltipVariant
  /** Where the bubble sits relative to the trigger. Defaults to `bottom`. */
  side?: TooltipSide
  /** Trigger the tooltip is anchored to (e.g. an info icon). */
  children: ReactNode
  className?: string
  /** Keep open while hovering the panel; enables clicks inside (e.g. links). */
  interactive?: boolean
  /** When true, hover never opens the bubble (e.g. ellipsized text that isn't truncated). */
  disabled?: boolean
  /** Anchor the bubble to the pointer instead of the trigger center. */
  followCursor?: boolean
  /** Gap from anchor point in px. Defaults to 8. */
  offset?: number
  /** Milliseconds to wait before opening on hover. Defaults to 0. */
  showDelay?: number
}
