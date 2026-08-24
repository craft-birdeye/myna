import React, { useState, useEffect } from 'react';
import { FormInput, TextArea } from '../../../elemental-stubs';
import { subscribeToCustomTools } from '../../../services/agentService';
import styles from './VoiceCallTaskBody.module.css';

export const VOICE_CALL_TOOL_ID = 'initiate-voice-call';
const DEFAULT_TASK_NAME = 'Initiate voice call';
const DEFAULT_DESCRIPTION = 'Call the patient for their upcoming appointment';

function resolveToolId(initialValues) {
  return initialValues.toolId ?? initialValues.selectedTools?.[0] ?? VOICE_CALL_TOOL_ID;
}

export default function VoiceCallTaskBody({
  initialValues = {},
  onFieldChange,
  onEditTool,
  onSwapTool,
  viewOnly = false,
  actionLabel = 'Task',
}) {
  const [taskName, setTaskName] = useState(initialValues.taskName ?? DEFAULT_TASK_NAME);
  const [description, setDescription] = useState(initialValues.description ?? DEFAULT_DESCRIPTION);
  const [toolId, setToolId] = useState(() => resolveToolId(initialValues));
  const [allTools, setAllTools] = useState([]);

  useEffect(() => {
    const unsub = subscribeToCustomTools((tools) => setAllTools(tools));
    return unsub;
  }, []);

  useEffect(() => {
    setTaskName(initialValues.taskName ?? DEFAULT_TASK_NAME);
    setDescription(initialValues.description ?? DEFAULT_DESCRIPTION);
    setToolId(resolveToolId(initialValues));
  }, [initialValues.taskName, initialValues.description, initialValues.toolId, initialValues.selectedTools]);

  const activeTool = allTools.find((t) => t.id === toolId);
  const toolName = activeTool?.name ?? 'Initiate voice call';
  const toolIcon = activeTool?.icon ?? 'call';

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

  const handleEdit = (e) => {
    e.stopPropagation();
    onEditTool?.(toolId);
  };

  const handleSwap = (e) => {
    e.stopPropagation();
    onSwapTool?.();
  };

  return (
    <div className={styles.formContainer}>
      <FormInput
        name="taskName"
        type="text"
        label={`${actionLabel} name`}
        placeholder="Enter name"
        value={taskName}
        onChange={handleTaskName}
        required
        readOnly={viewOnly}
      />
      <TextArea
        name="description"
        label="Description"
        placeholder="Enter description"
        value={description}
        onChange={handleDescription}
        required
        noFloatingLabel
        readOnly={viewOnly}
      />

      <div className={styles.toolsSection}>
        <span className={styles.sectionLabelText}>Tools</span>
        <div className={styles.toolsBox}>
          <div className={styles.toolRow}>
            <div className={styles.toolRowMain}>
              <div className={styles.toolIconWrap}>
                {activeTool?.iconDataUrl ? (
                  <img src={activeTool.iconDataUrl} alt="" className={styles.toolIconImg} />
                ) : (
                  <span className={`material-symbols-outlined ${styles.toolIcon}`}>{toolIcon}</span>
                )}
              </div>
              <span className={styles.toolName}>{toolName}</span>
            </div>
            {!viewOnly && (
              <div className={styles.toolActions}>
                <button
                  type="button"
                  className={styles.iconBtn}
                  title="Edit tool configuration"
                  onClick={handleEdit}
                >
                  <span className={`material-symbols-outlined ${styles.iconBtnIcon}`}>edit</span>
                </button>
                <button
                  type="button"
                  className={styles.iconBtn}
                  title="Change tool"
                  onClick={handleSwap}
                >
                  <span className={`material-symbols-outlined ${styles.iconBtnIcon}`}>swap_horiz</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
