import React, { useState, useRef, useEffect } from 'react';
import { FormInput, TextArea } from '../../../elemental-stubs';
import '../../../Molecules/Conditions/Conditions.css';
import styles from './ConversationTriggerBody.module.css';

const VOICE_OPTIONS = [
  { value: 'incoming_call', label: 'Incoming call' },
  { value: 'outgoing_call', label: 'Outgoing call' },
  { value: 'missed_call', label: 'Missed call' },
  { value: 'voicemail', label: 'Voicemail received' },
];

const WEBCHAT_OPTIONS = [
  { value: 'message_received', label: 'Message received' },
  { value: 'message_sent', label: 'Message sent' },
  { value: 'chat_started', label: 'Chat started' },
  { value: 'chat_ended', label: 'Chat ended' },
];

const TIME_OPTIONS = [
  { value: 'during_business', label: 'During business hours' },
  { value: 'after_business', label: 'After business hours' },
  { value: 'all_hours', label: 'All hours' },
];

function ConditionDropdown({ value, options, onChange, placeholder, readOnly }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (readOnly) return undefined;
    const close = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [readOnly]);

  const selectedLabel = options.find((o) => o.value === value)?.label;

  return (
    <div className="tc-dropdown" ref={ref}>
      <button
        type="button"
        className={`tc-dropdown__trigger${open ? ' tc-dropdown__trigger--open' : ''}${readOnly ? ' tc-dropdown__trigger--readonly' : ''}`}
        onClick={() => { if (!readOnly) setOpen((v) => !v); }}
        aria-readonly={readOnly || undefined}
        tabIndex={readOnly ? -1 : undefined}
      >
        <span className={`tc-dropdown__value${!selectedLabel ? ' tc-dropdown__value--placeholder' : ''}`}>
          {selectedLabel || placeholder}
        </span>
        <span className="material-symbols-outlined tc-dropdown__chevron">expand_more</span>
      </button>
      {open && (
        <ul className="tc-dropdown__menu" role="listbox">
          {options.map((opt) => (
            <li
              key={opt.value}
              role="option"
              aria-selected={opt.value === value}
              className={`tc-dropdown__option${opt.value === value ? ' tc-dropdown__option--selected' : ''}`}
              onClick={() => { onChange(opt.value); setOpen(false); }}
            >
              {opt.label}
              {opt.value === value && (
                <span className="material-symbols-outlined tc-dropdown__check">check</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function makeRow(conditionValue = '', timeValue = '') {
  return { id: Date.now() + Math.random(), condition: conditionValue, time: timeValue };
}

function ChannelSection({ icon, title, conditionsLabel, conditionOptions, rows, onRowChange, onAddRow, onRemoveRow, viewOnly }) {
  return (
    <div className={styles.channelSection}>
      <div className={styles.channelHeader}>
        <span className={`material-symbols-outlined ${styles.channelIcon}`}>{icon}</span>
        <span className={styles.channelTitle}>{title}</span>
      </div>

      <div className="trigger-conditions__card">
        {conditionsLabel && (
          <span className={styles.conditionsLabel}>{conditionsLabel}</span>
        )}
        <div className="trigger-conditions__conditions">
          {rows.map((row, idx) => (
            <div key={row.id}>
              <div className="trigger-conditions__condition">
                <ConditionDropdown
                  value={row.condition}
                  options={conditionOptions}
                  onChange={(val) => onRowChange(row.id, 'condition', val)}
                  placeholder="Select condition"
                  readOnly={viewOnly}
                />
                <ConditionDropdown
                  value={row.time}
                  options={TIME_OPTIONS}
                  onChange={(val) => onRowChange(row.id, 'time', val)}
                  placeholder="Select time"
                  readOnly={viewOnly}
                />
              </div>
              {!viewOnly && rows.length > 1 && idx < rows.length - 1 && (
                <div className={styles.connectorRow}>
                  <span className={styles.connectorLabel}>AND</span>
                  <button
                    type="button"
                    className={styles.removeRowBtn}
                    onClick={() => onRemoveRow(row.id)}
                    title="Remove"
                  >
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>
              )}
              {!viewOnly && rows.length > 1 && idx === rows.length - 1 && (
                <div className={styles.connectorRow}>
                  <button
                    type="button"
                    className={styles.removeRowBtn}
                    onClick={() => onRemoveRow(row.id)}
                    title="Remove"
                  >
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {!viewOnly && (
          <button type="button" className="trigger-conditions__add-btn" onClick={onAddRow}>
            <span className="material-symbols-outlined" style={{ fontSize: 20, width: 20, height: 20 }}>add_circle</span>
            Add
          </button>
        )}
      </div>
    </div>
  );
}

export default function ConversationTriggerBody({ initialValues = {}, onFieldChange, viewOnly = false }) {
  const [triggerName, setTriggerName] = useState(initialValues.triggerName ?? '');
  const [description, setDescription] = useState(initialValues.description ?? '');
  // A wizard-built trigger explicitly sets voiceRows/webChatRows — to an empty
  // array when that channel wasn't selected during onboarding. Respect that as
  // given. Only fall back to a single default row when the node carries no
  // seeded rows at all, e.g. a trigger added manually on the canvas.
  const hasSeededChannelRows =
    initialValues.voiceRows !== undefined || initialValues.webChatRows !== undefined;
  const [voiceRows, setVoiceRows] = useState(
    hasSeededChannelRows
      ? initialValues.voiceRows ?? []
      : [makeRow(VOICE_OPTIONS[0].value, TIME_OPTIONS[0].value)]
  );
  const [webChatRows, setWebChatRows] = useState(
    hasSeededChannelRows
      ? initialValues.webChatRows ?? []
      : [makeRow(WEBCHAT_OPTIONS[0].value, TIME_OPTIONS[0].value)]
  );

  const handleTriggerName = (e) => {
    const val = e.target.value;
    setTriggerName(val);
    onFieldChange?.('triggerName', val);
  };

  const handleDescription = (e) => {
    const val = e.target.value;
    setDescription(val);
    onFieldChange?.('description', val);
  };

  function updateRows(setter, field, rows, id, key, val) {
    const next = rows.map((r) => r.id === id ? { ...r, [key]: val } : r);
    setter(next);
    onFieldChange?.(field, next);
  }

  function addRow(setter, field, rows, conditionOptions) {
    const next = [...rows, makeRow(conditionOptions[0]?.value || '', TIME_OPTIONS[0].value)];
    setter(next);
    onFieldChange?.(field, next);
  }

  function removeRow(setter, field, rows, id) {
    const next = rows.filter((r) => r.id !== id);
    setter(next);
    onFieldChange?.(field, next);
  }

  return (
    <div className={styles.body}>
      <FormInput
        name="triggerName"
        type="text"
        label="Trigger name"
        placeholder="Enter trigger name"
        value={triggerName}
        onChange={handleTriggerName}
        required
        readOnly={viewOnly}
      />
      <TextArea
        name="description"
        label="Description"
        placeholder="Enter description"
        value={description}
        onChange={handleDescription}
        noFloatingLabel
        required
        readOnly={viewOnly}
      />

      {voiceRows.length > 0 && (
        <ChannelSection
          icon="call"
          title="Voice call"
          conditionsLabel="Trigger conditions for voice"
          conditionOptions={VOICE_OPTIONS}
          rows={voiceRows}
          onRowChange={(id, key, val) => updateRows(setVoiceRows, 'voiceRows', voiceRows, id, key, val)}
          onAddRow={() => addRow(setVoiceRows, 'voiceRows', voiceRows, VOICE_OPTIONS)}
          onRemoveRow={(id) => removeRow(setVoiceRows, 'voiceRows', voiceRows, id)}
          viewOnly={viewOnly}
        />
      )}

      {webChatRows.length > 0 && (
        <ChannelSection
          icon="chat"
          title="Web chat"
          conditionsLabel="Trigger conditions for web chat"
          conditionOptions={WEBCHAT_OPTIONS}
          rows={webChatRows}
          onRowChange={(id, key, val) => updateRows(setWebChatRows, 'webChatRows', webChatRows, id, key, val)}
          onAddRow={() => addRow(setWebChatRows, 'webChatRows', webChatRows, WEBCHAT_OPTIONS)}
          onRemoveRow={(id) => removeRow(setWebChatRows, 'webChatRows', webChatRows, id)}
          viewOnly={viewOnly}
        />
      )}
    </div>
  );
}
