import { BackArrowIcon } from '../assets/BackArrowIcon'
import { Chip, LogDetailsPanel } from '../components'
import type { HealthcareLogRow } from '../data/healthcareAgentLogs'
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
  onBack: () => void
  onViewConversation?: () => void
}

const PROCEDURE_CHIPS = [
  'Greet and open conversation',
  'Talk to human',
  'Handle general inquiry',
  'Handle unclear message',
  'Handle emergency or urgent concern',
]

/* ── workflow canvas connector (matches FlowCanvas edge styling) ── */
function RunFlowConnector({
  height,
  showAdd = true,
}: {
  height: number
  showAdd?: boolean
}) {
  return (
    <div
      className="relative flex items-center justify-center"
      style={{ height, width: showAdd ? 56 : 24 }}
    >
      <div
        className="pointer-events-none absolute bottom-0 top-0 left-1/2 w-px -translate-x-1/2"
        style={{ background: '#ccd5e4' }}
      />
      {showAdd && (
        <button
          type="button"
          className="flow-canvas__edge-add relative z-[1]"
          disabled
          aria-hidden
          tabIndex={-1}
        >
          <span className="material-symbols-outlined">add</span>
        </button>
      )}
    </div>
  )
}

const RUN_PROCEDURE_ITEMS = PROCEDURE_CHIPS.map((name) => ({ id: name, name }))

/* ── workflow canvas ── */
function WorkflowCanvas({ instanceName }: { instanceName: string }) {
  return (
    <div className="flow-canvas absolute inset-0 flex flex-col overflow-auto">
      <div
        className="flow-canvas__toolbar-anchor"
        style={{ left: 'calc((100% - 620px) / 2)' }}
      >
        <GraphControls
          viewOnly
          runDisabled
          zoom={100}
          onRun={() => {}}
          onEdit={() => {}}
          onOrientationChange={() => {}}
          onZoomSelect={() => {}}
          onFitView={() => {}}
        />
      </div>

      {/* Right padding keeps the flow clear of the overlaid details panel */}
      <div className="flex flex-col items-center pb-2xl pr-[620px] pt-[84px]">
        <StartNode title={instanceName} subtitle="All locations" />

        <RunFlowConnector height={FLOW_START_GAP} showAdd={false} />

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
          />
        </div>

        <RunFlowConnector height={FLOW_CONNECTOR_GAP} showAdd />

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
            onMoveUp={() => {}}
            onMoveDown={() => {}}
            onDropProcedure={() => {}}
            onRemoveProcedure={() => {}}
            onSelectProcedure={() => {}}
          />
        </div>

        <EndNode viewOnly hideAdd onDropBeforeEnd={() => {}} />
      </div>
    </div>
  )
}

/* ── main export ── */
export function RunDetailView({ row, onBack, onViewConversation }: RunDetailViewProps) {
  const instanceName = 'Front desk agent north region'
  const statusVariant =
    row.status === 'Complete' ? 'success' : row.status === 'Failed' ? 'danger' : 'warning'

  return (
    <div className="relative flex h-full flex-col bg-surface">
      {/* Header */}
      <div className="flex h-14 shrink-0 items-center gap-sm border-b border-border px-2xl">
        <button
          type="button"
          aria-label="Back to logs"
          onClick={onBack}
          className="flex size-7 items-center justify-center rounded-sm text-text-icon hover:bg-surface-hover"
        >
          <BackArrowIcon />
        </button>
        <h1 className="text-h3 text-text-primary">Run - {row.timestamp}</h1>
        <Chip label={row.status} variant={statusVariant} />
      </div>

      {/* Body — full-bleed canvas with overlaid details panel (matches trigger/task RHS) */}
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <WorkflowCanvas instanceName={instanceName} />

        <div className="preview-panel-float-wrap preview-panel-float-wrap--log-details">
          <LogDetailsPanel row={row} onViewConversation={onViewConversation} />
        </div>
      </div>
    </div>
  )
}
