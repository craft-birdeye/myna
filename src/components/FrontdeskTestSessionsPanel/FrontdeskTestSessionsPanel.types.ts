import type { ReactNode } from 'react'

export interface FrontdeskTestSessionsPanelProps {
  /** The workflow canvas — mounted once, full-bleed behind the floating LHS/RHS panels.
   *  Ignored entirely when `layout="fullpage"` (no canvas in that mode). */
  centerContent: ReactNode
  className?: string
  /** 'floating' (default, Myna): LHS/RHS float over the canvas `centerContent` mounts.
   *  'fullpage' (Sep 23): a plain full-page Tests/Test suite/Test cycles layout, no canvas —
   *  same split review-response's `GhostwriterTestRunPanel` uses for Jay & Robin vs 23 Sep. */
  layout?: 'floating' | 'fullpage'
}
