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
    </div>
  );
}
