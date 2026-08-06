import React from 'react';

export default function GraphControlTooltip({ text, children }) {
  return (
    <span className="graph-control-tooltip">
      {children}
      <span className="graph-control-tooltip__label" role="tooltip">
        {text}
      </span>
    </span>
  );
}
