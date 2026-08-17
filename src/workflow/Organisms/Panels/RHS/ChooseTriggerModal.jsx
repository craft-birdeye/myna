import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import './ChooseTriggerModal.css';

export const REVIEW_TRIGGER_OPTIONS = [
  {
    value: 'new-review-received',
    label: 'New review received',
    description: 'Trigger fired when a new review is received',
    agentDescription: 'Agent triggers when a new review is received across all sources and locations',
  },
  {
    value: 'review-updated',
    label: 'Review updated',
    description: 'Trigger fired when a review is updated',
    agentDescription: 'Agent triggers when an existing review is updated across all sources and locations',
  },
  {
    value: 'new-review-received-or-updated',
    label: 'New review is received or updated',
    description: 'Trigger fired when a new review is received or updated',
    agentDescription:
      'Agent triggers when there is a new review or an existing review is updated across all sources and locations',
  },
];

const CATEGORIES = [{ id: 'review', label: 'Reviews' }];
const POPOVER_WIDTH = 560;
const POPOVER_GAP = 8;

function getPopoverPosition(anchorEl) {
  if (!anchorEl) return { top: 120, left: 120 };
  const rect = anchorEl.getBoundingClientRect();
  const estimatedHeight = Math.min(450, window.innerHeight - 24);

  // Sit to the left of the Trigger field, top-aligned with it.
  let top = rect.top;
  let left = rect.left - POPOVER_WIDTH - POPOVER_GAP;

  // If there isn't enough room on the left, fall back to the right side.
  if (left < 12) {
    left = Math.min(rect.right + POPOVER_GAP, window.innerWidth - POPOVER_WIDTH - 12);
  }

  // Keep vertically in viewport while staying as close as possible to the field top.
  if (top + estimatedHeight > window.innerHeight - 12) {
    top = Math.max(12, window.innerHeight - estimatedHeight - 12);
  }
  top = Math.max(12, top);
  left = Math.max(12, Math.min(left, window.innerWidth - POPOVER_WIDTH - 12));

  return { top, left };
}

export default function ChooseTriggerModal({
  open,
  selectedValue,
  anchorRef,
  onClose,
  onSelect,
}) {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('review');
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const panelRef = useRef(null);

  useLayoutEffect(() => {
    if (!open) return undefined;
    const update = () => setPos(getPopoverPosition(anchorRef?.current));
    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [open, anchorRef]);

  useEffect(() => {
    if (!open) return undefined;
    setQuery('');
    setActiveCategory('review');

    function onKeyDown(e) {
      if (e.key === 'Escape') onClose?.();
    }

    function onPointerDown(e) {
      const panel = panelRef.current;
      const anchor = anchorRef?.current;
      if (panel?.contains(e.target)) return;
      if (anchor?.contains(e.target)) return;
      onClose?.();
    }

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('mousedown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('mousedown', onPointerDown);
    };
  }, [open, onClose, anchorRef]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return REVIEW_TRIGGER_OPTIONS;
    return REVIEW_TRIGGER_OPTIONS.filter(
      (opt) =>
        opt.label.toLowerCase().includes(q) ||
        opt.description.toLowerCase().includes(q),
    );
  }, [query]);

  if (!open) return null;

  return createPortal(
    <div
      ref={panelRef}
      className="choose-trigger-modal"
      role="dialog"
      aria-label="Choose a trigger"
      style={{ top: pos.top, left: pos.left }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="choose-trigger-modal__header">
        <h2 className="choose-trigger-modal__title">Choose a trigger</h2>
        <button
          type="button"
          className="choose-trigger-modal__close"
          aria-label="Close"
          onClick={onClose}
        >
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>

      <div className="choose-trigger-modal__search">
        <span className="material-symbols-outlined choose-trigger-modal__search-icon">search</span>
        <input
          type="text"
          className="choose-trigger-modal__search-input"
          placeholder="Search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
      </div>

      <div className="choose-trigger-modal__body">
        <div className="choose-trigger-modal__nav">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              className={`choose-trigger-modal__nav-row${
                activeCategory === cat.id ? ' choose-trigger-modal__nav-row--active' : ''
              }`}
              onClick={() => setActiveCategory(cat.id)}
            >
              <span className="choose-trigger-modal__nav-label">{cat.label}</span>
              <span className="material-symbols-outlined choose-trigger-modal__nav-chevron">
                chevron_right
              </span>
            </button>
          ))}
        </div>

        <div className="choose-trigger-modal__list">
          {filtered.length === 0 ? (
            <p className="choose-trigger-modal__empty">No triggers found</p>
          ) : (
            filtered.map((opt) => {
              const selected = opt.value === selectedValue;
              return (
                <button
                  key={opt.value}
                  type="button"
                  className={`choose-trigger-modal__option${
                    selected ? ' choose-trigger-modal__option--selected' : ''
                  }`}
                  onClick={() => {
                    onSelect?.(opt);
                    onClose?.();
                  }}
                >
                  <div className="choose-trigger-modal__option-text">
                    <span className="choose-trigger-modal__option-title">{opt.label}</span>
                    <span className="choose-trigger-modal__option-desc">{opt.description}</span>
                  </div>
                  {selected && (
                    <span className="material-symbols-outlined choose-trigger-modal__check">
                      check
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
