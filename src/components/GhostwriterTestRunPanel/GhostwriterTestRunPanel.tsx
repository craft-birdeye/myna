import { useState } from 'react'
import { Icon } from '../Icon/Icon'
import { Chip } from '../Chip/Chip'
import { ReviewCardBody, StarRating } from '../ReviewCard/ReviewCard'
import { TestRunStepRow } from '../TestRunPanel/TestRunPanel'
import { Tabs } from '../Tabs/Tabs'
import type { Tab } from '../Tabs/Tabs.types'
import { useTestRun } from '../../hooks/useTestRun'
import { buildTestRunSteps } from '../../data/testRunSteps'
import { REVIEW_RESPONSE_WORKFLOW } from '../../data/agentWorkflows'
import type { Review } from '../../data/reviewsData'
import type { GhostwriterTestRunPanelProps } from './GhostwriterTestRunPanel.types'

const TEST_RESULT_TABS: Tab[] = [
  { id: 'details', label: 'Details' },
  { id: 'preview', label: 'Preview' },
]

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

/** Left panel header, shared by the empty and filled states — the panel is titled "Test
 *  cases" regardless of whether any have been run yet. The "+ Add test case" button is only
 *  shown once there's already a list to add to; the empty state has its own centered CTA. */
function TestCasesPanelHeader({
  onAddTestCase,
  showAddButton = true,
}: {
  onAddTestCase?: () => void
  showAddButton?: boolean
}) {
  return (
    <div className="flex items-center justify-between px-sm py-xs">
      <p className="m-0 text-body text-text-primary">Test cases</p>
      {showAddButton && (
        <button
          type="button"
          onClick={onAddTestCase}
          className="flex items-center gap-xs rounded-sm px-sm py-xs text-body text-text-action transition-colors hover:bg-surface-hover"
        >
          <Icon name="add" size={16} />
          Add test case
        </button>
      )}
    </div>
  )
}

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
  const [resultTab, setResultTab] = useState<'details' | 'preview'>('details')

  return (
    <>
      <div className="absolute inset-0">{centerContent({ activeNodeId, doneNodeIds })}</div>
      <div className={`${FLOATING_PANEL_CLASS} right-lg w-[420px] p-lg`}>
        <div className="flex flex-col gap-md">
          <div className="flex items-center justify-between">
            <p className="m-0 text-body text-text-primary">Test</p>
            <Chip label="Passed" variant="success" />
          </div>
          <Tabs
            tabs={TEST_RESULT_TABS}
            activeTab={resultTab}
            onChange={(id) => setResultTab(id as 'details' | 'preview')}
            showBaseline={false}
          />
          {resultTab === 'details' ? (
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
          ) : (
            <div className="rounded-md border border-border p-lg">
              <ReviewCardBody review={review} />
            </div>
          )}
        </div>
      </div>
    </>
  )
}

/** Create agent CTA (Jay & Robin only) — the Test tab, both before and after "Run test" is
 *  confirmed in `GhostwriterRunTestModal`. Same floating-panel language as the Workflow tab
 *  throughout: the canvas (mounted by the caller via `centerContent`) fills the whole area
 *  full-bleed, with the reviews list and the result detail floating over it on the left/right
 *  — not flex columns dividing the width, and not swapped out for a different screen while
 *  empty. Before a run, the floating panels just show their own empty state (CTA on the left)
 *  while the canvas keeps rendering normally underneath. Every picked review already has a
 *  simulated reply in `data/reviewsData.ts`, so each one reads as a passing run. */
export function GhostwriterTestRunPanel({
  batches,
  centerContent,
  onRunTest,
  className = '',
}: GhostwriterTestRunPanelProps) {
  const allReviews = batches.flatMap((batch) => batch.reviews)
  const lastBatch = batches[batches.length - 1]
  const [selectedId, setSelectedId] = useState(lastBatch?.reviews[0]?.id ?? null)
  const selected = allReviews.find((r) => r.id === selectedId) ?? lastBatch?.reviews[0] ?? null

  if (!selected) {
    return (
      <div className={`relative h-full min-h-0 w-full overflow-hidden ${className}`}>
        <div className="absolute inset-0">{centerContent({ activeNodeId: null, doneNodeIds: [] })}</div>
        <div className={`${FLOATING_PANEL_CLASS} left-lg flex w-[320px] flex-col p-md`}>
          <TestCasesPanelHeader showAddButton={false} />
          <div className="flex flex-1 flex-col items-center justify-center gap-md px-lg text-center">
            <span className="flex size-10 items-center justify-center rounded-full bg-surface-selected text-text-tertiary">
              <Icon name="science" size={20} />
            </span>
            <p className="m-0 text-body text-text-secondary">
              Select a variety of reviews in your test case for best results.
            </p>
            <button
              type="button"
              onClick={onRunTest}
              className="flex h-9 items-center rounded-sm bg-primary px-lg text-body text-white transition-colors hover:bg-primary-hover"
            >
              Add test case
            </button>
          </div>
        </div>
        <div className={`${FLOATING_PANEL_CLASS} right-lg flex w-[420px] flex-col p-lg`}>
          <p className="m-0 text-body text-text-primary">Test</p>
          <div className="flex flex-1 items-center justify-center text-center">
            <p className="m-0 text-body text-text-tertiary">Add a test case to see the result here.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative h-full min-h-0 w-full overflow-hidden ${className}`}>
      <div className={`${FLOATING_PANEL_CLASS} left-lg flex w-[320px] flex-col p-md`}>
        <TestCasesPanelHeader onAddTestCase={onRunTest} />
        <div className="flex flex-col">
          {[...batches].reverse().map((batch, batchIndex) => (
            // Each "Run test" confirmation stays its own group — its own count + timestamp,
            // not merged into one running total — with breathing room from the group above.
            // Newest batch first: reversed for display only, so the underlying array (and the
            // default "most recent" selection below, which reads the un-reversed batches) still
            // reflects run order.
            <div key={batchIndex} className={`flex flex-col gap-2xs ${batchIndex > 0 ? 'mt-lg' : ''}`}>
              <div className="flex items-center justify-between px-sm py-xs">
                <p className="m-0 text-small text-text-secondary">
                  {batch.reviews.length} review{batch.reviews.length === 1 ? '' : 's'} tested
                </p>
                <p className="m-0 text-small text-text-secondary">{batch.testedAt}</p>
              </div>
              {batch.reviews.map((review) => {
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
          ))}
        </div>
      </div>

      <ReviewWorkflowRun key={selected.id} review={selected} centerContent={centerContent} />
    </div>
  )
}
