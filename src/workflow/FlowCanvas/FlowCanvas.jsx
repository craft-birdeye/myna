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
import CanvasNode from '../Molecules/Canvas/CanvasNode/CanvasNode';
import ProceduresNode from '../Molecules/Canvas/ProceduresNode/ProceduresNode';
import LoopNode, { computeLoopBodyHeight } from '../Molecules/Canvas/LoopNode/LoopNode';
import AddStepButton from './AddStepButton';
import './FlowCanvas.css';
import branchStyles from './BranchPath.module.css';
import { FLOW_CONNECTOR_GAP } from '../flowLayoutConstants';

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
      />
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

function TriggerNodeWrapper({ id, data }) {
  const isSelected = id === data.selectedNodeId;
  return (
    <div className="flow-canvas__node-center">
      <Handle type="target" position={Position.Top} />
      <CanvasNode nodeType="trigger" label={data.headerLabel || (data.subtype === 'Schedule-based' ? 'Schedule-based trigger' : 'Trigger')} stepNumber={data.stepNumber} title={data.title} description={data.subtitle} titlePlaceholder={data.titlePlaceholder} descriptionPlaceholder={data.descriptionPlaceholder} hasToggle={false} toggleEnabled={data.toggleEnabled} toggleDisabled={data.viewOnly} viewOnly={data.viewOnly} state={isSelected ? 'selected' : 'default'} onDelete={data.onDelete} onCopy={data.onCopy} hasClipboard={data.hasClipboard} onPasteBelow={data.onPasteBelow} onPasteReplace={data.onPasteReplace} onMoveUp={data.onMoveUp} onMoveDown={data.onMoveDown} canMoveUp={data.canMoveUp} canMoveDown={data.canMoveDown} />
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

function TaskNodeWrapper({ id, data }) {
  const isSelected = id === data.selectedNodeId;
  return (
    <div className="flow-canvas__node-center">
      <Handle type="target" position={Position.Top} />
      <CanvasNode nodeType="task" label="Task" stepNumber={data.stepNumber} title={data.title} description={data.subtitle} titlePlaceholder={data.titlePlaceholder} descriptionPlaceholder={data.descriptionPlaceholder} hasAiIcon={data.hasAiIcon} hasToggle={data.hasToggle} toggleEnabled={data.toggleEnabled} toggleDisabled={data.viewOnly} viewOnly={data.viewOnly} onToggleChange={data.onToggleChange} state={isSelected ? 'selected' : 'default'} onDelete={data.onDelete} onCopy={data.onCopy} hasClipboard={data.hasClipboard} onPasteBelow={data.onPasteBelow} onPasteReplace={data.onPasteReplace} onMoveUp={data.onMoveUp} onMoveDown={data.onMoveDown} canMoveUp={data.canMoveUp} canMoveDown={data.canMoveDown} />
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

function VoiceCallNodeWrapper({ id, data }) {
  const isSelected = id === data.selectedNodeId;
  return (
    <div className="flow-canvas__node-center">
      <Handle type="target" position={Position.Top} />
      <CanvasNode nodeType="task" label="Task" stepNumber={data.stepNumber} title={data.title} description={data.subtitle} titlePlaceholder={data.titlePlaceholder} descriptionPlaceholder={data.descriptionPlaceholder} hasAiIcon={data.hasAiIcon} hasToggle={data.hasToggle} toggleEnabled={data.toggleEnabled} toggleDisabled={data.viewOnly} viewOnly={data.viewOnly} onToggleChange={data.onToggleChange} state={isSelected ? 'selected' : 'default'} onDelete={data.onDelete} onCopy={data.onCopy} hasClipboard={data.hasClipboard} onPasteBelow={data.onPasteBelow} onPasteReplace={data.onPasteReplace} onMoveUp={data.onMoveUp} onMoveDown={data.onMoveDown} canMoveUp={data.canMoveUp} canMoveDown={data.canMoveDown} />
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

function BranchNodeWrapper({ id, data }) {
  const isSelected = id === data.selectedNodeId;
  return (
    <div className="flow-canvas__node-center">
      <Handle type="target" position={Position.Top} />
      <CanvasNode nodeType="branch" label="Branch" stepNumber={data.stepNumber} title={data.title} description={data.subtitle} titlePlaceholder={data.titlePlaceholder} descriptionPlaceholder={data.descriptionPlaceholder} hasToggle={data.hasToggle} toggleEnabled={data.toggleEnabled} toggleDisabled={data.viewOnly} viewOnly={data.viewOnly} hasAddButton onAddClick={data.onAddBranch} state={isSelected ? 'selected' : 'default'} onDelete={data.onDelete} onCopy={data.onCopy} hasClipboard={data.hasClipboard} onPasteBelow={data.onPasteBelow} onPasteReplace={data.onPasteReplace} onMoveUp={data.onMoveUp} onMoveDown={data.onMoveDown} canMoveUp={data.canMoveUp} canMoveDown={data.canMoveDown} />
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

function BranchPathNodeWrapper({ id, data }) {
  const isSelected = id === data.selectedNodeId;
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  const chipClass = [
    branchStyles.chip,
    data.isFallback ? branchStyles.chipFallback : '',
    isSelected ? branchStyles.chipSelected : '',
    data.isVoiceCallBranch ? branchStyles.chipNoPointer : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={branchStyles.pathWrapper}>
      <Handle type="target" position={Position.Top} />
      <div className={chipClass}>
        <span className={branchStyles.chipLabel}>{data.label}</span>
        {!data.isFallback && !data.isVoiceCallBranch && (
          <span className={`material-symbols-outlined ${branchStyles.chipIcon}`}>info</span>
        )}
        {!data.isVoiceCallBranch && (
          <div className={branchStyles.chipMenuWrapper} ref={menuRef}>
            <span
              className={`material-symbols-outlined ${branchStyles.chipMenu}`}
              onClick={(e) => {
                e.stopPropagation();
                if (!data.isFallback) setMenuOpen((m) => !m);
              }}
            >more_vert</span>
            {menuOpen && !data.isFallback && (
              <div className={branchStyles.chipDropdown}>
                <button
                  className={branchStyles.chipDropdownItem}
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setMenuOpen(false); data.onDelete?.(); }}
                >
                  <span className="material-symbols-outlined">delete</span>
                  Delete branch
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} />
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
      />
    </div>
  );
}

function BranchEndNodeWrapper() {
  return (
    <div className="flow-canvas__branch-end-wrapper">
      <Handle type="target" position={Position.Top} />
      <div className="flow-canvas__branch-end">
        End
      </div>
    </div>
  );
}

/* ─── Custom Edge: main connector with + button ─── */
function AddButtonEdge({ id, source, target, sourceX, sourceY, targetX, targetY, style, data }) {
  const [isDragOver, setIsDragOver] = useState(false);
  const isDraggingFromLHS = data?.isDraggingFromLHS;
  const viewOnly = data?.viewOnly;

  const [edgePath, labelX, labelY] = getStraightPath({ sourceX, sourceY, targetX, targetY });

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const type = e.dataTransfer.getData('application/reactflow-type');
    const label = e.dataTransfer.getData('application/reactflow-label');
    const description = e.dataTransfer.getData('application/reactflow-description');
    if (type && data?.onDropOnEdge) {
      data.onDropOnEdge(type, label, description);
    }
  }, [data]);

  const handleSelect = useCallback(({ type, label, description }) => {
    data?.onDropOnEdge?.(type, label, description);
  }, [data]);

  const showAddButton = !viewOnly && source !== '__start__' && target !== '__end__' && !data?.hideAddButton;

  const isEndEdge = target === '__end__';

  return (
    <>
      {!isEndEdge && <BaseEdge id={id} path={edgePath} style={style} />}
      {showAddButton && (
        <foreignObject width={56} height={56} x={labelX - 28} y={labelY - 28} className="flow-canvas__edge-fo">
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
              showPasteOption={!!(data?.hasClipboard && data?.betweenCards)}
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
  const midY = sourceY + 30;
  const d = `M ${sourceX} ${sourceY} L ${sourceX} ${midY} L ${targetX} ${midY} L ${targetX} ${targetY}`;
  return <path d={d} className="flow-canvas__branch-fan" fill="none" />;
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
  branchEnd: BranchEndNodeWrapper,
  end: EndNodeWrapper,
};

const EDGE_TYPES = {
  addButton: AddButtonEdge,
  branchFan: BranchFanEdge,
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
  selectedNodeId,
  viewOnly = false,
  product = 'healthcare',
  agentName = '',
  hasClipboard = false,
  onPasteAtConnector,
}) {
  const { zoomTo, fitView, setCenter, setViewport, getViewport, getNodes } = useReactFlow();
  const [zoom, setZoom] = useState(100);
  const [isDraggingFromLHS, setIsDraggingFromLHS] = useState(false);
  const canvasRef = useRef(null);
  const initialPositioned = useRef(false);

  const onDropNodeRef = useRef(onDropNode);
  useEffect(() => { onDropNodeRef.current = onDropNode; }, [onDropNode]);

  const onPasteAtConnectorRef = useRef(onPasteAtConnector);
  useEffect(() => { onPasteAtConnectorRef.current = onPasteAtConnector; }, [onPasteAtConnector]);

  const endEdgeSourceId = useMemo(
    () => edges.find((e) => e.target === '__end__')?.source ?? null,
    [edges],
  );

  // Enrich nodes with selectedNodeId — positions come directly from buildFlow,
  // no local state needed because nodes never move on the canvas.
  const styledNodes = useMemo(
    () => nodes.map((n) => ({
      ...n,
      data: {
        ...n.data,
        selectedNodeId,
        viewOnly,
        isDraggingFromLHS,
        product,
        agentName,
        // Inject click handler for inline nodes rendered inside loop containers.
        ...(n.type === 'loop' ? {
          onChildClick: (childId) => onNodeClick?.({ id: childId, type: 'task', data: {} }),
        } : {}),
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
            }
          : {}),
        ...(n.id === '__end__' ? { hideAdd: !!n.data?.hideAddBeforeEnd } : {}),
      },
    })),
    [nodes, selectedNodeId, viewOnly, isDraggingFromLHS, endEdgeSourceId, onNodeClick, product, agentName]
  );

  // Pin start node 24px below the controls bar, horizontally centered, at zoom=1.
  // Controls: top=8px + height≈52px → bottom≈60px → target top = 60+24 = 84px.
  const positionToStart = useCallback(() => {
    const startNode = nodes.find(n => n.type === 'start');
    const canvas = canvasRef.current;
    if (!startNode || !canvas) return;
    const { width } = canvas.getBoundingClientRect();
    setViewport({ x: width / 2, y: 84 - startNode.position.y, zoom: 1 }, { duration: 0 });
  }, [nodes, setViewport]);

  // Run once on initial load
  useEffect(() => {
    if (initialPositioned.current || !nodes.length) return;
    const timer = setTimeout(() => {
      positionToStart();
      initialPositioned.current = true;
    }, 80);
    return () => clearTimeout(timer);
  }, [nodes.length, positionToStart]);

  // Re-pin when nodes are added/removed
  const prevNodeCountRef = useRef(nodes.length);
  useEffect(() => {
    if (!initialPositioned.current) return;
    if (nodes.length !== prevNodeCountRef.current) {
      prevNodeCountRef.current = nodes.length;
      setTimeout(() => positionToStart(), 80);
    }
  }, [nodes.length, positionToStart]);

  // Keep the flow horizontally centered whenever the canvas container resizes
  // (LHS drawer collapse/expand, RHS panel open/close, window resize). CSS
  // transitions the LHS width, so ResizeObserver fires continuously through
  // the animation, keeping the canvas centered as the panel moves.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const observer = new ResizeObserver(() => {
      if (!initialPositioned.current) return;
      const { width } = canvas.getBoundingClientRect();
      const { y, zoom: currentZoom } = getViewport();
      setViewport({ x: width / 2, y, zoom: currentZoom }, { duration: 0 });
    });
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [getViewport, setViewport]);

  // Detect LHS drag start/end (HTML5 drag API)
  useEffect(() => {
    const onDragStart = (e) => {
      if (e.dataTransfer?.types?.includes('application/reactflow-type')) {
        setIsDraggingFromLHS(true);
      }
    };
    const onDragEnd = () => setIsDraggingFromLHS(false);
    document.addEventListener('dragstart', onDragStart);
    document.addEventListener('dragend', onDragEnd);
    return () => {
      document.removeEventListener('dragstart', onDragStart);
      document.removeEventListener('dragend', onDragEnd);
    };
  }, []);

  const defaultEdgeOptions = useMemo(
    () => ({ type: 'addButton', style: { stroke: '#ccd5e4', strokeWidth: 1 } }),
    []
  );

  const handleNodeClick = useCallback(
    (event, node) => {
      if (event.target.closest('.cnh__toggle')) return;
      onNodeClick?.(node);
      // Read width after React has flushed the re-render (RHS panel may open,
      // making the canvas narrower). Using rAF gives us the post-layout width.
      requestAnimationFrame(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const { width } = canvas.getBoundingClientRect();
        const { y, zoom: currentZoom } = getViewport();
        setViewport({ x: width / 2, y, zoom: currentZoom }, { duration: 300 });
      });
    },
    [onNodeClick, getViewport, setViewport]
  );

  const handleDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
  }, []);

  // Canvas-wide drop — skip if landed inside a foreignObject (edge buttons handle their own drops)
  const handleDrop = useCallback(
    (event) => {
      event.preventDefault();
      if (event.target.closest('foreignObject')) return;
      const type = event.dataTransfer.getData('application/reactflow-type');
      const label = event.dataTransfer.getData('application/reactflow-label');
      const description = event.dataTransfer.getData('application/reactflow-description');
      if (!type) return;

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
          viewOnly,
          product,
          agentName,
          hasClipboard,
          onDropOnEdge: viewOnly ? undefined : (type, label, description) => {
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
    [edges, isDraggingFromLHS, viewOnly, product, agentName, hasClipboard]
  );

  const handleViewportChange = useCallback(({ zoom: z }) => {
    setZoom(Math.round(z * 100));
  }, []);

  return (
    <div
      ref={canvasRef}
      className={`flow-canvas${isDraggingFromLHS ? ' flow-canvas--lhs-dragging' : ''}`}
      style={{ '--flow-connector-gap': `${FLOW_CONNECTOR_GAP}px` }}
      onDragOver={viewOnly ? undefined : handleDragOver}
      onDrop={viewOnly ? undefined : handleDrop}
    >
      <div className="flow-canvas__toolbar-anchor">
        <GraphControls
          orientation={orientation}
          onOrientationChange={onOrientationChange}
          onRun={onRun}
          onEdit={onEdit}
          zoom={zoom}
          onZoomSelect={(z) => zoomTo(z, { duration: 200 })}
          onFitView={() => { positionToStart(); }}
          viewOnly={viewOnly}
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
        defaultViewport={{ x: 0, y: 84, zoom: 1 }}
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
