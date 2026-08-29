import React from 'react'
import { BackArrowIcon } from '../assets/BackArrowIcon'
import voicemailSample from '../assets/voicemail_sample.mp3'
import {
  Chip,
  getUserRatingForLogStatus,
  Icon,
  LogDetailsPanel,
  ReviewCardBody,
  RunDetailsPanel,
  type ChipVariant,
  type ReviewCardData,
  type RunLogStep,
} from '../components'
import type { HealthcareLogRow, LogStepId } from '../data/healthcareAgentLogs'
import {
  HEALTHCARE_AGENT_WORKFLOWS,
  HEALTHCARE_REMINDER_NORTH_WORKFLOW,
} from '../data/agentWorkflows'
import { useProcedureStore } from '../data/ProcedureStoreContext'
import { REMINDER_CONVERSATION_AI_SUMMARY } from '../data/reminderInboxConversation'
// @ts-ignore
import AgentBuilderRaw from '../workflow/AgentBuilder/AgentBuilder'

const AgentBuilder = AgentBuilderRaw as unknown as React.ComponentType<Record<string, unknown>>
import StartNode from '../workflow/Molecules/Canvas/StartNode/StartNode'
import CanvasNode from '../workflow/Molecules/Canvas/CanvasNode/CanvasNode'
import ProceduresNode from '../workflow/Molecules/Canvas/ProceduresNode/ProceduresNode'
import EndNode from '../workflow/Molecules/Canvas/EndNode/EndNode'
import GraphControls from '../workflow/Modules/FlowCanvas/GraphControls/GraphControls'
import '../workflow/FlowCanvas/FlowCanvas.css'
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
  initialPanel?: string
  onPanelChange?: (panel: string) => void
}

function sameLogRow(a: HealthcareLogRow, b: HealthcareLogRow) {
  return (
    a.timestamp === b.timestamp
    && a.contact === b.contact
    && a.channel === b.channel
    && a.status === b.status
  )
}

const PROCEDURE_CHIPS = [
  'Greet and open conversation',
  'Talk to human',
  'Handle general inquiry',
  'Handle unclear message',
  'Handle emergency or urgent concern',
]

/* ── workflow canvas connector (matches FlowCanvas edge styling, no add button in run view) ── */
const LOG_VIEW_START_GAP = 100
const LOG_VIEW_CONNECTOR_GAP = 48
const LOG_VIEW_DEFAULT_ZOOM = 95
const LOG_VIEW_ZOOM_MIN = 10
const LOG_VIEW_ZOOM_MAX = 200
const LOG_VIEW_ZOOM_STEP = 25

function isEditableZoomTarget(target: EventTarget | null) {
  return target instanceof Element && Boolean(target.closest('input, textarea, select, [contenteditable="true"]'))
}

function clampLogViewZoom(value: number) {
  return Math.min(LOG_VIEW_ZOOM_MAX, Math.max(LOG_VIEW_ZOOM_MIN, Math.round(value)))
}

function isLogViewZoomInKey(key: string) {
  return key === '=' || key === '+' || key === 'Add'
}

function isLogViewZoomOutKey(key: string) {
  return key === '-' || key === '_' || key === 'Subtract'
}

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
  if (row.status === 'Complete' || row.status === 'Resolved') return ['trigger', 'procedures']
  return ['trigger']
}

function parseDurationSecs(duration: string): number {
  const mmss = duration.match(/^(\d+):(\d+)$/)
  if (mmss) return Number(mmss[1]) * 60 + Number(mmss[2])
  const secsOnly = Number(duration)
  return Number.isFinite(secsOnly) ? secsOnly : 332
}

function formatDurationLabel(secs: number): string {
  const mins = Math.floor(secs / 60)
  const rem = secs % 60
  return `${mins}m ${String(rem).padStart(2, '0')}s`
}

function startTimeLabel(timestamp: string): string {
  const match = timestamp.match(/(\d{1,2}:\d{2}\s*[ap]m)/i)
  return match?.[1] ?? timestamp
}

function buildReviewResponseRunSteps(row: HealthcareLogRow): RunLogStep[] {
  const source = String(row.source ?? row.channel ?? 'Google')
  const trigger: RunLogStep = {
    id: 'rr-log-1',
    nodeId: 'rr-1',
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
        nodeId: 'rr-2',
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
        nodeId: 'rr-2',
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
        nodeId: 'rr-2',
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
        nodeId: 'rr-3',
        type: 'branch',
        stepNumber: 3,
        title: 'Fallback',
        outputLabel: 'Branch output',
        output: [{ key: 'Path', value: 'Send email alert' }],
        inputs: [{ key: 'Review.isSpam', value: 'true' }],
      },
      {
        id: 'rr-log-4',
        nodeId: 'rr-7',
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
      nodeId: 'rr-2',
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
      nodeId: 'rr-3',
      type: 'branch',
      stepNumber: 3,
      title: 'Respond',
      outputLabel: 'Branch output',
      output: [{ key: 'Path', value: 'Respond' }],
      inputs: [{ key: 'Review.isSpam', value: 'false' }],
    },
    {
      id: 'rr-log-4',
      nodeId: 'rr-4',
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
      nodeId: 'rr-5',
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
      nodeId: 'rr-6',
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
    nodeId: 'rg-1',
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
        nodeId: 'rg-2',
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
        nodeId: 'rg-2',
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
        nodeId: 'rg-3',
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
      nodeId: 'rg-2',
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
      nodeId: 'rg-3',
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

function findStepOutputValue(
  steps: RunLogStep[] | undefined,
  stepTitle: string,
  fieldKey: string,
): string | undefined {
  const step = steps?.find((s) => s.title === stepTitle)
  return step?.output?.find((f) => f.key === fieldKey)?.value
}

/** Review-response/generation log side panel — Review details tab instead of a conversation. */
function ReviewDetailsContent({
  row,
  steps,
  agentName,
  kind,
}: {
  row: HealthcareLogRow
  steps?: RunLogStep[]
  agentName: string
  kind: 'response' | 'generation'
}) {
  const source = String(row.source ?? row.channel ?? '')

  if (kind === 'generation') {
    return (
      <div className="flex h-full flex-col gap-md overflow-y-auto">
        <div className="flex items-center gap-sm text-body">
          <span className="text-text-primary">{row.contact}</span>
          {row.location && <span className="text-text-tertiary">• {row.location}</span>}
        </div>
        <p className="text-body text-text-secondary">Review request sent via {source || 'email'}.</p>
      </div>
    )
  }

  const firstName = row.contact && row.contact !== '—' ? row.contact.split(' ')[0] : 'there'
  const replyText =
    findStepOutputValue(steps, 'Generate response', 'Draft reply')
    ?? (typeof row.rating === 'number' && row.rating <= 3
      ? `We appreciate your feedback, ${firstName}. If you would like to discuss your experience further, please reach out to us directly — we would love the opportunity to resolve any issues.`
      : `Thank you so much for your feedback, ${firstName}! We're thrilled to hear about your experience and look forward to seeing you again soon.`)

  const review: ReviewCardData = {
    reviewerName: row.contact,
    rating: typeof row.rating === 'number' ? row.rating : 0,
    date: row.timestamp,
    reviewId: row.reviewId ?? '—',
    location: row.location ?? '—',
    text: typeof row.comment === 'string' ? row.comment : '',
    reply: { channel: source || 'Birdeye', agentName, postedAt: row.timestamp, text: replyText },
  }

  return (
    <div className="h-full overflow-y-auto pt-md">
      <ReviewCardBody review={review} stacked />
    </div>
  )
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
        row.status === 'Failed' || row.status === 'Not resolved'
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

/** Flatten top-level + branch-path nodes for title → id lookup. */
function flattenWorkflowNodes(
  nodes: WorkflowNodeSeed[],
  nodeDetails: Record<string, unknown>,
): WorkflowNodeSeed[] {
  const out: WorkflowNodeSeed[] = []
  const visit = (items: WorkflowNodeSeed[]) => {
    items.forEach((node) => {
      out.push(node)
      const detail = nodeDetails[node.id] as {
        branches?: Array<{ id: string; name?: string }>
      } | undefined
      detail?.branches?.forEach((branch) => {
        const path = nodeDetails[branch.id] as { nodes?: WorkflowNodeSeed[] } | undefined
        if (path?.nodes) visit(path.nodes)
      })
    })
  }
  visit(nodes)
  return out
}

/** Resolve which canvas node a log step should focus. */
function resolveLogStepNodeId(
  step: RunLogStep,
  nodes: WorkflowNodeSeed[],
  nodeDetails: Record<string, unknown>,
): string | null {
  if (step.nodeId) return step.nodeId
  const all = flattenWorkflowNodes(nodes, nodeDetails)
  const byTitle = all.find((n) => n.data.title === step.title)
  if (byTitle) return byTitle.id
  // Branch log rows often use the path label ("Respond" / "Fallback") rather than the branch card title.
  for (const node of all) {
    const detail = nodeDetails[node.id] as {
      branches?: Array<{ id: string; name?: string }>
    } | undefined
    const match = detail?.branches?.find(
      (b) =>
        b.name === step.title ||
        (b.name != null && b.name.toLowerCase().startsWith(step.title.toLowerCase())),
    )
    if (match) return node.id
  }
  return null
}

/* ── run canvas — same AgentBuilder viewer as the Workflow tab, executed nodes in green ── */
function AgentWorkflowRunCanvas({
  instanceName,
  workflow,
  row,
  product,
  focusNodeId = null,
  focusNonce = 0,
}: {
  instanceName: string
  workflow: { nodes: WorkflowNodeSeed[]; nodeDetails: Record<string, unknown> }
  row: HealthcareLogRow
  product?: string
  focusNodeId?: string | null
  focusNonce?: number
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

  const focusCss = focusNodeId
    ? `.run-wf-viewer .react-flow__node[data-id="${focusNodeId}"] .canvas-node { border: 1px solid #1976d2 !important; animation: ab-test-run-pulse 2.6s ease-in-out infinite; }`
    : ''

  // Remount focus signal when the same node is clicked again (nonce bumps).
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
        /* Logs are a historical run — no workflow chrome (mode switch / run test). */
        .run-wf-viewer .rr-chrome-top { display: none !important; }
        .run-wf-viewer .rr-chrome-run-test { display: none !important; }
        ${executedCss}
        ${focusCss}
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
          initialZoom={LOG_VIEW_DEFAULT_ZOOM / 100}
          nodesInteractive={false}
          logDoneNodeIds={executedIds}
          externalFocusNodeId={focusNodeId}
          externalFocusNonce={focusNonce}
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
  const [zoom, setZoom] = React.useState(LOG_VIEW_DEFAULT_ZOOM)
  const canvasRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (isEditableZoomTarget(e.target)) return

      const mod = e.ctrlKey || e.metaKey
      const numpad = e.key === 'Add' || e.key === 'Subtract'
      const canvasFocused = Boolean(canvasRef.current?.contains(document.activeElement))

      if (mod && isLogViewZoomInKey(e.key)) {
        e.preventDefault()
        setZoom((z) => clampLogViewZoom(z + LOG_VIEW_ZOOM_STEP))
        return
      }
      if (mod && isLogViewZoomOutKey(e.key)) {
        e.preventDefault()
        setZoom((z) => clampLogViewZoom(z - LOG_VIEW_ZOOM_STEP))
        return
      }
      if (mod && e.key === '0') {
        e.preventDefault()
        setZoom(LOG_VIEW_DEFAULT_ZOOM)
        return
      }
      if (numpad && canvasFocused) {
        e.preventDefault()
        if (e.key === 'Add') setZoom((z) => clampLogViewZoom(z + LOG_VIEW_ZOOM_STEP))
        if (e.key === 'Subtract') setZoom((z) => clampLogViewZoom(z - LOG_VIEW_ZOOM_STEP))
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const handleWheel = (e: React.WheelEvent) => {
    if (!e.ctrlKey && !e.metaKey) return
    e.preventDefault()
    const delta = e.deltaY > 0 ? -10 : 10
    setZoom((z) => clampLogViewZoom(z + delta))
  }

  return (
    <div
      ref={canvasRef}
      tabIndex={-1}
      className="flow-canvas absolute inset-0 flex flex-col overflow-hidden outline-none"
      onMouseDown={() => canvasRef.current?.focus()}
    >
      <div className="min-h-0 flex-1 overflow-auto" onWheel={handleWheel}>
        {/* Right padding keeps the flow clear of the overlaid details panel */}
        <div
          className="log-view-canvas-scale flex flex-col items-center pb-2xl pr-[620px] pt-2xl"
          style={{ zoom: zoom / 100 }}
        >
          <StartNode title={instanceName} subtitle="All locations" />

          <RunFlowConnector height={LOG_VIEW_START_GAP} />

          <div className="flow-canvas__node-center" data-log-canvas-step="trigger">
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
              runStatus={triggerImplemented ? 'done' : undefined}
            />
          </div>

          <RunFlowConnector height={LOG_VIEW_CONNECTOR_GAP} />

          <div className="flow-canvas__node-center" data-log-canvas-step="procedures">
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
              runStatus={proceduresImplemented ? 'done' : undefined}
            />
          </div>

          <EndNode viewOnly hideAdd onDropBeforeEnd={() => {}} />
        </div>
      </div>

      <div className="log-view-zoom-anchor">
        <GraphControls
          rrChrome
          viewOnly
          zoom={zoom}
          onZoomSelect={(fraction: number) => setZoom(clampLogViewZoom(fraction * 100))}
          onFitView={() => setZoom(LOG_VIEW_DEFAULT_ZOOM)}
          onFillView={() => setZoom(100)}
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
  initialPanel,
  onPanelChange,
}: RunDetailViewProps) {
  const canvasInstanceName = instanceName.replace(' - ', ' ')
  const agentName = instanceName.replace(/ - .+$/, '')
  const isReviewResponse = /review response agent/i.test(agentName)
  const isReviewGeneration = /review generation agent/i.test(agentName)
  const isReviewAgent = isReviewResponse || isReviewGeneration
  const isReminder = agentName === 'Reminder agent'
  const hasVoiceCall = row.channel.toLowerCase().includes('voice')
  const totalSecs = parseDurationSecs(row.duration)
  const displayCaller =
    row.contact.startsWith('+') || row.contact.startsWith('(') ? row.contact : '(032) 902 9023'
  const agentWorkflow =
    instanceName === 'Reminder agent - North region'
      ? HEALTHCARE_REMINDER_NORTH_WORKFLOW
      : agentName !== 'Front desk agent'
        ? HEALTHCARE_AGENT_WORKFLOWS[agentName]
        : undefined
  const LOG_STATUS_VARIANT: Record<string, ChipVariant> = {
    Complete: 'success',
    Completed: 'success',
    Failed: 'danger',
    'In progress': 'warning',
    Resolved: 'success',
    'Not resolved': 'danger',
    Aborted: 'neutral',
  }
  const statusVariant = LOG_STATUS_VARIANT[row.status] ?? 'warning'
  const useRunDetailsPanel = isReminder || isReviewAgent
  const reviewLogSteps = isReviewResponse
    ? buildReviewResponseRunSteps(row)
    : isReviewGeneration
      ? buildReviewGenerationRunSteps(row)
      : undefined

  const [focusNodeId, setFocusNodeId] = React.useState<string | null>(null)
  const [focusNonce, setFocusNonce] = React.useState(0)

  const handleStepFocus = React.useCallback(
    (step: RunLogStep) => {
      if (agentWorkflow) {
        const id = resolveLogStepNodeId(
          step,
          agentWorkflow.nodes as WorkflowNodeSeed[],
          agentWorkflow.nodeDetails as Record<string, unknown>,
        )
        if (!id) return
        setFocusNodeId(id)
        setFocusNonce((n) => n + 1)
        return
      }
      // Front-desk fallback canvas — scroll the matching static card into view.
      const key = step.nodeId ?? (step.type === 'procedures' ? 'procedures' : step.type === 'trigger' ? 'trigger' : step.id)
      const el = document.querySelector<HTMLElement>(`[data-log-canvas-step="${key}"]`)
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    },
    [agentWorkflow],
  )

  const runIndex = runs.findIndex((r) => sameLogRow(r, row))
  const hasRunNav = runs.length > 1 && runIndex >= 0 && !!onSelectRun
  const canGoPrev = hasRunNav && runIndex > 0
  const canGoNext = hasRunNav && runIndex < runs.length - 1

  return (
    <div className="log-detail-view relative flex h-full flex-col bg-surface">
      {/* Visual chrome shared by both canvas paths (AgentBuilder run canvas and the plain
          WorkflowCanvas) so every agent's log view looks identical, whatever data it shows.
          Scoped to .log-detail-view — .flow-canvas is shared with the workflow editor. */}
      <style>{`
        .log-detail-view .flow-canvas,
        .log-detail-view .run-wf-bg,
        .log-detail-view .agent-builder-wrapper {
          background-color: #f2f4f7 !important;
          background-image: none !important;
        }
        /* Bottom-left zoom floater (fallback WorkflowCanvas path). */
        .log-detail-view .flow-canvas {
          display: flex;
          flex-direction: column;
        }
        .log-detail-view .log-view-zoom-anchor {
          position: absolute;
          bottom: 16px;
          left: 16px;
          z-index: 50;
        }
        .log-detail-view .log-view-zoom-anchor .graph-controls--rr-chrome {
          width: auto;
        }

        /* Node cards are a read-only record here — fully inert: no pointer, no hover
           affordances, no selection ring. Clicks are already a no-op via nodesInteractive. */
        .log-detail-view .canvas-node-wrap,
        .log-detail-view .canvas-node,
        .log-detail-view .react-flow__node { cursor: default !important; }
        .log-detail-view .canvas-node__hover-actions { display: none !important; }
        .log-detail-view .cnh__more-wrapper { display: none !important; }
        .log-detail-view .canvas-node--hover,
        .log-detail-view .canvas-node--selected { border-color: transparent !important; }
      `}</style>

      {/* Header — title + status on line 1, instance name on line 2 */}
      <div className="flex shrink-0 items-center justify-between gap-md bg-surface px-2xl py-md">
        <div className="flex min-w-0 items-center gap-sm">
          <button
            type="button"
            aria-label="Back to logs"
            onClick={onBack}
            className="flex size-7 shrink-0 items-center justify-center rounded-sm text-text-icon hover:bg-surface-hover"
          >
            <BackArrowIcon />
          </button>
          <div className="min-w-0">
            <div className="flex min-w-0 items-center gap-sm">
              <h1 className="min-w-0 truncate text-[16px] leading-6 tracking-[-0.32px] text-text-primary">
                Log - {row.timestamp}
              </h1>
              <Chip label={row.status} variant={statusVariant} />
            </div>
            <p className="truncate text-small text-text-secondary">{instanceName}</p>
          </div>
        </div>
        {hasRunNav && (
          <div className="flex shrink-0 items-center gap-xs">
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
            focusNodeId={focusNodeId}
            focusNonce={focusNonce}
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
              steps={reviewLogSteps}
              showTabs
              showHeader={false}
              conversationTabLabel={isReviewAgent ? 'Review details' : undefined}
              logsTabLabel={isReviewAgent ? 'Review logs' : undefined}
              conversationContent={
                isReviewAgent ? (
                  <ReviewDetailsContent
                    row={row}
                    steps={reviewLogSteps}
                    agentName={agentName}
                    kind={isReviewResponse ? 'response' : 'generation'}
                  />
                ) : undefined
              }
              showCallRecording={isReminder && hasVoiceCall}
              audioUrl={isReminder ? voicemailSample : undefined}
              durationSecs={isReminder ? totalSecs : undefined}
              agentName={isReminder ? instanceName : undefined}
              onTrackFeedback={isReminder ? onTrackFeedback : undefined}
              callDetails={
                isReminder && hasVoiceCall
                  ? {
                      callerNumber: displayCaller,
                      languageDetected: 'English',
                      duration: formatDurationLabel(totalSecs),
                      sidNumber: 'CA45 T78 932',
                      startTime: startTimeLabel(row.timestamp),
                      callEndReason: 'User ended the conversation',
                      routedVia: instanceName,
                    }
                  : undefined
              }
              userRating={isReminder && hasVoiceCall ? getUserRatingForLogStatus(row.status) : undefined}
              conversationAiSummary={isReminder ? REMINDER_CONVERSATION_AI_SUMMARY : undefined}
              onStepFocus={handleStepFocus}
              initialTab={initialPanel}
              onTabChange={onPanelChange}
            />
          ) : (
            <LogDetailsPanel
              key={row.timestamp}
              row={row}
              agentName={instanceName}
              onTrackFeedback={onTrackFeedback}
              callEndResultBadge={explorationFrontDeskStatus ? String(row.status) : undefined}
              userRating={
                explorationFrontDeskStatus ? getUserRatingForLogStatus(row.status) : undefined
              }
              showTranscriptTranslation={explorationFrontDeskStatus}
              onStepFocus={handleStepFocus}
              initialTab={initialPanel}
              onTabChange={onPanelChange}
            />
          )}
        </div>
      </div>
    </div>
  )
}
