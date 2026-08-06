import React, { useCallback, useState } from 'react';
import AddStepButton from '../../../FlowCanvas/AddStepButton';
import './EndNode.css';

export default function EndNode({
  selected = false,
  viewOnly = false,
  isDraggingFromLHS = false,
  onDropBeforeEnd,
  onAddStep = undefined,
  product = 'healthcare',
  agentName = '',
  hideAdd = false,
}) {
  const [isDragOver, setIsDragOver] = useState(false);

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
    if (type && onDropBeforeEnd) {
      onDropBeforeEnd(type, label, description);
    }
  }, [onDropBeforeEnd]);

  return (
    <div className="end-node-stack">
      <div className="end-node-connector-line" aria-hidden />
      <div className={`end-node-connector${hideAdd ? ' end-node-connector--compact' : ''}`}>
        {!viewOnly && !hideAdd && (
          <div
            className="end-node__add-slot"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <AddStepButton
              isDraggingFromLHS={isDraggingFromLHS}
              isDragOver={isDragOver}
              product={product}
              agentName={agentName}
              onSelect={(payload) => {
                if (onAddStep) onAddStep(payload);
                else onDropBeforeEnd?.(payload.type, payload.label, payload.description);
              }}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            />
          </div>
        )}
      </div>
      <div className={`end-node${selected ? ' end-node--selected' : ''}`}>End</div>
    </div>
  );
}
