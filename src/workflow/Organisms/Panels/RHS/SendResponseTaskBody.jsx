import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { FormInput, TextArea } from '../../../elemental-stubs';
import UserPromptInput from '../../../Molecules/Inputs/UserPromptInput/UserPromptInput';
import styles from './SendResponseTaskBody.module.css';

const DEFAULT_TASK_NAME = 'Send response';
const MESSAGE_MODE_INFO = 'Sends a message to the user at the defined point in the conversation. Use Literal to define the exact wording, or Prompt to let the AI generate a response based on instructions.';

function ConfigureMessageInfo() {
  const [pos, setPos] = useState(null);
  const ref = useRef(null);

  function show() {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    setPos({ x: r.left + r.width / 2, y: r.top - 8 });
  }

  return (
    <span
      ref={ref}
      className={styles.infoIconBtn}
      onMouseEnter={show}
      onMouseLeave={() => setPos(null)}
    >
      <span className={`material-symbols-outlined ${styles.infoIcon}`}>info</span>
      {pos && createPortal(
        <div
          className="pointer-events-none fixed z-[120] w-max max-w-[280px] rounded-sm bg-[#212121] px-sm py-xs text-small text-white shadow-dropdown"
          style={{ left: pos.x, top: pos.y, transform: 'translate(-50%, -100%)', lineHeight: '18px' }}
        >
          {MESSAGE_MODE_INFO}
        </div>,
        document.body,
      )}
    </span>
  );
}

export default function SendResponseTaskBody({ initialValues = {}, onFieldChange, viewOnly = false }) {
  const [taskName, setTaskName] = useState(initialValues.taskName ?? DEFAULT_TASK_NAME);
  const [description, setDescription] = useState(initialValues.description ?? '');
  const [messageMode, setMessageMode] = useState(initialValues.messageMode ?? 'Literal');
  const [literalMessage, setLiteralMessage] = useState(initialValues.literalMessage ?? '');
  const [promptMessage, setPromptMessage] = useState(initialValues.promptMessage ?? '');

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

  const handleMessageMode = (mode) => {
    setMessageMode(mode);
    onFieldChange?.('messageMode', mode);
  };

  const handleLiteralMessage = (val) => {
    setLiteralMessage(val);
    onFieldChange?.('literalMessage', val);
  };

  const handlePromptMessage = (val) => {
    setPromptMessage(val);
    onFieldChange?.('promptMessage', val);
  };

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
        readOnly={viewOnly}
      />
      <TextArea
        name="description"
        label="Description"
        placeholder="Enter"
        value={description}
        onChange={handleDescription}
        required
        noFloatingLabel
        readOnly={viewOnly}
      />

      <div className={styles.section}>
        <div className={styles.sectionLabelWrapper}>
          <span className={styles.sectionLabelText}>Configure message</span>
          <ConfigureMessageInfo />
        </div>
        <div className={styles.radioRow}>
          <label className={styles.radioLabel}>
            <input
              type="radio"
              name="send-response-message-mode"
              checked={messageMode === 'Literal'}
              onChange={() => handleMessageMode('Literal')}
              disabled={viewOnly}
            />
            Literal
          </label>
          <label className={styles.radioLabel}>
            <input
              type="radio"
              name="send-response-message-mode"
              checked={messageMode === 'Prompt'}
              onChange={() => handleMessageMode('Prompt')}
              disabled={viewOnly}
            />
            Prompt
          </label>
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionLabelWrapper}>
          <span className={styles.sectionLabelText}>
            {messageMode === 'Literal' ? 'Enter literal message' : 'Enter prompt'}
            <span className={styles.required}> *</span>
          </span>
        </div>
        {messageMode === 'Literal' ? (
          <UserPromptInput
            hideLabel
            value={literalMessage}
            onChange={handleLiteralMessage}
            placeholder="Enter literal message"
            readOnly={viewOnly}
          />
        ) : (
          <UserPromptInput
            hideLabel
            value={promptMessage}
            onChange={handlePromptMessage}
            placeholder="Enter prompt"
            readOnly={viewOnly}
          />
        )}
      </div>
    </div>
  );
}
