import React, { useRef, useState } from 'react';
import RHSSidePanelHeader from '../../../Molecules/RHS/RHSHeader/RHSHeader';
import { FormInput, TextArea, SingleSelect } from '../../../elemental-stubs';
import styles from './RHS.module.css';
import llmStyles from './LLMTaskBody.module.css';
import entityStyles from './EntityTaskBody.module.css';
import birdeyeLogoUrl from '../../../../assets/birdeye-logo.svg';
import ownStyles from './SpamGatePanel.module.css';

const PANEL_WIDTH = 450;

const SEGMENTS = [
  { id: 'basic', label: 'Basic' },
  { id: 'tool', label: 'Tool' },
];

const DEFAULT_NAME = 'Spam and abuse gate';
const DEFAULT_DESCRIPTION =
  'Holds suspected spam and abusive reviews for review, and emails a daily digest of everything held.';

/** The run set both addresses, so the field starts with both chips. */
const DEFAULT_RECIPIENTS = ['reviews-alerts@birdeye.com', 'reviews-team@example.com'];

/** Digest send time — 12-hour clock on the half hour, with AM/PM picked separately. */
const SEND_TIME_OPTIONS = Array.from({ length: 24 }, (_, i) => {
  const hour = String(i === 0 || i === 1 ? 12 : Math.floor(i / 2)).padStart(2, '0');
  const label = `${hour}:${i % 2 === 0 ? '00' : '30'}`;
  return { value: label, label };
});
const MERIDIEM_OPTIONS = [
  { value: 'AM', label: 'AM' },
  { value: 'PM', label: 'PM' },
];

/**
 * Multi-chip email field — Enter or comma commits, Backspace on an empty input removes the
 * last chip, and the ✕ on a chip removes it. Mirrors the Recipients pattern used elsewhere.
 */
function ChipField({ values, onChange, placeholder }) {
  const [entry, setEntry] = useState('');
  const [focused, setFocused] = useState(false);
  const inputRef = useRef(null);

  const commit = () => {
    const next = entry.trim().replace(/,$/, '');
    if (!next || values.includes(next)) {
      setEntry('');
      return;
    }
    onChange([...values, next]);
    setEntry('');
  };

  return (
    <div
      className={`${ownStyles.chipField}${focused ? ` ${ownStyles.chipFieldFocused}` : ''}`}
      onClick={() => inputRef.current?.focus()}
    >
      {values.map((value) => (
        <span key={value} className={ownStyles.chip}>
          <span className={ownStyles.chipLabel}>{value}</span>
          <button
            type="button"
            className={ownStyles.chipRemove}
            aria-label={`Remove ${value}`}
            onClick={(e) => {
              e.stopPropagation();
              onChange(values.filter((v) => v !== value));
            }}
          >
            <span className="material-symbols-outlined" aria-hidden>close</span>
          </button>
        </span>
      ))}
      <input
        ref={inputRef}
        className={ownStyles.chipInput}
        value={entry}
        placeholder={placeholder}
        onChange={(e) => setEntry(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => {
          setFocused(false);
          commit();
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            commit();
            return;
          }
          if (e.key === 'Backspace' && !entry && values.length) {
            onChange(values.slice(0, -1));
          }
        }}
      />
    </div>
  );
}

/**
 * Config panel opened from the "Spam and abuse gate" link in the Ghostwriter scripted reply.
 * Reuses the node RHS's shell (`RHS.module.css`), header and segmented tab track
 * (`LLMTaskBody.module.css`), plus the tool row chrome from `EntityTaskBody.module.css`, so
 * it is indistinguishable from the panel a canvas node opens.
 */
export default function SpamGatePanel({ onClose }) {
  const [activeSegment, setActiveSegment] = useState('basic');
  const [name, setName] = useState(DEFAULT_NAME);
  const [description, setDescription] = useState(DEFAULT_DESCRIPTION);

  // Every tool function is an editable field.
  const [threshold, setThreshold] = useState('0.8');
  const [recipients, setRecipients] = useState(DEFAULT_RECIPIENTS);
  const [sendTime, setSendTime] = useState('08:00');
  const [sendMeridiem, setSendMeridiem] = useState('AM');
  const [onHold, setOnHold] = useState('No public reply · await human release');
  const [holding, setHolding] = useState('11 reviews from the last 1,035');

  return (
    <div className={styles['rhs-panel']} style={{ width: PANEL_WIDTH }}>
      {/* No `typeBadge` — that prop is what adds the type icon and the separator rule under
          the header, and this panel wants neither. */}
      <RHSSidePanelHeader
        title={DEFAULT_NAME}
        onClose={onClose}
        showActions={false}
        showMoreMenu={false}
      />

      <div className={styles['rhs-panel__body']}>
        <div className={llmStyles.segmentedContainer}>
          <div className={llmStyles.segmentedTrack}>
            {SEGMENTS.map((segment) => (
              <button
                key={segment.id}
                type="button"
                className={`${llmStyles.segmentedTab}${
                  activeSegment === segment.id ? ` ${llmStyles.segmentedTabActive}` : ''
                }`}
                onClick={() => setActiveSegment(segment.id)}
                aria-pressed={activeSegment === segment.id}
              >
                <span className={llmStyles.segmentedTabInner}>{segment.label}</span>
              </button>
            ))}
          </div>

          {activeSegment === 'basic' && (
            <>
              <FormInput
                name="spamGateName"
                type="text"
                label="Task name"
                placeholder="Enter name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <TextArea
                name="spamGateDescription"
                label="Description"
                placeholder="Enter"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                noFloatingLabel
              />
            </>
          )}

          {activeSegment === 'tool' && (
            /* Same label + card chrome as the task RHS's tool section. */
            <div className={entityStyles.toolsSection}>
              <div className={entityStyles.toolSelectField}>
                <span className={entityStyles.sectionLabelText}>Tool</span>
                <div className={entityStyles.toolCard}>
                  <div className={entityStyles.toolRow} style={{ cursor: 'default' }}>
                    <div className={entityStyles.toolRowMain}>
                      <div className={`${entityStyles.toolIconWrap} ${entityStyles.toolIconWrapBirdeye}`}>
                        <img src={birdeyeLogoUrl} alt="" className={entityStyles.toolIconBirdeye} />
                      </div>
                      <span className={entityStyles.toolName}>{DEFAULT_NAME}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className={ownStyles.fields}>
                <div className={ownStyles.field}>
                  <FormInput
                    name="spamThreshold"
                    type="text"
                    label="Spam score threshold"
                    placeholder="0.0 – 1.0"
                    value={threshold}
                    onChange={(e) => setThreshold(e.target.value)}
                  />
                  <p className={ownStyles.hint}>
                    Anything scoring above this is held and never answered publicly.
                  </p>
                </div>

                <div className={ownStyles.field}>
                  <div className={ownStyles.labelRow}>
                    <span className={ownStyles.label}>
                      Digest recipients<span className={ownStyles.required}>*</span>
                    </span>
                  </div>
                  <ChipField
                    values={recipients}
                    onChange={setRecipients}
                    placeholder="Enter an email"
                  />
                  <p className={ownStyles.hint}>
                    Two recipients — the second can action holds from the dashboard.
                  </p>
                </div>

                <div className={ownStyles.field}>
                  <div className={ownStyles.labelRow}>
                    <span className={ownStyles.label}>Digest send time</span>
                  </div>
                  {/* Two selects side by side, same as DelayBody's amount + unit pair.
                      `portalMenu` matters here — this panel scrolls, so an in-flow menu
                      would be clipped by the body. */}
                  <div style={{ display: 'flex', gap: 12 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <SingleSelect
                        name="spamSendTime"
                        selected={sendTime}
                        options={SEND_TIME_OPTIONS}
                        onChange={(opt) => setSendTime(opt.value)}
                        placeholder="Select time"
                        portalMenu
                      />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <SingleSelect
                        name="spamSendMeridiem"
                        selected={sendMeridiem}
                        options={MERIDIEM_OPTIONS}
                        onChange={(opt) => setSendMeridiem(opt.value)}
                        placeholder="AM / PM"
                        portalMenu
                      />
                    </div>
                  </div>
                  <p className={ownStyles.hint}>Sent in each location&apos;s timezone.</p>
                </div>

                <FormInput
                  name="spamOnHold"
                  type="text"
                  label="Action on hold"
                  placeholder="Enter an action"
                  value={onHold}
                  onChange={(e) => setOnHold(e.target.value)}
                />

                <FormInput
                  name="spamHolding"
                  type="text"
                  label="Currently holding"
                  placeholder="Enter"
                  value={holding}
                  onChange={(e) => setHolding(e.target.value)}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
