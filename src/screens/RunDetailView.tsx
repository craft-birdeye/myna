import React from 'react'
import { BackArrowIcon } from '../assets/BackArrowIcon'
import { Chip, LogDetailsPanel, RunDetailsPanel } from '../components'
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
  onViewConversation?: () => void
  onEditAgent?: () => void
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

/** Node ids this run executed, including nodes nested in branch paths. */
function getExecutedNodeIds(
  row: HealthcareLogRow,
  nodes: WorkflowNodeSeed[],
  nodeDetails: Record<string, unknown>,
): string[] {
  if (row.status !== 'Complete') {
    return nodes.slice(0, Math.min(2, nodes.length)).map((node) => node.id)
  }

  const ids: string[] = []
  const visit = (items: WorkflowNodeSeed[]) => {
    items.forEach((node) => {
      ids.push(node.id)
      const detail = nodeDetails[node.id] as { branches?: Array<{ id: string }> } | undefined
      detail?.branches?.forEach((branch) => {
        const path = nodeDetails[branch.id] as { nodes?: WorkflowNodeSeed[] } | undefined
        if (path?.nodes) visit(path.nodes)
      })
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
        .run-wf-bg { background-color: #f8f9fb; background-image: radial-gradient(circle, #c8cdd8 1px, transparent 1px); background-size: 28px 28px; }
        /* Canvas itself stays clear of the overlaid 600px details panel */
        .run-wf-viewer { height: 100%; width: calc(100% - 600px); }
        .run-wf-viewer .agent-builder__lhs    { display: none !important; }
        .run-wf-viewer .faq-ab-header         { display: none !important; }
        .run-wf-viewer .ab-view-banner        { display: none !important; }
        .run-wf-viewer .faq-ab-embedded       { height: 100% !important; }
        .run-wf-viewer .agent-builder-wrapper { background: transparent !important; background-image: none !important; }
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
export function RunDetailView({ row, instanceName, onBack, onViewConversation, onEditAgent }: RunDetailViewProps) {
  const canvasInstanceName = instanceName.replace(' - ', ' ')
  const agentName = instanceName.replace(/ - .+$/, '')
  const agentWorkflow =
    instanceName === 'Reminder agent - North region'
      ? HEALTHCARE_REMINDER_NORTH_WORKFLOW
      : agentName !== 'Front desk agent'
        ? HEALTHCARE_AGENT_WORKFLOWS[agentName]
        : undefined
  const statusVariant =
    row.status === 'Complete' ? 'success' : row.status === 'Failed' ? 'danger' : 'warning'

  return (
    <div className="relative flex h-full flex-col bg-surface">
      {/* Header — title + status chip with agent name subtitle (matches recommendation detail) */}
      <div className="flex shrink-0 items-start gap-sm border-b border-border px-2xl py-lg">
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
            <h1 className="text-h2 text-text-primary">Run - {row.timestamp}</h1>
            <Chip label={row.status} variant={statusVariant} />
          </div>
          <p className="mt-xs text-small text-text-secondary">{instanceName}</p>
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
          {agentName === 'Reminder agent' ? (
            <RunDetailsPanel onViewConversation={onViewConversation} />
          ) : (
            <LogDetailsPanel row={row} onViewConversation={onViewConversation} />
          )}
        </div>
      </div>
    </div>
  )
}
