import React from 'react'
import { BackArrowIcon } from '../assets/BackArrowIcon'
import voicemailSample from '../assets/voicemail_sample.mp3'
import { Chip, LogDetailsPanel, RunDetailsPanel, type RunLogStep } from '../components'
import type { HealthcareLogRow, LogStepId } from '../data/healthcareAgentLogs'
import {
  HEALTHCARE_AGENT_WORKFLOWS,
  HEALTHCARE_REMINDER_NORTH_WORKFLOW,
} from '../data/agentWorkflows'
import { useProcedureStore } from '../data/ProcedureStoreContext'
// @ts-ignore
import AgentBuilderRaw from '../workflow/AgentBuilder/AgentBuilder'

const AgentBuilder = AgentBuilderRaw as unknown as React.ComponentType<Record<string, unknown>>
import StartNode from '../workflow/Molecules/Canvas/StartNode/StartNode'
import CanvasNode from '../workflow/Molecules/Canvas/CanvasNode/CanvasNode'
import ProceduresNode from '../workflow/Molecules/Canvas/ProceduresNode/ProceduresNode'
import EndNode from '../workflow/Molecules/Canvas/EndNode/EndNode'
import GraphControls from '../workflow/Modules/FlowCanvas/GraphControls/GraphControls'
import {
  FLOW_CONNECTOR_GAP,
  FLOW_START_GAP,
} from '../workflow/flowLayoutConstants'
import '../workflow/FlowCanvas/FlowCanvas.css'
import '../workflow/Molecules/PreviewPanel/PreviewPanel.css'

interface RunDetailViewProps {
  row: HealthcareLogRow
  instanceName: string
  onBack: () => void
  onEditAgent?: () => void
  /** Called when a "Track your feedback" link is clicked in the Front-desk Logs Conversation tab —
   *  the host screen navigates to that recommendation's detail page. */
  onTrackFeedback?: (recommendationId: string) => void
}

const PROCEDURE_CHIPS = [
  'Greet and open conversation',
  'Talk to human',
  'Handle general inquiry',
  'Handle unclear message',
  'Handle emergency or urgent concern',
]

/* ── workflow canvas connector (matches FlowCanvas edge styling, no add button in run view) ── */
function RunFlowConnector({ height }: { height: number }) {
  return (
    <div className="relative flex items-center justify-center" style={{ height, width: 24 }}>
      <div
        className="pointer-events-none absolute bottom-0 top-0 left-1/2 w-px -translate-x-1/2"
        style={{ background: '#ccd5e4' }}
      />
    </div>
  )
}

const RUN_PROCEDURE_ITEMS = PROCEDURE_CHIPS.map((name) => ({ id: name, name }))

function getImplementedSteps(row: HealthcareLogRow): LogStepId[] {
  if (row.implementedSteps?.length) return row.implementedSteps
  if (row.status === 'Complete') return ['trigger', 'procedures']
  return ['trigger']
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

  if (row.status === 'Failed') {
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
          { key: 'Review.comment', value: 'Unrelated promotional content' },
          { key: 'Review.source', value: source },
          { key: 'Review.rating', value: '1' },
        ],
      },
      {
        id: 'rr-log-3',
        type: 'branch',
        stepNumber: 3,
        title: 'No conditions met',
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
        { key: 'Review.comment', value: 'Wait was longer than expected…' },
        { key: 'Review.source', value: source },
        { key: 'Review.rating', value: '3' },
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
        { key: 'Review.comment', value: 'Wait was longer than expected…' },
        { key: 'Review.rating', value: '3' },
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

  if (row.status === 'Failed') {
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

/* ── generic workflow node shape (from agentWorkflows seeds) ── */
interface WorkflowNodeSeed {
  id: string
  flowType: string
  data: {
    title: string
    subtype?: string
    descriptionPlaceholder?: string
  }
}

/** Node ids this run executed — follows only the taken branch path, not every branch. */
function getExecutedNodeIds(
  row: HealthcareLogRow,
  nodes: WorkflowNodeSeed[],
  nodeDetails: Record<string, unknown>,
): string[] {
  // Explicit list from the log row wins when present.
  const explicit = row.executedNodeIds
  if (Array.isArray(explicit) && explicit.length > 0) {
    return explicit.filter((id): id is string => typeof id === 'string')
  }

  if (row.status === 'In progress') {
    return nodes.slice(0, Math.min(2, nodes.length)).map((node) => node.id)
  }

  const ids: string[] = []
  const visit = (items: WorkflowNodeSeed[]) => {
    items.forEach((node) => {
      ids.push(node.id)
      const detail = nodeDetails[node.id] as {
        branches?: Array<{ id: string; isFallback?: boolean }>
      } | undefined
      if (!detail?.branches?.length) return

      // Complete → primary (non-fallback) path; Failed → fallback / last path.
      const chosen =
        row.status === 'Failed'
          ? detail.branches.find((b) => b.isFallback) ?? detail.branches[detail.branches.length - 1]
          : detail.branches.find((b) => !b.isFallback) ?? detail.branches[0]

      const path = chosen
        ? (nodeDetails[chosen.id] as { nodes?: WorkflowNodeSeed[] } | undefined)
        : undefined
      if (path?.nodes) visit(path.nodes)
    })
  }
  visit(nodes)
  return ids
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
        /* Dot grid spans the full run view, including under the details panel */
        .run-wf-bg { background-color: #eef0f4; }
        /* Canvas stays clear of the overlaid details panel — must match the 480px float wrap
           in PreviewPanel.css (this previously reserved 600px against a 550px wrap). */
        .run-wf-viewer { height: 100%; width: calc(100% - 480px); }
        .run-wf-viewer .agent-builder__lhs    { display: none !important; }
        .run-wf-viewer .faq-ab-header         { display: none !important; }
        .run-wf-viewer .faq-ab-embedded       { height: 100% !important; }
        .run-wf-viewer .agent-builder-wrapper { background: transparent !important; background-image: none !important; }
        .run-wf-viewer .agent-builder         { padding: 0 !important; gap: 0 !important; }
        .run-wf-viewer .flow-canvas__toolbar-anchor { top: 16px !important; }
        /* Hide orientation toggle — view-only run context */
        .run-wf-viewer .graph-controls__toggle { display: none !important; }
        /* No add-step buttons on edges — run views are read-only history */
        .run-wf-viewer .flow-canvas__edge-add  { display: none !important; }
        ${executedCss}
      `}</style>
      <div className="run-wf-viewer">
        <AgentBuilder
          key={instanceName}
          pageTitle={instanceName}
          appTitle={instanceName}
          viewOnly
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
          runDisabled
          nodesInteractive={false}
        />
      </div>
    </div>
  )
}

/* ── workflow canvas ── */
function WorkflowCanvas({
  instanceName,
  implementedSteps,
}: {
  instanceName: string
  implementedSteps: LogStepId[]
}) {
  const triggerImplemented = implementedSteps.includes('trigger')
  const proceduresImplemented = implementedSteps.includes('procedures')
  const [zoom, setZoom] = React.useState(85)

  return (
    <div className="flow-canvas absolute inset-0 flex flex-col overflow-auto">
      <div
        className="flow-canvas__toolbar-anchor"
        style={{ left: 'calc((100% - 620px) / 2)' }}
      >
        <GraphControls
          viewOnly
          runDisabled
          zoom={zoom}
          onRun={() => {}}
          onEdit={() => {}}
          onView={() => {}}
          onOrientationChange={() => {}}
          onZoomSelect={(fraction: number) => setZoom(Math.round(fraction * 100))}
          onFitView={() => {}}
        />
      </div>

      {/* Right padding keeps the flow clear of the overlaid details panel */}
      <div
        className="flex flex-col items-center pb-2xl pr-[620px] pt-[84px]"
        style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
      >
        <StartNode title={instanceName} subtitle="All locations" />

        <RunFlowConnector height={FLOW_START_GAP} />

        <div className="flow-canvas__node-center">
          <CanvasNode
            nodeType="trigger"
            label="Trigger"
            stepNumber={1}
            title="Conversation trigger"
            description="Agent triggers when a voice, chat, or text conversations starts"
            titlePlaceholder=""
            descriptionPlaceholder=""
            viewOnly
            onToggleChange={() => {}}
            onAddClick={() => {}}
            onDelete={() => {}}
            onCopy={() => {}}
            onReplace={() => {}}
            state={triggerImplemented ? 'implemented' : 'default'}
          />
        </div>

        <RunFlowConnector height={FLOW_CONNECTOR_GAP} />

        <div className="flow-canvas__node-center">
          <ProceduresNode
            stepNumber={3}
            procedureItems={RUN_PROCEDURE_ITEMS as never[]}
            hasToggle
            toggleEnabled
            toggleDisabled
            viewOnly
            onToggleChange={() => {}}
            onDelete={() => {}}
            onCopy={() => {}}
            onReplace={() => {}}
            onMoveUp={() => {}}
            onMoveDown={() => {}}
            onDropProcedure={() => {}}
            onRemoveProcedure={() => {}}
            onSelectProcedure={() => {}}
            state={proceduresImplemented ? 'implemented' : 'default'}
          />
        </div>

        <EndNode viewOnly hideAdd onDropBeforeEnd={() => {}} />
      </div>
    </div>
  )
}

/* ── main export ── */
export function RunDetailView({ row, instanceName, onBack, onEditAgent, onTrackFeedback }: RunDetailViewProps) {
  const canvasInstanceName = instanceName.replace(' - ', ' ')
  const agentName = instanceName.replace(/ - .+$/, '')
  const isReviewResponse = /review response agent/i.test(agentName)
  const isReviewGeneration = /review generation agent/i.test(agentName)
  const isReviewAgent = isReviewResponse || isReviewGeneration
  const isReminder = agentName === 'Reminder agent'
  const hasVoiceCall = row.channel.toLowerCase().includes('voice')
  const totalSecs = parseDurationSecs(row.duration)
  const agentWorkflow =
    instanceName === 'Reminder agent - North region'
      ? HEALTHCARE_REMINDER_NORTH_WORKFLOW
      : agentName !== 'Front desk agent'
        ? HEALTHCARE_AGENT_WORKFLOWS[agentName]
        : undefined
  const statusVariant =
    row.status === 'Complete' ? 'success' : row.status === 'Failed' ? 'danger' : 'warning'
  const useRunDetailsPanel = isReminder || isReviewAgent

  return (
    <div className="log-detail-view relative flex h-full flex-col bg-surface">
      {/* Visual chrome shared by both canvas paths (AgentBuilder run canvas and the plain
          WorkflowCanvas) so every agent's log view looks identical, whatever data it shows.
          Scoped to .log-detail-view — .flow-canvas is shared with the workflow editor. */}
      <style>{`
        .log-detail-view .flow-canvas,
        .log-detail-view .run-wf-bg,
        .log-detail-view .agent-builder-wrapper {
          background-color: #eef0f4 !important;
          background-image: none !important;
        }
        /* No agent name / Draft / View only pill over a read-only run. */
        .log-detail-view .rr-chrome-top { display: none !important; }

        /* Node cards are a read-only record here — fully inert: no pointer, no hover
           affordances, no selection ring. Clicks are already a no-op via nodesInteractive. */
        .log-detail-view .canvas-node-wrap,
        .log-detail-view .canvas-node,
        .log-detail-view .react-flow__node { cursor: default !important; }
        .log-detail-view .canvas-node__hover-actions { display: none !important; }
        .log-detail-view .canvas-node--hover,
        .log-detail-view .canvas-node--selected { border-color: transparent !important; }
      `}</style>

      {/* Header — title + status chip, vertically centred against the back arrow */}
      <div className="flex shrink-0 items-center gap-sm border-b border-border px-2xl py-sm">
        <button
          type="button"
          aria-label="Back to logs"
          onClick={onBack}
          className="flex size-7 shrink-0 items-center justify-center rounded-sm text-text-icon hover:bg-surface-hover"
        >
          <BackArrowIcon />
        </button>
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-sm">
          <h1 className="text-h3 text-text-primary">Log - {row.timestamp}</h1>
          <Chip label={row.status} variant={statusVariant} />
        </div>
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
        ) : (
          <WorkflowCanvas
            instanceName={canvasInstanceName}
            implementedSteps={getImplementedSteps(row)}
          />
        )}

        <div className="preview-panel-float-wrap preview-panel-float-wrap--log-details">
          {useRunDetailsPanel ? (
            <RunDetailsPanel
              steps={
                isReviewResponse
                  ? buildReviewResponseRunSteps(row)
                  : isReviewGeneration
                    ? buildReviewGenerationRunSteps(row)
                    : undefined
              }
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
            <LogDetailsPanel row={row} agentName={instanceName} onTrackFeedback={onTrackFeedback} />
          )}
        </div>
      </div>
    </div>
  )
}
