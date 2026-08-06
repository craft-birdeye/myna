import React, { useState, useEffect } from 'react';
import FieldPickerModal from '../../Modals/FieldPickerModal/FieldPickerModal';
import VariableChip, { DataTypeIcon } from '../../../Molecules/Inputs/VariableChip/VariableChip';
import { SingleSelect } from '../../../elemental-stubs';
import { getProcedureDetail } from '../shared/procedureDetails';
import {
  NativeDrawer,
  ProcedureDetailView,
  FieldLabel,
  Checkbox,
  Toggle,
  HEALTHCARE_PROCEDURE_LIBRARY,
  ProcedureSelectField,
  ProcedureMultiSelectField,
} from '../shared/DrawerShared';
import './VoiceCallToolDrawer.css';

/* ── option helpers ── */
const toOpts = (arr) => arr.map((v) => ({ value: v, label: v }));

const ATTEMPT_OPTIONS   = toOpts(Array.from({ length: 5 },  (_, i) => String(i + 1)));
const INTERVAL_OPTIONS  = toOpts(Array.from({ length: 48 }, (_, i) => String(i + 1)));
const INTERVAL_UNIT_OPTIONS = toOpts(['Minutes', 'Hours', 'Days']);
const CALL_FROM_OPTIONS = [
  { value: 'location-number', label: 'Location number' },
  { value: 'main-number',     label: 'Main number'     },
];

const DENTAL_PROCEDURE_OPTIONS = [
  'Hygiene recall procedure',
  'Payment reminder procedure',
  'Treatment plan coordinator procedure',
  'Front desk intake procedure',
];

const AUTOMOTIVE_PROCEDURE_OPTIONS = [
  'Appointment confirmation',
  'Service reminder procedure',
  'Recall notice procedure',
  'Front desk intake procedure',
];

const DEFAULT_CONTEXT_VARS = [
  { value: 'Appointment ID',   name: 'Appointment ID' },
  { value: 'Patient ID',       name: 'Patient ID' },
  { value: 'Provider ID',      name: 'Provider ID' },
  { value: 'Diagnosis Code',   name: 'Diagnosis Code' },
  { value: 'Appointment_Type', name: 'Appointment_Type' },
];

function VoicemailTextarea({ value, onChange, placeholder }) {
  return (
    <div className="vctd__textarea-wrap">
      <textarea
        className="vctd__textarea"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
      />
      <button type="button" className="vctd__var-btn" title="Insert variable" aria-label="Insert variable">
        <DataTypeIcon />
      </button>
    </div>
  );
}

/* Starting procedure: healthcare gets the shared searchable ProcedureSelectField; automotive/
   dental keep their legacy flat-list behavior (no search, static option list). */
function StartingProcedureField({ value, options, onChange, onView, richList = false, library = [] }) {
  const [open, setOpen] = useState(false);

  if (richList) {
    return (
      <ProcedureSelectField
        value={value}
        library={library}
        onChange={onChange}
        onView={onView}
        placeholder="Select a procedure"
      />
    );
  }

  const selectedOption = options.find((opt) => opt.value === value);

  if (!value) {
    return (
      <div className="vctd__procedure-select-wrap">
        <SingleSelect
          name="startingProcedure"
          selected={value}
          options={options}
          placeholder="Select a procedure"
          onChange={(opt) => onChange(opt.value)}
        />
      </div>
    );
  }

  return (
    <div className="ds__procedure-field-wrap">
      <div className="ds__procedure-field">
        <div
          className="ds__procedure-pill"
          role="button"
          tabIndex={0}
          onClick={() => onView(value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onView(value); }
          }}
        >
          <VariableChip
            value={selectedOption?.label ?? value}
            type="product"
            readOnly
            onDelete={() => onChange('')}
          />
        </div>
        <button
          type="button"
          className="ds__procedure-chevron"
          aria-label="Change starting procedure"
          onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
        >
          <span className="material-symbols-outlined">{open ? 'expand_less' : 'expand_more'}</span>
        </button>
      </div>
      {open && (
        <>
          <div className="ds__procedure-overlay" onClick={() => setOpen(false)} />
          <div className="ds__procedure-menu">
            {options.map((opt) => (
              <button
                type="button"
                key={opt.value}
                className="ds__procedure-menu-item"
                onClick={() => { onChange(opt.value); setOpen(false); }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* Convert nodeDetails.contextItems ({ id, label, variable }) → drawer format ({ value, name }) */
function contextItemsToVars(items) {
  if (!Array.isArray(items) || items.length === 0) return [];
  return items.map((item) => ({ value: item.variable ?? item.value ?? '', name: item.label ?? item.name ?? '' }));
}

/* ...and back — drawer format ({ value, name }) → nodeDetails.contextItems ({ id, label, variable }) */
function varsToContextItems(vars) {
  return vars.map((v) => ({ id: v.value, label: v.name || v.value, variable: v.value }));
}

export default function VoiceCallToolDrawer({ isOpen, onClose, initialValues = {}, product = 'automotive', onFieldChange }) {
  const isDental = product === 'dental';
  const isHealthcare = product === 'healthcare';

  const [hasPhoneChip,     setHasPhoneChip]     = useState(true);
  const [callFrom,         setCallFrom]          = useState('');
  const [startingProcedure, setStartingProcedure] = useState('');
  const [additionalProcedures, setAdditionalProcedures] = useState([]);
  const [routeToFrontdesk, setRouteToFrontdesk]  = useState(false);
  const [retryNoAnswer,    setRetryNoAnswer]     = useState(true);
  const [retryRejected,    setRetryRejected]     = useState(false);
  const [retryVoicemail,   setRetryVoicemail]    = useState(true);
  const [voicemailMsg,     setVoicemailMsg]      = useState('');
  const [maxAttempts,      setMaxAttempts]       = useState('2');
  const [retryInterval,    setRetryInterval]     = useState('24');
  const [retryUnit,        setRetryUnit]         = useState('Hours');
  const [contextVariables, setContextVariables]  = useState([]);
  const [fieldPickerOpen,  setFieldPickerOpen]   = useState(false);
  const [viewingProcedureId, setViewingProcedureId] = useState(null);
  const [procedureOverrides, setProcedureOverrides] = useState({});
  const [retrySettingsOpen, setRetrySettingsOpen] = useState(true);

  useEffect(() => {
    if (!isOpen) return;
    setViewingProcedureId(null);
    setProcedureOverrides({});
    setStartingProcedure(initialValues.startingProcedure ?? 'Appointment confirmation');
    setAdditionalProcedures(Array.isArray(initialValues.additionalProcedures) ? initialValues.additionalProcedures : []);
    setRouteToFrontdesk(initialValues.routeToFrontdesk ?? true);
    setRetryNoAnswer(initialValues.retrySettings?.noAnswer ?? true);
    setRetryRejected(initialValues.retrySettings?.callRejected ?? false);
    setRetryVoicemail(initialValues.retrySettings?.voiceMail ?? true);
    setVoicemailMsg(initialValues.voicemailMessage ?? '');
    setMaxAttempts(String(initialValues.maxAttempts ?? '2'));
    setRetryInterval(String(initialValues.retryInterval ?? '24'));
    setRetryUnit(initialValues.retryIntervalUnit ?? 'Hours');
    const initialContextVars = contextItemsToVars(initialValues.contextItems);
    setContextVariables(initialContextVars.length > 0 ? initialContextVars : DEFAULT_CONTEXT_VARS);
    setHasPhoneChip(true);
    setCallFrom(initialValues.callFrom ?? '');
  }, [isOpen, initialValues]);

  const handleSave = () => {
    onFieldChange?.('callFrom', callFrom);
    onFieldChange?.('startingProcedure', startingProcedure);
    if (isHealthcare) {
      onFieldChange?.('additionalProcedures', additionalProcedures);
    } else {
      onFieldChange?.('routeToFrontdesk', routeToFrontdesk);
    }
    onFieldChange?.('retrySettings', { noAnswer: retryNoAnswer, callRejected: retryRejected, voiceMail: retryVoicemail });
    onFieldChange?.('voicemailMessage', voicemailMsg);
    onFieldChange?.('maxAttempts', maxAttempts);
    onFieldChange?.('retryInterval', retryInterval);
    onFieldChange?.('retryIntervalUnit', retryUnit);
    onFieldChange?.('contextItems', varsToContextItems(contextVariables));
    onClose();
  };

  const procedureOptions = isHealthcare
    ? toOpts(HEALTHCARE_PROCEDURE_LIBRARY.map((p) => p.id))
    : toOpts(Array.from(new Set([
        ...(initialValues.startingProcedure ? [initialValues.startingProcedure] : []),
        ...(isDental ? DENTAL_PROCEDURE_OPTIONS : AUTOMOTIVE_PROCEDURE_OPTIONS),
      ])));

  const additionalProceduresLibrary = HEALTHCARE_PROCEDURE_LIBRARY.filter((p) => p.id !== startingProcedure);

  const procedureDetail = viewingProcedureId
    ? (procedureOverrides[viewingProcedureId] ?? getProcedureDetail(viewingProcedureId, product))
    : null;

  if (procedureDetail) {
    return (
      <NativeDrawer isOpen={isOpen} onClose={onClose}>
        <ProcedureDetailView
          procedureDetail={procedureDetail}
          onBack={() => setViewingProcedureId(null)}
          onSave={(edited) => setProcedureOverrides((prev) => ({ ...prev, [viewingProcedureId]: edited }))}
        />
      </NativeDrawer>
    );
  }

  return (
    <NativeDrawer isOpen={isOpen} onClose={onClose}>
      <div className="vctd">
        <div className="vctd__header vctd__header--main">
          <div className="vctd__header-left">
            <button type="button" className="vctd__back" onClick={onClose} aria-label="Back">
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>arrow_back</span>
            </button>
            <div className="vctd__header-titles">
              <span className="vctd__title">Initiate voice call</span>
              <span className="vctd__subtitle">
                Configure an outbound voice call. Manage your{' '}
                <button type="button" className="vctd__subtitle-link">voice call settings</button>
              </span>
            </div>
          </div>
          <button type="button" className="vctd__save" onClick={handleSave}>Save</button>
        </div>

        <div className="vctd__body">

          {/* Phone number */}
          <div className="vctd__field">
            <FieldLabel>Phone number</FieldLabel>
            <div className="vctd__chip-field">
              {hasPhoneChip ? (
                <VariableChip
                  value="Contact.PhoneNumber"
                  type="variable"
                  onDelete={() => setHasPhoneChip(false)}
                />
              ) : (
                <span className="ds__label" style={{ color: '#9e9e9e' }}>Add variable…</span>
              )}
            </div>
          </div>

          {/* Call from */}
          <div className="vctd__field">
            <FieldLabel tooltip="The outbound number shown to the patient on the call">Call from</FieldLabel>
            <SingleSelect
              name="callFrom"
              selected={callFrom}
              options={CALL_FROM_OPTIONS}
              placeholder="Select a caller ID"
              onChange={(opt) => setCallFrom(opt.value)}
            />
          </div>

          {/* Starting procedure */}
          <div className="vctd__field">
            <FieldLabel tooltip="Sets how the agent starts the conversation">Starting procedure</FieldLabel>
            <StartingProcedureField
              value={startingProcedure}
              options={procedureOptions}
              onChange={setStartingProcedure}
              onView={setViewingProcedureId}
              richList={isHealthcare}
              library={HEALTHCARE_PROCEDURE_LIBRARY}
            />
          </div>

          {/* Additional procedures (healthcare only) */}
          {isHealthcare && (
            <div className="vctd__field">
              <FieldLabel tooltip="Other procedures the agent can reference during this call">Additional procedures</FieldLabel>
              <ProcedureMultiSelectField
                value={additionalProcedures}
                library={additionalProceduresLibrary}
                onApply={setAdditionalProcedures}
                onView={setViewingProcedureId}
              />
            </div>
          )}

          {/* Route to front desk (not shown for healthcare) */}
          {!isHealthcare && (
            <Toggle
              label="Route to front desk agent"
              subtext={`Anything outside the selected procedures is handed off to the front desk agent for the location`}
              tooltip="Turn off to keep the agent limited to the selected procedures only"
              checked={routeToFrontdesk}
              onChange={setRouteToFrontdesk}
            />
          )}

          {/* Context */}
          <div className="vctd__field">
            <FieldLabel tooltip="Uses your brand voice and industry knowledge to generate accurate responses">Context</FieldLabel>
            <div className="vctd__context-box">
              {contextVariables.length === 0 ? (
                <div className="vctd__context-footer">
                  <button
                    type="button"
                    className="vctd__context-add-btn"
                    onClick={() => setFieldPickerOpen(true)}
                  >
                    <span
                      className="material-symbols-outlined"
                      style={{ fontSize: 16, fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}
                    >
                      add_circle
                    </span>
                    Add
                  </button>
                </div>
              ) : (
                <div className="vctd__context-chips">
                  {contextVariables.map((item, i) => (
                    <VariableChip
                      key={`${item.value}-${i}`}
                      value={item.value}
                      type="variable"
                      onDelete={() => setContextVariables((prev) => prev.filter((_, idx) => idx !== i))}
                    />
                  ))}
                </div>
              )}
              <div className="vctd__context-footer">
                <button type="button" className="vctd__context-add-btn" onClick={() => setFieldPickerOpen(true)}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16, fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}>
                    add_circle
                  </span>
                  Add
                </button>
              </div>
            </div>
          </div>

          {/* Retry settings + Retry attempts */}
          <div className="vctd__retry-card">
            <button
              type="button"
              className="vctd__retry-card-header"
              onClick={() => setRetrySettingsOpen((o) => !o)}
              aria-expanded={retrySettingsOpen}
            >
              <span className="vctd__section-title">Retry settings</span>
              <span className={`material-symbols-outlined vctd__retry-card-chevron${retrySettingsOpen ? '' : ' vctd__retry-card-chevron--closed'}`}>
                expand_more
              </span>
            </button>

            {retrySettingsOpen && (
              <div className="vctd__retry-card-body">
                <div className="vctd__section-desc">
                  Automatically retry if the patient doesn&apos;t connect on the first attempt.
                </div>

                <div className="vctd__checkbox-row">
                  <Checkbox checked={retryNoAnswer}  onChange={setRetryNoAnswer}  label="No answer"     />
                  <Checkbox checked={retryRejected}  onChange={setRetryRejected}  label="Call rejected" />
                  <Checkbox checked={retryVoicemail} onChange={setRetryVoicemail} label="Voicemail"     />
                </div>

                {retryVoicemail && (
                  <div className="vctd__voicemail-block">
                    <div className="vctd__section-desc">Leave a message if the call goes to voicemail.</div>
                    <VoicemailTextarea value={voicemailMsg} onChange={setVoicemailMsg} placeholder="Enter your message here" />
                  </div>
                )}

                <div className="vctd__section vctd__section--nested">
                  <div className="vctd__section-title">Retry attempts</div>
                  <div className="vctd__retry-grid">
                    <div className="vctd__field">
                      <FieldLabel>Max attempts</FieldLabel>
                      <SingleSelect
                        name="maxAttempts"
                        selected={maxAttempts}
                        options={ATTEMPT_OPTIONS}
                        onChange={(opt) => setMaxAttempts(opt.value)}
                      />
                    </div>
                    <div className="vctd__field">
                      <FieldLabel>Interval between retries</FieldLabel>
                      <SingleSelect
                        name="retryInterval"
                        selected={retryInterval}
                        options={INTERVAL_OPTIONS}
                        onChange={(opt) => setRetryInterval(opt.value)}
                      />
                    </div>
                    <div className="vctd__field">
                      <span className="ds__label vctd__label--spacer" aria-hidden="true">&nbsp;</span>
                      <SingleSelect
                        name="retryUnit"
                        selected={retryUnit}
                        options={INTERVAL_UNIT_OPTIONS}
                        onChange={(opt) => setRetryUnit(opt.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>

      {fieldPickerOpen && (
        <FieldPickerModal
          overlayZIndex={10000}
          showTriggerFields
          onClose={() => setFieldPickerOpen(false)}
          onSelectField={(value, name) => {
            setContextVariables((prev) => {
              if (prev.some((v) => v.value === value)) return prev;
              return [...prev, { value, name }];
            });
            setFieldPickerOpen(false);
          }}
        />
      )}
    </NativeDrawer>
  );
}
