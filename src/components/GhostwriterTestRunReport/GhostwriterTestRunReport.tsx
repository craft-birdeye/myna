import { useState } from 'react'
import { StarRating } from '../ReviewCard/ReviewCard'
import { Icon } from '../Icon/Icon'
import { Tabs } from '../Tabs/Tabs'
import type { Tab } from '../Tabs/Tabs.types'
import { DEFAULT_EVALUATIONS, QUALITY_EVALUATIONS } from '../FrontdeskTestRunEditor/FrontdeskTestRunEditor'
import {
  RecommendationGroupCard,
  batchReviewCount,
  getBatchRecommendationGroups,
  reviewPassedInBatch,
  testRunSubtitle,
} from '../GhostwriterTestRunPanel/GhostwriterTestRunPanel'
import type { GhostwriterTestRunReportProps } from './GhostwriterTestRunReport.types'

const REPORT_TABS: Tab[] = [
  { id: 'details', label: 'Details' },
  { id: 'recommendations', label: 'Recommendations' },
]

/** Deterministic per-review, per-metric mock score — same (reviewId, metricId) pair always
 *  reads the same, so the page doesn't reshuffle numbers on every render/reopen. There is no
 *  real evaluation engine behind this prototype. */
function scoreSeed(seed: string) {
  let hash = 0
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0
  return hash
}

/** Latency is a duration, not a quality percentage — kept in its own real unit (ms) instead of
 *  forcing every metric into the same 0-100 scale. */
function metricScore(reviewId: string, metricId: string) {
  const seed = scoreSeed(`${reviewId}:${metricId}`)
  return metricId === 'latency' ? 300 + (seed % 900) : 78 + (seed % 22)
}

function formatScore(metricId: string, value: number) {
  return metricId === 'latency' ? `${value}ms` : `${value}%`
}

/** Response agent (23 Sep) Test tab — one page deeper than the test-run list, opened by
 *  clicking a completed run (a batch with `runName`, i.e. one that came from
 *  `GhostwriterTestRunEditor`). Read-only: a run's name, tester, timestamp, and evaluation
 *  results are fixed once it's been run — there is no edit path back into the editor from
 *  here. Below the header, one stat tile per metric the run was created with (the always-on
 *  defaults plus whichever response-quality ones were turned on), then Details (the per-review
 *  score table — clicking a row calls `onSelectReview`, which replaces this page with that
 *  review's finished run on the canvas) and Recommendations (the same theme-grouped fixes
 *  `TestBatchReviewsPanel` shows, reused here rather than re-derived) tabs. */
export function GhostwriterTestRunReport({ batch, onBack, onAcceptRecommendation, onSelectReview }: GhostwriterTestRunReportProps) {
  const [resultTab, setResultTab] = useState<'details' | 'recommendations'>('details')
  const metrics = [
    ...DEFAULT_EVALUATIONS,
    ...QUALITY_EVALUATIONS.filter((metric) => batch.qualityEvaluationIds?.includes(metric.id)),
  ]
  const subtitle = testRunSubtitle(batch, batchReviewCount(batch))
  const groups = getBatchRecommendationGroups(batch)

  return (
    <div className="flex flex-col gap-xl">
      <div className="flex items-center gap-sm">
        <button
          type="button"
          aria-label="Back"
          onClick={onBack}
          className="flex size-8 shrink-0 items-center justify-center rounded-sm text-text-icon hover:bg-surface-hover"
        >
          <Icon name="arrow_back" size={20} />
        </button>
        <div>
          <p className="m-0 text-h3 text-text-primary">{batch.runName}</p>
          <p className="m-0 mt-2xs text-small text-text-tertiary">{subtitle}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-md">
        {metrics.map((metric) => {
          const values = batch.reviews.map((review) => metricScore(review.id, metric.id))
          const average = values.length > 0 ? Math.round(values.reduce((sum, v) => sum + v, 0) / values.length) : 0
          return (
            <div key={metric.id} className="min-w-[160px] flex-1 rounded-md border border-border p-lg">
              <p className="m-0 text-h3 text-text-primary">{formatScore(metric.id, average)}</p>
              <p className="m-0 mt-2xs text-small text-text-secondary">{metric.label}</p>
            </div>
          )
        })}
      </div>

      <Tabs tabs={REPORT_TABS} activeTab={resultTab} onChange={(id) => setResultTab(id as 'details' | 'recommendations')} />

      {resultTab === 'details' ? (
        <div className="overflow-hidden rounded-sm border border-border">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-surface-l2">
                <th className="border-b border-border px-md py-sm text-small text-text-secondary">Review</th>
                <th className="border-b border-l border-border px-md py-sm text-small text-text-secondary">Status</th>
                {metrics.map((metric) => (
                  <th key={metric.id} className="border-b border-l border-border px-md py-sm text-small text-text-secondary">
                    {metric.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {batch.reviews.map((review) => (
                <tr
                  key={review.id}
                  onClick={() => onSelectReview(review)}
                  className="cursor-pointer border-b border-border last:border-0 hover:bg-surface-hover"
                >
                  <td className="max-w-[360px] px-md py-md align-top">
                    <p className="m-0 text-body text-text-primary">{review.reviewerName}</p>
                    <div className="mt-2xs">
                      <StarRating rating={review.rating} size={14} />
                    </div>
                    <p className="m-0 mt-2xs line-clamp-2 text-small text-text-tertiary">{review.text}</p>
                  </td>
                  <td className="border-l border-border px-md py-md align-top">
                    <Icon
                      name={reviewPassedInBatch(review, batch) ? 'check_circle' : 'cancel'}
                      size={16}
                      className={reviewPassedInBatch(review, batch) ? 'text-accent-positive' : 'text-chip-danger-text'}
                    />
                  </td>
                  {metrics.map((metric) => (
                    <td key={metric.id} className="border-l border-border px-md py-md align-top text-body text-text-primary">
                      {formatScore(metric.id, metricScore(review.id, metric.id))}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : groups.length > 0 ? (
        <div className="flex flex-col gap-md">
          {groups.map((group) => (
            <RecommendationGroupCard key={group.severity} group={group} onAccept={(text) => onAcceptRecommendation?.(text)} />
          ))}
        </div>
      ) : (
        <p className="m-0 text-body text-text-tertiary">No recommendations — every review in this run passed.</p>
      )}
    </div>
  )
}
