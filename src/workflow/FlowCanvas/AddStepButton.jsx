import React, { useCallback, useEffect, useRef, useState } from 'react';
import AddStepMenu from './AddStepMenu';
import './AddStepMenu.css';

/**
 * Shared canvas "+" control: click opens AddStepMenu, or (when a node is copied)
 * hover reveals inline Paste / Add step pills flanking the "+".
 */
export default function AddStepButton({
  className = '',
  isDraggingFromLHS = false,
  isDragOver = false,
  product = 'healthcare',
  agentName = '',
  onSelect,
  onDragOver,
  onDragLeave,
  onDrop,
  showPasteOption = false,
  onPaste,
  /** One full-width search across both panes instead of one per pane (Sep 1 only). */
  singleSearch = false,
  /** When true, the + control is display-only (no click / menu). Drag-drop still works. */
  disableClick = false,
}) {
  const btnRef = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [shortcutMenuOpen, setShortcutMenuOpen] = useState(false);
  const [anchorRect, setAnchorRect] = useState(null);
  const hoverCloseTimeoutRef = useRef(null);

  useEffect(() => () => clearTimeout(hoverCloseTimeoutRef.current), []);

  const updateAnchor = useCallback(() => {
    if (!btnRef.current) return null;
    const r = btnRef.current.getBoundingClientRect();
    setAnchorRect(r);
    return r;
  }, []);

  const openPasteCues = useCallback(() => {
    clearTimeout(hoverCloseTimeoutRef.current);
    setShortcutMenuOpen(true);
  }, []);

  const closePasteCues = useCallback(() => {
    clearTimeout(hoverCloseTimeoutRef.current);
    setShortcutMenuOpen(false);
  }, []);

  const scheduleClosePasteCues = useCallback(() => {
    clearTimeout(hoverCloseTimeoutRef.current);
    hoverCloseTimeoutRef.current = setTimeout(() => closePasteCues(), 180);
  }, [closePasteCues]);

  useEffect(() => {
    if (!menuOpen) return undefined;
    function onScroll() {
      updateAnchor();
    }
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onScroll);
    };
  }, [menuOpen, updateAnchor]);

  useEffect(() => {
    if (!showPasteOption || isDraggingFromLHS) closePasteCues();
  }, [showPasteOption, isDraggingFromLHS, closePasteCues]);

  function handleClick(e) {
    e.preventDefault();
    e.stopPropagation();
    if (disableClick) return;
    if (showPasteOption) {
      setShortcutMenuOpen((open) => !open);
      return;
    }
    if (menuOpen) {
      setMenuOpen(false);
      return;
    }
    const r = updateAnchor();
    setMenuOpen(true);
    if (r) setAnchorRect(r);
  }

  function handlePlusMouseEnter() {
    if (disableClick || !showPasteOption || isDraggingFromLHS) return;
    openPasteCues();
  }

  function handleInteractionMouseLeave() {
    if (!showPasteOption) return;
    scheduleClosePasteCues();
  }

  function handleCueMouseEnter() {
    if (!showPasteOption) return;
    openPasteCues();
  }

  function handlePasteClick(e) {
    e.preventDefault();
    e.stopPropagation();
    closePasteCues();
    onPaste?.();
  }

  function handleAddStepClick(e) {
    e.preventDefault();
    e.stopPropagation();
    closePasteCues();
    const r = updateAnchor();
    setMenuOpen(true);
    if (r) setAnchorRect(r);
  }

  const showPasteCues = showPasteOption && shortcutMenuOpen && !disableClick && !isDraggingFromLHS;
  const isEmptySlot = className.includes('add-step-btn--empty-slot');

  const btnClass = [
    'add-step-btn',
    'nodrag',
    'nopan',
    className,
    menuOpen ? 'add-step-btn--open' : '',
    showPasteCues ? 'add-step-btn--paste-active' : '',
    isDraggingFromLHS ? 'add-step-btn--lhs-drag' : '',
    isDragOver ? 'add-step-btn--drop-target' : '',
    disableClick ? 'add-step-btn--noninteractive' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const wrapClass = [
    'add-step-btn-wrap',
    isDragOver ? 'add-step-btn-wrap--drop-target' : '',
    isDraggingFromLHS ? 'add-step-btn-wrap--lhs-drag' : '',
    showPasteCues ? 'add-step-btn-wrap--paste-cues' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={wrapClass}
      onMouseLeave={handleInteractionMouseLeave}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <button
        ref={btnRef}
        type="button"
        className={btnClass}
        aria-label="Add step"
        aria-disabled={disableClick || undefined}
        tabIndex={disableClick ? -1 : undefined}
        onClick={handleClick}
        onMouseEnter={handlePlusMouseEnter}
      >
        <span className="material-symbols-outlined">add</span>
        {isDragOver && !isEmptySlot && (
          <span className="add-step-btn__drop-label">Drop here</span>
        )}
      </button>

      {showPasteCues && (
        <div
          className="add-step-shortcuts-menu"
          onMouseEnter={handleCueMouseEnter}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            className="add-step-shortcuts-menu__item"
            aria-label="Add step"
            onClick={handleAddStepClick}
          >
            <span className="material-symbols-outlined" aria-hidden>add</span>
            <span className="add-step-shortcuts-menu__label">Add step</span>
          </button>
          <button
            type="button"
            className="add-step-shortcuts-menu__item"
            aria-label="Paste"
            onClick={handlePasteClick}
          >
            <span className="material-symbols-outlined" aria-hidden>content_paste</span>
            <span className="add-step-shortcuts-menu__label">Paste</span>
          </button>
        </div>
      )}

      <AddStepMenu
        open={menuOpen}
        anchorRect={anchorRect}
        anchorRef={btnRef}
        product={product}
        agentName={agentName}
        singleSearch={singleSearch}
        onClose={() => setMenuOpen(false)}
        onSelect={(payload) => {
          onSelect?.(payload);
          setMenuOpen(false);
        }}
      />
    </div>
  );
}
