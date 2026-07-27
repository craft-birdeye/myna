import React, { useState, useRef, useEffect } from 'react';

const F = { fontFamily: '"Roboto", sans-serif' };
const labelSm  = { ...F, fontSize: 13, color: '#212121', marginBottom: 6, display: 'block' };
const bodyTxt  = { ...F, fontSize: 14, color: '#212121' };
const subtxt   = { ...F, fontSize: 12, color: '#757575' };

/* ─── Drawer shell ─── */
function NativeDrawer({ isOpen, onClose, children }) {
  if (!isOpen) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', justifyContent: 'flex-end' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)' }} />
      {/* Panel scrolls as a whole; header is sticky inside */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative', width: 650, maxWidth: '95vw',
          height: '100%', overflowY: 'auto',
          background: '#fff', boxShadow: '-4px 0 24px rgba(0,0,0,0.14)',
        }}
      >
        {children}
      </div>
    </div>
  );
}

/* ─── Animated accordion — controlled open prop ─── */
function Accordion({ title, subtitle, open, onToggle, children }) {
  const bodyRef = useRef(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (!bodyRef.current) return;
    setHeight(open ? bodyRef.current.scrollHeight : 0);
  }, [open, children]);

  return (
    <div style={{ border: '1px solid #e0e4ec', borderRadius: 8, overflow: 'hidden' }}>
      <button
        type="button"
        onClick={onToggle}
        style={{
          width: '100%', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', padding: '14px 18px',
          background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
        }}
      >
        <div>
          <div style={{ ...bodyTxt }}>{title}</div>
          {subtitle && <div style={{ ...subtxt, marginTop: 2 }}>{subtitle}</div>}
        </div>
        <span
          className="material-symbols-outlined"
          style={{
            fontSize: 20, color: '#757575', flexShrink: 0,
            transition: 'transform 0.25s ease',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        >keyboard_arrow_down</span>
      </button>

      {/* Animated body */}
      <div
        style={{
          maxHeight: height,
          overflow: 'hidden',
          transition: 'max-height 0.28s ease',
        }}
      >
        <div ref={bodyRef} style={{ padding: '4px 18px 18px' }}>
          {children}
        </div>
      </div>
    </div>
  );
}

/* ─── StyledSelect ─── */
function StyledSelect({ value, onChange, options }) {
  return (
    <div style={{ position: 'relative' }}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          ...F, fontSize: 14, color: '#212121',
          height: 36, width: '100%',
          paddingLeft: 12, paddingRight: 36,
          border: '1px solid #c5cad3', borderRadius: 4,
          background: '#fff', appearance: 'none', cursor: 'pointer',
        }}
      >
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <span
        className="material-symbols-outlined"
        style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', fontSize: 18, color: '#757575', pointerEvents: 'none' }}
      >expand_more</span>
    </div>
  );
}

/* ─── Channel pill picker ─── */
const ALL_CHANNELS = ['Email', 'Text', 'Voice'];
function ChannelPicker({ value = [], onChange }) {
  const toggle = (ch) =>
    onChange(value.includes(ch) ? value.filter((v) => v !== ch) : [...value, ch]);
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {ALL_CHANNELS.map((ch) => {
        const active = value.includes(ch);
        return (
          <button
            key={ch}
            type="button"
            onClick={() => toggle(ch)}
            style={{
              ...F, fontSize: 13, height: 32, padding: '0 14px',
              border: active ? '2px solid #1976d2' : '1px solid #c5cad3',
              borderRadius: 16,
              background: active ? '#e3f0fd' : '#fff',
              color: active ? '#1565c0' : '#424242',
              cursor: 'pointer',
            }}
          >{ch}</button>
        );
      })}
    </div>
  );
}

/* ─── Time options ─── */
const TIME_UNIT_OPTS  = [
  { value: 'hours', label: 'Hours before' },
  { value: 'days',  label: 'Days before' },
  { value: 'weeks', label: 'Weeks before' },
];
const TIME_VALUE_OPTS = Array.from({ length: 30 }, (_, i) => ({ value: String(i + 1), label: String(i + 1) }));

/* ─── Inline reminder form ─── */
function ReminderForm({ initial, onSave, onCancel }) {
  const [qty, setQty]         = useState(initial?.qty ?? '1');
  const [unit, setUnit]       = useState(initial?.unit ?? 'days');
  const [channels, setChannels] = useState(initial?.channels ?? ['Email', 'Text']);
  return (
    <div style={{ background: '#f5f7fa', border: '1px solid #e0e4ec', borderRadius: 6, padding: 16, marginTop: 8 }}>
      <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
        <div style={{ flex: 1 }}>
          <label style={labelSm}>Amount</label>
          <StyledSelect value={qty} onChange={setQty} options={TIME_VALUE_OPTS} />
        </div>
        <div style={{ flex: 2 }}>
          <label style={labelSm}>When</label>
          <StyledSelect value={unit} onChange={setUnit} options={TIME_UNIT_OPTS} />
        </div>
      </div>
      <div style={{ marginBottom: 14 }}>
        <label style={labelSm}>Channels</label>
        <ChannelPicker value={channels} onChange={setChannels} />
      </div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button type="button" onClick={onCancel}
          style={{ ...F, fontSize: 13, height: 32, padding: '0 14px', border: '1px solid #c5cad3', borderRadius: 4, background: '#fff', cursor: 'pointer', color: '#424242' }}>
          Cancel
        </button>
        <button type="button" onClick={() => onSave({ qty, unit, channels })}
          style={{ ...F, fontSize: 13, height: 32, padding: '0 14px', border: 'none', borderRadius: 4, background: '#1976d2', color: '#fff', cursor: 'pointer' }}>
          Save
        </button>
      </div>
    </div>
  );
}

/* ─── Reminder row ─── */
function ReminderRow({ item, onEdit, onDelete }) {
  const plural = (n, word) => `${n} ${word}${Number(n) !== 1 ? 's' : ''}`;
  const label = item.unit === 'weeks'
    ? `${plural(item.qty, 'week')} before`
    : item.unit === 'days'
    ? `${plural(item.qty, 'day')} before`
    : `${plural(item.qty, 'hour')} before`;
  return (
    <div style={{ display: 'flex', alignItems: 'center', background: '#fff', border: '1px solid #e5e8ef', borderRadius: 6, padding: '10px 14px', marginBottom: 8 }}>
      <div style={{ flex: 1 }}>
        <div style={{ ...bodyTxt }}>{label}</div>
        <div style={{ ...subtxt, marginTop: 2 }}>{item.channels.join(' & ')}</div>
      </div>
      <button type="button" onClick={onEdit}
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#757575', display: 'flex', alignItems: 'center' }}>
        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>edit</span>
      </button>
      <button type="button" onClick={onDelete}
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#757575', display: 'flex', alignItems: 'center', marginLeft: 4 }}>
        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>delete</span>
      </button>
    </div>
  );
}

/* ─── Procedure chip ─── */
function ProcChip({ label }) {
  return (
    <span style={{ ...F, fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 4, height: 28, padding: '0 10px', border: '1px solid #c5cad3', borderRadius: 4, color: '#424242', background: '#fff', marginRight: 6, marginBottom: 6 }}>
      <span className="material-symbols-outlined" style={{ fontSize: 14, color: '#757575' }}>menu_book</span>
      {label}
    </span>
  );
}

/* ─── Toggle ─── */
function Toggle({ checked, onChange }) {
  return (
    <div onClick={() => onChange(!checked)}
      style={{ width: 44, height: 24, borderRadius: 12, cursor: 'pointer', position: 'relative', background: checked ? '#1976d2' : '#bdbdbd', transition: 'background 0.2s', flexShrink: 0 }}>
      <div style={{ position: 'absolute', top: 2, left: checked ? 20 : 2, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
    </div>
  );
}

/* ─── Defaults ─── */
const DEFAULT_REMINDERS = [
  { id: 1, qty: '3',  unit: 'weeks', channels: ['Email', 'Text'] },
  { id: 2, qty: '3',  unit: 'days',  channels: ['Email', 'Text'] },
  { id: 3, qty: '24', unit: 'hours', channels: ['Email', 'Text'] },
];

/* ─── Main ─── */
export default function ReminderToolDrawer({ isOpen, onClose }) {
  const [reminders, setReminders] = useState(DEFAULT_REMINDERS);
  const [editingId, setEditingId] = useState(null);
  const nextId = useRef(4);

  // one-at-a-time accordion: 'message' | 'schedule' | 'response' | null
  const [openPanel, setOpenPanel] = useState(null);
  const toggle = (key) => setOpenPanel((p) => (p === key ? null : key));

  const [emailTpl,    setEmailTpl]    = useState('appointment-reminder');
  const [textTpl,     setTextTpl]     = useState('text-reminder');
  const [voiceScript, setVoiceScript] = useState('reminder-call');
  const [scheduleRel, setScheduleRel] = useState('appointment-date');
  const [sendAt,      setSendAt]      = useState('appointment-time');
  const [sendDays,    setSendDays]    = useState('mon-fri');
  const [handoffTo,   setHandoffTo]   = useState('frontdesk-4');
  const [passCtx,     setPassCtx]     = useState(true);

  const handleSaveReminder = (data) => {
    if (editingId === 'new') {
      setReminders((prev) => [...prev, { ...data, id: nextId.current++ }]);
    } else {
      setReminders((prev) => prev.map((r) => r.id === editingId ? { ...r, ...data } : r));
    }
    setEditingId(null);
  };

  return (
    <NativeDrawer isOpen={isOpen} onClose={onClose}>
      {/* Header — sticky so it stays visible while scrolling */}
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button type="button" onClick={onClose}
            style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer', color: '#555', borderRadius: 4, padding: 0 }}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M5.99 10.627L8.733 13.37c.124.124.185.27.184.536s-.062.617-.184.748c-.13.13-.278.196-.446.2-.168.005-.317-.058-.446-.188L3.109 10.53C2.958 10.378 2.883 10.203 2.883 10c0-.202.075-.378.226-.529L6.84 5.742c.124-.124.271-.185.441-.184.17.002.32.068.449.197.12.129.183.275.188.439.004.163-.059.31-.188.44L5.99 9.377H15.793c.178 0 .326.06.446.179.12.12.179.268.179.446s-.06.326-.179.446c-.12.12-.268.179-.446.179H5.99z" fill="currentColor"/>
            </svg>
          </button>
          <span style={{ ...F, fontSize: 18, color: '#212121' }}>Reminder tool</span>
        </div>
        <button type="button" onClick={onClose}
          style={{ ...F, fontSize: 14, height: 36, padding: '0 20px', background: '#1976d2', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
          Save
        </button>
      </div>

      <div style={{ padding: '8px 24px 48px', display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* Reminder outlined card */}
        <div style={{ border: '1px solid #e0e4ec', borderRadius: 8, padding: '16px 18px' }}>
          <div style={{ ...bodyTxt, marginBottom: 2 }}>Reminder</div>
          <div style={{ ...subtxt, marginBottom: 14 }}>Setup one or more reminders</div>

          {reminders.map((r) =>
            editingId === r.id ? (
              <ReminderForm key={r.id} initial={r} onSave={handleSaveReminder} onCancel={() => setEditingId(null)} />
            ) : (
              <ReminderRow key={r.id} item={r}
                onEdit={() => setEditingId(r.id)}
                onDelete={() => setReminders((prev) => prev.filter((x) => x.id !== r.id))} />
            )
          )}

          {editingId === 'new' && (
            <ReminderForm initial={null} onSave={handleSaveReminder} onCancel={() => setEditingId(null)} />
          )}

          {editingId === null && (
            <button type="button" onClick={() => setEditingId('new')}
              style={{ ...F, fontSize: 14, display: 'flex', alignItems: 'center', gap: 6, color: '#1976d2', background: 'none', border: 'none', cursor: 'pointer', padding: '8px 0 0' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add_circle</span>
              Add
            </button>
          )}
        </div>

        {/* Message content */}
        <Accordion title="Message content" subtitle="Select communication templates and scripts"
          open={openPanel === 'message'} onToggle={() => toggle('message')}>
          <div style={{ marginBottom: 14 }}>
            <label style={labelSm}>Email template</label>
            <StyledSelect value={emailTpl} onChange={setEmailTpl} options={[
              { value: 'appointment-reminder', label: 'Appointment reminder' },
              { value: 'appointment-reminder-2', label: 'Appointment reminder v2' },
            ]} />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={labelSm}>Text template</label>
            <StyledSelect value={textTpl} onChange={setTextTpl} options={[
              { value: 'text-reminder', label: 'Text reminder' },
              { value: 'sms-reminder-short', label: 'SMS reminder (short)' },
            ]} />
          </div>
          <div>
            <label style={labelSm}>Voice script / Myna procedure</label>
            <StyledSelect value={voiceScript} onChange={setVoiceScript} options={[
              { value: 'reminder-call', label: 'Reminder call' },
              { value: 'appointment-confirmation-call', label: 'Appointment confirmation call' },
            ]} />
          </div>
        </Accordion>

        {/* Schedule */}
        <Accordion title="Schedule" subtitle="Setup timing and sending time"
          open={openPanel === 'schedule'} onToggle={() => toggle('schedule')}>
          <div style={{ marginBottom: 14 }}>
            <label style={labelSm}>Schedule relative to</label>
            <StyledSelect value={scheduleRel} onChange={setScheduleRel} options={[
              { value: 'appointment-date', label: 'Appointment date' },
              { value: 'booking-date', label: 'Booking date' },
            ]} />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={labelSm}>Send at</label>
            <StyledSelect value={sendAt} onChange={setSendAt} options={[
              { value: 'appointment-time', label: 'Appointment time' },
              { value: '9am', label: '9:00 AM' },
              { value: '10am', label: '10:00 AM' },
            ]} />
          </div>
          <div>
            <label style={labelSm}>Send days</label>
            <StyledSelect value={sendDays} onChange={setSendDays} options={[
              { value: 'mon-fri', label: 'Mon, Tue, Wed, Thu, Fri' },
              { value: 'every-day', label: 'Every day' },
              { value: 'weekdays', label: 'Weekdays only' },
            ]} />
          </div>
        </Accordion>

        {/* On a response */}
        <Accordion title="On a response" subtitle="Configure how and when to route to a Front desk agent"
          open={openPanel === 'response'} onToggle={() => toggle('response')}>
          <div style={{ marginBottom: 14 }}>
            <label style={labelSm}>Hand off to</label>
            <StyledSelect value={handoffTo} onChange={setHandoffTo} options={[
              { value: 'frontdesk-4', label: 'Front desk agent (4 locations)' },
              { value: 'frontdesk-all', label: 'Front desk agent (all locations)' },
            ]} />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={labelSm}>Procedures</label>
            <div style={{ background: '#f5f7fa', borderRadius: 6, padding: '12px 14px' }}>
              {['Urgent Triage', 'New Patient Scheduling', 'Established Patient Scheduling', 'Rescheduling', 'Cancellation', 'Insurance & Billing Inquiry', 'Practice Information'].map((p) => (
                <ProcChip key={p} label={p} />
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ ...bodyTxt }}>Pass appointment context on handoff</span>
            <Toggle checked={passCtx} onChange={setPassCtx} />
          </div>
        </Accordion>

      </div>
    </NativeDrawer>
  );
}
