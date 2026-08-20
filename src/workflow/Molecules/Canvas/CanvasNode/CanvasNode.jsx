import React, { useState, useEffect } from 'react';
import CanvasNodeHeader from '../CanvasNodeHeader/CanvasNodeHeader';
import CanvasNodeBody from '../CanvasNodeBody/CanvasNodeBody';
import { Tooltip } from '../../../../components/Tooltip/Tooltip';
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
  onCopy,
  onReplace,
  hasClipboard = false,
  onPasteBelow = undefined,
  onPasteReplace = undefined,
  state = 'default',
  showConfigWarning = false,
  runStatus,
}) {
  const [on, setOn] = useState(toggleEnabled);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setOn(toggleEnabled);
  }, [toggleEnabled]);

  useEffect(() => {
    if (!copied) return undefined;
    const t = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(t);
  }, [copied]);

  const handleToggle = (val) => {
    if (toggleDisabled) return;
    setOn(val);
    onToggleChange?.(val);
  };

  const handleCopyClick = (e) => {
    e.stopPropagation();
    onCopy?.();
    setCopied(true);
  };

  const isOff = hasToggle && !on;
  const stateClass = state !== 'default' ? ` canvas-node--${state}` : '';
  const showHeaderAdd = hasAddButton && !viewOnly && nodeType !== 'branch';
  const showFooterAdd = hasAddButton && !viewOnly && nodeType === 'branch';

  return (
    <div className="canvas-node-wrap">
      <div className={`canvas-node${stateClass}`}>
        <CanvasNodeHeader
          nodeType={nodeType}
          label={label}
          runStatus={runStatus}
          hasAiIcon={hasAiIcon}
          hasToggle={hasToggle}
          toggleEnabled={on}
          toggleDisabled={toggleDisabled}
          viewOnly={viewOnly}
          onToggleChange={handleToggle}
          hasAddButton={showHeaderAdd}
          onAddClick={onAddClick}
          onDelete={onDelete}
          onCopy={onCopy}
          onReplace={onReplace}
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
        {showConfigWarning && !viewOnly && (
          <div className="canvas-node__config-warning" role="status">
            <span className="material-symbols-outlined canvas-node__config-warning-icon" aria-hidden>
              warning
            </span>
            <span className="canvas-node__config-warning-text">Missing mandatory fields</span>
          </div>
        )}
        {showFooterAdd && (
          <button
            type="button"
            className="canvas-node__add-branch"
            onClick={(e) => {
              e.stopPropagation();
              onAddClick?.();
            }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <span className="material-symbols-outlined">add</span>
            Add a branch
          </button>
        )}
      </div>
      {!viewOnly && (onDelete || onCopy) ? (
        <div className="canvas-node__hover-actions">
          {nodeType !== 'trigger' && onCopy ? (
            <Tooltip content={copied ? 'Copied' : 'Copy'} variant="brief" side="right">
              <button
                type="button"
                className="canvas-node__hover-action"
                aria-label={copied ? 'Copied' : 'Copy'}
                onClick={handleCopyClick}
                onMouseDown={(e) => e.stopPropagation()}
              >
                <span className="material-symbols-outlined">
                  {copied ? 'check' : 'content_copy'}
                </span>
              </button>
            </Tooltip>
          ) : null}
          {onDelete ? (
            <Tooltip content="Delete" variant="brief" side="right">
              <button
                type="button"
                className="canvas-node__hover-action canvas-node__hover-action--delete"
                aria-label="Delete"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                onMouseDown={(e) => e.stopPropagation()}
              >
                <span className="material-symbols-outlined">delete</span>
              </button>
            </Tooltip>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
