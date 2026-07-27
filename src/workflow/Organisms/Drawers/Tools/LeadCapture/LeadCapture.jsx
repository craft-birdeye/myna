import React, { useState } from 'react';
import { FormInput, TabHeader, TextArea, Tooltip, DrawerHeader } from '../../../../elemental-stubs';






const font = '"Inter", sans-serif';

const COLORS = {
  primary: '#212121',
  secondary: '#555',
  tertiary: '#8f8f8f',
  divider: '#eaeaea',
  dividerLight: '#e9e9eb',
  accent: '#1976d2',
  white: '#ffffff',
  hoverBg: '#f2f4f7',
  mobileFrame: 'rgba(141,157,202,0.3)',
};

const TABS = [
  { label: 'Webchat', value: 'webchat' },
  { label: 'Text', value: 'text' },
  { label: 'Email', value: 'email' },
  { label: 'Social', value: 'social' },
];

const WEBCHAT_FIELDS = [
  { id: 'locations', label: 'Location', mandatory: true, locked: true },
  { id: 'name', label: 'Name', mandatory: true, locked: true },
  { id: 'mobile', label: 'Mobile number', mandatory: true, locked: false },
  { id: 'email', label: 'Email', mandatory: true, locked: true },
  { id: 'message', label: 'Message', mandatory: true, locked: true },
];

const TEXT_FIELDS = [
  { id: 'mobile', label: 'Mobile number', mandatory: true, locked: true },
  { id: 'name', label: 'Name', mandatory: false, locked: false },
];

const EMAIL_FIELDS = [
  { id: 'locations', label: 'Select locations', mandatory: true, locked: true },
  { id: 'name', label: 'Name', mandatory: true, locked: true },
  { id: 'country_code', label: 'Country code', mandatory: true, locked: true },
  { id: 'mobile', label: 'Mobile number', mandatory: true, locked: true },
  { id: 'subject', label: 'Subject', mandatory: true, locked: true },
  { id: 'message', label: 'Message', mandatory: true, locked: true },
];

const SOCIAL_FIELDS = [
  { id: 'locations', label: 'Location', mandatory: true, locked: true },
  { id: 'name', label: 'Name', mandatory: true, locked: true },
  { id: 'mobile', label: 'Mobile number', mandatory: true, locked: false },
  { id: 'email', label: 'Email', mandatory: true, locked: true },
  { id: 'message', label: 'Message', mandatory: true, locked: true },
];

const CloseIcon = ({ size = 16 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={COLORS.secondary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const AddCircleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={COLORS.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="16" />
    <line x1="8" y1="12" x2="16" y2="12" />
  </svg>
);

const ChevronDownIcon = ({ size = 20 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={COLORS.tertiary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const InfoIcon = ({ size = 16 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={COLORS.tertiary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="11" x2="12" y2="16" />
    <circle cx="12" cy="8" r="0.5" fill={COLORS.tertiary} stroke="none" />
  </svg>
);

const AccountCircleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={COLORS.primary} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="10" r="3.2" />
    <path d="M5.5 19c1.3-2.5 3.8-4 6.5-4s5.2 1.5 6.5 4" />
  </svg>
);

const BackIconSmall = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={COLORS.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);

function ChatPreview() {
  return (
    <div
      style={{
        width: 320,
        height: 457,
        borderRadius: 16,
        border: `1px solid ${COLORS.divider}`,
        background: COLORS.white,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: font,
      }}
    >
      <div style={{ background: COLORS.accent, height: 72, padding: '8px 20px', display: 'flex', alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: 280 }}>
          <div style={{ height: 12, width: 150, borderRadius: 4, background: 'rgba(255,255,255,0.4)' }} />
          <div style={{ height: 8, width: 280, borderRadius: 4, background: 'rgba(255,255,255,0.4)' }} />
        </div>
      </div>
      <div style={{ padding: '8px 30px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <PreviewRow label="Select location" trailing={<ChevronDownIcon />} />
        <PreviewRow label="Name" />
        <div style={{ padding: '12px 0', borderBottom: `1px solid ${COLORS.divider}`, display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, lineHeight: '20px', color: COLORS.tertiary, fontFamily: font, whiteSpace: 'nowrap' }}>
            Country code
            <ChevronDownIcon size={14} />
          </span>
          <span style={{ flex: 1, fontSize: 12, lineHeight: '20px', color: COLORS.tertiary, fontFamily: font }}>
            Mobile number
          </span>
        </div>
        <div style={{ padding: '12px 0', borderBottom: `1px solid ${COLORS.divider}`, display: 'flex', alignItems: 'flex-start', minHeight: 60 }}>
          <span style={{ fontSize: 12, lineHeight: '20px', color: COLORS.tertiary, fontFamily: font }}>
            Message
          </span>
        </div>
        <button
          type="button"
          disabled
          style={{
            marginTop: 4,
            height: 36,
            width: '100%',
            border: 'none',
            borderRadius: 4,
            background: '#ededed',
            color: '#9e9e9e',
            font: `400 14px/20px ${font}`,
            cursor: 'not-allowed',
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}

function PreviewRow({ label, trailing }) {
  return (
    <div style={{ padding: '12px 0', borderBottom: `1px solid ${COLORS.divider}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span style={{ fontSize: 12, lineHeight: '20px', color: COLORS.tertiary, fontFamily: font }}>
        {label}
      </span>
      {trailing}
    </div>
  );
}

function EmailFieldRow({ label, value, isMultiline }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: isMultiline ? 'flex-start' : 'center',
        borderBottom: `1px solid ${COLORS.divider}`,
        padding: '8px 16px',
        gap: 8,
        minHeight: isMultiline ? 72 : 36,
      }}
    >
      <span style={{ fontSize: 12, color: COLORS.secondary, minWidth: 56, lineHeight: '20px', paddingTop: isMultiline ? 2 : 0 }}>
        {label}
      </span>
      <span style={{ fontSize: 12, color: COLORS.tertiary, lineHeight: '20px', flex: 1 }}>
        {value}
      </span>
    </div>
  );
}

function EmailPreview() {
  return (
    <div
      style={{
        width: 320,
        borderRadius: 8,
        border: `1px solid ${COLORS.divider}`,
        background: COLORS.white,
        overflow: 'hidden',
        fontFamily: font,
        boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
      }}
    >
      {/* Compose header */}
      <div
        style={{
          background: '#404040',
          padding: '10px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span style={{ fontSize: 13, color: '#fff', lineHeight: '20px' }}>New Message</span>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2.5" strokeLinecap="round">
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </div>
      </div>

      {/* To row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          borderBottom: `1px solid ${COLORS.divider}`,
          padding: '8px 16px',
          gap: 8,
          minHeight: 36,
        }}
      >
        <span style={{ fontSize: 12, color: COLORS.secondary, minWidth: 56, lineHeight: '20px' }}>To</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
          <div style={{ background: '#e8eaf6', borderRadius: 12, padding: '2px 10px', display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 11, color: '#3949ab', lineHeight: '18px' }}>Select locations</span>
            <ChevronDownIcon size={12} />
          </div>
        </div>
      </div>

      <EmailFieldRow label="From" value="customer@email.com" />
      <EmailFieldRow label="Name" value="Full name" />

      {/* Country code + Mobile */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          borderBottom: `1px solid ${COLORS.divider}`,
          padding: '8px 16px',
          gap: 8,
          minHeight: 36,
        }}
      >
        <span style={{ fontSize: 12, color: COLORS.secondary, minWidth: 56, lineHeight: '20px' }}>Mobile</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: 12, color: COLORS.tertiary }}>
            +1 <ChevronDownIcon size={12} />
          </span>
          <span style={{ fontSize: 12, color: COLORS.tertiary, marginLeft: 6 }}>Mobile number</span>
        </div>
      </div>

      <EmailFieldRow label="Subject" value="Subject line" />
      <EmailFieldRow label="Message" value="Write your message here..." isMultiline />

      {/* Toolbar */}
      <div
        style={{
          padding: '10px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#fafafa',
          borderTop: `1px solid ${COLORS.divider}`,
        }}
      >
        <button
          type="button"
          disabled
          style={{
            background: COLORS.accent,
            color: '#fff',
            border: 'none',
            borderRadius: 4,
            padding: '6px 20px',
            font: `400 13px/20px ${font}`,
            cursor: 'not-allowed',
            opacity: 0.7,
          }}
        >
          Send
        </button>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          {/* Attachment icon */}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={COLORS.tertiary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
          </svg>
          {/* Trash icon */}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={COLORS.tertiary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14H6L5 6" />
            <path d="M10 11v6" />
            <path d="M14 11v6" />
            <path d="M9 6V4h6v2" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function MobilePreview() {
  return (
    <div
      style={{
        width: 316,
        height: 606,
        borderRadius: 40,
        border: `9px solid ${COLORS.mobileFrame}`,
        background: COLORS.white,
        position: 'relative',
        boxSizing: 'border-box',
        fontFamily: font,
        overflow: 'hidden',
      }}
    >
      {/* Status pill */}
      <div style={{ position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)', width: 74, height: 9, borderRadius: 10.5, background: '#dde2ef' }} />

      {/* Header: back + avatar + number */}
      <div style={{ position: 'absolute', top: 48, left: 0, right: 0, display: 'flex', alignItems: 'center', padding: '0 20px' }}>
        <BackIconSmall />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <AccountCircleIcon />
          <p style={{ margin: 0, fontSize: 12, fontWeight: 400, lineHeight: '18px', color: COLORS.primary, letterSpacing: '-0.24px' }}>
            +1 (555) 123-4567
          </p>
        </div>
        <div style={{ width: 16 }} />
      </div>

      {/* Chat bubble */}
      <div
        style={{
          position: 'absolute', top: 144, left: 19, width: 227, minHeight: 60,
          background: COLORS.hoverBg,
          borderRadius: '16px 16px 16px 4px',
          padding: '10px 12px 8px 12px',
          display: 'flex', flexDirection: 'column', gap: 3,
        }}
      >
        <p style={{ margin: 0, fontSize: 14, lineHeight: '20px', color: COLORS.primary }}>
          Incoming text from the customer.
        </p>
        <span style={{ fontSize: 10, lineHeight: '15px', color: '#999' }}>09:12 PM</span>
      </div>
    </div>
  );
}

function SocialPreview() {
  return (
    <div
      style={{
        width: 316,
        height: 606,
        borderRadius: 40,
        border: `9px solid ${COLORS.mobileFrame}`,
        background: COLORS.white,
        position: 'relative',
        boxSizing: 'border-box',
        fontFamily: font,
        overflow: 'hidden',
      }}
    >
      {/* Status pill */}
      <div style={{ position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)', width: 74, height: 9, borderRadius: 10.5, background: '#dde2ef' }} />

      {/* Header: back + gradient avatar ring + handle */}
      <div style={{ position: 'absolute', top: 48, left: 0, right: 0, display: 'flex', alignItems: 'center', padding: '0 20px' }}>
        <BackIconSmall />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <div
            style={{
              width: 28, height: 28, borderRadius: '50%', padding: 2,
              background: 'linear-gradient(45deg, #feda75, #d62976, #4f5bd5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: COLORS.white, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AccountCircleIcon />
            </div>
          </div>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 400, lineHeight: '18px', color: COLORS.primary, letterSpacing: '-0.24px' }}>
            @customer.handle
          </p>
        </div>
        <div style={{ width: 16 }} />
      </div>

      {/* DM bubble */}
      <div
        style={{
          position: 'absolute', top: 144, left: 19, width: 227, minHeight: 60,
          background: COLORS.hoverBg,
          borderRadius: '16px 16px 16px 4px',
          padding: '10px 12px 8px 12px',
          display: 'flex', flexDirection: 'column', gap: 3,
        }}
      >
        <p style={{ margin: 0, fontSize: 14, lineHeight: '20px', color: COLORS.primary }}>
          Incoming DM from the customer.
        </p>
        <span style={{ fontSize: 10, lineHeight: '15px', color: '#999' }}>09:12 PM</span>
      </div>
    </div>
  );
}

const TAB_CONFIG = {
  webchat: {
    subtitle: 'Define when and how the agent should collect customer information to generate leads.',
    captureOptions: [
      { value: 'before', label: 'Before conversation starts' },
      { value: 'during', label: 'During the conversation' },
      { value: 'none', label: 'Do not capture leads' },
    ],
    defaultCapture: 'before',
    defaultFields: WEBCHAT_FIELDS,
    Preview: ChatPreview,
  },
  text: {
    subtitle: 'Define what lead information the agent should collect to generate leads',
    captureOptions: [
      { value: 'capture', label: 'Capture leads' },
      { value: 'none', label: 'Do not capture leads' },
    ],
    defaultCapture: 'capture',
    defaultFields: TEXT_FIELDS,
    Preview: MobilePreview,
  },
  email: {
    subtitle: 'Define what lead information the agent should collect from email conversations.',
    captureOptions: [
      { value: 'capture', label: 'Capture leads' },
      { value: 'none', label: 'Do not capture leads' },
    ],
    defaultCapture: 'capture',
    defaultFields: EMAIL_FIELDS,
    Preview: EmailPreview,
  },
  social: {
    subtitle: 'Define when and how the agent should collect customer information across social DMs.',
    captureOptions: [
      { value: 'before', label: 'Before conversation starts' },
      { value: 'during', label: 'During the conversation' },
      { value: 'none', label: 'Do not capture leads' },
    ],
    defaultCapture: 'before',
    defaultFields: SOCIAL_FIELDS,
    Preview: SocialPreview,
  },
};

const EMPTY_CONFIG = {
  subtitle: 'Configuration coming soon.',
  captureOptions: [],
  defaultCapture: 'none',
  defaultFields: [],
  Preview: null,
};

export default function LeadCapture({
  title = 'Lead Capture',
  onBack,
  onSave,
}) {
  const [activeTab, setActiveTab] = useState('webchat');
  const [tabState, setTabState] = useState(() => ({
    webchat: { captureWhen: 'before', fields: WEBCHAT_FIELDS },
    text: { captureWhen: 'capture', fields: TEXT_FIELDS },
    email: { captureWhen: 'capture', fields: EMAIL_FIELDS },
    social: { captureWhen: 'before', fields: SOCIAL_FIELDS },
  }));

  const config = TAB_CONFIG[activeTab] || EMPTY_CONFIG;
  const current = tabState[activeTab] || { captureWhen: config.defaultCapture, fields: config.defaultFields };

  const setCaptureWhen = (value) =>
    setTabState((prev) => ({ ...prev, [activeTab]: { ...prev[activeTab], captureWhen: value } }));

  const toggleMandatory = (id) =>
    setTabState((prev) => ({
      ...prev,
      [activeTab]: {
        ...prev[activeTab],
        fields: prev[activeTab].fields.map((f) => (f.id === id && !f.locked ? { ...f, mandatory: !f.mandatory } : f)),
      },
    }));

  const removeField = (id) =>
    setTabState((prev) => ({
      ...prev,
      [activeTab]: {
        ...prev[activeTab],
        fields: prev[activeTab].fields.filter((f) => f.id !== id),
      },
    }));

  const showBelow = current.captureWhen !== 'none';
  const Preview = config.Preview;

  return (
    <div style={{ width: 650, maxWidth: '100%', background: COLORS.white, fontFamily: font, display: 'flex', flexDirection: 'column', alignItems: 'stretch', textAlign: 'left', margin: 0 }}>
      <DrawerHeader
        title={title}
        onBack={onBack}
        actions={[{ label: 'Save', onClick: onSave }]}
      />

      <div style={{ padding: '0 30px' }}>
        <TabHeader
          content={TABS}
          activeTab={activeTab}
          clickTab={setActiveTab}
          noSeperator="true"
          isAeroDesign
        />
      </div>

      <div style={{ padding: '24px 30px 16px', display: 'flex', flexDirection: 'column', gap: 32 }}>
        {/* Capture leads */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 400, lineHeight: '20px', color: COLORS.primary }}>
              Capture leads
            </p>
            <Tooltip
              text={config.subtitle}
              position="right"
              display="inline-flex"
              doNotTriggerMouseOverOnMount
            >
              <InfoIcon />
            </Tooltip>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-start' }}>
            {config.captureOptions.map((opt) => (
              <FormInput
                key={opt.value}
                type="radio"
                name={`capture-when-${activeTab}`}
                value={opt.value}
                label={opt.label}
                checked={current.captureWhen === opt.value}
                onChange={() => setCaptureWhen(opt.value)}
                labelInside
              />
            ))}
          </div>
        </section>

        {showBelow && (
          <>
            {/* Lead capture fields */}
            <section style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 400, lineHeight: '20px', color: COLORS.primary }}>
                Lead capture fields
              </p>

              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex' }}>
                  {/* Mandatory column */}
                  <div style={{ width: 100, display: 'flex', flexDirection: 'column' }}>
                    <div style={{
                      height: 52, padding: 16, display: 'flex', alignItems: 'center', gap: 4,
                      borderBottom: `1px solid ${COLORS.dividerLight}`, boxSizing: 'border-box',
                    }}>
                      <span style={{ fontSize: 14, fontWeight: 400, lineHeight: '20px', color: COLORS.secondary }}>Mandatory</span>
                      <ChevronDownIcon size={16} />
                    </div>
                    {current.fields.map((f) => (
                      <div
                        key={f.id}
                        style={{
                          height: 56, padding: '20.5px 16px', display: 'flex', alignItems: 'center',
                          borderBottom: `1px solid ${COLORS.divider}`, boxSizing: 'border-box',
                        }}
                      >
                        <FormInput
                          type="checkbox"
                          name={`mandatory-${activeTab}-${f.id}`}
                          checked={f.mandatory}
                          disabled={f.locked}
                          onChange={() => toggleMandatory(f.id)}
                        />
                      </div>
                    ))}
                  </div>

                  {/* Fields column */}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div style={{
                      height: 52, padding: 16, display: 'flex', alignItems: 'center', gap: 4,
                      borderBottom: `1px solid ${COLORS.dividerLight}`, boxSizing: 'border-box',
                    }}>
                      <span style={{ fontSize: 14, fontWeight: 400, lineHeight: '20px', color: COLORS.secondary }}>Field</span>
                      <ChevronDownIcon size={16} />
                    </div>
                    {current.fields.map((f) => (
                      <div
                        key={f.id}
                        style={{
                          height: 56, padding: '18px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          borderBottom: `1px solid ${COLORS.divider}`, boxSizing: 'border-box',
                        }}
                      >
                        <span style={{ fontSize: 14, lineHeight: '20px', color: COLORS.primary }}>{f.label}</span>
                        {!f.locked && (
                          <button
                            type="button"
                            aria-label={`Remove ${f.label}`}
                            onClick={() => removeField(f.id)}
                            style={{ background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', display: 'flex' }}
                          >
                            <CloseIcon size={16} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  style={{
                    marginTop: 12, height: 40, display: 'flex', alignItems: 'center', gap: 4,
                    background: 'transparent', border: 'none', padding: 0, cursor: 'pointer',
                    color: COLORS.accent, font: `400 14px/20px ${font}`,
                  }}
                >
                  <AddCircleIcon />
                  <span>Add more fields</span>
                </button>
              </div>
            </section>

            {/* Preview */}
            {Preview && (
              <section style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 400, lineHeight: '20px', color: COLORS.primary }}>
                  Preview
                </p>
                <Preview />
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
