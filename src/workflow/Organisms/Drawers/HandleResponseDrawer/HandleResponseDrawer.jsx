import React, { useState, useEffect } from 'react';
import { SingleSelect } from '../../../elemental-stubs';
import UserPromptInput from '../../../Molecules/Inputs/UserPromptInput/UserPromptInput';
import './HandleResponseDrawer.css';

export const RESPONSE_HANDLING_OPTIONS = [
  {
    value: 'post-directly',
    label: 'Post directly',
    hint: 'Responses are posted directly. For non-integrated sites, responses will show as suggestions only.',
  },
  {
    value: 'post-after-approval',
    label: 'Post after approval',
    hint: 'Responses requires human approval before posting',
  },
  {
    value: 'show-as-suggested',
    label: 'Show as suggested response',
    hint: 'Responses are shown as reply suggestions in the dashboard that can be posted manually',
  },
];

const POST_AFTER_OPTIONS = [
  'Immediately',
  '1 hour',
  '6 hours',
  '12 hours',
  '24 hours',
  '48 hours',
  '72 hours',
].map((label) => ({ value: label, label }));

/** Mandatory fields — the Tool card in Task details shows an error until both are set. */
export function isHandleResponseConfigComplete(config = {}) {
  return !!String(config.responseText ?? '').trim() && !!config.postAfter;
}

function NativeDrawer({ isOpen, onClose, children }) {
  if (!isOpen) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', justifyContent: 'flex-end' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)' }} />
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          width: 650,
          maxWidth: '95vw',
          height: '100%',
          overflowY: 'auto',
          background: '#fff',
          boxShadow: '-4px 0 24px rgba(0,0,0,0.14)',
        }}
      >
        {children}
      </div>
    </div>
  );
}

/**
 * Config drawer for the `handle-response` Birdeye tool, opened from the Task details
 * Tool card's pencil. Saving a complete config clears that card's
 * "Missing mandatory fields" error.
 */
export default function HandleResponseDrawer({ isOpen, onClose, value = {}, onSave }) {
  const [responseText, setResponseText] = useState('');
  const [responseHandling, setResponseHandling] = useState('post-directly');
  const [postAfter, setPostAfter] = useState('');

  // Re-seed from the saved config each time the drawer opens.
  useEffect(() => {
    if (!isOpen) return;
    setResponseText(value.responseText ?? '');
    setResponseHandling(value.responseHandling ?? 'post-directly');
    setPostAfter(value.postAfter ?? '');
  }, [isOpen]);

  const draft = { responseText, responseHandling, postAfter };
  const canSave = isHandleResponseConfigComplete(draft);

  return (
    <NativeDrawer isOpen={isOpen} onClose={onClose}>
      <div className="hrd">
        <div className="hrd__header">
          <div className="hrd__header-left">
            <button type="button" className="hrd__back" onClick={onClose} aria-label="Back">
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>arrow_back</span>
            </button>
            <span className="hrd__title">Handle response</span>
          </div>
          <button
            type="button"
            className="hrd__save"
            disabled={!canSave}
            onClick={() => onSave?.(draft)}
          >
            Save
          </button>
        </div>

        <div className="hrd__body">
          <div className="hrd__field">
            <span className="hrd__label">
              Response text<span className="hrd__required"> *</span>
            </span>
            <UserPromptInput
              hideLabel
              fieldsOnly
              value={responseText}
              onChange={setResponseText}
              placeholder=""
            />
          </div>

          <div className="hrd__field">
            <span className="hrd__label">Response handling</span>
            <div className="hrd__radios">
              {RESPONSE_HANDLING_OPTIONS.map((opt) => (
                <label key={opt.value} className="hrd__radio">
                  <input
                    type="radio"
                    name="handle-response-mode"
                    className="hrd__radio-input"
                    checked={responseHandling === opt.value}
                    onChange={() => setResponseHandling(opt.value)}
                  />
                  <span className="hrd__radio-copy">
                    <span className="hrd__radio-label">{opt.label}</span>
                    <span className="hrd__radio-hint">{opt.hint}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="hrd__field">
            <span className="hrd__label">
              Post response after<span className="hrd__required"> *</span>
            </span>
            <SingleSelect
              name="postAfter"
              selected={postAfter}
              options={POST_AFTER_OPTIONS}
              placeholder="Select delay"
              onChange={(opt) => setPostAfter(opt.value)}
            />
          </div>
        </div>
      </div>
    </NativeDrawer>
  );
}
