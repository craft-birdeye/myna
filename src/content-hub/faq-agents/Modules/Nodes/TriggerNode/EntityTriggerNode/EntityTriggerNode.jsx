import React from 'react';
import styles from './EntityTriggerNode.module.css';

export default function EntityTriggerNode({ id, data }) {
  const isSelected = id === data?.selectedNodeId;
  return (
    <div className={`${styles.node}${isSelected ? ` ${styles['node--selected']}` : ''}`}>
      {/* EntityTriggerNode — implementation pending */}
    </div>
  );
}
