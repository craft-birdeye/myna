import React, { useState } from 'react';
import { SingleSelect } from '../../../elemental-stubs';
import UserPromptInput from '../../../Molecules/Inputs/UserPromptInput/UserPromptInput';
import './ResponseHandlerToolDrawer.css';

const HANDLING_OPTIONS = [
  {
    value: 'post_directly',
    title: 'Post directly',
    description: 'Responses are posted directly. For non-integrated sites, responses will show as suggestions only.',
  },
  {
    value: 'post_after_approval',
    title: 'Post after approval',
    description: 'Responses requires human approval before posting',
  },
  {
    value: 'suggested_response',
    title: 'Show as suggested response',
    description: 'Responses are shown as reply suggestions in the dashboard that can be posted manually',
  },
];

const DELAY_OPTIONS = [
  { value: 'immediately', label: 'Immediately' },
  { value: '15m', label: '15 minutes' },
  { value: '30m', label: '30 minutes' },
  { value: '1h',  label: '1 hour' },
  { value: '4h',  label: '4 hours' },
  { value: '24h', label: '24 hours' },
];

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

export default function ResponseHandlerToolDrawer({ isOpen, onClose, initialValues = {}, onFieldChange }) {
  const [responseText, setResponseText] = useState(initialValues.responseText ?? '{{Review Response}}');
  const [responseHandling, setResponseHandling] = useState(initialValues.responseHandling ?? 'post_directly');
  const [responseDelay, setResponseDelay] = useState(initialValues.responseDelay ?? '');
  const [approvalWorkflow, setApprovalWorkflow] = useState(initialValues.approvalWorkflow ?? '');
  const [dirty, setDirty] = useState(false);

  const emit = (key, val) => {
    setDirty(true);
    onFieldChange?.(key, val);
  };

  const saveDisabled = !dirty;

  return (
    <NativeDrawer isOpen={isOpen} onClose={onClose}>
      <div className="rhtd">
        <div className="rhtd__header">
          <div className="rhtd__header-left">
            <button type="button" className="rhtd__back" onClick={onClose} aria-label="Back">
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>arrow_back</span>
            </button>
            <span className="rhtd__title">Handle response</span>
          </div>
          <button
            type="button"
            className={`rhtd__save${saveDisabled ? ' rhtd__save--disabled' : ''}`}
            onClick={saveDisabled ? undefined : onClose}
            disabled={saveDisabled}
          >
            Save
          </button>
        </div>

        <div className="rhtd__body">
          <div className="rhtd__section">
            <span className="rhtd__label">
              Response text<span className="rhtd__required"> *</span>
            </span>
            <UserPromptInput
              hideLabel
              value={responseText}
              onChange={(val) => { setResponseText(val); emit('responseText', val); }}
              placeholder="Enter response text"
            />
          </div>

          <div className="rhtd__section">
            <span className="rhtd__label">Response handling</span>
            <div className="rhtd__radio-group">
              {HANDLING_OPTIONS.map((opt) => (
                <label key={opt.value} className="rhtd__radio-option">
                  <input
                    type="radio"
                    name="rhtd-response-handling"
                    checked={responseHandling === opt.value}
                    onChange={() => { setResponseHandling(opt.value); emit('responseHandling', opt.value); }}
                  />
                  <span className="rhtd__radio-text">
                    <span className="rhtd__radio-title">{opt.title}</span>
                    <span className="rhtd__radio-description">{opt.description}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          {responseHandling === 'post_directly' && (
            <div className="rhtd__section">
              <span className="rhtd__label">
                Post response after<span className="rhtd__required"> *</span>
              </span>
              <SingleSelect
                name="rhtd-response-delay"
                selected={responseDelay}
                options={DELAY_OPTIONS}
                onChange={(opt) => { setResponseDelay(opt.value); emit('responseDelay', opt.value); }}
                placeholder="Select delay"
              />
            </div>
          )}

          {responseHandling === 'post_after_approval' && (
            <div className="rhtd__section">
              <span className="rhtd__label">
                Select approval workflow<span className="rhtd__required"> *</span>
              </span>
              <div className="rhtd__locked-field">
                <button type="button" className="tc-dropdown__trigger tc-dropdown__trigger--readonly rhtd__locked-trigger" disabled>
                  <span className="tc-dropdown__value tc-dropdown__value--placeholder">
                    {approvalWorkflow || 'Select approval workflow'}
                  </span>
                  <span className="material-symbols-outlined tc-dropdown__chevron">expand_more</span>
                </button>
                <div className="rhtd__locked-note">
                  <span className="material-symbols-outlined rhtd__locked-icon">lock</span>
                  <span>This field can only be configured at the business level. Log in to the individual business account to set its approval workflow.</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </NativeDrawer>
  );
}
