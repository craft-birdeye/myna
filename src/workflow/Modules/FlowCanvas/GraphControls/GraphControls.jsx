import React, { useState, useRef, useEffect } from 'react';
import GraphControlTooltip from './GraphControlTooltip';
import iconUndo from '../../../../assets/rr-chrome/icon-undo.svg';
import iconRedo from '../../../../assets/rr-chrome/icon-redo.svg';
import iconZoomIn from '../../../../assets/rr-chrome/icon-zoom-in.svg';
import iconZoomOut from '../../../../assets/rr-chrome/icon-zoom-out.svg';
import iconFit from '../../../../assets/rr-chrome/icon-fit.svg';
import './GraphControls.css';

const ZOOM_PRESETS = [50, 75, 100, 125, 150];
const ZOOM_STEP = 0.25;

function RrIcon({ src, alt = '' }) {
  return <img src={src} alt={alt} width={18} height={18} className="graph-controls__rr-icon" />;
}

export default function GraphControls({
  orientation = 'vertical',
  onOrientationChange,
  onRun,
  onEdit,
  onView,
  zoom = 100,
  onZoomSelect,
  onFitView,
  onFillView = null,
  viewOnly = false,
  runDisabled = false,
  agentName = '',
  rrChrome = false,
  onUndo = () => {},
  onRedo = () => {},
  canUndo = false,
  canRedo = false,
  /** Version history open: undo/redo don't apply while browsing past versions. */
  hideUndoRedo = false,
  /** When set, renders the Help center trigger as its own pill beside the editor pill.
   * Exploration-only (`response-agents-exploration`); other agents keep it top-right. */
  onHelpToggle = null,
  helpOpen = false,
  /** Response agents (Sep1) only — zoom collapses to a "100% ▾" dropdown and the zoom/undo-redo/
   * help pills sit adjacent at bottom-left instead of spread left/center/top-right. */
  combineControlsLeft = false,
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  /** Sticky footer selection: 'fill' | 'fit' | null (percentage active). */
  const [zoomMode, setZoomMode] = useState(null);
  const dropdownRef = useRef(null);
  // Reviews AI undo/redo toolbar (non-chrome path). Floating chrome agents use the split floaters below.
  const isReviewsAgent = /review (response|generation) agent/i.test(agentName || '');
  // Prefer parent flag so chrome stays in sync with AgentBuilder.
  const isReviewResponseChrome = rrChrome;

  useEffect(() => {
    if (!dropdownOpen) return;
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  function renderCheck(active) {
    if (!active) return <span className="graph-controls__zoom-check" aria-hidden />;
    return (
      <span className="material-symbols-outlined graph-controls__zoom-check" aria-hidden>
        check
      </span>
    );
  }

  const zoomFraction = Math.round(zoom) / 100;
  const zoomIn = () => {
    setZoomMode(null);
    onZoomSelect?.(Math.min(2, +(zoomFraction + ZOOM_STEP).toFixed(2)));
  };
  const zoomOut = () => {
    setZoomMode(null);
    onZoomSelect?.(Math.max(0.1, +(zoomFraction - ZOOM_STEP).toFixed(2)));
  };

  function renderZoomDropdown({ hideFill = false, openUp = false } = {}) {
    return (
      <div className="graph-controls__zoom" ref={dropdownRef}>
        {/* Tooltip off while open — it renders just above the trigger, where an upward
            dropdown's last row sits. */}
        <GraphControlTooltip text="Zoom" above disabled={dropdownOpen}>
          <button
            className="graph-controls__zoom-btn"
            onClick={() => setDropdownOpen((v) => !v)}
            type="button"
          >
            <span className="graph-controls__zoom-label">{Math.round(zoom)}%</span>
            <span className="material-symbols-outlined">expand_more</span>
          </button>
        </GraphControlTooltip>
        {dropdownOpen && (
          <div className={`graph-controls__zoom-dropdown${openUp ? ' graph-controls__zoom-dropdown--up' : ''}`}>
            <div className="graph-controls__zoom-list">
              {ZOOM_PRESETS.map((preset) => {
                const active = zoomMode === null && Math.round(zoom) === preset;
                return (
                  <button
                    key={preset}
                    type="button"
                    className={`graph-controls__zoom-option${active ? ' graph-controls__zoom-option--active' : ''}`}
                    onClick={() => {
                      setZoomMode(null);
                      onZoomSelect?.(preset / 100);
                      setDropdownOpen(false);
                    }}
                  >
                    <span>{preset}%</span>
                    {renderCheck(active)}
                  </button>
                );
              })}
            </div>
            <div className="graph-controls__zoom-sticky">
              {/* Fit/Fill are view actions, not zoom values — a rule separates the groups. */}
              <div className="graph-controls__zoom-divider" aria-hidden />
              {!hideFill && (
                <button
                  type="button"
                  className={`graph-controls__zoom-option${zoomMode === 'fill' ? ' graph-controls__zoom-option--active' : ''}`}
                  onClick={() => {
                    setZoomMode('fill');
                    (onFillView ?? onFitView)?.();
                    setDropdownOpen(false);
                  }}
                >
                  <span>Fill</span>
                  {renderCheck(zoomMode === 'fill')}
                </button>
              )}
              <button
                type="button"
                className={`graph-controls__zoom-option${zoomMode === 'fit' ? ' graph-controls__zoom-option--active' : ''}`}
                onClick={() => {
                  setZoomMode('fit');
                  onFitView?.();
                  setDropdownOpen(false);
                }}
              >
                <span>Fit</span>
                {renderCheck(zoomMode === 'fit')}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  const zoomDropdown = renderZoomDropdown();

  if (isReviewResponseChrome) {
    const helpPill = onHelpToggle && (
      <div className="graph-controls__rr-help">
        <GraphControlTooltip text="Help center" above>
          <button
            type="button"
            className={`graph-controls__toggle-btn${helpOpen ? ' graph-controls__toggle-btn--active' : ''}`}
            onClick={onHelpToggle}
            aria-label="Help center"
            aria-pressed={helpOpen}
          >
            <span className="material-symbols-outlined">help</span>
          </button>
        </GraphControlTooltip>
      </div>
    );

    return (
      <div className={`graph-controls graph-controls--rr-chrome${combineControlsLeft ? ' graph-controls--rr-chrome-combined' : ''}`}>
        <div className="graph-controls__rr-zoom">
          {combineControlsLeft ? (
            renderZoomDropdown({ hideFill: true, openUp: true })
          ) : (
            <>
              <GraphControlTooltip text="Zoom in" above>
                <button
                  type="button"
                  className="graph-controls__toggle-btn"
                  onClick={zoomIn}
                  aria-label="Zoom in"
                >
                  <RrIcon src={iconZoomIn} />
                </button>
              </GraphControlTooltip>
              <span className="graph-controls__rr-zoom-label" aria-live="polite">
                {Math.round(zoom)}%
              </span>
              <GraphControlTooltip text="Zoom out" above>
                <button
                  type="button"
                  className="graph-controls__toggle-btn"
                  onClick={zoomOut}
                  aria-label="Zoom out"
                >
                  <RrIcon src={iconZoomOut} />
                </button>
              </GraphControlTooltip>
              <div className="graph-controls__rr-divider" aria-hidden />
              <GraphControlTooltip text="Fit to screen" above>
                <button
                  type="button"
                  className="graph-controls__toggle-btn"
                  onClick={() => {
                    setZoomMode('fit');
                    onFitView?.();
                  }}
                  aria-label="Fit to screen"
                >
                  <RrIcon src={iconFit} />
                </button>
              </GraphControlTooltip>
            </>
          )}
        </div>

        {!viewOnly && (
          <div className="graph-controls__rr-edit">
            {!hideUndoRedo && (
              <>
                <GraphControlTooltip text="Undo" above>
                  <button
                    className="graph-controls__toggle-btn"
                    onClick={onUndo}
                    disabled={!canUndo}
                    aria-disabled={!canUndo}
                    type="button"
                    aria-label="Undo"
                  >
                    <RrIcon src={iconUndo} />
                  </button>
                </GraphControlTooltip>
                <GraphControlTooltip text="Redo" above>
                  <button
                    className="graph-controls__toggle-btn"
                    onClick={onRedo}
                    disabled={!canRedo}
                    aria-disabled={!canRedo}
                    type="button"
                    aria-label="Redo"
                  >
                    <RrIcon src={iconRedo} />
                  </button>
                </GraphControlTooltip>
                <div className="graph-controls__rr-divider" aria-hidden />
              </>
            )}
            <GraphControlTooltip text="Horizontal layout" above>
              <button
                className={`graph-controls__toggle-btn${orientation === 'horizontal' ? ' graph-controls__toggle-btn--active' : ''}`}
                onClick={() => onOrientationChange?.('horizontal')}
                type="button"
                aria-label="Horizontal layout"
              >
                <span className="material-symbols-outlined">arrow_forward</span>
              </button>
            </GraphControlTooltip>
            <GraphControlTooltip text="Vertical layout" above>
              <button
                className={`graph-controls__toggle-btn${orientation === 'vertical' ? ' graph-controls__toggle-btn--active' : ''}`}
                onClick={() => onOrientationChange?.('vertical')}
                type="button"
                aria-label="Vertical layout"
              >
                <span className="material-symbols-outlined">arrow_downward</span>
              </button>
            </GraphControlTooltip>

            {/* Off combined mode, Help stays nested here — a DOM child only so it can anchor
                12px off this pill's right edge without hardcoding that pill's width. */}
            {!combineControlsLeft && helpPill}
          </div>
        )}

        {/* Combined mode (Response agents Sep1): Help is its own sibling pill, in normal
            flow beside zoom/edit instead of anchored off the editor pill's right edge. */}
        {combineControlsLeft && helpPill}
      </div>
    );
  }

  return (
    <div className="graph-controls">
      {isReviewsAgent ? (
        !viewOnly && (
          <GraphControlTooltip text="Orientation" above>
            <div className="graph-controls__toggle">
              <button
                className={`graph-controls__toggle-btn${orientation === 'vertical' ? ' graph-controls__toggle-btn--active' : ''}`}
                onClick={() => onOrientationChange?.('vertical')}
                type="button"
              >
                <span className="material-symbols-outlined">arrow_downward</span>
              </button>
              <button
                className={`graph-controls__toggle-btn${orientation === 'horizontal' ? ' graph-controls__toggle-btn--active' : ''}`}
                onClick={() => onOrientationChange?.('horizontal')}
                type="button"
              >
                <span className="material-symbols-outlined">arrow_forward</span>
              </button>
            </div>
          </GraphControlTooltip>
        )
      ) : (
        <div className="graph-controls__toggle">
          <GraphControlTooltip text="Vertical layout">
            <button
              className={`graph-controls__toggle-btn${orientation === 'vertical' ? ' graph-controls__toggle-btn--active' : ''}`}
              onClick={() => onOrientationChange?.('vertical')}
              type="button"
            >
              <span className="material-symbols-outlined">arrow_downward</span>
            </button>
          </GraphControlTooltip>
          <GraphControlTooltip text="Horizontal layout">
            <button
              className={`graph-controls__toggle-btn${orientation === 'horizontal' ? ' graph-controls__toggle-btn--active' : ''}`}
              onClick={() => onOrientationChange?.('horizontal')}
              type="button"
            >
              <span className="material-symbols-outlined">arrow_forward</span>
            </button>
          </GraphControlTooltip>
        </div>
      )}

      {!viewOnly && isReviewsAgent && (
        <div className="graph-controls__toggle">
          <GraphControlTooltip text="Undo" above>
            <button
              className="graph-controls__toggle-btn"
              onClick={onUndo}
              disabled={!canUndo}
              aria-disabled={!canUndo}
              type="button"
            >
              <span className="material-symbols-outlined">undo</span>
            </button>
          </GraphControlTooltip>
          <GraphControlTooltip text="Redo" above>
            <button
              className="graph-controls__toggle-btn"
              onClick={onRedo}
              disabled={!canRedo}
              aria-disabled={!canRedo}
              type="button"
            >
              <span className="material-symbols-outlined">redo</span>
            </button>
          </GraphControlTooltip>
        </div>
      )}

      {zoomDropdown}

      {(onEdit || onView) && (
        <div className="graph-controls__mode-toggle">
          {onEdit && (
            <GraphControlTooltip text="Edit workflow">
              <button
                className={`graph-controls__toggle-btn${!viewOnly ? ' graph-controls__toggle-btn--active' : ''}`}
                onClick={onEdit}
                type="button"
              >
                <span className="material-symbols-outlined">edit</span>
              </button>
            </GraphControlTooltip>
          )}
          {onView && (
            <GraphControlTooltip text="View workflow">
              <button
                className={`graph-controls__toggle-btn${viewOnly ? ' graph-controls__toggle-btn--active' : ''}`}
                onClick={onView}
                type="button"
              >
                <span className="material-symbols-outlined">visibility</span>
              </button>
            </GraphControlTooltip>
          )}
        </div>
      )}

      <GraphControlTooltip text={isReviewsAgent ? 'Run preview' : 'Preview'} above={isReviewsAgent}>
        <button
          className="graph-controls__run"
          onClick={onRun}
          type="button"
          disabled={runDisabled}
          aria-disabled={runDisabled}
        >
          <span className="material-symbols-outlined">play_arrow</span>
        </button>
      </GraphControlTooltip>
    </div>
  );
}
