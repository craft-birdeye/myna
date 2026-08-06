import type { ReactNode } from 'react'

export type TooltipVariant = 'brief' | 'detail'

export interface TooltipProps {
  /** Tooltip copy. Keep `brief` to a short phrase; keep `detail` to ~2 lines. */
  content: ReactNode
  /** `brief` for a single word/short phrase, `detail` for explaining a feature. Defaults to `detail`. */
  variant?: TooltipVariant
  /** Trigger the tooltip is anchored to (e.g. an info icon). */
  children: ReactNode
  className?: string
  /** Keep open while hovering the panel; enables clicks inside (e.g. links). */
  interactive?: boolean
}
