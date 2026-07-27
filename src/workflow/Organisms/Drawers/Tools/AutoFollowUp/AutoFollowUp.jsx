import React, { useState } from 'react';
import { TabHeader, TextArea, Toggle, Tooltip, DrawerHeader } from '../../../../elemental-stubs';
import { Icon } from '../../../../../components/Icon/Icon';





const font = '"Roboto", sans-serif';

const COLORS = {
  primary: '#212121',
  secondary: '#555',
  tertiary: '#8f8f8f',
  border: '#ccc',
  divider: '#eaeaea',
  stepBorder: '#a3a3a3',
  accent: '#1976d2',
  white: '#ffffff',
  cardBg: '#fafafa',
};

const TABS = [
  { label: 'Webchat', value: 'webchat' },
  { label: 'Text', value: 'text' },
  { label: 'Email', value: 'email' },
  { label: 'Social', value: 'social' },
];

const TIMING_OPTIONS = [
  { label: '1 minute', value: '1m' },
  { label: '3 minutes', value: '3m' },
  { label: '5 minutes', value: '5m' },
  { label: '10 minutes', value: '10m' },
  { label: '30 minutes', value: '30m' },
  { label: '1 hour', value: '1h' },
  { label: '3 hours', value: '3h' },
  { label: '6 hours', value: '6h' },
  { label: '12 hours', value: '12h' },
  { label: '24 hours', value: '24h' },
  { label: '48 hours', value: '48h' },
  { label: '72 hours', value: '72h' },
];

const TAB_DEFAULTS = {
  webchat: {
    channels: { email: true, text: true },
    steps: [
      {
        id: 'step_1',
        timing: '3m',
        duringMessage:
          "Hey [First name], this is [Business name] and we couldn't finish the conversation on our website, feel free to call us on [Business phone] for your needs or text us on this number.",
        outsideMessage:
          "Hey [First name], this is [Business name] and we couldn't finish the conversation on our website. We're not operational right now—feel free to call [Business phone] or text us during 9 AM – 6 PM.",
      },
      {
        id: 'step_2',
        timing: '24h',
        duringMessage:
          "Hey [First name], just checking in from [Business name]. We missed connecting with you yesterday on our website—if you're still interested, feel free to call us at [Business phone] or text us here. We're happy to help!",
        outsideMessage:
          "Hey [First name], this is [Business name].\nWe couldn't finish our conversation on the website yesterday. We're currently outside business hours, but feel free to call us at [Business phone] or text us here during 9 AM – 6 PM.",
      },
    ],
  },
  text: {
    channels: { email: true, text: true },
    steps: [
      {
        id: 'step_1',
        timing: '3m',
        duringMessage:
          "Hi [First name]! [Business name] here. We noticed you reached out—happy to help! Call [Business phone] or reply here.",
        outsideMessage:
          "Hi [First name]! [Business name] here. We got your text but we're closed right now. Reach us at [Business phone] during 9 AM – 6 PM or reply here anytime!",
      },
      {
        id: 'step_2',
        timing: '24h',
        duringMessage:
          "Hey [First name], just following up from [Business name]. Still happy to help—give us a call at [Business phone] or text us here!",
        outsideMessage:
          "Hey [First name], [Business name] again. We're outside business hours but will get back to you soon. Call [Business phone] during 9 AM – 6 PM.",
      },
    ],
  },
  email: {
    channels: { email: true, text: true },
    steps: [
      {
        id: 'step_1',
        timing: '30m',
        duringMessage:
          "Hi [First name],\n\nThank you for reaching out to [Business name]. We received your message and our team will get back to you shortly.\n\nIn the meantime, feel free to call us at [Business phone].\n\nBest regards,\n[Business name] Team",
        outsideMessage:
          "Hi [First name],\n\nThank you for contacting [Business name]. Our office is currently closed, but we'll respond during our next business hours (9 AM – 6 PM).\n\nIf you need immediate assistance, call us at [Business phone].\n\nBest regards,\n[Business name] Team",
      },
      {
        id: 'step_2',
        timing: '24h',
        duringMessage:
          "Hi [First name],\n\nJust following up on your previous inquiry with [Business name]. We want to make sure we address your needs—please reply to this email or call us at [Business phone].\n\nBest regards,\n[Business name] Team",
        outsideMessage:
          "Hi [First name],\n\nWe're following up from [Business name] regarding your recent inquiry. We apologize for any delay and will respond as soon as we're back in office.\n\nFeel free to call [Business phone] during business hours (9 AM – 6 PM).\n\nBest regards,\n[Business name] Team",
      },
    ],
  },
  social: {
    channels: { email: true, text: true },
    steps: [
      {
        id: 'step_1',
        timing: '3m',
        duringMessage:
          "Hey [First name], this is [Business name] and we couldn't finish the conversation on social, feel free to call us on [Business phone] for your needs or text us on this number.",
        outsideMessage:
          "Hey [First name], this is [Business name] and we couldn't finish the conversation on social. We're not operational right now—feel free to call [Business phone] or text us during 9 AM – 6 PM.",
      },
      {
        id: 'step_2',
        timing: '24h',
        duringMessage:
          "Hey [First name], just checking in from [Business name]. We missed connecting with you yesterday on social—if you're still interested, feel free to call us at [Business phone] or text us here. We're happy to help!",
        outsideMessage:
          "Hey [First name], this is [Business name].\nWe couldn't finish our conversation on social yesterday. We're currently outside business hours, but feel free to call us at [Business phone] or text us here during 9 AM – 6 PM.",
      },
    ],
  },
};

const buildTabState = (tab) => ({
  enabled: true,
  channels: { ...TAB_DEFAULTS[tab].channels },
  steps: TAB_DEFAULTS[tab].steps.map((s) => ({ ...s })),
});

const ChevronIcon = ({ size = 12, color = COLORS.accent }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    style={{ flexShrink: 0 }}
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

function StepNumber({ n }) {
  return (
    <div
      style={{
        width: 26,
        height: 26,
        minWidth: 26,
        borderRadius: 60,
        border: `1px solid ${COLORS.stepBorder}`,
        background: COLORS.white,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: font,
        fontSize: 12,
        fontWeight: 500,
        lineHeight: '18px',
        color: '#000',
        letterSpacing: '-0.24px',
        boxSizing: 'border-box',
        flexShrink: 0,
      }}
    >
      {n}
    </div>
  );
}

function TimingSelect({ value, onChange }) {
  const selected = TIMING_OPTIONS.find((o) => o.value === value);
  return (
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          appearance: 'none',
          WebkitAppearance: 'none',
          background: 'transparent',
          border: 'none',
          padding: '0 18px 0 0',
          cursor: 'pointer',
          fontFamily: font,
          fontSize: 14,
          fontWeight: 400,
          lineHeight: '22px',
          color: COLORS.accent,
          letterSpacing: '-0.1px',
        }}
      >
        {TIMING_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <span style={{ position: 'absolute', right: 0, pointerEvents: 'none', display: 'flex', alignItems: 'center' }}>
        <ChevronIcon />
      </span>
    </div>
  );
}

function EditButton({ visible, isEditing, onClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      tabIndex={visible ? 0 : -1}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 28,
        height: 28,
        border: `1px solid ${hovered ? COLORS.accent : COLORS.border}`,
        borderRadius: 4,
        background: hovered ? '#e8f0fe' : COLORS.white,
        cursor: 'pointer',
        padding: 0,
        flexShrink: 0,
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? 'auto' : 'none',
        transition: 'background 0.15s, border-color 0.15s, opacity 0.15s',
      }}
      aria-label={isEditing ? 'Save message' : 'Edit message'}
    >
      <span style={{ color: COLORS.accent, display: 'flex' }}>
        <Icon name={isEditing ? 'check' : 'edit'} size={16} />
      </span>
    </button>
  );
}

function MessageCard({ title, message, isEditing, onEdit, onSave, onMessageChange }) {
  const [hovered, setHovered] = useState(false);
  const showAction = hovered || isEditing;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 4,
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <p
          style={{
            margin: 0,
            fontFamily: font,
            fontSize: 14,
            fontWeight: 400,
            lineHeight: '20px',
            color: COLORS.primary,
            letterSpacing: '-0.28px',
          }}
        >
          {title}
        </p>
        <EditButton
          visible={showAction}
          isEditing={isEditing}
          onClick={isEditing ? onSave : onEdit}
        />
      </div>

      {isEditing ? (
        <TextArea
          name={`followup-msg-${title}`}
          value={message}
          rows={4}
          onChange={(e) => onMessageChange(e?.target?.value ?? '')}
        />
      ) : (
        <p
          style={{
            margin: 0,
            fontFamily: font,
            fontSize: 12,
            fontWeight: 400,
            lineHeight: '18px',
            color: COLORS.secondary,
            whiteSpace: 'pre-wrap',
          }}
        >
          {message}
        </p>
      )}
    </div>
  );
}

function FollowUpStep({ stepIndex, step, isLast, onTimingChange, onMessageChange, editingMap, onEdit, onSave }) {
  return (
    <div style={{ display: 'flex', gap: 20, alignItems: 'stretch' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
        <StepNumber n={stepIndex + 1} />
        {!isLast && (
          <div
            style={{
              flex: 1,
              width: 1,
              borderLeft: `1px dashed ${COLORS.stepBorder}`,
              marginTop: 6,
              marginBottom: 6,
            }}
          />
        )}
      </div>

      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          paddingBottom: isLast ? 0 : 24,
          minWidth: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <p
            style={{
              margin: 0,
              fontFamily: font,
              fontSize: 14,
              fontWeight: 400,
              lineHeight: '20px',
              color: COLORS.primary,
              whiteSpace: 'pre',
            }}
          >
            {'Follow up after the visitor is inactive for  '}
          </p>
          <TimingSelect value={step.timing} onChange={(v) => onTimingChange(step.id, v)} />
        </div>

        <MessageCard
          title="During business hours"
          message={step.duringMessage}
          isEditing={!!editingMap[`${step.id}_during`]}
          onEdit={() => onEdit(`${step.id}_during`)}
          onSave={() => onSave(`${step.id}_during`)}
          onMessageChange={(val) => onMessageChange(step.id, 'duringMessage', val)}
        />

        <MessageCard
          title="Outside business hours"
          message={step.outsideMessage}
          isEditing={!!editingMap[`${step.id}_outside`]}
          onEdit={() => onEdit(`${step.id}_outside`)}
          onSave={() => onSave(`${step.id}_outside`)}
          onMessageChange={(val) => onMessageChange(step.id, 'outsideMessage', val)}
        />
      </div>
    </div>
  );
}

export default function AutoFollowUp({ title = 'Auto follow up', onBack, onSave }) {
  const [activeTab, setActiveTab] = useState('webchat');
  const [tabState, setTabState] = useState(() => ({
    webchat: buildTabState('webchat'),
    text: buildTabState('text'),
    email: buildTabState('email'),
    social: buildTabState('social'),
  }));
  const [editingMap, setEditingMap] = useState({});

  const state = tabState[activeTab];

  const updateTab = (patch) =>
    setTabState((prev) => ({ ...prev, [activeTab]: { ...prev[activeTab], ...patch } }));

  const setEnabled = (val) => updateTab({ enabled: val });

  const setChannel = (channel, val) =>
    updateTab({ channels: { ...state.channels, [channel]: val } });

  const setTiming = (stepId, timing) =>
    updateTab({
      steps: state.steps.map((s) => (s.id === stepId ? { ...s, timing } : s)),
    });

  const setMessage = (stepId, field, value) =>
    updateTab({
      steps: state.steps.map((s) => (s.id === stepId ? { ...s, [field]: value } : s)),
    });

  const handleEdit = (key) => setEditingMap((prev) => ({ ...prev, [key]: true }));
  const handleSave = (key) => setEditingMap((prev) => ({ ...prev, [key]: false }));

  return (
    <div
      style={{
        width: 650,
        maxWidth: '100%',
        background: COLORS.white,
        fontFamily: font,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        textAlign: 'left',
      }}
    >
      <DrawerHeader title={title} onBack={onBack} actions={[{ label: 'Save', onClick: onSave }]} />

      <div style={{ padding: '0 30px' }}>
        <TabHeader
          content={TABS}
          activeTab={activeTab}
          clickTab={setActiveTab}
          noSeperator="true"
          isAeroDesign
        />
      </div>

      <div style={{ padding: '24px 30px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Master toggle */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <p
              style={{
                margin: 0,
                fontFamily: font,
                fontSize: 12,
                fontWeight: 400,
                lineHeight: '18px',
                color: COLORS.primary,
              }}
            >
              Visitor follow up
            </p>
            <Tooltip
              text="Send follow-up messages to the visitor through webchat, text, email, or social. Configure the content and timing in the settings below."
              position="top"
              display="inline-flex"
              doNotTriggerMouseOverOnMount
            >
              <span style={{ color: COLORS.tertiary, cursor: 'pointer', display: 'flex' }}>
                <Icon name="info" size={16} />
              </span>
            </Tooltip>
          </div>
          <Toggle
            name="followup-enabled"
            checked={state.enabled}
            roundedToggle
            onChange={(val) => setEnabled(!!val)}
          />
        </div>

        {/* Follow-up channel checkboxes */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <p
              style={{
                margin: 0,
                fontFamily: font,
                fontSize: 12,
                fontWeight: 400,
                lineHeight: '18px',
                color: COLORS.primary,
              }}
            >
              Follow up using
            </p>
            <Tooltip
              text="Choose which channels the visitor will receive follow-up messages on."
              position="top"
              display="inline-flex"
              doNotTriggerMouseOverOnMount
            >
              <span style={{ color: COLORS.tertiary, cursor: 'pointer', display: 'flex' }}>
                <Icon name="info" size={16} />
              </span>
            </Tooltip>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { key: 'email', label: 'Email' },
              { key: 'text', label: 'Text' },
            ].map(({ key, label }) => (
              <label
                key={key}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  cursor: 'pointer',
                  fontFamily: font,
                  fontSize: 14,
                  fontWeight: 400,
                  lineHeight: '20px',
                  color: COLORS.primary,
                  userSelect: 'none',
                }}
              >
                <input
                  type="checkbox"
                  checked={state.channels[key]}
                  onChange={(e) => setChannel(key, e.target.checked)}
                  style={{
                    width: 16,
                    height: 16,
                    accentColor: COLORS.accent,
                    cursor: 'pointer',
                    flexShrink: 0,
                  }}
                />
                {label}
              </label>
            ))}
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${COLORS.divider}`, marginTop: 4 }} />

        {/* Steps */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {state.steps.map((step, i) => (
            <FollowUpStep
              key={step.id}
              stepIndex={i}
              step={step}
              isLast={i === state.steps.length - 1}
              onTimingChange={setTiming}
              onMessageChange={setMessage}
              editingMap={editingMap}
              onEdit={handleEdit}
              onSave={handleSave}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
