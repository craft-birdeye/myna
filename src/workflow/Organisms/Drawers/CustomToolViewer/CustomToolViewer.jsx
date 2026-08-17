import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { FormInput, TextArea, Toggle } from '../../../elemental-stubs';
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
      {showInfoIcon && (
        <span className={`material-symbols-outlined ${styles.fieldInfoIcon}`} title={infoText || label}>
          info
        </span>
      )}
    </span>
  );
}

function FieldHeader({ label, required, helpText, showInfoIcon, infoText }) {
  return (
    <>
      <FieldLabel label={label} required={required} showInfoIcon={showInfoIcon} infoText={infoText || helpText} />
      {helpText && <span className={styles.fieldHelp}>{helpText}</span>}
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
  }, [field.id, field.defaultValue, field.type, field.options, field.defaultChecked]);

  useEffect(() => {
    if (field.type === 'checkbox') {
      onValueChange?.(field.id, checkValues);
    }
  }, [checkValues, field.id, field.type, onValueChange]);

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
        return (
          <div className={styles.fieldWrap}>
            <FieldLabel label={label} required={required} showInfoIcon={field.showInfoIcon} />
            <div className={styles.promptBox}>
              <textarea
                name={`view_${field.id}`}
                className={styles.promptTextarea}
                placeholder={field.placeholder || ''}
                value={textValue}
                onChange={(e) => setTextValue(e.target.value)}
                rows={field.rows || 5}
              />
              <div className={styles.promptToolbar}>
                <button type="button" className={styles.variableBtn} title="Insert variable">
                  <span className={styles.variableBtnBrace}>{'{'}</span>
                  <span className={styles.variableBtnX}>x</span>
                  <span className={styles.variableBtnBrace}>{'}'}</span>
                </button>
              </div>
            </div>
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
          <FieldLabel label={label} required={required} showInfoIcon={field.showInfoIcon} />
          <div className={styles.selectWrap}>
            <select
              className={styles.selectInput}
              value={selectValue}
              onChange={(e) => setSelectValue(e.target.value)}
            >
              <option value="">{field.placeholder || 'Select'}</option>
              {(field.options || []).map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
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
            {field.options.map((opt) => (
              <SelectItem key={opt} value={opt}>{opt}</SelectItem>
            ))}
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
            {field.helpText && <p style={{ fontSize: 12, color: '#6b7280', fontFamily: 'Roboto, sans-serif', margin: 0, lineHeight: '18px' }}>{field.helpText}</p>}
          </div>
          <Toggle
            name={`view_toggle_${field.id}`}
            checked={toggled}
            onChange={(instance, e) => setToggled(e.target.checked)}
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
              placeholder={tags.length === 0 ? (field.placeholder || 'Type and press Enter...') : ''}
            />
          </div>
        </div>
      );

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

export function ToolViewerContent({ tool, onClose, onSave, initialValues, clearDefaults = false }) {
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

  const handleValueChange = useCallback((id, val) => {
    setFieldSnapshot((prev) => ({ ...prev, [id]: val }));
  }, []);

  if (!tool) return null;

  const handleSave = () => {
    if (onSave) onSave(tool, fieldSnapshot);
    else onClose?.();
  };

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

      <div className={styles.body}>
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
