import React, { useState, useEffect } from 'react';
import { FormInput, TextArea } from '../../../elemental-stubs';
import { subscribeToCustomTools } from '../../../services/agentService';
import birdeyeLogoUrl from '../../../../assets/birdeye-logo.svg';
import styles from './EntityTaskBody.module.css';

export default function EntityTaskBody({ initialValues = {}, onFieldChange, onOpenTool, onSwapTool }) {
  const [taskName, setTaskName] = useState(initialValues.taskName ?? '');
  const [description, setDescription] = useState(initialValues.description ?? '');
  const [selectedTools, setSelectedTools] = useState(initialValues.selectedTools ?? []);
  const [allTools, setAllTools] = useState([]);

  useEffect(() => {
    const unsub = subscribeToCustomTools((tools) => setAllTools(tools));
    return unsub;
  }, []);

  // Re-sync from the parent when the underlying node data changes externally — e.g. a tool
  // drawer (Reminder tool, Initiate voice call) saving its own edits, which regenerates this
  // node's description without going through this panel's own onChange handlers.
  useEffect(() => {
    setTaskName(initialValues.taskName ?? '');
    setDescription(initialValues.description ?? '');
    setSelectedTools(initialValues.selectedTools ?? []);
  }, [initialValues]);

  const handleTaskName = (e) => {
    const val = e.target.value;
    setTaskName(val);
    onFieldChange?.('taskName', val);
  };

  const handleDescription = (e) => {
    const val = e.target.value;
    setDescription(val);
    onFieldChange?.('description', val);
  };

  const displayedTools = allTools.filter((t) => selectedTools.includes(t.id));

  return (
    <div className={styles.formContainer}>
      <FormInput
        name="taskName"
        type="text"
        label="Task name"
        placeholder="Enter name"
        value={taskName}
        onChange={handleTaskName}
        required
      />
      <TextArea
        name="description"
        label="Description"
        placeholder="Enter description"
        value={description}
        onChange={handleDescription}
        required
        noFloatingLabel
      />

      <div className={styles.toolsSection}>
        <span className={styles.sectionLabelText}>Tool</span>

        {displayedTools.length > 0 && (
          <div className={styles.toolCard}>
            {displayedTools.map((tool) => (
              <div
                key={tool.id}
                className={styles.toolRow}
                onClick={() => onOpenTool?.(tool.id)}
                style={{ cursor: onOpenTool ? 'pointer' : 'default' }}
              >
                <div className={styles.toolRowMain}>
                  <div
                    className={`${styles.toolIconWrap}${tool.isBirdeye ? ` ${styles.toolIconWrapBirdeye}` : ''}`}
                  >
                    {tool.isBirdeye ? (
                      <img
                        src={birdeyeLogoUrl}
                        alt=""
                        className={styles.toolIconBirdeye}
                      />
                    ) : tool.icon ? (
                      <span
                        className="material-symbols-outlined"
                        style={{ fontSize: 16, color: '#555', fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}
                      >
                        {tool.icon}
                      </span>
                    ) : tool.iconDataUrl ? (
                      <img src={tool.iconDataUrl} alt={tool.name} className={styles.toolIconImg} />
                    ) : (
                      <span className={`material-symbols-outlined ${styles.toolIconFallback}`}>build</span>
                    )}
                  </div>
                  <span className={styles.toolName}>{tool.name}</span>
                </div>
                <div className={styles.toolRowActions}>
                  <button
                    type="button"
                    className={styles.toolActionBtn}
                    onClick={(e) => { e.stopPropagation(); onOpenTool?.(tool.id); }}
                    title="Edit tool configuration"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 16, lineHeight: 1, fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}>
                      edit
                    </span>
                  </button>
                  <button
                    type="button"
                    className={styles.toolActionBtn}
                    onClick={(e) => { e.stopPropagation(); onSwapTool?.(); }}
                    title="Replace tool"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 16, lineHeight: 1, fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}>
                      swap_horiz
                    </span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
