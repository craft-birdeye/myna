import React, { useState } from 'react';
import { FormInput, TabHeader, TextArea, Toggle, Tooltip, DrawerHeader, SingleSelect } from '../../../../elemental-stubs';
import ChatPreview from '../../../../Molecules/ChannelConfig/ChatPreview';








const font = '"Inter", sans-serif';

const COLORS = {
  primary: '#212121',
  secondary: '#555',
  border: '#ccc',
  divider: '#eaeaea',
  stepBorder: '#a3a3a3',
  accent: '#1976d2',
  white: '#ffffff',
  tertiary: '#8f8f8f',
  mobileFrame: 'rgba(141,157,202,0.3)',
  bubbleBg: '#f2f4f7',
  pillBg: '#dde2ef',
  timestamp: '#999',
  cardBg: '#f7f8fa',
};

const TABS = [
  { label: 'Voice', value: 'voice' },
  { label: 'Chat', value: 'chat' },
  { label: 'Text', value: 'text' },
];

const ChevronIcon = ({ open }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke={COLORS.secondary}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 120ms ease' }}
    aria-hidden="true"
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const BackIconSmall = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke={COLORS.primary}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);

const PencilIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={COLORS.secondary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" />
  </svg>
);

const VariableIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={COLORS.secondary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M8 4c-2 0-2 2-2 4v1c0 2-2 2-2 3s2 1 2 3v1c0 2 0 4 2 4" />
    <path d="M16 4c2 0 2 2 2 4v1c0 2 2 2 2 3s-2 1-2 3v1c0 2 0 4-2 4" />
  </svg>
);

const LinkIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={COLORS.secondary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
);

const EmojiIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={COLORS.secondary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <path d="M8 14s1.5 2 4 2 4-2 4-2" />
    <line x1="9" y1="9" x2="9.01" y2="9" />
    <line x1="15" y1="9" x2="15.01" y2="9" />
  </svg>
);

function MessageToolbar({ onInsertVariable, onInsertLink, onInsertEmoji }) {
  const btnStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 24,
    height: 24,
    background: 'transparent',
    border: 'none',
    padding: 0,
    cursor: 'pointer',
  };
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <button type="button" style={btnStyle} onClick={onInsertVariable} aria-label="Insert variable">
        <VariableIcon />
      </button>
      <button type="button" style={btnStyle} onClick={onInsertLink} aria-label="Insert link">
        <LinkIcon />
      </button>
      <button type="button" style={btnStyle} onClick={onInsertEmoji} aria-label="Insert emoji">
        <EmojiIcon />
      </button>
    </div>
  );
}

const FALLBACK_DURATION_OPTIONS = [
  { value: '1', label: '1 minute' },
  { value: '3', label: '3 minutes' },
  { value: '5', label: '5 minutes' },
  { value: '10', label: '10 minutes' },
  { value: '15', label: '15 minutes' },
  { value: '30', label: '30 minutes' },
];

function StepChatPreview({ message, phase = 'during' }) {
  return (
    <ChatPreview
      agentName="Birdeye AI"
      previewType="fallbackMessage"
      fallbackDuringHours={phase === 'during' ? message : ''}
      fallbackAfterHours={phase === 'after' ? message : ''}
    />
  );
}

function TextMobilePreview({ message }) {
  return (
    <div
      style={{
        width: 200,
        height: 384,
        borderRadius: 24,
        border: `6px solid ${COLORS.mobileFrame}`,
        background: COLORS.white,
        position: 'relative',
        boxSizing: 'border-box',
        fontFamily: font,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 8,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 50,
          height: 6,
          borderRadius: 8,
          background: COLORS.pillBg,
        }}
      />

      <div
        style={{
          position: 'absolute',
          top: 28,
          left: 0,
          right: 0,
          display: 'flex',
          alignItems: 'center',
          padding: '0 10px',
        }}
      >
        <BackIconSmall />
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <div
            style={{
              width: 22,
              height: 22,
              borderRadius: 4,
              background: COLORS.bubbleBg,
            }}
          />
          <p
            style={{
              margin: 0,
              fontSize: 10,
              fontWeight: 400,
              lineHeight: '14px',
              color: COLORS.primary,
            }}
          >
            Birdeye
          </p>
        </div>
        <div style={{ width: 16 }} />
      </div>

      <div
        style={{
          position: 'absolute',
          top: 96,
          right: 12,
          maxWidth: 130,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: 2,
        }}
      >
        <div
          style={{
            background: COLORS.bubbleBg,
            borderRadius: '12px 12px 4px 12px',
            padding: '6px 8px',
            width: 110,
            height: 18,
          }}
        />
        <span style={{ fontSize: 8, color: COLORS.timestamp, lineHeight: '10px' }}>09:14 PM</span>
      </div>

      <div
        style={{
          position: 'absolute',
          top: 156,
          left: 12,
          maxWidth: 140,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        <div
          style={{
            background: COLORS.bubbleBg,
            borderRadius: '12px 12px 12px 4px',
            padding: '8px 10px',
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: 9,
              lineHeight: '13px',
              color: COLORS.primary,
              fontFamily: font,
            }}
          >
            {message}
          </p>
        </div>
        <span style={{ fontSize: 8, color: COLORS.timestamp, lineHeight: '10px' }}>09:15 PM</span>
      </div>
    </div>
  );
}

const DEFAULT_BODY =
  'I see that you want to talk to my human colleagues, let me notify them to join the conversation, this may take a few minutes. You can always text us at [Business phone]';
const FALLBACK_BODY =
  'Sorry my human colleagues are taking longer than usual, is it okay if we text or email you the details in sometime?';
const NOTIFY_BODY =
  'Notifies business users with "New message received" when conversation is escalated';
const CLOSING_INACTIVITY_BODY =
  'The best way to get ahold of us is to text us [Business phone] [Business texting number]';
const OFFLINE_BODY =
  "We're closed right now but we got your message. We'll text you on your number when we're back!";
const CLOSING_OUTSIDE_BODY =
  "We’re currently closed, but our AI assistant is here to help you 24/7. Feel free to continue the conversation, a team member will follow up once we're back. You can also text us anytime at [Business phone] or [Business texting number].";

const CHAT_TAB = {
  during: [
    {
      id: 'default_message',
      title: 'Send default message',
      body: DEFAULT_BODY,
      showPreview: true,
      renderPreview: () => <StepChatPreview message={DEFAULT_BODY} phase="during" />,
      defaultOn: true,
    },
    { id: 'notify_business', title: 'Send notification to business users', body: NOTIFY_BODY, defaultOn: true, locked: true },
    {
      id: 'fallback_message',
      title: 'Send fallback message after 3 minutes',
      body: FALLBACK_BODY,
      tooltip: 'Sent if no business user responds within 3 minutes of escalation.',
      showPreview: true,
      renderPreview: () => <StepChatPreview message={FALLBACK_BODY} phase="during" />,
      defaultOn: true,
      hasDuration: true,
    },
    {
      id: 'closing_inactivity',
      title: 'Show closing message after 3 minutes of inactivity',
      body: CLOSING_INACTIVITY_BODY,
      tooltip: 'Shown when the conversation has been inactive for 3 minutes.',
      showPreview: true,
      renderPreview: () => <StepChatPreview message={CLOSING_INACTIVITY_BODY} phase="during" />,
      defaultOn: true,
      hasTitle: true,
    },
  ],
  outside: [
    {
      id: 'offline_message',
      title: 'Send offline message',
      body: OFFLINE_BODY,
      showPreview: true,
      renderPreview: () => <StepChatPreview message={OFFLINE_BODY} phase="after" />,
      defaultOn: true,
    },
    {
      id: 'closing_outside',
      title: 'Show closing message',
      body: CLOSING_OUTSIDE_BODY,
      showPreview: true,
      renderPreview: () => <StepChatPreview message={CLOSING_OUTSIDE_BODY} phase="after" />,
      defaultOn: true,
      hasTitle: true,
    },
  ],
};

const TEXT_TAB = {
  during: [
    {
      id: 'default_message',
      title: 'Send default message',
      body: DEFAULT_BODY,
      showPreview: true,
      previewExpandedByDefault: true,
      renderPreview: () => <TextMobilePreview message={DEFAULT_BODY} />,
      defaultOn: true,
    },
    { id: 'notify_business', title: 'Send notification to business users', body: NOTIFY_BODY, defaultOn: true, locked: true },
    {
      id: 'fallback_message',
      title: 'Send fallback message after 3 minutes',
      body: FALLBACK_BODY,
      tooltip: 'Sent if no business user responds within 3 minutes of escalation.',
      showPreview: true,
      renderPreview: () => <TextMobilePreview message={FALLBACK_BODY} />,
      defaultOn: true,
      hasDuration: true,
    },
  ],
  outside: [
    {
      id: 'offline_message',
      title: 'Send offline message',
      body: OFFLINE_BODY,
      showPreview: true,
      previewVariant: 'inline',
      renderPreview: () => <TextMobilePreview message={OFFLINE_BODY} />,
      defaultOn: true,
    },
    {
      id: 'closing_outside_text',
      title: 'Show closing message after 3mins of inactivity',
      body: CLOSING_OUTSIDE_BODY,
      showPreview: true,
      previewVariant: 'inline',
      renderPreview: () => <TextMobilePreview message={CLOSING_OUTSIDE_BODY} />,
      defaultOn: true,
      hasTitle: true,
    },
  ],
};

const VOICE_DEFAULTS = {
  transfer_to_number: {
    prompt: 'When the caller asks to speak to a human, a representative, an agent, or otherwise indicates they want to escalate, transfer the call.',
    phone: '+1 (555) 123-4567',
  },
};

function TransferToNumberFields({ value, onChange }) {
  const current = value || VOICE_DEFAULTS.transfer_to_number;
  const update = (patch) => onChange({ ...current, ...patch });
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <label
          style={{
            fontFamily: font,
            fontSize: 12,
            fontWeight: 400,
            color: COLORS.secondary,
            lineHeight: '18px',
          }}
        >
          Trigger prompt
        </label>
        <TextArea
          name="voice-transfer-prompt"
          value={current.prompt}
          rows={3}
          placeholder="Describe when the LLM should transfer the call…"
          onChange={(_cmp, e) => update({ prompt: e?.target?.value ?? '' })}
        />
        <span style={{ fontFamily: font, fontSize: 11, color: COLORS.tertiary, lineHeight: '16px' }}>
          The LLM node uses this prompt to decide when to invoke <em>transfer_call</em>.
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxWidth: 320 }}>
        <label
          style={{
            fontFamily: font,
            fontSize: 12,
            fontWeight: 400,
            color: COLORS.secondary,
            lineHeight: '18px',
          }}
        >
          Transfer to phone number
        </label>
        <FormInput
          type="text"
          name="voice-transfer-phone"
          value={current.phone}
          placeholder="+1 (555) 123-4567"
          onChange={(_cmp, e) => update({ phone: e?.target?.value ?? '' })}
        />
      </div>
    </div>
  );
}

const VOICE_VOICEMAIL_BODY =
  "Hi, our team isn't available right now. Please leave a message after the beep and we'll text you back as soon as we're back.";
const VOICE_HOLD_BODY =
  "Please hold for a moment while I connect you with one of our team members.";

const VOICE_TAB = {
  during: [
    {
      id: 'transfer_to_number',
      title: 'Transfer to a human',
      body: 'Connect the caller to a live representative. The LLM node decides when to transfer using the prompt below.',
      defaultOn: true,
      renderExtra: TransferToNumberFields,
    },
    {
      id: 'hold_message',
      title: 'Play hold message while connecting',
      body: VOICE_HOLD_BODY,
      tooltip: 'Spoken to the caller while the transfer is being placed.',
      defaultOn: true,
    },
    {
      id: 'notify_business',
      title: 'Send notification to business users',
      body: NOTIFY_BODY,
      defaultOn: true,
      locked: true,
    },
  ],
  outside: [
    {
      id: 'voicemail',
      title: 'Send to voicemail',
      body: VOICE_VOICEMAIL_BODY,
      defaultOn: true,
    },
  ],
};

const EMAIL_ACK_BODY =
  "Thanks for reaching out! We've received your message and a team member will get back to you shortly.";
const EMAIL_NOTIFY_BODY =
  'Notifies business users with "New email received" when a conversation is escalated via email.';
const EMAIL_FALLBACK_BODY =
  "We're sorry for the delay. Our team is currently busy but will respond to your inquiry as soon as possible. Thank you for your patience.";
const EMAIL_OFFLINE_BODY =
  "Thanks for emailing us! Our office is currently closed. We'll get back to you during our next business hours. You can also reach us at [Business phone].";
const EMAIL_CLOSING_BODY =
  "We're currently outside business hours, but we've received your email and will respond once we're back. A team member will follow up with you soon.";

function EmailPreviewCard({ subject, body, from = 'no-reply@birdeye.com', isReply }) {
  return (
    <div
      style={{
        width: 320,
        borderRadius: 8,
        border: `1px solid ${COLORS.divider}`,
        background: COLORS.white,
        overflow: 'hidden',
        fontFamily: font,
        boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
      }}
    >
      {/* Inbox row header */}
      <div
        style={{
          background: '#f5f5f5',
          borderBottom: `1px solid ${COLORS.divider}`,
          padding: '8px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: COLORS.accent,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: 12, color: '#fff', lineHeight: 1 }}>B</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: 12, color: COLORS.primary, lineHeight: '18px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {isReply ? 'Re: ' : ''}{subject}
          </span>
          <span style={{ fontSize: 11, color: COLORS.tertiary, lineHeight: '16px' }}>{from}</span>
        </div>
        <span style={{ fontSize: 10, color: COLORS.tertiary, flexShrink: 0 }}>just now</span>
      </div>

      {/* Email body */}
      <div style={{ padding: '12px 14px 14px' }}>
        <p
          style={{
            margin: 0,
            fontSize: 12,
            lineHeight: '18px',
            color: COLORS.secondary,
            fontFamily: font,
          }}
        >
          {body}
        </p>
      </div>
    </div>
  );
}

const EMAIL_TAB = {
  during: [
    {
      id: 'ack_email',
      title: 'Send acknowledgment email',
      body: EMAIL_ACK_BODY,
      tooltip: 'Auto-reply sent to the customer confirming their email was received.',
      showPreview: true,
      renderPreview: () => (
        <EmailPreviewCard
          subject="We received your message"
          body={EMAIL_ACK_BODY}
          isReply
        />
      ),
      defaultOn: true,
    },
    {
      id: 'notify_business',
      title: 'Send notification to business users',
      body: EMAIL_NOTIFY_BODY,
      defaultOn: true,
      locked: true,
    },
    {
      id: 'fallback_email',
      title: 'Send follow-up if no response after 30 minutes',
      body: EMAIL_FALLBACK_BODY,
      tooltip: 'Sent if no business user has responded within 30 minutes.',
      showPreview: true,
      renderPreview: () => (
        <EmailPreviewCard
          subject="Still with you — following up"
          body={EMAIL_FALLBACK_BODY}
          isReply
        />
      ),
      defaultOn: true,
    },
  ],
  outside: [
    {
      id: 'offline_email',
      title: 'Send out-of-office reply',
      body: EMAIL_OFFLINE_BODY,
      showPreview: true,
      renderPreview: () => (
        <EmailPreviewCard
          subject="Out of office: we'll be in touch"
          body={EMAIL_OFFLINE_BODY}
          isReply
        />
      ),
      defaultOn: true,
    },
    {
      id: 'closing_email',
      title: 'Send closing message',
      body: EMAIL_CLOSING_BODY,
      showPreview: true,
      renderPreview: () => (
        <EmailPreviewCard
          subject="We'll follow up soon"
          body={EMAIL_CLOSING_BODY}
          isReply
        />
      ),
      defaultOn: false,
    },
  ],
};

const EMPTY_TAB = { during: [], outside: [] };

const TAB_CONFIG = {
  voice: VOICE_TAB,
  chat: CHAT_TAB,
  text: TEXT_TAB,
  email: EMAIL_TAB,
};

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
        fontWeight: 400,
        lineHeight: '18px',
        color: '#000',
        letterSpacing: '-0.24px',
        boxSizing: 'border-box',
      }}
    >
      {n}
    </div>
  );
}

function PreviewToggleButton({ open, onClick, variant = 'link' }) {
  if (variant === 'inline') {
    return (
      <button
        type="button"
        onClick={onClick}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 2,
          background: 'transparent',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          fontFamily: font,
          fontSize: 12,
          fontWeight: 400,
          lineHeight: '18px',
          color: COLORS.secondary,
          letterSpacing: '-0.24px',
        }}
      >
        <span>{open ? 'Hide preview' : 'Show preview'}</span>
        <ChevronIcon open={open} />
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        alignSelf: 'flex-start',
        background: 'transparent',
        border: 'none',
        padding: 0,
        cursor: 'pointer',
        fontFamily: font,
        fontSize: 12,
        fontWeight: 400,
        lineHeight: '18px',
        color: COLORS.accent,
        letterSpacing: '-0.24px',
      }}
    >
      {open ? 'Hide preview' : 'Show preview'}
    </button>
  );
}

function Step({ index, step, isLast, value, onToggle, previewOpen, onTogglePreview, extra, onExtraChange, showToggle = true }) {
  const hasPreview = !!step.renderPreview;
  return (
    <div style={{ display: 'flex', gap: 14, alignItems: 'stretch', position: 'relative' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <StepNumber n={index + 1} />
        {!isLast && (
          <div
            style={{
              flex: 1,
              width: 1,
              borderLeft: `1px dashed ${COLORS.stepBorder}`,
              marginTop: 4,
              marginBottom: 4,
            }}
          />
        )}
      </div>

      <div
        style={{
          flex: 1,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          paddingBottom: isLast ? 0 : 20,
          borderBottom: isLast ? 'none' : `1px solid ${COLORS.divider}`,
          marginBottom: isLast ? 0 : 20,
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <p
              style={{
                margin: 0,
                fontFamily: font,
                fontSize: 14,
                fontWeight: 400,
                lineHeight: '20px',
                color: COLORS.primary,
              }}
            >
              {step.title}
            </p>
            {step.tooltip && (
              <Tooltip
                text={step.tooltip}
                position="top"
                display="inline-flex"
                doNotTriggerMouseOverOnMount
              >
                <i
                  className="icon_phoenix-info"
                  style={{ fontSize: 16, color: COLORS.tertiary, cursor: 'pointer' }}
                />
              </Tooltip>
            )}
          </div>

          <p
            style={{
              margin: 0,
              fontFamily: font,
              fontSize: 12,
              fontWeight: 400,
              lineHeight: '18px',
              color: COLORS.secondary,
              maxWidth: 477,
            }}
          >
            {step.body}
          </p>

          {step.renderExtra && step.renderExtra({ value: extra, onChange: onExtraChange })}

          {step.showPreview && (
            <PreviewToggleButton
              open={previewOpen}
              onClick={hasPreview ? onTogglePreview : undefined}
              variant={step.previewVariant || 'link'}
            />
          )}

          {hasPreview && previewOpen && (
            <div style={{ marginTop: 8 }}>{step.renderPreview()}</div>
          )}
        </div>

        {showToggle && (
          <Toggle
            name={`escalation-${step.id}`}
            checked={value}
            disabled={!!step.locked}
            roundedToggle
            onChange={(_cmp, e) => onToggle(!!e?.target?.checked)}
          />
        )}
      </div>
    </div>
  );
}

function StepSection({ title, steps, values, setValue, previewOpenMap, togglePreview, extras, setExtra, showToggle = true, onEdit }) {
  const [hovered, setHovered] = useState(false);
  if (!steps.length) return null;
  return (
    <section
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
        ...(onEdit
          ? { background: COLORS.cardBg, borderRadius: 8, padding: 20 }
          : {}),
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
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
        {onEdit && hovered && (
          <button
            type="button"
            onClick={onEdit}
            aria-label={`Edit ${title}`}
            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', padding: 0, cursor: 'pointer' }}
          >
            <PencilIcon />
          </button>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {steps.map((step, i) => (
          <Step
            key={step.id}
            index={i}
            step={step}
            isLast={i === steps.length - 1}
            value={values[step.id]}
            onToggle={(next) => setValue(step.id, next)}
            previewOpen={!!previewOpenMap[step.id]}
            onTogglePreview={() => togglePreview(step.id)}
            extra={extras?.[step.id]}
            onExtraChange={(next) => setExtra(step.id, next)}
            showToggle={showToggle}
          />
        ))}
      </div>
    </section>
  );
}

function EditStep({ index, step, isLast, message, onMessageChange, previewOpen, onTogglePreview, extra, onExtraChange, onManageNotifications }) {
  const hasPreview = !!step.renderPreview;
  return (
    <div style={{ display: 'flex', gap: 14, alignItems: 'stretch', position: 'relative' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <StepNumber n={index + 1} />
        {!isLast && (
          <div
            style={{
              flex: 1,
              width: 1,
              borderLeft: `1px dashed ${COLORS.stepBorder}`,
              marginTop: 4,
              marginBottom: 4,
            }}
          />
        )}
      </div>

      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          paddingBottom: isLast ? 0 : 20,
          borderBottom: isLast ? 'none' : `1px solid ${COLORS.divider}`,
          marginBottom: isLast ? 0 : 20,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <p style={{ margin: 0, fontFamily: font, fontSize: 14, fontWeight: 400, lineHeight: '20px', color: COLORS.primary }}>
            {step.title}
          </p>
          {step.tooltip && (
            <Tooltip text={step.tooltip} position="top" display="inline-flex" doNotTriggerMouseOverOnMount>
              <i className="icon_phoenix-info" style={{ fontSize: 16, color: COLORS.tertiary, cursor: 'pointer' }} />
            </Tooltip>
          )}
        </div>

        {step.locked ? (
          <>
            <p style={{ margin: 0, fontFamily: font, fontSize: 12, fontWeight: 400, lineHeight: '18px', color: COLORS.secondary, maxWidth: 477 }}>
              {step.body}
            </p>
            <button
              type="button"
              onClick={onManageNotifications}
              style={{ alignSelf: 'flex-start', background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', fontFamily: font, fontSize: 12, fontWeight: 400, lineHeight: '18px', color: COLORS.accent, letterSpacing: '-0.24px' }}
            >
              Manage notifications
            </button>
          </>
        ) : (
          <>
            {step.hasDuration && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxWidth: 320 }}>
                <label style={{ fontFamily: font, fontSize: 12, fontWeight: 400, color: COLORS.secondary, lineHeight: '18px' }}>
                  Show fallback message after
                </label>
                <SingleSelect
                  name={`escalation-${step.id}-duration`}
                  selected={extra?.duration || '5'}
                  options={FALLBACK_DURATION_OPTIONS}
                  onChange={(opt) => onExtraChange({ ...extra, duration: opt.value })}
                />
              </div>
            )}

            {step.hasTitle && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontFamily: font, fontSize: 12, fontWeight: 400, color: COLORS.secondary, lineHeight: '18px' }}>
                  Title
                </label>
                <FormInput
                  type="text"
                  name={`escalation-${step.id}-title`}
                  value={extra?.title || ''}
                  placeholder="Enter input"
                  onChange={(_cmp, e) => onExtraChange({ ...extra, title: e?.target?.value ?? '' })}
                />
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label style={{ fontFamily: font, fontSize: 12, fontWeight: 400, color: COLORS.secondary, lineHeight: '18px' }}>
                Enter message
              </label>
              <span style={{ fontFamily: font, fontSize: 11, color: COLORS.tertiary }}>
                {(message || '').length}/500
              </span>
            </div>
            <TextArea
              name={`escalation-${step.id}-message`}
              value={message}
              rows={4}
              placeholder="Enter input"
              onChange={(_cmp, e) => onMessageChange((e?.target?.value ?? '').slice(0, 500))}
            />
            <MessageToolbar
              onInsertVariable={() => onMessageChange(`${message || ''}{Business phone}`)}
              onInsertLink={() => {}}
              onInsertEmoji={() => {}}
            />

            {step.showPreview && (
              <PreviewToggleButton open={previewOpen} onClick={hasPreview ? onTogglePreview : undefined} variant={step.previewVariant || 'link'} />
            )}
            {hasPreview && previewOpen && <div style={{ marginTop: 8 }}>{step.renderPreview()}</div>}
          </>
        )}
      </div>
    </div>
  );
}

function EditView({ steps, messages, setMessage, previewOpenMap, togglePreview, extras, setExtra, channelLabel }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <p style={{ margin: '0 0 20px', fontFamily: font, fontSize: 12, fontWeight: 400, lineHeight: '18px', color: COLORS.secondary }}>
        Edit escalation notification for {channelLabel}
      </p>
      {steps.map((step, i) => (
        <EditStep
          key={step.id}
          index={i}
          step={step}
          isLast={i === steps.length - 1}
          message={messages[step.id]}
          onMessageChange={(next) => setMessage(step.id, next)}
          previewOpen={!!previewOpenMap[step.id]}
          onTogglePreview={() => togglePreview(step.id)}
          extra={extras?.[step.id]}
          onExtraChange={(next) => setExtra(step.id, next)}
        />
      ))}
    </div>
  );
}

const initialToggles = (steps) =>
  steps.reduce((acc, s) => {
    acc[s.id] = s.defaultOn;
    return acc;
  }, {});

const initialPreviews = (steps) =>
  steps.reduce((acc, s) => {
    if (s.renderPreview) acc[s.id] = !!s.previewExpandedByDefault;
    return acc;
  }, {});

const initialExtras = (steps) =>
  steps.reduce((acc, s) => {
    if (s.renderExtra) acc[s.id] = VOICE_DEFAULTS[s.id] || {};
    else if (s.hasDuration || s.hasTitle) acc[s.id] = { duration: '5', title: '' };
    return acc;
  }, {});

const initialMessages = (steps) =>
  steps.reduce((acc, s) => {
    if (!s.locked) acc[s.id] = s.body;
    return acc;
  }, {});

function buildTabState(tabConfig) {
  return {
    duringValues: initialToggles(tabConfig.during),
    outsideValues: initialToggles(tabConfig.outside),
    duringPreviews: initialPreviews(tabConfig.during),
    outsidePreviews: initialPreviews(tabConfig.outside),
    duringExtras: initialExtras(tabConfig.during),
    outsideExtras: initialExtras(tabConfig.outside),
    duringMessages: initialMessages(tabConfig.during),
    outsideMessages: initialMessages(tabConfig.outside),
    section: 'summary',
  };
}

const CHANNEL_LABELS = { chat: 'Webchat', text: 'Text' };
const SECTION_LABELS = { during: 'During business hours', outside: 'Outside business hours' };

export default function EscalationNotifier({
  title = 'Escalation Notifier',
  onBack,
  onSave,
}) {
  const [activeTab, setActiveTab] = useState('voice');
  const [tabState, setTabState] = useState(() => ({
    voice: buildTabState(VOICE_TAB),
    chat: buildTabState(CHAT_TAB),
    text: buildTabState(TEXT_TAB),
    email: buildTabState(EMAIL_TAB),
  }));

  const config = TAB_CONFIG[activeTab] || EMPTY_TAB;
  const state =
    tabState[activeTab] || {
      duringValues: {},
      outsideValues: {},
      duringPreviews: {},
      outsidePreviews: {},
      duringExtras: {},
      outsideExtras: {},
      duringMessages: {},
      outsideMessages: {},
      section: 'summary',
    };

  const usesSummaryFlow = activeTab === 'chat' || activeTab === 'text';

  const update = (section, key, value) =>
    setTabState((prev) => ({
      ...prev,
      [activeTab]: {
        ...prev[activeTab],
        [section]: { ...prev[activeTab][section], [key]: value },
      },
    }));

  const setDuring = (id, value) => update('duringValues', id, value);
  const setOutside = (id, value) => update('outsideValues', id, value);
  const toggleDuringPreview = (id) =>
    update('duringPreviews', id, !state.duringPreviews[id]);
  const toggleOutsidePreview = (id) =>
    update('outsidePreviews', id, !state.outsidePreviews[id]);
  const setDuringExtra = (id, value) => update('duringExtras', id, value);
  const setOutsideExtra = (id, value) => update('outsideExtras', id, value);
  const setDuringMessage = (id, value) => update('duringMessages', id, value);
  const setOutsideMessage = (id, value) => update('outsideMessages', id, value);

  const setSection = (section) =>
    setTabState((prev) => ({ ...prev, [activeTab]: { ...prev[activeTab], section } }));

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setTabState((prev) => ({ ...prev, [tab]: { ...prev[tab], section: 'summary' } }));
  };

  const editingSection = usesSummaryFlow && state.section !== 'summary' ? state.section : null;

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
        margin: 0,
      }}
    >
      {editingSection ? (
        <DrawerHeader
          title={SECTION_LABELS[editingSection]}
          onBack={() => setSection('summary')}
          actions={[{ label: 'Save', onClick: onSave }]}
        />
      ) : (
        <DrawerHeader title={title} onBack={onBack} actions={[{ label: 'Save', onClick: onSave }]} />
      )}

      {!editingSection && (
        <div style={{ padding: '0 30px' }}>
          <TabHeader
            content={TABS}
            activeTab={activeTab}
            clickTab={handleTabChange}
            noSeperator="true"
            isAeroDesign
          />
        </div>
      )}

      <div
        style={{
          padding: '24px 30px',
          display: 'flex',
          flexDirection: 'column',
          gap: 48,
          background: COLORS.white,
        }}
      >
        {editingSection === 'during' && (
          <EditView
            steps={config.during}
            messages={state.duringMessages}
            setMessage={setDuringMessage}
            previewOpenMap={state.duringPreviews}
            togglePreview={toggleDuringPreview}
            extras={state.duringExtras}
            setExtra={setDuringExtra}
            channelLabel={CHANNEL_LABELS[activeTab]}
          />
        )}
        {editingSection === 'outside' && (
          <EditView
            steps={config.outside}
            messages={state.outsideMessages}
            setMessage={setOutsideMessage}
            previewOpenMap={state.outsidePreviews}
            togglePreview={toggleOutsidePreview}
            extras={state.outsideExtras}
            setExtra={setOutsideExtra}
            channelLabel={CHANNEL_LABELS[activeTab]}
          />
        )}
        {!editingSection && (
          <>
            <StepSection
              title="During business hours"
              steps={config.during}
              values={state.duringValues}
              setValue={setDuring}
              previewOpenMap={state.duringPreviews}
              togglePreview={toggleDuringPreview}
              extras={state.duringExtras}
              setExtra={setDuringExtra}
              showToggle={!usesSummaryFlow}
              onEdit={usesSummaryFlow ? () => setSection('during') : undefined}
            />
            <StepSection
              title="Outside business hours"
              steps={config.outside}
              values={state.outsideValues}
              setValue={setOutside}
              previewOpenMap={state.outsidePreviews}
              togglePreview={toggleOutsidePreview}
              extras={state.outsideExtras}
              setExtra={setOutsideExtra}
              showToggle={!usesSummaryFlow}
              onEdit={usesSummaryFlow ? () => setSection('outside') : undefined}
            />
          </>
        )}
      </div>
    </div>
  );
}
