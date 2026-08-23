import React, { useMemo, useCallback, useState, useEffect, useRef } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  Handle,
  Position,
  BaseEdge,
  getStraightPath,
  useReactFlow,
} from '@xyflow/react';
import GraphControls from '../Modules/FlowCanvas/GraphControls/GraphControls';
import '@xyflow/react/dist/style.css';
import StartNode from '../Molecules/Canvas/StartNode/StartNode';
import EndNode from '../Molecules/Canvas/EndNode/EndNode';
import TriggerPlaceholderNode from '../Molecules/Canvas/TriggerPlaceholderNode/TriggerPlaceholderNode';
import CanvasNode from '../Molecules/Canvas/CanvasNode/CanvasNode';
import ProceduresNode from '../Molecules/Canvas/ProceduresNode/ProceduresNode';
import LoopNode, { computeLoopBodyHeight } from '../Molecules/Canvas/LoopNode/LoopNode';
import AddStepButton from './AddStepButton';
import './FlowCanvas.css';
import branchStyles from './BranchPath.module.css';
import collapseStyles from './BranchCollapse.module.css';
import { FLOW_CARD_WIDTH, FLOW_CONNECTOR_GAP, FLOW_STANDARD_NODE_HEIGHT, FLOW_TRIGGER_PLACEHOLDER_HEIGHT } from '../flowLayoutConstants';
import { getDraggingFlowKind, getFlowDragPayload, isDraggingFlowKind } from '../flowDragData';
import { Tooltip } from '../../components/Tooltip/Tooltip';

/* ─── Custom Node Wrappers ─── */
function StartNodeWrapper({ id, data }) {
  const isSelected = id === data.selectedNodeId;
  return (
    <div className="flow-canvas__node-center">
      <StartNode
        title={data.title}
        subtitle={data.subtitle}
        subtitleIsLink={data.subtitleIsLink}
        selected={isSelected}
        onSubtitleClick={data.onSubtitleClick}
      />
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

function TriggerNodeWrapper({ id, data }) {
  const isSelected = id === data.selectedNodeId;
  const [isDropTarget, setIsDropTarget] = useState(false);
  const viewOnly = data?.viewOnly;

  const handleDragOver = useCallback((e) => {
    if (viewOnly || !data?.onDropTriggerReplace) return;
    if (!isDraggingFlowKind(e.dataTransfer, 'trigger')) return;
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
    setIsDropTarget(true);
  }, [viewOnly, data?.onDropTriggerReplace]);

  const handleDragLeave = useCallback(() => {
    setIsDropTarget(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDropTarget(false);
    if (viewOnly || !data?.onDropTriggerReplace) return;
    const { type, label, description } = getFlowDragPayload(e.dataTransfer);
    if (type === 'trigger') {
      data.onDropTriggerReplace(type, label, description);
    }
  }, [viewOnly, data]);

  return (
    <div
      className="flow-canvas__node-center"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <Handle type="target" position={Position.Top} />
      <CanvasNode
        nodeType="trigger"
        label={data.headerLabel || (data.subtype === 'Schedule-based' ? 'Schedule-based trigger' : 'Trigger')}
        runStatus={data.runStatus} hasError={data.hasError}
        stepNumber={data.stepNumber}
        title={data.title}
        description={data.subtitle}
        titlePlaceholder={data.titlePlaceholder}
        descriptionPlaceholder={data.descriptionPlaceholder}
        hasToggle={false}
        toggleEnabled={data.toggleEnabled}
        toggleDisabled={data.viewOnly}
        viewOnly={data.viewOnly}
        state={isDropTarget ? 'drop-target' : (isSelected ? 'selected' : 'default')}
        onDelete={data.onDelete}
        onCopy={data.onCopy}
        hasClipboard={data.hasClipboard}
        onPasteBelow={data.onPasteBelow}
        onPasteReplace={data.onPasteReplace}
        onMoveUp={data.onMoveUp}
        onMoveDown={data.onMoveDown}
        canMoveUp={data.canMoveUp}
        canMoveDown={data.canMoveDown}
      />
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

function TaskNodeWrapper({ id, data }) {
  const isSelected = id === data.selectedNodeId;
  return (
    <div className="flow-canvas__node-center">
      <Handle type="target" position={Position.Top} />
      <CanvasNode nodeType="task" label="Task" runStatus={data.runStatus} hasError={data.hasError} errorTooltip={data.errorTooltip} stepNumber={data.stepNumber} title={data.title} description={data.subtitle} titlePlaceholder={data.titlePlaceholder} descriptionPlaceholder={data.descriptionPlaceholder} hasAiIcon={data.hasAiIcon} hasToggle={data.hasToggle} toggleEnabled={data.toggleEnabled} toggleDisabled={data.viewOnly} viewOnly={data.viewOnly} onToggleChange={data.onToggleChange} state={isSelected ? 'selected' : 'default'} showConfigWarning={!!data.showConfigWarning} configWarningText={data.configWarningText} onDelete={data.onDelete} onCopy={data.onCopy} hasClipboard={data.hasClipboard} onPasteBelow={data.onPasteBelow} onPasteReplace={data.onPasteReplace} onMoveUp={data.onMoveUp} onMoveDown={data.onMoveDown} canMoveUp={data.canMoveUp} canMoveDown={data.canMoveDown} />
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

function VoiceCallNodeWrapper({ id, data }) {
  const isSelected = id === data.selectedNodeId;
  return (
    <div className="flow-canvas__node-center">
      <Handle type="target" position={Position.Top} />
      <CanvasNode nodeType="task" label="Task" runStatus={data.runStatus} hasError={data.hasError} errorTooltip={data.errorTooltip} stepNumber={data.stepNumber} title={data.title} description={data.subtitle} titlePlaceholder={data.titlePlaceholder} descriptionPlaceholder={data.descriptionPlaceholder} hasAiIcon={data.hasAiIcon} hasToggle={data.hasToggle} toggleEnabled={data.toggleEnabled} toggleDisabled={data.viewOnly} viewOnly={data.viewOnly} onToggleChange={data.onToggleChange} state={isSelected ? 'selected' : 'default'} showConfigWarning={!!data.showConfigWarning} configWarningText={data.configWarningText} onDelete={data.onDelete} onCopy={data.onCopy} hasClipboard={data.hasClipboard} onPasteBelow={data.onPasteBelow} onPasteReplace={data.onPasteReplace} onMoveUp={data.onMoveUp} onMoveDown={data.onMoveDown} canMoveUp={data.canMoveUp} canMoveDown={data.canMoveDown} />
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

function BranchNodeWrapper({ id, data }) {
  const isSelected = id === data.selectedNodeId;
  return (
    <div className="flow-canvas__node-center">
      <Handle type="target" position={Position.Top} />
      <CanvasNode nodeType="branch" label="Branch" runStatus={data.runStatus} hasError={data.hasError} stepNumber={data.stepNumber} title={data.title} description={data.subtitle} titlePlaceholder={data.titlePlaceholder} descriptionPlaceholder={data.descriptionPlaceholder} hasToggle={data.hasToggle} toggleEnabled={data.toggleEnabled} toggleDisabled={data.viewOnly} viewOnly={data.viewOnly} hasAddButton={!data.hideAddBranch} onAddClick={data.onAddBranch} state={isSelected ? 'selected' : 'default'} onDelete={data.onDelete} onCopy={data.onCopy} hasClipboard={data.hasClipboard} onPasteBelow={data.onPasteBelow} onPasteReplace={data.onPasteReplace} onMoveUp={data.onMoveUp} onMoveDown={data.onMoveDown} canMoveUp={data.canMoveUp} canMoveDown={data.canMoveDown} />
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

function ControlNodeWrapper({ id, data, nodeType, label }) {
  const isSelected = id === data.selectedNodeId;
  return (
    <div className="flow-canvas__node-center">
      <Handle type="target" position={Position.Top} />
      <CanvasNode
        nodeType={nodeType}
        label={label}
        runStatus={data.runStatus} hasError={data.hasError}
        stepNumber={data.stepNumber}
        title={data.title}
        description={data.subtitle}
        titlePlaceholder={data.titlePlaceholder}
        descriptionPlaceholder={data.descriptionPlaceholder}
        hasToggle={data.hasToggle}
        toggleEnabled={data.toggleEnabled}
        toggleDisabled={data.viewOnly} viewOnly={data.viewOnly}
        state={isSelected ? 'selected' : 'default'}
        onDelete={data.onDelete}
        onCopy={data.onCopy}
        hasClipboard={data.hasClipboard}
        onPasteBelow={data.onPasteBelow}
        onPasteReplace={data.onPasteReplace}
        onMoveUp={data.onMoveUp}
        onMoveDown={data.onMoveDown}
        canMoveUp={data.canMoveUp}
        canMoveDown={data.canMoveDown}
      />
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

function ProceduresNodeWrapper({ id, data }) {
  const isSelected = id === data.selectedNodeId;
  return (
    <div className="flow-canvas__node-center">
      <Handle type="target" position={Position.Top} />
      <ProceduresNode
        stepNumber={data.stepNumber}
        runStatus={data.runStatus} hasError={data.hasError}
        procedureItems={data.procedureItems || []}
        hasToggle={data.hasToggle}
        toggleEnabled={data.toggleEnabled}
        toggleDisabled={data.viewOnly} viewOnly={data.viewOnly}
        state={isSelected ? 'selected' : 'default'}
        onDelete={data.onDelete}
        onCopy={data.onCopy}
        hasClipboard={data.hasClipboard}
        onPasteBelow={data.onPasteBelow}
        onPasteReplace={data.onPasteReplace}
        onMoveUp={data.onMoveUp}
        onMoveDown={data.onMoveDown}
        canMoveUp={data.canMoveUp}
        canMoveDown={data.canMoveDown}
        onToggleChange={data.onToggleChange}
        onDropProcedure={data.onDropProcedure}
        onSelectProcedure={data.onSelectProcedure}
        onRemoveProcedure={data.onRemoveProcedure}
        selectedProcedureId={data.selectedProcedureId}
      />
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

function DelayNodeWrapper(props) {
  return <ControlNodeWrapper {...props} nodeType="delay" label="Delay" />;
}

function ParallelNodeWrapper(props) {
  return <ControlNodeWrapper {...props} nodeType="parallel" label="Parallel tasks" />;
}

function LoopNodeWrapper({ id, data }) {
  const isSelected = id === data.selectedNodeId;
  const loopChildren = data.loopChildren || [];
  const loopFlow = data.loopFlow || [];
  const loopNodeDetails = data.loopNodeDetails || {};
  const loopContainerWidth = data.loopContainerWidth;
  return (
    <div className="flow-canvas__node-center">
      <Handle type="target" position={Position.Top} />
      <LoopNode
        loopNodeId={id}
        stepNumber={data.stepNumber}
        title={data.title}
        description={data.subtitle}
        titlePlaceholder={data.titlePlaceholder}
        descriptionPlaceholder={data.descriptionPlaceholder}
        hasToggle={data.hasToggle}
        toggleEnabled={data.toggleEnabled}
        toggleDisabled={data.viewOnly}
        viewOnly={data.viewOnly}
        loopChildren={loopChildren}
        loopFlow={loopFlow}
        loopNodeDetails={loopNodeDetails}
        loopBodyHeight={data.loopBodyHeight || computeLoopBodyHeight(Math.max(loopChildren.length, 1))}
        loopContainerWidth={loopContainerWidth}
        selectedNodeId={data.selectedNodeId}
        state={isSelected ? 'selected' : 'default'}
        onDelete={data.onDelete}
        onCopy={data.onCopy}
        hasClipboard={data.hasClipboard}
        onPasteBelow={data.onPasteBelow}
        onPasteReplace={data.onPasteReplace}
        onMoveUp={data.onMoveUp}
        onMoveDown={data.onMoveDown}
        canMoveUp={data.canMoveUp}
        canMoveDown={data.canMoveDown}
        onToggleChange={data.onToggleChange}
        onChildClick={data.onChildClick}
        onChildDelete={data.onChildDelete}
        onChildToggleChange={data.onChildToggleChange}
      />
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
    </div>
  );
}

function SubAgentNodeWrapper(props) {
  return <ControlNodeWrapper {...props} nodeType="subagent" label="Sub-agent" />;
}

const BRANCH_CHIP_LABEL_MAX = 24;
const FALLBACK_CHIP_LABEL = 'Fallback branch';
const FALLBACK_CHIP_TOOLTIP =
  'If none of the criteria are met, follow this branch.';
const LEGACY_FALLBACK_CHIP_LABELS = new Set([
  'No conditions met',
  'None met',
  'Fallback',
  'Fallback branch',
  'Fall back branch',
]);

function BranchPathNodeWrapper({ id, data }) {
  const isSelected = id === data.selectedNodeId || id === data.focusBranchPathId;
  const canDelete = !data.viewOnly && !data.isFallback && !data.isVoiceCallBranch && !!data.onDelete;
  const rawLabel = String(data.label ?? '').trim();
  const isFallbackChip = !!data.isFallback || LEGACY_FALLBACK_CHIP_LABELS.has(rawLabel);
  const fullLabel = isFallbackChip ? FALLBACK_CHIP_LABEL : rawLabel;
  const description = isFallbackChip ? '' : String(data.description || '').trim();
  const isTruncated = fullLabel.length > BRANCH_CHIP_LABEL_MAX;
  const displayLabel = isTruncated
    ? `${fullLabel.slice(0, BRANCH_CHIP_LABEL_MAX)}…`
    : fullLabel;
  const collapsed = !!data.collapsed;
  const hiddenCount = data.hiddenCount ?? 0;

  const chipClass = [
    branchStyles.chip,
    isFallbackChip ? branchStyles.chipFallback : '',
    isSelected ? branchStyles.chipSelected : '',
    data.isVoiceCallBranch ? branchStyles.chipNoPointer : '',
  ].filter(Boolean).join(' ');

  const truncatedTooltip = isTruncated ? (
    <span className={branchStyles.tooltipBody}>
      <span className={branchStyles.tooltipTitle}>{fullLabel}</span>
      {description ? (
        <span className={branchStyles.tooltipDescription}>{description}</span>
      ) : null}
    </span>
  ) : null;

  const labelEl = <span className={branchStyles.chipLabel}>{displayLabel}</span>;

  return (
    <div className="flow-canvas__node-center">
      <div className={branchStyles.pathWrapper}>
        <Handle type="target" position={Position.Top} />
        <div className={branchStyles.chipRow}>
          <div className={chipClass}>
            {isFallbackChip ? (
              <Tooltip content={FALLBACK_CHIP_TOOLTIP} variant="detail" side="top">
                {labelEl}
              </Tooltip>
            ) : isTruncated ? (
              <Tooltip content={truncatedTooltip} variant="detail" side="top">
                {labelEl}
              </Tooltip>
            ) : description ? (
              <Tooltip content={description} variant="detail" side="top">
                {labelEl}
              </Tooltip>
            ) : (
              labelEl
            )}
            {hiddenCount > 0 && (
              <Tooltip content={collapsed ? 'Expand branch' : 'Collapse branch'} variant="brief" side="top">
                <button
                  type="button"
                  className={`nodrag nopan ${branchStyles.chipCollapse}`}
                  aria-label={collapsed ? 'Expand branch' : 'Collapse branch'}
                  aria-expanded={!collapsed}
                  onClick={(e) => {
                    e.stopPropagation();
                    data.onToggleCollapse?.();
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  <span className="material-symbols-outlined" aria-hidden>
                    {collapsed ? 'expand_more' : 'expand_less'}
                  </span>
                </button>
              </Tooltip>
            )}
          </div>
          {canDelete && (
            <div className={`nodrag nopan ${branchStyles.hoverActions}`}>
              <Tooltip content="Delete" variant="brief" side="right">
                <button
                  type="button"
                  className={branchStyles.hoverDelete}
                  aria-label="Delete"
                  onClick={(e) => {
                    e.stopPropagation();
                    data.onDelete?.();
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  <span className="material-symbols-outlined" aria-hidden>delete</span>
                </button>
              </Tooltip>
            </div>
          )}
        </div>
        {collapsed && hiddenCount > 0 && (
          <p className={branchStyles.hiddenCount}>{hiddenCount} Tasks hidden</p>
        )}
        <Handle type="source" position={Position.Bottom} style={collapsed ? { opacity: 0 } : undefined} />
      </div>
    </div>
  );
}

function BranchCollapseNodeWrapper({ data }) {
  const collapsed = !!data.collapsed;
  const branchCount = data.branchCount ?? 0;
  const taskCount = data.taskCount ?? 0;
  const label = `${branchCount} Branch • ${taskCount} Tasks hidden`;

  return (
    <div className="flow-canvas__node-center">
      <div className={collapseStyles.wrap}>
        <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
        {collapsed ? (
          <Tooltip content="Expand branch" variant="brief" side="right">
            <button
              type="button"
              className={`nodrag nopan ${collapseStyles.pill}`}
              aria-label="Expand branch"
              aria-expanded={false}
              onClick={(e) => {
                e.stopPropagation();
                data.onToggle?.();
              }}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <span className={collapseStyles.pillLabel}>{label}</span>
              <span className="material-symbols-outlined" aria-hidden>expand_more</span>
            </button>
          </Tooltip>
        ) : (
          <Tooltip content="Collapse branch" variant="brief" side="right">
            <button
              type="button"
              className={`nodrag nopan ${collapseStyles.circle}`}
              aria-label="Collapse branch"
              aria-expanded
              onClick={(e) => {
                e.stopPropagation();
                data.onToggle?.();
              }}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <span className="material-symbols-outlined" aria-hidden>expand_less</span>
            </button>
          </Tooltip>
        )}
        <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
      </div>
    </div>
  );
}

function EndNodeWrapper({ id, data }) {
  const isSelected = id === data.selectedNodeId;
  return (
    <div className="flow-canvas__node-center">
      <Handle type="target" position={Position.Top} />
      <EndNode
        selected={isSelected}
        viewOnly={data.viewOnly}
        isDraggingFromLHS={data.isDraggingFromLHS}
        onDropBeforeEnd={data.onDropBeforeEnd}
        onAddStep={data.onAddStepBeforeEnd}
        product={data.product}
        agentName={data.agentName}
        hideAdd={data.hideAdd}
        hasClipboard={data.hasClipboard}
        onPaste={data.onPasteBeforeEnd}
      />
    </div>
  );
}

function TriggerPlaceholderWrapper({ data }) {
  return (
    <div className="flow-canvas__node-center">
      <Handle type="target" position={Position.Top} />
      <TriggerPlaceholderNode
        isDraggingTrigger={data.isDraggingFromLHS}
        onDropTrigger={data.onDropTrigger}
        product={data.product}
        agentName={data.agentName}
      />
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

function BranchEndNodeWrapper() {
  return (
    <div className="flow-canvas__node-center">
      <div className="flow-canvas__branch-end-wrapper">
        <Handle type="target" position={Position.Top} />
        <div className="flow-canvas__branch-end">
          End
        </div>
      </div>
    </div>
  );
}

/** Collapse tiny X drift so arm connectors stay truly vertical. */
function snapVerticalPair(sourceX, targetX, tolerance = 2) {
  if (Math.abs(targetX - sourceX) <= tolerance) {
    const x = (sourceX + targetX) / 2;
    return { sourceX: x, targetX: x };
  }
  return { sourceX, targetX };
}

/* ─── Custom Edge: main connector with + button ─── */
function AddButtonEdge({ id, source, target, sourceX, sourceY, targetX, targetY, style, data }) {
  const [isDragOver, setIsDragOver] = useState(false);
  const isDraggingFromLHS = data?.isDraggingFromLHS && data?.draggingLhsKind !== 'trigger';
  const viewOnly = data?.viewOnly;

  const snapped = snapVerticalPair(sourceX, targetX);
  const [edgePath, labelX, labelY] = getStraightPath({
    sourceX: snapped.sourceX,
    sourceY,
    targetX: snapped.targetX,
    targetY,
  });

  useEffect(() => {
    if (!isDraggingFromLHS) setIsDragOver(false);
  }, [isDraggingFromLHS]);

  const handleDragOver = useCallback((e) => {
    if (isDraggingFlowKind(e.dataTransfer, 'trigger')) return;
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    // Ignore child-to-child drag transitions within this connector wrapper.
    const next = e.relatedTarget;
    if (next && e.currentTarget.contains(next)) return;
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const { type, label, description } = getFlowDragPayload(e.dataTransfer);
    if (!type || type === 'trigger') return;
    if (data?.onDropOnEdge) {
      data.onDropOnEdge(type, label, description);
    }
  }, [data]);

  const handleSelect = useCallback(({ type, label, description }) => {
    if (type === 'trigger') return;
    data?.onDropOnEdge?.(type, label, description);
  }, [data]);

  const showAddButton = source !== '__start__' && target !== '__end__' && !data?.hideAddButton;

  const isEndEdge = target === '__end__';

  // Grow the connector's drop hit-area whenever a compatible drag is active OR
  // this connector is currently hovered as a drop target. The latter avoids the
  // "Drop here" label being clipped if drag metadata doesn't mark the drag as
  // coming from the LHS.
  const shouldExpandDropZone = isDraggingFromLHS || isDragOver;
  const foW = shouldExpandDropZone ? 320 : 56;
  const foH = shouldExpandDropZone ? 64 : 56;

  return (
    <>
      {!isEndEdge && <BaseEdge id={id} path={edgePath} style={style} />}
      {showAddButton && !viewOnly && (
        <foreignObject width={foW} height={foH} x={labelX - foW / 2} y={labelY - foH / 2} className="flow-canvas__edge-fo">
          <div
            className="flow-canvas__edge-add-wrapper"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <AddStepButton
              isDraggingFromLHS={isDraggingFromLHS}
              isDragOver={isDragOver}
              product={data?.product}
              agentName={data?.agentName}
              onSelect={handleSelect}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              singleSearch={!!data?.singleAddStepSearch}
              showPasteOption={!!data?.hasClipboard && !!data?.betweenCards}
              onPaste={data?.onPasteAtEdge}
            />
          </div>
        </foreignObject>
      )}
    </>
  );
}

/* ─── Custom Edge: branch fan ─── */
function BranchFanEdge({ sourceX, sourceY, targetX, targetY }) {
  // Orthogonal elbow only — never a diagonal. Snap tiny X drift first so the
  // vertical legs stay plumb when source/target share an arm column.
  const snapped = snapVerticalPair(sourceX, targetX);
  const sx = snapped.sourceX;
  const tx = snapped.targetX;
  const gap = targetY - sourceY;
  const midY = gap > 16 ? sourceY + Math.min(48, gap * 0.55) : sourceY + Math.max(gap / 2, 8);
  const d = `M ${sx} ${sourceY} L ${sx} ${midY} L ${tx} ${midY} L ${tx} ${targetY}`;
  return <path d={d} className="flow-canvas__branch-fan" fill="none" />;
}

function StraightEdge({ id, sourceX, sourceY, targetX, targetY, style }) {
  const snapped = snapVerticalPair(sourceX, targetX);
  const [edgePath] = getStraightPath({
    sourceX: snapped.sourceX,
    sourceY,
    targetX: snapped.targetX,
    targetY,
  });
  return <BaseEdge id={id} path={edgePath} style={style ?? { stroke: '#ccd5e4', strokeWidth: 1 }} />;
}

/* ─── Stable maps ─── */
const NODE_TYPES = {
  start: StartNodeWrapper,
  trigger: TriggerNodeWrapper,
  task: TaskNodeWrapper,
  voiceCall: VoiceCallNodeWrapper,
  branch: BranchNodeWrapper,
  delay: DelayNodeWrapper,
  parallel: ParallelNodeWrapper,
  loop: LoopNodeWrapper,
  subagent: SubAgentNodeWrapper,
  procedures: ProceduresNodeWrapper,
  branchPath: BranchPathNodeWrapper,
  branchCollapse: BranchCollapseNodeWrapper,
  branchEnd: BranchEndNodeWrapper,
  triggerPlaceholder: TriggerPlaceholderWrapper,
  end: EndNodeWrapper,
};

const EDGE_TYPES = {
  addButton: AddButtonEdge,
  branchFan: BranchFanEdge,
  straight: StraightEdge,
};

/* ─── Main FlowCanvas ─── */
// Nodes are positioned purely by buildFlow() — no canvas drag-to-reorder.
// This matches Zapier/n8n's fixed-layout model and eliminates all the
// localNodes sync complexity that was causing diagonal lines and ghost buttons.
function FlowCanvasInner({
  nodes = [],
  edges = [],
  onNodeClick,
  onDropNode,
  orientation = 'vertical',
  onOrientationChange,
  onRun,
  onEdit,
  onView,
  selectedNodeId,
  viewOnly = false,
  product = 'healthcare',
  agentName = '',
  rrChrome = false,
  initialZoom = 1,
  runDisabled = false,
  hasClipboard = false,
  onPasteAtConnector,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  /** Add-step "+" menu uses one full-width search instead of one per pane (Sep 1 only). */
  singleAddStepSearch = false,
  /** When set, the Help center trigger renders as its own pill in the bottom editor row
   * instead of the top-right floater (exploration only). */
  onHelpToggle = null,
  helpOpen = false,
  /** Node id to pan into view — used by the test run to follow the executing card. */
  focusNodeId = null,
}) {
  const { zoomTo, fitView, setCenter, setViewport, getViewport, getNodes } = useReactFlow();
  const [zoom, setZoom] = useState(Math.round(initialZoom * 100));
  const [isDraggingFromLHS, setIsDraggingFromLHS] = useState(false);
  const [draggingLhsKind, setDraggingLhsKind] = useState(null);
  const canvasRef = useRef(null);
  const initialPositioned = useRef(false);

  const onDropNodeRef = useRef(onDropNode);
  useEffect(() => { onDropNodeRef.current = onDropNode; }, [onDropNode]);

  const onPasteAtConnectorRef = useRef(onPasteAtConnector);
  useEffect(() => { onPasteAtConnectorRef.current = onPasteAtConnector; }, [onPasteAtConnector]);

  // Pan the executing test-run node into view, keeping the user's current zoom.
  useEffect(() => {
    if (!focusNodeId) return;
    const node = getNodes().find((n) => n.id === focusNodeId);
    if (!node) return;
    const w = node.measured?.width ?? node.width ?? 0;
    const h = node.measured?.height ?? node.height ?? 0;
    setCenter(node.position.x + w / 2, node.position.y + h / 2, {
      zoom: getViewport().zoom,
      duration: 700,
    });
  }, [focusNodeId, getNodes, setCenter, getViewport]);

  const endEdgeSourceId = useMemo(
    () => edges.find((e) => e.target === '__end__')?.source ?? null,
    [edges],
  );

  // Enrich nodes with selectedNodeId — positions come directly from buildFlow,
  // no local state needed because nodes never move on the canvas.
  const styledNodes = useMemo(
    () => nodes.map((n) => ({
      ...n,
      // XYFlow keeps nodes `visibility:hidden` until both width and height are known
      // (`nodeHasDimensions`). Without seeds, newly dropped cards never paint — and with
      // the start node hidden on exploration scratch, the canvas looks empty.
      initialWidth: n.initialWidth ?? n.width ?? (
        n.type === 'branchCollapse' ? 40 : FLOW_CARD_WIDTH
      ),
      initialHeight: n.initialHeight ?? n.height ?? (
        n.type === 'triggerPlaceholder' ? FLOW_TRIGGER_PLACEHOLDER_HEIGHT
          : n.type === 'branchCollapse' ? 36
            : n.type === 'branchPath' ? 40
              : n.type === 'end' || n.type === 'branchEnd' ? 102
                : FLOW_STANDARD_NODE_HEIGHT
      ),
      data: {
        ...n.data,
        selectedNodeId,
        viewOnly,
        // The trigger placeholder pulses only for trigger drags; every other node (incl. the
        // End "+") pulses only for non-trigger step drags.
        isDraggingFromLHS: n.type === 'triggerPlaceholder'
          ? (isDraggingFromLHS && draggingLhsKind === 'trigger')
          : (isDraggingFromLHS && draggingLhsKind !== 'trigger'),
        product,
        agentName,
        // Inject click handler for inline nodes rendered inside loop containers.
        ...(n.type === 'loop' ? {
          onChildClick: (childId) => onNodeClick?.({ id: childId, type: 'task', data: {} }),
        } : {}),
        ...(n.type === 'triggerPlaceholder' && !viewOnly
          ? {
              onDropTrigger: (type, label, description) => {
                onDropNodeRef.current?.({
                  type,
                  label,
                  description,
                  afterNodeId: '__start__',
                });
              },
            }
          : {}),
        ...(n.type === 'trigger' && !viewOnly
          ? {
              onDropTriggerReplace: (type, label, description) => {
                onDropNodeRef.current?.({
                  type,
                  label,
                  description,
                  replaceTrigger: true,
                });
              },
            }
          : {}),
        ...(n.id === '__end__' && !viewOnly && !n.data?.hideAddBeforeEnd
          ? {
              onDropBeforeEnd: (type, label, description) => {
                onDropNodeRef.current?.({
                  type,
                  label,
                  description,
                  afterNodeId: n.data?.afterNodeId ?? endEdgeSourceId,
                });
              },
              onAddStepBeforeEnd: ({ type, label, description }) => {
                onDropNodeRef.current?.({
                  type,
                  label,
                  description,
                  afterNodeId: n.data?.afterNodeId ?? endEdgeSourceId,
                });
              },
              hasClipboard,
              onPasteBeforeEnd: () => {
                onPasteAtConnectorRef.current?.(n.data?.afterNodeId ?? endEdgeSourceId);
              },
            }
          : {}),
        ...(n.id === '__end__' ? { hideAdd: !!n.data?.hideAddBeforeEnd } : {}),
      },
    })),
    [nodes, selectedNodeId, viewOnly, isDraggingFromLHS, draggingLhsKind, endEdgeSourceId, onNodeClick, product, agentName, hasClipboard]
  );

  // Pin the flow entry 24px below the controls bar, horizontally centered in the
  // *visible* canvas (excluding absolute RHS / left palette overlays), at the
  // configured initial zoom (default 1). Prefer the start card when present;
  // otherwise the trigger placeholder / first trigger (exploration hides start).
  // Controls: top=8px + height≈52px → bottom≈60px → target top = 60+24 = 84px.
  const getVisibleCenterX = useCallback((canvas) => {
    const canvasRect = canvas.getBoundingClientRect();
    const width = canvasRect.width;
    const rhs = canvas.closest('.agent-builder')?.querySelector('.agent-builder__rhs');
    const palette = canvas.closest('.agent-builder')?.querySelector(
      '.rr-chrome-palette, .agent-builder__lhs-ai',
    );
    let leftClip = 0;
    let rightClip = 0;
    if (palette) {
      const pr = palette.getBoundingClientRect();
      leftClip = Math.max(0, Math.min(width, pr.right - canvasRect.left));
    }
    if (rhs) {
      const rr = rhs.getBoundingClientRect();
      rightClip = Math.max(0, Math.min(width, canvasRect.right - rr.left));
    }
    const visibleWidth = Math.max(120, width - leftClip - rightClip);
    return leftClip + visibleWidth / 2;
  }, []);

  const positionToStart = useCallback(() => {
    const entryNode =
      nodes.find((n) => n.type === 'start') ||
      nodes.find((n) => n.type === 'triggerPlaceholder') ||
      nodes.find((n) => n.type === 'trigger') ||
      nodes[0];
    const canvas = canvasRef.current;
    if (!entryNode || !canvas) return;
    setViewport(
      {
        x: getVisibleCenterX(canvas) - entryNode.position.x * initialZoom,
        y: 84 - entryNode.position.y * initialZoom,
        zoom: initialZoom,
      },
      { duration: 0 },
    );
  }, [nodes, setViewport, initialZoom, getVisibleCenterX]);

  // Run once on initial load. Do not re-pin when nodes are later added/removed
  // (e.g. branch expand/collapse) — the viewport should stay where the user left it.
  useEffect(() => {
    if (initialPositioned.current || !nodes.length) return;
    const timer = setTimeout(() => {
      positionToStart();
      initialPositioned.current = true;
    }, 80);
    return () => clearTimeout(timer);
  }, [nodes.length, positionToStart]);

  // Keep the flow horizontally centered in the visible area whenever the canvas
  // container resizes (LHS drawer collapse/expand, RHS panel open/close, window
  // resize). CSS transitions the LHS width, so ResizeObserver fires continuously
  // through the animation, keeping the canvas centered as the panel moves.
  // Also watch the agent-builder shell: the RHS is absolutely positioned so it
  // does not change canvas width — MutationObserver catches overlay open/close.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const shell = canvas.closest('.agent-builder');
    const recenter = () => {
      if (!initialPositioned.current) return;
      requestAnimationFrame(() => {
        const { y, zoom: currentZoom } = getViewport();
        setViewport({ x: getVisibleCenterX(canvas), y, zoom: currentZoom }, { duration: 0 });
      });
    };
    const observer = new ResizeObserver(recenter);
    observer.observe(canvas);
    let mutationObserver;
    if (shell) {
      // RHS is a direct child of .agent-builder (absolute overlay). Watching only
      // childList avoids re-centering on every keystroke inside the panel.
      mutationObserver = new MutationObserver(recenter);
      mutationObserver.observe(shell, { childList: true, subtree: false });
    }
    return () => {
      observer.disconnect();
      mutationObserver?.disconnect();
    };
  }, [getViewport, setViewport, getVisibleCenterX]);

  // Detect LHS drag start/end (HTML5 drag API).
  // Do NOT clear on pointerup — it fires before `drop` and a re-render can
  // unmount/move the drop target so the trigger never lands.
  useEffect(() => {
    const clearDragging = () => {
      // Defer so the target's own `drop` handler runs first.
      requestAnimationFrame(() => {
        setIsDraggingFromLHS(false);
        setDraggingLhsKind(null);
      });
    };
    const onDragStart = (e) => {
      if (e.dataTransfer?.types?.includes('application/reactflow-type')) {
        setIsDraggingFromLHS(true);
        setDraggingLhsKind(getDraggingFlowKind(e.dataTransfer));
      }
    };
    document.addEventListener('dragstart', onDragStart);
    document.addEventListener('dragend', clearDragging);
    // Clear on `drop` too (capture phase) so the "+" reverts to white the instant
    // a node lands. `dragend` alone is unreliable here — the canvas re-renders when
    // the node is added, so the source's dragend can be missed. Capture fires before
    // the edge/placeholder/end drop handlers' stopPropagation(), and the rAF in
    // clearDragging lets those handlers land the node first.
    document.addEventListener('drop', clearDragging, true);
    window.addEventListener('blur', clearDragging);
    return () => {
      document.removeEventListener('dragstart', onDragStart);
      document.removeEventListener('dragend', clearDragging);
      document.removeEventListener('drop', clearDragging, true);
      window.removeEventListener('blur', clearDragging);
    };
  }, []);

  const defaultEdgeOptions = useMemo(
    () => ({ type: 'addButton', style: { stroke: '#ccd5e4', strokeWidth: 1 } }),
    []
  );

  const handleNodeClick = useCallback(
    (event, node) => {
      if (event.target.closest('.cnh__toggle')) return;
      // No handler means the canvas is non-interactive (e.g. a read-only log run) — bail before
      // the recentre below, which would otherwise pan on every click for no reason.
      if (!onNodeClick) return;
      onNodeClick(node);
      // Read layout after React has flushed the re-render (RHS panel may open).
      // Using rAF gives us the post-layout width / overlay rects.
      requestAnimationFrame(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const { y, zoom: currentZoom } = getViewport();
        setViewport({ x: getVisibleCenterX(canvas), y, zoom: currentZoom }, { duration: 300 });
      });
    },
    [onNodeClick, getViewport, setViewport, getVisibleCenterX]
  );

  const handleDragOver = useCallback((event) => {
    // Some drag sources don't reliably trigger our document-level dragstart hook.
    // Promote to "active flow drag" as soon as we see our MIME type on canvas.
    if (event.dataTransfer?.types?.includes('application/reactflow-type')) {
      if (!isDraggingFromLHS) setIsDraggingFromLHS(true);
      if (!draggingLhsKind) setDraggingLhsKind(getDraggingFlowKind(event.dataTransfer) || 'task');
    }

    // Allow dropping a trigger on the empty canvas (no trigger yet); otherwise
    // only non-trigger kinds may land on free canvas / mid-flow.
    if (isDraggingFlowKind(event.dataTransfer, 'trigger')) {
      const hasTrigger = getNodes().some((n) => n.type === 'trigger');
      if (hasTrigger) return;
    }
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
  }, [getNodes, isDraggingFromLHS, draggingLhsKind]);

  // Canvas-wide drop — skip if landed inside a foreignObject (edge buttons handle their own drops)
  const handleDrop = useCallback(
    (event) => {
      event.preventDefault();
      if (event.target.closest('foreignObject')) return;
      // Dropped on the dedicated trigger placeholder — it handles its own drop.
      if (event.target.closest('.trigger-placeholder')) return;

      const type = event.dataTransfer.getData('application/reactflow-type');
      const label = event.dataTransfer.getData('application/reactflow-label');
      const description = event.dataTransfer.getData('application/reactflow-description');
      if (!type) return;

      // Triggers may only land when no trigger exists yet (empty slot). Accept a
      // canvas-level drop as a fallback if the placeholder miss-fires.
      if (type === 'trigger') {
        const hasTrigger = getNodes().some((n) => n.type === 'trigger');
        if (hasTrigger) return;
        onDropNodeRef.current?.({
          type,
          label,
          description,
          afterNodeId: '__start__',
        });
        return;
      }

      const dropY = event.clientY; // screen Y — no coordinate conversion needed

      // Get actual DOM positions of main-axis nodes via getBoundingClientRect.
      // This is zoom/pan independent — we compare screen pixels to screen pixels.
      const MAIN_TYPES = ['trigger', 'task', 'voiceCall', 'branch', 'subagent', 'delay', 'parallel', 'loop', 'procedures'];
      const allNodes = getNodes();

      const mainNodeDoms = allNodes
        .filter((n) => MAIN_TYPES.includes(n.type) && Math.abs(n.position.x) <= 50)
        .sort((a, b) => a.position.y - b.position.y)
        .map((n) => ({
          id: n.id,
          el: document.querySelector(`.react-flow__node[data-id="${n.id}"]`),
        }))
        .filter((n) => n.el !== null);

      let afterNodeId = null;
      let insertAtBeginning = false;

      if (mainNodeDoms.length > 0) {
        const firstRect = mainNodeDoms[0].el.getBoundingClientRect();

        if (dropY < firstRect.top + firstRect.height / 2) {
          // Dropped above the midpoint of the first node → insert at beginning
          insertAtBeginning = true;
        } else {
          let insertIndex = mainNodeDoms.length; // default: after last node
          for (let i = 0; i < mainNodeDoms.length - 1; i++) {
            const bottomOfCurrent = mainNodeDoms[i].el.getBoundingClientRect().bottom;
            const topOfNext = mainNodeDoms[i + 1].el.getBoundingClientRect().top;
            const gapMid = (bottomOfCurrent + topOfNext) / 2;
            if (dropY < gapMid) {
              insertIndex = i + 1;
              break;
            }
          }
          afterNodeId = mainNodeDoms[insertIndex - 1].id;
        }
      }
      // Empty flow: afterNodeId=null, insertAtBeginning=false → append (only valid spot)

      onDropNodeRef.current?.({ type, label, description, afterNodeId, insertAtBeginning });
    },
    [getNodes]
  );

  const styledEdges = useMemo(
    () =>
      edges.map((edge) => ({
        ...edge,
        data: {
          ...edge.data,
          isDraggingFromLHS,
          draggingLhsKind,
          viewOnly,
          product,
          agentName,
          hasClipboard,
          singleAddStepSearch,
          onDropOnEdge: viewOnly ? undefined : (type, label, description) => {
            if (type === 'trigger') return;
            onDropNodeRef.current?.({
              type,
              label,
              description,
              afterNodeId: edge.data?.afterNodeId ?? edge.source,
              branchPathId: edge.data?.branchPathId,
            });
          },
          onPasteAtEdge: (viewOnly || !edge.data?.betweenCards) ? undefined : () => {
            onPasteAtConnectorRef.current?.(edge.data?.afterNodeId ?? edge.source);
          },
        },
      })),
    [edges, isDraggingFromLHS, draggingLhsKind, viewOnly, product, agentName, hasClipboard, singleAddStepSearch]
  );

  const handleViewportChange = useCallback(({ zoom: z }) => {
    setZoom(Math.round(z * 100));
  }, []);

  return (
    <div
      ref={canvasRef}
      className={`flow-canvas${isDraggingFromLHS ? ' flow-canvas--lhs-dragging' : ''}`}
      style={{
        '--flow-connector-gap': `${FLOW_CONNECTOR_GAP}px`,
      }}
      onDragOver={viewOnly ? undefined : handleDragOver}
      onDrop={viewOnly ? undefined : handleDrop}
    >
      <div className={`flow-canvas__toolbar-anchor${rrChrome ? ' flow-canvas__toolbar-anchor--rr-chrome' : ''}`}>
        <GraphControls
          orientation={orientation}
          onOrientationChange={onOrientationChange}
          onRun={onRun}
          onEdit={onEdit}
          onView={onView}
          zoom={zoom}
          onZoomSelect={(z) => zoomTo(z, { duration: 200 })}
          onFillView={() => { fitView({ padding: 0.08, duration: 200 }); }}
          onFitView={() => { positionToStart(); }}
          viewOnly={viewOnly}
          runDisabled={runDisabled}
          agentName={agentName}
          rrChrome={rrChrome}
          onUndo={onUndo}
          onRedo={onRedo}
          canUndo={canUndo}
          canRedo={canRedo}
          onHelpToggle={onHelpToggle}
          helpOpen={helpOpen}
        />
      </div>

      <ReactFlow
        nodes={styledNodes}
        edges={styledEdges}
        nodeTypes={NODE_TYPES}
        edgeTypes={EDGE_TYPES}
        defaultEdgeOptions={defaultEdgeOptions}
        onNodeClick={handleNodeClick}
        onViewportChange={handleViewportChange}
        defaultViewport={{ x: 0, y: 84, zoom: initialZoom }}
        nodeOrigin={[0.5, 0]}
        proOptions={{ hideAttribution: true }}
        nodesDraggable={false}
        nodesConnectable={false}
        panOnScroll
        zoomOnScroll
      />
    </div>
  );
}

export default function FlowCanvas({ onNodesReorder: _ignored, ...props }) {
  // Wrap with ReactFlowProvider so useReactFlow() hooks inside FlowCanvasInner work correctly.
  return (
    <ReactFlowProvider>
      <FlowCanvasInner {...props} />
    </ReactFlowProvider>
  );
}
