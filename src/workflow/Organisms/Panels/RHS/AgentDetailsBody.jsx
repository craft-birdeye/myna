import React, { useEffect, useState } from 'react';
import { FormInput, TextArea } from '../../../elemental-stubs';
import LocationsDrawer, {
  resolveEntitiesForSelectBy,
  resolveLocationsForSelectBy,
  formatSelectByGroupLabel,
} from '../../../RHSDrawer/LocationsDrawer.jsx';
import { DraftBlockedField, rhsFieldLock } from '../../../components/DraftBlockedTooltip';
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

export default function AgentDetailsBody({
  values: externalValues,
  onChange,
  viewOnly = false,
  draftBlocked = false,
  onEditDraft,
  /** Bumped by the canvas's "Add locations" link to jump straight to the Locations picker. */
  autoOpenLocationsToken = 0,
  /** Exploration: Select by includes custom fields (managers, departments). */
  includeCustomFields = false,
}) {
  const { inputDisabled, inputReadOnly, fieldsLocked } = rhsFieldLock({ viewOnly, draftBlocked });

  const blockField = (node, className = '') => (
    <DraftBlockedField
      draftBlocked={draftBlocked}
      viewOnly={viewOnly}
      onEditDraft={onEditDraft}
      className={className}
    >
      {node}
    </DraftBlockedField>
  );

  const [internalValues, setInternalValues] = useState({
    agentName: '',
    goals: '',
    outcomes: '',
    locations: [],
    locationsSelectBy: null,
  });
  const [showLocations, setShowLocations] = useState(false);
  const [showAllChips, setShowAllChips] = useState(false);

  useEffect(() => {
    if (autoOpenLocationsToken && !fieldsLocked) setShowLocations(true);
  }, [autoOpenLocationsToken, fieldsLocked]);

  const values = externalValues ?? internalValues;

  /* Normalise locations — stored as strings OR as { id, name } objects */
  const normaliseLocations = (raw) =>
    (raw || []).map((l) =>
      typeof l === 'string' ? { id: l, name: l } : l
    );

  // Honor an explicit empty list (e.g. create-from-scratch) — do not fall back
  // to demo DEFAULT_LOCATIONS when the parent passed `locations: []`.
  const locations = normaliseLocations(
    Array.isArray(values.locations) ? values.locations : DEFAULT_LOCATIONS,
  );
  const locationsSelectBy = values.locationsSelectBy || null;
  const selectByEntities = locationsSelectBy
    ? resolveEntitiesForSelectBy(
      locationsSelectBy.value,
      locationsSelectBy.entityIds
        || (locationsSelectBy.entities || []).map((e) => e.id),
    )
    : [];
  const hasLocationSelection = locations.length > 0 || !!locationsSelectBy;

  const handleRemoveLocationChip = (id) => {
    updateLocations(locations.filter((l) => l.id !== id), null);
  };

  const handleRemoveEntityChip = (entityId) => {
    if (!locationsSelectBy) return;
    const nextIds = (locationsSelectBy.entityIds
      || selectByEntities.map((e) => e.id)
    ).filter((id) => id !== entityId);
    if (nextIds.length === 0) {
      updateLocations([], null);
      setShowAllChips(false);
      return;
    }
    const nextEntities = resolveEntitiesForSelectBy(locationsSelectBy.value, nextIds);
    const nextLocations = resolveLocationsForSelectBy(locationsSelectBy.value, nextIds);
    updateLocations(nextLocations, {
      ...locationsSelectBy,
      entityIds: nextIds,
      entities: nextEntities,
    });
  };

  /* Generic text-field setter */
  const set = onChange
    ? (field) => (e) => onChange(field, e.target.value)
    : (field) => (e) => setInternalValues((v) => ({ ...v, [field]: e.target.value }));

  const updateLocations = (updated, selectByMeta) => {
    if (onChange) {
      onChange('locations', updated);
      onChange('locationsSelectBy', selectByMeta ?? null);
    } else {
      setInternalValues((v) => ({
        ...v,
        locations: updated,
        locationsSelectBy: selectByMeta ?? null,
      }));
    }
  };

  const handleLocationsSave = (selected, selectByMeta) => {
    // Support legacy callers that pass only a location array.
    const list = Array.isArray(selected) ? selected : (selected?.locations || []);
    const meta = selectByMeta === undefined
      ? (selected && !Array.isArray(selected) ? selected.selectBy : null)
      : selectByMeta;
    updateLocations(list, meta || null);
    setShowAllChips(false);
    setShowLocations(false);
  };

  /* LocationsDrawer replaces the whole body when open */
  if (showLocations && !fieldsLocked) {
    return (
      <LocationsDrawer
        selectedIds={(values.locations || []).map((l) => l.id)}
        onBack={() => setShowLocations(false)}
        onSave={handleLocationsSave}
        includeCustomFields={includeCustomFields}
        initialSelectBy={locationsSelectBy?.value || 'location'}
        initialEntityIds={locationsSelectBy?.entityIds || null}
      />
    );
  }

  const chipSource = locationsSelectBy ? selectByEntities : locations;
  const visibleChips = showAllChips
    ? chipSource
    : chipSource.slice(0, VISIBLE_COUNT);
  const overflowCount = chipSource.length - VISIBLE_COUNT;

  const locationsField = (
    <div className={`${styles.locationsField}${inputDisabled ? ` ${styles.locationsFieldDisabled}` : ''}`}>
      <div className={styles.locationsLabel}>
        <span className={styles.locationsLabelText}>Locations</span>
        <span className={styles.locationsRequired}>*</span>
        {!fieldsLocked && hasLocationSelection && (
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

      {!hasLocationSelection ? (
        !fieldsLocked && (
          <button
            className={styles.addLink}
            type="button"
            onClick={() => setShowLocations(true)}
          >
            + Add locations
          </button>
        )
      ) : (
        <>
          {locationsSelectBy && (
            <p className={styles.selectBySummary}>
              This agent runs on the locations assigned to the{' '}
              {formatSelectByGroupLabel(locationsSelectBy.label, selectByEntities.length)}
            </p>
          )}

          <div className={styles.chipsRow}>
            {visibleChips.map((chip) => (
              <span key={chip.id} className={styles.locationChip}>
                <span className={styles.locationChipName}>{chip.name}</span>
                {!fieldsLocked && (
                  <button
                    type="button"
                    className={styles.locationChipClose}
                    onClick={() => (
                      locationsSelectBy
                        ? handleRemoveEntityChip(chip.id)
                        : handleRemoveLocationChip(chip.id)
                    )}
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

          {!showAllChips && overflowCount > 0 && (
            <button className={styles.moreLink} type="button" onClick={() => setShowAllChips(true)}>
              + {overflowCount} more
            </button>
          )}
        </>
      )}
    </div>
  );

  return (
    <div className={styles.body}>
      {blockField(
        <FormInput
          name="agentName"
          type="text"
          label="Agent name"
          value={values.agentName}
          onChange={set('agentName')}
          required
          readOnly={inputReadOnly}
          disabled={inputDisabled}
        />,
      )}
      {blockField(
        <TextArea
          name="goals"
          label="Goals"
          value={values.goals}
          onChange={set('goals')}
          required
          noFloatingLabel
          rows={6}
          readOnly={inputReadOnly}
          disabled={inputDisabled}
          placeholder="Example: Respond to every new customer review within 24 hours with a reply"
        />,
      )}
      {blockField(locationsField)}
    </div>
  );
}
