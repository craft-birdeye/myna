import React, { useMemo, useCallback, useState, useEffect, useRef } from 'react';
import {
  ReactFlow,
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
import './FlowCanvas.css';
import branchStyles from './BranchPath.module.css';

/* ─── Custom Node Wrappers ─── */
function StartNodeWrapper({ id, data }) {
  const isSelected = id === data.selectedNodeId;
  return (
    <div className="flow-canvas__node-center">
      <StartNode title={data.title} subtitle={data.subtitle} selected={isSelected} />
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

function TriggerNodeWrapper({ id, data }) {
  const isSelected = id === data.selectedNodeId;
  return (
    <div className="flow-canvas__node-center">
      <Handle type="target" position={Position.Top} />
      <CanvasNode nodeType="trigger" label={data.headerLabel || (data.subtype === 'Schedule-based' ? 'Schedule-based trigger' : 'Trigger')} stepNumber={data.stepNumber} title={data.title} description={data.subtitle} titlePlaceholder={data.titlePlaceholder} descriptionPlaceholder={data.descriptionPlaceholder} hasToggle={data.hasToggle} toggleEnabled={data.toggleEnabled} state={isSelected ? 'selected' : 'default'} onDelete={data.onDelete} onMoveUp={data.onMoveUp} onMoveDown={data.onMoveDown} canMoveUp={data.canMoveUp} canMoveDown={data.canMoveDown} />
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

function TaskNodeWrapper({ id, data }) {
  const isSelected = id === data.selectedNodeId;
  return (
    <div className="flow-canvas__node-center">
      <Handle type="target" position={Position.Top} />
      <CanvasNode nodeType="task" label="Task" stepNumber={data.stepNumber} title={data.title} description={data.subtitle} titlePlaceholder={data.titlePlaceholder} descriptionPlaceholder={data.descriptionPlaceholder} hasAiIcon={data.hasAiIcon} hasToggle={data.hasToggle} toggleEnabled={data.toggleEnabled} state={isSelected ? 'selected' : 'default'} onDelete={data.onDelete} onMoveUp={data.onMoveUp} onMoveDown={data.onMoveDown} canMoveUp={data.canMoveUp} canMoveDown={data.canMoveDown} />
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

function BranchNodeWrapper({ id, data }) {
  const isSelected = id === data.selectedNodeId;
  return (
    <div className="flow-canvas__node-center">
      <Handle type="target" position={Position.Top} />
      <CanvasNode nodeType="branch" label="Branch" stepNumber={data.stepNumber} title={data.title} description={data.subtitle} titlePlaceholder={data.titlePlaceholder} descriptionPlaceholder={data.descriptionPlaceholder} hasToggle={data.hasToggle} toggleEnabled={data.toggleEnabled} hasAddButton onAddClick={data.onAddBranch} state={isSelected ? 'selected' : 'default'} onDelete={data.onDelete} onMoveUp={data.onMoveUp} onMoveDown={data.onMoveDown} canMoveUp={data.canMoveUp} canMoveDown={data.canMoveDown} />
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
        state={isSelected ? 'selected' : 'default'}
        onDelete={data.onDelete}
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
        state={isSelected ? 'selected' : 'default'}
        onDelete={data.onDelete}
        onMoveUp={data.onMoveUp}
        onMoveDown={data.onMoveDown}
        canMoveUp={data.canMoveUp}
        canMoveDown={data.canMoveDown}
        onDropProcedure={data.onDropProcedure}
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

function LoopNodeWrapper(props) {
  return <ControlNodeWrapper {...props} nodeType="loop" label="Loop" />;
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
  ].filter(Boolean).join(' ');

  return (
    <div className={branchStyles.pathWrapper}>
      <Handle type="target" position={Position.Top} />
      <div className={chipClass}>
        <span className={branchStyles.chipLabel}>{data.label}</span>
        {!data.isFallback && (
          <span className={`material-symbols-outlined ${branchStyles.chipIcon}`}>info</span>
        )}
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
      <EndNode selected={isSelected} />
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
function AddButtonEdge({ id, sourceX, sourceY, targetX, targetY, style, data }) {
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

  const btnClass = [
    'flow-canvas__edge-add',
    isDraggingFromLHS ? 'flow-canvas__edge-add--lhs-drag' : '',
    isDragOver ? 'flow-canvas__edge-add--drop-target' : '',
  ].filter(Boolean).join(' ');

  return (
    <>
      <BaseEdge id={id} path={edgePath} style={style} />
      {!viewOnly && (
        <foreignObject width={56} height={56} x={labelX - 28} y={labelY - 28}>
          <div
            className="flow-canvas__edge-add-wrapper"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <button className={btnClass} type="button">
              <span className="material-symbols-outlined">add</span>
            </button>
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
  branch: BranchNodeWrapper,
  delay: DelayNodeWrapper,
  parallel: ParallelNodeWrapper,
  loop: LoopNodeWrapper,
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
  selectedNodeId,
  viewOnly = false,
}) {
  const { zoomTo, fitView, getNodes } = useReactFlow();
  const [zoom, setZoom] = useState(110);
  const [isDraggingFromLHS, setIsDraggingFromLHS] = useState(false);

  const onDropNodeRef = useRef(onDropNode);
  useEffect(() => { onDropNodeRef.current = onDropNode; }, [onDropNode]);

  // Enrich nodes with selectedNodeId — positions come directly from buildFlow,
  // no local state needed because nodes never move on the canvas.
  const styledNodes = useMemo(
    () => nodes.map((n) => ({
      ...n,
      data: { ...n.data, selectedNodeId },
    })),
    [nodes, selectedNodeId]
  );

  // Fit view whenever a node is added or removed
  const prevNodeCountRef = useRef(nodes.length);
  useEffect(() => {
    if (nodes.length !== prevNodeCountRef.current) {
      prevNodeCountRef.current = nodes.length;
      setTimeout(() => fitView({ padding: 0.25, duration: 300, maxZoom: 1.1 }), 80);
    }
  }, [nodes.length, fitView]);

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
    (event, node) => onNodeClick?.(node),
    [onNodeClick]
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
      const MAIN_TYPES = ['trigger', 'task', 'branch', 'delay', 'parallel', 'loop', 'procedures'];
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
          onDropOnEdge: viewOnly ? undefined : (type, label, description) => {
            onDropNodeRef.current?.({
              type,
              label,
              description,
              afterNodeId: edge.data?.afterNodeId ?? edge.source,
              branchPathId: edge.data?.branchPathId,
            });
          },
        },
      })),
    [edges, isDraggingFromLHS, viewOnly]
  );

  const handleViewportChange = useCallback(({ zoom: z }) => {
    setZoom(Math.round(z * 100));
  }, []);

  return (
    <div
      className={`flow-canvas${isDraggingFromLHS ? ' flow-canvas--lhs-dragging' : ''}`}
      onDragOver={viewOnly ? undefined : handleDragOver}
      onDrop={viewOnly ? undefined : handleDrop}
    >
      <div className="flow-canvas__toolbar-anchor">
        <GraphControls
          orientation={orientation}
          onOrientationChange={onOrientationChange}
          onRun={onRun}
          zoom={zoom}
          onZoomSelect={(z) => zoomTo(z, { duration: 200 })}
          onFitView={() => fitView({ padding: 0.25, duration: 200 })}
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
        fitView
        fitViewOptions={{ padding: 0.25, maxZoom: 1.1 }}
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
  // onNodesReorder is no longer used — nodes are fixed-position (Zapier model).
  // Accept and discard it so callers don't need to change their prop signature.
  return <FlowCanvasInner {...props} />;
}
