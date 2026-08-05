import React, { useState } from 'react';
import { FormInput, TextArea } from '../../../elemental-stubs';
import LocationsDrawer from '../../../RHSDrawer/LocationsDrawer.jsx';
import styles from './AgentDetailsBody.module.css';

const DEFAULT_LOCATIONS = [
  { id: '1001', name: '1001 - Mountain view, CA' },
  { id: '1002', name: '1002 - Seattle, WA' },
  { id: '1004', name: '1004 - Chicago, IL' },
  { id: '1006', name: '1006 - Las Vegas, NV' },
  { id: '1007', name: '1007 - Austin, TX' },
  { id: '1008', name: '1008 - New York, NY' },
  { id: '1009', name: '1009 - Miami, FL' },
  { id: '1010', name: '1010 - Denver, CO' },
  { id: '1011', name: '1011 - Portland, OR' },
  { id: '1012', name: '1012 - Phoenix, AZ' },
];

const VISIBLE_COUNT = 4;

export default function AgentDetailsBody({ values: externalValues, onChange, viewOnly = false }) {
  const [internalValues, setInternalValues] = useState({
    agentName: '',
    goals: '',
    outcomes: '',
    locations: [],
  });
  const [showLocations, setShowLocations] = useState(false);
  const [showAllChips, setShowAllChips] = useState(false);

  const values = externalValues ?? internalValues;

  /* Normalise locations — stored as strings OR as { id, name } objects */
  const normaliseLocations = (raw) =>
    (raw || []).map((l) =>
      typeof l === 'string' ? { id: l, name: l } : l
    );

  const rawLocations = values.locations && values.locations.length > 0
    ? values.locations
    : DEFAULT_LOCATIONS;

  const locations = normaliseLocations(rawLocations);

  const handleRemoveChip = (id) => {
    updateLocations(locations.filter((l) => l.id !== id));
  };

  /* Generic text-field setter */
  const set = onChange
    ? (field) => (e) => onChange(field, e.target.value)
    : (field) => (e) => setInternalValues((v) => ({ ...v, [field]: e.target.value }));

  const updateLocations = (updated) => {
    if (onChange) {
      onChange('locations', updated);
    } else {
      setInternalValues((v) => ({ ...v, locations: updated }));
    }
  };

  const handleLocationsSave = (selected) => {
    updateLocations(selected);
    setShowLocations(false);
  };

  /* LocationsDrawer replaces the whole body when open */
  if (showLocations) {
    return (
      <LocationsDrawer
        selectedIds={(values.locations || []).map((l) => l.id)}
        onBack={() => setShowLocations(false)}
        onSave={handleLocationsSave}
      />
    );
  }

  const visibleLocations = showAllChips
    ? locations
    : locations.slice(0, VISIBLE_COUNT);
  const overflowCount = locations.length - VISIBLE_COUNT;

  return (
    <div className={styles.body}>
      <FormInput
        name="agentName"
        type="text"
        label="Agent name"
        value={values.agentName}
        onChange={set('agentName')}
        required
        readOnly={viewOnly}
      />
      <TextArea
        name="goals"
        label="Goals"
        value={values.goals}
        onChange={set('goals')}
        required
        noFloatingLabel
        rows={6}
        readOnly={viewOnly}
      />
      <TextArea
        name="outcomes"
        label="Outcomes"
        value={values.outcomes}
        onChange={set('outcomes')}
        noFloatingLabel
        rows={viewOnly ? 12 : 6}
        readOnly={viewOnly}
      />

      {/* ─── Locations ─── */}
      <div className={styles.locationsField}>
        <div className={styles.locationsLabel}>
          <span className={styles.locationsLabelText}>Locations</span>
          <span className={styles.locationsRequired}>*</span>
          {!viewOnly && (
            <button
              className={styles.locationsEditBtn}
              type="button"
              onClick={() => setShowLocations(true)}
              title="Edit locations"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16, lineHeight: 1, fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}>
                edit
              </span>
            </button>
          )}
        </div>

        {/* Location chips — grey pill with name + × remove button */}
        <div className={styles.chipsRow}>
          {visibleLocations.map((loc) => (
            <span key={loc.id} className={styles.locationChip}>
              <span className={styles.locationChipName}>{loc.name}</span>
              {!viewOnly && (
                <button
                  type="button"
                  className={styles.locationChipClose}
                  onClick={() => handleRemoveChip(loc.id)}
                  title="Remove"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 12, lineHeight: 1, fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}>
                    close
                  </span>
                </button>
              )}
            </span>
          ))}
        </div>

        {/* "+ N more" link */}
        {!showAllChips && overflowCount > 0 && (
          <button className={styles.moreLink} type="button" onClick={() => setShowAllChips(true)}>
            + {overflowCount} more
          </button>
        )}
      </div>
    </div>
  );
}
