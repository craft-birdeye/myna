import React, { useState, useEffect } from 'react';
import { FormInput, TextArea } from '../../../elemental-stubs';
import { subscribeToCustomTools } from '../../../services/agentService';
import styles from './EntityTaskBody.module.css';

export default function EntityTaskBody({ initialValues = {}, onFieldChange }) {
  const [taskName, setTaskName] = useState(initialValues.taskName ?? '');
  const [description, setDescription] = useState(initialValues.description ?? '');
  const [selectedTools, setSelectedTools] = useState(initialValues.selectedTools ?? []);
  const [allTools, setAllTools] = useState([]);

  useEffect(() => {
    const unsub = subscribeToCustomTools((tools) => setAllTools(tools));
    return unsub;
  }, []);

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

  const handleRemoveTool = (toolId) => {
    const next = selectedTools.filter((id) => id !== toolId);
    setSelectedTools(next);
    onFieldChange?.('selectedTools', next);
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
        noFloatingLabel
      />

      <div className={styles.toolsSection}>
        <div className={styles.sectionLabelWrapper}>
          <span className={styles.sectionLabelText}>Tools</span>
          <span className={`material-symbols-outlined ${styles.sectionLabelIcon}`}>info</span>
        </div>

        <div className={styles.addBox}>
          {displayedTools.map((tool) => (
            <div key={tool.id} className={styles.toolRow}>
              <div className={styles.toolRowMain}>
                <div className={styles.toolIconWrap}>
                  {tool.iconDataUrl ? (
                    <img src={tool.iconDataUrl} alt={tool.name} className={styles.toolIconImg} />
                  ) : (
                    <span className={`material-symbols-outlined ${styles.toolIconFallback}`}>build</span>
                  )}
                </div>
                <span className={styles.toolName}>{tool.name}</span>
              </div>
              <div className={styles.toolActions}>
                <button
                  className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                  onClick={() => handleRemoveTool(tool.id)}
                  title="Remove tool"
                >
                  <span className={`material-symbols-outlined ${styles.iconBtnIcon}`}>close</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
