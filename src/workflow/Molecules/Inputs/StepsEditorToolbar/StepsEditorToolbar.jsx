import React, { useState, useRef, useEffect, useCallback } from 'react';
import { insertChipAt } from '../promptChipHelpers.js';
import { VariableIcon, BuildIcon, ProcedureIcon, ExpandIcon } from '../PromptToolbarIcons.jsx';
import FieldPickerModal from '../../../Organisms/Modals/FieldPickerModal/FieldPickerModal.jsx';
import ToolbarButton from '../ToolbarButton.jsx';
import toolbarStyles from '../UserPromptInput/UserPromptInput.module.css';
import styles from './StepsEditorToolbar.module.css';

function FormatIcon({ name }) {
  return <span className="material-symbols-outlined" style={{ fontSize: 20 }}>{name}</span>;
}

/**
 * Bottom toolbar for procedure step editors: Fields, Tools, Procedures, Rephrase, Format.
 * Fields/Tools reuse the same FieldPickerModal / ToolSlashMenu as the "create new
 * procedure" freeform editor (UserPromptInput) so both editors offer the same
 * searchable pickers, rather than a bare type-name dropdown.
 * Format is a single icon that expands a floating row of Bold/Italic/Underline/
 * Link/Bulleted-list/Numbered-list/Indent/Outdent icons above it, acting on
 * whichever step title or bullet line currently has focus.
 * The Tools slash menu is owned by the parent (EditableStepsRenderer) so that
 * typing "/" directly in a step line can open the exact same menu — passed in
 * here as onOpenToolSlash.
 */
export default function StepsEditorToolbar({ getActiveEditable, onAfterInsert, onOpenToolSlash, hasContent = false }) {
  const formatRef = useRef(null);
  const fieldsBtnRef = useRef(null);
  const savedRangeRef = useRef(null);
  const [fieldModalOpen, setFieldModalOpen] = useState(false);
  const [formatOpen, setFormatOpen] = useState(false);
  const [linkMode, setLinkMode] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');

  useEffect(() => {
    if (!formatOpen) return;
    const handler = (e) => {
      if (formatRef.current && !formatRef.current.contains(e.target)) {
        setFormatOpen(false);
        setLinkMode(false);
        setLinkUrl('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [formatOpen]);

  const saveActiveRange = useCallback(() => {
    const el = getActiveEditable?.();
    if (el) {
      const sel = window.getSelection();
      if (sel?.rangeCount > 0 && el.contains(sel.getRangeAt(0).commonAncestorContainer)) {
        savedRangeRef.current = sel.getRangeAt(0).cloneRange();
      }
    }
  }, [getActiveEditable]);

  const restoreSavedRange = useCallback(() => {
    if (!savedRangeRef.current) return false;
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(savedRangeRef.current);
    return true;
  }, []);

  const handleOpenFieldModal = useCallback(() => {
    saveActiveRange();
    setFieldModalOpen(true);
  }, [saveActiveRange]);

  const handleFieldSelect = useCallback((fieldValue) => {
    setFieldModalOpen(false);
    const el = getActiveEditable?.();
    if (!el) return;
    insertChipAt(el, savedRangeRef.current, () => {
      savedRangeRef.current = null;
      onAfterInsert?.();
    }, 'variable', fieldValue);
  }, [getActiveEditable, onAfterInsert]);

  const handleInsertProcedure = useCallback(() => {
    saveActiveRange();
    const el = getActiveEditable?.();
    if (!el) return;
    insertChipAt(el, savedRangeRef.current, () => {
      savedRangeRef.current = null;
      onAfterInsert?.();
    }, 'product');
  }, [getActiveEditable, onAfterInsert, saveActiveRange]);

  const applyMark = useCallback((cmd) => {
    const el = getActiveEditable?.();
    if (!el) return;
    // Restore the selection captured when the Format popover opened — by the
    // time a mark button is clicked, the live browser selection from the
    // original text selection has typically already collapsed.
    restoreSavedRange();
    document.execCommand(cmd);
    onAfterInsert?.();
  }, [getActiveEditable, onAfterInsert, restoreSavedRange]);

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
    onAfterInsert?.();
  }, [getActiveEditable, onAfterInsert]);

  const openLinkInput = useCallback(() => {
    saveActiveRange();
    setLinkMode(true);
    setLinkUrl('');
  }, [saveActiveRange]);

  const commitLink = useCallback(() => {
    const url = linkUrl.trim();
    if (url && restoreSavedRange()) {
      document.execCommand('createLink', false, url);
      onAfterInsert?.();
    }
    setLinkMode(false);
    setLinkUrl('');
    setFormatOpen(false);
  }, [linkUrl, restoreSavedRange, onAfterInsert]);

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

        <div className={styles.formatAnchor} ref={formatRef}>
          <ToolbarButton
            icon={<FormatIcon name="text_format" />}
            tooltip="Format"
            active={formatOpen}
            onClick={() => { saveActiveRange(); setFormatOpen((o) => !o); }}
          />
          {formatOpen && (
            <div className={styles.formatPopover}>
              {linkMode ? (
                <div className={styles.linkInputRow}>
                  <input
                    autoFocus
                    className={styles.linkInput}
                    placeholder="Paste a URL"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') { e.preventDefault(); commitLink(); }
                      if (e.key === 'Escape') { e.preventDefault(); setLinkMode(false); setLinkUrl(''); }
                    }}
                  />
                  <button
                    type="button"
                    className={styles.linkAddBtn}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={commitLink}
                  >
                    Add
                  </button>
                </div>
              ) : (
                <>
                  <ToolbarButton icon={<FormatIcon name="format_bold" />} tooltip="Bold" onClick={() => applyMark('bold')} />
                  <ToolbarButton icon={<FormatIcon name="format_italic" />} tooltip="Italic" onClick={() => applyMark('italic')} />
                  <ToolbarButton icon={<FormatIcon name="format_underlined" />} tooltip="Underline" onClick={() => applyMark('underline')} />
                  <ToolbarButton icon={<FormatIcon name="link" />} tooltip="Link" onClick={openLinkInput} />
                  <span className={styles.formatDivider} />
                  <ToolbarButton icon={<FormatIcon name="format_list_bulleted" />} tooltip="Bulleted list" onClick={() => applyBulletCommand('bullet')} />
                  <ToolbarButton icon={<FormatIcon name="format_list_numbered" />} tooltip="Numbered list" onClick={() => applyBulletCommand('number')} />
                  <ToolbarButton icon={<FormatIcon name="format_indent_decrease" />} tooltip="Outdent" onClick={() => applyBulletCommand('outdent')} />
                  <ToolbarButton icon={<FormatIcon name="format_indent_increase" />} tooltip="Indent" onClick={() => applyBulletCommand('indent')} />
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {fieldModalOpen && (
        <FieldPickerModal
          onClose={() => setFieldModalOpen(false)}
          onSelectField={handleFieldSelect}
          anchorEl={fieldsBtnRef.current}
        />
      )}
    </div>
  );
}
