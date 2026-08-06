import React, { useState, useEffect, useRef } from 'react';
import { SingleSelect } from '../../../elemental-stubs';
import { getProcedureDetail } from '../shared/procedureDetails';
import {
  NativeDrawer,
  ProcedureDetailView,
  FieldLabel,
  Checkbox,
  Radio,
  ProcedureSelectField,
  ProcedureMultiSelectField,
  HEALTHCARE_PROCEDURE_LIBRARY,
} from '../shared/DrawerShared';
import './ReminderToolDrawer.css';

const toOpts = (arr) => arr.map((v) => ({ value: v, label: v }));

const DURATION_OPTIONS = toOpts(Array.from({ length: 30 }, (_, i) => String(i + 1)));
const WHEN_OPTIONS = [
  { value: 'hours', label: 'Hours before' },
  { value: 'days',  label: 'Days before'  },
  { value: 'weeks', label: 'Weeks before' },
];
const UNIT_WORD = { hours: 'hour', days: 'day', weeks: 'week' };

const EMAIL_TEMPLATE_OPTIONS = [
  { value: 'appointment-reminder',          label: 'Appointment reminder' },
  { value: 'appointment-reminder-friendly', label: 'Appointment reminder (friendly)' },
];
const TEXT_TEMPLATE_OPTIONS = [
  { value: 'text-reminder',       label: 'Text reminder' },
  { value: 'text-reminder-short', label: 'SMS reminder (short)' },
];
const VOICE_OPTIONS = [
  { value: 'andrea', label: 'Andrea (warm, clear, reassuring)' },
  { value: 'james',  label: 'James (calm, professional)' },
  { value: 'maria',  label: 'Maria (friendly, upbeat)' },
];

const SCHEDULE_RELATIVE_OPTIONS = [
  { value: 'appointment-date', label: 'Appointment date' },
  { value: 'booking-date',     label: 'Booking date' },
];
const SEND_AT_OPTIONS = [
  { value: 'appointment-time', label: 'Appointment time' },
  { value: '9am',              label: '9:00 AM' },
  { value: '10am',             label: '10:00 AM' },
];
const SEND_DAYS_OPTIONS = [
  { value: 'mon-fri',    label: 'Mon, Tue, Wed, Thu, Fri' },
  { value: 'every-day',  label: 'Every day' },
  { value: 'weekdays',   label: 'Weekdays only' },
];

const DEFAULT_REMINDERS = [
  { id: 1, duration: '3',  unit: 'weeks' },
  { id: 2, duration: '3',  unit: 'days'  },
  { id: 3, duration: '24', unit: 'hours' },
];

function reminderLabel({ duration, unit }) {
  const n = Number(duration);
  const word = UNIT_WORD[unit] || unit;
  return `${duration} ${word}${n === 1 ? '' : 's'} before appointment`;
}

/* ─── Reminder list row — always-visible edit/delete actions ─── */
function ReminderRow({ item, onEdit, onDelete }) {
  return (
    <div className="rtd__reminder-row">
      <span className="ds__label">{reminderLabel(item)}</span>
      <div className="rtd__reminder-row-actions">
        <button type="button" className="rtd__icon-btn" onClick={onEdit} aria-label="Edit reminder">
          <span className="material-symbols-outlined">edit</span>
        </button>
        <button type="button" className="rtd__icon-btn" onClick={onDelete} aria-label="Delete reminder">
          <span className="material-symbols-outlined">delete</span>
        </button>
      </div>
    </div>
  );
}

/* ─── Inline Duration/When editor — used for both "edit" and "+ Add" ─── */
function ReminderEditForm({ initial, onSave, onCancel }) {
  const [duration, setDuration] = useState(initial?.duration ?? '2');
  const [unit, setUnit] = useState(initial?.unit ?? 'days');

  return (
    <div className="rtd__reminder-edit">
      <div className="rtd__reminder-edit-fields">
        <div className="ds__field">
          <FieldLabel>Duration</FieldLabel>
          <SingleSelect name="duration" selected={duration} options={DURATION_OPTIONS} onChange={(opt) => setDuration(opt.value)} />
        </div>
        <div className="ds__field">
          <FieldLabel>When</FieldLabel>
          <SingleSelect name="unit" selected={unit} options={WHEN_OPTIONS} onChange={(opt) => setUnit(opt.value)} />
        </div>
      </div>
      <div className="rtd__reminder-edit-actions">
        <button type="button" className="ds__cancel" onClick={onCancel}>Cancel</button>
        <button type="button" className="rtd__save-outline" onClick={() => onSave({ duration, unit })}>Save</button>
      </div>
    </div>
  );
}

/* ─── Collapsible bordered card, matching Initiate voice call's Retry settings card ─── */
function AccordionCard({ title, subtitle, open, onToggle, children }) {
  return (
    <div className="rtd__card">
      <button type="button" className="rtd__card-header" onClick={onToggle} aria-expanded={open}>
        <div className="rtd__card-header-text">
          <span className="ds__label">{title}</span>
          {subtitle && <span className="rtd__card-subtitle">{subtitle}</span>}
        </div>
        <span className={`material-symbols-outlined rtd__card-chevron${open ? ' rtd__card-chevron--open' : ''}`}>
          expand_more
        </span>
      </button>
      {open && <div className="rtd__card-body">{children}</div>}
    </div>
  );
}

function AutoTextarea({ value, onChange, placeholder }) {
  return (
    <textarea
      className="rtd__textarea"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  );
}

export default function ReminderToolDrawer({ isOpen, onClose, initialValues = {}, onFieldChange }) {
  const [reminders, setReminders] = useState(DEFAULT_REMINDERS);
  const [editingId, setEditingId] = useState(null);
  const nextId = useRef(4);

  const [channels, setChannels] = useState({ email: true, text: true, voice: true });
  const [emailTemplate, setEmailTemplate] = useState('');
  const [textTemplate, setTextTemplate] = useState('');
  const [primaryProcedure, setPrimaryProcedure] = useState('');
  const [additionalProcedures, setAdditionalProcedures] = useState([]);

  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [voiceOption, setVoiceOption] = useState('andrea');
  const [greetingMessage, setGreetingMessage] = useState('');
  const [recordingMode, setRecordingMode] = useState('consent');
  const [consentMessage, setConsentMessage] = useState('');

  const [messageCardOpen, setMessageCardOpen] = useState(true);
  const [scheduleCardOpen, setScheduleCardOpen] = useState(true);
  const [scheduleRelativeTo, setScheduleRelativeTo] = useState('appointment-date');
  const [sendAt, setSendAt] = useState('appointment-time');
  const [sendDays, setSendDays] = useState('mon-fri');
  const [viewingProcedureId, setViewingProcedureId] = useState(null);
  const [procedureOverrides, setProcedureOverrides] = useState({});

  useEffect(() => {
    if (!isOpen) return;
    setViewingProcedureId(null);
    setProcedureOverrides({});
    const seedReminders = Array.isArray(initialValues.reminders) && initialValues.reminders.length > 0
      ? initialValues.reminders
      : DEFAULT_REMINDERS;
    setReminders(seedReminders.map((r, i) => ({ id: r.id ?? i + 1, duration: String(r.duration ?? '1'), unit: r.unit ?? 'days' })));
    nextId.current = Math.max(0, ...seedReminders.map((r, i) => r.id ?? i + 1)) + 1;
    setEditingId(null);
    setChannels(initialValues.channels ?? { email: true, text: true, voice: true });
    setEmailTemplate(initialValues.emailTemplate ?? '');
    setTextTemplate(initialValues.textTemplate ?? '');
    setPrimaryProcedure(initialValues.primaryProcedure ?? '');
    setAdditionalProcedures(Array.isArray(initialValues.additionalProcedures) ? initialValues.additionalProcedures : []);
    setVoiceOption(initialValues.voiceOption ?? 'andrea');
    setGreetingMessage(initialValues.greetingMessage ?? 'Hi, this is Myna, your virtual assistant, calling about your upcoming appointment. Do you have a moment to confirm the details?');
    setRecordingMode(initialValues.recordingMode ?? 'consent');
    setConsentMessage(initialValues.consentMessage ?? 'This call may be recorded for quality and training purposes.');
    setScheduleRelativeTo(initialValues.scheduleRelativeTo ?? 'appointment-date');
    setSendAt(initialValues.sendAt ?? 'appointment-time');
    setSendDays(initialValues.sendDays ?? 'mon-fri');
  }, [isOpen, initialValues]);

  const additionalProceduresLibrary = HEALTHCARE_PROCEDURE_LIBRARY.filter((p) => p.id !== primaryProcedure);

  const handleSaveReminder = (data) => {
    if (editingId === 'new') {
      setReminders((prev) => [...prev, { ...data, id: nextId.current++ }]);
    } else {
      setReminders((prev) => prev.map((r) => (r.id === editingId ? { ...r, ...data } : r)));
    }
    setEditingId(null);
  };

  const handleSave = () => {
    onFieldChange?.('reminders', reminders.map(({ duration, unit }) => ({ duration, unit })));
    onFieldChange?.('channels', channels);
    onFieldChange?.('emailTemplate', emailTemplate);
    onFieldChange?.('textTemplate', textTemplate);
    onFieldChange?.('primaryProcedure', primaryProcedure);
    onFieldChange?.('additionalProcedures', additionalProcedures);
    onFieldChange?.('voiceOption', voiceOption);
    onFieldChange?.('greetingMessage', greetingMessage);
    onFieldChange?.('recordingMode', recordingMode);
    onFieldChange?.('consentMessage', consentMessage);
    onFieldChange?.('scheduleRelativeTo', scheduleRelativeTo);
    onFieldChange?.('sendAt', sendAt);
    onFieldChange?.('sendDays', sendDays);

    const joinWithAnd = (items) =>
      items.length <= 1 ? (items[0] ?? '') : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;

    const activeChannelLabels = ['email', 'text', 'voice'].filter((c) => channels[c]).map((c) => c[0].toUpperCase() + c.slice(1));
    const channelLabel = activeChannelLabels.length > 2
      ? `${activeChannelLabels.slice(0, -1).join(', ')} & ${activeChannelLabels[activeChannelLabels.length - 1]}`
      : activeChannelLabels.join(' & ');
    const reminderLabels = reminders.map((r) => `${r.duration} ${UNIT_WORD[r.unit]}${Number(r.duration) === 1 ? '' : 's'}`);
    const reminderLabelShort = joinWithAnd(reminderLabels);
    onFieldChange?.('description', `${reminderLabelShort} before${channelLabel ? ` · ${channelLabel}` : ''}`);

    onClose();
  };

  const procedureDetail = viewingProcedureId
    ? (procedureOverrides[viewingProcedureId] ?? getProcedureDetail(viewingProcedureId, 'healthcare'))
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
      <div className="rtd">
        <div className="rtd__header">
          <div className="rtd__header-left">
            <button type="button" className="rtd__back" onClick={onClose} aria-label="Back">
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>arrow_back</span>
            </button>
            <span className="rtd__title">Reminder tool</span>
          </div>
          <button type="button" className="rtd__save" onClick={handleSave}>Save</button>
        </div>

        <div className="rtd__body">

          {/* Reminder */}
          <div className="rtd__card">
            <div className="rtd__card-header rtd__card-header--static">
              <div className="rtd__card-header-text">
                <span className="ds__label">Reminder</span>
                <span className="rtd__card-subtitle">Setup one or more reminders</span>
              </div>
            </div>
            <div className="rtd__card-body">
              {reminders.map((r) => (
                editingId === r.id ? (
                  <ReminderEditForm key={r.id} initial={r} onSave={handleSaveReminder} onCancel={() => setEditingId(null)} />
                ) : (
                  <ReminderRow key={r.id} item={r} onEdit={() => setEditingId(r.id)} onDelete={() => setReminders((prev) => prev.filter((x) => x.id !== r.id))} />
                )
              ))}

              {editingId === 'new' && (
                <ReminderEditForm initial={null} onSave={handleSaveReminder} onCancel={() => setEditingId(null)} />
              )}

              {editingId === null && (
                <button type="button" className="rtd__add-btn" onClick={() => setEditingId('new')}>
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add_circle</span>
                  Add
                </button>
              )}
            </div>
          </div>

          {/* Channel and message content */}
          <AccordionCard
            title="Channel and message content"
            subtitle="Select channels and communication templates"
            open={messageCardOpen}
            onToggle={() => setMessageCardOpen((o) => !o)}
          >
            <div className="rtd__channel-block">
              <Checkbox checked={channels.email} onChange={(v) => setChannels((prev) => ({ ...prev, email: v }))} label="Email" />
              {channels.email && (
                <div className="rtd__channel-content">
                  <SingleSelect
                    name="emailTemplate"
                    selected={emailTemplate}
                    options={EMAIL_TEMPLATE_OPTIONS}
                    placeholder="Select email template"
                    onChange={(opt) => setEmailTemplate(opt.value)}
                  />
                </div>
              )}
            </div>

            <div className="rtd__channel-block">
              <Checkbox checked={channels.text} onChange={(v) => setChannels((prev) => ({ ...prev, text: v }))} label="Text" />
              {channels.text && (
                <div className="rtd__channel-content">
                  <SingleSelect
                    name="textTemplate"
                    selected={textTemplate}
                    options={TEXT_TEMPLATE_OPTIONS}
                    placeholder="Select text template"
                    onChange={(opt) => setTextTemplate(opt.value)}
                  />
                </div>
              )}
            </div>

            <div className="rtd__channel-block">
              <Checkbox checked={channels.voice} onChange={(v) => setChannels((prev) => ({ ...prev, voice: v }))} label="Voice" />
              {channels.voice && (
                <div className="rtd__channel-content">
                  <ProcedureSelectField
                    value={primaryProcedure}
                    library={HEALTHCARE_PROCEDURE_LIBRARY}
                    onChange={setPrimaryProcedure}
                    onView={setViewingProcedureId}
                    placeholder="Select primary procedure"
                  />
                  <ProcedureMultiSelectField
                    value={additionalProcedures}
                    library={additionalProceduresLibrary}
                    onApply={setAdditionalProcedures}
                    onView={setViewingProcedureId}
                    placeholder="Select additional procedure/s"
                  />

                  <button type="button" className="rtd__advanced-toggle" onClick={() => setAdvancedOpen((o) => !o)} aria-expanded={advancedOpen}>
                    Advanced settings
                    <span className={`material-symbols-outlined rtd__card-chevron${advancedOpen ? ' rtd__card-chevron--open' : ''}`}>
                      expand_more
                    </span>
                  </button>

                  {advancedOpen && (
                    <div className="rtd__advanced-body">
                      <div className="ds__field">
                        <FieldLabel>Voice</FieldLabel>
                        <SingleSelect
                          name="voiceOption"
                          selected={voiceOption}
                          options={VOICE_OPTIONS}
                          onChange={(opt) => setVoiceOption(opt.value)}
                        />
                      </div>

                      <div className="ds__field">
                        <FieldLabel required>Greeting message</FieldLabel>
                        <AutoTextarea value={greetingMessage} onChange={setGreetingMessage} placeholder="Enter greeting message" />
                      </div>

                      <div className="rtd__recording-block">
                        <div className="ds__field" style={{ gap: 2 }}>
                          <span className="ds__label">Recording</span>
                          <span className="rtd__card-subtitle">Configure consent wording in each channel settings below</span>
                        </div>
                        <Radio checked={recordingMode === 'off'} onChange={() => setRecordingMode('off')} label="Off" />
                        <Radio checked={recordingMode === 'consent'} onChange={() => setRecordingMode('consent')} label="Record with announced consent" />
                        {recordingMode === 'consent' && (
                          <div className="rtd__consent-field ds__field">
                            <FieldLabel>Consent message</FieldLabel>
                            <AutoTextarea value={consentMessage} onChange={setConsentMessage} placeholder="Enter consent message" />
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </AccordionCard>

          {/* Schedule */}
          <AccordionCard
            title="Schedule"
            subtitle="Setup timing and sending time"
            open={scheduleCardOpen}
            onToggle={() => setScheduleCardOpen((o) => !o)}
          >
            <div className="ds__field">
              <FieldLabel>Schedule relative to</FieldLabel>
              <SingleSelect
                name="scheduleRelativeTo"
                selected={scheduleRelativeTo}
                options={SCHEDULE_RELATIVE_OPTIONS}
                onChange={(opt) => setScheduleRelativeTo(opt.value)}
              />
            </div>
            <div className="ds__field">
              <FieldLabel>Send at</FieldLabel>
              <SingleSelect
                name="sendAt"
                selected={sendAt}
                options={SEND_AT_OPTIONS}
                onChange={(opt) => setSendAt(opt.value)}
              />
            </div>
            <div className="ds__field">
              <FieldLabel>Send days</FieldLabel>
              <SingleSelect
                name="sendDays"
                selected={sendDays}
                options={SEND_DAYS_OPTIONS}
                onChange={(opt) => setSendDays(opt.value)}
              />
            </div>
          </AccordionCard>

          {/* Info banner */}
          <div className="rtd__info-banner">
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>info</span>
            <span>It will route the response to the appropriate Frontdesk agent</span>
          </div>

        </div>
      </div>
    </NativeDrawer>
  );
}
