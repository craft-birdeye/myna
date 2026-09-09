import React, { useState, useRef, useEffect, useLayoutEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { FormInput, TextArea, Toggle, SingleSelect, MultiSelect } from '../../../elemental-stubs';
function NativeDrawer({ isOpen, onClose, children, width = 960 }) {
  React.useEffect(() => {
    if (isOpen) { document.body.style.overflow = 'hidden'; }
    else { document.body.style.overflow = ''; }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);
  if (!isOpen) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999 }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.2)', backdropFilter: 'blur(4px)' }} />
      <div style={{ position: 'absolute', right: 8, top: 8, width, maxWidth: 'calc(92vw - 8px)', height: 'calc(100% - 16px)', borderRadius: 16, background: '#fff', boxShadow: '-4px 0 24px rgba(0,0,0,0.14)', display: 'flex', flexDirection: 'column', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}
const CommonSideDrawer = ({ isOpen, onClose, children }) => <NativeDrawer isOpen={isOpen} onClose={onClose} width={650}>{children}</NativeDrawer>;
/* Select/SelectItem stubs */
function Select({ value, onChange, children }) {
  return <select value={value} onChange={(e) => onChange?.(e.target.value)} style={{ height: 36, padding: '0 12px', border: '1px solid #c5cad3', borderRadius: 4, fontSize: 14, width: '100%', fontFamily: '"Roboto", sans-serif' }}>{children}</select>;
}
function SelectItem({ value, children }) { return <option value={value}>{children}</option>; }
import VariableChip from '../../../Molecules/Inputs/VariableChip/VariableChip';
import ToolbarButton from '../../../Molecules/Inputs/ToolbarButton.jsx';
import { VariableIcon } from '../../../Molecules/Inputs/PromptToolbarIcons.jsx';
import FieldPickerModal from '../../Modals/FieldPickerModal/FieldPickerModal.jsx';
import { MediaLibraryModal } from '../../../../components/MediaLibraryModal/MediaLibraryModal';
import localizeSampleImage from '../../../../assets/media-library/photo-1.jpg';
import { REVIEW_RESPONSE_TEMPLATES } from '../../../../data/messageTemplateLibrary';
import { Chip } from '../../../../components/Chip/Chip';
import CreateTagModal from '../../Modals/CreateTagModal/CreateTagModal.jsx';
import DataType from '../../../Molecules/DataType/DataType';
import { Tooltip } from '../../../../components/Tooltip/Tooltip';
import { InfoTooltip } from '../../../../components/InfoTooltip/InfoTooltip';
import { getTags, createTag, updateTag, findTagByName } from '../../../services/tagService';
import styles from './CustomToolViewer.module.css';

// ─── Template picker data ─────────────────────────────────────────────────────
const TEMPLATE_CATEGORIES = [
  { id: 'slotconfirmation', label: 'Slot confirmation', count: 2 },
  { id: 'previsit',    label: 'Pre-visit',            count: 4 },
  { id: 'appointment', label: 'Appointment reminder',  count: 3 },
  { id: 'followup',   label: 'Follow-up',              count: 2 },
  { id: 'custom',     label: 'Custom',                 count: 0 },
];
const TEMPLATE_LIST = [
  { id: 'tpl-sc-1', category: 'slotconfirmation', title: 'Slot available — patient outreach',  preview: 'Hi [Patient Name], a slot has opened up on [Date] at [Time] with [Provider]. Would you like us to book this for you? Reply YES to confirm.' },
  { id: 'tpl-sc-2', category: 'slotconfirmation', title: 'Waitlist confirmation follow-up',     preview: 'Hi [Patient Name], following up on the open slot we mentioned. The appointment is still available. Reply YES to confirm or call us at [Phone].' },
  { id: 'tpl-1', category: 'previsit',    title: 'Pre-visit intake form',           preview: 'Hi [Patient Name], Your appointment is on [Date]. Please complete your intake form before your visit to help us serve you better.' },
  { id: 'tpl-2', category: 'previsit',    title: 'Health history questionnaire',    preview: 'Hi [Patient Name], To prepare for your upcoming appointment, please take a few minutes to complete your health history questionnaire.' },
  { id: 'tpl-3', category: 'previsit',    title: 'Forms completion reminder',       preview: 'Hi [Patient Name], You still have outstanding intake forms to complete before your appointment on [Date].' },
  { id: 'tpl-4', category: 'previsit',    title: 'Appointment preparation guide',   preview: "Hi [Patient Name], Here's how to prepare for your visit with us. Please review the instructions and complete your forms." },
  { id: 'tpl-5', category: 'appointment', title: 'Appointment confirmation',        preview: 'Hi [Patient Name], Your appointment with Dr. [Provider] is confirmed for [Date] at [Time]. Reply CONFIRM to confirm or CANCEL to cancel.' },
  { id: 'tpl-6', category: 'appointment', title: '24-hour reminder',                preview: 'Reminder: Your appointment is tomorrow at [Time]. Please arrive 10 minutes early and bring your insurance card and ID.' },
  { id: 'tpl-7', category: 'appointment', title: 'Day-of reminder',                 preview: 'Good morning! You have an appointment today at [Time] with [Provider]. We look forward to seeing you.' },
  { id: 'tpl-8', category: 'followup',    title: 'Post-visit summary',              preview: 'Thank you for visiting us today, [Patient Name]. Here is a summary of your visit and your next steps.' },
  { id: 'tpl-9', category: 'followup',    title: 'Follow-up care reminder',         preview: 'Hi [Patient Name], As discussed at your last visit, please remember to follow up with the recommended next steps.' },
];

function TemplateThumbnail() {
  return (
    <div style={{ width: 64, height: 80, background: '#f5f5f5', border: '1px solid #e0e0e0', borderRadius: 4, overflow: 'hidden', flexShrink: 0, padding: 6 }}>
      <div style={{ height: 14, background: '#e0e0e0', borderRadius: 2, marginBottom: 4 }} />
      <div style={{ height: 6, background: '#ebebeb', borderRadius: 1, marginBottom: 3 }} />
      <div style={{ height: 6, background: '#ebebeb', borderRadius: 1, marginBottom: 3 }} />
      <div style={{ height: 6, background: '#ebebeb', borderRadius: 1, marginBottom: 8 }} />
      <div style={{ height: 14, background: '#1976d2', borderRadius: 2, opacity: 0.35 }} />
    </div>
  );
}

function TemplatePickerModal({ isOpen, onClose, onSelect, initialSelected = [] }) {
  const [activeTab,      setActiveTab]      = useState('templates');
  const [activeCategory, setActiveCategory] = useState('previsit');
  const [search,         setSearch]         = useState('');
  const [selected,       setSelected]       = useState(new Set(initialSelected));

  if (!isOpen) return null;

  const filtered = TEMPLATE_LIST.filter(
    t => t.category === activeCategory &&
      (search === '' || t.title.toLowerCase().includes(search.toLowerCase()))
  );

  const toggle = (id) => setSelected(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 10001, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={onClose}
    >
      <div style={{ position: 'relative', width: 720, maxWidth: '95vw', background: '#fff', borderRadius: 8, boxShadow: '0 8px 32px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', maxHeight: '80vh', overflow: 'hidden' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '12px 16px' }}>
          <button type="button" style={{ fontSize: 13, color: '#1976d2', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, marginRight: 'auto', fontFamily: 'Roboto, sans-serif' }}>
            Create template
            <span className="material-symbols-outlined" style={{ fontSize: 14, lineHeight: 1, fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}>open_in_new</span>
          </button>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: 4 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 20, color: '#555', fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}>close</span>
          </button>
        </div>
        {/* Tabs */}
        <div style={{ display: 'flex', padding: '0 16px', borderBottom: '1px solid #e5e9f0' }}>
          {[{ id: 'templates', label: 'Templates', badge: null }, { id: 'ai', label: 'Templates AI', badge: 'NEW' }].map(tab => (
            <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)}
              style={{ padding: '10px 16px', background: 'none', border: 'none', cursor: 'pointer', borderBottom: activeTab === tab.id ? '2px solid #1976d2' : '2px solid transparent', color: activeTab === tab.id ? '#1976d2' : '#555', fontSize: 14, fontFamily: 'Roboto, sans-serif', display: 'flex', alignItems: 'center', gap: 6, marginBottom: -1 }}
            >
              {tab.label}
              {tab.badge && <span style={{ background: '#2e7d32', color: '#fff', fontSize: 10, fontWeight: 600, padding: '1px 5px', borderRadius: 3 }}>{tab.badge}</span>}
            </button>
          ))}
        </div>
        {/* Info bar */}
        <div style={{ background: '#e8f4fd', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#1976d2', flexShrink: 0, fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}>info</span>
          <span style={{ fontSize: 12, color: '#424242', fontFamily: 'Roboto, sans-serif', lineHeight: '18px' }}>
            Select multiple templates of the same type for A/B testing. Deselect all to test templates of a different type.
          </span>
        </div>
        {/* Search */}
        <div style={{ padding: '8px 16px', borderBottom: '1px solid #f0f0f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #d0d5dd', borderRadius: 6, padding: '0 10px', gap: 8 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#9e9e9e', fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}>search</span>
            <input style={{ flex: 1, border: 'none', outline: 'none', fontSize: 14, fontFamily: 'Roboto, sans-serif', padding: '8px 0', color: '#212121', background: 'transparent' }}
              placeholder="Search" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
        {/* Body */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>
          {/* Sidebar */}
          <div style={{ width: 190, borderRight: '1px solid #e5e9f0', overflowY: 'auto', paddingTop: 8, flexShrink: 0 }}>
            {TEMPLATE_CATEGORIES.map(cat => (
              <button key={cat.id} type="button" onClick={() => setActiveCategory(cat.id)}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', padding: '8px 16px', border: 'none', background: activeCategory === cat.id ? '#f0f6ff' : 'none', borderLeft: activeCategory === cat.id ? '2px solid #1976d2' : '2px solid transparent', cursor: 'pointer', fontSize: 13, fontFamily: 'Roboto, sans-serif', color: activeCategory === cat.id ? '#1976d2' : '#424242', textAlign: 'left', boxSizing: 'border-box' }}
              >
                <span>{cat.label}</span>
                <span style={{ color: '#9e9e9e', fontSize: 12 }}>{cat.count} ›</span>
              </button>
            ))}
          </div>
          {/* Template list */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px' }}>
            {filtered.map(tpl => (
              <div key={tpl.id} onClick={() => toggle(tpl.id)}
                style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 8px', borderRadius: 6, cursor: 'pointer', marginBottom: 4, background: selected.has(tpl.id) ? '#f0f6ff' : 'transparent', border: `1px solid ${selected.has(tpl.id) ? '#1976d2' : 'transparent'}` }}
              >
                <input type="checkbox" checked={selected.has(tpl.id)} onChange={() => toggle(tpl.id)} onClick={e => e.stopPropagation()} style={{ accentColor: '#1976d2', width: 16, height: 16, marginTop: 2, cursor: 'pointer', flexShrink: 0 }} />
                <TemplateThumbnail />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, color: '#212121', fontFamily: 'Roboto, sans-serif', marginBottom: 4 }}>{tpl.title}</div>
                  <div style={{ fontSize: 12, color: '#757575', fontFamily: 'Roboto, sans-serif', lineHeight: '18px' }}>{tpl.preview.substring(0, 90)}...</div>
                </div>
                <button type="button" onClick={e => e.stopPropagation()} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, flexShrink: 0 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#9e9e9e', fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}>visibility</span>
                </button>
              </div>
            ))}
            {filtered.length === 0 && <div style={{ padding: 24, textAlign: 'center', color: '#9e9e9e', fontSize: 14, fontFamily: 'Roboto, sans-serif' }}>No templates found</div>}
          </div>
        </div>
        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderTop: '1px solid #e5e9f0' }}>
          <button type="button" onClick={() => setSelected(new Set())} style={{ color: '#1976d2', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, fontFamily: 'Roboto, sans-serif' }}>Clear</button>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" onClick={onClose} style={{ height: 36, padding: '0 16px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, fontFamily: 'Roboto, sans-serif', color: '#1976d2' }}>Cancel</button>
            <button type="button" onClick={() => onSelect(Array.from(selected))} style={{ height: 36, padding: '0 20px', background: '#1976d2', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 14, fontFamily: 'Roboto, sans-serif' }}>Select</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function TemplateSelectField({ field }) {
  const [modalOpen,    setModalOpen]    = useState(false);
  const [selectedIds,  setSelectedIds]  = useState([]);

  const displayText = selectedIds.length === 0
    ? (field.placeholder || 'Select')
    : selectedIds.length === 1
      ? (TEMPLATE_LIST.find(t => t.id === selectedIds[0])?.title || '1 selected')
      : `${selectedIds.length} selected`;

  return (
    <>
      <div className={styles.fieldWrap}>
        <span className={styles.fieldLabel}>{field.label}</span>
        <div className={styles.selectWrap}>
          <button type="button" onClick={() => setModalOpen(true)}
            style={{ width: '100%', height: 36, padding: '0 36px 0 12px', border: '1px solid #c5cad3', borderRadius: 4, background: '#fff', textAlign: 'left', cursor: 'pointer', fontSize: 14, fontFamily: 'Roboto, sans-serif', color: selectedIds.length > 0 ? '#212121' : '#9e9e9e', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
          >{displayText}</button>
          <span className={`material-symbols-outlined ${styles.selectChevron}`} style={{ pointerEvents: 'none' }}>expand_more</span>
        </div>
      </div>
      {modalOpen && (
        <TemplatePickerModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onSelect={(ids) => { setSelectedIds(ids); setModalOpen(false); }}
          initialSelected={selectedIds}
        />
      )}
    </>
  );
}

// ─── Interactive field ────────────────────────────────────────────────────────

function buildInitialSnapshot(fields = []) {
  const snap = {};
  fields.forEach((f) => {
    if (f.type === 'checkbox' && Array.isArray(f.defaultValue)) {
      snap[f.id] = [...f.defaultValue];
    } else if (f.type === 'radio' && f.defaultValue) {
      snap[f.id] = f.defaultValue;
    }
  });
  return snap;
}

function isFieldVisible(field, snapshot) {
  if (!field.showWhen) return true;
  const { fieldId, includes, equals } = field.showWhen;
  const val = snapshot[fieldId];
  if (includes !== undefined) {
    return Array.isArray(val) && val.includes(includes);
  }
  if (equals !== undefined) {
    return val === equals;
  }
  return true;
}

function FieldLabel({ label, required, showInfoIcon, infoText }) {
  return (
    <span className={styles.fieldLabelRow}>
      <span className={styles.fieldLabel}>
        {label}{required && <span className={styles.required}> *</span>}
      </span>
      {showInfoIcon && infoText ? (
        <InfoTooltip text={infoText} variant="detail" />
      ) : null}
    </span>
  );
}

function FieldHeader({ label, required, helpText, showInfoIcon, infoText }) {
  const tip = showInfoIcon ? infoText : undefined;
  return (
    <>
      <FieldLabel
        label={label}
        required={required}
        showInfoIcon={Boolean(tip)}
        infoText={tip}
      />
      {helpText ? <span className={styles.fieldHelp}>{helpText}</span> : null}
    </>
  );
}

function SectionField({ field, onValueChange }) {
  const [open, setOpen] = useState(field.defaultOpen !== false);
  return (
    <div style={{ border: '1px solid #e5e9f0', borderRadius: 6, overflow: 'hidden' }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 14px', background: '#f9fafb', border: 'none', cursor: 'pointer', textAlign: 'left' }}
      >
        <span
          className="material-symbols-outlined"
          style={{ fontSize: 18, color: '#555', transform: open ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.15s', lineHeight: 1, fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}
        >expand_less</span>
        <span style={{ fontSize: 14, fontFamily: 'Roboto, sans-serif', color: '#212121' }}>{field.label}</span>
      </button>
      {open && (
        <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 12, background: '#f9fafb' }}>
          {(field.sectionFields || []).map((sf) => (
            <InteractiveField key={sf.id} field={sf} onValueChange={onValueChange} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Create-ticket builder field ───────────────────────────────────────── */

const TICKET_ASSIGNEE_TYPES = [
  { value: 'Users', label: 'Users' },
  { value: 'Roles', label: 'Roles' },
];

/** Condition field → its allowed values. Status is shared with the Set status action. */
const TICKET_CONDITION_VALUES = {
  Status: ['New', 'Assigned', 'In progress'],
  'Time elapsed': ['1 day', '2 days', '3 days', '1 week', '2 weeks'],
};

const TICKET_CONDITION_FIELDS = Object.keys(TICKET_CONDITION_VALUES).map((v) => ({ value: v, label: v }));

const TICKET_WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  .map((d) => ({ value: d, label: d }));

/** Only Time elapsed can skip days. */
const TICKET_EXCLUDE_FIELD = 'Time elapsed';

const TICKET_ACTION_TYPES = [
  { id: 'assignee', menuLabel: 'Select assignee', rowLabel: 'Assign to' },
  { id: 'status', menuLabel: 'Set status', rowLabel: 'Set status' },
  { id: 'notify', menuLabel: 'Select whom to notify', rowLabel: 'Notify' },
];

/** Enough for the three action rows; used to decide whether to flip upward. */
const TICKET_ACTION_MENU_H = 132;

const TICKET_ROLES = ['Client Admin', 'Client Manager', 'Client User', 'Location Manager'];
const TICKET_USERS = ['Jane Cooper', 'Devon Lane', 'Naveen K'];
/** Cap behind the "Select upto 10 users" placeholder on the assignee action. */
const TICKET_ASSIGNEE_MAX = 10;

/** "Client Admin" for one, "2 roles" past that. */
function ticketCountLabel(noun) {
  return (selected) => (selected.length === 1 ? selected[0] : `${selected.length} ${noun}`);
}

/** ['Mon','Tue','Wed','Thu'] -> 'Mon, Tue, Wed, and Thu'. */
function ticketOxfordList(selected) {
  if (selected.length <= 1) return selected[0] || '';
  if (selected.length === 2) return `${selected[0]} and ${selected[1]}`;
  return `${selected.slice(0, -1).join(', ')}, and ${selected[selected.length - 1]}`;
}

/** A chosen value, styled as a filled field box; the cross clears it back to its picker. */
function TicketChip({ label, onClear }) {
  return (
    <span className={styles.ticketChip}>
      <span className={styles.ticketChipLabel}>{label}</span>
      <button type="button" className={styles.ticketChipClear} aria-label={`Clear ${label}`} onClick={onClear}>
        <span className="material-symbols-outlined">close</span>
      </button>
    </span>
  );
}

const LOCALIZE_CORNERS = [
  { id: 'top-left', label: 'top left' },
  { id: 'top-right', label: 'top right' },
  { id: 'bottom-left', label: 'bottom left' },
  { id: 'bottom-right', label: 'bottom right' },
];

const LOCALIZE_IMAGE_SOURCES = [
  { id: 'computer', label: 'Computer', icon: 'devices' },
  { id: 'media-library', label: 'Media library', icon: 'cloud' },
  { id: 'free-media', label: 'Free media', icon: 'camera' },
];

/**
 * "Localize media" — a preview image with a field slot in each corner. Clicking a corner
 * opens the same `FieldPickerModal` every other Fields trigger in the builder uses, and the
 * chosen token is stamped into that corner. The centred button swaps the preview image.
 */
function LocalizeMediaField({ field, onValueChange }) {
  const [image, setImage] = useState(field.defaultImage || localizeSampleImage);
  // { [cornerId]: token } — the location detail stamped in that corner.
  const [corners, setCorners] = useState(field.defaultValue || {});
  const [pickerCorner, setPickerCorner] = useState(null);
  const [sourceMenuOpen, setSourceMenuOpen] = useState(false);
  const [mediaOpen, setMediaOpen] = useState(false);
  const cornerRefs = useRef({});
  const sourceMenuRef = useRef(null);

  useEffect(() => {
    if (!sourceMenuOpen) return undefined;
    const close = (e) => {
      if (!sourceMenuRef.current?.contains(e.target)) setSourceMenuOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [sourceMenuOpen]);

  const commit = (next) => {
    setCorners(next);
    onValueChange?.(field.id, next);
  };

  const handleSource = (id) => {
    setSourceMenuOpen(false);
    if (id === 'media-library') setMediaOpen(true);
    // 'computer' wants a real file input, and 'free-media' a stock-photo browser — neither
    // exists yet, so both are inert rather than pointed at the wrong picker.
  };

  return (
    <div className={styles.localizeField}>
      <FieldHeader
        label={field.label}
        required={field.required}
        helpText={field.helpText}
        showInfoIcon={field.showInfoIcon}
        infoText={field.infoText}
      />

      <div className={styles.localizeCanvas} style={{ backgroundImage: `url(${image})` }}>
        {LOCALIZE_CORNERS.map((corner) => {
          const token = corners[corner.id];
          return (
            <div key={corner.id} className={`${styles.localizeCorner} ${styles[`localizeCorner--${corner.id}`]}`}>
              {token ? (
                /* Same variable chip the tool's other field boxes use — blue {x} cell,
                   divider, name, clear cross. */
                <span className={styles.localizeToken}>
                  <DataType
                    type="variable"
                    label={token}
                    onRemove={() => {
                      const next = { ...corners };
                      delete next[corner.id];
                      commit(next);
                    }}
                  />
                </span>
              ) : (
                <button
                  type="button"
                  ref={(el) => { cornerRefs.current[corner.id] = el; }}
                  className={styles.localizeAddBtn}
                  aria-label={`Add a field to the ${corner.label}`}
                  onClick={() => setPickerCorner(corner.id)}
                >
                  <span className="material-symbols-outlined">add</span>
                </button>
              )}
            </div>
          );
        })}

        <div className={styles.localizeChangeWrap} ref={sourceMenuRef}>
          <button
            type="button"
            className={styles.localizeChangeBtn}
            onClick={() => setSourceMenuOpen((v) => !v)}
          >
            <span>Change preview image</span>
            <span className="material-symbols-outlined">expand_more</span>
          </button>
          {sourceMenuOpen && (
            <div className={styles.localizeSourceMenu}>
              {LOCALIZE_IMAGE_SOURCES.map((src) => (
                <button
                  key={src.id}
                  type="button"
                  className={styles.localizeSourceItem}
                  onClick={() => handleSource(src.id)}
                >
                  <span className="material-symbols-outlined">{src.icon}</span>
                  <span>{src.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {pickerCorner && (
        <FieldPickerModal
          onClose={() => setPickerCorner(null)}
          onSelectField={(value, name) => {
            commit({ ...corners, [pickerCorner]: name || value });
            setPickerCorner(null);
          }}
          anchorEl={cornerRefs.current[pickerCorner]}
          showTriggerFields
        />
      )}

      <MediaLibraryModal
        open={mediaOpen}
        onClose={() => setMediaOpen(false)}
        onDone={(selected) => {
          if (selected[0]?.thumbnail) setImage(selected[0].thumbnail);
          setMediaOpen(false);
        }}
      />
    </div>
  );
}

/**
 * "Templates" picker for the Select template action — the shared Aero `MultiSelect` with its
 * search box, Select all row, two-line rows and Apply footer, rather than a bespoke panel.
 * Picks stage inside the menu and commit on Apply.
 */
function TemplateMultiSelectField({ field, onValueChange }) {
  const templates = field.options?.length ? field.options : REVIEW_RESPONSE_TEMPLATES;
  const [selected, setSelected] = useState(field.defaultValue || []);

  const options = templates.map((t) => ({ value: t.id, label: t.title, description: t.body }));

  /** One pick reads by name; the whole list reads "All selected"; anything else counts. */
  const labelFor = (ids) => {
    if (ids.length === 0) return '';
    if (ids.length >= templates.length) return 'All selected';
    if (ids.length === 1) return templates.find((t) => t.id === ids[0])?.title ?? '1 template';
    return `${ids.length} templates`;
  };

  const commit = (ids) => {
    setSelected(ids);
    onValueChange?.(field.id, ids);
  };

  return (
    <div className={styles.tmsField}>
      <FieldHeader
        label={field.label}
        required={field.required}
        helpText={field.helpText}
        showInfoIcon={field.showInfoIcon}
        infoText={field.infoText}
      />
      <MultiSelect
        name={field.id}
        selected={selected}
        options={options}
        onChange={commit}
        onClear={() => commit([])}
        formatLabel={labelFor}
        menuHeaderLabel={labelFor}
        selectAllLabel="Select all"
        applyLabel="Apply"
        placeholder="Select"
        searchable
        portalMenu
      />
    </div>
  );
}

/** Read-only chips in a tinted box — fields the keywords are pulled from, not editable. */
function ReadOnlyChipsField({ field }) {
  return (
    <div className={styles.roChipsField}>
      <FieldHeader
        label={field.label}
        required={field.required}
        helpText={field.helpText}
        showInfoIcon={field.showInfoIcon}
        infoText={field.infoText}
      />
      <div className={styles.roChipsBox}>
        {/* Same shared Chip the library cards use, with their darker label override. */}
        {(field.options || []).map((chip) => (
          <Chip key={chip} label={chip} variant="neutral" className="!text-[#212121]" />
        ))}
      </div>
    </div>
  );
}

/**
 * Chip input with an `n/max` counter — typing a comma (or Enter) turns what you've typed
 * into a chip. Reuses the `tags` field's chip chrome so it matches the other tag inputs.
 */
function KeywordChipsField({ field, onValueChange }) {
  const max = field.maxItems ?? 5;
  const [chips, setChips] = useState(
    Array.isArray(field.defaultValue) ? field.defaultValue : [],
  );
  const [draft, setDraft] = useState('');
  const inputRef = useRef(null);
  const full = chips.length >= max;

  const commit = (next) => {
    setChips(next);
    onValueChange?.(field.id, next);
  };

  /** Adds every complete (comma-terminated) part, keeping the tail as the live draft. */
  const handleChange = (value) => {
    if (!value.includes(',')) {
      setDraft(full ? '' : value);
      return;
    }
    const parts = value.split(',');
    const tail = parts.pop();
    const additions = parts.map((p) => p.trim()).filter(Boolean);
    const next = [...chips];
    additions.forEach((word) => {
      if (next.length < max && !next.includes(word)) next.push(word);
    });
    commit(next);
    setDraft(next.length >= max ? '' : tail);
  };

  const commitDraft = () => {
    const word = draft.trim();
    if (!word || full || chips.includes(word)) { setDraft(''); return; }
    commit([...chips, word]);
    setDraft('');
  };

  return (
    <div className={styles.countedField}>
      <div className={styles.countedHeader}>
        <FieldHeader
          label={field.label}
          required={field.required}
          showInfoIcon={field.showInfoIcon}
          infoText={field.infoText}
        />
        <span className={styles.countedCount}>{chips.length}/{max}</span>
      </div>

      <div
        className={`${styles.tagsInput} ${styles.keywordChipsBox}`}
        onClick={() => inputRef.current?.focus()}
      >
        {chips.map((chip) => (
          <span key={chip} className={styles.tagChip}>
            {chip}
            <button
              type="button"
              className={styles.tagChipRemove}
              aria-label={`Remove ${chip}`}
              onClick={(e) => { e.stopPropagation(); commit(chips.filter((c) => c !== chip)); }}
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          className={styles.tagInputInner}
          value={draft}
          disabled={full && !draft}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={commitDraft}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.preventDefault(); commitDraft(); }
            // Backspace on an empty draft picks off the last chip.
            if (e.key === 'Backspace' && !draft && chips.length) commit(chips.slice(0, -1));
          }}
          placeholder={chips.length === 0 ? field.placeholder : ''}
        />
      </div>
    </div>
  );
}

const TICKET_CUSTOMER_FIELDS = [
  { id: 'firstName', label: 'First name' },
  { id: 'lastName', label: 'Last name' },
  { id: 'email', label: 'Email' },
  { id: 'phone', label: 'Phone' },
];

/**
 * "Create ticket in Birdeye" — Default fields + Apply escalation rules, each a
 * collapsible section. Rendered for `type: 'ticketBuilder'` fields.
 */
function TicketBuilderField({ field, onValueChange }) {
  const [openSections, setOpenSections] = useState({ defaults: true, escalation: false });
  const [assign, setAssign] = useState({ type: 'Users', values: [] });
  const [watchers, setWatchers] = useState({ type: 'Users', values: [] });
  const [description, setDescription] = useState({ chips: [], text: '' });
  const [customer, setCustomer] = useState(() =>
    Object.fromEntries(TICKET_CUSTOMER_FIELDS.map((f) => [f.id, { chips: [], text: '' }])),
  );
  const [conditions, setConditions] = useState([]);
  const [actions, setActions] = useState([]);
  const [actionMenuOpen, setActionMenuOpen] = useState(false);
  // Action id whose target picker is being edited. The row collapses to a
  // "2 roles" chip once done, so without this the first pick would collapse it
  // and a second value could never be added.
  const [targetEditing, setTargetEditing] = useState(null);
  const [actionMenuRect, setActionMenuRect] = useState(null);
  const targetRefs = useRef({});
  const actionMenuPanelRef = useRef(null);
  // { key } — which variable box the Fields picker is inserting into.
  const [picker, setPicker] = useState(null);
  const anchorRefs = useRef({});
  const actionMenuRef = useRef(null);
  const nextId = useRef(0);

  useEffect(() => {
    onValueChange?.(field.id, { assign, watchers, description, customer, conditions, actions });
    // Intentionally omit onValueChange — parent recreates it each render in embedded mode.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assign, watchers, description, customer, conditions, actions, field.id]);

  useEffect(() => {
    if (!actionMenuOpen) return undefined;
    function onDown(e) {
      // The menu is portaled to <body>, so check it as well as the trigger —
      // otherwise the close fires before an item's own onClick.
      if (actionMenuRef.current?.contains(e.target)) return;
      if (actionMenuPanelRef.current?.contains(e.target)) return;
      setActionMenuOpen(false);
    }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [actionMenuOpen]);

  // Anchor the portaled menu below the trigger. Being portaled at a high
  // z-index it paints over the Save footer rather than behind it, so it only
  // flips up if it would leave the viewport entirely.
  useEffect(() => {
    if (!actionMenuOpen) return undefined;
    function measure() {
      const el = actionMenuRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const openUp = r.bottom + 6 + TICKET_ACTION_MENU_H > window.innerHeight;
      setActionMenuRect({
        left: r.left,
        top: openUp ? r.top - 6 - TICKET_ACTION_MENU_H : r.bottom + 6,
        width: Math.max(r.width, 200),
      });
    }
    measure();
    window.addEventListener('scroll', measure, true);
    window.addEventListener('resize', measure);
    return () => {
      window.removeEventListener('scroll', measure, true);
      window.removeEventListener('resize', measure);
    };
  }, [actionMenuOpen]);

  // Clicking away settles the target picker into its chip.
  useEffect(() => {
    if (!targetEditing) return undefined;
    function onDown(e) {
      const el = targetRefs.current[targetEditing];
      if (el && !el.contains(e.target)) setTargetEditing(null);
    }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [targetEditing]);


  const toggleSection = (key) => setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));

  /** Every condition row needs a field and a value before another can be added. */
  // Each field / action type can only be used once, so the add actions also
  // switch off once every one of them is on the board.
  const usedActionTypes = actions.map((a) => a.type);
  const remainingActionTypes = TICKET_ACTION_TYPES.filter((t) => !usedActionTypes.includes(t.id));
  const canAddCondition = conditions.every((c) => c.field && c.value)
    && conditions.length < TICKET_CONDITION_FIELDS.length;
  const canAddAction = actions.every((a) => (a.type === 'status' ? a.status : a.values?.length))
    && remainingActionTypes.length > 0;

  function insertVariable(name) {
    const key = picker?.key;
    if (!key) return;
    if (key === 'description') {
      setDescription((prev) => (prev.chips.includes(name) ? prev : { ...prev, chips: [...prev.chips, name] }));
    } else {
      setCustomer((prev) => (prev[key].chips.includes(name)
        ? prev
        : { ...prev, [key]: { ...prev[key], chips: [...prev[key].chips, name] } }));
    }
    setPicker(null);
  }

  /** Bordered box holding inserted variable chips, free text, and the {x} trigger. */
  const variableBox = (key, value, setValue, { multiline = false, placeholder = '' } = {}) => (
    <div
      ref={(el) => { anchorRefs.current[key] = el; }}
      className={`${styles.ticketVarBox}${multiline ? ` ${styles.ticketVarBoxMultiline}` : ''}`}
    >
      <div className={styles.ticketVarChips}>
        {value.chips.map((chip) => (
          <DataType
            key={chip}
            type="variable"
            label={chip}
            onRemove={() => setValue({ ...value, chips: value.chips.filter((c) => c !== chip) })}
          />
        ))}
        {multiline ? (
          <textarea
            className={styles.ticketVarTextarea}
            value={value.text}
            placeholder={placeholder}
            onChange={(e) => setValue({ ...value, text: e.target.value })}
          />
        ) : (
          <input
            type="text"
            className={styles.ticketVarInput}
            value={value.text}
            placeholder={value.chips.length === 0 ? placeholder : ''}
            onChange={(e) => setValue({ ...value, text: e.target.value })}
          />
        )}
      </div>
      <button
        type="button"
        className={`${styles.ticketVarBtn}${multiline ? ` ${styles.ticketVarBtnBottom}` : ''}`}
        aria-label="Insert field"
        onClick={() => setPicker({ key })}
      >
        <VariableIcon />
      </button>
    </div>
  );

  /** "Assign ticket to  Users ▾" + the matching select below it. */
  const assigneeRow = (label, state, setState) => (
    <div className={styles.fieldWrap}>
      <div className={styles.ticketInlineLabelRow}>
        <span className={styles.fieldLabel}>{label}</span>
        <select
          className={styles.ticketInlineSelect}
          value={state.type}
          onChange={(e) => setState({ type: e.target.value, values: [] })}
        >
          {TICKET_ASSIGNEE_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
        <span className={`material-symbols-outlined ${styles.ticketInlineChevron}`}>arrow_drop_down</span>
      </div>
      <MultiSelect
        name={`${field.id}-${label}`}
        selected={state.values || []}
        options={(state.type === 'Roles' ? TICKET_ROLES : TICKET_USERS)
          .map((o) => ({ value: o, label: o }))}
        placeholder={state.type === 'Roles' ? 'Select roles' : 'Select users'}
        onChange={(vals) => setState({ ...state, values: vals })}
      />
    </div>
  );

  return (
    <div className={styles.ticketWrap}>
      {/* ── Default fields ── */}
      <div className={styles.ticketSection}>
        <button type="button" className={styles.ticketSectionHeader} onClick={() => toggleSection('defaults')}>
          <span className={styles.ticketSectionTitle}>
            Default fields
          </span>
          <span className="material-symbols-outlined">
            {openSections.defaults ? 'keyboard_arrow_up' : 'keyboard_arrow_down'}
          </span>
        </button>
        {openSections.defaults && (
          <div className={styles.ticketSectionBody}>
            {assigneeRow('Assign ticket to', assign, setAssign)}
            {assigneeRow('Assign watchers to', watchers, setWatchers)}

            <div className={styles.fieldWrap}>
              <span className={styles.fieldLabel}>
                Ticket description<span className={styles.required}> *</span>
              </span>
              {variableBox('description', description, setDescription, { multiline: true })}
            </div>

            <div className={styles.ticketGroupLabelRow}>
              <span className={styles.ticketGroupLabel}>Customer information</span>
            </div>

            {TICKET_CUSTOMER_FIELDS.map((cf) => (
              <div key={cf.id} className={styles.fieldWrap}>
                <span className={styles.fieldLabel}>{cf.label}</span>
                {variableBox(
                  cf.id,
                  customer[cf.id],
                  (next) => setCustomer((prev) => ({ ...prev, [cf.id]: next })),
                  { placeholder: cf.label },
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Apply escalation rules ── */}
      <div className={styles.ticketSection}>
        <button type="button" className={styles.ticketSectionHeader} onClick={() => toggleSection('escalation')}>
          <span className={styles.ticketSectionTitle}>
            Apply escalation rules
          </span>
          <span className="material-symbols-outlined">
            {openSections.escalation ? 'keyboard_arrow_up' : 'keyboard_arrow_down'}
          </span>
        </button>
        {openSections.escalation && (
          <div className={styles.ticketSectionBody}>
            {/* Conditions */}
            <div className={styles.ticketRuleCard}>
              <span className={styles.ticketRuleCardTitle}>Conditions</span>
              {conditions.map((cond, i) => {
                const values = TICKET_CONDITION_VALUES[cond.field] || [];
                // A field already used by another row isn't offered again.
                const takenFields = conditions.filter((c) => c.id !== cond.id).map((c) => c.field);
                const fieldOptions = TICKET_CONDITION_FIELDS.filter((f) => !takenFields.includes(f.value));
                const update = (patch) => setConditions((prev) =>
                  prev.map((c) => (c.id === cond.id ? { ...c, ...patch } : c)));
                return (
                  <div key={cond.id} className={styles.ticketCondBlock}>
                    {/* Chip once chosen, picker while empty — the cross clears
                        a slot back to its picker. */}
                    <div className={styles.ticketCondHead}>
                      <span className={styles.ticketCondJoin}>{i === 0 ? 'IF' : 'AND'}</span>
                      <button
                        type="button"
                        className={styles.ticketRowDelete}
                        aria-label="Remove condition"
                        onClick={() => setConditions((prev) => prev.filter((c) => c.id !== cond.id))}
                      >
                        <span className="material-symbols-outlined">delete</span>
                      </button>
                    </div>
                    {cond.field ? (
                      <TicketChip
                        label={cond.field}
                        onClear={() => update({ field: '', value: '', exclude: [] })}
                      />
                    ) : (
                      <div className={styles.ticketCondSelect}>
                        <SingleSelect
                          name={`${cond.id}-field`}
                          selected=""
                          options={fieldOptions}
                          placeholder="Select"
                          onChange={(opt) => update({ field: opt.value, value: '', exclude: [] })}
                        />
                      </div>
                    )}
                    {cond.field && <div className={styles.ticketCondStatic}>is</div>}
                    {cond.field && (cond.value ? (
                      <TicketChip label={cond.value} onClear={() => update({ value: '' })} />
                    ) : (
                      <div className={styles.ticketCondSelect}>
                        <SingleSelect
                          name={`${cond.id}-value`}
                          selected=""
                          options={values.map((v) => ({ value: v, label: v }))}
                          placeholder="Select"
                          onChange={(opt) => update({ value: opt.value })}
                        />
                      </div>
                    ))}
                    {/* Exclude stays a dropdown so several days stay tickable. */}
                    {cond.field === TICKET_EXCLUDE_FIELD && (
                      <div className={styles.ticketExcludeRow}>
                        <span className={styles.ticketExcludeLabel}>Exclude</span>
                        <div className={styles.ticketExcludeSelect}>
                          <MultiSelect
                            name={`${cond.id}-exclude`}
                            selected={cond.exclude || []}
                            options={TICKET_WEEKDAYS}
                            placeholder="Select days"
                            formatLabel={ticketOxfordList}
                            onChange={(vals) => update({ exclude: vals })}
                            onClear={() => update({ exclude: [] })}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              <button
                type="button"
                className={`${styles.ticketAddBtn}${canAddCondition ? '' : ` ${styles.ticketAddBtnDisabled}`}`}
                disabled={!canAddCondition}
                onClick={() => setConditions((prev) => [
                  ...prev,
                  { id: `cond-${nextId.current++}`, field: '', value: '', exclude: [] },
                ])}
              >
                <span className="material-symbols-outlined">add_circle</span>
                <span className={styles.ticketAddBtnLabel}>Add condition</span>
              </button>
            </div>

            {/* Actions */}
            <div className={styles.ticketRuleCard}>
              <span className={styles.ticketRuleCardTitle}>Actions</span>
              {actions.map((act) => {
                const meta = TICKET_ACTION_TYPES.find((t) => t.id === act.type);
                const update = (patch) => setActions((prev) =>
                  prev.map((a) => (a.id === act.id ? { ...a, ...patch } : a)));
                const people = (act.valueType === 'Roles' ? TICKET_ROLES : TICKET_USERS)
                  .map((o) => ({ value: o, label: o }));
                return (
                  <div key={act.id} className={styles.ticketActionBlock}>
                    <div className={styles.ticketCondHead}>
                      <span className={styles.ticketActionLabel}>{meta.rowLabel}</span>
                      <button
                        type="button"
                        className={styles.ticketRowDelete}
                        aria-label={`Remove ${meta.rowLabel}`}
                        onClick={() => setActions((prev) => prev.filter((a) => a.id !== act.id))}
                      >
                        <span className="material-symbols-outlined">delete</span>
                      </button>
                    </div>
                    {act.type === 'status' ? (
                        act.status ? (
                          <TicketChip label={act.status} onClear={() => update({ status: '' })} />
                        ) : (
                          <div className={styles.ticketCondSelect}>
                            <SingleSelect
                              name={`${act.id}-status`}
                              selected=""
                              options={TICKET_CONDITION_VALUES.Status.map((v) => ({ value: v, label: v }))}
                              placeholder="Select"
                              onChange={(opt) => update({ status: opt.value })}
                            />
                          </div>
                        )
                      ) : act.valueType ? (
                        <TicketChip
                          label={act.valueType}
                          onClear={() => update({ valueType: '', values: [] })}
                        />
                      ) : (
                        <div className={styles.ticketCondSelect}>
                          <SingleSelect
                            name={`${act.id}-type`}
                            selected=""
                            options={TICKET_ASSIGNEE_TYPES}
                            placeholder="Select"
                            onChange={(opt) => update({ valueType: opt.value, values: [] })}
                          />
                        </div>
                      )}
                    {/* Target sits on its own full-width row, cross but no trash. */}
                    {act.type !== 'status' && act.valueType && (
                      <div
                        className={styles.ticketActionSub}
                        ref={(el) => { targetRefs.current[act.id] = el; }}
                        onMouseDown={() => setTargetEditing(act.id)}
                      >
                        {act.values?.length && targetEditing !== act.id ? (
                          <TicketChip
                            label={ticketCountLabel(act.valueType.toLowerCase())(act.values)}
                            onClear={() => update({ values: [] })}
                          />
                        ) : (
                          <MultiSelect
                            name={`${act.id}-target`}
                            selected={act.values || []}
                            options={people}
                            placeholder={act.type === 'assignee'
                              ? (act.valueType === 'Roles' ? 'Select upto 10 roles' : 'Select upto 10 users')
                              : (act.valueType === 'Roles' ? 'Select roles' : 'Select users')}
                            // Same wording open or settled, so the label doesn't
                            // change from "2 selected" to "2 users" on blur.
                            formatLabel={ticketCountLabel(act.valueType.toLowerCase())}
                            // "upto 10" in the placeholder is a real cap on the assignee action.
                            onChange={(vals) => {
                              if (act.type === 'assignee' && vals.length > TICKET_ASSIGNEE_MAX) return;
                              update({ values: vals });
                            }}
                          />
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
              <div className={styles.ticketAddWrap} ref={actionMenuRef}>
                <button
                  type="button"
                  className={`${styles.ticketAddBtn}${canAddAction ? '' : ` ${styles.ticketAddBtnDisabled}`}`}
                  disabled={!canAddAction}
                  onClick={() => setActionMenuOpen((v) => !v)}
                >
                  <span className="material-symbols-outlined">add_circle</span>
                  <span className={styles.ticketAddBtnLabel}>Add action</span>
                </button>
                {/* Portaled: the RHS panel body scrolls, which clipped this menu
                    and pushed it behind the Save footer. */}
                {actionMenuOpen && actionMenuRect && createPortal(
                  <div
                    ref={actionMenuPanelRef}
                    className={styles.ticketActionMenu}
                    style={{
                      left: actionMenuRect.left,
                      top: actionMenuRect.top,
                      minWidth: actionMenuRect.width,
                    }}
                  >
                    {remainingActionTypes.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        className={styles.ticketActionMenuItem}
                        onClick={() => {
                          setActions((prev) => [...prev, {
                            id: `act-${nextId.current++}`,
                            type: t.id,
                            valueType: t.id === 'notify' ? 'Roles' : 'Users',
                            values: [],
                            status: '',
                          }]);
                          setActionMenuOpen(false);
                        }}
                      >
                        {t.menuLabel}
                      </button>
                    ))}
                  </div>,
                  document.body,
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {picker && (
        <FieldPickerModal
          onClose={() => setPicker(null)}
          onSelectField={(value, name) => insertVariable(name || value)}
          anchorEl={anchorRefs.current[picker.key]}
          // No `placement` → the default flush-docked full-height position every
          // other Fields trigger in the builder uses.
          showTriggerFields
        />
      )}
    </div>
  );
}

/* ─── Competitor list field ─────────────────────────────────────────────── */

/** Tinted avatar pairs; picked by name so a competitor keeps its color. */
const COMPETITOR_TINTS = [
  { bg: '#e8f5e9', fg: '#2e7d32' },
  { bg: '#e3f2fd', fg: '#1565c0' },
  { bg: '#fff3e0', fg: '#ef6c00' },
  { bg: '#f3e5f5', fg: '#7b1fa2' },
  { bg: '#fce4ec', fg: '#c2185b' },
];

function competitorTint(name) {
  const sum = [...(name || '?')].reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return COMPETITOR_TINTS[sum % COMPETITOR_TINTS.length];
}

const COMPETITOR_LIMIT_MSG = 'Only 5 competitors can be added. Please remove one to add another';

/**
 * "Track keywords from competitor domains" — a capped list of name + URL rows
 * with hover edit/delete, plus an inline add/edit form. Rendered for
 * `type: 'competitorList'` fields.
 */
function CompetitorListField({ field, onValueChange }) {
  const maxItems = field.maxItems ?? 5;
  const [competitors, setCompetitors] = useState(() =>
    (Array.isArray(field.defaultValue) ? field.defaultValue : []).map((c) => ({ ...c })),
  );
  // null = no form; otherwise { mode: 'add' | 'edit', id?, name, url }
  const [form, setForm] = useState(null);
  // Competitor pending delete confirmation.
  const [pendingDelete, setPendingDelete] = useState(null);
  const nextId = useRef(0);

  useEffect(() => {
    setCompetitors((Array.isArray(field.defaultValue) ? field.defaultValue : []).map((c) => ({ ...c })));
    setForm(null);
  }, [field.id, field.defaultValue]);

  useEffect(() => {
    onValueChange?.(field.id, competitors);
    // Intentionally omit onValueChange — parent recreates it each render in embedded mode.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [competitors, field.id]);

  const atLimit = competitors.length >= maxItems;
  const canSubmit = Boolean(form?.name.trim() && form?.url.trim());
  const isEdit = form?.mode === 'edit';

  function submitForm() {
    if (!canSubmit) return;
    const name = form.name.trim();
    const url = form.url.trim();
    if (isEdit) {
      setCompetitors((prev) => prev.map((c) => (c.id === form.id ? { ...c, name, url } : c)));
    } else {
      setCompetitors((prev) => [...prev, { id: `comp-new-${nextId.current++}`, name, url }]);
    }
    setForm(null);
  }

  // Shared by both entry points: an edit form swaps in for its own row, while
  // the add form sits below the list.
  const formCard = form ? (
    <div className={styles.compForm}>
      <span className={styles.compFormTitle}>{isEdit ? 'Edit competitor' : 'Add competitor'}</span>
      <input
        type="text"
        className={styles.compFormInput}
        placeholder="Enter competitor name"
        value={form.name}
        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
        autoFocus
      />
      <input
        type="text"
        className={styles.compFormInput}
        placeholder="Enter URL"
        value={form.url}
        onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); submitForm(); } }}
      />
      <div className={styles.compFormActions}>
        <button type="button" className={styles.compFormCancel} onClick={() => setForm(null)}>
          Cancel
        </button>
        <button
          type="button"
          className={styles.compFormSubmit}
          disabled={!canSubmit}
          onClick={submitForm}
        >
          {isEdit ? 'Save' : 'Add'}
        </button>
      </div>
    </div>
  ) : null;

  return (
    <div className={styles.fieldWrap}>
      <span className={styles.fieldLabel}>{field.label}</span>

      <div className={styles.compList}>
        {competitors.map((comp) => {
          // Editing swaps this row's read view for the form, in place.
          if (isEdit && form.id === comp.id) {
            return <React.Fragment key={comp.id}>{formCard}</React.Fragment>;
          }
          const tint = competitorTint(comp.name);
          return (
            <div key={comp.id} className={styles.compRow}>
              <span
                className={styles.compAvatar}
                style={{ background: tint.bg, color: tint.fg }}
                aria-hidden
              >
                {(comp.name || '?').trim().charAt(0).toUpperCase()}
              </span>
              <div className={styles.compInfo}>
                <Tooltip content={comp.name} variant="brief" side="top">
                  <span className={styles.compName}>{comp.name}</span>
                </Tooltip>
                <span className={styles.compUrl}>{comp.url}</span>
              </div>
              <div className={styles.compActions}>
                <Tooltip content="Edit" variant="brief" side="top">
                  <button
                    type="button"
                    className={styles.compActionBtn}
                    aria-label={`Edit ${comp.name}`}
                    onClick={() => setForm({ mode: 'edit', id: comp.id, name: comp.name, url: comp.url })}
                  >
                    <span className="material-symbols-outlined">edit</span>
                  </button>
                </Tooltip>
                <Tooltip content="Delete" variant="brief" side="top">
                  <button
                    type="button"
                    className={styles.compActionBtn}
                    aria-label={`Delete ${comp.name}`}
                    onClick={() => setPendingDelete(comp)}
                  >
                    <span className="material-symbols-outlined">delete</span>
                  </button>
                </Tooltip>
              </div>
            </div>
          );
        })}
      </div>

      {form?.mode === 'add' ? formCard : (
        // Tooltip listens on its wrapper, so it still fires over a disabled button.
        <Tooltip content={COMPETITOR_LIMIT_MSG} variant="detail" side="top" disabled={!atLimit}>
          <button
            type="button"
            className={`${styles.compAddBtn}${atLimit ? ` ${styles.compAddBtnDisabled}` : ''}`}
            disabled={atLimit}
            onClick={() => setForm({ mode: 'add', name: '', url: '' })}
          >
            <span className="material-symbols-outlined">add_circle</span>
            <span className={styles.compAddBtnLabel}>Add competitor</span>
          </button>
        </Tooltip>
      )}

      {/* Reuses AgentBuilder's global `ab-confirm-dialog` chrome (same as
          "Delete agent?") so destructive confirms look the same everywhere. */}
      {pendingDelete && createPortal(
        <div
          className="ab-confirm-overlay"
          onClick={(e) => { if (e.target === e.currentTarget) setPendingDelete(null); }}
        >
          <div
            className="ab-confirm-dialog"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="comp-delete-confirm-title"
          >
            <div className="ab-confirm-dialog__header">
              <h2 id="comp-delete-confirm-title" className="ab-confirm-dialog__title">
                Delete competitor?
              </h2>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setPendingDelete(null)}
                className="ab-confirm-dialog__close"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <p className="ab-confirm-dialog__body">
              Are you sure you want to delete <strong>{pendingDelete.name}</strong>?
            </p>
            <div className="ab-confirm-dialog__footer">
              <button
                type="button"
                className="ab-confirm-dialog__cancel"
                onClick={() => setPendingDelete(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="ab-confirm-dialog__primary ab-confirm-dialog__primary--danger"
                onClick={() => {
                  setCompetitors((prev) => prev.filter((c) => c.id !== pendingDelete.id));
                  setForm((f) => (f?.id === pendingDelete.id ? null : f));
                  setPendingDelete(null);
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}

/** Contact-preference permission states — same set for every channel/category. */
const PREF_NO_CHANGE = 'No change';
const PREF_OPTIONS = [
  { value: PREF_NO_CHANGE, label: 'No change' },
  { value: 'Enable', label: 'Enable' },
  { value: 'Disable', label: 'Disable' },
];

function InteractiveField({ field, onValueChange }) {
  const [textValue, setTextValue] = useState('');
  const [radioValue, setRadioValue] = useState('');
  const [checkValues, setCheckValues] = useState([]);
  const [selectValue, setSelectValue] = useState('');
  const [selectValueB, setSelectValueB] = useState('');
  const [toggled, setToggled] = useState(false);
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [abChecked, setAbChecked] = useState(true);
  const [variantValues, setVariantValues] = useState({});
  const [dateSelectVal, setDateSelectVal] = useState('');
  const [fieldModalOpen, setFieldModalOpen] = useState(false);
  const [bodySegments, setBodySegments] = useState(() => (
    Array.isArray(field.segments) ? field.segments.map((s) => ({ ...s })) : null
  ));
  const [selectedTags, setSelectedTags] = useState([]);
  const [tagQuery, setTagQuery] = useState('');
  const [tagDropdownOpen, setTagDropdownOpen] = useState(false);
  // null = closed; otherwise { mode: 'add' | 'edit', id?, name, description }
  const [tagModal, setTagModal] = useState(null);
  const [tagMenuRect, setTagMenuRect] = useState(null);
  const [prefChannelOn, setPrefChannelOn] = useState(false);
  const [prefValues, setPrefValues] = useState({});
  const fieldsBtnRef = useRef(null);
  const tagSelectRef = useRef(null);
  const tagMenuRef = useRef(null);
  const tagInputRef = useRef(null);

  useEffect(() => {
    if (['text', 'number', 'date', 'textarea', 'variable'].includes(field.type)) {
      setTextValue(typeof field.defaultValue === 'string' ? field.defaultValue : '');
    }
    if (field.type === 'radio') {
      setRadioValue(field.defaultValue || field.options?.[0] || '');
    }
    if (field.type === 'checkbox') {
      setCheckValues(Array.isArray(field.defaultValue) ? [...field.defaultValue] : []);
    }
    if (field.type === 'select' || field.type === 'dropdown') {
      setSelectValue(field.defaultValue || '');
    }
    if (field.type === 'selectRow') {
      setSelectValue(field.selects?.[0]?.defaultValue || '');
      setSelectValueB(field.selects?.[1]?.defaultValue || '');
    }
    if (field.type === 'toggle') {
      setToggled(Boolean(field.defaultValue));
    }
    if (field.type === 'abSection') {
      setAbChecked(field.defaultChecked !== false);
    }
    if (field.type === 'distribution') {
      setVariantValues(Object.fromEntries((field.variants || []).map(v => [v.id, v.defaultValue ?? 50])));
    }
    if (field.type === 'dateSelect') {
      setDateSelectVal(field.defaultValue || (field.options?.[0] ?? ''));
    }
    if (field.type === 'tags') {
      setTags(Array.isArray(field.defaultValue) ? [...field.defaultValue] : []);
    }
    if (field.type === 'tag-select') {
      const defaults = Array.isArray(field.defaultValue) ? field.defaultValue : [];
      setSelectedTags(defaults.map((t) => (typeof t === 'string' ? (findTagByName(t) || { id: t, name: t, description: '' }) : t)));
    }
    if (Array.isArray(field.segments)) {
      setBodySegments(field.segments.map((s) => ({ ...s })));
    }
  }, [field.id, field.defaultValue, field.type, field.options, field.defaultChecked, field.segments]);

  useEffect(() => {
    if (field.type === 'checkbox') {
      onValueChange?.(field.id, checkValues);
    }
    // Intentionally omit onValueChange — parent recreates it each render in embedded mode.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkValues, field.id, field.type]);

  useEffect(() => {
    if (field.type === 'tags') {
      onValueChange?.(field.id, tags);
    }
    // Intentionally omit onValueChange — parent recreates it each render in embedded mode.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tags, field.id, field.type]);

  useEffect(() => {
    if (field.type === 'tag-select') {
      onValueChange?.(field.id, selectedTags.map((t) => t.name));
    }
    // Intentionally omit onValueChange — parent recreates it each render in embedded mode.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTags, field.id, field.type]);

  useEffect(() => {
    if (field.type !== 'prefChannel') return;
    if (!prefChannelOn) {
      onValueChange?.(field.id, null);
      return;
    }
    onValueChange?.(field.id, Object.fromEntries(
      (field.prefKeys || []).map((p) => [p.label, prefValues[p.id] ?? PREF_NO_CHANGE]),
    ));
    // Intentionally omit onValueChange — parent recreates it each render in embedded mode.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefChannelOn, prefValues, field.id, field.type]);

  useEffect(() => {
    if (field.type !== 'tag-select' || !tagDropdownOpen) return undefined;
    function handlePointerDown(e) {
      // The menu is portaled to <body>, so a click on an option is NOT inside
      // tagSelectRef — check the menu too or the close fires first and swallows
      // the option's own onClick.
      if (tagSelectRef.current?.contains(e.target)) return;
      if (tagMenuRef.current?.contains(e.target)) return;
      setTagDropdownOpen(false);
    }
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [field.type, tagDropdownOpen]);

  // Anchor the portaled menu to the input; the RHS panel scrolls, so re-measure.
  useEffect(() => {
    if (field.type !== 'tag-select' || !tagDropdownOpen) return undefined;
    function measure() {
      const el = tagSelectRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      setTagMenuRect({ left: r.left, top: r.bottom + 4, width: r.width });
    }
    measure();
    window.addEventListener('scroll', measure, true);
    window.addEventListener('resize', measure);
    return () => {
      window.removeEventListener('scroll', measure, true);
      window.removeEventListener('resize', measure);
    };
  }, [field.type, tagDropdownOpen, selectedTags.length]);

  const label = field.label || 'Untitled field';
  const required = field.required;

  switch (field.type) {
    case 'text':
    case 'number':
    case 'date':
      if (field.icon) {
        return (
          <div className={styles.fieldWrap}>
            <span className={styles.fieldLabel}>
              {label}{required && <span className={styles.required}> *</span>}
            </span>
            <div className={styles.iconInputRow}>
              <span className={`material-symbols-outlined ${styles.iconInputLeading}`}>{field.icon}</span>
              <input
                name={`view_${field.id}`}
                type={field.type}
                className={styles.iconInput}
                placeholder={field.placeholder || ''}
                value={textValue}
                onChange={(e) => setTextValue(e.target.value)}
              />
            </div>
          </div>
        );
      }
      if (field.suffix || field.width === 'half') {
        return (
          <div className={styles.fieldWrap}>
            <span className={styles.fieldLabel}>
              {label}{required && <span className={styles.required}> *</span>}
            </span>
            <div className={styles.inputSuffixRow}>
              <input
                name={`view_${field.id}`}
                type={field.type}
                className={`${styles.suffixInput}${field.width === 'half' ? ` ${styles.suffixInputHalf}` : ''}`}
                placeholder={field.placeholder || ''}
                value={textValue}
                onChange={(e) => setTextValue(e.target.value)}
              />
              {field.suffix && (
                <span className={styles.fieldSuffix}>{field.suffix}</span>
              )}
            </div>
          </div>
        );
      }
      if (field.helpText || field.showVariableToolbar) {
        const handleFieldSelect = (fieldValue) => {
          setTextValue((prev) => {
            const base = prev || '';
            const sep = !base || /\s$/.test(base) ? '' : ' ';
            const next = `${base}${sep}{{${fieldValue}}}`;
            onValueChange?.(field.id, next);
            return next;
          });
        };
        return (
          <div className={styles.fieldWrap}>
            <FieldHeader
              label={label}
              required={required}
              helpText={field.helpText}
              showInfoIcon={field.showInfoIcon}
              infoText={field.infoText}
            />
            <div className={field.showVariableToolbar ? styles.promptBox : undefined}>
              <div className={field.showVariableToolbar ? styles.variableTextRow : undefined}>
                <input
                  name={`view_${field.id}`}
                  type={field.type === 'number' || field.type === 'date' ? field.type : 'text'}
                  className={field.showVariableToolbar ? styles.variableTextInput : styles.selectInput}
                  placeholder={field.placeholder || ''}
                  value={textValue}
                  onChange={(e) => {
                    setTextValue(e.target.value);
                    onValueChange?.(field.id, e.target.value);
                  }}
                />
                {field.showVariableToolbar && (
                  <div ref={fieldsBtnRef} className={styles.variableTextToolbar}>
                    <ToolbarButton
                      icon={<VariableIcon />}
                      tooltip="Fields"
                      active={fieldModalOpen}
                      onClick={() => setFieldModalOpen(true)}
                    />
                  </div>
                )}
              </div>
            </div>
            {field.showVariableToolbar && fieldModalOpen && (
              <FieldPickerModal
                onClose={() => setFieldModalOpen(false)}
                onSelectField={handleFieldSelect}
                anchorEl={fieldsBtnRef.current}
                showTriggerFields
                insertedText={textValue}
              />
            )}
          </div>
        );
      }
      return (
        <div className={styles.fieldWrap}>
          <FormInput
            name={`view_${field.id}`}
            type={field.type}
            label={label}
            placeholder={field.placeholder || ''}
            value={textValue}
            onChange={(e) => setTextValue(e.target.value)}
            required={required}
          />
        </div>
      );

    case 'textarea':
      if (field.showVariableToolbar) {
        const segments = bodySegments;
        const insertedText = segments
          ? segments.map((s) => (s.type === 'chip' ? `{{${s.value}}}` : s.value)).join('')
          : textValue;
        const handleFieldSelect = (fieldValue) => {
          // Keep the picker open; close only via X or the Fields icon.
          if (segments) {
            setBodySegments((prev) => {
              const next = [...(prev || [])];
              const last = next[next.length - 1];
              if (last?.type === 'chip') {
                next.push({ type: 'text', value: ' ' });
              } else if (last?.type === 'text' && last.value && !/\s$/.test(last.value)) {
                next[next.length - 1] = { ...last, value: `${last.value} ` };
              }
              next.push({ type: 'chip', value: fieldValue });
              return next;
            });
            return;
          }
          setTextValue((prev) => {
            const base = prev || '';
            const sep = !base || /\s$/.test(base) ? '' : ' ';
            const next = `${base}${sep}{{${fieldValue}}}`;
            onValueChange?.(field.id, next);
            return next;
          });
        };
        return (
          <div className={styles.fieldWrap}>
            <FieldLabel label={label} required={required} showInfoIcon={field.showInfoIcon} />
            <div className={styles.promptBox}>
              {segments ? (
                <div className={styles.promptRichBody}>
                  {segments.map((seg, i) => (
                    seg.type === 'chip' ? (
                      <VariableChip
                        key={`${seg.value}-${i}`}
                        value={seg.value}
                        type="variable"
                        readOnly
                      />
                    ) : (
                      <span key={`t-${i}`} className={styles.promptRichText}>
                        {seg.value}
                      </span>
                    )
                  ))}
                </div>
              ) : (
                <textarea
                  name={`view_${field.id}`}
                  className={styles.promptTextarea}
                  placeholder={field.placeholder || ''}
                  value={textValue}
                  onChange={(e) => setTextValue(e.target.value)}
                  rows={field.rows || 5}
                />
              )}
              <div className={styles.promptToolbar}>
                <div ref={fieldsBtnRef}>
                  <ToolbarButton
                    icon={<VariableIcon />}
                    tooltip="Fields"
                    active={fieldModalOpen}
                    onClick={() => setFieldModalOpen(true)}
                  />
                </div>
              </div>
            </div>
            {fieldModalOpen && (
              <FieldPickerModal
                onClose={() => setFieldModalOpen(false)}
                onSelectField={handleFieldSelect}
                anchorEl={fieldsBtnRef.current}
                showTriggerFields
                insertedText={insertedText}
              />
            )}
          </div>
        );
      }
      return (
        <div className={styles.fieldWrap}>
          <TextArea
            name={`view_${field.id}`}
            label={label}
            placeholder={field.placeholder || ''}
            value={textValue}
            onChange={(e) => setTextValue(e.target.value)}
            noFloatingLabel
            required={required}
            rows={field.rows}
          />
        </div>
      );

    case 'select':
      return (
        <div className={styles.fieldWrap}>
          {(field.helpText || field.showInfoIcon) ? (
            <FieldHeader
              label={label}
              required={required}
              helpText={field.helpText}
              showInfoIcon={field.showInfoIcon}
              infoText={field.infoText}
            />
          ) : (
            <FieldLabel label={label} required={required} showInfoIcon={field.showInfoIcon} infoText={field.infoText} />
          )}
          <div className={styles.selectWrap}>
            <select
              className={styles.selectInput}
              value={selectValue}
              onChange={(e) => {
                setSelectValue(e.target.value);
                onValueChange?.(field.id, e.target.value);
              }}
            >
              <option value="">{field.placeholder || 'Select'}</option>
              {(field.options || []).map((rawOpt) => {
                const optValue = typeof rawOpt === 'string' ? rawOpt : rawOpt?.value;
                const optLabel = typeof rawOpt === 'string' ? rawOpt : (rawOpt?.label ?? rawOpt?.value);
                if (optValue == null) return null;
                return (
                  <option key={String(optValue)} value={optValue}>{optLabel}</option>
                );
              })}
            </select>
            <span className={`material-symbols-outlined ${styles.selectChevron}`}>expand_more</span>
          </div>
        </div>
      );

    case 'selectRow':
      return (
        <div className={styles.fieldWrap}>
          <FieldLabel label={label} required={required} />
          <div className={styles.conditionalFieldsRow}>
            <div className={styles.selectWrap}>
              <select
                className={styles.selectInput}
                value={selectValue}
                onChange={(e) => setSelectValue(e.target.value)}
              >
                {(field.selects?.[0]?.options || []).map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
              <span className={`material-symbols-outlined ${styles.selectChevron}`}>expand_more</span>
            </div>
            <div className={styles.selectWrap}>
              <select
                className={styles.selectInput}
                value={selectValueB}
                onChange={(e) => setSelectValueB(e.target.value)}
              >
                {(field.selects?.[1]?.options || []).map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
              <span className={`material-symbols-outlined ${styles.selectChevron}`}>expand_more</span>
            </div>
          </div>
        </div>
      );

    case 'dropdown':
      return (
        <div className={styles.fieldWrap}>
          <span className={styles.fieldLabel}>
            {label}{required && <span className={styles.required}> *</span>}
          </span>
          <Select
            value={selectValue}
            onChange={(e, v) => setSelectValue(v)}
            placeHolder="Select..."
          >
            {(field.options || []).map((rawOpt) => {
              const optValue = typeof rawOpt === 'string' ? rawOpt : rawOpt?.value;
              const optLabel = typeof rawOpt === 'string' ? rawOpt : (rawOpt?.label ?? rawOpt?.value);
              if (optValue == null) return null;
              return (
                <SelectItem key={String(optValue)} value={optValue}>{optLabel}</SelectItem>
              );
            })}
          </Select>
        </div>
      );

    case 'radio': {
      const conditionalForValue = field.conditionalFieldsMap?.[radioValue];
      return (
        <div className={styles.fieldWrap}>
          <FieldLabel label={label} required={required} showInfoIcon={field.showInfoIcon} />
          <div className={field.layout === 'row' ? styles.checkboxRow : styles.optionGroup}>
            {field.options.map((rawOpt) => {
              const opt = typeof rawOpt === 'string' ? rawOpt : rawOpt.value;
              const optLabel = typeof rawOpt === 'string' ? rawOpt : (rawOpt.label ?? rawOpt.value);
              const optDisabled = typeof rawOpt === 'object' && rawOpt.disabled;
              const optInfoIcon = typeof rawOpt === 'object' && rawOpt.infoIcon;
              return (
                <label key={opt} className={styles.optionLabel} style={optDisabled ? { opacity: 0.5, cursor: 'not-allowed', width: field.layout === 'row' ? 'auto' : undefined } : (field.layout === 'row' ? { width: 'auto' } : undefined)}>
                  <input
                    type="radio"
                    name={`view_radio_${field.id}`}
                    value={opt}
                    checked={radioValue === opt}
                    disabled={optDisabled}
                    onChange={() => setRadioValue(opt)}
                    className={styles.optionInput}
                  />
                  <span>{optLabel}</span>
                  {optInfoIcon && (
                    <span className={`material-symbols-outlined ${styles.fieldInfoIcon}`} title={optLabel}>info</span>
                  )}
                </label>
              );
            })}
          </div>
          {field.conditionalFields && radioValue === field.showWhenValue && (
            <div
              className={
                field.conditionalLayout === 'row'
                  ? styles.conditionalFieldsRow
                  : styles.conditionalFields
              }
            >
              {field.conditionalFields.map((sub) => (
                <InteractiveField key={sub.id} field={sub} />
              ))}
            </div>
          )}
          {conditionalForValue && (
            <div
              className={
                field.conditionalLayout === 'row'
                  ? styles.conditionalFieldsRow
                  : styles.conditionalFields
              }
            >
              {conditionalForValue.map((sub) => (
                <InteractiveField key={sub.id} field={sub} />
              ))}
            </div>
          )}
        </div>
      );
    }

    case 'checkbox':
      return (
        <div className={styles.fieldWrap}>
          {!field.hideLabel && (
            <FieldHeader label={label} required={required} helpText={field.helpText} showInfoIcon={field.showInfoIcon} />
          )}
          <div className={field.layout === 'row' ? styles.checkboxRow : styles.optionGroup}>
            {field.options.map((opt) => (
              <label key={opt} className={field.layout === 'row' ? styles.checkboxLabel : styles.optionLabel}>
                <input
                  type="checkbox"
                  value={opt}
                  checked={checkValues.includes(opt)}
                  onChange={(e) => {
                    const next = e.target.checked
                      ? [...checkValues, opt]
                      : checkValues.filter((o) => o !== opt);
                    setCheckValues(next);
                    onValueChange?.(field.id, next);
                  }}
                  className={styles.optionInput}
                />
                <span>{opt}</span>
              </label>
            ))}
          </div>
          {field.conditionalFields?.map((sub) => {
            if (sub.showWhenIncludes && !checkValues.includes(sub.showWhenIncludes)) return null;
            return (
              <div key={sub.id} className={styles.conditionalFieldsBelow}>
                <InteractiveField field={sub} onValueChange={onValueChange} />
              </div>
            );
          })}
        </div>
      );

    case 'toggle':
      return (
        <div className={styles.toggleRow} style={{ alignItems: field.helpText ? 'flex-start' : 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 0 }}>
            <span className={styles.fieldLabel}>
              {label}
              {field.showInfoIcon && (
                <span className={`material-symbols-outlined ${styles.fieldInfoIcon}`} style={{ marginLeft: 4, verticalAlign: 'middle' }}>info</span>
              )}
            </span>
            {/* Title carries the weight in #0d0d12; the line under it stays secondary grey. */}
            {field.helpText && <p style={{ fontSize: 12, color: '#6b7280', fontFamily: 'Roboto, sans-serif', margin: 0, lineHeight: '18px' }}>{field.helpText}</p>}
          </div>
          <Toggle
            name={`view_toggle_${field.id}`}
            checked={toggled}
            onChange={(instance, e) => setToggled(e.target.checked)}
            roundedToggle
          />
        </div>
      );

    case 'section':
      return <SectionField field={field} onValueChange={onValueChange} />;

    case 'sectionLabel':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 13, fontWeight: 400, color: '#212121', fontFamily: 'Roboto, sans-serif' }}>{field.label}</span>
          {field.helpText && <p style={{ fontSize: 12, color: '#6b7280', fontFamily: 'Roboto, sans-serif', margin: 0, lineHeight: '18px' }}>{field.helpText}</p>}
        </div>
      );

    case 'variable':
      return (
        <div className={styles.fieldWrap}>
          <span className={styles.fieldLabel}>
            {label}{required && <span className={styles.required}> *</span>}
          </span>
          <div className={styles.tagsInput}>
            {textValue ? (
              <VariableChip
                value={textValue}
                type="variable"
                onChange={setTextValue}
                onDelete={() => setTextValue('')}
              />
            ) : (
              <span className={styles.variableEmptyHint}>
                {field.placeholder || 'Map a workflow variable'}
              </span>
            )}
          </div>
        </div>
      );

    case 'tags':
      return (
        <div className={styles.fieldWrap}>
          <span className={styles.fieldLabel}>
            {label}{required && <span className={styles.required}> *</span>}
          </span>
          <div className={styles.tagsInput}>
            {tags.map((tag, i) => (
              <span key={i} className={styles.tagChip}>
                {tag}
                <button
                  type="button"
                  className={styles.tagChipRemove}
                  onClick={() => setTags((prev) => prev.filter((_, idx) => idx !== i))}
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </span>
            ))}
            <input
              className={styles.tagInputInner}
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && tagInput.trim()) {
                  e.preventDefault();
                  setTags((prev) => [...prev, tagInput.trim()]);
                  setTagInput('');
                }
              }}
              placeholder={field.placeholder || (tags.length === 0 ? 'Type and press Enter...' : '')}
            />
          </div>
        </div>
      );

    case 'tag-select': {
      const allTags = getTags();
      const query = tagQuery.trim().toLowerCase();
      const availableTags = allTags.filter((t) => !selectedTags.some((s) => s.id === t.id));
      const filteredTags = query
        ? availableTags.filter((t) => t.name.toLowerCase().includes(query))
        : availableTags;
      const showCreateOption = query.length > 0 && !allTags.some((t) => t.name.toLowerCase() === query);

      const selectTag = (tag) => {
        setSelectedTags((prev) => [...prev, tag]);
        setTagQuery('');
        // Clicking an option moves focus to that button; hand it back so the next
        // keystroke keeps filtering instead of going nowhere.
        tagInputRef.current?.focus();
      };

      // The picker's "Create tag" row hands off to the modal (prefilled) rather
      // than creating on the spot, so a description can be written with it.
      const openCreateModal = (prefill = '') => {
        setTagDropdownOpen(false);
        setTagModal({ mode: 'add', name: prefill, description: '' });
      };

      const openEditModal = (tag) => {
        setTagDropdownOpen(false);
        setTagModal({ mode: 'edit', id: tag.id, name: tag.name, description: tag.description || '' });
      };

      const commitTagModal = ({ name, description }) => {
        if (tagModal?.mode === 'edit') {
          // Edits the library entry, so every chip pointing at this tag follows.
          const updated = updateTag(tagModal.id, { name, description });
          if (updated) {
            setSelectedTags((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
          }
          return;
        }
        const created = createTag({ name, description });
        setSelectedTags((prev) => (prev.some((t) => t.id === created.id) ? prev : [...prev, created]));
        setTagQuery('');
      };

      return (
        <div className={styles.fieldWrap}>
          <div className={styles.tagLabelRow}>
            <span className={styles.fieldLabel}>
              {label}{required && <span className={styles.required}> *</span>}
            </span>
            <button type="button" className={styles.addTagBtn} onClick={() => openCreateModal()}>
              <span className="material-symbols-outlined">add_circle</span>
              <span className={styles.addTagBtnLabel}>Add tag</span>
            </button>
          </div>
          <div className={styles.tagSelectWrap} ref={tagSelectRef}>
            <div className={styles.tagsInput} onClick={() => setTagDropdownOpen(true)}>
              {selectedTags.map((tag) => (
                <Tooltip
                  key={tag.id}
                  variant="detail"
                  side="top"
                  content={
                    <div className="flex flex-col gap-0.5">
                      <span>{tag.name}</span>
                      {tag.description && <span className="text-white/70">{tag.description}</span>}
                    </div>
                  }
                >
                  <span className={styles.tagChip}>
                    {tag.name}
                    <button
                      type="button"
                      className={styles.tagChipEdit}
                      aria-label={`Edit ${tag.name}`}
                      // stopPropagation: the chip sits inside the input box, whose
                      // click opens the picker.
                      onClick={(e) => { e.stopPropagation(); openEditModal(tag); }}
                    >
                      <span className="material-symbols-outlined">edit</span>
                    </button>
                    <button
                      type="button"
                      className={styles.tagChipRemove}
                      aria-label={`Remove ${tag.name}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTags((prev) => prev.filter((t) => t.id !== tag.id));
                      }}
                    >
                      <span className="material-symbols-outlined">close</span>
                    </button>
                  </span>
                </Tooltip>
              ))}
              <input
                ref={tagInputRef}
                className={styles.tagInputInner}
                value={tagQuery}
                onFocus={() => setTagDropdownOpen(true)}
                onChange={(e) => { setTagQuery(e.target.value); setTagDropdownOpen(true); }}
                onKeyDown={(e) => {
                  if (e.key !== 'Enter' || !tagQuery.trim()) return;
                  e.preventDefault();
                  if (showCreateOption) openCreateModal(tagQuery.trim());
                  else if (filteredTags[0]) selectTag(filteredTags[0]);
                }}
                placeholder={field.placeholder || (selectedTags.length === 0 ? 'Search or create tags...' : '')}
              />
            </div>
          </div>
          {/* Portaled to <body>: the RHS panel clips an absolutely-positioned
              menu to its own scroll box, cutting the list off after one row. */}
          {tagDropdownOpen && tagMenuRect && (filteredTags.length > 0 || showCreateOption) && createPortal(
            <div
              ref={tagMenuRef}
              className={styles.tagDropdown}
              style={{ left: tagMenuRect.left, top: tagMenuRect.top, width: tagMenuRect.width }}
            >
              {filteredTags.map((tag) => (
                <button
                  type="button"
                  key={tag.id}
                  className={styles.tagOption}
                  onClick={() => selectTag(tag)}
                >
                  <span className={styles.tagOptionName}>{tag.name}</span>
                  {tag.description && <span className={styles.tagOptionDesc}>{tag.description}</span>}
                </button>
              ))}
              {showCreateOption && (
                <button
                  type="button"
                  className={styles.tagCreateOption}
                  onClick={() => openCreateModal(tagQuery.trim())}
                >
                  <span className="material-symbols-outlined">add</span>
                  Create tag &quot;{tagQuery.trim()}&quot;
                </button>
              )}
            </div>,
            document.body,
          )}
          {tagModal && (
            <CreateTagModal
              mode={tagModal.mode}
              initialName={tagModal.name}
              initialDescription={tagModal.description}
              onClose={() => setTagModal(null)}
              onAdd={commitTagModal}
            />
          )}
        </div>
      );
    }

    case 'competitorList':
      return <CompetitorListField field={field} onValueChange={onValueChange} />;

    case 'ticketBuilder':
      return <TicketBuilderField field={field} onValueChange={onValueChange} />;

    case 'localizeMedia':
      return <LocalizeMediaField field={field} onValueChange={onValueChange} />;

    case 'templateMultiSelect':
      return <TemplateMultiSelectField field={field} onValueChange={onValueChange} />;

    case 'readOnlyChips':
      return <ReadOnlyChipsField field={field} />;

    case 'keywordChips':
      return <KeywordChipsField field={field} onValueChange={onValueChange} />;

    case 'prefChannel': {
      const setPref = (keyId, value) => {
        setPrefValues((prev) => ({ ...prev, [keyId]: value }));
      };

      return (
        <div className={styles.prefCard}>
          <label className={styles.prefCardHeader}>
            <input
              type="checkbox"
              checked={prefChannelOn}
              onChange={(e) => setPrefChannelOn(e.target.checked)}
              className={styles.optionInput}
            />
            <span className={styles.abCheckboxLabel}>{label}</span>
          </label>
          {prefChannelOn && (
            <div className={styles.prefCardContent}>
              {(field.prefKeys || []).map((pref) => (
                <div key={pref.id} className={styles.fieldWrap}>
                  <span className={styles.fieldLabel}>{pref.label}</span>
                  <SingleSelect
                    name={pref.id}
                    selected={prefValues[pref.id] ?? PREF_NO_CHANGE}
                    options={PREF_OPTIONS}
                    onChange={(opt) => setPref(pref.id, opt.value)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    case 'abSection':
      return (
        <div className={styles.abCard}>
          <label className={styles.abCheckboxRow}>
            <input
              type="checkbox"
              checked={abChecked}
              onChange={(e) => setAbChecked(e.target.checked)}
              className={styles.optionInput}
            />
            <span className={styles.abCheckboxLabel}>{field.checkboxLabel}</span>
          </label>
          {/* alwaysFields: always visible (e.g. template select) */}
          {(field.alwaysFields || []).length > 0 && (
            <div className={styles.abCardContent}>
              {(field.alwaysFields || []).map((af) => (
                <InteractiveField key={af.id} field={af} onValueChange={onValueChange} />
              ))}
            </div>
          )}
          {/* cardFields: only when A/B is checked */}
          {abChecked && (
            <div className={styles.abCardContent}>
              {(field.cardFields || []).map((cf) => (
                <InteractiveField key={cf.id} field={cf} onValueChange={onValueChange} />
              ))}
            </div>
          )}
        </div>
      );

    case 'templateSelect':
      return <TemplateSelectField field={field} />;

    case 'distribution':
      return (
        <div className={styles.fieldWrap}>
          <span className={styles.fieldLabel}>
            {field.label}{field.required && <span className={styles.required}> *</span>}
          </span>
          <div className={styles.distributionRows}>
            {(field.variants || []).map((v) => (
              <div key={v.id} className={styles.variantRow}>
                <div className={styles.variantInfo}>
                  <span className={styles.variantName}>{v.name}</span>
                  <span className={styles.variantSublabel}>{v.sublabel}</span>
                </div>
                <div className={styles.variantInputRow}>
                  <input
                    type="number"
                    className={styles.variantInput}
                    value={variantValues[v.id] ?? 50}
                    min={0}
                    max={100}
                    onChange={(e) => setVariantValues((prev) => ({ ...prev, [v.id]: e.target.value }))}
                  />
                  <span className={styles.fieldSuffix}>%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      );

    case 'dateSelect':
      return (
        <div className={styles.fieldWrap}>
          <span className={styles.fieldLabel}>{field.label}</span>
          <div className={styles.dateSelectRow}>
            {field.prefix && <span className={styles.dateSelectPrefix}>{field.prefix}</span>}
            <div className={styles.selectWrap}>
              <select
                className={styles.selectInput}
                value={dateSelectVal}
                onChange={(e) => setDateSelectVal(e.target.value)}
              >
                {(field.options || []).map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
              <span className={`material-symbols-outlined ${styles.selectChevron}`}>expand_more</span>
            </div>
          </div>
        </div>
      );

    case 'paramList':
      return <ParamListField field={field} />;

    default:
      return null;
  }
}

// ─── Parameter list (card-per-param style, matches Figma patient-lookup design) ─

const _DATA_TYPE_OPTS = ['String', 'Number', 'Boolean', 'Object', 'Array'];
const _VALUE_TYPE_OPTS = [
  { value: 'llm',      label: 'LLM' },
  { value: 'dynamic',  label: 'Dynamic variable' },
  { value: 'constant', label: 'Constant value' },
];

function ParamCard({ param, index, onChange, onDelete }) {
  const [collapsed, setCollapsed] = useState(false);
  const [hovered, setHovered]     = useState(false);
  const [enumInput, setEnumInput]  = useState('');
  const vt = param.valueType || 'llm';

  const addEnum = () => {
    if (!enumInput.trim()) return;
    onChange({ ...param, enumValues: [...(param.enumValues || []), enumInput.trim()] });
    setEnumInput('');
  };

  const S = {
    card:    { border: '1px solid #e0e0e0', borderRadius: 6, background: '#fff', fontFamily: 'Roboto, sans-serif', overflow: 'hidden' },
    header:  { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', background: hovered ? '#f5f5f5' : 'transparent', borderBottom: collapsed ? 'none' : '1px solid #e0e0e0', cursor: 'pointer', userSelect: 'none', transition: 'background 0.15s' },
    hdrLeft: { display: 'flex', alignItems: 'center', gap: 6 },
    hdrTitle:{ fontSize: 13, color: '#212121', fontWeight: 400 },
    iconBtn: { background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'flex', alignItems: 'center', color: '#757575', lineHeight: 1 },
    body:    { padding: '16px', display: 'flex', flexDirection: 'column', gap: 14 },
    row2:    { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
    fwrap:   { display: 'flex', flexDirection: 'column', gap: 5 },
    label:   { fontSize: 12, color: '#212121', fontWeight: 400, display: 'flex', alignItems: 'center', gap: 4 },
    req:     { color: '#e53935', marginLeft: 1 },
    select:  { height: 36, width: '100%', padding: '0 32px 0 10px', border: '1px solid #c5cad3', borderRadius: 4, fontSize: 13, fontFamily: 'Roboto, sans-serif', color: '#212121', background: '#fff', appearance: 'none', WebkitAppearance: 'none', cursor: 'pointer', boxSizing: 'border-box' },
    selWrap: { position: 'relative', width: '100%' },
    chevron: { position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', fontSize: 18, color: '#757575' },
    input:   { height: 36, width: '100%', padding: '0 10px', border: '1px solid #c5cad3', borderRadius: 4, fontSize: 13, fontFamily: 'Roboto, sans-serif', color: '#212121', background: '#fff', boxSizing: 'border-box', outline: 'none' },
    textarea:{ width: '100%', padding: '8px 10px', border: '1px solid #c5cad3', borderRadius: 4, fontSize: 13, fontFamily: 'Roboto, sans-serif', color: '#212121', background: '#fff', boxSizing: 'border-box', outline: 'none', resize: 'vertical', minHeight: 72 },
    cbRow:   { display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' },
    cbLabel: { fontSize: 13, color: '#212121', fontWeight: 400 },
    chip:    { display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', border: '1px solid #c5cad3', borderRadius: 12, fontSize: 12, color: '#424242', background: '#fafafa' },
    chipX:   { background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', color: '#757575' },
    addBtn:  { width: 32, height: 36, border: '1px solid #c5cad3', borderRadius: 4, background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxSizing: 'border-box' },
    hint:    { fontSize: 11, color: '#9e9e9e', lineHeight: '16px' },
    varChip: { display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', border: '1px solid #b3d4f5', borderRadius: 12, fontSize: 12, color: '#1565c0', background: '#e8f1fb' },
  };

  const iconStyle = { fontSize: 16, fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 20" };

  return (
    <div style={S.card} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      {/* Header */}
      <div style={S.header} onClick={() => setCollapsed(c => !c)}>
        <div style={S.hdrLeft}>
          <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#757575', fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}>
            {collapsed ? 'expand_more' : 'expand_less'}
          </span>
          <span style={S.hdrTitle}>Parameter {index + 1}</span>
        </div>
        {hovered && (
          <button type="button" style={S.iconBtn}
            onClick={(e) => { e.stopPropagation(); onDelete(); }}>
            <span className="material-symbols-outlined" style={{ ...iconStyle, color: '#9e9e9e' }}>delete</span>
          </button>
        )}
      </div>

      {/* Body */}
      {!collapsed && (
        <div style={S.body}>
          {/* Type + Variable row */}
          <div style={S.row2}>
            <div style={S.fwrap}>
              <span style={S.label}>Type <span style={S.req}>*</span></span>
              <div style={S.selWrap}>
                <select style={S.select} value={param.dataType || 'String'}
                  onChange={(e) => onChange({ ...param, dataType: e.target.value })}>
                  {_DATA_TYPE_OPTS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
                <span className="material-symbols-outlined" style={{ ...S.chevron, fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}>expand_more</span>
              </div>
            </div>
            <div style={S.fwrap}>
              <span style={S.label}>Variable <span style={S.req}>*</span></span>
              <input type="text" style={S.input}
                value={param.identifier || ''}
                onChange={(e) => onChange({ ...param, identifier: e.target.value })}
                placeholder="Variable name"
              />
            </div>
          </div>

          {/* Required */}
          <label style={S.cbRow}>
            <input type="checkbox" checked={!!param.required}
              onChange={(e) => onChange({ ...param, required: e.target.checked })}
              style={{ accentColor: '#1976d2', width: 15, height: 15, cursor: 'pointer', margin: 0 }}
            />
            <span style={S.cbLabel}>Required</span>
          </label>

          {/* Value type */}
          <div style={S.fwrap}>
            <span style={S.label}>Type <span style={S.req}>*</span></span>
            <div style={S.selWrap}>
              <select style={S.select} value={vt}
                onChange={(e) => onChange({ ...param, valueType: e.target.value })}>
                {_VALUE_TYPE_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <span className="material-symbols-outlined" style={{ ...S.chevron, fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}>expand_more</span>
            </div>
          </div>

          {/* LLM → Description + Enum */}
          {vt === 'llm' && (<>
            <div style={S.fwrap}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={S.label}>Description</span>
                <span style={{ fontSize: 11, color: '#9e9e9e' }}>{(param.llmDescription || '').length}/300</span>
              </div>
              <textarea style={S.textarea}
                value={param.llmDescription || ''}
                maxLength={300}
                placeholder="Write description"
                onChange={(e) => onChange({ ...param, llmDescription: e.target.value })}
              />
            </div>
            <div style={S.fwrap}>
              <span style={{ ...S.label, gap: 4 }}>
                Enum value
                <span className="material-symbols-outlined" style={{ fontSize: 14, color: '#9e9e9e', fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}>info</span>
              </span>
              <input type="text" style={S.input}
                value={enumInput}
                placeholder="Enter value"
                onChange={(e) => setEnumInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addEnum(); } }}
              />
              {(param.enumValues || []).length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {(param.enumValues || []).map((v, i) => (
                    <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', border: '1px solid #e0e0e0', borderRadius: 4, fontSize: 12, color: '#555', background: '#f5f5f5' }}>
                      {v}
                      <button type="button" style={S.chipX}
                        onClick={() => onChange({ ...param, enumValues: param.enumValues.filter((_, j) => j !== i) })}>
                        <span className="material-symbols-outlined" style={{ fontSize: 13, fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}>close</span>
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </>)}

          {/* Constant value */}
          {vt === 'constant' && (
            <div style={S.fwrap}>
              <span style={S.label}>Constant value</span>
              <textarea style={S.textarea}
                value={param.constantValue || ''}
                placeholder="Enter constant value"
                onChange={(e) => onChange({ ...param, constantValue: e.target.value })}
              />
            </div>
          )}

          {/* Dynamic variable */}
          {vt === 'dynamic' && (
            <div style={S.fwrap}>
              <span style={S.label}>Variable <span style={S.req}>*</span></span>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6, minHeight: 36, padding: '4px 8px', border: '1px solid #c5cad3', borderRadius: 4, background: '#fff', boxSizing: 'border-box' }}>
                {param.variableName ? (
                  /* VariableChip-style: white body, #d1e5f9 border, left blue swatch */
                  <span style={{ display: 'inline-flex', alignItems: 'center', height: 26, background: '#fff', border: '1px solid #d1e5f9', borderRadius: 4, overflow: 'hidden', flexShrink: 0 }}>
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 25, height: 24, background: '#ecf5fd', borderRight: '1px solid #d1e5f9', flexShrink: 0 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 13, color: '#1976d2', fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}>data_object</span>
                    </span>
                    <span style={{ fontSize: 12, color: '#555', padding: '0 4px 0 6px', fontFamily: 'Inter, Roboto, sans-serif', whiteSpace: 'nowrap' }}>{param.variableName}</span>
                    <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 4px', display: 'flex', alignItems: 'center', color: '#9e9e9e' }}
                      onClick={() => onChange({ ...param, variableName: '' })}>
                      <span className="material-symbols-outlined" style={{ fontSize: 13, fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}>close</span>
                    </button>
                  </span>
                ) : (
                  <input type="text"
                    placeholder="Variable name"
                    style={{ border: 'none', outline: 'none', fontSize: 13, fontFamily: 'Roboto, sans-serif', flex: 1, minWidth: 80, background: 'transparent' }}
                    onChange={(e) => { if (e.target.value) onChange({ ...param, variableName: e.target.value }); }}
                  />
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ParamListField({ field }) {
  const [params, setParams] = useState(() =>
    (field.params || []).map((p, i) => ({ ...p, _key: p.id || `param-${i}` }))
  );

  const updateParam = (idx, updated) =>
    setParams(prev => prev.map((p, i) => (i === idx ? { ...updated, _key: p._key } : p)));
  const deleteParam = (idx) =>
    setParams(prev => prev.filter((_, i) => i !== idx));
  const addParam = () =>
    setParams(prev => [...prev, { _key: `param-new-${Date.now()}`, identifier: '', dataType: 'String', required: false, valueType: 'llm', enumValues: [], llmDescription: '' }]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {params.map((param, idx) => (
        <ParamCard
          key={param._key}
          param={param}
          index={idx}
          onChange={(updated) => updateParam(idx, updated)}
          onDelete={() => deleteParam(idx)}
        />
      ))}
      <button type="button" onClick={addParam}
        style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: '#1976d2', fontSize: 14, fontFamily: 'Roboto, sans-serif', padding: '4px 0' }}>
        <span className="material-symbols-outlined" style={{ fontSize: 18, fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}>add_circle</span>
        Add parameter
      </button>
    </div>
  );
}

// ─── Shared content (used both in standalone drawer and embedded mode) ────────

export function ToolViewerContent({
  tool,
  onClose,
  onSave,
  initialValues,
  clearDefaults = false,
  /** When true, render fields only (no header/back/save) for inline RHS embedding. */
  embedded = false,
  /** Live field-value updates (used with embedded mode). */
  onFieldValuesChange,
}) {
  const [fieldSnapshot, setFieldSnapshot] = useState(() =>
    initialValues && Object.keys(initialValues).length > 0
      ? { ...initialValues }
      : buildInitialSnapshot(tool?.fields)
  );

  useEffect(() => {
    setFieldSnapshot(
      initialValues && Object.keys(initialValues).length > 0
        ? { ...initialValues }
        : buildInitialSnapshot(tool?.fields)
    );
  }, [tool?.id]);

  const effectiveSnapshot = useMemo(() => {
    if (Object.keys(fieldSnapshot).length > 0) return fieldSnapshot;
    return buildInitialSnapshot(tool?.fields);
  }, [fieldSnapshot, tool?.fields]);

  // Mirror of the latest snapshot so the next value can be derived without a
  // state updater. React may run an updater during the render phase, and
  // notifying the parent from in there makes it setState mid-render
  // ("Cannot update a component while rendering a different component").
  const snapshotRef = useRef(fieldSnapshot);
  snapshotRef.current = fieldSnapshot;

  const handleValueChange = useCallback((id, val) => {
    const next = { ...snapshotRef.current, [id]: val };
    snapshotRef.current = next;
    setFieldSnapshot(next);
    onFieldValuesChange?.(next);
  }, [onFieldValuesChange]);

  if (!tool) return null;

  const handleSave = () => {
    if (onSave) onSave(tool, fieldSnapshot);
    else onClose?.();
  };

  const fieldsBody = (
    <div className={embedded ? styles.embeddedBody : styles.body}>
      {tool.fields
        ?.filter((f) => isFieldVisible(f, effectiveSnapshot))
        .map((f) => (
          <InteractiveField
            key={f.id}
            field={clearDefaults ? { ...f, defaultValue: undefined, defaultChecked: undefined } : f}
            onValueChange={handleValueChange}
          />
        ))}
    </div>
  );

  if (embedded) {
    return <div className={styles.embeddedOuter}>{fieldsBody}</div>;
  }

  return (
    <div className={styles.outer}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <button className={styles.backBtn} type="button" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M5.98854 10.6267L8.73215 13.3703C8.85608 13.4943 8.91724 13.6393 8.91565 13.8054C8.91403 13.9715 8.85287 14.1192 8.73215 14.2485C8.60288 14.3778 8.45438 14.4446 8.28665 14.4488C8.11892 14.4531 7.97042 14.3906 7.84115 14.2613L4.10877 10.529C3.95813 10.3783 3.88281 10.2026 3.88281 10.0017C3.88281 9.80088 3.95813 9.62514 4.10877 9.4745L7.84115 5.74212C7.96508 5.61819 8.11224 5.55703 8.28265 5.55862C8.45305 5.56024 8.60288 5.62567 8.73215 5.75494C8.85287 5.88421 8.91537 6.03058 8.91965 6.19404C8.92392 6.3575 8.86142 6.50386 8.73215 6.63312L5.98854 9.37675H15.7931C15.9704 9.37675 16.1189 9.43658 16.2386 9.55623C16.3582 9.67588 16.418 9.82438 16.418 10.0017C16.418 10.1791 16.3582 10.3276 16.2386 10.4472C16.1189 10.5669 15.9704 10.6267 15.7931 10.6267H5.98854Z" fill="currentColor"/>
            </svg>
          </button>
          <span className={styles.headerTitle}>{tool.name}</span>
        </div>
        <button type="button" onClick={handleSave} className={styles.saveBtn}>
          Save
        </button>
      </div>

      {fieldsBody}
    </div>
  );
}

// ─── Main component (standalone drawer) ──────────────────────────────────────

export default function CustomToolViewer({ isOpen, tool, onClose, onEditTool, onSave, initialValues }) {
  if (!tool) return null;

  return (
    <CommonSideDrawer
      isOpen={isOpen}
      title=""
      onClose={onClose}
      width="650px"
      shouldScroll={false}
      buttonPosition="right"
      headerRightContent={<span className={styles.drawerSuppress} />}
    >
      <ToolViewerContent
        tool={tool}
        onClose={onClose}
        onSave={onSave}
        initialValues={initialValues}
      />
    </CommonSideDrawer>
  );
}
