import React, { useState, useEffect } from 'react';
import CanvasNodeHeader from '../CanvasNodeHeader/CanvasNodeHeader';
import CanvasNodeBadge from '../CanvasNodeBadge/CanvasNodeBadge';
import CanvasNodeBody from '../CanvasNodeBody/CanvasNodeBody';
import { useCardBadge } from '../CardBadgeContext';
import { Tooltip } from '../../../../components/Tooltip/Tooltip';
import './CanvasNode.css';

/*
 * Full canvas hover-action glyphs. Stroked rather than filled, so they read lighter than the
 * Material icons they replace. `stroke="currentColor"` is what keeps the buttons' hover tints
 * working (copy → blue, delete → red) — don't bake a colour into these.
 */
const StrokeGlyph = ({ children }) => (
  <svg
    className="canvas-node__hover-action-svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    {children}
  </svg>
);

const CopyGlyphIcon = () => (
  <StrokeGlyph>
    <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
  </StrokeGlyph>
);

const DeleteGlyphIcon = () => (
  <StrokeGlyph>
    <path d="M10 11v6" />
    <path d="M14 11v6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
    <path d="M3 6h18" />
    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </StrokeGlyph>
);

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
  draftBlocked = false,
  onEditDraft,
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
  configWarningText = 'Missing mandatory fields',
  runStatus,
  /** Task details was saved with a tool still missing mandatory config. */
  hasError = false,
  errorTooltip,
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
    if (toggleDisabled || draftBlocked) return;
    setOn(val);
    onToggleChange?.(val);
  };

  const handleCopyClick = (e) => {
    e.stopPropagation();
    if (draftBlocked) return;
    onCopy?.();
    setCopied(true);
  };

  const isOff = hasToggle && !on;
  const stateClass = `${state !== 'default' ? ` canvas-node--${state}` : ''}${hasError ? ' canvas-node--error' : ''}`;
  const showHeaderAdd = hasAddButton && !viewOnly && nodeType !== 'branch';
  /** Full canvas: actions sit in the gap above the card, on the badge's centre line. */
  const badgeLayout = useCardBadge();

  return (
    <div className="canvas-node-wrap">
      <div className={`canvas-node${stateClass}`}>
        <CanvasNodeBadge nodeType={nodeType} label={label} runStatus={runStatus} />
        <CanvasNodeHeader
          nodeType={nodeType}
          label={label}
          runStatus={runStatus}
          hasError={hasError}
          errorTooltip={errorTooltip || 'Missing mandatory fields'}
          hasAiIcon={hasAiIcon}
          hasToggle={hasToggle}
          toggleEnabled={on}
          toggleDisabled={toggleDisabled || draftBlocked}
          viewOnly={viewOnly}
          draftBlocked={draftBlocked}
          onEditDraft={onEditDraft}
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
            <span className="canvas-node__config-warning-text">{configWarningText}</span>
          </div>
        )}
      </div>
      {!viewOnly && !draftBlocked && (onDelete || onCopy) ? (
        <div className={`canvas-node__hover-actions${badgeLayout ? ' canvas-node__hover-actions--above' : ''}`}>
          {nodeType !== 'trigger' && onCopy ? (
            <Tooltip content={copied ? 'Copied' : 'Copy'} variant="brief" side={badgeLayout ? 'top' : 'right'}>
              <button
                type="button"
                className="canvas-node__hover-action canvas-node__hover-action--copy"
                aria-label={copied ? 'Copied' : 'Copy'}
                onClick={handleCopyClick}
                onMouseDown={(e) => e.stopPropagation()}
              >
                {/* Full canvas swaps in the stroked glyph; every other agent keeps the
                    Material icon. The copied tick is shared. */}
                {copied ? (
                  <span className="material-symbols-outlined">check</span>
                ) : badgeLayout ? (
                  <CopyGlyphIcon />
                ) : (
                  <span className="material-symbols-outlined">content_copy</span>
                )}
              </button>
            </Tooltip>
          ) : null}
          {onDelete ? (
            <Tooltip content="Delete" variant="brief" side={badgeLayout ? 'top' : 'right'}>
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
                {badgeLayout ? <DeleteGlyphIcon /> : <span className="material-symbols-outlined">delete</span>}
              </button>
            </Tooltip>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
