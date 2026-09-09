import React, { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import ToolbarButton from '../ToolbarButton.jsx';
import { Icon } from '../../../../components/Icon/Icon';
import styles from './PromptFormatControl.module.css';

const OPEN_BY_KEY = new Map();
const CLOSE_EVENT = 'prompt-format-close';
const TOOLTIP_Z = 10100;

function FormatIcon({ name }) {
  return <Icon name={name} size={20} weight={300} className={styles.formatIcon} />;
}

/**
 * Format toolbar control for System / User prompts and procedure Steps.
 * Toggle via Format icon; also closes when focusing another prompt or switching tabs.
 * Options: Bold / Italic / Underline | Bulleted list / Numbered list / Outdent / Indent.
 */
export default function PromptFormatControl({
  getEditor,
  onAfterFormat,
  disabled = false,
  /** Persist open/closed across remounts for this editor instance. */
  persistKey = 'prompt-format',
  /**
   * Optional override for list/indent actions (used by procedure steps, which
   * store bullet state on data attributes rather than native contentEditable lists).
   */
  onListCommand,
}) {
  const triggerRef = useRef(null);
  const savedRangeRef = useRef(null);
  const [open, setOpenState] = useState(() => OPEN_BY_KEY.get(persistKey) === true);
  const [menuPos, setMenuPos] = useState(null);

  const setOpen = useCallback((next) => {
    setOpenState((prev) => {
      const value = typeof next === 'function' ? next(prev) : next;
      if (value) {
        OPEN_BY_KEY.forEach((_, key) => {
          if (key !== persistKey) OPEN_BY_KEY.set(key, false);
        });
        window.dispatchEvent(new CustomEvent(CLOSE_EVENT, { detail: { except: persistKey } }));
      }
      OPEN_BY_KEY.set(persistKey, value);
      return value;
    });
  }, [persistKey]);

  // Sibling format bars close when this one opens.
  useEffect(() => {
    const onCloseOthers = (e) => {
      if (e.detail?.except === persistKey) return;
      setOpenState(false);
      OPEN_BY_KEY.set(persistKey, false);
    };
    window.addEventListener(CLOSE_EVENT, onCloseOthers);
    return () => window.removeEventListener(CLOSE_EVENT, onCloseOthers);
  }, [persistKey]);

  // Leaving a tab (unmount) must not leave this bar "stuck" open for remount.
  useEffect(() => () => {
    OPEN_BY_KEY.set(persistKey, false);
  }, [persistKey]);

  const measure = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const inputBox =
      trigger.closest('[class*="inputBox"]')
      || trigger.closest('[class*="input_box"]')
      || trigger.closest('[class*="stepsEditorShell"]')
      || trigger.closest('[class*="toolbar"]')
      || trigger.parentElement;
    const boxRect = inputBox?.getBoundingClientRect();
    const endPad = 12;
    const edgeRight = (boxRect?.right ?? window.innerWidth) - endPad;
    const gap = 4;
    // Prefer opening to the right of Format, stretching to the input's right edge.
    let left = rect.right + gap;
    let width = edgeRight - left;
    if (width < 200) {
      // Not enough room on the right — pin to the input end and grow left.
      width = Math.min(edgeRight - ((boxRect?.left ?? 0) + endPad), Math.max(225, edgeRight - (rect.left - 4)));
      left = edgeRight - width;
    }
    setMenuPos({
      top: rect.top + rect.height / 2,
      left,
      width: Math.max(width, 225),
    });
  }, []);

  useLayoutEffect(() => {
    if (!open) {
      setMenuPos(null);
      return undefined;
    }
    measure();
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [open, measure]);

  // Close when the user clicks another prompt field or a tab.
  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (e) => {
      const t = e.target;
      if (!(t instanceof Element)) return;
      if (triggerRef.current?.contains(t)) return;
      if (t.closest('[data-prompt-format-popover]')) return;

      const ourBox = triggerRef.current?.closest('[class*="inputBox"]');
      const clickedBox = t.closest('[class*="inputBox"]');
      if (clickedBox && ourBox && clickedBox !== ourBox) {
        setOpen(false);
        return;
      }

      if (
        t.closest('[role="tab"]')
        || t.closest('[class*="segmentedTab"]')
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown, true);
    return () => document.removeEventListener('mousedown', onPointerDown, true);
  }, [open, setOpen]);

  // Keep selection while the bar is open — only overwrite when the caret is still inside the editor.
  useEffect(() => {
    if (!open) return undefined;
    const onSelectionChange = () => {
      const el = getEditor?.();
      if (!el) return;
      const sel = window.getSelection();
      if (sel?.rangeCount > 0 && el.contains(sel.getRangeAt(0).commonAncestorContainer)) {
        savedRangeRef.current = sel.getRangeAt(0).cloneRange();
      }
    };
    document.addEventListener('selectionchange', onSelectionChange);
    return () => document.removeEventListener('selectionchange', onSelectionChange);
  }, [open, getEditor]);

  const saveActiveRange = useCallback(() => {
    const el = getEditor?.();
    if (!el) return;
    const sel = window.getSelection();
    if (sel?.rangeCount > 0 && el.contains(sel.getRangeAt(0).commonAncestorContainer)) {
      savedRangeRef.current = sel.getRangeAt(0).cloneRange();
    }
  }, [getEditor]);

  const restoreSavedRange = useCallback(() => {
    const el = getEditor?.();
    if (!el) return false;
    el.focus();
    if (!savedRangeRef.current) return false;
    try {
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(savedRangeRef.current);
      return true;
    } catch {
      return false;
    }
  }, [getEditor]);

  const runCommand = useCallback((fn) => {
    const el = getEditor?.();
    if (!el) return;
    el.focus();
    restoreSavedRange();
    // Prefer semantic <b>/<i>/<u> over styled <span> so serializeRichFrom round-trips.
    try { document.execCommand('styleWithCSS', false, false); } catch { /* ignore */ }
    fn();
    saveActiveRange();
    onAfterFormat?.();
  }, [getEditor, onAfterFormat, restoreSavedRange, saveActiveRange]);

  const applyMark = useCallback((cmd) => {
    runCommand(() => { document.execCommand(cmd, false, null); });
  }, [runCommand]);

  const applyListCommand = useCallback((cmd) => {
    if (onListCommand) {
      const el = getEditor?.();
      if (!el) return;
      el.focus();
      restoreSavedRange();
      onListCommand(cmd);
      saveActiveRange();
      onAfterFormat?.();
      return;
    }
    runCommand(() => {
      if (cmd === 'bullet') document.execCommand('insertUnorderedList', false, null);
      else if (cmd === 'number') document.execCommand('insertOrderedList', false, null);
      else if (cmd === 'outdent') document.execCommand('outdent', false, null);
      else if (cmd === 'indent') document.execCommand('indent', false, null);
    });
  }, [onListCommand, getEditor, restoreSavedRange, saveActiveRange, onAfterFormat, runCommand]);

  return (
    <div className={styles.anchor} ref={triggerRef}>
      <ToolbarButton
        icon={<FormatIcon name="text_format" />}
        tooltip="Format"
        active={open}
        disabled={disabled}
        tooltipZIndex={TOOLTIP_Z}
        onClick={() => {
          if (disabled) return;
          saveActiveRange();
          setOpen((v) => !v);
        }}
      />
      {open && menuPos && createPortal(
        <div
          className={styles.popover}
          data-prompt-format-popover=""
          style={{
            top: menuPos.top,
            left: menuPos.left,
            width: menuPos.width,
            transform: 'translateY(-50%)',
          }}
          onMouseDown={(e) => {
            // Keep the contentEditable selection; don't let the bar steal focus.
            e.preventDefault();
          }}
        >
          <ToolbarButton icon={<FormatIcon name="format_bold" />} tooltip="Bold" tooltipZIndex={TOOLTIP_Z} onClick={() => applyMark('bold')} />
          <ToolbarButton icon={<FormatIcon name="format_italic" />} tooltip="Italic" tooltipZIndex={TOOLTIP_Z} onClick={() => applyMark('italic')} />
          <ToolbarButton icon={<FormatIcon name="format_underlined" />} tooltip="Underline" tooltipZIndex={TOOLTIP_Z} onClick={() => applyMark('underline')} />
          <span className={styles.divider} />
          <ToolbarButton icon={<FormatIcon name="format_list_bulleted" />} tooltip="Bulleted list" tooltipZIndex={TOOLTIP_Z} onClick={() => applyListCommand('bullet')} />
          <ToolbarButton icon={<FormatIcon name="format_list_numbered" />} tooltip="Numbered list" tooltipZIndex={TOOLTIP_Z} onClick={() => applyListCommand('number')} />
          <ToolbarButton icon={<FormatIcon name="format_indent_decrease" />} tooltip="Outdent" tooltipZIndex={TOOLTIP_Z} onClick={() => applyListCommand('outdent')} />
          <ToolbarButton icon={<FormatIcon name="format_indent_increase" />} tooltip="Indent" tooltipZIndex={TOOLTIP_Z} onClick={() => applyListCommand('indent')} />
        </div>,
        document.body,
      )}
    </div>
  );
}
