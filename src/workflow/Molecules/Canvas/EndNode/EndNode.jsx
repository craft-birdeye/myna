import React, { useCallback, useEffect, useState } from 'react';
import AddStepButton from '../../../FlowCanvas/AddStepButton';
import { getFlowDragPayload, isDraggingFlowKind } from '../../../flowDragData';
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
  hasClipboard = false,
  onPaste = undefined,
}) {
  const [isDragOver, setIsDragOver] = useState(false);

  useEffect(() => {
    if (!isDraggingFromLHS) setIsDragOver(false);
  }, [isDraggingFromLHS]);

  // The "+" above End adds steps (tasks/branches/etc.) — never a trigger. Triggers only land
  // on the dedicated trigger placeholder slot at the top of the flow.
  const handleAddSlotDragOver = useCallback((e) => {
    if (isDraggingFlowKind(e.dataTransfer, 'trigger')) return;
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
    setIsDragOver(true);
  }, []);

  const handleAddSlotDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleAddSlotDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const { type, label, description } = getFlowDragPayload(e.dataTransfer);
    if (!type || type === 'trigger') return;
    onDropBeforeEnd?.(type, label, description);
  }, [onDropBeforeEnd]);

  return (
    <div className="end-node-stack">
      <div className="end-node-connector-line" aria-hidden />
      <div className={`end-node-connector${hideAdd ? ' end-node-connector--compact' : ''}`}>
        {!viewOnly && !hideAdd && (
          <div
            className="end-node__add-slot"
            onDragOver={handleAddSlotDragOver}
            onDragLeave={handleAddSlotDragLeave}
            onDrop={handleAddSlotDrop}
          >
            <AddStepButton
              className="add-step-btn--end-slot"
              isDraggingFromLHS={isDraggingFromLHS}
              isDragOver={isDragOver}
              product={product}
              agentName={agentName}
              onSelect={(payload) => {
                if (payload?.type === 'trigger') return;
                if (onAddStep) onAddStep(payload);
                else onDropBeforeEnd?.(payload.type, payload.label, payload.description);
              }}
              onDragOver={handleAddSlotDragOver}
              onDragLeave={handleAddSlotDragLeave}
              onDrop={handleAddSlotDrop}
              showPasteOption={!!hasClipboard}
              onPaste={onPaste}
            />
          </div>
        )}
      </div>
      <div className={`end-node${selected ? ' end-node--selected' : ''}`}>End</div>
    </div>
  );
}
