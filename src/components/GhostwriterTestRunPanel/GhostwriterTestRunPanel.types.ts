import type { ReactNode } from 'react'
import type { Review } from '../../data/reviewsData'

/** Node ids currently executing/finished — same shape `AgentBuilder`'s `externalTestRun`
 *  prop expects, so the canvas mount below can highlight in lockstep with the step list. */
export interface TestRunNodeState {
  activeNodeId: string | null
  doneNodeIds: string[]
}

export interface GhostwriterTestRunPanelProps {
  reviews: Review[]
  /** The workflow canvas — a render prop (not a plain node) so the caller can feed the same
   *  `TestRunNodeState` this component computes for its own step list into the canvas mount's
   *  `externalTestRun`, keeping node highlighting and the stepper in lockstep. */
  centerContent: (testRun: TestRunNodeState) => ReactNode
  /** Pre-formatted — e.g. "Sep 22, 2026, 3:45 PM". Shown next to "N reviews tested". */
  testedAt?: string
  className?: string
}
