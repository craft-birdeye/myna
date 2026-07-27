import React, { useState, useRef, useEffect, useCallback } from 'react';
import '../prompt-chip.css';
import { serializeFrom, deserializeInto, insertChipAt } from '../promptChipHelpers.js';
import { VariableIcon, ExpandIcon } from '../PromptToolbarIcons.jsx';
import FieldPickerModal from '../../../Organisms/Modals/FieldPickerModal/FieldPickerModal.jsx';
import styles from './SystemPromptInput.module.css';

export default function SystemPromptInput({ value, onChange, required, showTriggerFields = true }) {
  const editorRef = useRef(null);
  const onChangeRef = useRef(onChange);
  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);

  const lastEmittedRef = useRef(null);
  const savedRangeRef = useRef(null);
  const [fieldModalOpen, setFieldModalOpen] = useState(false);

  const emitChange = useCallback(() => {
    const s = serializeFrom(editorRef.current);
    lastEmittedRef.current = s;
    onChangeRef.current?.(s);
  }, []);

  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    const newVal = value ?? '';
    if (newVal === lastEmittedRef.current) return;
    lastEmittedRef.current = newVal;
    deserializeInto(el, newVal, emitChange);
  }, [value, emitChange]);

  const saveRange = useCallback(() => {
    const el = editorRef.current;
    if (el) {
      const sel = window.getSelection();
      if (sel?.rangeCount > 0 && el.contains(sel.getRangeAt(0).commonAncestorContainer)) {
        savedRangeRef.current = sel.getRangeAt(0).cloneRange();
      }
    }
  }, []);

  const handleOpenFieldModal = useCallback(() => {
    saveRange();
    setFieldModalOpen(true);
  }, [saveRange]);

  const handleFieldSelect = useCallback((fieldValue) => {
    setFieldModalOpen(false);
    insertChipAt(editorRef.current, savedRangeRef.current, emitChange, 'variable', fieldValue);
    savedRangeRef.current = null;
  }, [emitChange]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === '@') {
      saveRange();
      setTimeout(() => setFieldModalOpen(true), 0);
    }
  }, [saveRange]);

  return (
    <>
      <div className={styles.wrap}>
        <div className={styles.labelRow}>
          <span className={styles.label}>System prompt</span>
          {required && <span className={styles.required}>*</span>}
        </div>
        <div className={styles.inputBox}>
          <div
            ref={editorRef}
            className={styles.editor}
            contentEditable
            suppressContentEditableWarning
            onInput={emitChange}
            onKeyDown={handleKeyDown}
            data-placeholder="Enter prompt"
          />
          <div className={styles.toolbar}>
            <button
              type="button"
              className={`${styles.toolbarBtn} ${fieldModalOpen ? styles.toolbarBtnActive : ''}`}
              onMouseDown={(e) => e.preventDefault()}
              onClick={handleOpenFieldModal}
              title="Insert variable"
            >
              <VariableIcon />
            </button>
            <button
              type="button"
              className={styles.toolbarBtn}
              onMouseDown={(e) => e.preventDefault()}
              title="Expand"
            >
              <ExpandIcon />
            </button>
          </div>
        </div>
      </div>
      {fieldModalOpen && (
        <FieldPickerModal
          onClose={() => setFieldModalOpen(false)}
          onSelectField={handleFieldSelect}
          showTriggerFields={showTriggerFields}
        />
      )}
    </>
  );
}
