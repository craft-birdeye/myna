import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import AddStepMenu from './AddStepMenu';
import './AddStepMenu.css';

/**
 * Shared canvas "+" control: click opens AddStepMenu, or (when a node is copied)
 * a Paste/Add-step FAB.
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
}) {
  const btnRef = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);
  // fabOpen drives the open/closing CSS state; fabVisible keeps the row mounted
  // for the short exit animation before it's actually removed from the DOM.
  const [fabOpen, setFabOpen] = useState(false);
  const [fabVisible, setFabVisible] = useState(false);
  const [fabTooltip, setFabTooltip] = useState(null);
  const [anchorRect, setAnchorRect] = useState(null);
  const fabCloseTimeoutRef = useRef(null);

  useEffect(() => () => clearTimeout(fabCloseTimeoutRef.current), []);

  const updateAnchor = useCallback(() => {
    if (!btnRef.current) return null;
    const r = btnRef.current.getBoundingClientRect();
    setAnchorRect(r);
    return r;
  }, []);

  const openFab = useCallback(() => {
    clearTimeout(fabCloseTimeoutRef.current);
    const r = updateAnchor();
    setFabVisible(true);
    setFabOpen(true);
    if (r) setAnchorRect(r);
  }, [updateAnchor]);

  const closeFab = useCallback(() => {
    setFabOpen(false);
    setFabTooltip(null);
    clearTimeout(fabCloseTimeoutRef.current);
    fabCloseTimeoutRef.current = setTimeout(() => setFabVisible(false), 160);
  }, []);

  useEffect(() => {
    if (!menuOpen && !fabVisible) return undefined;
    function onScroll() {
      updateAnchor();
    }
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onScroll);
    };
  }, [menuOpen, fabVisible, updateAnchor]);

  function handleClick(e) {
    e.preventDefault();
    e.stopPropagation();
    if (showPasteOption) {
      if (fabOpen) {
        closeFab();
        return;
      }
      openFab();
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

  function handleFabPasteClick(e) {
    e.preventDefault();
    e.stopPropagation();
    closeFab();
    onPaste?.();
  }

  function handleFabStepClick(e) {
    e.preventDefault();
    e.stopPropagation();
    closeFab();
    const r = updateAnchor();
    setMenuOpen(true);
    if (r) setAnchorRect(r);
  }

  function handleFabHover(key) {
    return (e) => {
      const r = e.currentTarget.getBoundingClientRect();
      setFabTooltip({ key, top: r.top + r.height / 2, left: r.right + 8 });
    };
  }

  function handleFabUnhover() {
    setFabTooltip(null);
  }

  const btnClass = [
    'add-step-btn',
    'nodrag',
    'nopan',
    className,
    (menuOpen || fabOpen) ? 'add-step-btn--open' : '',
    isDraggingFromLHS ? 'add-step-btn--lhs-drag' : '',
    isDragOver ? 'add-step-btn--drop-target' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="add-step-btn-wrap">
      <button
        ref={btnRef}
        type="button"
        className={btnClass}
        aria-label="Add step"
        onClick={handleClick}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        <span className="material-symbols-outlined">add</span>
      </button>

      {fabVisible &&
        anchorRect &&
        createPortal(
          <>
            <div className="add-step-fab-backdrop" onClick={closeFab} />
            <div
              className={`add-step-fab-row${fabOpen ? ' add-step-fab-row--open' : ' add-step-fab-row--closing'}`}
              style={{
                top: anchorRect.top + anchorRect.height / 2,
                left: anchorRect.left + anchorRect.width / 2,
              }}
            >
              <button
                type="button"
                className="add-step-fab-btn add-step-fab-btn--paste"
                aria-label="Paste"
                onClick={handleFabPasteClick}
                onMouseEnter={handleFabHover('paste')}
                onMouseLeave={handleFabUnhover}
              >
                <span className="material-symbols-outlined">content_paste</span>
              </button>
              <button
                type="button"
                className="add-step-fab-btn add-step-fab-btn--step"
                aria-label="Add step"
                onClick={handleFabStepClick}
                onMouseEnter={handleFabHover('step')}
                onMouseLeave={handleFabUnhover}
              >
                <span className="material-symbols-outlined">checklist</span>
              </button>
            </div>
            {fabTooltip &&
              (() => {
                const isPaste = fabTooltip.key === 'paste';
                return (
                  <span
                    className="add-step-tooltip"
                    role="tooltip"
                    style={{
                      top: fabTooltip.top,
                      left: fabTooltip.left,
                      transform: 'translateY(-50%)',
                    }}
                  >
                    {isPaste ? 'Paste' : 'Add step'}
                  </span>
                );
              })()}
          </>,
          document.body,
        )}

      <AddStepMenu
        open={menuOpen}
        anchorRect={anchorRect}
        anchorRef={btnRef}
        product={product}
        agentName={agentName}
        onClose={() => setMenuOpen(false)}
        onSelect={(payload) => {
          onSelect?.(payload);
          setMenuOpen(false);
        }}
      />
    </div>
  );
}
