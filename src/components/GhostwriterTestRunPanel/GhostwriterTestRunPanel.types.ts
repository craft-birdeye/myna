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
  /** 23 Sep only — who ran this batch (e.g. the signed-in user). Left unset by Jay & Robin, so
   *  the summary card that reads it stays 23-Sep-only too. */
  testedBy?: string
}

/** 23 Sep only — a Test suite condition row (Test suite section). `field` + `operator`
 *  together pick which value control shows, if any: rating's "equals to"/"not equals to"/
 *  "is greater than"/"is less than" use `ratingValue`, date's "between" uses `dateRange`,
 *  date's "before"/"after"/"is" use `dateValue`, source's "in" uses `sourceValues`. */
export interface TestSuiteCondition {
  id: string
  field: 'rating' | 'date' | 'source'
  operator: string
  ratingValue?: string
  dateRange?: string
  dateValue?: string
  sourceValues?: string[]
}

/** 23 Sep only — a saved Test suite: a name plus the conditions that define it. */
export interface TestSuite {
  id: string
  name: string
  conditions: TestSuiteCondition[]
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
  /** 23 Sep only — saved Test suites shown in the Test suite section, and the callback to
   *  persist a newly created one (lifted to the caller so it survives a trip to another tab
   *  and back, same as `batches`). Jay & Robin has no Test suite section, so both are optional. */
  testSuites?: TestSuite[]
  onSaveTestSuite?: (suite: TestSuite) => void
}
