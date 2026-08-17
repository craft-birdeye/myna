import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { setFlowDragData } from '../../../flowDragData';
import iconAgentsPurple from '../../../../assets/icon-agents-purple.svg';
import './LHSEntityGroup.css';

const TIP_GAP = 8;
const TIP_MARGIN = 8;

function getItemLabel(item) {
  return typeof item === 'string' ? item : (item?.label ?? '');
}

function getItemDescription(item) {
  return typeof item === 'string' ? '' : (item?.description ?? '');
}

function getItemHasAi(item) {
  if (typeof item === 'string') return false;
  return Boolean(item?.ai);
}

function getItemIcon(item) {
  if (typeof item === 'string') return '';
  return item?.icon || '';
}

function isTextTruncated(el) {
  if (!el) return false;
  const clone = el.cloneNode(true);
  clone.classList.add('lhs-entity-group__desc--measure');
  clone.style.width = `${el.clientWidth}px`;
  el.parentNode?.appendChild(clone);
  const truncated = clone.scrollHeight > el.clientHeight + 1;
  clone.remove();
  return truncated;
}

function placeTooltip(tipEl, anchorEl) {
  const tip = tipEl.getBoundingClientRect();
  const anchor = anchorEl.getBoundingClientRect();
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  const spaceAbove = anchor.top - TIP_MARGIN;
  const spaceBelow = vh - anchor.bottom - TIP_MARGIN;
  const placeBelow = tip.height + TIP_GAP <= spaceBelow || spaceBelow >= spaceAbove;

  let x = anchor.left + anchor.width / 2;
  const halfW = tip.width / 2;
  x = Math.min(Math.max(x, TIP_MARGIN + halfW), vw - TIP_MARGIN - halfW);

  const y = placeBelow ? anchor.bottom + TIP_GAP : anchor.top - TIP_GAP;
  return { x, y, placement: placeBelow ? 'below' : 'above' };
}

function TruncatedDescription({ text }) {
  const descRef = useRef(null);
  const tipRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState(null);

  useEffect(() => {
    setOpen(false);
    setPos(null);
  }, [text]);

  useLayoutEffect(() => {
    if (!open || !tipRef.current || !descRef.current) return undefined;
    setPos(placeTooltip(tipRef.current, descRef.current));

    function reposition() {
      if (!tipRef.current || !descRef.current) return;
      setPos(placeTooltip(tipRef.current, descRef.current));
    }

    window.addEventListener('resize', reposition);
    window.addEventListener('scroll', reposition, true);
    return () => {
      window.removeEventListener('resize', reposition);
      window.removeEventListener('scroll', reposition, true);
    };
  }, [open, text]);

  if (!text) return null;

  function showTooltip() {
    if (!descRef.current || !isTextTruncated(descRef.current)) return;
    setPos(null);
    setOpen(true);
  }

  function hideTooltip() {
    setOpen(false);
    setPos(null);
  }

  return (
    <>
      <p
        ref={descRef}
        className="lhs-entity-group__desc"
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
      >
        {text}
      </p>
      {open && createPortal(
        <span
          ref={tipRef}
          className={`lhs-entity-group__tooltip${pos ? '' : ' lhs-entity-group__tooltip--measuring'}`}
          role="tooltip"
          data-placement={pos?.placement ?? 'below'}
          style={pos ? { left: pos.x, top: pos.y } : undefined}
        >
          {text}
        </span>,
        document.body,
      )}
    </>
  );
}

export default function LHSEntityGroup({
  title,
  items = [],
  nodeType,
  parentLabel,
  onItemsChange,
  onDragStartItem,
  viewOnly = false,
  readOnly = false,
  dragAlwaysVisible = false,
  disabledItems = null,
  /** Renders as a plain inline block (no card shadow, bold titles, single-line desc)
   *  for use directly under an expanded category row, instead of the floating
   *  flyout's own boxed card look. */
  inline = false,
  /** When inline, still show the section title (e.g. "Reviews" / "Inbox"). */
  showTitle = false,
}) {
  const disabledSet = disabledItems instanceof Set ? disabledItems : new Set(disabledItems ?? []);
  const canEdit = !viewOnly && !readOnly && !!onItemsChange;
  const [editingIdx, setEditingIdx] = useState(null);
  const [editDraft, setEditDraft] = useState('');
  const hasDescriptions = items.some((item) => Boolean(getItemDescription(item)));

  const handleDragStart = (e, item) => {
    const label = getItemLabel(item);
    // `description` in the DnD payload is the leaf item name (canvas node title),
    // not the longer UI blurb shown in the flyout.
    setFlowDragData(e.dataTransfer, {
      type: nodeType,
      label: parentLabel,
      description: label,
    });

    // Native drag ghost: label only (not description / drag handle).
    const ghost = document.createElement('div');
    ghost.className = 'lhs-entity-group__drag-ghost';
    ghost.textContent = label;
    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(ghost, 16, 16);
    requestAnimationFrame(() => ghost.remove());

    onDragStartItem?.(item);
  };

  const startEdit = (idx) => {
    setEditingIdx(idx);
    setEditDraft(getItemLabel(items[idx]));
  };

  const commitEdit = (idx) => {
    const trimmed = editDraft.trim();
    if (trimmed) {
      const next = items.map((it, i) => {
        if (i !== idx) return it;
        if (typeof it === 'string') return trimmed;
        return { ...it, label: trimmed };
      });
      onItemsChange?.(next);
    }
    setEditingIdx(null);
  };

  const deleteItem = (idx) => {
    onItemsChange?.(items.filter((_, i) => i !== idx));
    setEditingIdx(null);
  };

  return (
    <div className={`lhs-entity-group${hasDescriptions ? ' lhs-entity-group--described' : ''}${inline ? ' lhs-entity-group--inline' : ''}`}>
      {(!inline || showTitle) && title ? <p className="lhs-entity-group__title">{title}</p> : null}

      <div className="lhs-entity-group__items">
        {items.map((item, idx) => {
          const label = getItemLabel(item);
          const description = getItemDescription(item);
          const hasAi = getItemHasAi(item);
          const icon = getItemIcon(item);
          const isDisabled = disabledSet.has(label) || disabledSet.has(item);
          return (
          <div
            key={`${label}-${idx}`}
            className={`lhs-entity-group__item${description ? ' lhs-entity-group__item--described' : ''}${editingIdx === idx ? ' lhs-entity-group__item--editing' : ''}${isDisabled ? ' lhs-entity-group__item--disabled' : ''}`}
            draggable={!viewOnly && !isDisabled && (readOnly || editingIdx !== idx)}
            onDragStart={(e) => !viewOnly && !isDisabled && (readOnly || editingIdx !== idx) && handleDragStart(e, item)}
            aria-disabled={isDisabled || undefined}
          >
            {icon ? (
              <span className="material-symbols-outlined lhs-entity-group__item-icon" aria-hidden>
                {icon}
              </span>
            ) : null}
            {editingIdx === idx ? (
              <input
                className="lhs-entity-group__item-input"
                value={editDraft}
                autoFocus
                onChange={(e) => setEditDraft(e.target.value)}
                onBlur={() => commitEdit(idx)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { e.preventDefault(); commitEdit(idx); }
                  if (e.key === 'Escape') { e.preventDefault(); setEditingIdx(null); }
                }}
              />
            ) : (
              <div className="lhs-entity-group__item-text">
                <div className="lhs-entity-group__item-title-row">
                  <span className="lhs-entity-group__item-label">{label}</span>
                  {hasAi && (
                    <span className="lhs-entity-group__ai-badge" aria-hidden>
                      <img src={iconAgentsPurple} alt="" className="lhs-entity-group__ai-badge-img" />
                    </span>
                  )}
                </div>
                <TruncatedDescription text={description} />
              </div>
            )}

            {!viewOnly && (
              <div className="lhs-entity-group__item-actions">
                {canEdit && editingIdx === idx ? (
                  <button
                    className="lhs-entity-group__item-btn lhs-entity-group__item-btn--delete"
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => deleteItem(idx)}
                  >
                    <span className="material-symbols-outlined">delete</span>
                  </button>
                ) : canEdit ? (
                  <button
                    className="lhs-entity-group__item-btn lhs-entity-group__item-btn--edit"
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={(e) => { e.stopPropagation(); startEdit(idx); }}
                  >
                    <span className="material-symbols-outlined">edit</span>
                  </button>
                ) : null}
                <span
                  className={`lhs-entity-group__item-drag material-symbols-outlined${
                    dragAlwaysVisible || isDisabled ? ' lhs-entity-group__item-drag--visible' : ''
                  }`}
                >
                  drag_indicator
                </span>
              </div>
            )}
          </div>
          );
        })}
      </div>
    </div>
  );
}
