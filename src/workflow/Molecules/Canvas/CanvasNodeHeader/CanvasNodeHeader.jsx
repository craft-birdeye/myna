import React, { useState, useRef, useEffect } from 'react';
import { Toggle } from '../../../elemental-stubs';
import { Button } from '../../../elemental-stubs';
import { AiSparkleGlyphIcon } from '../../../../assets/AiSparkleGlyphIcon';
import { Tooltip } from '../../../../components/Tooltip/Tooltip';
/* Same assets as the left floater (Trigger / Task / Controls). */
import iconRrTrigger from '../../../../assets/rr-chrome/icon-trigger.svg';
import iconRrTasks from '../../../../assets/rr-chrome/icon-tasks.svg';
import iconRrControls from '../../../../assets/rr-chrome/icon-controls.svg';
import iconRrProcedures from '../../../../assets/rr-chrome/icon-procedures.svg';
import './CanvasNodeHeader.css';

const AddIcon = () => <span className="material-symbols-outlined cnh__btn-icon">add_circle</span>;
const MoreIcon = () => <span className="material-symbols-outlined cnh__btn-icon">more_vert</span>;
const DeleteIcon = () => <span className="material-symbols-outlined cnh__btn-icon cnh__btn-icon--delete">delete</span>;
const CopyIcon = () => <span className="material-symbols-outlined cnh__btn-icon">content_copy</span>;
const ReplaceIcon = () => <span className="material-symbols-outlined cnh__btn-icon">swap_horiz</span>;
const PasteIcon = () => <span className="material-symbols-outlined cnh__btn-icon">content_paste</span>;

const FloaterIcon = ({ src, alt = '' }) => (
  <img src={src} alt={alt} width={14} height={14} className="cnh__floater-icon" draggable={false} />
);

const TriggerIcon = () => <FloaterIcon src={iconRrTrigger} />;
const TaskIcon = () => <FloaterIcon src={iconRrTasks} />;
const BranchIcon = () => <FloaterIcon src={iconRrControls} />;
const ProcedureIcon = () => <FloaterIcon src={iconRrProcedures} />;

/*
 * Same SVG used by the Test details panel's step stepper (TestRunPanel.tsx) — a font glyph
 * sits off-centre in its line-box, so `animate-spin` would make it orbit instead of spin. This
 * circle is centred at 8,8 of a 16×16 box (this header's icon size), so it rotates in place.
 */
const RunSpinnerIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="cnh__run-spinner" aria-hidden>
    <circle cx="8" cy="8" r="6.4" stroke="#1976d2" strokeOpacity="0.2" strokeWidth="1.6" />
    <path d="M14.4 8a6.4 6.4 0 0 0-6.4-6.4" stroke="#1976d2" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

const RunDoneIcon = () => (
  <span className="material-symbols-outlined cnh__run-done" aria-hidden>
    check_circle
  </span>
);

const ICON_CONFIG = {
  trigger:    { Component: TriggerIcon   },
  task:       { Component: TaskIcon      },
  branch:     { Component: BranchIcon    },
  parallel:   { icon: 'splitscreen_add'  },
  loop:       { icon: 'repeat'           },
  delay:      { icon: 'schedule'  },
  subagent:   { icon: 'smart_toy'        },
  procedures: { Component: ProcedureIcon },
};

export default function CanvasNodeHeader({
  nodeType = 'task',
  label,
  hasToggle = false,
  toggleEnabled = true,
  toggleDisabled = false,
  viewOnly = false,
  onToggleChange,
  hasAiIcon = false,
  hasAddButton = false,
  onAddClick,
  onMenuClick,
  onDelete,
  onCopy,
  onReplace,
  hasClipboard = false,
  onPasteBelow = undefined,
  onPasteReplace = undefined,
  onMoveUp,
  onMoveDown,
  canMoveUp = false,
  canMoveDown = false,
  /** Set while a "Run test" pass is executing/has finished this node — swaps the type
   * glyph for the same spinner/check the Test details panel shows, so canvas and panel
   * animate in lockstep. Exploration-only (`response-agents-exploration`); undefined
   * everywhere else, so every other agent's header is unaffected. */
  runStatus,
  /** Task saved with a tool still missing mandatory config — flags an icon before the toggle. */
  hasError = false,
  errorTooltip,
}) {
  const config = ICON_CONFIG[nodeType] || ICON_CONFIG.task;
  const NodeSvg = config.Component || null;
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const handleMoreClick = (e) => {
    e.stopPropagation();
    setMenuOpen((v) => !v);
    onMenuClick?.();
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    setMenuOpen(false);
    onDelete?.();
  };

  const handleCopy = (e) => {
    e.stopPropagation();
    setMenuOpen(false);
    onCopy?.();
  };

  const handleReplace = (e) => {
    e.stopPropagation();
    setMenuOpen(false);
    onReplace?.();
  };

  const handlePasteBelow = (e) => {
    e.stopPropagation();
    setMenuOpen(false);
    onPasteBelow?.();
  };

  const handlePasteReplace = (e) => {
    e.stopPropagation();
    setMenuOpen(false);
    onPasteReplace?.();
  };

  const isTrigger = nodeType === 'trigger';

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  return (
    <div className="cnh">
      <div className="cnh__left">
        <span className={`cnh__node-icon${nodeType === 'subagent' ? ' cnh__node-icon--subagent' : ''}`}>
          {runStatus === 'running' ? (
            <RunSpinnerIcon />
          ) : runStatus === 'done' ? (
            <RunDoneIcon />
          ) : NodeSvg ? (
            <NodeSvg />
          ) : (
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>{config.icon}</span>
          )}
        </span>
        <span className="cnh__label">{label}</span>
      </div>
      <div className="cnh__right">
        {hasAiIcon && (
          <div className="cnh__ai-icon">
            <AiSparkleGlyphIcon size={14} />
          </div>
        )}
        {hasError && errorTooltip && (
          <Tooltip
            content={errorTooltip}
            variant="detail"
            side="top"
          >
            <span
              className="cnh__error-icon"
              role="img"
              aria-label={errorTooltip}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <span className="material-symbols-outlined" aria-hidden>error</span>
            </span>
          </Tooltip>
        )}
        {hasToggle && (
          <div
            className="cnh__toggle"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <Toggle
              name={`cnh-toggle-${nodeType}`}
              checked={toggleEnabled}
              onChange={(checked, e) => {
                e?.stopPropagation();
                onToggleChange?.(checked);
              }}
              roundedToggle
              disabled={toggleDisabled}
            />
          </div>
        )}
        {hasAddButton && (
          <Button type="link" customIcon={<AddIcon />} onClick={onAddClick} noHover aria-label="Add" />
        )}
        {!viewOnly && (
          <div className="cnh__more-wrapper" ref={menuRef}>
            <button
              type="button"
              className="cnh__more-btn"
              onClick={handleMoreClick}
              onMouseDown={(e) => e.stopPropagation()}
              aria-label="More options"
            >
              <MoreIcon />
            </button>
            {menuOpen && (
              <div className="cnh__context-menu">
                {isTrigger ? (
                  <button className="cnh__context-menu-item cnh__context-menu-item--delete" onClick={handleDelete}>
                    <DeleteIcon />
                    <span>Delete</span>
                  </button>
                ) : (
                  <>
                    <button className="cnh__context-menu-item" onClick={handleCopy}>
                      <CopyIcon />
                      <span>Copy</span>
                    </button>
                    {hasClipboard && (
                      <>
                        <button className="cnh__context-menu-item" onClick={handlePasteBelow}>
                          <PasteIcon />
                          <span>Paste below</span>
                        </button>
                        <button className="cnh__context-menu-item" onClick={handlePasteReplace}>
                          <PasteIcon />
                          <span>Paste to replace</span>
                        </button>
                      </>
                    )}
                    <button className="cnh__context-menu-item cnh__context-menu-item--delete" onClick={handleDelete}>
                      <DeleteIcon />
                      <span>Delete</span>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
