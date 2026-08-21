import React, { useState, useRef } from 'react';
import {
  Modal, Button, gray900, red100,
} from '../../../elemental-stubs';
import CloseIcon from '../../../Molecules/RHS/RHSHeader/icons/close.svg';
import DataType from '../../../Molecules/DataType/DataType';
import { VariableIcon } from '../../../Molecules/Inputs/PromptToolbarIcons.jsx';
import FieldPickerModal from '../FieldPickerModal/FieldPickerModal.jsx';
import styles from './AddInputFieldModal.module.css';

const font = '"Roboto", arial, sans-serif';

export default function AddInputFieldModal({ onClose, onAdd }) {
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
      <Modal
        dialogOptions={{
          isOpen: true,
          onCloseModal: onClose,
          shouldCloseOnOverlayClick: true,
          shouldCloseOnEsc: true,
          showCloseIcon: false,
          title: 'Add input field',
          dialogStyles: {
            content: {
              padding: 0,
              width: 650,
              maxWidth: 650,
              height: 320,
              maxHeight: 320,
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            },
          },
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 24px 12px', flexShrink: 0 }}>
          <span style={{ fontSize: 16, fontWeight: 400, lineHeight: '24px', letterSpacing: '-0.32px', color: gray900, fontFamily: font }}>
            Add input field
          </span>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex' }}>
            <img src={CloseIcon} alt="Close" style={{ width: 24, height: 24 }} />
          </button>
        </div>

        {/* Body */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: '0 24px', flex: 1, minHeight: 0 }}>
          {/* Field name */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 12, fontWeight: 400, lineHeight: '18px', color: gray900, fontFamily: font }}>
                Field name
              </span>
              <span style={{ fontSize: 12, lineHeight: '18px', color: red100, fontFamily: font }}>*</span>
            </div>
            <input
              type="text"
              className={styles.fieldInput}
              value={fieldName}
              onChange={(e) => setFieldName(e.target.value)}
              placeholder="Field name"
            />
          </div>

          {/* Field value — type freely; `{*}` icon opens the Fields picker */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 12, fontWeight: 400, lineHeight: '18px', color: gray900, fontFamily: font }}>
                Field value
              </span>
              <span style={{ fontSize: 12, lineHeight: '18px', color: red100, fontFamily: font }}>*</span>
            </div>
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
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, padding: '12px 24px 24px', flexShrink: 0 }}>
          <Button type="link" label="Cancel" onClick={onClose} />
          <Button type="primary" label="Add" onClick={handleAdd} disabled={!fieldName || !hasFieldValue} />
        </div>
      </Modal>

      {fieldPickerOpen && (
        <FieldPickerModal
          onClose={() => setFieldPickerOpen(false)}
          onSelectField={handleFieldSelect}
          anchorEl={fieldValueRef.current}
          placement="dropdown"
          showTriggerFields
          overlayZIndex={2100}
        />
      )}
    </>
  );
}
