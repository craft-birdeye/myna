import React, { useState, useMemo, useEffect, useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import CloseIcon from '../../../Molecules/RHS/RHSHeader/icons/close.svg';
import styles from './FieldPickerModal.module.css';

const SAMPLE_COLOR = {
  number: '#1976d2',
  string: '#37a248',
};

const BASE_CATEGORIES = [
  {
    id: 'business',
    label: 'Business',
    sectionLabel: 'Business fields',
    fields: [
      { name: 'Business name', value: 'Business.name', sample: 'Aspen Dental', valueType: 'string' },
      { name: 'Business phone', value: 'Business.phone', sample: '+1 415-555-0100', valueType: 'string' },
      { name: 'Business email', value: 'Business.email', sample: 'frontdesk@aspendental.com', valueType: 'string' },
      { name: 'Business address', value: 'Business.address', sample: '720 Castro St', valueType: 'string' },
      { name: 'Business hours', value: 'Business.hours', sample: '9:00 AM – 6:00 PM', valueType: 'string' },
      { name: 'Business website', value: 'Business.website', sample: 'www.aspendental.com', valueType: 'string' },
      { name: 'Business category', value: 'Business.category', sample: 'Healthcare', valueType: 'string' },
      { name: 'Business rating', value: 'Business.rating', sample: '4.6', valueType: 'number' },
      { name: 'Total reviews', value: 'Business.totalReviews', sample: '1284', valueType: 'number' },
      { name: 'Response rate', value: 'Business.responseRate', sample: '92%', valueType: 'string' },
      { name: 'NPS score', value: 'Business.npsScore', sample: '68', valueType: 'number' },
      { name: 'Active since', value: 'Business.activeSince', sample: '2018', valueType: 'number' },
      { name: 'Owner name', value: 'Business.ownerName', sample: 'Jane Smith', valueType: 'string' },
      { name: 'Owner email', value: 'Business.ownerEmail', sample: 'jane@aspendental.com', valueType: 'string' },
      { name: 'Region', value: 'Business.region', sample: 'West', valueType: 'string' },
      { name: 'Tax ID', value: 'Business.taxId', sample: '94-1234567', valueType: 'string' },
      { name: 'License number', value: 'Business.licenseNumber', sample: 'HC-88421', valueType: 'string' },
      { name: 'EHR provider', value: 'Business.ehrProvider', sample: 'Epic', valueType: 'string' },
      { name: 'Timezone', value: 'Business.timezone', sample: 'America/Los_Angeles', valueType: 'string' },
      { name: 'Locale', value: 'Business.locale', sample: 'en-US', valueType: 'string' },
    ],
  },
  {
    id: 'location',
    label: 'Location',
    sectionLabel: 'Location fields',
    fields: [
      { name: 'Location name', value: 'Location.name', sample: 'Downtown clinic', valueType: 'string' },
      { name: 'Location address', value: 'Location.address', sample: '100 Main St', valueType: 'string' },
      { name: 'Location phone', value: 'Location.phone', sample: '+1 650-555-0110', valueType: 'string' },
      { name: 'Location email', value: 'Location.email', sample: 'downtown@aspendental.com', valueType: 'string' },
      { name: 'Location hours', value: 'Location.hours', sample: 'Mon–Sat 8–7', valueType: 'string' },
      { name: 'Exam rooms', value: 'Location.examRooms', sample: '12', valueType: 'number' },
      { name: 'Staff count', value: 'Location.staffCount', sample: '18', valueType: 'number' },
      { name: 'Manager name', value: 'Location.managerName', sample: 'Alex Rivera', valueType: 'string' },
      { name: 'Manager email', value: 'Location.managerEmail', sample: 'alex@aspendental.com', valueType: 'string' },
      { name: 'City', value: 'Location.city', sample: 'San Mateo', valueType: 'string' },
      { name: 'State', value: 'Location.state', sample: 'CA', valueType: 'string' },
      { name: 'Zip code', value: 'Location.zipCode', sample: '94401', valueType: 'number' },
    ],
  },
  {
    id: 'contacts',
    label: 'Contacts',
    sectionLabel: 'Contact fields',
    fields: [
      { name: 'Contact first name', value: 'Contact.firstName', sample: 'John', valueType: 'string' },
      { name: 'Contact last name', value: 'Contact.lastName', sample: 'Doe', valueType: 'string' },
      { name: 'Contact phone', value: 'Contact.phone', sample: '+1 415-555-0199', valueType: 'string' },
      { name: 'Contact email', value: 'Contact.email', sample: 'john.doe@example.com', valueType: 'string' },
      { name: 'Patient ID', value: 'Contact.patientId', sample: '27679', valueType: 'number' },
      { name: 'Date of birth', value: 'Contact.dateOfBirth', sample: '1988-04-12', valueType: 'string' },
      { name: 'Insurance plan', value: 'Contact.insurancePlan', sample: 'Aetna PPO', valueType: 'string' },
      { name: 'Preferred provider', value: 'Contact.preferredProvider', sample: 'Dr.John', valueType: 'string' },
      { name: 'Last visit date', value: 'Contact.lastVisitDate', sample: '2026-03-12', valueType: 'string' },
      { name: 'Last visit reason', value: 'Contact.lastVisitReason', sample: 'Cleaning', valueType: 'string' },
      { name: 'Patient since', value: 'Contact.patientSince', sample: '2021', valueType: 'number' },
      { name: 'Preferred channel', value: 'Contact.preferredChannel', sample: '"SMS"', valueType: 'string' },
    ],
  },
];

const TRIGGER_CATEGORY = {
  id: 'trigger',
  label: '1. Trigger: Generate res…',
  sectionLabel: 'Trigger output',
  fields: [
    { name: 'Appointment id', value: 'Trigger.appointmentId', sample: '545043398', valueType: 'number' },
    { name: 'patientID', value: 'Trigger.patientId', sample: '27679', valueType: 'number' },
    { name: 'Provider', value: 'Trigger.provider', sample: 'Dr.John', valueType: 'string' },
    { name: 'diagnosisCode', value: 'Trigger.diagnosisCode', sample: '9651531', valueType: 'number' },
    { name: 'Priority', value: 'Trigger.priority', sample: '"High"', valueType: 'string' },
    { name: 'Order', value: 'Trigger.order', sample: '219', valueType: 'string' },
  ],
};

const POPOVER_WIDTH = 600;
const POPOVER_MAX_HEIGHT = 400;
const DRAWER_GAP = 0;

function FieldChip({ name }) {
  return (
    <span className={styles.chip}>
      <span className={styles.chipSwatch}>{'{}'}</span>
      <span className={styles.chipLabel}>{name}</span>
    </span>
  );
}

function FieldRow({ field, onClick }) {
  return (
    <button
      type="button"
      className={styles.fieldRow}
      onClick={() => onClick?.(field.value, field.name)}
    >
      <FieldChip name={field.name} />
      <span
        className={styles.sample}
        style={{ color: SAMPLE_COLOR[field.valueType] ?? '#555' }}
        title={field.sample}
      >
        {field.sample}
      </span>
    </button>
  );
}

/**
 * Positions the popover to the LEFT of the nearest ancestor <aside> (a slide-in
 * drawer, e.g. the New procedure drawer) so it never overlaps the drawer's own
 * content. Falls back to anchoring near the triggering icon when there's no
 * enclosing drawer (e.g. the standalone Procedures page).
 */
function computePosition(anchorEl) {
  const margin = 12;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const asideEl = anchorEl?.closest ? anchorEl.closest('aside') : null;
  const anchorRect = anchorEl?.getBoundingClientRect ? anchorEl.getBoundingClientRect() : null;

  if (asideEl) {
    const asideRect = asideEl.getBoundingClientRect();
    const availableWidth = Math.max(320, asideRect.left - DRAWER_GAP - margin);
    const width = Math.min(POPOVER_WIDTH, availableWidth);
    const left = Math.max(margin, asideRect.left - DRAWER_GAP - width);
    const maxHeight = Math.min(POPOVER_MAX_HEIGHT, asideRect.height - margin * 2);
    // Open level with the triggering icon (parallel to the Steps field) instead
    // of always snapping to the top of the drawer.
    const idealTop = anchorRect ? anchorRect.top : asideRect.top;
    const top = Math.min(Math.max(margin, idealTop), vh - maxHeight - margin);
    return { top, left, width, maxHeight };
  }

  const width = Math.min(POPOVER_WIDTH, vw - margin * 2);
  const maxHeight = Math.min(POPOVER_MAX_HEIGHT, vh - margin * 2);

  // Prefer opening above the Fields icon so it stays inside the drawer column
  let top = (anchorRect?.top ?? vh / 2) - maxHeight - margin;
  let left = anchorRect?.left ?? margin;

  if (top < margin) {
    // Not enough room above — open just below the icon instead
    top = (anchorRect?.bottom ?? margin) + margin;
  }
  if (top + maxHeight > vh - margin) {
    top = Math.max(margin, vh - maxHeight - margin);
  }

  left = Math.min(left, vw - width - margin);
  left = Math.max(margin, left);

  return { top, left, width, maxHeight };
}

/**
 * Contextual Fields picker — docks to the left of the nearest drawer (or near
 * the triggering icon when there's no drawer), never overlapping it, with no
 * dimmed overlay.
 */
export default function FieldPickerModal({
  onClose,
  onSelectField,
  anchorEl = null,
  overlayZIndex = 120,
  /** Workflow canvas only — procedures omit trigger/output fields. */
  showTriggerFields = false,
}) {
  const [search, setSearch] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('business');
  const [pos, setPos] = useState(() => computePosition(anchorEl));
  const rootRef = useRef(null);

  const categories = useMemo(
    () => (showTriggerFields ? [...BASE_CATEGORIES, TRIGGER_CATEGORY] : BASE_CATEGORIES),
    [showTriggerFields],
  );

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId) ?? categories[0];

  const filteredFields = useMemo(() => {
    if (!selectedCategory) return [];
    const q = search.toLowerCase();
    return selectedCategory.fields.filter(
      (f) =>
        f.name.toLowerCase().includes(q)
        || f.value.toLowerCase().includes(q)
        || f.sample.toLowerCase().includes(q.replace(/"/g, '')),
    );
  }, [selectedCategory, search]);

  useEffect(() => {
    if (!showTriggerFields && selectedCategoryId === 'trigger') {
      setSelectedCategoryId('business');
    }
  }, [showTriggerFields, selectedCategoryId]);

  useLayoutEffect(() => {
    setPos(computePosition(anchorEl));
  }, [anchorEl]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    const onDown = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) onClose();
    };
    const reposition = () => setPos(computePosition(anchorEl));
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onDown);
    window.addEventListener('resize', reposition);
    // Capture phase so scrolling any nested container (e.g. the drawer's own
    // scrollable body) is caught too, not just window-level scrolling.
    document.addEventListener('scroll', reposition, true);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onDown);
      window.removeEventListener('resize', reposition);
      document.removeEventListener('scroll', reposition, true);
    };
  }, [onClose, anchorEl]);

  return createPortal(
    <div
      ref={rootRef}
      className={styles.popover}
      style={{
        top: pos.top,
        left: pos.left,
        width: pos.width,
        maxHeight: pos.maxHeight,
        zIndex: overlayZIndex,
      }}
      role="dialog"
      aria-label="Fields"
    >
      <div className={styles.header}>
        <span className={styles.title}>Fields</span>
        <div className={styles.headerRight}>
          <div className={styles.search}>
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 18, color: '#8f8f8f', flexShrink: 0, fontVariationSettings: "'FILL' 0, 'wght' 300" }}
            >
              search
            </span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search"
              className={styles.searchInput}
              aria-label="Search fields"
            />
          </div>
          <button type="button" onClick={onClose} className={styles.closeBtn} aria-label="Close">
            <img src={CloseIcon} alt="" width={24} height={24} />
          </button>
        </div>
      </div>

      <div className={styles.body}>
        <div className={styles.sidebar}>
          {categories.map((cat) => {
            const isSelected = cat.id === selectedCategoryId;
            return (
              <button
                key={cat.id}
                type="button"
                className={`${styles.catBtn} ${isSelected ? styles.catBtnSelected : ''}`}
                onClick={() => setSelectedCategoryId(cat.id)}
                title={cat.label}
              >
                <span className={styles.catLabel}>{cat.label}</span>
                <span className={styles.catMeta}>
                  <span className={styles.catCount}>{cat.fields.length}</span>
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: 16, color: '#8f8f8f', fontVariationSettings: "'FILL' 0, 'wght' 300" }}
                  >
                    chevron_right
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        <div className={styles.divider} />

        <div className={styles.content}>
          <div className={styles.card}>
            <div className={styles.section}>
              <div className={styles.sectionBody}>
                <div className={styles.sectionLabel}>
                  {selectedCategory?.sectionLabel ?? 'Trigger output'}
                </div>
                <div className={styles.fieldList}>
                  {filteredFields.length === 0 ? (
                    <span className={styles.empty}>No fields match your search.</span>
                  ) : (
                    filteredFields.map((field) => (
                      <FieldRow key={field.value} field={field} onClick={onSelectField} />
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
