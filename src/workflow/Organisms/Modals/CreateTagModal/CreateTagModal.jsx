import React, { useState } from 'react';
import { AeroFormModal } from '../../../../components/AeroFormModal/AeroFormModal';
import styles from './CreateTagModal.module.css';

const TAG_MODAL_SUBTITLE =
  'Tags categorize reviews so the agent can route and report on them.';
const TAGS_LEARN_MORE_HREF =
  'https://help.birdeye.com/hc/en-us/articles/review-tags-in-workflows';

function FieldLabel({ children, required = false }) {
  return (
    <div className="flex items-center gap-xs">
      <span className="text-small text-text-primary">{children}</span>
      {required && <span className="text-small text-chip-danger-text">*</span>}
    </div>
  );
}

/**
 * Add / edit tag — same shell as `AddInputFieldModal` so both read as one pattern.
 * `initialName` prefills from the tag picker's `Create tag "…"` row; `mode='edit'`
 * comes from a chip's pencil and prefills both fields.
 */
export default function CreateTagModal({
  initialName = '',
  initialDescription = '',
  mode = 'add',
  onClose,
  onAdd,
  zIndex = 2100,
}) {
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);

  const isEdit = mode === 'edit';
  const canAdd = name.trim().length > 0;

  function handleAdd() {
    if (!canAdd) return;
    onAdd({ name: name.trim(), description: description.trim() });
    onClose();
  }

  return (
    <AeroFormModal
      title={isEdit ? 'Edit tag' : 'Add tag'}
      subtitle={TAG_MODAL_SUBTITLE}
      learnMoreHref={TAGS_LEARN_MORE_HREF}
      onClose={onClose}
      onPrimary={handleAdd}
      primaryLabel={isEdit ? 'Save' : 'Add tag'}
      primaryDisabled={!canAdd}
      zIndex={zIndex}
      panelClassName="h-[360px]"
    >
      <div className="flex flex-col gap-xl pb-md">
        <label className="flex flex-col gap-xs">
          <FieldLabel required>Tag name</FieldLabel>
          <input
            type="text"
            className={styles.fieldInput}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Tag name"
            autoFocus={isEdit || !initialName}
          />
        </label>

        <label className="flex flex-col gap-xs">
          <FieldLabel>Description</FieldLabel>
          <textarea
            className={styles.fieldTextarea}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description"
            rows={3}
            // Name arrived prefilled from the picker → the description is what's left to type.
            autoFocus={!isEdit && !!initialName}
          />
        </label>
      </div>
    </AeroFormModal>
  );
}
