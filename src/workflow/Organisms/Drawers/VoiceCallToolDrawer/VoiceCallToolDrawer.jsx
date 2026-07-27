import React, { useState, useEffect } from 'react';
import FieldPickerModal from '../../Modals/FieldPickerModal/FieldPickerModal';
import VariableChip, { DataTypeIcon } from '../../../Molecules/Inputs/VariableChip/VariableChip';
import { SingleSelect } from '../../../elemental-stubs';
import { getVoiceCallProcedureDetail } from './voiceCallProcedureDetails';
import ProcedureDetailBody from '../../Panels/RHS/ProcedureDetailBody';
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


function NativeDrawer({ isOpen, onClose, children }) {
  if (!isOpen) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', justifyContent: 'flex-end' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)' }} />
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          width: 650,
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

function InfoTooltip({ text }) {
  const [show, setShow] = useState(false);
  if (!text) return null;
  return (
    <span
      className="vctd__info-wrap"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <span className="material-symbols-outlined vctd__info" aria-hidden="true">info</span>
      {show && <span className="vctd__tooltip">{text}</span>}
    </span>
  );
}

function FieldLabel({ children, tooltip }) {
  return (
    <div className="vctd__label-row">
      <span className="vctd__label">{children}</span>
      <InfoTooltip text={tooltip} />
    </div>
  );
}

function Checkbox({ checked, onChange, label }) {
  return (
    <label className="vctd__checkbox">
      <span
        role="checkbox"
        aria-checked={checked}
        tabIndex={0}
        className={`vctd__checkbox-box${checked ? ' vctd__checkbox-box--checked' : ''}`}
        onClick={() => onChange(!checked)}
        onKeyDown={(e) => {
          if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); onChange(!checked); }
        }}
      >
        {checked && <span className="material-symbols-outlined">check</span>}
      </span>
      {label}
    </label>
  );
}

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

function Toggle({ label, subtext, tooltip, checked, onChange }) {
  return (
    <div className="vctd__toggle-row">
      <div className="vctd__toggle-text">
        <div className="vctd__label-row">
          <span className="vctd__label">{label}</span>
          <InfoTooltip text={tooltip} />
        </div>
        {subtext && <span className="vctd__toggle-subtext">{subtext}</span>}
      </div>
      <button
        type="button"
        className={`vctd__toggle${checked ? ' vctd__toggle--on' : ''}`}
        onClick={() => onChange(!checked)}
        aria-pressed={checked}
      >
        <span className="vctd__toggle-thumb" />
      </button>
    </div>
  );
}

function StartingProcedureField({ value, options, onChange, onView }) {
  const [open, setOpen] = useState(false);
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
    <div className="vctd__procedure-field-wrap">
      <div className="vctd__procedure-field">
        <div
          className="vctd__procedure-pill"
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
          className="vctd__procedure-chevron"
          aria-label="Change starting procedure"
          onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
        >
          <span className="material-symbols-outlined">{open ? 'expand_less' : 'expand_more'}</span>
        </button>
      </div>
      {open && (
        <>
          <div className="vctd__procedure-overlay" onClick={() => setOpen(false)} />
          <div className="vctd__procedure-menu">
            {options.map((opt) => (
              <button
                type="button"
                key={opt.value}
                className="vctd__procedure-menu-item"
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

export default function VoiceCallToolDrawer({ isOpen, onClose, initialValues = {}, product = 'automotive' }) {
  const isDental = product === 'dental';

  const [hasPhoneChip,     setHasPhoneChip]     = useState(true);
  const [callFrom,         setCallFrom]          = useState('');
  const [startingProcedure, setStartingProcedure] = useState('');
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

  useEffect(() => {
    if (!isOpen) return;
    setViewingProcedureId(null);
    setStartingProcedure(initialValues.startingProcedure ?? 'Appointment confirmation');
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

  const procedureOptions = toOpts(Array.from(new Set([
    ...(initialValues.startingProcedure ? [initialValues.startingProcedure] : []),
    ...(isDental ? DENTAL_PROCEDURE_OPTIONS : AUTOMOTIVE_PROCEDURE_OPTIONS),
  ])));

  const procedureDetail = viewingProcedureId
    ? getVoiceCallProcedureDetail(viewingProcedureId, product)
    : null;

  if (procedureDetail) {
    return (
      <NativeDrawer isOpen={isOpen} onClose={onClose}>
        <div className="vctd">
          <div className="vctd__header">
            <div className="vctd__header-left">
              <button type="button" className="vctd__back" onClick={() => setViewingProcedureId(null)} aria-label="Back">
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>arrow_back</span>
              </button>
              <span className="vctd__title">{procedureDetail.name}</span>
            </div>
            <div className="vctd__header-actions">
              <button type="button" className="vctd__cancel" onClick={() => setViewingProcedureId(null)}>Cancel</button>
              <span className="vctd__save-split">
                <button type="button" className="vctd__save vctd__save--split" onClick={() => setViewingProcedureId(null)}>Save</button>
                <button type="button" className="vctd__save vctd__save-chevron" aria-label="More save options">
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>expand_more</span>
                </button>
              </span>
            </div>
          </div>

          <div className="vctd__body vctd__body--procedure-detail">
            <ProcedureDetailBody
              initialValues={procedureDetail}
              onFieldChange={() => {}}
              showTypeField
              whenToUseLabel="When to use this procedure?"
              contextLibraryStyle
              onOpenToolDrawer={() => {}}
            />
          </div>
        </div>
      </NativeDrawer>
    );
  }

  return (
    <NativeDrawer isOpen={isOpen} onClose={onClose}>
      <div className="vctd">
        <div className="vctd__header">
          <div className="vctd__header-left">
            <button type="button" className="vctd__back" onClick={onClose} aria-label="Back">
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>arrow_back</span>
            </button>
            <span className="vctd__title">Initiate voice call</span>
          </div>
          <button type="button" className="vctd__save" onClick={onClose}>Save</button>
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
                <span className="vctd__label" style={{ color: '#9e9e9e' }}>Add variable…</span>
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
            />
          </div>

          {/* Route to front desk */}
          <Toggle
            label="Route to front desk agent"
            subtext={`Anything outside the selected procedures is handed off to the front desk agent for the location`}
            tooltip="Turn off to keep the agent limited to the selected procedures only"
            checked={routeToFrontdesk}
            onChange={setRouteToFrontdesk}
          />

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

          {/* Retry settings */}
          <div className="vctd__section">
            <div>
              <div className="vctd__section-title">Retry settings</div>
              <div className="vctd__section-desc">
                Automatically retry if the customer doesn&apos;t connect on the first attempt.
              </div>
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
          </div>

          {/* Retry attempts */}
          <div className="vctd__section">
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
                <span className="vctd__label vctd__label--spacer" aria-hidden="true">&nbsp;</span>
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
