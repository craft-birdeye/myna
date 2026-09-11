import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import '../prompt-chip.css';
import { serializeRichFrom, serializeRichFromNormalized, deserializeRichInto, insertChipAt } from '../promptChipHelpers.js';
import { VariableIcon, ExpandIcon } from '../PromptToolbarIcons.jsx';
import ToolbarButton from '../ToolbarButton.jsx';
import PromptFormatControl from '../PromptFormatControl/PromptFormatControl.jsx';
import FieldPickerModal from '../../../Organisms/Modals/FieldPickerModal/FieldPickerModal.jsx';
import { InfoTooltip } from '../../../../components/InfoTooltip/InfoTooltip';
import { Icon } from '../../../../components/Icon/Icon';
import styles from './SystemPromptInput.module.css';

const SYSTEM_PROMPT_INFO =
  'Instructions that define the agent persona while completing the task.';

export default function SystemPromptInput({
  value,
  onChange,
  required,
  showTriggerFields = true,
  tall = false,
  /** Show info popover + expand on the label row (Steps / Procedures pattern). */
  showLabelActions = true,
  /** Independent of showLabelActions: hides just the expand-to-overlay button (R1). */
  showExpandButton = true,
  error,
  errorMessage = 'This field is required',
  readOnly = false,
  disabled = false,
  label = 'System prompt',
  placeholder = 'Describe the persona of this agent',
}) {
  const locked = readOnly || disabled;
  const editorRef = useRef(null);
  const overlayEditorRef = useRef(null);
  const onChangeRef = useRef(onChange);
  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);

  const lastEmittedRef = useRef(null);
  const savedRangeRef = useRef(null);
  // Anchors the Fields picker so it docks left of the panel, level with this icon —
  // without it the picker has no anchor and pins itself to the top of the viewport.
  const fieldsBtnRef = useRef(null);
  const overlayFieldsBtnRef = useRef(null);
  const [fieldModalOpen, setFieldModalOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [needsExpand, setNeedsExpand] = useState(false);
  const [isEmpty, setIsEmpty] = useState(!(value ?? '').trim());
  const fieldAnchorRef = expanded ? overlayFieldsBtnRef : fieldsBtnRef;
  const activeEditorRef = expanded ? overlayEditorRef : editorRef;

  const checkNeedsExpand = useCallback(() => {
    const el = editorRef.current;
    if (!el || expanded) return;
    const text = serializeRichFromNormalized(el).trim();
    if (!text) {
      setNeedsExpand(false);
      return;
    }
    // Show expand only when content doesn't fit the collapsed editor.
    setNeedsExpand(el.scrollHeight > el.clientHeight + 1);
  }, [expanded]);

  const emitChange = useCallback(() => {
    const el = activeEditorRef.current;
    if (!el) return;
    const s = serializeRichFromNormalized(el);
    lastEmittedRef.current = s;
    setIsEmpty(!s.trim());
    onChangeRef.current?.(s);
    if (!expanded) {
      // Defer until layout reflects the new content height.
      requestAnimationFrame(() => {
        const inline = editorRef.current;
        if (!inline) return;
        const text = serializeRichFromNormalized(inline).trim();
        setNeedsExpand(Boolean(text) && inline.scrollHeight > inline.clientHeight + 1);
      });
    }
  }, [activeEditorRef, expanded]);

  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    const newVal = value ?? '';
    if (newVal === lastEmittedRef.current) {
      setIsEmpty(!newVal.trim());
      requestAnimationFrame(checkNeedsExpand);
      return;
    }
    lastEmittedRef.current = newVal;
    deserializeRichInto(el, newVal, () => {
      const s = serializeRichFromNormalized(el);
      lastEmittedRef.current = s;
      setIsEmpty(!s.trim());
      onChangeRef.current?.(s);
      requestAnimationFrame(checkNeedsExpand);
    });
  }, [value, checkNeedsExpand]);

  useEffect(() => {
    const el = editorRef.current;
    if (!el || expanded) return undefined;
    const ro = new ResizeObserver(() => checkNeedsExpand());
    ro.observe(el);
    requestAnimationFrame(checkNeedsExpand);
    return () => ro.disconnect();
  }, [checkNeedsExpand, expanded]);

  useEffect(() => {
    if (!expanded) return undefined;
    const el = overlayEditorRef.current;
    if (el) {
      deserializeRichInto(el, value ?? '', () => {
        const s = serializeRichFromNormalized(el);
        lastEmittedRef.current = s;
        setIsEmpty(!s.trim());
        onChangeRef.current?.(s);
      });
    }
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setExpanded(false);
    };
    window.addEventListener('keydown', onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [expanded, value]);

  const saveRange = useCallback(() => {
    const el = activeEditorRef.current;
    if (el) {
      const sel = window.getSelection();
      if (sel?.rangeCount > 0 && el.contains(sel.getRangeAt(0).commonAncestorContainer)) {
        savedRangeRef.current = sel.getRangeAt(0).cloneRange();
      }
    }
  }, [activeEditorRef]);

  const handleToggleFieldModal = useCallback(() => {
    if (fieldModalOpen) {
      setFieldModalOpen(false);
      return;
    }
    saveRange();
    setFieldModalOpen(true);
  }, [fieldModalOpen, saveRange]);

  const handleFieldSelect = useCallback((fieldValue) => {
    insertChipAt(activeEditorRef.current, savedRangeRef.current, () => {
      const el = activeEditorRef.current;
      if (!el) return;
      const s = serializeRichFromNormalized(el);
      lastEmittedRef.current = s;
      setIsEmpty(!s.trim());
      onChangeRef.current?.(s);
      // Keep the inline editor in sync when inserting from the overlay.
      if (expanded && editorRef.current) {
        deserializeRichInto(editorRef.current, s, () => {});
      }
    }, 'variable', fieldValue);
    // Keep picker open; close only via X or Fields icon. Re-save caret for the next insert.
    saveRange();
  }, [activeEditorRef, expanded, saveRange]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === '@') {
      saveRange();
      setTimeout(() => setFieldModalOpen(true), 0);
    }
  }, [saveRange]);

  const handleCloseExpand = useCallback(() => {
    const el = overlayEditorRef.current;
    if (el) {
      const s = serializeRichFromNormalized(el);
      lastEmittedRef.current = s;
      setIsEmpty(!s.trim());
      onChangeRef.current?.(s);
      if (editorRef.current) {
        deserializeRichInto(editorRef.current, s, () => {});
      }
    }
    setExpanded(false);
  }, []);

  const editorBlock = (ref, editorClassName, fieldsRef) => (
    <div className={`${styles.inputBox}${!locked && isEmpty ? ` ${styles.inputBoxWithHint}` : ''}${fieldModalOpen ? ` ${styles.inputBoxOpen}` : ''}${error ? ` ${styles.inputBoxError}` : ''}${disabled ? ` ${styles.inputBoxDisabled}` : readOnly ? ` ${styles.inputBoxReadOnly}` : ''}`}>
      {!locked && isEmpty && (
        <div className={styles.placeholderOverlay} aria-hidden>
          {placeholder}
        </div>
      )}
      <div
        ref={ref}
        className={editorClassName}
        contentEditable={!locked}
        suppressContentEditableWarning
        onInput={locked ? undefined : emitChange}
        onKeyDown={locked ? undefined : handleKeyDown}
        data-placeholder={placeholder}
      />
      {!locked && (
      <div className={styles.toolbar}>
        <div ref={fieldsRef}>
          <ToolbarButton
            icon={<VariableIcon />}
            tooltip="Fields"
            active={fieldModalOpen}
            onClick={handleToggleFieldModal}
          />
        </div>
        {!expanded && (
          <ToolbarButton
            icon={<ExpandIcon />}
            tooltip="Rephrase"
            disabled={!value}
          />
        )}
        <PromptFormatControl
          getEditor={() => ref.current}
          onAfterFormat={emitChange}
          persistKey="system-prompt-format"
        />
      </div>
      )}
    </div>
  );

  return (
    <>
      <div className={styles.wrap}>
        <div className={styles.labelRow}>
          <div className={styles.labelLeft}>
            <span className={styles.label}>{label}</span>
            {required && <span className={styles.required}>*</span>}
            {showLabelActions && (
              <InfoTooltip text={SYSTEM_PROMPT_INFO} variant="detail" />
            )}
          </div>
          {showLabelActions && showExpandButton && needsExpand && !locked && (
            <button
              type="button"
              className={styles.expandBtn}
              onClick={() => setExpanded(true)}
              aria-label={`Expand ${label.toLowerCase()}`}
              title="Expand"
            >
              <Icon name="open_in_full" size={18} />
            </button>
          )}
        </div>
        {expanded ? (
          <button
            type="button"
            className={styles.expandedPlaceholder}
            onClick={() => setExpanded(true)}
          >
            {label} is open in expanded view
          </button>
        ) : (
          editorBlock(
            editorRef,
            `${styles.editor}${tall ? ` ${styles.editorTall}` : ''}`,
            fieldsBtnRef,
          )
        )}
        {error && errorMessage && !expanded && (
          <span className={styles.errorText}>{errorMessage}</span>
        )}
      </div>
      {expanded && createPortal(
        <div
          className={styles.overlay}
          onClick={handleCloseExpand}
          role="presentation"
        >
          <div
            className={styles.overlayPanel}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={label}
          >
            <div className={styles.overlayHeader}>
              <div className={styles.labelLeft}>
                <span className={styles.overlayTitle}>{label}</span>
                {required && <span className={styles.required}>*</span>}
                <InfoTooltip text={SYSTEM_PROMPT_INFO} variant="detail" />
              </div>
              <button
                type="button"
                className={styles.expandBtn}
                onClick={handleCloseExpand}
                aria-label={`Exit expanded ${label.toLowerCase()}`}
                title="Exit expanded view"
              >
                <Icon name="close_fullscreen" size={18} />
              </button>
            </div>
            <div className={styles.overlayBody}>
              {editorBlock(
                overlayEditorRef,
                `${styles.editor} ${styles.editorOverlay}`,
                overlayFieldsBtnRef,
              )}
            </div>
          </div>
        </div>,
        document.body,
      )}
      {fieldModalOpen && (
        <FieldPickerModal
          onClose={() => setFieldModalOpen(false)}
          onSelectField={handleFieldSelect}
          anchorEl={fieldAnchorRef.current}
          showTriggerFields={showTriggerFields}
          insertedText={serializeRichFrom(activeEditorRef.current)}
        />
      )}
    </>
  );
}
