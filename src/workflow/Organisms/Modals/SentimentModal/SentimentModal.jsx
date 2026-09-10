import React, { useState } from 'react';
import { AeroFormModal } from '../../../../components/AeroFormModal/AeroFormModal';
import { Icon } from '../../../../components/Icon/Icon';
import styles from './SentimentModal.module.css';

function FieldLabel({ children, required = false }) {
  return (
    <div className="flex items-center gap-xs">
      <span className="text-small text-text-primary">{children}</span>
      {required && <span className="text-small text-chip-danger-text">*</span>}
    </div>
  );
}

/**
 * Add / edit a sentiment classification for the "Social sentiment classifier" tool.
 * `mode='edit'` prefills both fields from the row's pencil; when the row being edited
 * is one of the seed defaults, a "Restore default" link resets the fields in place.
 */
export default function SentimentModal({
  mode = 'add',
  initialName = '',
  initialDescription = '',
  isDefault = false,
  defaultName = '',
  defaultDescription = '',
  onClose,
  onSave,
  zIndex = 2100,
}) {
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);

  const isEdit = mode === 'edit';
  const canSave = name.trim().length > 0 && description.trim().length > 0;
  const isRestoreDisabled = name === defaultName && description === defaultDescription;

  function handleSave() {
    if (!canSave) return;
    onSave({ name: name.trim(), description: description.trim() });
    onClose();
  }

  function handleRestoreDefault() {
    setName(defaultName);
    setDescription(defaultDescription);
  }

  return (
    <AeroFormModal
      title={isEdit ? 'Edit sentiment' : 'Add sentiment'}
      titleAction={
        isEdit && isDefault ? (
          <button
            type="button"
            className={styles.restoreDefaultBtn}
            onClick={handleRestoreDefault}
            disabled={isRestoreDisabled}
          >
            <Icon name="restart_alt" size={16} />
            <span>Restore default</span>
          </button>
        ) : null
      }
      onClose={onClose}
      onPrimary={handleSave}
      primaryLabel="Save"
      primaryDisabled={!canSave}
      zIndex={zIndex}
      panelClassName="h-[380px]"
    >
      <div className="flex flex-col gap-xl pb-md">
        <label className="flex flex-col gap-xs">
          <FieldLabel required>Name</FieldLabel>
          <input
            type="text"
            className={styles.fieldInput}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter sentiment name"
            autoFocus
          />
        </label>

        <label className="flex flex-col gap-xs">
          <FieldLabel required>Description</FieldLabel>
          <textarea
            className={styles.fieldTextarea}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter sentiment description"
            rows={5}
          />
        </label>
      </div>
    </AeroFormModal>
  );
}
