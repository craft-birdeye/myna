import React, { useCallback, useState } from 'react';
import AddStepButton from '../../../FlowCanvas/AddStepButton';
import { getFlowDragPayload, isDraggingFlowKind } from '../../../flowDragData';
import './TriggerPlaceholderNode.css';

/**
 * The "Add a trigger to start your workflow" dashed drop slot. It permanently reserves
 * step 1 for the trigger whenever no trigger node exists yet — tasks the user adds before
 * a trigger flow in below it (numbered from 2). Accepts trigger drags only.
 */
export default function TriggerPlaceholderNode({
  isDraggingTrigger = false,
  onDropTrigger,
  product = 'healthcare',
  agentName = '',
}) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = useCallback((e) => {
    if (!isDraggingFlowKind(e.dataTransfer, 'trigger')) return;
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => setIsDragOver(false), []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const { type, label, description } = getFlowDragPayload(e.dataTransfer);
    if (type === 'trigger') onDropTrigger?.(type, label, description);
  }, [onDropTrigger]);

  return (
    <div
      className={`trigger-placeholder${isDragOver ? ' trigger-placeholder--drag-over' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <AddStepButton
        className="add-step-btn--empty-slot"
        disableClick
        isDraggingFromLHS={isDraggingTrigger}
        isDragOver={isDragOver}
        product={product}
        agentName={agentName}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      />
      <div className="trigger-placeholder__text">
        <span className="trigger-placeholder__title">Add a trigger to start your workflow</span>
        <span className="trigger-placeholder__subtitle">Drag and drop the trigger you want to add</span>
      </div>
    </div>
  );
}
