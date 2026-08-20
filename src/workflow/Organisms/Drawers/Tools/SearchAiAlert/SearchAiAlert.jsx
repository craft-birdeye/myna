import React, { useState } from 'react';
import { DrawerHeader, FormInput, SingleSelect } from '../../../../elemental-stubs';

const font = '"Roboto", arial, sans-serif';

const COLORS = {
  primary: '#212121',
  secondary: '#757575',
  border: '#cccccc',
  required: '#de1b0c',
  white: '#ffffff',
  chipBg: '#f0f0f0',
};

const DEFAULT_RECIPIENTS = ['Rupa C'];

const WHEN_TO_SEND_OPTIONS = [
  { value: 'immediately', label: 'Send immediately' },
  { value: 'delay', label: 'Send after a delay' },
];

const TIME_UNIT_OPTIONS = [
  { value: 'minutes', label: 'Minutes' },
  { value: 'hours', label: 'Hours' },
];

/** Free-text name chips + "Enter a name" input — matches the recipients field used by the
 *  product's Email/Schedule report config, so Send alert's Recipients field looks consistent. */
function RecipientsChipInput({ recipients, onChange }) {
  const [nameInput, setNameInput] = useState('');

  function addRecipient() {
    const value = nameInput.trim();
    if (!value || recipients.includes(value)) {
      setNameInput('');
      return;
    }
    onChange([...recipients, value]);
    setNameInput('');
  }

  return (
    <div
      style={{
        display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center',
        padding: '8px 12px', minHeight: 40, boxSizing: 'border-box',
        border: `1px solid ${COLORS.border}`, borderRadius: 4,
      }}
    >
      {recipients.map((name) => (
        <span
          key={name}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '4px 8px', borderRadius: 4, background: COLORS.chipBg,
            fontSize: 13, lineHeight: '18px', color: COLORS.primary,
          }}
        >
          {name}
          <button
            type="button"
            onClick={() => onChange(recipients.filter((r) => r !== name))}
            style={{ display: 'flex', border: 'none', background: 'none', padding: 0, cursor: 'pointer', color: COLORS.secondary }}
            aria-label={`Remove ${name}`}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>close</span>
          </button>
        </span>
      ))}
      <input
        value={nameInput}
        onChange={(e) => setNameInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            addRecipient();
          }
        }}
        onBlur={addRecipient}
        placeholder={recipients.length === 0 ? 'Enter a name' : ''}
        style={{
          flex: 1, minWidth: 120, border: 'none', outline: 'none',
          font: `400 14px/20px ${font}`, color: COLORS.primary, background: 'transparent',
        }}
      />
    </div>
  );
}

export default function SearchAiAlert({
  title = 'Send alert',
  onBack,
  onSave,
}) {
  const [recipients, setRecipients] = useState(DEFAULT_RECIPIENTS);
  const [whenToSend, setWhenToSend] = useState('immediately');
  const [duration, setDuration] = useState('');
  const [unit, setUnit] = useState('minutes');

  return (
    <div style={{ width: 650, maxWidth: '100%', background: COLORS.white, fontFamily: font, display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
      <DrawerHeader
        title={title}
        onBack={onBack}
        actions={[{ label: 'Save', onClick: onSave }]}
      />

      <div style={{ padding: '12px 24px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <span style={{ fontSize: 12, lineHeight: '18px', color: COLORS.primary }}>Recipients</span>
            <span style={{ fontSize: 12, lineHeight: '18px', color: COLORS.required }}>*</span>
          </div>
          <RecipientsChipInput recipients={recipients} onChange={setRecipients} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <span style={{ fontSize: 12, lineHeight: '18px', color: COLORS.primary }}>When to send</span>
            <span style={{ fontSize: 12, lineHeight: '18px', color: COLORS.required }}>*</span>
          </div>
          <SingleSelect
            name="whenToSend"
            selected={whenToSend}
            options={WHEN_TO_SEND_OPTIONS}
            onChange={(opt) => setWhenToSend(opt.value)}
            placeholder="Select"
          />
        </div>

        {whenToSend === 'delay' && (
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <FormInput
                name="duration"
                type="number"
                label="Duration"
                placeholder="Enter value"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                required
                min={1}
              />
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                <span style={{ fontSize: 12, lineHeight: '18px', color: COLORS.primary }}>Unit</span>
                <span style={{ fontSize: 12, lineHeight: '18px', color: COLORS.required }}>*</span>
              </div>
              <SingleSelect
                name="unit"
                selected={unit}
                options={TIME_UNIT_OPTIONS}
                onChange={(opt) => setUnit(opt.value)}
                placeholder="Select unit"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
