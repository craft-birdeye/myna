import React, { useState } from 'react';
import { ProcedureIcon, TriggerIcon } from '../Canvas/CanvasNodeIcons';
import './PreviewPanel.css';

export const PREVIEW_GREETING =
  'Thank you for calling Rock Dental Brands, my name is Myna, your virtual assistant. How can I help you today?';

export const PREVIEW_DEMO_SCRIPT = [
  { role: 'user', text: 'I am having a very bad headache. I think it is migraine.' },
  {
    role: 'agent',
    text: "I'm really sorry you're dealing with that — a bad headache is no fun. Just so I point you in the right direction: is the pain coming from your teeth, jaw, or gums, or is it more of a general head pain?",
  },
  { role: 'user', text: 'Now that you ask — it kind of started near my back tooth and spread up.' },
  {
    role: 'agent',
    text: 'Thank you, that helps. Pain that radiates from a tooth can sometimes need prompt attention. Are you having any swelling in your face or jaw, fever, or trouble swallowing or breathing?',
  },
  { role: 'user', text: 'A little swelling near the tooth, no fever' },
];

export const PREVIEW_LOG_SECTIONS = [
  {
    id: 'trigger',
    kind: 'trigger',
    stepLabel: '2. Conversation trigger',
    outputSections: [
      {
        id: 'to1',
        label: 'Trigger output',
        rows: [
          { label: 'Source', value: 'Voice call' },
          { label: 'Comments', value: 'Patient called reporting tooth pain and mild swelling scheduled appointment' },
        ],
        children: [
          {
            id: 'reviewer',
            label: 'Reviewer',
            badge: '1 property',
            rows: [{ label: 'Name', value: 'Sarah Jones' }],
          },
        ],
        extraRows: [
          { label: 'Source type', value: 'Voice call' },
          { label: 'Has comment', value: 'True' },
        ],
      },
    ],
  },
  {
    id: 'procedures',
    kind: 'procedures',
    stepLabel: '2. Follow procedures',
    outputSections: [
      {
        id: 'to2',
        label: 'Trigger output',
        rows: [
          { label: 'Source', value: 'Voice call' },
          { label: 'Procedure triggered', value: 'Emergency or urgent concern' },
          {
            label: 'Summary',
            value:
              'Patient reported tooth-origin pain with mild swelling (no fever or breathing issues). Myna screened symptoms and offered an urgent appointment, but the patient ended the call.',
          },
        ],
        children: [],
        extraRows: [],
      },
    ],
  },
];

export function buildStaticPreviewMessages({
  startedLabel = 'Conversation started',
  endedLabel = 'You ended the chat',
} = {}) {
  return [
    { id: 'start', role: 'system', text: startedLabel },
    { id: 'greeting', role: 'agent', text: PREVIEW_GREETING },
    ...PREVIEW_DEMO_SCRIPT.map((m, i) => ({ id: `turn-${i}`, role: m.role, text: m.text })),
    { id: 'end', role: 'system', text: endedLabel },
  ];
}

export const OUTBOUND_REMINDER_DEMO_SCRIPT = [
  { role: 'user', text: 'Hi' },
  ...PREVIEW_DEMO_SCRIPT,
];

export function PreviewAppointmentCard({
  patientName,
  appointmentLine,
  phone,
  reminderLabel = '24-hour reminder · Voice call',
  onEdit,
}) {
  return (
    <div className="preview-panel__appointment-card">
      <div className="preview-panel__appointment-card-header">
        <span className="preview-panel__appointment-card-label">Appointment details</span>
        <button
          type="button"
          aria-label="Edit appointment details"
          className="preview-panel__appointment-edit"
          onClick={onEdit}
        >
          <span className="material-symbols-outlined">edit</span>
        </button>
      </div>

      <div className="preview-panel__appointment-name-row">
        <span className="preview-panel__appointment-name">{patientName}</span>
        <span className="preview-panel__appointment-status">Confirmed</span>
      </div>

      <div className="preview-panel__appointment-meta">
        <div className="preview-panel__appointment-meta-row">
          <span className="material-symbols-outlined">calendar_today</span>
          <span>{appointmentLine}</span>
        </div>
        <div className="preview-panel__appointment-meta-row">
          <span className="material-symbols-outlined">call</span>
          <span>{phone}</span>
        </div>
        <div className="preview-panel__appointment-meta-row">
          <span className="material-symbols-outlined">notifications</span>
          <span>{reminderLabel}</span>
        </div>
      </div>
    </div>
  );
}

export function OutboundPreviewLogsPanel({
  patientName,
  appointmentLine,
  phone,
  sections,
  visibleCount,
  completedCount,
  onEditAppointment,
}) {
  return (
    <>
      <PreviewAppointmentCard
        patientName={patientName}
        appointmentLine={appointmentLine}
        phone={phone}
        onEdit={onEditAppointment}
      />
      <ProgressivePreviewLogsView
        sections={sections}
        visibleCount={visibleCount}
        completedCount={completedCount}
      />
    </>
  );
}

export function buildVoiceCallLogOutput(phone, completed = false, actionLabel = 'Task') {
  return {
    id: 'vc-out',
    label: `${actionLabel} output`,
    rows: [
      { label: 'Source', value: 'Voice call' },
      {
        label: 'Summary',
        value: completed
          ? 'Outbound reminder call completed'
          : 'Outbound reminder call connected',
      },
      { label: 'Phone', value: phone },
    ],
    children: [],
    extraRows: [],
  };
}

export function buildEndLogStep() {
  return {
    id: 'end',
    kind: 'end',
    kindLabel: 'End',
    stepLabel: 'End',
    outputSections: [
      {
        id: 'end-out',
        label: 'Run output',
        rows: [
          { label: 'Status', value: 'Completed' },
          { label: 'Summary', value: 'Reminder workflow finished successfully' },
        ],
        children: [],
        extraRows: [],
      },
    ],
  };
}

function LogKindIcon({ kind }) {
  if (kind === 'trigger') {
    return (
      <span className="preview-panel__log-kind-icon">
        <TriggerIcon />
      </span>
    );
  }
  if (kind === 'delay') {
    return (
      <span className="preview-panel__log-kind-icon preview-panel__log-kind-icon--material">
        <span className="material-symbols-outlined">schedule</span>
      </span>
    );
  }
  if (kind === 'branch') {
    return (
      <span className="preview-panel__log-kind-icon preview-panel__log-kind-icon--material">
        <span className="material-symbols-outlined">account_tree</span>
      </span>
    );
  }
  if (kind === 'end') {
    return (
      <span className="preview-panel__log-kind-icon preview-panel__log-kind-icon--end">
        End
      </span>
    );
  }
  return (
    <span className="preview-panel__log-kind-icon">
      <ProcedureIcon />
    </span>
  );
}

export function buildReminderPreviewLogSteps(booking, actionLabel = 'Task') {
  const patientName = booking
    ? `${booking.firstName} ${booking.lastName}`.trim()
    : 'Sarah Lawson';
  const phone = booking?.phone || '+1(404)555-1092';
  const email = booking?.email || 'sarahl@abc.com';
  const appointmentLine = booking
    ? `${booking.appointmentType} · ${booking.dateTime.replace(' · ', ' at ')}`
    : 'Teeth cleaning · Jun 15 at 10:00 AM';

  return {
    appointmentLine,
    patientName,
    phone,
    steps: [
      {
        id: 'trigger',
        kind: 'trigger',
        kindLabel: 'Trigger',
        stepLabel: '1. Appointment is booked',
        outputSections: [
          {
            id: 'to1',
            label: 'Trigger output',
            rows: [
              { label: 'Source', value: 'Voice call' },
              {
                label: 'Comments',
                value: 'Patient called reporting tooth pain and mild swelling scheduled appointment',
              },
            ],
            children: [
              {
                id: 'reviewer',
                label: 'Reviewer',
                badge: '1 property',
                rows: [
                  { label: 'Name', value: patientName },
                  { label: 'Phone', value: phone },
                ],
              },
            ],
            extraRows: [],
          },
        ],
      },
      {
        id: 'reminder-email',
        kind: 'task',
        kindLabel: actionLabel,
        stepLabel: '2. Appointment reminder',
        awaitingResponse: true,
        outputSections: [
          {
            id: 'to2',
            label: 'Trigger output',
            rows: [
              { label: 'Source', value: 'Email' },
              { label: 'Summary', value: 'Email reminder sent' },
              {
                label: 'Description',
                value: `Check ${email} — a reminder for confirmation is sent`,
              },
            ],
            children: [],
            extraRows: [],
          },
        ],
      },
      {
        id: 'delay',
        kind: 'delay',
        kindLabel: 'Delay',
        stepLabel: '3. Delay skipped for preview',
        outputSections: [],
      },
      {
        id: 'branch',
        kind: 'branch',
        kindLabel: 'Branch',
        stepLabel: '4. Based on conditions',
        outputSections: [],
      },
      {
        id: 'voice-call',
        kind: 'task',
        kindLabel: actionLabel,
        stepLabel: '5. Initiating voice call',
        outputSections: [],
      },
    ],
  };
}

function PreviewLogSection({
  section,
  isLast,
  status = 'completed',
  showAwaiting = false,
}) {
  const [stepOpen, setStepOpen] = useState(true);
  const [outputOpen, setOutputOpen] = useState(true);
  const [childOpen, setChildOpen] = useState({ reviewer: true });
  const kindLabel = section.kindLabel || (section.kind === 'trigger' ? 'Trigger' : 'Procedures');
  const statusClass =
    status === 'completed'
      ? ' preview-panel__log-status--completed'
      : ' preview-panel__log-status--active';

  return (
    <div className={`preview-panel__log-section${isLast ? ' preview-panel__log-section--last' : ''}`}>
      <div className="preview-panel__log-track">
        <div className={`preview-panel__log-status${statusClass}`} aria-hidden>
          {status === 'completed' && <span className="material-symbols-outlined">check</span>}
        </div>
      </div>

      <div className="preview-panel__log-content">
        <div className="preview-panel__log-kind">
          <LogKindIcon kind={section.kind} />
          <span className="preview-panel__log-kind-label">{kindLabel}</span>
        </div>

        <button
          type="button"
          className="preview-panel__log-step"
          onClick={() => setStepOpen((v) => !v)}
        >
          <span className="preview-panel__log-step-label">{section.stepLabel}</span>
          <span className="material-symbols-outlined">
            {stepOpen ? 'expand_less' : 'expand_more'}
          </span>
        </button>

        {stepOpen && section.outputSections.map((out) => (
          <div key={out.id} className="preview-panel__log-output">
            <button
              type="button"
              className="preview-panel__log-output-toggle preview-panel__log-output-toggle--primary"
              onClick={() => setOutputOpen((v) => !v)}
            >
              <span className="material-symbols-outlined">
                {outputOpen ? 'expand_more' : 'chevron_right'}
              </span>
              <span>{out.label}</span>
            </button>

            {outputOpen && (
              <div className="preview-panel__log-rows">
                {out.rows.map((r) => (
                  <div key={r.label} className="preview-panel__log-row">
                    <span className="preview-panel__log-row-label">{r.label}</span>
                    <span className="preview-panel__log-row-value">{r.value}</span>
                  </div>
                ))}

                {out.children.map((child) => (
                  <div key={child.id} className="preview-panel__log-child">
                    <button
                      type="button"
                      className="preview-panel__log-output-toggle preview-panel__log-output-toggle--child"
                      onClick={() =>
                        setChildOpen((prev) => ({ ...prev, [child.id]: !prev[child.id] }))
                      }
                    >
                      <span className="material-symbols-outlined">
                        {childOpen[child.id] ? 'expand_more' : 'chevron_right'}
                      </span>
                      <span className="preview-panel__log-child-label">
                        {child.label}
                        {child.badge && (
                          <span className="preview-panel__log-badge">{`{ ${child.badge} }`}</span>
                        )}
                      </span>
                    </button>
                    {childOpen[child.id] && (
                      <div className="preview-panel__log-child-rows">
                        {child.rows.map((r) => (
                          <div key={r.label} className="preview-panel__log-row">
                            <span className="preview-panel__log-row-label">{r.label}</span>
                            <span className="preview-panel__log-row-value">{r.value}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {out.extraRows.map((r) => (
                  <div key={r.label} className="preview-panel__log-row">
                    <span className="preview-panel__log-row-label">{r.label}</span>
                    <span className="preview-panel__log-row-value">{r.value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {showAwaiting && (
          <div className="preview-panel__awaiting">
            <span className="material-symbols-outlined">warning</span>
            <span>Awaiting your response</span>
          </div>
        )}
      </div>
    </div>
  );
}

export function ProgressivePreviewLogsView({
  sections,
  visibleCount,
  completedCount,
}) {
  return (
    <div className="preview-panel__logs preview-panel__logs--embedded">
      {sections.map((section, index) => {
        if (index >= visibleCount) return null;
        const status = index < completedCount ? 'completed' : 'active';
        const isLastVisible =
          index === visibleCount - 1 ||
          sections.slice(index + 1).every((_, i) => index + 1 + i >= visibleCount);
        return (
          <PreviewLogSection
            key={section.id}
            section={section}
            status={status}
            isLast={isLastVisible}
            showAwaiting={Boolean(section.awaitingResponse && status === 'active')}
          />
        );
      })}
    </div>
  );
}

export function PreviewLogsView({ sections = PREVIEW_LOG_SECTIONS }) {
  return (
    <div className="preview-panel__logs">
      {sections.map((section, index) => (
        <PreviewLogSection
          key={section.id}
          section={section}
          status="completed"
          isLast={index === sections.length - 1}
        />
      ))}
    </div>
  );
}

export function PreviewStaticTranscript({ messages }) {
  return (
    <div className="preview-panel__active preview-panel__active--chat">
      <div className="preview-panel__transcript">
        {messages.map((m) => {
          if (m.role === 'system') {
            return <div key={m.id} className="pp-system">{m.text}</div>;
          }
          if (m.role === 'agent') {
            return (
              <div key={m.id} className="pp-agent-row">
                <div className="pp-agent-avatar">
                  <span className="material-symbols-outlined">auto_awesome</span>
                </div>
                <p className="pp-agent-text">{m.text}</p>
              </div>
            );
          }
          return (
            <div key={m.id} className="pp-user-row">
              <p className="pp-user-bubble">{m.text}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function PreviewSidePanelHeader({
  panel,
  onToggle,
  showClose = false,
  onClose = () => {},
  showViewLogs = true,
  logsLinkDisabled = false,
}) {
  const showLogs = panel === 'logs';

  return (
    <div className="preview-panel__header">
      <span className="preview-panel__title">{showLogs ? 'Logs' : 'Preview'}</span>
      <div className="preview-panel__header-actions">
        {showViewLogs && (
          <button
            type="button"
            className={`preview-panel__logs-link${logsLinkDisabled ? ' preview-panel__logs-link--disabled' : ''}`}
            onClick={onToggle}
            disabled={logsLinkDisabled}
          >
            {showLogs ? 'View preview' : 'View logs'}
          </button>
        )}
        {showClose && (
          <button
            type="button"
            className="preview-panel__close-btn"
            onClick={onClose}
            aria-label="Close preview"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        )}
      </div>
    </div>
  );
}
