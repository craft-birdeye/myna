/**
 * HealthcareReminderCanvas
 *
 * Fully custom workflow canvas for the Healthcare Reminder agent.
 * Renders view-only and edit modes without relying on AgentBuilder,
 * because the "Appointment reminders" node requires custom reminder chips
 * that do not exist in the generic node system.
 */
import { useState } from 'react'
import { InfoTooltip } from '../components'

// ─── Design constants ────────────────────────────────────────────────────────

const font = '"Roboto", Arial, sans-serif'

const card: React.CSSProperties = {
  width: 400,
  padding: '8px 12px 16px',
  background: '#fff',
  borderRadius: 8,
  border: '2px solid transparent',
  boxShadow: '0px 2px 12px rgba(33,33,33,0.06)',
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  fontFamily: font,
  transition: 'border-color 0.15s',
  boxSizing: 'border-box',
}

const cardSelected: React.CSSProperties = { ...card, border: '2px solid #1976d2' }

// ─── SVG icons (same vectors used in CanvasNodeHeader) ───────────────────────

function TriggerIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M7.4379 9.43212L3.8149 8.85128C3.59179 8.81117 3.4484 8.68234 3.38473 8.46478C3.32107 8.24723 3.37729 8.06367 3.5534 7.91412L9.97257 2.03728C10.0152 1.9945 10.0631 1.96523 10.1161 1.94945C10.1691 1.93367 10.2417 1.92578 10.3341 1.92578C10.4827 1.92578 10.5981 1.9905 10.6802 2.11995C10.7622 2.24939 10.7695 2.38167 10.7021 2.51678L8.54423 6.57195L12.1802 7.15261C12.4032 7.19284 12.5477 7.32061 12.6136 7.53595C12.6793 7.75139 12.6242 7.93389 12.4481 8.08345L6.0289 13.9668C5.98623 14.0094 5.9384 14.0376 5.8854 14.0513C5.8324 14.0649 5.75973 14.0718 5.6674 14.0718C5.51873 14.0718 5.40551 14.0071 5.32773 13.8776C5.24995 13.7482 5.24268 13.6181 5.3059 13.4873L7.4379 9.43212Z" fill="#C2410C"/>
    </svg>
  )
}

function TaskIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M8 6.58824H11.3937V5.52941H8V6.58824ZM8 10.4706H11.3937V9.41176H8V10.4706ZM5.88235 7.199C6.19824 7.199 6.46724 7.08794 6.68935 6.86582C6.91147 6.64371 7.02253 6.37471 7.02253 6.05882C7.02253 5.74306 6.91147 5.47406 6.68935 5.25182C6.46724 5.02971 6.19824 4.91865 5.88235 4.91865C5.56647 4.91865 5.29747 5.02971 5.07535 5.25182C4.85324 5.47406 4.74218 5.74306 4.74218 6.05882C4.74218 6.37471 4.85324 6.64371 5.07535 6.86582C5.29747 7.08794 5.56647 7.199 5.88235 7.199ZM3.27606 14C2.91947 14 2.61765 13.8765 2.37059 13.6294C2.12353 13.3824 2 13.0805 2 12.7239V3.27606C2 2.91947 2.12353 2.61765 2.37059 2.37059C2.61765 2.12353 2.91947 2 3.27606 2H12.7239C13.0805 2 13.3824 2.12353 13.6294 2.37059C13.8765 2.61765 14 2.91947 14 3.27606V12.7239C14 13.0805 13.8765 13.3824 13.6294 13.6294C13.3824 13.8765 13.0805 14 12.7239 14H3.27606ZM3.27606 12.9412H12.7239C12.7783 12.9412 12.8281 12.9185 12.8732 12.8732C12.9185 12.8281 12.9412 12.7783 12.9412 12.7239V3.27606C12.9412 3.22171 12.9185 3.17194 12.8732 3.12676C12.8281 3.08147 12.7783 3.05882 12.7239 3.05882H3.27606C3.22171 3.05882 3.17194 3.08147 3.12676 3.12676C3.08147 3.17194 3.05882 3.22171 3.05882 3.27606V12.7239C3.05882 12.7783 3.08147 12.8281 3.12676 12.8732C3.17194 12.9185 3.22171 12.9412 3.27606 12.9412Z" fill="#37A248"/>
    </svg>
  )
}

function BranchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M9.08156 12.2836V11.4182H7.26882C6.99073 11.4182 6.75327 11.3198 6.55645 11.1229C6.35964 10.9261 6.26123 10.6887 6.26123 10.4106V5.40146H4.25563V6.26686C4.25563 6.49675 4.1753 6.69202 4.01465 6.85267C3.85399 7.01333 3.65872 7.09366 3.42884 7.09366H1.63539C1.4055 7.09366 1.21023 7.01319 1.04958 6.85227C0.888921 6.69134 0.808594 6.49575 0.808594 6.2655V3.71719C0.808594 3.48693 0.888921 3.29225 1.04958 3.13316C1.21023 2.97408 1.4055 2.89453 1.63539 2.89453H3.42884C3.65872 2.89453 3.85399 2.97486 4.01465 3.13551C4.1753 3.29617 4.25563 3.49144 4.25563 3.72133V4.58673H9.08156V3.71874C9.08156 3.48744 9.16188 3.29225 9.32254 3.13316C9.48319 2.97408 9.67846 2.89453 9.90835 2.89453H11.7018C11.9317 2.89453 12.127 2.97499 12.2876 3.13592C12.4483 3.29685 12.5286 3.49244 12.5286 3.72269V6.271C12.5286 6.50126 12.4483 6.69594 12.2876 6.85502C12.127 7.01411 11.9317 7.09366 11.7018 7.09366H9.90835C9.67846 7.09366 9.48319 7.01333 9.32254 6.85267C9.16188 6.69202 9.08156 6.49675 9.08156 6.26686V5.40146H7.07596V10.4106C7.07596 10.4668 7.09404 10.513 7.1302 10.5492C7.16637 10.5853 7.21257 10.6034 7.26882 10.6034H9.08156V9.73544C9.08156 9.50414 9.16188 9.30895 9.32254 9.14986C9.48319 8.99078 9.67846 8.91123 9.90835 8.91123H11.7018C11.9317 8.91123 12.127 8.99169 12.2876 9.15262C12.4483 9.31355 12.5286 9.50914 12.5286 9.73939V12.2877C12.5286 12.518 12.4483 12.7126 12.2876 12.8717C12.127 13.0308 11.9317 13.1104 11.7018 13.1104H9.90835C9.67846 13.1104 9.48319 13.03 9.32254 12.8694C9.16188 12.7087 9.08156 12.5134 9.08156 12.2836Z" fill="#5071CE"/>
    </svg>
  )
}

function MatIcon({ name, size = 16, color = '#555' }: { name: string; size?: number; color?: string }) {
  return (
    <span
      className="material-symbols-outlined"
      style={{ fontSize: size, color, lineHeight: 1, display: 'inline-block', fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}
    >
      {name}
    </span>
  )
}

// ─── Node building blocks ────────────────────────────────────────────────────

interface NodeHeaderProps {
  type: 'trigger' | 'task' | 'delay' | 'branch' | 'subagent'
  label: string
}

function NodeHeader({ type, label }: NodeHeaderProps) {
  const icons: Record<string, React.ReactNode> = {
    trigger: <TriggerIcon />,
    task:    <TaskIcon />,
    delay:   <MatIcon name="schedule" size={14} color="#555" />,
    branch:  <BranchIcon />,
    subagent:<MatIcon name="smart_toy" size={14} color="#6834b7" />,
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1 }}>
        {icons[type] || icons.task}
        <span style={{ fontSize: 12, color: '#8f8f8f', fontFamily: font }}>
          {label}
        </span>
      </div>
      <SmallToggle />
    </div>
  )
}

function SmallToggle() {
  return (
    <div style={{
      width: 28, height: 16, borderRadius: 8, background: '#1976d2',
      position: 'relative', flexShrink: 0,
    }}>
      <div style={{
        width: 12, height: 12, borderRadius: '50%', background: '#fff',
        position: 'absolute', top: 2, right: 2,
      }} />
    </div>
  )
}

interface CardNodeProps {
  nodeId: string
  selected: boolean
  onClick: (id: string) => void
  viewOnly: boolean
  children: React.ReactNode
}

function CardNode({ nodeId, selected, onClick, viewOnly, children }: CardNodeProps) {
  return (
    <div
      style={selected ? cardSelected : card}
      onClick={viewOnly ? undefined : () => onClick(nodeId)}
    >
      {children}
    </div>
  )
}

function NodeTitle({ text }: { text: string }) {
  return (
    <div style={{ fontSize: 14, color: '#212121', lineHeight: '20px', fontFamily: font, marginTop: 4 }}>
      {text}
    </div>
  )
}

function NodeDesc({ text }: { text: string }) {
  return (
    <p style={{ fontSize: 12, color: '#616161', lineHeight: '18px', fontFamily: font, margin: 0 }}>
      {text}
    </p>
  )
}

// ─── Reminder chips ──────────────────────────────────────────────────────────

interface ReminderChip {
  id: string
  timing: string
  channels: string
}

const REMINDER_CHIPS: ReminderChip[] = [
  { id: '1', timing: '3 weeks before', channels: 'Email & text' },
  { id: '2', timing: '3 days before',  channels: 'Email & text' },
  { id: '3', timing: '24 hours before', channels: 'Email & text' },
]

function AppointmentReminderChip({ timing, channels }: Omit<ReminderChip, 'id'>) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', height: 26,
      borderRadius: 4, border: '1px solid #e5e9f0', background: '#f8f9fb',
      fontSize: 12, fontFamily: font, color: '#424242', overflow: 'hidden',
      flexShrink: 0,
    }}>
      <span style={{ padding: '0 8px', borderRight: '1px solid #e5e9f0', color: '#212121' }}>
        {timing}
      </span>
      <span style={{ padding: '0 8px', display: 'flex', alignItems: 'center', gap: 4, color: '#555' }}>
        <MatIcon name="notifications" size={12} color="#757575" />
        {channels}
      </span>
    </div>
  )
}

// ─── Connector ───────────────────────────────────────────────────────────────

function Connector({ height = 28 }: { height?: number }) {
  return (
    <div style={{ width: 2, height, background: '#c8cdd8', margin: '0 auto', flexShrink: 0 }} />
  )
}

// ─── Branch chip (path label pill) ──────────────────────────────────────────

function BranchChip({
  label,
  isFallback = false,
  selected = false,
}: {
  label: string
  isFallback?: boolean
  selected?: boolean
}) {
  return (
    <div style={{
      minWidth: 120, height: 32, borderRadius: 4,
      border: `${selected ? 2 : 1}px solid ${selected ? '#1976d2' : isFallback ? '#dde3ef' : '#c5d0e6'}`,
      background: '#fff',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      gap: 6, padding: '0 12px',
      fontSize: 13, fontFamily: font, color: isFallback ? '#8f8f8f' : '#212121',
      whiteSpace: 'nowrap',
    }}>
      {label}
    </div>
  )
}

// ─── Start / end nodes ───────────────────────────────────────────────────────

function StartNode({ title }: { title: string }) {
  return (
    <div style={{
      width: 160, height: 40, borderRadius: 20,
      background: '#fff', border: '1px solid #e5e9f0',
      boxShadow: '0px 2px 8px rgba(33,33,33,0.06)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: font, fontSize: 12, color: '#212121',
      margin: '0 auto',
    }}>
      {title}
    </div>
  )
}

function EndDot() {
  return (
    <div style={{
      width: 12, height: 12, borderRadius: '50%',
      background: '#c8cdd8', margin: '0 auto',
    }} />
  )
}

// ─── RHS panel for edit mode ─────────────────────────────────────────────────

interface RHSPanelProps {
  nodeId: string
  onClose: () => void
  onOpenReminderTool: () => void
  onOpenVoiceCallTool: () => void
}

function RHSPanel({ nodeId, onClose, onOpenReminderTool, onOpenVoiceCallTool }: RHSPanelProps) {
  const content = (() => {
    if (nodeId === 'hc-rem-1')  return <TriggerPanel />
    if (nodeId === 'hc-rem-2')  return <AppointmentReminderPanel onOpenTool={onOpenReminderTool} />
    if (nodeId === 'hc-rem-3')  return <DelayPanel title="Until 12 hrs before appointment" duration="12" unit="hours" />
    if (nodeId === 'hc-rem-4')  return <BranchPanel />
    if (nodeId === 'hc-rem-5')  return <VoiceCallPanel onOpenTool={onOpenVoiceCallTool} />
    if (nodeId === 'hc-rem-6')  return <SubAgentPanel />
    if (nodeId === 'hc-rem-7')  return <DelayPanel title="Wait 2 hours" duration="2" unit="hours" />
    if (nodeId === 'hc-rem-8')  return <SendTextPanel />
    if (nodeId === 'hc-rem-9')  return <SendTextPanel />
    if (nodeId === 'hc-rem-10') return <SendTextPanel />
    if (nodeId === 'hc-rem-11') return <SendTextPanel />
    return null
  })()

  const titles: Record<string, string> = {
    'hc-rem-1':  'Trigger',
    'hc-rem-2':  'Task',
    'hc-rem-3':  'Delay',
    'hc-rem-4':  'Branch details',
    'hc-rem-5':  'Task',
    'hc-rem-6':  'Sub-agent',
    'hc-rem-7':  'Delay',
    'hc-rem-8':  'Task',
    'hc-rem-9':  'Task',
    'hc-rem-10': 'Task',
    'hc-rem-11': 'Task',
  }

  return (
    <div style={{
      width: 390, height: '100%', background: '#fff',
      borderRadius: 8,
      boxShadow: '0px 2px 12px rgba(33,33,33,0.06)',
      border: '2px solid transparent',
      display: 'flex', flexDirection: 'column',
      fontFamily: font, overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px', borderBottom: '1px solid #e5e9f0', flexShrink: 0,
      }}>
        <span style={{ fontSize: 14, color: '#212121' }}>{titles[nodeId] ?? 'Details'}</span>
        <button
          type="button"
          onClick={onClose}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' }}
        >
          <MatIcon name="close" size={18} color="#616161" />
        </button>
      </div>
      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 15px' }}>
        {content}
      </div>
      {/* Footer */}
      <div style={{
        padding: '10px 16px', borderTop: '1px solid #e5e9f0', flexShrink: 0,
        display: 'flex', justifyContent: 'flex-end',
      }}>
        <button type="button" style={{
          height: 36, padding: '0 20px', borderRadius: 4,
          background: '#1976d2', border: 'none', color: '#fff',
          fontSize: 14, fontFamily: font, cursor: 'pointer',
        }}>
          Save
        </button>
      </div>
    </div>
  )
}

// ── RHS body panels ──────────────────────────────────────────────────────────

function RHSLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 12, color: '#212121', marginBottom: 4, fontFamily: font }}>
      {children}
    </div>
  )
}

function RHSInput({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <RHSLabel>{label}</RHSLabel>
      <div style={{
        height: 36, borderRadius: 4, border: '1px solid #e5e9f0',
        padding: '0 12px', display: 'flex', alignItems: 'center',
        fontSize: 14, color: '#212121', background: '#fff', fontFamily: font,
      }}>
        {value}
      </div>
    </div>
  )
}

function RHSTextarea({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <RHSLabel>{label}</RHSLabel>
      <div style={{
        minHeight: 72, borderRadius: 4, border: '1px solid #e5e9f0',
        padding: '8px 12px', fontSize: 14, color: '#212121', background: '#fff',
        fontFamily: font, lineHeight: '20px',
      }}>
        {value}
      </div>
    </div>
  )
}

function RHSSectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 4,
      fontSize: 12, color: '#212121', marginBottom: 8, fontFamily: font,
    }}>
      {children}
    </div>
  )
}

function ToolChip({
  icon, name, onEdit, onSwap,
}: { icon: string; name: string; onEdit: () => void; onSwap?: () => void }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '8px 12px', borderRadius: 4, border: '1px solid #e5e9f0',
      background: '#f8f9fb',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          width: 28, height: 28, borderRadius: 4,
          background: '#e3f2fd', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <MatIcon name={icon} size={16} color="#1976d2" />
        </div>
        <span style={{ fontSize: 13, color: '#212121', fontFamily: font }}>{name}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <button type="button" onClick={onEdit} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' }}>
          <MatIcon name="edit" size={16} color="#757575" />
        </button>
        {onSwap && (
          <button type="button" onClick={onSwap} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' }}>
            <MatIcon name="swap_horiz" size={16} color="#757575" />
          </button>
        )}
      </div>
    </div>
  )
}

function TriggerPanel() {
  return (
    <>
      <RHSInput label="Trigger name" value="Appointment is booked" />
      <RHSTextarea
        label="Description"
        value="Fires when a new appointment is created or confirmed in the system for any configured location."
      />
    </>
  )
}

function AppointmentReminderPanel({ onOpenTool }: { onOpenTool: () => void }) {
  return (
    <>
      <RHSInput label="Task name *" value="Appointment reminder" />
      <RHSTextarea
        label="Description *"
        value="3 weeks, 3 days and 24 hours before · Email & text"
      />
      <div>
        <RHSSectionLabel>
          <span>Tools</span>
          <InfoTooltip text="The tool used to send this reminder." variant="brief" />
        </RHSSectionLabel>
        <ToolChip icon="notifications" name="Reminder tool" onEdit={onOpenTool} />
      </div>
    </>
  )
}

function VoiceCallPanel({ onOpenTool }: { onOpenTool: () => void }) {
  return (
    <>
      <RHSInput label="Task name" value="Initiate voice call" />
      <RHSTextarea label="Description" value="Call the patient to confirm the upcoming appointment." />
      <div>
        <RHSSectionLabel>
          <span>Tools</span>
          <InfoTooltip text="The tool used to place this call." variant="brief" />
        </RHSSectionLabel>
        <ToolChip icon="call" name="Initiate voice call" onEdit={onOpenTool} onSwap={() => {}} />
      </div>
    </>
  )
}

function SubAgentPanel() {
  return (
    <>
      <div style={{ marginBottom: 16 }}>
        <RHSLabel>Select agent</RHSLabel>
        <div style={{
          height: 36, borderRadius: 4, border: '1px solid #e5e9f0',
          padding: '0 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          fontSize: 14, color: '#212121', background: '#fff', fontFamily: font, cursor: 'pointer',
        }}>
          <span>Front desk agent - North region</span>
          <MatIcon name="expand_more" size={18} color="#555" />
        </div>
      </div>
      <RHSTextarea label="Description" value="Pass appointment context to the Front desk agent for assisted patient handling." />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0' }}>
        <span style={{ fontSize: 13, color: '#212121', fontFamily: font }}>Pass appointment context on handoff</span>
        <SmallToggle />
      </div>
    </>
  )
}

function DelayPanel({ title, duration, unit }: { title: string; duration: string; unit: string }) {
  return (
    <>
      <RHSInput label="Delay name" value={title} />
      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <RHSLabel>Duration</RHSLabel>
          <div style={{
            height: 36, borderRadius: 4, border: '1px solid #e5e9f0',
            padding: '0 12px', display: 'flex', alignItems: 'center',
            fontSize: 14, color: '#212121', background: '#fff', fontFamily: font,
          }}>
            {duration}
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <RHSLabel>Unit</RHSLabel>
          <div style={{
            height: 36, borderRadius: 4, border: '1px solid #e5e9f0',
            padding: '0 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            fontSize: 14, color: '#212121', background: '#fff', fontFamily: font, cursor: 'pointer',
          }}>
            {unit}
            <MatIcon name="expand_more" size={18} color="#555" />
          </div>
        </div>
      </div>
    </>
  )
}

function BranchPanel() {
  return (
    <>
      <div style={{ marginBottom: 16 }}>
        <RHSLabel>Based on</RHSLabel>
        <div style={{
          height: 36, borderRadius: 4, border: '1px solid #e5e9f0',
          padding: '0 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          fontSize: 14, color: '#212121', background: '#fff', fontFamily: font, cursor: 'pointer',
        }}>
          Conditions
          <MatIcon name="expand_more" size={18} color="#555" />
        </div>
      </div>
      <div>
        <RHSSectionLabel>Branches</RHSSectionLabel>
        {['Confirmed', 'Not confirmed'].map((b, i) => (
          <div key={b} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '8px 12px', borderRadius: 4, border: '1px solid #e5e9f0',
            marginBottom: 8, background: '#f8f9fb',
          }}>
            <span style={{ fontSize: 13, color: i === 1 ? '#8f8f8f' : '#212121', fontFamily: font }}>{b}</span>
            {i === 1 && <span style={{ fontSize: 11, color: '#9e9e9e', fontFamily: font }}>Fallback</span>}
          </div>
        ))}
      </div>
    </>
  )
}

function SendTextPanel() {
  return (
    <>
      <RHSInput label="Task name" value="Send text reminder" />
      <RHSTextarea label="Description" value="Send an SMS reminder to the patient with appointment details and a confirm/reschedule link." />
      <div>
        <RHSSectionLabel>
          <span>Tools</span>
          <InfoTooltip text="The tool used to send this text." variant="brief" />
        </RHSSectionLabel>
        <ToolChip icon="sms" name="Send SMS" onEdit={() => {}} onSwap={() => {}} />
      </div>
    </>
  )
}

// ─── Main canvas component ───────────────────────────────────────────────────

interface HealthcareReminderCanvasProps {
  viewOnly: boolean
  instanceName: string
  onEdit?: () => void
  onClose?: () => void
  onOpenReminderTool?: () => void
  onOpenVoiceCallTool?: () => void
}

export function HealthcareReminderCanvas({
  viewOnly,
  instanceName,
  onEdit,
  onOpenReminderTool,
  onOpenVoiceCallTool,
}: HealthcareReminderCanvasProps) {
  const [selectedNode, setSelectedNode] = useState<string | null>(null)

  const handleNodeClick = (nodeId: string) => {
    if (!viewOnly) setSelectedNode(nodeId === selectedNode ? null : nodeId)
  }

  const isSelected = (id: string) => id === selectedNode

  const handleCloseRHS = () => setSelectedNode(null)

  // ── Voice call branch columns (under Confirmed path) ─────────────────────

  const voiceCallBranchCols: Array<{ chipLabel: string; nodeId: string; title: string; nodeType: 'task' | 'subagent' | 'delay'; desc: string; extra?: React.ReactNode }> = [
    {
      chipLabel: 'Call completed',
      nodeId: 'hc-rem-6',
      title: 'Front desk agent',
      nodeType: 'subagent',
      desc: 'Front desk agent handles the call.',
      extra: undefined,
    },
    {
      chipLabel: 'Call rejected',
      nodeId: 'hc-rem-7',
      title: 'Wait 2 hours',
      nodeType: 'delay',
      desc: 'Wait before sending follow-up SMS.',
      extra: (
        <>
          <Connector height={24} />
          <CardNode
            nodeId="hc-rem-8"
            selected={isSelected('hc-rem-8')}
            onClick={handleNodeClick}
            viewOnly={viewOnly}
          >
            <NodeHeader type="task" label="Task" />
            <NodeTitle text="Send text reminder" />
            <NodeDesc text="SMS with reschedule link." />
          </CardNode>
        </>
      ),
    },
    {
      chipLabel: 'Call missed',
      nodeId: 'hc-rem-9',
      title: 'Send text reminder',
      nodeType: 'task',
      desc: '3 hours before appointment.',
      extra: undefined,
    },
    {
      chipLabel: 'Voice mail',
      nodeId: 'hc-rem-10',
      title: 'Send text reminder',
      nodeType: 'task',
      desc: 'SMS follow-up after voicemail.',
      extra: undefined,
    },
  ]

  const voiceColWidth = 240
  const voiceColGap = 20

  // ── Canvas content ─────────────────────────────────────────────────────────

  const canvas = (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingBottom: 80 }}>
      {/* Start */}
      <StartNode title={instanceName} />
      <Connector />

      {/* Trigger */}
      <CardNode nodeId="hc-rem-1" selected={isSelected('hc-rem-1')} onClick={handleNodeClick} viewOnly={viewOnly}>
        <NodeHeader type="trigger" label="Trigger" />
        <NodeTitle text="Appointment is booked" />
        <NodeDesc text="Fires when a new appointment is confirmed in the system." />
      </CardNode>
      <Connector />

      {/* Appointment reminders task */}
      <CardNode nodeId="hc-rem-2" selected={isSelected('hc-rem-2')} onClick={handleNodeClick} viewOnly={viewOnly}>
        <NodeHeader type="task" label="Task" />
        <NodeTitle text="Appointment reminders" />
        <NodeDesc text="Automated multi-channel reminders before the appointment." />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
          {REMINDER_CHIPS.map((c) => (
            <AppointmentReminderChip key={c.id} timing={c.timing} channels={c.channels} />
          ))}
        </div>
      </CardNode>
      <Connector />

      {/* Delay */}
      <CardNode nodeId="hc-rem-3" selected={isSelected('hc-rem-3')} onClick={handleNodeClick} viewOnly={viewOnly}>
        <NodeHeader type="delay" label="Delay" />
        <NodeTitle text="Until 12 hrs before appointment" />
        <NodeDesc text="Wait until 12 hours before the scheduled appointment time." />
      </CardNode>
      <Connector />

      {/* Branch */}
      <CardNode nodeId="hc-rem-4" selected={isSelected('hc-rem-4')} onClick={handleNodeClick} viewOnly={viewOnly}>
        <NodeHeader type="branch" label="Branch" />
        <NodeTitle text="Based on conditions" />
        <NodeDesc text="Route based on appointment confirmation status." />
      </CardNode>

      {/* Branch paths: Confirmed (left) | Not confirmed (right) */}
      {(() => {
        const numVcCols = voiceCallBranchCols.length
        const confirmedW = voiceColWidth * numVcCols + voiceColGap * (numVcCols - 1)
        const notConfW = 240
        const gap = 60
        const totalW = confirmedW + gap + notConfW
        const leftCenter = confirmedW / 2
        const rightCenter = confirmedW + gap + notConfW / 2

        return (
          <div style={{ position: 'relative', width: totalW }}>
            {/* H-line from left to right branch */}
            <div style={{
              position: 'absolute', top: 0, left: leftCenter,
              width: rightCenter - leftCenter, height: 2, background: '#c8cdd8',
            }} />
            {/* vertical drops to each branch chip */}
            <div style={{ position: 'absolute', top: 0, left: leftCenter - 1, width: 2, height: 28, background: '#c8cdd8' }} />
            <div style={{ position: 'absolute', top: 0, left: rightCenter - 1, width: 2, height: 28, background: '#c8cdd8' }} />

            <div style={{ display: 'flex', paddingTop: 28 }}>
              {/* ── Confirmed (left) — voice call + 4 sub-branches ── */}
              <div style={{ width: confirmedW, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <BranchChip label="Confirmed" />
                <Connector height={24} />

                {/* Voice call node */}
                <CardNode nodeId="hc-rem-5" selected={isSelected('hc-rem-5')} onClick={handleNodeClick} viewOnly={viewOnly}>
                  <NodeHeader type="task" label="Task" />
                  <NodeTitle text="Initiate voice call" />
                  <NodeDesc text="Call the patient to confirm the upcoming appointment." />
                </CardNode>

                {/* 4 voice-call sub-branches */}
                {(() => {
                  const vcTotalW = voiceColWidth * numVcCols + voiceColGap * (numVcCols - 1)
                  const centerXs = voiceCallBranchCols.map((_, i) => voiceColWidth / 2 + i * (voiceColWidth + voiceColGap))

                  return (
                    <div style={{ position: 'relative', width: vcTotalW }}>
                      {/* H-line */}
                      <div style={{
                        position: 'absolute', top: 0,
                        left: centerXs[0], width: centerXs[centerXs.length - 1] - centerXs[0],
                        height: 2, background: '#c8cdd8',
                      }} />
                      {centerXs.map((cx, i) => (
                        <div key={i} style={{ position: 'absolute', top: 0, left: cx - 1, width: 2, height: 28, background: '#c8cdd8' }} />
                      ))}

                      <div style={{ display: 'flex', paddingTop: 28, gap: voiceColGap }}>
                        {voiceCallBranchCols.map((col) => (
                          <div key={col.chipLabel} style={{ width: voiceColWidth, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <BranchChip label={col.chipLabel} />
                            <Connector height={24} />
                            <CardNode nodeId={col.nodeId} selected={isSelected(col.nodeId)} onClick={handleNodeClick} viewOnly={viewOnly}>
                              <NodeHeader type={col.nodeType} label={col.nodeType === 'subagent' ? 'Sub-agent' : col.nodeType === 'delay' ? 'Delay' : 'Task'} />
                              <NodeTitle text={col.title} />
                              <NodeDesc text={col.desc} />
                            </CardNode>
                            {col.extra}
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })()}
              </div>

              <div style={{ width: gap }} />

              {/* ── Not confirmed (right) — send text reminder ── */}
              <div style={{ width: notConfW, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <BranchChip label="Not confirmed" isFallback />
                <Connector height={24} />
                <CardNode nodeId="hc-rem-11" selected={isSelected('hc-rem-11')} onClick={handleNodeClick} viewOnly={viewOnly}>
                  <NodeHeader type="task" label="Task" />
                  <NodeTitle text="Send text reminder" />
                  <NodeDesc text="3 hours before appointment." />
                </CardNode>
                <Connector height={24} />
                <EndDot />
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )

  // ── Toolbar (zoom + edit/close) ────────────────────────────────────────────

  const toolbar = (
    <div style={{
      position: 'absolute', bottom: 20, right: 20,
      display: 'flex', alignItems: 'center', gap: 8, zIndex: 10,
    }}>
      {/* Zoom buttons */}
      {[
        { icon: 'add', label: 'Zoom in' },
        { icon: 'remove', label: 'Zoom out' },
        { icon: 'fit_screen', label: 'Fit' },
      ].map(({ icon, label }) => (
        <button key={icon} type="button" aria-label={label} style={{
          width: 32, height: 32, borderRadius: 4,
          border: '1px solid #e5e9f0', background: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
        }}>
          <MatIcon name={icon} size={16} color="#555" />
        </button>
      ))}
      {viewOnly && onEdit && (
        <button type="button" onClick={onEdit} style={{
          height: 32, padding: '0 14px', borderRadius: 4,
          border: '1px solid #e5e9f0', background: '#fff',
          display: 'flex', alignItems: 'center', gap: 6,
          cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
          fontSize: 13, fontFamily: font, color: '#212121',
        }}>
          <MatIcon name="edit" size={14} color="#555" />
          Edit
        </button>
      )}
    </div>
  )

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* Canvas area */}
      <div style={{ position: 'relative', flex: 1, overflow: 'hidden', borderRadius: 12 }}>
        {/* Dotted grid background */}
        <div style={{
          position: 'absolute', inset: 0,
          background: '#f8f9fb',
          backgroundImage: 'radial-gradient(circle, #c8cdd8 1px, transparent 1px)',
          backgroundSize: '28px 28px',
          borderRadius: 12,
        }} />
        {/* Scrollable content */}
        <div style={{
          position: 'relative', height: '100%', overflowY: 'auto', overflowX: 'auto',
        }}>
          <div style={{ minWidth: 1040, padding: '40px 120px 100px' }}>
            {canvas}
          </div>
        </div>
        {toolbar}
      </div>

      {/* RHS panel (edit mode only) */}
      {!viewOnly && selectedNode && (
        <div style={{ width: 390, height: '100%', marginLeft: 12, flexShrink: 0 }}>
          <RHSPanel
            nodeId={selectedNode}
            onClose={handleCloseRHS}
            onOpenReminderTool={onOpenReminderTool ?? (() => {})}
            onOpenVoiceCallTool={onOpenVoiceCallTool ?? (() => {})}
          />
        </div>
      )}
    </div>
  )
}
