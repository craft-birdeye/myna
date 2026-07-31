import type { ReactNode } from 'react'

/** Color the left bar (and its faint background wash) takes on — pick to match what the block
 *  represents: e.g. neutral for a plain observation, danger for something that needs action,
 *  success/info for a result like a passed test. */
export type BlockVariant = 'neutral' | 'danger' | 'warning' | 'success' | 'info'

export interface BlockProps {
  /** Small caption above the bar (e.g. "Issue", "Action needed", "Revised agent response"). */
  heading?: string
  /** Trailing muted text next to the heading (e.g. "18.4s", "+3 additions, 1 change"). */
  meta?: string
  variant?: BlockVariant
  /** When true, the heading becomes a clickable toggle and `children` only renders while expanded. */
  collapsible?: boolean
  /** Initial expanded state. Ignored (always expanded) when `collapsible` is false. */
  defaultExpanded?: boolean
  /** Omits the left color bar — e.g. when the body already reads as its own contained unit (a
   *  bordered transcript snapshot) and the bar would just run alongside empty space. */
  hideBar?: boolean
  children?: ReactNode
  className?: string
}
