import React, { useState, useEffect } from 'react';
import VariableChip from '../../../Molecules/Inputs/VariableChip/VariableChip';
import ProcedureDetailBody from '../../Panels/RHS/ProcedureDetailBody';
import './DrawerShared.css';

/* ─── Drawer shell — shared by every Organisms/Drawers/* side panel ─── */
export function NativeDrawer({ isOpen, onClose, children, width = 650 }) {
  if (!isOpen) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', justifyContent: 'flex-end' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)' }} />
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          width,
          maxWidth: '95vw',
          height: '100%',
          overflowY: 'auto',
          background: '#fff',
          boxShadow: '-4px 0 24px rgba(0,0,0,0.14)',
        }}
      >
        {children}
      </div>
    </div>
  );
}

/* Full "view procedure" panel — replaces the whole drawer body. Shared so that clicking a
   selected procedure (Starting/primary procedure, or any Additional procedure chip) opens the
   exact same experience everywhere it appears.

   Edits made inside (whenToUse, context, steps, whenToExit) are tracked locally and only
   committed via `onSave` when the Save button is clicked — Cancel/Back discard them. */
export function ProcedureDetailView({ procedureDetail, onBack, onSave }) {
  const [localDetail, setLocalDetail] = useState(procedureDetail);

  useEffect(() => {
    setLocalDetail(procedureDetail);
  }, [procedureDetail]);

  const handleSave = () => {
    onSave?.(localDetail);
    onBack();
  };

  return (
    <div className="ds__pd-root">
      <div className="ds__pd-header">
        <div className="ds__pd-header-left">
          <button type="button" className="ds__pd-back" onClick={onBack} aria-label="Back">
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>arrow_back</span>
          </button>
          <span className="ds__pd-title">{localDetail.name}</span>
        </div>
        <div className="ds__pd-header-actions">
          <button type="button" className="ds__cancel" onClick={onBack}>Cancel</button>
          <button type="button" className="ds__save-sm" onClick={handleSave}>Save</button>
        </div>
      </div>

      <div className="ds__pd-body">
        <ProcedureDetailBody
          initialValues={localDetail}
          onFieldChange={(field, value) => setLocalDetail((prev) => ({ ...prev, [field]: value }))}
          showTypeField
          whenToUseLabel="When to use this procedure?"
          contextLibraryStyle
          onOpenToolDrawer={() => {}}
        />
      </div>
    </div>
  );
}

export function InfoTooltip({ text }) {
  const [show, setShow] = useState(false);
  if (!text) return null;
  return (
    <span
      className="ds__info-wrap"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <span className="material-symbols-outlined ds__info" aria-hidden="true">info</span>
      {show && <span className="ds__tooltip">{text}</span>}
    </span>
  );
}

export function FieldLabel({ children, tooltip, required }) {
  return (
    <div className="ds__label-row">
      <span className="ds__label">
        {children}
        {required && <span className="ds__required">*</span>}
      </span>
      <InfoTooltip text={tooltip} />
    </div>
  );
}

export function Checkbox({ checked, onChange, label }) {
  const toggle = () => onChange(!checked);
  return (
    <label
      className="ds__checkbox"
      role="checkbox"
      aria-checked={checked}
      tabIndex={0}
      onClick={toggle}
      onKeyDown={(e) => {
        if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); toggle(); }
      }}
    >
      <span className={`ds__checkbox-box${checked ? ' ds__checkbox-box--checked' : ''}`}>
        {checked && <span className="material-symbols-outlined">check</span>}
      </span>
      {label}
    </label>
  );
}

export function Radio({ checked, onChange, label }) {
  return (
    <label
      className="ds__radio"
      role="radio"
      aria-checked={checked}
      tabIndex={0}
      onClick={onChange}
      onKeyDown={(e) => {
        if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); onChange(); }
      }}
    >
      <span className={`ds__radio-dot${checked ? ' ds__radio-dot--checked' : ''}`} />
      {label}
    </label>
  );
}

export function Toggle({ label, subtext, tooltip, checked, onChange }) {
  return (
    <div className="ds__toggle-row">
      <div className="ds__toggle-text">
        <div className="ds__label-row">
          <span className="ds__label">{label}</span>
          <InfoTooltip text={tooltip} />
        </div>
        {subtext && <span className="ds__toggle-subtext">{subtext}</span>}
      </div>
      <button
        type="button"
        className={`ds__toggle${checked ? ' ds__toggle--on' : ''}`}
        onClick={() => onChange(!checked)}
        aria-pressed={checked}
      >
        <span className="ds__toggle-thumb" />
      </button>
    </div>
  );
}

/* ─── Real healthcare procedure catalog (mirrors the "Healthcare Frontdesk" / "Healthcare
   Waitlist" / "Healthcare Pre-visit" entries in procedureService.js). Shared by every drawer
   that lets you pick a procedure (Initiate voice call, Reminder tool, ...). ─── */
export const HEALTHCARE_PROCEDURE_LIBRARY = [
  {
    id: 'Appointment confirmation',
    name: 'Appointment confirmation',
    whenToUse: 'Use when the patient wants to book a new appointment or schedule a visit with a provider',
  },
  {
    id: 'Greet and open conversation',
    name: 'Greet and open conversation',
    whenToUse: 'Identifies the caller, screens for urgency, and routes them to the right procedure.',
  },
  {
    id: 'Handle general inquiry',
    name: 'Handle general inquiry',
    whenToUse: 'Answers informational questions like hours, location, insurance, and services.',
  },
  {
    id: 'Handle emergency or urgent concern',
    name: 'Handle emergency or urgent concern',
    whenToUse: 'Detects urgent symptoms or concerns and escalates for patient safety.',
  },
  {
    id: 'Handle unclear message',
    name: 'Handle unclear message',
    whenToUse: "Clarifies vague or out-of-scope messages to recover the patient's intent.",
  },
  {
    id: 'Talk to human',
    name: 'Talk to human',
    whenToUse: 'Hands off to a live agent when the patient asks for a person or shows frustration.',
  },
  {
    id: 'Form not filled',
    name: 'Form not filled',
    whenToUse: 'Patient has not completed their pre-visit intake form before the appointment date.',
  },
  {
    id: 'Waitlist slot confirmation',
    name: 'Waitlist slot confirmation',
    whenToUse: 'Agent is calling outbound to confirm a newly opened slot with a patient on the waitlist.',
  },
];

/* Searchable "title + subtext" row, shared by every procedure search/pick list. */
export function ProcedureRow({ item, selected, showCheckbox, onClick }) {
  return (
    <button type="button" className="ds__proclist-row" onClick={onClick}>
      {showCheckbox && (
        <span className={`ds__checkbox-box${selected ? ' ds__checkbox-box--checked' : ''}`}>
          {selected && <span className="material-symbols-outlined">check</span>}
        </span>
      )}
      <span className="ds__proclist-rowtext">
        <span className="ds__proclist-row-title">{item.name}</span>
        {item.whenToUse && <span className="ds__proclist-row-desc">{item.whenToUse}</span>}
      </span>
    </button>
  );
}

export function ProcedureSearchList({ items, query, onQueryChange, renderRow, emptyLabel = 'No procedures found.' }) {
  const q = query.trim().toLowerCase();
  const filtered = q
    ? items.filter((p) => p.name.toLowerCase().includes(q) || (p.whenToUse || '').toLowerCase().includes(q))
    : items;
  return (
    <div className="ds__proclist">
      <div className="ds__proclist-search">
        <span className="material-symbols-outlined ds__proclist-search-icon">search</span>
        <input
          className="ds__proclist-search-input"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search"
          autoFocus
        />
      </div>
      <div className="ds__proclist-rows">
        {filtered.length === 0 ? (
          <div className="ds__proclist-empty">{emptyLabel}</div>
        ) : (
          filtered.map((item) => renderRow(item))
        )}
      </div>
    </div>
  );
}

/* Single-select "procedure" field — chip pill once chosen (click it to view/edit the
   procedure via `onView`), searchable dropdown anchored below the field otherwise. This is
   "the same procedure experience" reused by Initiate voice call's Starting procedure and
   Reminder tool's Select primary procedure. */
export function ProcedureSelectField({ value, library, onChange, onView, placeholder = 'Select a procedure' }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const selectedItem = library.find((p) => p.id === value);
  const close = () => { setOpen(false); setQuery(''); };

  return (
    <div className="ds__procedure-field-wrap">
      {value ? (
        <div className="ds__procedure-field">
          <div
            className="ds__procedure-pill"
            role="button"
            tabIndex={0}
            onClick={() => (onView ? onView(value) : setOpen((o) => !o))}
            onKeyDown={(e) => {
              if (e.key !== 'Enter' && e.key !== ' ') return;
              e.preventDefault();
              onView ? onView(value) : setOpen((o) => !o);
            }}
          >
            <VariableChip
              value={selectedItem?.name ?? value}
              type="product"
              readOnly
              onDelete={() => onChange('')}
            />
          </div>
          <button
            type="button"
            className="ds__procedure-chevron"
            aria-label="Change procedure"
            onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
          >
            <span className="material-symbols-outlined">{open ? 'expand_less' : 'expand_more'}</span>
          </button>
        </div>
      ) : (
        <button type="button" className="ds__procedure-field ds__procedure-field--empty" onClick={() => setOpen((o) => !o)}>
          <span className="ds__label" style={{ color: '#9e9e9e' }}>{placeholder}</span>
          <span className="material-symbols-outlined ds__procedure-chevron-icon">{open ? 'expand_less' : 'expand_more'}</span>
        </button>
      )}
      {open && (
        <>
          <div className="ds__procedure-overlay" onClick={close} />
          <div className="ds__procedure-menu ds__procedure-menu--search">
            <ProcedureSearchList
              items={library}
              query={query}
              onQueryChange={setQuery}
              renderRow={(item) => (
                <ProcedureRow key={item.id} item={item} onClick={() => { onChange(item.id); close(); }} />
              )}
            />
          </div>
        </>
      )}
    </div>
  );
}

/* Flat searchable multi-select picker — same "search on top, flat list below" layout as
   ProcedureSelectField's single-select dropdown, just with checkboxes instead of single-click
   selection. Selections are staged in `draft` and only committed on Apply. Anchored below the
   field, same width — not a centered modal. */
function ProcedureMultiSelectDropdown({ library, selected, onApply, onCancel }) {
  const [query, setQuery] = useState('');
  const [draft, setDraft] = useState(selected);

  const toggle = (id) => {
    setDraft((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]));
  };

  return (
    <div className="ds__addproc-anchor" onClick={(e) => e.stopPropagation()}>
      <ProcedureSearchList
        items={library}
        query={query}
        onQueryChange={setQuery}
        renderRow={(item) => (
          <ProcedureRow
            key={item.id}
            item={item}
            selected={draft.includes(item.id)}
            showCheckbox
            onClick={() => toggle(item.id)}
          />
        )}
      />

      <div className="ds__addproc-footer">
        <button type="button" className="ds__cancel" onClick={onCancel}>Cancel</button>
        <button type="button" className="ds__save-sm" onClick={() => onApply(draft)}>Apply</button>
      </div>
    </div>
  );
}

/* Select-style field (placeholder "Select", chips once chosen, chevron) that opens the
   two-pane picker directly below itself. This is "the same procedure experience" reused by
   Initiate voice call's Additional procedures and Reminder tool's Select additional
   procedure/s. */
export function ProcedureMultiSelectField({ value, library, onApply, onView, placeholder = 'Select' }) {
  const [open, setOpen] = useState(false);
  const selectedItems = library.filter((p) => value.includes(p.id));
  const close = () => setOpen(false);

  return (
    <div className="ds__procedure-field-wrap">
      <div
        className="ds__procedure-field ds__procedure-field--multi"
        role="button"
        tabIndex={0}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen((o) => !o); }
        }}
      >
        {selectedItems.length === 0 ? (
          <span className="ds__label" style={{ color: '#9e9e9e' }}>{placeholder}</span>
        ) : (
          <div className="ds__procedure-field-chips">
            {selectedItems.map((item) => (
              <div
                key={item.id}
                className="ds__procedure-chip-view"
                role="button"
                tabIndex={0}
                onClick={(e) => { e.stopPropagation(); onView?.(item.id); }}
                onKeyDown={(e) => {
                  if (!onView) return;
                  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); onView(item.id); }
                }}
              >
                <VariableChip
                  value={item.name}
                  type="product"
                  readOnly
                  onDelete={() => onApply(value.filter((v) => v !== item.id))}
                />
              </div>
            ))}
          </div>
        )}
        <button
          type="button"
          className="ds__procedure-chevron"
          aria-label="Select additional procedures"
          onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
        >
          <span className="material-symbols-outlined">{open ? 'expand_less' : 'expand_more'}</span>
        </button>
      </div>
      {open && (
        <>
          <div className="ds__procedure-overlay" onClick={close} />
          <ProcedureMultiSelectDropdown
            library={library}
            selected={value}
            onApply={(next) => { onApply(next); close(); }}
            onCancel={close}
          />
        </>
      )}
    </div>
  );
}
