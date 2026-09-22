import { useState } from 'react'
import { Icon } from '../Icon/Icon'
import { Chip } from '../Chip/Chip'
import { ReviewCardBody, StarRating } from '../ReviewCard/ReviewCard'
import { TestRunStepRow } from '../TestRunPanel/TestRunPanel'
import { useTestRun } from '../../hooks/useTestRun'
import { buildTestRunSteps } from '../../data/testRunSteps'
import { REVIEW_RESPONSE_WORKFLOW } from '../../data/agentWorkflows'
import type { Review } from '../../data/reviewsData'
import type { GhostwriterTestRunPanelProps } from './GhostwriterTestRunPanel.types'

/** Same shell the canvas's own floating LHS ("Edit with AI") and RHS (node config / Test
 *  details) panels use: inset from the edges, rounded, elevated — not a flush column. */
const FLOATING_PANEL_CLASS =
  'absolute top-lg bottom-lg z-10 overflow-y-auto scrollbar-subtle rounded-2xl border border-border bg-surface shadow-[0_2px_12px_1px_rgba(13,13,18,0.08)]'

/** Same steps the canvas's own "Run test" walks — built once from the static workflow data
 *  (title-identical to what the canvas cards show; the copy patching `WorkflowEditorScreen`
 *  does elsewhere only rewrites descriptions/goals, not the titles this reads). */
const JAY_ROBIN_TEST_RUN_STEPS = buildTestRunSteps(
  REVIEW_RESPONSE_WORKFLOW.nodes,
  REVIEW_RESPONSE_WORKFLOW.nodeDetails,
)

/** Owns the one `useTestRun` call shared by the center canvas (highlighted nodes) and the
 *  floating right panel's step list, so they stay in lockstep — mounted fresh (via
 *  `key={review.id}` at the call site) every time the selected review changes, restarting the
 *  run instead of freezing on whichever review finished first. */
function ReviewWorkflowRun({
  review,
  centerContent,
}: {
  review: Review
  centerContent: GhostwriterTestRunPanelProps['centerContent']
}) {
  const { activeNodeId, doneNodeIds, status, stepStatuses } = useTestRun(JAY_ROBIN_TEST_RUN_STEPS)

  return (
    <>
      <div className="absolute inset-0">{centerContent({ activeNodeId, doneNodeIds })}</div>
      <div className={`${FLOATING_PANEL_CLASS} right-lg w-[420px] p-lg`}>
        <div className="flex flex-col gap-md">
          <div className="flex items-center justify-between">
            <p className="m-0 text-body text-text-primary">Test result</p>
            <Chip label="Passed" variant="success" />
          </div>
          <div className="rounded-md border border-border p-lg">
            {JAY_ROBIN_TEST_RUN_STEPS.map((step, i) => (
              <TestRunStepRow
                key={step.id}
                step={step}
                status={stepStatuses[i] ?? 'pending'}
                isLast={i === JAY_ROBIN_TEST_RUN_STEPS.length - 1 && status !== 'complete'}
              />
            ))}
            {status === 'complete' && (
              <div className="flex items-center gap-md">
                <Icon name="check_circle" size={20} fill className="shrink-0 text-accent-positive" />
                <span className="text-small text-text-tertiary">Completed</span>
              </div>
            )}
          </div>
          <div className="rounded-md border border-border p-lg">
            <ReviewCardBody review={review} />
          </div>
        </div>
      </div>
    </>
  )
}

/** Create agent CTA (Jay & Robin only) — the Test tab's result view once "Run test" has been
 *  confirmed in `GhostwriterRunTestModal`. Same floating-panel language as the Workflow tab:
 *  the canvas (mounted by the caller via `centerContent`, fed the same node states the step
 *  list uses so its nodes highlight/checkmark in lockstep) fills the whole area full-bleed,
 *  with the reviews list and the result detail floating over it on the left/right — not flex
 *  columns dividing the width. Every picked review already has a simulated reply in
 *  `data/reviewsData.ts`, so each one reads as a passing run. */
export function GhostwriterTestRunPanel({
  reviews,
  centerContent,
  testedAt,
  className = '',
}: GhostwriterTestRunPanelProps) {
  const [selectedId, setSelectedId] = useState(reviews[0]?.id ?? null)
  const selected = reviews.find((r) => r.id === selectedId) ?? reviews[0] ?? null

  return (
    <div className={`relative h-full min-h-0 w-full overflow-hidden ${className}`}>
      <div className={`${FLOATING_PANEL_CLASS} left-lg flex w-[320px] flex-col gap-2xs p-md`}>
        <div className="px-sm py-xs">
          <p className="m-0 text-small text-text-tertiary">{reviews.length} reviews tested</p>
          {testedAt && <p className="m-0 mt-2xs text-small text-text-tertiary">{testedAt}</p>}
        </div>
        {reviews.map((review) => {
          const active = review.id === selectedId
          return (
            <button
              key={review.id}
              type="button"
              onClick={() => setSelectedId(review.id)}
              className={`flex items-start gap-sm rounded-sm px-sm py-sm text-left transition-colors ${
                active ? 'bg-surface-selected' : 'hover:bg-surface-hover'
              }`}
            >
              <Icon name="check_circle" size={18} className="mt-[2px] shrink-0 text-accent-positive" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-sm">
                  <span className="min-w-0 truncate text-body text-text-primary">{review.reviewerName}</span>
                  <StarRating rating={review.rating} size={14} />
                </div>
                <p className="m-0 mt-2xs line-clamp-2 text-small text-text-tertiary">{review.text}</p>
              </div>
            </button>
          )
        })}
      </div>

      {selected ? (
        <ReviewWorkflowRun key={selected.id} review={selected} centerContent={centerContent} />
      ) : (
        <>
          <div className="absolute inset-0">{centerContent({ activeNodeId: null, doneNodeIds: [] })}</div>
          <div className={`${FLOATING_PANEL_CLASS} right-lg w-[420px] p-lg`}>
            <p className="m-0 text-body text-text-tertiary">No reviews selected.</p>
          </div>
        </>
      )}
    </div>
  )
}
