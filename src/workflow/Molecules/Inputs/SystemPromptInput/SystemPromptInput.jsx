import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import '../prompt-chip.css';
import { serializeFrom, deserializeInto, insertChipAt } from '../promptChipHelpers.js';
import { VariableIcon, ExpandIcon } from '../PromptToolbarIcons.jsx';
import ToolbarButton from '../ToolbarButton.jsx';
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
}) {
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
  const fieldAnchorRef = expanded ? overlayFieldsBtnRef : fieldsBtnRef;
  const activeEditorRef = expanded ? overlayEditorRef : editorRef;

  const checkNeedsExpand = useCallback(() => {
    const el = editorRef.current;
    if (!el || expanded) return;
    const text = serializeFrom(el).trim();
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
    const s = serializeFrom(el);
    lastEmittedRef.current = s;
    onChangeRef.current?.(s);
    if (!expanded) {
      // Defer until layout reflects the new content height.
      requestAnimationFrame(() => {
        const inline = editorRef.current;
        if (!inline) return;
        const text = serializeFrom(inline).trim();
        setNeedsExpand(Boolean(text) && inline.scrollHeight > inline.clientHeight + 1);
      });
    }
  }, [activeEditorRef, expanded]);

  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    const newVal = value ?? '';
    if (newVal === lastEmittedRef.current) {
      requestAnimationFrame(checkNeedsExpand);
      return;
    }
    lastEmittedRef.current = newVal;
    deserializeInto(el, newVal, () => {
      const s = serializeFrom(el);
      lastEmittedRef.current = s;
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
      deserializeInto(el, value ?? '', () => {
        const s = serializeFrom(el);
        lastEmittedRef.current = s;
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

  const handleOpenFieldModal = useCallback(() => {
    saveRange();
    setFieldModalOpen(true);
  }, [saveRange]);

  const handleFieldSelect = useCallback((fieldValue) => {
    setFieldModalOpen(false);
    insertChipAt(activeEditorRef.current, savedRangeRef.current, () => {
      const el = activeEditorRef.current;
      if (!el) return;
      const s = serializeFrom(el);
      lastEmittedRef.current = s;
      onChangeRef.current?.(s);
      // Keep the inline editor in sync when inserting from the overlay.
      if (expanded && editorRef.current) {
        deserializeInto(editorRef.current, s, () => {});
      }
    }, 'variable', fieldValue);
    savedRangeRef.current = null;
  }, [activeEditorRef, expanded]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === '@') {
      saveRange();
      setTimeout(() => setFieldModalOpen(true), 0);
    }
  }, [saveRange]);

  const handleCloseExpand = useCallback(() => {
    const el = overlayEditorRef.current;
    if (el) {
      const s = serializeFrom(el);
      lastEmittedRef.current = s;
      onChangeRef.current?.(s);
      if (editorRef.current) {
        deserializeInto(editorRef.current, s, () => {});
      }
    }
    setExpanded(false);
  }, []);

  const editorBlock = (ref, editorClassName, fieldsRef) => (
    <div className={`${styles.inputBox}${error ? ` ${styles.inputBoxError}` : ''}`}>
      <div
        ref={ref}
        className={editorClassName}
        contentEditable
        suppressContentEditableWarning
        onInput={emitChange}
        onKeyDown={handleKeyDown}
        data-placeholder="Enter prompt"
      />
      <div className={styles.toolbar}>
        <div ref={fieldsRef}>
          <ToolbarButton
            icon={<VariableIcon />}
            tooltip="Fields"
            active={fieldModalOpen}
            onClick={handleOpenFieldModal}
          />
        </div>
        {!expanded && (
          <ToolbarButton
            icon={<ExpandIcon />}
            tooltip="Rephrase"
            disabled={!value}
          />
        )}
      </div>
    </div>
  );

  return (
    <>
      <div className={styles.wrap}>
        <div className={styles.labelRow}>
          <div className={styles.labelLeft}>
            <span className={styles.label}>System prompt</span>
            {required && <span className={styles.required}>*</span>}
            {showLabelActions && (
              <InfoTooltip text={SYSTEM_PROMPT_INFO} variant="detail" />
            )}
          </div>
          {showLabelActions && showExpandButton && needsExpand && (
            <button
              type="button"
              className={styles.expandBtn}
              onClick={() => setExpanded(true)}
              aria-label="Expand system prompt"
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
            System prompt is open in expanded view
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
            aria-label="System prompt"
          >
            <div className={styles.overlayHeader}>
              <div className={styles.labelLeft}>
                <span className={styles.overlayTitle}>System prompt</span>
                {required && <span className={styles.required}>*</span>}
                <InfoTooltip text={SYSTEM_PROMPT_INFO} variant="detail" />
              </div>
              <button
                type="button"
                className={styles.expandBtn}
                onClick={handleCloseExpand}
                aria-label="Exit expanded system prompt"
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
        />
      )}
    </>
  );
}
