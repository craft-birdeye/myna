import React, { useState, useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';

export default function GraphControlTooltip({ text, children, above = false }) {
  // Default (below): a simple inline tooltip — unchanged behavior for non-Reviews toolbars.
  if (!above) {
    return (
      <span className="graph-control-tooltip">
        {children}
        <span className="graph-control-tooltip__label" role="tooltip">
          {text}
        </span>
      </span>
    );
  }

  return <AbovePortalTooltip text={text}>{children}</AbovePortalTooltip>;
}

// Renders the tooltip above the trigger via a fixed-position body portal so it isn't
// clipped by the canvas's `overflow: hidden` ancestor (the floating toolbar sits near
// the top edge, leaving no room for an in-flow tooltip above it).
function AbovePortalTooltip({ text, children }) {
  const wrapRef = useRef(null);
  const [coords, setCoords] = useState(null);

  const show = useCallback(() => {
    const el = wrapRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setCoords({ top: r.top - 6, left: r.left + r.width / 2 });
  }, []);

  const hide = useCallback(() => setCoords(null), []);

  useEffect(() => {
    if (!coords) return undefined;
    const onScroll = () => hide();
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onScroll);
    };
  }, [coords, hide]);

  return (
    <span
      ref={wrapRef}
      className="graph-control-tooltip"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      {coords &&
        createPortal(
          <span
            className="graph-control-tooltip__label graph-control-tooltip__label--above graph-control-tooltip__label--floating"
            role="tooltip"
            style={{ top: coords.top, left: coords.left }}
          >
            {text}
          </span>,
          document.body,
        )}
    </span>
  );
}
