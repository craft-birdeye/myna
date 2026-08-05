import React from 'react';
import { setFlowDragData } from '../../../flowDragData';
import './LHSNode.css';

export default function LHSNode({
  icon,
  label,
  action = 'chevron',
  isActive = false,
  nodeType,
  onClick,
  onHover,
  onDragStart,
  cardRef,
}) {
  const handleDragStart = (e) => {
    if (onDragStart) {
      onDragStart(e);
    } else {
      setFlowDragData(e.dataTransfer, {
        type: nodeType,
        label,
        description: label,
      });
    }
  };

  return (
    <div
      ref={cardRef}
      className={`lhs-node${isActive ? ' lhs-node--active' : ''}`}
      onClick={onClick}
      onMouseEnter={onHover}
      draggable={action === 'drag'}
      onDragStart={action === 'drag' ? handleDragStart : undefined}
    >
      <span className="lhs-node__icon material-symbols-outlined">{icon}</span>
      <span className="lhs-node__label">{label}</span>
      {action === 'drag' ? (
        <span className="lhs-node__action">
          <span className="material-symbols-outlined">drag_indicator</span>
        </span>
      ) : (
        <span className="lhs-node__action lhs-node__action--chevron">
          <span className="material-symbols-outlined">expand_more</span>
        </span>
      )}
    </div>
  );
}
