import type { ReactNode } from 'react'

export interface FrontdeskTestSessionsPanelProps {
  /** The workflow canvas — mounted once, full-bleed behind the floating LHS/RHS panels. */
  centerContent: ReactNode
  className?: string
}
