import type { ReactNode } from 'react'
import type { Review } from '../../data/reviewsData'

/** Node ids currently executing/finished — same shape `AgentBuilder`'s `externalTestRun`
 *  prop expects, so the canvas mount below can highlight in lockstep with the step list. */
export interface TestRunNodeState {
  activeNodeId: string | null
  doneNodeIds: string[]
}

/** One "Run test" confirmation — its own reviews and its own timestamp, kept separate from
 *  any earlier or later batch instead of being merged/replaced. */
export interface TestRunBatch {
  reviews: Review[]
  /** Pre-formatted — e.g. "Sep 22, 2026, 3:45 PM". */
  testedAt: string
}

export interface GhostwriterTestRunPanelProps {
  /** Empty before "Run test" has ever been confirmed — the floating LHS/RHS then show their
   *  own empty state (with the "Add test case" CTA on the left) instead of a review list/
   *  result, while the canvas underneath still renders normally. Each later confirmation adds
   *  its own batch rather than replacing the previous one. */
  batches: TestRunBatch[]
  /** The workflow canvas — a render prop (not a plain node) so the caller can feed the same
   *  `TestRunNodeState` this component computes for its own step list into the canvas mount's
   *  `externalTestRun`, keeping node highlighting and the stepper in lockstep. */
  centerContent: (testRun: TestRunNodeState) => ReactNode
  /** Empty-state / header CTA — opens the review picker. */
  onRunTest?: () => void
  className?: string
  /** 'floating' (default) — Jay & Robin: LHS/RHS are floating cards over the canvas, which
   *  `centerContent` mounts full-bleed underneath. 'fullpage' — 23 Sep: a plain full-page
   *  list+detail layout with no canvas at all; `centerContent` is never called. */
  layout?: 'floating' | 'fullpage'
}
