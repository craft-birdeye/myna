import React, { useState, useRef, useEffect } from 'react';
import GraphControlTooltip from './GraphControlTooltip';
import './GraphControls.css';

const ZOOM_PRESETS = [200, 175, 150, 125, 100, 50, 25, 10];

export default function GraphControls({
  orientation = 'vertical',
  onOrientationChange,
  onRun,
  onEdit,
  zoom = 100,
  onZoomSelect,
  onFitView,
  onFillView = null,
  viewOnly = false,
  runDisabled = false,
  agentName = '',
  onUndo = () => {},
  onRedo = () => {},
  canUndo = false,
  canRedo = false,
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  /** Sticky footer selection: 'fill' | 'fit' | null (percentage active). */
  const [zoomMode, setZoomMode] = useState(null);
  const dropdownRef = useRef(null);
  // Reviews AI only, per product decision — other agents keep today's toolbar unchanged.
  const isReviewsAgent = /review (response|generation) agent/i.test(agentName || '');

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

  return (
    <div className="graph-controls">
      {!viewOnly && (
        isReviewsAgent ? (
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
        )
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

      <div className="graph-controls__zoom" ref={dropdownRef}>
        <GraphControlTooltip text="Zoom" above={isReviewsAgent}>
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
          <div className="graph-controls__zoom-dropdown">
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
              <div className="graph-controls__zoom-divider" />
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

      {onEdit && (
        <GraphControlTooltip text="Edit workflow">
          <button className="graph-controls__run" onClick={onEdit} type="button">
            <span className="material-symbols-outlined">edit</span>
          </button>
        </GraphControlTooltip>
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
