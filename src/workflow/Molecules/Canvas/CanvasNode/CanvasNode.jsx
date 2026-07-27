import React, { useState, useEffect } from 'react';
import CanvasNodeHeader from '../CanvasNodeHeader/CanvasNodeHeader';
import CanvasNodeBody from '../CanvasNodeBody/CanvasNodeBody';
import './CanvasNode.css';

export default function CanvasNode({
  nodeType = 'task',
  label,
  stepNumber,
  title,
  description,
  titlePlaceholder,
  descriptionPlaceholder,
  hasAiIcon = false,
  hasToggle = false,
  toggleEnabled = true,
  toggleDisabled = false,
  viewOnly = false,
  onToggleChange,
  hasAddButton = false,
  onAddClick,
  onDelete,
  onCopy = undefined,
  hasClipboard = false,
  onPasteBelow = undefined,
  onPasteReplace = undefined,
  state = 'default',
}) {
  const [on, setOn] = useState(toggleEnabled);

  useEffect(() => {
    setOn(toggleEnabled);
  }, [toggleEnabled]);

  const handleToggle = (val) => {
    if (toggleDisabled) return;
    setOn(val);
    onToggleChange?.(val);
  };

  const isOff = hasToggle && !on;
  const stateClass = state !== 'default' ? ` canvas-node--${state}` : '';

  return (
    <div className={`canvas-node${stateClass}`}>
      <CanvasNodeHeader
        nodeType={nodeType}
        label={label}
        hasAiIcon={hasAiIcon}
        hasToggle={hasToggle}
        toggleEnabled={on}
        toggleDisabled={toggleDisabled}
        viewOnly={viewOnly}
        onToggleChange={handleToggle}
        hasAddButton={hasAddButton && !viewOnly}
        onAddClick={onAddClick}
        onDelete={onDelete}
        onCopy={onCopy}
        hasClipboard={hasClipboard}
        onPasteBelow={onPasteBelow}
        onPasteReplace={onPasteReplace}
      />
      {(stepNumber != null || title) && (
        <div className={isOff ? 'canvas-node__body--disabled' : undefined}>
          <CanvasNodeBody
            nodeType={nodeType}
            stepNumber={stepNumber}
            title={title}
            description={description}
            titlePlaceholder={titlePlaceholder}
            descriptionPlaceholder={descriptionPlaceholder}
          />
        </div>
      )}
    </div>
  );
}
