import React, { useState, useRef, useEffect } from 'react';
import GraphControlTooltip from './GraphControlTooltip';
import './GraphControls.css';

const ZOOM_PRESETS = [50, 75, 100, 125, 150, 200];

export default function GraphControls({
  orientation = 'vertical',
  onOrientationChange,
  onRun,
  onEdit,
  zoom = 100,
  onZoomSelect,
  onFitView,
  viewOnly = false,
  runDisabled = false,
  onAiAssist = null,
  aiAssistOpen = false,
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

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

  return (
    <div className="graph-controls">
      {!viewOnly && (
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

      <div className="graph-controls__zoom" ref={dropdownRef}>
        <GraphControlTooltip text="Zoom">
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
            {ZOOM_PRESETS.map((preset) => (
              <button
                key={preset}
                className={`graph-controls__zoom-option${Math.round(zoom) === preset ? ' graph-controls__zoom-option--active' : ''}`}
                onClick={() => {
                  onZoomSelect?.(preset / 100);
                  setDropdownOpen(false);
                }}
              >
                {preset}%
              </button>
            ))}
            {onFitView && (
              <>
                <div className="graph-controls__zoom-divider" />
                <button
                  className="graph-controls__zoom-option"
                  onClick={() => {
                    onFitView();
                    setDropdownOpen(false);
                  }}
                >
                  Fit view
                </button>
              </>
            )}
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

      <GraphControlTooltip text="Preview">
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

      {onAiAssist && !aiAssistOpen && (
        <GraphControlTooltip text="AI assist">
          <button
            className="graph-controls__run graph-controls__ai-assist"
            onClick={onAiAssist}
            type="button"
            aria-label="AI assist"
          >
            <span className="graph-controls__ai-assist-avatar" aria-hidden>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <defs>
                  <linearGradient
                    id="graph-ai-assist-grad"
                    x1="3"
                    y1="3"
                    x2="21"
                    y2="21"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop offset="0%" stopColor="#9b6cf0" />
                    <stop offset="55%" stopColor="#6834b7" />
                    <stop offset="100%" stopColor="#3b82f6" />
                  </linearGradient>
                </defs>
                <path
                  d="M12 2 Q12 12 22 12 Q12 12 12 22 Q12 12 2 12 Q12 12 12 2 Z"
                  fill="url(#graph-ai-assist-grad)"
                />
              </svg>
            </span>
          </button>
        </GraphControlTooltip>
      )}
    </div>
  );
}
