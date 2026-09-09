import React, { useState, useRef, useCallback } from 'react';
import { insertChipAt, serializeFrom } from '../promptChipHelpers.js';
import { VariableIcon, BuildIcon, ProcedureIcon, ExpandIcon } from '../PromptToolbarIcons.jsx';
import FieldPickerModal from '../../../Organisms/Modals/FieldPickerModal/FieldPickerModal.jsx';
import ToolbarButton from '../ToolbarButton.jsx';
import PromptFormatControl from '../PromptFormatControl/PromptFormatControl.jsx';
import toolbarStyles from '../UserPromptInput/UserPromptInput.module.css';
import styles from './StepsEditorToolbar.module.css';

/**
 * Bottom toolbar for procedure step editors: Fields, Tools, Procedures, Rephrase, Format.
 * Fields/Tools reuse the same FieldPickerModal / ToolSlashMenu as UserPromptInput.
 * Format reuses PromptFormatControl (same options + UX as System/User prompts);
 * list/indent commands update step bullet data attributes instead of native lists.
 * The Tools slash menu is owned by the parent (EditableStepsRenderer).
 */
export default function StepsEditorToolbar({ getActiveEditable, onAfterInsert, onOpenToolSlash, hasContent = false }) {
  const fieldsBtnRef = useRef(null);
  const savedRangeRef = useRef(null);
  const [fieldModalOpen, setFieldModalOpen] = useState(false);

  const saveActiveRange = useCallback(() => {
    const el = getActiveEditable?.();
    if (el) {
      const sel = window.getSelection();
      if (sel?.rangeCount > 0 && el.contains(sel.getRangeAt(0).commonAncestorContainer)) {
        savedRangeRef.current = sel.getRangeAt(0).cloneRange();
      }
    }
  }, [getActiveEditable]);

  const handleOpenFieldModal = useCallback(() => {
    saveActiveRange();
    setFieldModalOpen(true);
  }, [saveActiveRange]);

  const handleFieldSelect = useCallback((fieldValue) => {
    const el = getActiveEditable?.();
    if (!el) return;
    insertChipAt(el, savedRangeRef.current, () => {
      onAfterInsert?.();
    }, 'variable', fieldValue);
    // Keep the picker open; close only via X or the Fields icon. Re-save the caret
    // (now just after the inserted chip) so the next selection inserts in the right spot.
    saveActiveRange();
  }, [getActiveEditable, onAfterInsert, saveActiveRange]);

  const handleInsertProcedure = useCallback(() => {
    saveActiveRange();
    const el = getActiveEditable?.();
    if (!el) return;
    insertChipAt(el, savedRangeRef.current, () => {
      savedRangeRef.current = null;
      onAfterInsert?.();
    }, 'product');
  }, [getActiveEditable, onAfterInsert, saveActiveRange]);

  const applyBulletCommand = useCallback((cmd) => {
    const el = getActiveEditable?.();
    const bulletEl = el?.closest?.('[data-step-bullet]');
    if (!bulletEl) return;
    const indent = Math.min(Number(bulletEl.dataset.indent || 0), 2);
    if (cmd === 'indent') bulletEl.dataset.indent = String(Math.min(indent + 1, 2));
    else if (cmd === 'outdent') bulletEl.dataset.indent = String(Math.max(indent - 1, 0));
    else if (cmd === 'bullet') bulletEl.dataset.ordered = '0';
    else if (cmd === 'number') {
      bulletEl.dataset.ordered = '1';
      if (Number(bulletEl.dataset.indent || 0) === 0) bulletEl.dataset.indent = '1';
    }
  }, [getActiveEditable]);

  return (
    <div className={styles.row}>
      <div className={`${toolbarStyles.toolbar} ${styles.toolbar}`}>
        <div ref={fieldsBtnRef}>
          <ToolbarButton
            icon={<VariableIcon />}
            tooltip="Fields"
            active={fieldModalOpen}
            onClick={handleOpenFieldModal}
          />
        </div>
        <ToolbarButton
          icon={<BuildIcon />}
          tooltip="Tools"
          onClick={onOpenToolSlash}
        />
        <ToolbarButton
          icon={<ProcedureIcon />}
          tooltip="Procedures"
          onClick={handleInsertProcedure}
        />
        <ToolbarButton
          icon={<ExpandIcon />}
          tooltip="Rephrase"
          disabled={!hasContent}
        />
        <PromptFormatControl
          getEditor={getActiveEditable}
          onAfterFormat={onAfterInsert}
          onListCommand={applyBulletCommand}
          persistKey="steps-editor-format"
        />
      </div>

      {fieldModalOpen && (
        <FieldPickerModal
          onClose={() => setFieldModalOpen(false)}
          onSelectField={handleFieldSelect}
          anchorEl={fieldsBtnRef.current}
          insertedText={serializeFrom(getActiveEditable?.())}
        />
      )}
    </div>
  );
}
