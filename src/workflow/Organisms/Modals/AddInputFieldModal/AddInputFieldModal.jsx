import React, { useState, useRef } from 'react';
import { AeroFormModal } from '../../../../components/AeroFormModal/AeroFormModal';
import DataType from '../../../Molecules/DataType/DataType';
import { VariableIcon } from '../../../Molecules/Inputs/PromptToolbarIcons.jsx';
import FieldPickerModal from '../FieldPickerModal/FieldPickerModal.jsx';
import styles from './AddInputFieldModal.module.css';

const INPUT_FIELD_MODAL_SUBTITLE =
  'Input fields add context to your prompt and are automatically included when generating the output.';
const INPUT_FIELDS_LEARN_MORE_HREF =
  'https://help.birdeye.com/hc/en-us/articles/input-fields-in-workflows';

function FieldLabel({ children, required = false }) {
  return (
    <div className="flex items-center gap-xs">
      <span className="text-small text-text-primary">{children}</span>
      {required && <span className="text-small text-chip-danger-text">*</span>}
    </div>
  );
}

export default function AddInputFieldModal({ onClose, onAdd, zIndex = 2100, onLearnMore }) {
  const [fieldName, setFieldName] = useState('');
  const [fieldValueText, setFieldValueText] = useState('');
  const [fieldValueChips, setFieldValueChips] = useState([]);
  const [fieldPickerOpen, setFieldPickerOpen] = useState(false);
  const fieldValueRef = useRef(null);
  const textInputRef = useRef(null);

  const hasFieldValue = fieldValueChips.length > 0 || fieldValueText.trim().length > 0;

  function removeChip(index) {
    setFieldValueChips((prev) => prev.filter((_, i) => i !== index));
  }

  function handleFieldSelect(value, name) {
    const label = name || value;
    setFieldValueChips((prev) => (prev.includes(label) ? prev : [...prev, label]));
    setFieldPickerOpen(false);
    requestAnimationFrame(() => textInputRef.current?.focus());
  }

  function handleAdd() {
    if (!fieldName || !hasFieldValue) return;
    const fieldValue = [
      ...fieldValueChips,
      ...(fieldValueText.trim() ? [fieldValueText.trim()] : []),
    ];
    onAdd({ fieldName, fieldValue });
    onClose();
  }

  return (
    <>
      <AeroFormModal
        title="Add input field"
        subtitle={INPUT_FIELD_MODAL_SUBTITLE}
        learnMoreHref={onLearnMore ? undefined : INPUT_FIELDS_LEARN_MORE_HREF}
        onLearnMore={onLearnMore}
        onClose={onClose}
        onPrimary={handleAdd}
        primaryDisabled={!fieldName || !hasFieldValue}
        zIndex={zIndex}
        panelClassName="h-[360px]"
      >
        <div className="flex flex-col gap-xl pb-md">
          <label className="flex flex-col gap-xs">
            <FieldLabel required>Field name</FieldLabel>
            <input
              type="text"
              className={styles.fieldInput}
              value={fieldName}
              onChange={(e) => setFieldName(e.target.value)}
              placeholder="Field name"
            />
          </label>

          <label className="flex flex-col gap-xs">
            <FieldLabel required>Field value</FieldLabel>
            <div
              ref={fieldValueRef}
              className={styles.fieldValueBox}
              onClick={() => textInputRef.current?.focus()}
            >
              {fieldValueChips.map((chip, i) => (
                <DataType
                  key={`${chip}-${i}`}
                  type="variable"
                  label={chip}
                  onRemove={(e) => { e.stopPropagation(); removeChip(i); }}
                />
              ))}
              <input
                ref={textInputRef}
                type="text"
                className={styles.fieldValueText}
                value={fieldValueText}
                onChange={(e) => setFieldValueText(e.target.value)}
                placeholder={fieldValueChips.length === 0 ? 'Field value' : ''}
              />
              <button
                type="button"
                className={styles.insertFieldBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  setFieldPickerOpen(true);
                }}
                aria-label="Insert field"
                title="Insert field"
              >
                <VariableIcon />
              </button>
            </div>
          </label>
        </div>
      </AeroFormModal>

      {fieldPickerOpen && (
        <FieldPickerModal
          onClose={() => setFieldPickerOpen(false)}
          onSelectField={handleFieldSelect}
          anchorEl={fieldValueRef.current}
          placement="dropdown"
          showTriggerFields
          overlayZIndex={zIndex + 100}
        />
      )}
    </>
  );
}
