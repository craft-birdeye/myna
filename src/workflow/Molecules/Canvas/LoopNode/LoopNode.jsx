import React, { useState, useEffect } from 'react';
import { useDroppable } from '@dnd-kit/core';
import CanvasNode from '../CanvasNode/CanvasNode';
import CanvasNodeHeader from '../CanvasNodeHeader/CanvasNodeHeader';
import CanvasNodeBody from '../CanvasNodeBody/CanvasNodeBody';
import { useFlowDndState } from '../../../FlowCanvas/FlowDndContext';
import '../CanvasNode/CanvasNode.css';
import '../EndNode/EndNode.css';
import {
  FLOW_CONNECTOR_GAP,
  FLOW_STANDARD_NODE_HEIGHT,
} from '../../../flowLayoutConstants';
import styles from './LoopNode.module.css';

export const CONTAINER_W = 860;
const CENTER_X = CONTAINER_W / 2;

/** @deprecated Loop children are laid out inside LoopNode — kept for imports */
export const LOOP_CHILD_X = CONTAINER_W / 4;

export const LOOP_LAYOUT = {
  CARD_H: 94,
  TOP_CONNECTOR_H: 60,
  LOOP_BODY_TOP: 154,
  LOOP_BODY_PAD: 24,
  BTM_CONNECTOR_H: 72,
};

const R = 8;

export function computeLoopBodyHeight(childCount = 1) {
  const count = Math.max(childCount, 1);
  const { LOOP_BODY_PAD } = LOOP_LAYOUT;
  return (
    LOOP_BODY_PAD * 2
    + count * FLOW_STANDARD_NODE_HEIGHT
    + count * FLOW_CONNECTOR_GAP
  );
}

export function computeLoopCanvasHeight(childCount = 1) {
  const { CARD_H, TOP_CONNECTOR_H, BTM_CONNECTOR_H } = LOOP_LAYOUT;
  return CARD_H + TOP_CONNECTOR_H + computeLoopBodyHeight(childCount) + BTM_CONNECTOR_H;
}

export const LOOP_NODE_CANVAS_HEIGHT = computeLoopCanvasHeight(1);

function LoopFrameSvg({ height, width = CONTAINER_W }) {
  const w = width;
  const h = height;
  const cx = w / 2;

  const dashedTop = `M 0 0 L ${cx} 0`;
  const dashedLeft = `M 0 0 L 0 ${h}`;
  const dashedBottom = `M 0 ${h} L ${cx} ${h}`;
  const entryArrow = `M ${cx} 0 L ${cx} 20`;

  const solidPath = `
    M ${cx} 0
    L ${w - R} 0
    Q ${w} 0 ${w} ${R}
    L ${w} ${h - R}
    Q ${w} ${h} ${w - R} ${h}
    L ${cx} ${h}
  `;

  return (
    <svg
      className={styles.loopSvg}
      viewBox={`0 0 ${w} ${h}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      style={{ pointerEvents: 'none' }}
    >
      <defs>
        <marker
          id="loop-arrow-down"
          markerWidth="6"
          markerHeight="6"
          refX="3"
          refY="3"
          orient="auto"
        >
          <path d="M0,0 L6,3 L0,6 Z" fill="#b8c6e0" />
        </marker>
      </defs>

      <path d={dashedTop} stroke="#b8c6e0" strokeWidth="1.5" strokeDasharray="6 4" strokeLinecap="round" />
      <path d={dashedLeft} stroke="#b8c6e0" strokeWidth="1.5" strokeDasharray="6 4" strokeLinecap="round" />
      <path d={dashedBottom} stroke="#b8c6e0" strokeWidth="1.5" strokeDasharray="6 4" strokeLinecap="round" />
      <path d={entryArrow} stroke="#b8c6e0" strokeWidth="1.5" strokeLinecap="round" markerEnd="url(#loop-arrow-down)" />
      <path d={solidPath} stroke="#ccd5e4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LoopConnector({
  connectorId,
  loopBodyId,
  afterNodeId,
  viewOnly = false,
  showAdd = true,
  isDropHighlight = false,
}) {
  const { isDraggingFromLHS } = useFlowDndState();
  const { setNodeRef, isOver } = useDroppable({
    id: connectorId,
    disabled: viewOnly || !connectorId,
    data: {
      loopBodyId,
      afterNodeId: afterNodeId ?? null,
    },
  });

  const addClass = [
    styles.connectorAdd,
    isDraggingFromLHS ? styles.connectorAddPulse : '',
    (isOver || isDropHighlight) ? styles.connectorAddOver : '',
  ].filter(Boolean).join(' ');

  return (
    <div
      ref={setNodeRef}
      className={`${styles.connector}${isOver ? ` ${styles.connectorOver}` : ''}`}
    >
      <div className={styles.connectorLine} aria-hidden />
      {showAdd && !viewOnly && (
        <button type="button" className={addClass} tabIndex={-1}>
          <span className="material-symbols-outlined">add</span>
        </button>
      )}
    </div>
  );
}

// ─── Inline flow helpers for rendering branch nodes inside LoopNode ───────────

const INLINE_CARD_W = 400;
const INLINE_ARM_GAP = 80;
const INLINE_CONN_H = 48;        // connector between sequential nodes
const INLINE_BRANCH_CONN_H = 48; // connector from branch card → chips, and chips → content
const INLINE_EMPTY_ARM_W = 160;  // empty branch arm (chip only)

/** Recursively compute the pixel width needed to render an arm's content. */
function computeArmWidth(nodes, nodeDetails) {
  if (!nodes || nodes.length === 0) return INLINE_EMPTY_ARM_W;
  let maxW = INLINE_CARD_W;
  for (const node of nodes) {
    if (node.flowType === 'branch' || node.flowType === 'voiceCall') {
      const branches = (nodeDetails?.[node.id]?.branches) || [];
      if (branches.length === 0) continue;
      const armWs = branches.map(b => computeArmWidth(nodeDetails?.[b.id]?.nodes || [], nodeDetails));
      const totalW = armWs.reduce((s, w) => s + w, 0) + (branches.length - 1) * INLINE_ARM_GAP;
      maxW = Math.max(maxW, totalW);
    }
  }
  return maxW;
}

function nodeTypeLabel(flowType) {
  return { task: 'Task', delay: 'Delay', voiceCall: 'Voice call', branch: 'Branch' }[flowType] || 'Task';
}

function InlineConnLine({ height = INLINE_CONN_H }) {
  return (
    <div style={{
      width: 1, background: '#ccd5e4', height,
      margin: '0 auto', flexShrink: 0,
    }} />
  );
}

function InlineBranchChip({ name, isFallback }) {
  return (
    <div style={{
      minWidth: 120, height: 32, borderRadius: 4,
      border: `1px solid ${isFallback ? '#dde3ef' : '#c5d0e6'}`,
      background: '#fff', display: 'flex', alignItems: 'center',
      gap: 6, padding: '0 12px', fontSize: 13,
      fontFamily: 'Roboto, sans-serif', color: '#212121', whiteSpace: 'nowrap', flexShrink: 0,
    }}>
      <span className="material-symbols-outlined" style={{ fontSize: 14, width: 14, color: '#4b6cb7', fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 20" }}>
        call_split
      </span>
      <span>{name}</span>
    </div>
  );
}

function InlineEndChip() {
  return <span className="end-node" style={{ flexShrink: 0 }}>End</span>;
}

function InlineFlowNodeList({ nodes, nodeDetails, selectedNodeId, onNodeClick }) {
  if (!nodes || nodes.length === 0) return null;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {nodes.map((node, i) => (
        <React.Fragment key={node.id}>
          {i > 0 && <InlineConnLine height={INLINE_CONN_H} />}
          <InlineFlowNode node={node} nodeDetails={nodeDetails} selectedNodeId={selectedNodeId} onNodeClick={onNodeClick} />
        </React.Fragment>
      ))}
    </div>
  );
}

function InlineFlowNode({ node, nodeDetails, selectedNodeId, onNodeClick }) {
  const details = nodeDetails?.[node.id] || {};
  const isSelected = selectedNodeId === node.id;
  const isBranch = node.flowType === 'branch' || node.flowType === 'voiceCall';
  const title = details.taskName ?? details.triggerName ?? details.loopName ?? node.data?.title ?? '';
  const subtitle = details.description ?? node.data?.subtitle ?? '';
  const branches = isBranch ? (details.branches || []) : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
      <div
        style={{ width: INLINE_CARD_W, flexShrink: 0 }}
        onClick={e => { e.stopPropagation(); onNodeClick?.(node.id); }}
      >
        <CanvasNode
          nodeType={node.flowType}
          label={nodeTypeLabel(node.flowType)}
          stepNumber={node.data?.stepNumber}
          title={title}
          description={subtitle}
          titlePlaceholder={node.data?.titlePlaceholder}
          descriptionPlaceholder={node.data?.descriptionPlaceholder}
          hasToggle={node.data?.hasToggle ?? false}
          toggleEnabled={node.data?.toggleEnabled ?? true}
          viewOnly
          state={isSelected ? 'selected' : 'default'}
        />
      </div>

      {isBranch && branches.length > 0 && (() => {
        // Compute exact column widths recursively so nested branches never overflow.
        const armWidths = branches.map(b =>
          computeArmWidth(nodeDetails?.[b.id]?.nodes || [], nodeDetails)
        );
        const firstW = armWidths[0];
        const lastW  = armWidths[armWidths.length - 1];

        return (
          <>
            {/* Connector from card down to horizontal bar */}
            <InlineConnLine height={INLINE_BRANCH_CONN_H} />

            {/* Branch row — horizontal bar from first-arm-center to last-arm-center */}
            <div style={{ position: 'relative', display: 'flex', flexDirection: 'row', gap: INLINE_ARM_GAP, alignItems: 'flex-start' }}>
              {branches.length > 1 && (
                <div style={{
                  position: 'absolute', top: 0,
                  left: firstW / 2, right: lastW / 2,
                  height: 1, background: '#ccd5e4',
                  pointerEvents: 'none',
                }} />
              )}

              {branches.map((branch, idx) => {
                const armNodes = nodeDetails?.[branch.id]?.nodes || [];
                const armW = armWidths[idx];
                return (
                  <div key={branch.id} style={{
                    width: armW, flexShrink: 0,
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    overflow: 'visible',  // nested branches can spread beyond this column
                  }}>
                    <InlineConnLine height={INLINE_BRANCH_CONN_H} />
                    <div
                      onClick={e => { e.stopPropagation(); onNodeClick?.(branch.id); }}
                      style={{ cursor: 'pointer' }}
                    >
                      <InlineBranchChip name={branch.name} isFallback={!!branch.isFallback} />
                    </div>
                    {armNodes.length > 0 && (
                      <>
                        <InlineConnLine height={INLINE_BRANCH_CONN_H} />
                        <InlineFlowNodeList nodes={armNodes} nodeDetails={nodeDetails} selectedNodeId={selectedNodeId} onNodeClick={onNodeClick} />
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        );
      })()}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export default function LoopNode({
  loopNodeId,
  stepNumber,
  title,
  description,
  titlePlaceholder = 'For each loop',
  descriptionPlaceholder = 'Repeat the following tasks for each theme',
  loopChildren = [],
  loopFlow = [],
  loopNodeDetails = {},
  loopBodyHeight = computeLoopBodyHeight(1),
  loopContainerWidth,
  afterLoopConnectorId,
  selectedNodeId,
  hasToggle = false,
  toggleEnabled = true,
  toggleDisabled = false,
  viewOnly = false,
  onToggleChange,
  onDelete,
  onCopy = undefined,
  hasClipboard = false,
  onPasteBelow = undefined,
  onPasteReplace = undefined,
  onMoveUp,
  onMoveDown,
  canMoveUp = false,
  canMoveDown = false,
  onChildClick,
  onChildDelete,
  onChildToggleChange,
  state = 'default',
}) {
  const [on, setOn] = useState(toggleEnabled);
  useEffect(() => { setOn(toggleEnabled); }, [toggleEnabled]);

  const handleToggle = (val) => {
    if (toggleDisabled) return;
    setOn(val);
    onToggleChange?.(val);
  };

  // For inline flow: measure actual content height so "Loop completes" sits snugly below content
  const contentRef = React.useRef(null);
  const [measuredBodyH, setMeasuredBodyH] = useState(loopBodyHeight);
  useEffect(() => {
    if (loopFlow.length > 0 && contentRef.current) {
      const h = contentRef.current.scrollHeight + 48; // 24px top+bottom padding
      setMeasuredBodyH(h);
    } else {
      setMeasuredBodyH(loopBodyHeight);
    }
  }, [loopFlow.length, loopBodyHeight, loopNodeDetails]);

  const effectiveBodyH = loopFlow.length > 0 ? measuredBodyH : loopBodyHeight;
  const containerW = loopContainerWidth || CONTAINER_W;
  const cardMarginLeft = (containerW - 400) / 2; // center the 400px card
  const topConnectorLeft = containerW / 2;

  const isOff = hasToggle && !on;
  const stateClass = state !== 'default' ? ` canvas-node--${state}` : '';
  const canvasHeight = LOOP_LAYOUT.CARD_H + LOOP_LAYOUT.TOP_CONNECTOR_H + effectiveBodyH + LOOP_LAYOUT.BTM_CONNECTOR_H;
  const bottomExitTop = LOOP_LAYOUT.LOOP_BODY_TOP + effectiveBodyH;

  const { setNodeRef: setAfterLoopRef, isOver: isAfterLoopOver } = useDroppable({
    id: afterLoopConnectorId || `connector-after-loop-${loopNodeId}`,
    disabled: viewOnly || !afterLoopConnectorId,
    data: { afterNodeId: loopNodeId },
  });

  const { isDraggingFromLHS } = useFlowDndState();

  const afterLoopAddClass = [
    styles.connectorAdd,
    isDraggingFromLHS ? styles.connectorAddPulse : '',
    isAfterLoopOver ? styles.connectorAddOver : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={styles.root} style={{ width: containerW }}>
      <div className={`canvas-node${stateClass} ${styles.card}`} style={{ marginLeft: cardMarginLeft }}>
        <CanvasNodeHeader
          nodeType="loop"
          label="Loop"
          hasToggle={hasToggle}
          toggleEnabled={on}
          toggleDisabled={toggleDisabled}
          viewOnly={viewOnly}
          onToggleChange={handleToggle}
          onDelete={onDelete}
          onCopy={onCopy}
          hasClipboard={hasClipboard}
          onPasteBelow={onPasteBelow}
          onPasteReplace={onPasteReplace}
          onMoveUp={onMoveUp}
          onMoveDown={onMoveDown}
          canMoveUp={canMoveUp}
          canMoveDown={canMoveDown}
        />
        <div className={isOff ? 'canvas-node__body--disabled' : undefined}>
          <CanvasNodeBody
            nodeType="loop"
            stepNumber={stepNumber}
            title={title}
            description={description}
            titlePlaceholder={titlePlaceholder}
            descriptionPlaceholder={descriptionPlaceholder}
          />
        </div>
      </div>

      <div
        className={styles.topConnector}
        style={{ left: topConnectorLeft }}
        aria-hidden
      />

      <div className={styles.loopBody} style={{ height: effectiveBodyH, width: containerW }}>
        <LoopFrameSvg height={effectiveBodyH} width={containerW} />
        {loopFlow.length > 0 ? (
          <div
            ref={contentRef}
            className="nodrag nopan"
            onClick={e => e.stopPropagation()}
            style={{
              position: 'relative',
              padding: '24px 24px 0 24px',
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              overflow: 'visible',
              zIndex: 1,
            }}
          >
            <InlineFlowNodeList
              nodes={loopFlow}
              nodeDetails={loopNodeDetails}
              selectedNodeId={selectedNodeId}
              onNodeClick={onChildClick}
            />
          </div>
        ) : (
          <div className={`${styles.loopBodyContent} nodrag nopan`}>
            {loopChildren.map((child, index) => {
              const isChildSelected = selectedNodeId === child.id;
              return (
                <React.Fragment key={child.id}>
                  <div
                    className={styles.loopChild}
                    onClick={(e) => {
                      e.stopPropagation();
                      onChildClick?.(child.id);
                    }}
                  >
                    <CanvasNode
                      nodeType="task"
                      label="Task"
                      stepNumber={child.stepNumber}
                      title={child.title}
                      description={child.subtitle}
                      titlePlaceholder={child.titlePlaceholder || 'Enter task name'}
                      descriptionPlaceholder={child.descriptionPlaceholder || 'Enter description'}
                      hasToggle={child.hasToggle}
                      toggleEnabled={child.toggleEnabled ?? true}
                      toggleDisabled={viewOnly}
                      viewOnly={viewOnly}
                      onToggleChange={(enabled) => onChildToggleChange?.(child.id, enabled)}
                      onDelete={loopChildren.length > 1 ? () => onChildDelete?.(child.id) : undefined}
                      state={isChildSelected ? 'selected' : 'default'}
                    />
                  </div>
                  <LoopConnector
                    connectorId={`connector-${loopNodeId}-${index}`}
                    loopBodyId={loopNodeId}
                    afterNodeId={child.id}
                    viewOnly={viewOnly}
                  />
                </React.Fragment>
              );
            })}
          </div>
        )}
      </div>

      <div className={styles.bottomExit} style={{ top: bottomExitTop, width: containerW }}>
        <div className={styles.bottomStack}>
          <div className={styles.bottomLineWrap}>
            <div className={styles.bottomConnectorLine} aria-hidden />
          </div>
          <span className={styles.bottomArrow} aria-hidden>
            <span className="material-symbols-outlined">arrow_downward</span>
          </span>
          <span className="end-node">Loop completes</span>
          <div
            ref={setAfterLoopRef}
            className={`${styles.afterLoopConnector}${isAfterLoopOver ? ` ${styles.connectorOver}` : ''}`}
          >
            <div className={styles.afterLoopLine} aria-hidden />
            {!viewOnly && (
              <button type="button" className={afterLoopAddClass} tabIndex={-1}>
                <span className="material-symbols-outlined">add</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className={styles.spacer} style={{ height: canvasHeight }} aria-hidden />
    </div>
  );
}
