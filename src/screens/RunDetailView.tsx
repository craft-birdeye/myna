import React from 'react'
import { BackArrowIcon } from '../assets/BackArrowIcon'
import voicemailSample from '../assets/voicemail_sample.mp3'
import {
  Chip,
  getUserRatingForLogStatus,
  Icon,
  LogDetailsPanel,
  RunDetailsPanel,
  type RunLogStep,
} from '../components'
import type { HealthcareLogRow } from '../data/healthcareAgentLogs'
import {
  buildLogRunSteps,
  getExecutedNodeIds,
  resolveAgentWorkflowForLog,
  type WorkflowNodeSeed,
} from '../data/logRunSteps'
import { useProcedureStore } from '../data/ProcedureStoreContext'
// @ts-ignore
import AgentBuilderRaw from '../workflow/AgentBuilder/AgentBuilder'

const AgentBuilder = AgentBuilderRaw as unknown as React.ComponentType<Record<string, unknown>>
import '../workflow/Molecules/PreviewPanel/PreviewPanel.css'
import '../workflow/AgentBuilder/AgentBuilder.css'

interface RunDetailViewProps {
  row: HealthcareLogRow
  instanceName: string
  onBack: () => void
  onEditAgent?: () => void
  /** Called when a "Track your feedback" link is clicked in the Front-desk Logs Conversation tab —
   *  the host screen navigates to that recommendation's detail page. */
  onTrackFeedback?: (recommendationId: string) => void
  /** Sibling logs (same filtered set as the Logs table) for prev/next navigation. */
  runs?: HealthcareLogRow[]
  onSelectRun?: (row: HealthcareLogRow) => void
  /** Front desk exploration: show result badge on Call end reason. */
  explorationFrontDeskStatus?: boolean
}

function sameLogRow(a: HealthcareLogRow, b: HealthcareLogRow) {
  return (
    a.timestamp === b.timestamp
    && a.contact === b.contact
    && a.channel === b.channel
    && a.status === b.status
  )
}

function parseDurationSecs(duration: string): number {
  const mmss = duration.match(/^(\d+):(\d+)$/)
  if (mmss) return Number(mmss[1]) * 60 + Number(mmss[2])
  const secsOnly = Number(duration)
  return Number.isFinite(secsOnly) ? secsOnly : 332
}

function buildReviewResponseRunSteps(row: HealthcareLogRow): RunLogStep[] {
  const source = String(row.source ?? row.channel ?? 'Google')
  const trigger: RunLogStep = {
    id: 'rr-log-1',
    type: 'trigger',
    stepNumber: 1,
    title: 'When a new review is received or updated',
    output: [
      { key: 'Source', value: source },
      { key: 'Reviewer', value: row.contact },
      { key: 'Received at', value: row.timestamp },
    ],
    inputs: [
      { key: 'reviewEvent', value: 'created_or_updated' },
      { key: 'source', value: source },
    ],
  }

  if (row.status === 'In progress') {
    return [
      trigger,
      {
        id: 'rr-log-2',
        type: 'task',
        stepNumber: 2,
        title: 'Triage review',
        note: 'In progress — checking whether a response is required.',
      },
    ]
  }

  if (row.status === 'Aborted') {
    return [
      trigger,
      {
        id: 'rr-log-2',
        type: 'task',
        stepNumber: 2,
        title: 'Triage review',
        note: 'Aborted — run was stopped before a response could be generated.',
      },
    ]
  }

  if (row.status === 'Failed' || row.status === 'Not resolved') {
    return [
      trigger,
      {
        id: 'rr-log-2',
        type: 'task',
        stepNumber: 2,
        title: 'Triage review',
        output: [
          { key: 'Decision', value: 'No response required' },
          { key: 'Reason', value: 'Spam or content-policy violation' },
        ],
        inputs: [
          { key: 'Review.comment', value: String(row.comment ?? 'Unrelated promotional content') },
          { key: 'Review.source', value: source },
          { key: 'Review.rating', value: String(row.rating ?? 1) },
        ],
      },
      {
        id: 'rr-log-3',
        type: 'branch',
        stepNumber: 3,
        title: 'Fallback',
        outputLabel: 'Branch output',
        output: [{ key: 'Path', value: 'Send email alert' }],
        inputs: [{ key: 'Review.isSpam', value: 'true' }],
      },
      {
        id: 'rr-log-4',
        type: 'task',
        stepNumber: 4,
        title: 'Send email alert',
        output: [{ key: 'Status', value: 'Failed to send alert' }],
        tool: {
          name: 'Send email',
          properties: [
            { key: 'to', value: 'reviews@business.com' },
            { key: 'subject', value: 'Review flagged — no response' },
          ],
        },
        inputs: [
          { key: 'reviewer', value: row.contact },
          { key: 'source', value: source },
          { key: 'spamReason', value: 'Content-policy violation' },
        ],
      },
    ]
  }

  return [
    trigger,
    {
      id: 'rr-log-2',
      type: 'task',
      stepNumber: 2,
      title: 'Triage review',
      output: [
        { key: 'Decision', value: 'Response required' },
        { key: 'Review type', value: 'Genuine customer review' },
      ],
      inputs: [
        { key: 'Review.comment', value: String(row.comment ?? 'Wait was longer than expected…') },
        { key: 'Review.source', value: source },
        { key: 'Review.rating', value: String(row.rating ?? 3) },
      ],
    },
    {
      id: 'rr-log-3',
      type: 'branch',
      stepNumber: 3,
      title: 'Respond',
      outputLabel: 'Branch output',
      output: [{ key: 'Path', value: 'Respond' }],
      inputs: [{ key: 'Review.isSpam', value: 'false' }],
    },
    {
      id: 'rr-log-4',
      type: 'task',
      stepNumber: 4,
      title: 'Extract review details',
      output: [
        { key: 'Topics', value: 'Service quality, wait time' },
        { key: 'Sentiment', value: 'Mixed' },
        { key: 'Severity', value: 'Medium' },
      ],
      inputs: [
        { key: 'Review.comment', value: String(row.comment ?? 'Wait was longer than expected…') },
        { key: 'Review.rating', value: String(row.rating ?? 3) },
        { key: 'Review.source', value: source },
      ],
    },
    {
      id: 'rr-log-5',
      type: 'task',
      stepNumber: 5,
      title: 'Generate response',
      output: [
        {
          key: 'Draft reply',
          value: `Thank you for your feedback, ${row.contact.split(' ')[0]}. We're sorry to hear about your experience and would love the chance to make it right.`,
        },
      ],
      inputs: [
        { key: 'Topics', value: 'Service quality, wait time' },
        { key: 'Sentiment', value: 'Mixed' },
        { key: 'Brand.voice', value: 'Warm and professional' },
      ],
    },
    {
      id: 'rr-log-6',
      type: 'task',
      stepNumber: 6,
      title: 'Send response',
      output: [
        { key: 'Posted to', value: source },
        { key: 'Status', value: 'Published' },
      ],
      tool: {
        name: 'Review responder',
        properties: [
          { key: 'source', value: source },
          { key: 'reviewer', value: row.contact },
        ],
      },
      inputs: [
        { key: 'draftReply', value: 'Generated response text' },
        { key: 'source', value: source },
        { key: 'reviewer', value: row.contact },
      ],
    },
  ]
}

function buildReviewGenerationRunSteps(row: HealthcareLogRow): RunLogStep[] {
  const firstName = row.contact.split(' ')[0] || row.contact
  const trigger: RunLogStep = {
    id: 'rg-log-1',
    type: 'trigger',
    stepNumber: 1,
    title: 'When a transaction is completed',
    output: [
      { key: 'Customer', value: row.contact },
      { key: 'Location', value: 'North Region' },
      { key: 'Completed at', value: row.timestamp },
    ],
    inputs: [
      { key: 'transaction_status', value: 'completed' },
      { key: 'location', value: 'North Region' },
    ],
  }

  if (row.status === 'In progress') {
    return [
      trigger,
      {
        id: 'rg-log-2',
        type: 'task',
        stepNumber: 2,
        title: 'Send review request email',
        note: 'In progress — composing and sending the review request email.',
      },
    ]
  }

  if (row.status === 'Failed' || row.status === 'Not resolved') {
    return [
      trigger,
      {
        id: 'rg-log-2',
        type: 'task',
        stepNumber: 2,
        title: 'Send review request email',
        output: [{ key: 'Status', value: 'Failed to send email' }],
        tool: {
          name: 'Send email',
          properties: [
            { key: 'to', value: `${firstName.toLowerCase()}@email.com` },
            { key: 'subject', value: 'How was your visit?' },
          ],
        },
        inputs: [
          { key: 'customer', value: row.contact },
          { key: 'reviewLink', value: 'https://reviews.example.com/r/abc123' },
        ],
      },
      {
        id: 'rg-log-3',
        type: 'task',
        stepNumber: 3,
        title: 'Send review request text',
        output: [{ key: 'Status', value: 'Skipped — email failed' }],
        tool: {
          name: 'Send SMS',
          properties: [
            { key: 'to', value: '+1 (555) 010-2000' },
            { key: 'body', value: `Hi ${firstName}, thanks for visiting — leave us a review:` },
          ],
        },
        inputs: [
          { key: 'customer', value: row.contact },
          { key: 'reviewLink', value: 'https://reviews.example.com/r/abc123' },
        ],
      },
    ]
  }

  return [
    trigger,
    {
      id: 'rg-log-2',
      type: 'task',
      stepNumber: 2,
      title: 'Send review request email',
      output: [
        { key: 'Status', value: 'Sent' },
        { key: 'Delivered to', value: `${firstName.toLowerCase()}@email.com` },
      ],
      tool: {
        name: 'Send email',
        properties: [
          { key: 'to', value: `${firstName.toLowerCase()}@email.com` },
          { key: 'subject', value: 'How was your visit?' },
        ],
      },
      inputs: [
        { key: 'customer', value: row.contact },
        { key: 'reviewLink', value: 'https://reviews.example.com/r/abc123' },
        { key: 'location', value: 'North Region' },
      ],
    },
    {
      id: 'rg-log-3',
      type: 'task',
      stepNumber: 3,
      title: 'Send review request text',
      output: [
        { key: 'Status', value: 'Sent' },
        { key: 'Delivered to', value: '+1 (555) 010-2000' },
      ],
      tool: {
        name: 'Send SMS',
        properties: [
          { key: 'to', value: '+1 (555) 010-2000' },
          { key: 'body', value: `Hi ${firstName}, thanks for visiting — leave us a review:` },
        ],
      },
      inputs: [
        { key: 'customer', value: row.contact },
        { key: 'reviewLink', value: 'https://reviews.example.com/r/abc123' },
        { key: 'location', value: 'North Region' },
      ],
    },
  ]
}

/* ── run canvas — same AgentBuilder viewer as the Workflow tab, executed nodes in green ── */
function AgentWorkflowRunCanvas({
  instanceName,
  workflow,
  row,
  product,
  onEditWorkflow,
}: {
  instanceName: string
  workflow: { nodes: WorkflowNodeSeed[]; nodeDetails: Record<string, unknown> }
  row: HealthcareLogRow
  product?: string
  onEditWorkflow?: () => void
}) {
  const { procedures } = useProcedureStore()
  const filteredProcedures = procedures.filter((p) => p.category === 'Healthcare Frontdesk')
  const executedIds = getExecutedNodeIds(row, workflow.nodes, workflow.nodeDetails)

  // Executed-node styling — a plain 1px green border (no spread shadow ring).
  const executedCss = executedIds
    .map(
      (id) =>
        `.run-wf-viewer .react-flow__node[data-id="${id}"] .canvas-node { border: 1px solid #4caf50 !important; box-shadow: 0px 2px 12px 0px rgba(33, 33, 33, 0.06) !important; }`,
    )
    .join('\n')

  return (
    <div className="run-wf-bg absolute inset-0 overflow-hidden">
      <style>{`
        .run-wf-bg { background-color: #f2f4f7; }
        /* Canvas stays clear of the overlaid details panel — must match the 480px float wrap
           in PreviewPanel.css (this previously reserved 600px against a 550px wrap). */
        .run-wf-viewer { height: 100%; width: calc(100% - 480px); }
        .run-wf-viewer .agent-builder__lhs    { display: none !important; }
        .run-wf-viewer .faq-ab-header         { display: none !important; }
        .run-wf-viewer .faq-ab-embedded       { height: 100% !important; }
        .run-wf-viewer .agent-builder-wrapper { background: transparent !important; background-image: none !important; }
        .run-wf-viewer .agent-builder         { padding: 0 !important; gap: 0 !important; }
        /* Bottom-left zoom floater — same as Workflow tab. */
        .run-wf-viewer .flow-canvas__toolbar-anchor--rr-chrome {
          top: auto !important;
          bottom: 16px !important;
          left: 16px !important;
          right: 16px !important;
          display: flex !important;
          transform: none !important;
          z-index: 50;
        }
        .run-wf-viewer .graph-controls--rr-chrome { display: flex !important; }
        .run-wf-viewer .graph-controls__toggle { display: none !important; }
        .run-wf-viewer .flow-canvas__edge-add  { display: none !important; }
        /* Logs are a historical run — no Run test. */
        .run-wf-viewer .rr-chrome-run-test { display: none !important; }
        ${executedCss}
      `}</style>
      <div className="run-wf-viewer">
        <AgentBuilder
          key={instanceName}
          pageTitle={instanceName}
          appTitle={instanceName}
          viewOnly
          viewChromeActions
          product={product ?? 'healthcare'}
          moduleSlug="myna"
          moduleContext="myna"
          sectionContext="workflow"
          navItems={[]}
          initialNodes={workflow.nodes}
          initialNodeDetails={workflow.nodeDetails}
          procedures={filteredProcedures}
          defaultOpenSection="Tasks"
          initialZoom={0.85}
          onEdit={onEditWorkflow}
          nodesInteractive={false}
          logDoneNodeIds={executedIds}
        />
      </div>
    </div>
  )
}

/* ── main export ── */
export function RunDetailView({
  row,
  instanceName,
  onBack,
  onEditAgent,
  onTrackFeedback,
  runs = [],
  onSelectRun,
  explorationFrontDeskStatus = false,
}: RunDetailViewProps) {
  const agentName = instanceName.replace(/ - .+$/, '')
  const isReviewResponse = /review response agent/i.test(agentName)
  const isReviewGeneration = /review generation agent/i.test(agentName)
  const isReviewAgent = isReviewResponse || isReviewGeneration
  const isReminder = agentName === 'Reminder agent'
  const hasVoiceCall = row.channel.toLowerCase().includes('voice')
  const totalSecs = parseDurationSecs(row.duration)
  const agentWorkflow = resolveAgentWorkflowForLog(instanceName, agentName)
  const legacyLogSteps = isReviewResponse
    ? buildReviewResponseRunSteps(row)
    : isReviewGeneration
      ? buildReviewGenerationRunSteps(row)
      : undefined
  const logSteps = agentWorkflow
    ? buildLogRunSteps(row, agentWorkflow, { agentName, legacySteps: legacyLogSteps })
    : legacyLogSteps
  const statusVariant =
    row.status === 'Complete' || row.status === 'Resolved'
      ? 'success'
      : row.status === 'Failed' || row.status === 'Not resolved'
        ? 'danger'
        : 'warning'
  const useRunDetailsPanel = isReminder || isReviewAgent

  const runIndex = runs.findIndex((r) => sameLogRow(r, row))
  const hasRunNav = runs.length > 1 && runIndex >= 0 && !!onSelectRun
  const canGoPrev = hasRunNav && runIndex > 0
  const canGoNext = hasRunNav && runIndex < runs.length - 1

  return (
    <div className="log-detail-view relative flex h-full flex-col bg-surface">
      {/* Visual chrome for the AgentBuilder run canvas so every agent's log view looks identical. */}
      <style>{`
        .log-detail-view .flow-canvas,
        .log-detail-view .run-wf-bg,
        .log-detail-view .agent-builder-wrapper {
          background-color: #f2f4f7 !important;
          background-image: none !important;
        }
        /* Bottom-left zoom floater (AgentBuilder canvas path). */
        .log-detail-view .log-view-zoom-anchor {
          position: absolute;
          bottom: 16px;
          left: 16px;
          z-index: 50;
          pointer-events: none;
        }
        .log-detail-view .log-view-zoom-anchor .graph-controls--rr-chrome {
          width: auto;
          pointer-events: none;
        }
        .log-detail-view .log-view-zoom-anchor .graph-controls__rr-zoom {
          pointer-events: auto;
        }

        /* Node cards are a read-only record here — fully inert: no pointer, no hover
           affordances, no selection ring. Clicks are already a no-op via nodesInteractive. */
        .log-detail-view .canvas-node-wrap,
        .log-detail-view .canvas-node,
        .log-detail-view .react-flow__node { cursor: default !important; }
        .log-detail-view .canvas-node__hover-actions { display: none !important; }
        .log-detail-view .canvas-node--hover,
        .log-detail-view .canvas-node--selected { border-color: transparent !important; }
      `}</style>

      {/* Header — title + status chip with agent name subtitle; prev/next on the right */}
      <div className="flex shrink-0 items-start gap-sm border-b border-border px-2xl py-sm">
        <button
          type="button"
          aria-label="Back to logs"
          onClick={onBack}
          className="mt-xs flex size-7 shrink-0 items-center justify-center rounded-sm text-text-icon hover:bg-surface-hover"
        >
          <BackArrowIcon />
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-sm">
            <h1 className="min-w-0 truncate text-h3 text-text-primary">Log - {row.timestamp}</h1>
            <Chip label={row.status} variant={statusVariant} />
          </div>
          <p className="mt-xs text-small text-text-secondary">{instanceName}</p>
        </div>
        {hasRunNav && (
          <div className="mt-xs flex shrink-0 items-center gap-xs">
            <button
              type="button"
              aria-label="Previous log"
              disabled={!canGoPrev}
              onClick={() => {
                if (!canGoPrev) return
                onSelectRun?.(runs[runIndex - 1])
              }}
              className="flex size-9 items-center justify-center rounded-sm border border-border-selected bg-surface text-text-icon hover:bg-surface-l2 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Icon name="chevron_left" size={20} />
            </button>
            <button
              type="button"
              aria-label="Next log"
              disabled={!canGoNext}
              onClick={() => {
                if (!canGoNext) return
                onSelectRun?.(runs[runIndex + 1])
              }}
              className="flex size-9 items-center justify-center rounded-sm border border-border-selected bg-surface text-text-icon hover:bg-surface-l2 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Icon name="chevron_right" size={20} />
            </button>
          </div>
        )}
      </div>

      {/* Body — full-bleed canvas with overlaid details panel (matches trigger/task RHS) */}
      <div className="relative min-h-0 flex-1 overflow-hidden">
        {agentWorkflow ? (
          <AgentWorkflowRunCanvas
            instanceName={instanceName}
            workflow={agentWorkflow as { nodes: WorkflowNodeSeed[]; nodeDetails: Record<string, unknown> }}
            row={row}
            onEditWorkflow={onEditAgent}
          />
        ) : null}

        <div className="preview-panel-float-wrap preview-panel-float-wrap--log-details">
          {useRunDetailsPanel ? (
            <RunDetailsPanel
              steps={logSteps}
              showTabs={!isReviewAgent}
              title={isReviewAgent ? 'Log details' : undefined}
              showHeader={isReviewAgent}
              showCallRecording={isReminder && hasVoiceCall}
              audioUrl={isReminder ? voicemailSample : undefined}
              durationSecs={isReminder ? totalSecs : undefined}
              agentName={isReminder ? instanceName : undefined}
              onTrackFeedback={isReminder ? onTrackFeedback : undefined}
            />
          ) : (
            <LogDetailsPanel
              row={row}
              agentName={instanceName}
              steps={logSteps}
              onTrackFeedback={onTrackFeedback}
              callEndResultBadge={explorationFrontDeskStatus ? String(row.status) : undefined}
              userRating={
                explorationFrontDeskStatus ? getUserRatingForLogStatus(row.status) : undefined
              }
              showTranscriptTranslation={explorationFrontDeskStatus}
            />
          )}
        </div>
      </div>
    </div>
  )
}
