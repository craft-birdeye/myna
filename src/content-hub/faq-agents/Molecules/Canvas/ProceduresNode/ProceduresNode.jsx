import React, { useState } from 'react';
import CanvasNodeHeader from '../CanvasNodeHeader/CanvasNodeHeader';
import styles from './ProceduresNode.module.css';
import './CanvasNode.css';

export default function ProceduresNode({
  stepNumber,
  procedureItems = [],
  hasToggle = false,
  toggleEnabled = true,
  onToggleChange,
  onDelete,
  onMoveUp,
  onMoveDown,
  canMoveUp = false,
  canMoveDown = false,
  state = 'default',
  onDropProcedure,
}) {
  const [isDragOver, setIsDragOver] = useState(false);
  const stateClass = state !== 'default' ? ` canvas-node--${state}` : '';

  const handleDragOver = (e) => {
    const type = e.dataTransfer.types.includes('application/reactflow-type');
    if (!type) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    // Only clear if truly leaving this node (not entering a child)
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const nodeType = e.dataTransfer.getData('application/reactflow-type');
    const label = e.dataTransfer.getData('application/reactflow-label');
    if (nodeType === 'procedures' && label && onDropProcedure) {
      onDropProcedure(label);
    }
  };

  return (
    <div
      className={`canvas-node${stateClass}${isDragOver ? ' canvas-node--drop-target' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <CanvasNodeHeader
        nodeType="procedures"
        label="Procedures"
        hasToggle={hasToggle}
        toggleEnabled={toggleEnabled}
        onToggleChange={onToggleChange}
        onDelete={onDelete}
        onMoveUp={onMoveUp}
        onMoveDown={onMoveDown}
        canMoveUp={canMoveUp}
        canMoveDown={canMoveDown}
      />
      <div className={styles.body}>
        {stepNumber != null && (
          <span className={styles.step}>{stepNumber}. Follow procedures</span>
        )}
        {procedureItems.length > 0 ? (
          <div className={styles.chips}>
            {procedureItems.map((p) => (
              <span key={p.id} className={styles.chip}>
                <span className={`material-symbols-outlined ${styles.chipIcon}`}>article</span>
                {p.name}
              </span>
            ))}
          </div>
        ) : (
          <span className={`${styles.empty}${isDragOver ? ` ${styles.emptyDragOver}` : ''}`}>
            {isDragOver ? 'Drop to add procedure' : 'Add procedures from the left panel'}
          </span>
        )}
        {isDragOver && procedureItems.length > 0 && (
          <div className={styles.dropHint}>Drop to add procedure</div>
        )}
      </div>
    </div>
  );
}
