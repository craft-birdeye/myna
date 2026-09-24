import { useState } from 'react'
import { Icon } from '../Icon/Icon'
import { Chip } from '../Chip/Chip'
import { Tabs } from '../Tabs/Tabs'
import type { Tab } from '../Tabs/Tabs.types'
import { DEFAULT_EVALUATIONS, QUALITY_EVALUATIONS } from '../FrontdeskTestRunEditor/FrontdeskTestRunEditor'
import { SessionDetail } from '../FrontdeskTestSessionsPanel/FrontdeskTestSessionsPanel'
import type { FrontdeskTestSession } from '../../data/frontdeskTestSessions'
import type { FrontdeskTestRunReportProps } from './FrontdeskTestRunReport.types'

const REPORT_TABS: Tab[] = [
  { id: 'details', label: 'Details' },
  { id: 'recommendations', label: 'Recommendations' },
]

/** Deterministic per-session, per-metric mock score — same (sessionId, metricId) pair always
 *  reads the same, so the page doesn't reshuffle numbers on every render/reopen. There is no
 *  real evaluation engine behind this prototype — mirrors `GhostwriterTestRunReport`'s own
 *  `scoreSeed`/`metricScore`. */
function scoreSeed(seed: string) {
  let hash = 0
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0
  return hash
}

function metricScore(sessionId: string, metricId: string) {
  const seed = scoreSeed(`${sessionId}:${metricId}`)
  return metricId === 'latency' ? 300 + (seed % 900) : 78 + (seed % 22)
}

function formatScore(metricId: string, value: number) {
  return metricId === 'latency' ? `${value}ms` : `${value}%`
}

/** No rating-style dimension exists for a call/chat session the way review star-ratings drive
 *  `GhostwriterTestRunReport`'s severity split, so a failed session gets exactly one
 *  reviewer-agnostic fix suggestion instead of a severity-grouped set. */
function getSessionRecommendationText(session: FrontdeskTestSession) {
  return session.channel === 'voice'
    ? `The call "${session.title}" didn't reach a resolution — check whether the procedure it followed handles this scenario, or whether it should have escalated to a human instead.`
    : `The web chat "${session.title}" didn't reach a resolution — check whether the procedure it followed handles this scenario, or whether it should have escalated to a human instead.`
}

/** Front desk (Sep 23) Test tab — one page deeper than the test-run list, opened by clicking a
 *  completed run (a batch with `runName`, i.e. one that came from `FrontdeskTestRunEditor`).
 *  Mirrors `GhostwriterTestRunReport` exactly, but in the context of calls/web chats instead of
 *  reviews: read-only header (name, tester, timestamp, session count), one stat tile per metric
 *  the run was created with, then Details (a per-session score table — clicking a row reopens
 *  the same `SessionDetail` recording/transcript view used elsewhere in this Test tab) and
 *  Recommendations (one card per failed session) tabs. */
export function FrontdeskTestRunReport({ batch, onBack, onAcceptRecommendation }: FrontdeskTestRunReportProps) {
  const [resultTab, setResultTab] = useState<'details' | 'recommendations'>('details')
  const [detailSession, setDetailSession] = useState<FrontdeskTestSession | null>(null)
  const metrics = [
    ...DEFAULT_EVALUATIONS,
    ...QUALITY_EVALUATIONS.filter((metric) => batch.qualityEvaluationIds?.includes(metric.id)),
  ]
  const total = batch.sessions.length
  const subtitle = [
    batch.runName ? `Run by ${batch.testedBy}` : null,
    batch.suiteName ? `Test suite: ${batch.suiteName}` : null,
    `${total.toLocaleString()} session${total === 1 ? '' : 's'} tested`,
    batch.testedAt,
  ]
    .filter(Boolean)
    .join(' · ')
  const failedSessions = batch.sessions.filter((session) => session.outcome === 'failed')

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
          const values = batch.sessions.map((session) => metricScore(session.id, metric.id))
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
                <th className="border-b border-border px-md py-sm text-small text-text-secondary">Session</th>
                <th className="border-b border-l border-border px-md py-sm text-small text-text-secondary">Status</th>
                {metrics.map((metric) => (
                  <th key={metric.id} className="border-b border-l border-border px-md py-sm text-small text-text-secondary">
                    {metric.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {batch.sessions.map((session) => (
                <tr
                  key={session.id}
                  onClick={() => setDetailSession(session)}
                  className="cursor-pointer border-b border-border last:border-0 hover:bg-surface-hover"
                >
                  <td className="max-w-[360px] px-md py-md align-top">
                    <p className="m-0 text-body text-text-primary">{session.title}</p>
                    <p className="m-0 mt-2xs text-small text-text-tertiary">
                      {session.channel === 'voice' ? 'Voice call' : 'Web chat'}
                    </p>
                  </td>
                  <td className="border-l border-border px-md py-md align-top">
                    <div className="flex items-center gap-sm">
                      <Icon
                        name={session.outcome === 'passed' ? 'check_circle' : 'cancel'}
                        size={16}
                        className={session.outcome === 'passed' ? 'text-accent-positive' : 'text-chip-danger-text'}
                      />
                      <p className="m-0 text-body text-text-primary">
                        {session.outcome === 'passed' ? 'Passed' : 'Failed'}
                      </p>
                    </div>
                  </td>
                  {metrics.map((metric) => (
                    <td key={metric.id} className="border-l border-border px-md py-md align-top text-body text-text-primary">
                      {formatScore(metric.id, metricScore(session.id, metric.id))}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : failedSessions.length > 0 ? (
        <div className="flex flex-col gap-md">
          {failedSessions.map((session) => (
            <div key={session.id} className="flex flex-col gap-md rounded-md border border-border p-lg">
              <div className="flex items-center justify-between">
                <Chip label="Failed" variant="danger" />
                <p className="m-0 text-small text-text-secondary">{session.title}</p>
              </div>
              <p className="m-0 text-body text-text-primary">{getSessionRecommendationText(session)}</p>
              <button
                type="button"
                onClick={() => onAcceptRecommendation?.(getSessionRecommendationText(session))}
                className="flex h-9 w-fit items-center rounded-sm bg-primary px-lg text-body text-white transition-colors hover:bg-primary-hover"
              >
                Accept
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="m-0 text-body text-text-tertiary">No recommendations — every session in this run passed.</p>
      )}

      {detailSession && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center" aria-hidden={!detailSession}>
          <div onClick={() => setDetailSession(null)} className="absolute inset-0 bg-black/20" />
          <div
            role="dialog"
            aria-modal="true"
            className="relative flex h-[calc(100vh-130px)] w-full max-w-[560px] flex-col overflow-hidden rounded-md bg-surface shadow-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="scrollbar-subtle flex-1 overflow-y-auto p-2xl">
              <SessionDetail session={detailSession} onClose={() => setDetailSession(null)} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
