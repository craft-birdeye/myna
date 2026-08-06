import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  getAddStepControlCards,
  getAddStepTaskCards,
  getTaskSubItems,
} from '../LHSDrawer/LHSDrawer';
import './AddStepMenu.css';

const ITEM_DESCRIPTIONS = {
  'Initiate voice call': 'Call the customer',
  'In-call SMS': 'Send a text message to the caller during the active call',
  'Send response': 'Sends a voice / text message to the user at the defined point in the conversation',
  'In call text': 'Send a text message during the active call',
  'Schedule appointment': 'Book a new appointment for the customer',
  'Book new appointment': 'Book a new appointment for the customer',
  'Reschedule appointment': 'Change an existing appointment date or time',
  'Cancel appointment': 'Cancel a scheduled appointment',
  'Confirm appointment': 'Confirm appointment details with the customer',
  'Appointment reminder': '3 weeks, 3 days and 24 hours before · Email & text',
  'Update contact property': 'Update a field on the contact record',
  'Add contact to list': 'Add the contact to a marketing or CRM list',
  'Remove contact from list': 'Remove the contact from a list',
  'Send data to external app': 'Push data to a connected external application',
  'Fetch data from external app': 'Retrieve data from a connected external application',
  'Trigger external webhook': 'Fire a webhook to an external system',
  Branch: 'Split the flow based on conditions',
  Delay: 'Wait for a specific time or event',
};

const AI_ITEMS = new Set(['Review responder']);

function SearchField({ value, onChange, autoFocus }) {
  return (
    <div className="add-step-menu__search">
      <span className="material-symbols-outlined add-step-menu__search-icon">search</span>
      <input
        type="text"
        placeholder="Search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoFocus={autoFocus}
        className="add-step-menu__search-input"
      />
    </div>
  );
}

function NavRow({ icon, label, hasChevron, active, onClick }) {
  return (
    <button
      type="button"
      className={`add-step-menu__nav-row${active ? ' add-step-menu__nav-row--active' : ''}`}
      onClick={onClick}
    >
      <span className="material-symbols-outlined add-step-menu__nav-icon">{icon}</span>
      <span className="add-step-menu__nav-label">{label}</span>
      {hasChevron && (
        <span className="material-symbols-outlined add-step-menu__nav-chevron">chevron_right</span>
      )}
    </button>
  );
}

function DetailRow({ title, description, hasAi, onClick }) {
  return (
    <button type="button" className="add-step-menu__detail-row" onClick={onClick}>
      <div className="add-step-menu__detail-text">
        <div className="add-step-menu__detail-title-row">
          <span className="add-step-menu__detail-title">{title}</span>
          {hasAi && (
            <span className="add-step-menu__ai-badge" aria-hidden>
              <span className="material-symbols-outlined">auto_awesome</span>
              AI+
            </span>
          )}
        </div>
        {description && (
          <span className="add-step-menu__detail-desc">{description}</span>
        )}
      </div>
    </button>
  );
}

/**
 * Canvas add-step popover — single pane (search + TASKS / CONTROLS) that expands
 * to a two-pane layout when a chevron category is selected.
 */
export default function AddStepMenu({
  open,
  anchorRect,
  anchorRef,
  product = 'healthcare',
  agentName = '',
  onClose,
  onSelect,
}) {
  const [leftSearch, setLeftSearch] = useState('');
  const [rightSearch, setRightSearch] = useState('');
  const [activeSubKey, setActiveSubKey] = useState(null);
  const menuRef = useRef(null);
  // Lock horizontal origin when the menu opens so expand/hover never shifts Branch/Delay.
  const originLeftRef = useRef(null);

  const taskCards = useMemo(() => getAddStepTaskCards(product), [product]);
  const controlCards = useMemo(() => getAddStepControlCards(), []);
  const subItemsMap = useMemo(() => getTaskSubItems(product, agentName), [product, agentName]);

  useEffect(() => {
    if (!open) {
      setLeftSearch('');
      setRightSearch('');
      setActiveSubKey(null);
      originLeftRef.current = null;
      return;
    }
    if (anchorRect && originLeftRef.current == null) {
      originLeftRef.current = anchorRect.right + 10;
    }
  }, [open, anchorRect]);

  useEffect(() => {
    if (!open) return undefined;
    function onKey(e) {
      if (e.key === 'Escape') onClose?.();
    }
    // Capture phase so React Flow / canvas handlers can't swallow the event.
    function onPointerDown(e) {
      const t = e.target;
      if (menuRef.current?.contains(t)) return;
      if (anchorRef?.current?.contains(t)) return;
      onClose?.();
    }
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointerDown, true);
    document.addEventListener('mousedown', onPointerDown, true);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointerDown, true);
      document.removeEventListener('mousedown', onPointerDown, true);
    };
  }, [open, onClose, anchorRef]);

  if (!open || !anchorRect) return null;

  const q = leftSearch.trim().toLowerCase();
  const filteredTasks = taskCards.filter((c) => !q || c.label.toLowerCase().includes(q));
  const filteredControls = controlCards.filter((c) => !q || c.label.toLowerCase().includes(q));

  const activeCard = taskCards.find((c) => (c.subKey || c.label) === activeSubKey);
  const activeGroup = activeSubKey ? subItemsMap[activeSubKey] : null;
  const rightQ = rightSearch.trim().toLowerCase();
  const disabledItems = new Set(['In call text']);
  const detailItems = (activeGroup?.items || []).filter(
    (item) =>
      !disabledItems.has(item) &&
      (!rightQ || item.toLowerCase().includes(rightQ)),
  );

  const expanded = Boolean(activeGroup);
  const menuHeight = 360;
  const top = Math.max(
    12,
    Math.min(anchorRect.top + anchorRect.height / 2 - 24, window.innerHeight - menuHeight - 12),
  );
  // Keep left edge fixed so Branch / Delay (and the search field) don't jump when
  // the right pane opens after selecting a chevron category.
  const left = Math.min(
    originLeftRef.current ?? anchorRect.right + 10,
    window.innerWidth - (expanded ? 560 : 240) - 12,
  );

  function pickLeaf(type, label, description) {
    onSelect?.({ type, label, description });
    onClose?.();
  }

  function handleNavClick(card, section) {
    if (card.action === 'chevron') {
      setActiveSubKey(card.subKey || card.label);
      setRightSearch('');
      return;
    }
    const type = section === 'control' ? card.nodeType : 'task';
    const label = card.dragLabel || card.label;
    pickLeaf(type, label, '');
  }

  return createPortal(
    <>
      <div
        className="add-step-menu__backdrop"
        aria-hidden
        onPointerDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onClose?.();
        }}
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onClose?.();
        }}
      />
      <div
        ref={menuRef}
        className={`add-step-menu${expanded ? ' add-step-menu--expanded' : ''}`}
        style={{ top, left }}
        onMouseDown={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
      <div className="add-step-menu__pane add-step-menu__pane--nav">
        <SearchField value={leftSearch} onChange={setLeftSearch} autoFocus={!expanded} />

        {filteredTasks.length > 0 && (
          <div className="add-step-menu__section">
            <p className="add-step-menu__section-label">Tasks</p>
            <div className="add-step-menu__section-list">
              {filteredTasks.map((card) => (
                <NavRow
                  key={card.label}
                  icon={card.icon}
                  label={card.label}
                  hasChevron={card.action === 'chevron'}
                  active={(card.subKey || card.label) === activeSubKey}
                  onClick={() => handleNavClick(card, 'task')}
                />
              ))}
            </div>
          </div>
        )}

        {filteredControls.length > 0 && (
          <div className="add-step-menu__section">
            <p className="add-step-menu__section-label">Controls</p>
            <div className="add-step-menu__section-list">
              {filteredControls.map((card) => (
                <NavRow
                  key={card.label}
                  icon={card.icon}
                  label={card.label}
                  hasChevron={false}
                  active={false}
                  onClick={() => handleNavClick(card, 'control')}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {expanded && (
        <div className="add-step-menu__pane add-step-menu__pane--detail">
          <SearchField value={rightSearch} onChange={setRightSearch} autoFocus />
          <div className="add-step-menu__detail-list">
            {detailItems.map((item) => (
              <DetailRow
                key={item}
                title={item}
                description={ITEM_DESCRIPTIONS[item]}
                hasAi={AI_ITEMS.has(item)}
                onClick={() =>
                  pickLeaf('task', activeCard?.dragLabel || activeCard?.label || activeSubKey, item)
                }
              />
            ))}
            {detailItems.length === 0 && (
              <p className="add-step-menu__empty">No matching items</p>
            )}
          </div>
        </div>
      )}
      </div>
    </>,
    document.body,
  );
}
