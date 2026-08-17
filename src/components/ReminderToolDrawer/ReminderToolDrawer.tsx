/**
 * ReminderToolDrawer
 *
 * Full configuration drawer for the Reminder tool in the healthcare Reminder agent.
 * Sections: reminder schedule, message content, schedule, on a response.
 */
import { useState } from 'react'
import { X } from 'lucide-react'

interface Props {
  open: boolean
  onClose: () => void
}

const font = '"Roboto", Arial, sans-serif'

// ─── Local helpers ────────────────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 12, color: '#212121', marginBottom: 4, fontFamily: font }}>
      {children}
    </div>
  )
}

function SelectField({ label, value, options }: { label?: string; value: string; options: string[] }) {
  const [open, setOpen] = useState(false)
  const [val, setVal] = useState(value)
  return (
    <div style={{ position: 'relative', flex: 1 }}>
      {label && <Label>{label}</Label>}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          width: '100%', height: 36, borderRadius: 4, border: '1px solid #e5e9f0',
          background: '#fff', padding: '0 12px', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', fontSize: 14, color: '#212121',
          fontFamily: font, cursor: 'pointer',
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{val}</span>
        <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#555', fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}>
          expand_more
        </span>
      </button>
      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 1200 }} onClick={() => setOpen(false)} />
          <div style={{
            position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 1210,
            background: '#fff', border: '1px solid #e5e9f0', borderRadius: 4,
            boxShadow: '0 4px 12px rgba(0,0,0,0.12)', marginTop: 2, overflow: 'hidden',
          }}>
            {options.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => { setVal(opt); setOpen(false) }}
                style={{
                  display: 'block', width: '100%', padding: '8px 12px', textAlign: 'left',
                  border: 'none', background: opt === val ? '#e3f2fd' : 'none',
                  fontSize: 14, fontFamily: font, color: '#212121', cursor: 'pointer',
                }}
              >
                {opt}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ─── SmallToggle ─────────────────────────────────────────────────────────────

function SmallToggle({ on = false }: { on?: boolean }) {
  const [state, setState] = useState(on)
  return (
    <div
      onClick={() => setState(s => !s)}
      style={{
        width: 36, height: 20, borderRadius: 10,
        background: state ? '#1976d2' : '#c8cdd8',
        position: 'relative', flexShrink: 0, cursor: 'pointer', transition: 'background 0.2s',
      }}
    >
      <div style={{
        width: 14, height: 14, borderRadius: '50%', background: '#fff',
        position: 'absolute', top: 3,
        left: state ? 18 : 3,
        transition: 'left 0.15s',
      }} />
    </div>
  )
}

// ─── Procedure chip ──────────────────────────────────────────────────────────

function ProcChip({ label }: { label: string }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      height: 28, padding: '0 10px 0 8px',
      borderRadius: 4, border: '1px solid #e5e9f0',
      background: '#fff', fontSize: 12, fontFamily: font, color: '#212121',
      flexShrink: 0,
    }}>
      <span className="material-symbols-outlined" style={{ fontSize: 13, color: '#5071ce', fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}>
        menu_book
      </span>
      {label}
    </div>
  )
}

// ─── Reminder row ─────────────────────────────────────────────────────────────

interface ReminderEntry {
  id: string
  timing: string
  channels: string
}

const DEFAULT_REMINDERS: ReminderEntry[] = [
  { id: '1', timing: '3 weeks before', channels: 'Email & text' },
  { id: '2', timing: '3 days before',  channels: 'Email & text' },
  { id: '3', timing: '24 hours before', channels: 'Email & text' },
]

function ReminderRow({ entry, onRemove }: { entry: ReminderEntry; onRemove: (id: string) => void }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center',
      padding: '12px 16px', borderRadius: 4, border: '1px solid #e5e9f0',
      marginBottom: 8,
    }}>
      <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#9e9e9e', marginRight: 10, flexShrink: 0, fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}>
        schedule
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, color: '#212121', fontFamily: font }}>{entry.timing}</div>
        <div style={{ fontSize: 12, color: '#9e9e9e', fontFamily: font, marginTop: 1 }}>{entry.channels}</div>
      </div>
      <button
        type="button"
        title="Edit"
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', marginLeft: 4 }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#9e9e9e', fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}>
          edit
        </span>
      </button>
      <button
        type="button"
        title="Delete"
        onClick={() => onRemove(entry.id)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', marginLeft: 2 }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#9e9e9e', fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}>
          delete
        </span>
      </button>
    </div>
  )
}

// ─── Accordion section ────────────────────────────────────────────────────────

function Accordion({
  title,
  subtitle,
  defaultOpen = true,
  children,
}: {
  title: string
  subtitle?: string
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div style={{ marginBottom: 20, borderRadius: 4, border: '1px solid #e5e9f0', overflow: 'hidden' }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          padding: '12px 16px', background: 'none', border: 'none', cursor: 'pointer',
        }}
      >
        <div style={{ textAlign: 'left' }}>
          <div style={{ fontSize: 13, color: '#212121', fontFamily: font }}>{title}</div>
          {subtitle && (
            <div style={{ fontSize: 12, color: '#9e9e9e', fontFamily: font, marginTop: 2 }}>{subtitle}</div>
          )}
        </div>
        <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#9e9e9e', flexShrink: 0, marginLeft: 8, fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}>
          {open ? 'expand_less' : 'expand_more'}
        </span>
      </button>
      {open && (
        <div style={{ padding: '0 16px 16px 16px', borderTop: '1px solid #f0f0f0' }}>
          {children}
        </div>
      )}
    </div>
  )
}

// ─── Main drawer ──────────────────────────────────────────────────────────────

export function ReminderToolDrawer({ open, onClose }: Props) {
  const [reminders, setReminders] = useState<ReminderEntry[]>(DEFAULT_REMINDERS)

  const handleRemoveReminder = (id: string) => setReminders(r => r.filter(row => row.id !== id))
  const handleAddReminder = () =>
    setReminders(r => [...r, { id: String(Date.now()), timing: 'Custom', channels: 'Email & text' }])

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.2)', zIndex: 990 }}
        onClick={onClose}
      />

      {/* Drawer */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: 700, background: '#fff', zIndex: 1000,
        display: 'flex', flexDirection: 'column',
        boxShadow: '-4px 0 24px rgba(0,0,0,0.12)',
        fontFamily: font,
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 24px', height: 56, borderBottom: '1px solid #e5e9f0', flexShrink: 0,
        }}>
          <span style={{ fontSize: 14, color: '#212121', fontFamily: font }}>Reminder tool</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                height: 36, padding: '0 20px', borderRadius: 4,
                border: 'none', background: '#1976d2',
                fontSize: 14, fontFamily: font, color: '#fff', cursor: 'pointer',
              }}
            >
              Submit
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' }}
            >
              <X className="size-5 text-text-icon" strokeWidth={1.6} absoluteStrokeWidth />
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>

          {/* ── Section 1: Reminder (always expanded) ── */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 13, color: '#212121', fontFamily: font, marginBottom: 4 }}>Reminder</div>
            <div style={{ fontSize: 12, color: '#9e9e9e', fontFamily: font, marginBottom: 12 }}>Setup one or more reminders</div>
            {reminders.map(entry => (
              <ReminderRow key={entry.id} entry={entry} onRemove={handleRemoveReminder} />
            ))}
            <button
              type="button"
              onClick={handleAddReminder}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'none', border: 'none', cursor: 'pointer',
                padding: 0, fontSize: 13, color: '#1976d2', fontFamily: font, marginTop: 8,
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16, fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}>
                add
              </span>
              Add
            </button>
          </div>

          {/* ── Section 2: Message content ── */}
          <Accordion title="Message content" subtitle="Select communication templates and scripts">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 12 }}>
              <SelectField label="Email template" value="Appointment reminder" options={['Appointment reminder', 'Custom']} />
              <SelectField label="Text template" value="Text reminder" options={['Text reminder', 'Custom']} />
              <SelectField label="Voice script / Myna procedure" value="Reminder call" options={['Reminder call', 'Custom']} />
            </div>
          </Accordion>

          {/* ── Section 3: Schedule ── */}
          <Accordion title="Schedule" subtitle="Setup timing and sending time">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 12 }}>
              <SelectField label="Schedule relative to" value="Appointment date" options={['Appointment date', 'Booking date']} />
              <SelectField label="Send at" value="Appointment time" options={['Appointment time', '8:00 AM', '9:00 AM', '10:00 AM']} />
              <SelectField label="Send days" value="Mon, Tue, Wed, Thu, Fri" options={['Mon, Tue, Wed, Thu, Fri', 'Every day', 'Weekends only']} />
            </div>
          </Accordion>

          {/* ── Section 4: On a response ── */}
          <Accordion title="On a response" subtitle="Configure how and when do you want to route to a Front desk agent">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 12 }}>
              <SelectField label="Hand off to" value="Front desk agent (4 locations)" options={['Front desk agent (4 locations)', 'Front desk agent (all locations)']} />
              <div>
                <Label>Procedures</Label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  <ProcChip label="Urgent Triage" />
                  <ProcChip label="New Patient Scheduling" />
                  <ProcChip label="Established Patient Scheduling" />
                  <ProcChip label="Rescheduling" />
                  <ProcChip label="Cancellation" />
                  <ProcChip label="Insurance & Billing Inquiry" />
                  <ProcChip label="Practice Information" />
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 4 }}>
                <span style={{ fontSize: 13, color: '#212121', fontFamily: font }}>Pass appointment context on handoff</span>
                <SmallToggle on />
              </div>
            </div>
          </Accordion>

        </div>
      </div>
    </>
  )
}
