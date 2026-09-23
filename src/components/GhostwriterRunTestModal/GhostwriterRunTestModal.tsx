import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Icon } from '../Icon/Icon'
import { ReviewCardBody } from '../ReviewCard/ReviewCard'
import { Tabs } from '../Tabs/Tabs'
import type { GhostwriterRunTestModalProps } from './GhostwriterRunTestModal.types'

const RUN_TEST_FILTERS = ['Time period', 'Review source', 'Ratings', 'Review content']

const RUN_TEST_TABS = [
  { id: 'reviews', label: 'Reviews' },
  { id: 'upload', label: 'Upload' },
]

const UPLOADED_FILE_NAME = 'reviews.xlsx'

function RunTestCheckmark({ checked }: { checked: boolean }) {
  return (
    <span
      aria-hidden
      className={`mt-xs flex size-[18px] shrink-0 items-center justify-center rounded-[2px] border transition-colors ${
        checked ? 'border-primary bg-primary' : 'border-control-border bg-surface'
      }`}
    >
      {checked && <Icon name="check" size={14} weight={500} className="text-white" />}
    </span>
  )
}

/** 23 Sep's Upload tab — dashed drop-zone empty state until the (dummy) upload completes, then
 *  a plain file row standing in for the parsed spreadsheet. `reviewCount` mirrors the Reviews
 *  tab's own list so both paths report the same size test case. */
function UploadTabBody({
  uploaded,
  reviewCount,
  onUpload,
  onRemove,
}: {
  uploaded: boolean
  reviewCount: number
  onUpload: () => void
  onRemove: () => void
}) {
  if (!uploaded) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-sm rounded-md border border-dashed border-border-strong px-lg py-3xl text-center">
        <Icon name="arrow_upward" size={28} className="text-text-icon" />
        <button
          type="button"
          onClick={onUpload}
          className="text-body text-text-action hover:underline"
        >
          Upload spreadsheet
        </button>
        <p className="m-0 text-body text-text-secondary">Drag and drop to upload your reviews</p>
        <p className="m-0 text-small text-text-tertiary">All .xlsx and .xls file types are supported</p>
      </div>
    )
  }

  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="flex w-full max-w-[360px] items-center gap-md rounded-md border border-border bg-surface p-md">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-sm bg-surface-selected text-text-action">
          <Icon name="table_chart" size={20} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="m-0 truncate text-body text-text-primary">{UPLOADED_FILE_NAME}</p>
          <p className="m-0 text-small text-text-tertiary">
            {reviewCount} review{reviewCount === 1 ? '' : 's'}
          </p>
        </div>
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove file"
          className="flex size-7 shrink-0 items-center justify-center rounded-sm text-text-icon hover:bg-surface-hover"
        >
          <Icon name="close" size={16} />
        </button>
      </div>
    </div>
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
  showUploadTab = false,
}: GhostwriterRunTestModalProps) {
  const [activeTab, setActiveTab] = useState<'reviews' | 'upload'>('reviews')
  const [uploaded, setUploaded] = useState(false)

  useEffect(() => {
    if (!open) {
      setActiveTab('reviews')
      setUploaded(false)
    }
  }, [open])

  if (!open) return null

  const canRunTest = activeTab === 'reviews' ? selectedIds.length > 0 : uploaded

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
              Add test case
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

        {showUploadTab && (
          <div className="shrink-0 px-2xl">
            <Tabs tabs={RUN_TEST_TABS} activeTab={activeTab} onChange={(id) => setActiveTab(id as 'reviews' | 'upload')} />
          </div>
        )}

        {activeTab === 'reviews' ? (
          <div className="flex min-h-0 flex-1 gap-lg overflow-hidden px-2xl pb-lg pt-lg">
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
        ) : (
          <div className="flex min-h-0 flex-1 px-2xl pb-lg pt-lg">
            <UploadTabBody
              uploaded={uploaded}
              reviewCount={reviews.length}
              onUpload={() => setUploaded(true)}
              onRemove={() => setUploaded(false)}
            />
          </div>
        )}

        <div className="flex shrink-0 items-center justify-between border-t border-border px-2xl py-md">
          <p className="m-0 text-body text-text-secondary">
            {activeTab === 'reviews' ? `${selectedIds.length} reviews selected` : uploaded ? '1 file selected' : '0 files selected'}
          </p>
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
              disabled={!canRunTest}
              onClick={() => onRunTest(activeTab)}
              className={`flex h-9 items-center rounded-sm px-lg text-body transition-colors ${
                !canRunTest
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
