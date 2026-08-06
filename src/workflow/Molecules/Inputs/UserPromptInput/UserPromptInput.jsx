import React, { useState, useRef, useEffect, useCallback } from 'react';
import '../prompt-chip.css';
import { serializeFrom, deserializeInto, deserializeIntoTyped, insertChipAt } from '../promptChipHelpers.js';
import { VariableIcon, BuildIcon, ProcedureIcon, ExpandIcon } from '../PromptToolbarIcons.jsx';
import FieldPickerModal from '../../../Organisms/Modals/FieldPickerModal/FieldPickerModal.jsx';
import ToolbarButton from '../ToolbarButton.jsx';
import { ToolSlashMenu, getCaretAnchor } from '../ToolSlashMenu/ToolSlashMenu';
import styles from './UserPromptInput.module.css';

/** Nearest scrollable ancestor (e.g. the drawer's own scroll container), or null. */
function findScrollParent(el) {
  let node = el?.parentElement;
  while (node && node !== document.body) {
    const style = window.getComputedStyle(node);
    if (/(auto|scroll)/.test(style.overflowY) && node.scrollHeight > node.clientHeight) {
      return node;
    }
    node = node.parentElement;
  }
  return null;
}

export default function UserPromptInput({
  value,
  onChange,
  required,
  hideLabel = false,
  readOnly = false,
  autoHeight = false,
  minEditorHeight,
  placeholder = 'Enter prompt',
  resolveType = null,
  onOpenToolDrawer,
  onOpenTool,
  showProcedureButton = false,
  enableToolSlash = true,
  showTriggerFields = false,
}) {
  const editorRef = useRef(null);
  const onChangeRef = useRef(onChange);
  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);

  const lastEmittedRef = useRef(null);
  const savedRangeRef = useRef(null);
  const pickerContainerRef = useRef(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [fieldModalOpen, setFieldModalOpen] = useState(false);
  const [slashOpen, setSlashOpen] = useState(false);
  const [slashAnchor, setSlashAnchor] = useState(null);
  // Tracks the scroll container the menu was opened against, so we can shift
  // the (already-computed) anchor by the scroll delta instead of re-deriving
  // it from the live caret on every scroll tick — getCaretAnchor can mutate
  // the DOM (temporary marker node) as a fallback, which is unsafe to run at
  // scroll-event frequency.
  const slashScrollRef = useRef({ parent: null, initialTop: 0, initialAnchor: null });
  const [isEmpty, setIsEmpty] = useState(!(value ?? '').trim());
  const fieldsBtnRef = useRef(null);

  const syncEmpty = useCallback(() => {
    const el = editorRef.current;
    setIsEmpty(!el || !serializeFrom(el).trim());
  }, []);

  const emitChange = useCallback(() => {
    const s = serializeFrom(editorRef.current);
    lastEmittedRef.current = s;
    setIsEmpty(!s.trim());
    onChangeRef.current?.(s);
  }, []);

  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    const newVal = value ?? '';
    if (newVal === lastEmittedRef.current) return;
    lastEmittedRef.current = newVal;
    if (resolveType) {
      deserializeIntoTyped(el, newVal, emitChange, resolveType);
    } else {
      deserializeInto(el, newVal, emitChange);
    }
    syncEmpty();
  }, [value, emitChange, resolveType, syncEmpty]);

  useEffect(() => {
    if (!pickerOpen) return;
    const handler = (e) => {
      if (pickerContainerRef.current && !pickerContainerRef.current.contains(e.target)) {
        setPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [pickerOpen]);

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

  const handleInsertProcedure = useCallback(() => {
    saveRange();
    insertChipAt(editorRef.current, savedRangeRef.current, emitChange, 'product');
    savedRangeRef.current = null;
  }, [saveRange, emitChange]);

  const handleFieldSelect = useCallback((fieldValue) => {
    setFieldModalOpen(false);
    insertChipAt(editorRef.current, savedRangeRef.current, emitChange, 'variable', fieldValue);
    savedRangeRef.current = null;
  }, [emitChange]);

  const closeSlashMenu = useCallback(() => {
    setSlashOpen(false);
    setSlashAnchor(null);
    requestAnimationFrame(() => editorRef.current?.focus());
  }, []);

  const openSlashMenu = useCallback((anchorFn) => {
    saveRange();
    const anchor = anchorFn();
    const scrollParent = findScrollParent(editorRef.current);
    slashScrollRef.current = {
      parent: scrollParent,
      initialTop: scrollParent ? scrollParent.scrollTop : (window.scrollY || window.pageYOffset || 0),
      initialAnchor: anchor,
    };
    setSlashAnchor(anchor);
    setSlashOpen(true);
  }, [saveRange]);

  // Keep the slash menu glued to its anchor while the drawer/page scrolls,
  // instead of leaving it stuck at its original position. This shifts the
  // anchor captured at open time by the scroll delta — it deliberately does
  // NOT re-derive the anchor via getCaretAnchor() on every scroll tick, since
  // that function mutates the DOM (inserts/removes a temporary marker node)
  // as a fallback, which is unsafe to run at scroll-event frequency and was
  // causing the menu to vanish mid-scroll.
  useEffect(() => {
    if (!slashOpen) return;
    const reposition = () => {
      const { parent, initialTop, initialAnchor } = slashScrollRef.current;
      if (!initialAnchor) return;
      const currentTop = parent ? parent.scrollTop : (window.scrollY || window.pageYOffset || 0);
      const delta = currentTop - initialTop;
      setSlashAnchor({ top: initialAnchor.top - delta, left: initialAnchor.left });
    };
    document.addEventListener('scroll', reposition, true);
    window.addEventListener('resize', reposition);
    return () => {
      document.removeEventListener('scroll', reposition, true);
      window.removeEventListener('resize', reposition);
    };
  }, [slashOpen]);

  const handleToolSlashSelect = useCallback((tool) => {
    setSlashOpen(false);
    setSlashAnchor(null);
    insertChipAt(editorRef.current, savedRangeRef.current, emitChange, 'tool', tool.name);
    savedRangeRef.current = null;
    requestAnimationFrame(() => editorRef.current?.focus());
  }, [emitChange]);

  // @ mention → field picker; / → tool slash menu
  const handleKeyDown = useCallback((e) => {
    if (e.key === '@') {
      handleOpenFieldModal();
      return;
    }
    if (enableToolSlash && e.key === '/') {
      e.preventDefault();
      openSlashMenu(() => getCaretAnchor(editorRef.current));
    }
  }, [handleOpenFieldModal, enableToolSlash, openSlashMenu]);

  return (
    <>
      <div className={styles.wrap}>
        {!hideLabel && (
          <div className={styles.labelRow}>
            <span className={styles.label}>User prompt</span>
            {required && <span className={styles.required}>*</span>}
          </div>
        )}
        <div className={`${styles.inputBox}${!readOnly && isEmpty ? ` ${styles.inputBoxWithHint}` : ''}`}>
          {!readOnly && isEmpty && (
            <div className={styles.placeholderOverlay} aria-hidden>
              {placeholder}
            </div>
          )}
          <div
            ref={editorRef}
            className={`${styles.editor}${autoHeight ? ` ${styles.editorAutoHeight}` : ''}`}
            contentEditable={!readOnly}
            suppressContentEditableWarning
            onInput={readOnly ? undefined : emitChange}
            onKeyDown={readOnly ? undefined : handleKeyDown}
            style={minEditorHeight ? { minHeight: minEditorHeight } : undefined}
            onClick={onOpenTool ? (e) => {
              const chip = e.target.closest('[data-chip-type="tool"], .prompt-chip--tool');
              if (chip) {
                const label = chip.querySelector('.prompt-chip-label')?.textContent?.trim();
                if (label) onOpenTool(label);
              }
            } : undefined}
          />
          {!readOnly && (
          <div className={styles.toolbar} ref={pickerContainerRef}>
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
              onClick={() => {
                if (enableToolSlash) {
                  openSlashMenu(() => {
                    const rect = editorRef.current?.getBoundingClientRect();
                    return rect ? { top: rect.bottom - 8, left: rect.left + 12 } : null;
                  });
                  return;
                }
                onOpenToolDrawer?.();
              }}
            />
            {showProcedureButton && (
              <ToolbarButton
                icon={<ProcedureIcon />}
                tooltip="Procedures"
                onClick={handleInsertProcedure}
              />
            )}
            <ToolbarButton
              icon={<ExpandIcon />}
              tooltip="Rephrase"
              disabled={isEmpty}
            />
          </div>
          )}
        </div>
      </div>
      {fieldModalOpen && (
        <FieldPickerModal
          onClose={() => setFieldModalOpen(false)}
          onSelectField={handleFieldSelect}
          anchorEl={fieldsBtnRef.current}
          showTriggerFields={showTriggerFields}
        />
      )}
      <ToolSlashMenu
        open={slashOpen}
        anchor={slashAnchor}
        onClose={closeSlashMenu}
        onSelect={handleToolSlashSelect}
      />
    </>
  );
}
