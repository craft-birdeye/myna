import { createPortal } from 'react-dom'
import { Icon } from '../Icon/Icon'
import { ReviewCardBody } from '../ReviewCard/ReviewCard'
import type { GhostwriterRunTestModalProps } from './GhostwriterRunTestModal.types'

const RUN_TEST_FILTERS = ['Time period', 'Review source', 'Ratings', 'Review content']

function RunTestCheckmark({ checked }: { checked: boolean }) {
  return (
    <span
      aria-hidden
      className={`mt-xs flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
        checked ? 'border-primary bg-primary' : 'border-border-selected bg-surface'
      }`}
    >
      {checked && <Icon name="check" size={14} className="text-white" />}
    </span>
  )
}

/** Create agent CTA (Jay & Robin only) — the "Run test" picker opened from the Test tab's
 *  empty state. Multi-select over a handful of real reviews (reused from `data/reviewsData.ts`
 *  so the detail pane can show their existing simulated reply); the filter dropdowns on the
 *  right are visual only, matching the reference design. */
export function GhostwriterRunTestModal({
  open,
  reviews,
  selectedIds,
  onToggleReview,
  onCancel,
  onRunTest,
}: GhostwriterRunTestModalProps) {
  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-[110] flex items-center justify-center" aria-hidden={!open}>
      <div onClick={onCancel} className="absolute inset-0 bg-black/20" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="run-test-modal-title"
        className="relative flex h-[calc(100vh-130px)] w-full max-w-[1100px] flex-col overflow-hidden rounded-md bg-surface shadow-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-start justify-between px-2xl py-lg">
          <div>
            <h2 id="run-test-modal-title" className="m-0 text-h3 text-text-primary">
              Preview settings
            </h2>
            <p className="m-0 mt-xs text-body text-text-secondary">
              Choose reviews to test your agent. Use filters to narrow your results.
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Close"
            className="flex size-8 shrink-0 items-center justify-center rounded-sm text-text-icon hover:bg-surface-hover"
          >
            <Icon name="close" size={20} />
          </button>
        </div>

        <div className="flex min-h-0 flex-1 gap-lg overflow-hidden px-2xl pb-lg">
          <div className="scrollbar-subtle flex min-h-0 flex-1 flex-col gap-md overflow-y-auto pr-xs">
            {reviews.map((review) => {
              const checked = selectedIds.includes(review.id)
              return (
                <div
                  key={review.id}
                  role="checkbox"
                  aria-checked={checked}
                  tabIndex={0}
                  onClick={() => onToggleReview(review.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      onToggleReview(review.id)
                    }
                  }}
                  className={`flex cursor-pointer items-start gap-md rounded-md border p-lg transition-colors ${
                    checked ? 'border-primary' : 'border-border hover:bg-surface-hover'
                  }`}
                >
                  <RunTestCheckmark checked={checked} />
                  <div className="min-w-0 flex-1">
                    <ReviewCardBody review={review} />
                  </div>
                </div>
              )
            })}
          </div>
          <div className="w-[220px] shrink-0 border-l border-border pl-lg">
            <p className="m-0 mb-md text-body text-text-primary">Filter by</p>
            <div className="flex flex-col gap-sm">
              {RUN_TEST_FILTERS.map((label) => (
                <button
                  key={label}
                  type="button"
                  className="flex h-11 w-full items-center justify-between rounded-sm border border-border-selected bg-surface px-md text-body text-text-primary hover:bg-surface-l2"
                >
                  {label}
                  <Icon name="expand_more" size={18} className="text-text-icon" />
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-between border-t border-border px-2xl py-md">
          <p className="m-0 text-body text-text-secondary">{selectedIds.length} reviews selected</p>
          <div className="flex items-center gap-md">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-sm px-md py-xs text-body text-text-action hover:bg-surface-hover"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={selectedIds.length === 0}
              onClick={onRunTest}
              className={`flex h-9 items-center rounded-sm px-lg text-body transition-colors ${
                selectedIds.length === 0
                  ? 'cursor-not-allowed bg-surface-selected text-text-tertiary'
                  : 'bg-primary text-white hover:bg-primary-hover'
              }`}
            >
              Run test
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
