import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import toolbarStyles from './UserPromptInput/UserPromptInput.module.css';

/** Icon toolbar button with a hover tooltip (portal-based so it escapes any clipping ancestor) and optional disabled state. */
export default function ToolbarButton({ icon, tooltip, active, disabled, onClick }) {
  const [pos, setPos] = useState(null);
  const ref = useRef(null);

  function show() {
    if (disabled || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    setPos({ x: rect.left + rect.width / 2, y: rect.top - 8 });
  }

  return (
    <div ref={ref} className="relative flex items-center" onMouseEnter={show} onMouseLeave={() => setPos(null)}>
      <button
        type="button"
        className={`${toolbarStyles.toolbarBtn} ${active ? toolbarStyles.toolbarBtnActive : ''} ${disabled ? 'cursor-not-allowed opacity-40' : ''}`}
        onMouseDown={(e) => e.preventDefault()}
        onClick={disabled ? undefined : onClick}
        disabled={disabled}
        aria-label={tooltip}
      >
        {icon}
      </button>
      {pos && tooltip && createPortal(
        <div
          className="pointer-events-none fixed z-[120] w-max max-w-[200px] rounded-sm bg-[#212121] px-sm py-xs text-small text-white shadow-dropdown"
          style={{ left: pos.x, top: pos.y, transform: 'translate(-50%, -100%)' }}
        >
          {tooltip}
        </div>,
        document.body,
      )}
    </div>
  );
}
