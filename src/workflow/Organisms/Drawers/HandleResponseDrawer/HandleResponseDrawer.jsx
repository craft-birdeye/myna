import React, { useState, useEffect, useRef } from 'react';
import { SingleSelect, MultiSelect } from '../../../elemental-stubs';
import FieldPickerModal from '../../Modals/FieldPickerModal/FieldPickerModal';
import { VariableIcon } from '../../../Molecules/Inputs/PromptToolbarIcons';
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

const RESPONSE_TEMPLATE_OPTIONS = [
  { value: 'thank-you', label: 'Thank you for your feedback' },
  { value: 'apology', label: 'We apologize for the experience' },
  { value: 'follow-up', label: 'We would love to follow up' },
  { value: 'invite-back', label: 'We hope to see you again' },
  { value: 'address-concern', label: 'Addressing your concern' },
];

function normalizeTemplateIds(config = {}) {
  if (Array.isArray(config.templateIds) && config.templateIds.length) return config.templateIds;
  if (config.templateId) return [config.templateId];
  return [];
}

function templateSummaryLabel(ids = []) {
  if (!ids.length) return '';
  if (ids.length === 1) {
    return RESPONSE_TEMPLATE_OPTIONS.find((o) => o.value === ids[0])?.label || ids[0];
  }
  return `${ids.length} templates selected`;
}

/** Mandatory fields — the Tool card in Task details shows an error until these are set. */
export function isHandleResponseConfigComplete(config = {}) {
  const type = config.responseType || 'custom';
  if (!config.postAfter) return false;
  if (type === 'template') return normalizeTemplateIds(config).length > 0;
  return !!String(config.customText ?? config.responseText ?? '').trim();
}

function NativeDrawer({ isOpen, onClose, children }) {
  useEffect(() => {
    if (!isOpen) return undefined;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999 }}>
      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,0.2)',
          backdropFilter: 'blur(4px)',
        }}
      />
      <div className="hrd__panel" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

function insertAtCursor(textarea, text, fallbackPrev = '') {
  if (!textarea) return `${fallbackPrev}${text}`;
  const start = textarea.selectionStart ?? textarea.value.length;
  const end = textarea.selectionEnd ?? start;
  const before = textarea.value.slice(0, start);
  const after = textarea.value.slice(end);
  const next = `${before}${text}${after}`;
  const caret = start + text.length;
  requestAnimationFrame(() => {
    textarea.focus();
    textarea.setSelectionRange(caret, caret);
  });
  return next;
}

/**
 * Config drawer for the `handle-response` Birdeye tool, opened from the Task details
 * Tool card's pencil. Saving a complete config clears that card's
 * "Missing mandatory fields" error.
 */
export default function HandleResponseDrawer({ isOpen, onClose, value = {}, onSave, actionLabel = 'Task' }) {
  const [responseType, setResponseType] = useState('custom');
  const [customText, setCustomText] = useState('');
  const [templateIds, setTemplateIds] = useState([]);
  const [responseHandling, setResponseHandling] = useState('post-directly');
  const [postAfter, setPostAfter] = useState('');
  const [fieldPickerOpen, setFieldPickerOpen] = useState(false);
  const textareaRef = useRef(null);
  const fieldTriggerRef = useRef(null);

  // Re-seed from the saved config each time the drawer opens.
  useEffect(() => {
    if (!isOpen) return;
    setResponseType(value.responseType || 'custom');
    setCustomText(value.customText ?? value.responseText ?? '');
    setTemplateIds(normalizeTemplateIds(value));
    setResponseHandling(value.responseHandling ?? 'post-directly');
    setPostAfter(value.postAfter ?? '');
    setFieldPickerOpen(false);
  }, [isOpen]);

  const templateLabel = templateSummaryLabel(templateIds);
  const draft = {
    responseType,
    customText,
    templateIds,
    // Keep singular templateId for older readers.
    templateId: templateIds[0] || '',
    // Keep responseText in sync for older readers / completeness checks.
    responseText: responseType === 'template' ? templateLabel : customText,
    responseLabel: responseType === 'template' ? templateLabel : customText,
    responseHandling,
    postAfter,
  };
  const canSave = isHandleResponseConfigComplete(draft);

  return (
    <NativeDrawer isOpen={isOpen} onClose={onClose}>
      <div className="hrd">
        <div className="hrd__header">
          <div className="hrd__header-left">
            <button type="button" className="hrd__back" onClick={onClose} aria-label="Back">
              <span
                className="material-symbols-outlined"
                style={{
                  fontSize: 20,
                  color: '#303030',
                  fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 20",
                }}
              >
                arrow_back
              </span>
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
          {/* How do you want to respond? */}
          <div className="hrd__field">
            <span className="hrd__label">
              How do you want to respond?<span className="hrd__required"> *</span>
            </span>
            <div className="hrd__radios">
              <label className="hrd__radio hrd__radio--compact">
                <input
                  type="radio"
                  name="handle-response-type"
                  className="hrd__radio-input"
                  checked={responseType === 'custom'}
                  onChange={() => setResponseType('custom')}
                />
                <span className="hrd__radio-label">Respond manually</span>
              </label>

              {responseType === 'custom' && (
                <div className="hrd__indent-wrap">
                  <div
                    className={`hrd__textarea-box${fieldPickerOpen ? ' hrd__textarea-box--open' : ''}`}
                  >
                    <textarea
                      ref={textareaRef}
                      className="hrd__textarea"
                      value={customText}
                      onChange={(e) => setCustomText(e.target.value)}
                      placeholder="Enter your response here..."
                      rows={6}
                      aria-label="Manual response text"
                    />
                    <button
                      ref={fieldTriggerRef}
                      type="button"
                      className="hrd__insert-field"
                      onClick={() => setFieldPickerOpen((open) => !open)}
                      aria-label="Insert field"
                      title="Insert field"
                      aria-haspopup="dialog"
                      aria-expanded={fieldPickerOpen}
                    >
                      <VariableIcon />
                    </button>
                  </div>
                  {fieldPickerOpen && (
                    <FieldPickerModal
                      onClose={() => setFieldPickerOpen(false)}
                      onSelectField={(fieldValue, name) => {
                        const token = `{{${name || fieldValue}}}`;
                        setCustomText((prev) => insertAtCursor(textareaRef.current, token, prev));
                        setFieldPickerOpen(false);
                      }}
                      anchorEl={fieldTriggerRef.current?.closest('.hrd__textarea-box') || fieldTriggerRef.current}
                      showTriggerFields
                      placement="dropdown"
                      overlayZIndex={10050}
                      actionLabel={actionLabel}
                    />
                  )}
                </div>
              )}

              <label className="hrd__radio hrd__radio--compact">
                <input
                  type="radio"
                  name="handle-response-type"
                  className="hrd__radio-input"
                  checked={responseType === 'template'}
                  onChange={() => setResponseType('template')}
                />
                <span className="hrd__radio-label">Respond using templates</span>
              </label>

              {responseType === 'template' && (
                <div className="hrd__indent-wrap">
                  <MultiSelect
                    name="responseTemplates"
                    selected={templateIds}
                    options={RESPONSE_TEMPLATE_OPTIONS}
                    placeholder="Select templates"
                    onChange={setTemplateIds}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Response handling */}
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

          {/* Post response after */}
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
