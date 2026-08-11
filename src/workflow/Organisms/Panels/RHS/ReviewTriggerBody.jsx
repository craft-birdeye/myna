import React, { useEffect, useMemo, useRef, useState } from 'react';
import { TextArea } from '../../../elemental-stubs';
import Conditions from '../../../Molecules/Conditions/Conditions';
import ChooseTriggerModal, { REVIEW_TRIGGER_OPTIONS } from './ChooseTriggerModal';

const DEFAULT_TRIGGER = REVIEW_TRIGGER_OPTIONS[2];

const OPERATOR_SYMBOLS = {
  is: '==',
  is_not: '!=',
  contains: '.includes',
  greater_than: '>',
  less_than: '<',
};

const DEFAULT_CONDITION_OPTIONS = {
  field: [
    { value: 'event', label: 'Event' },
    { value: 'message_type', label: 'Message type' },
    { value: 'message_age', label: 'Message age' },
    { value: 'rating', label: 'Rating' },
    { value: 'sentiment', label: 'Sentiment' },
    { value: 'source', label: 'Source' },
    { value: 'location', label: 'Location' },
    { value: 'keyword', label: 'Keyword' },
  ],
  operator: [
    { value: 'is', label: 'is' },
    { value: 'is_not', label: 'is not' },
    { value: 'contains', label: 'contains' },
    { value: 'greater_than', label: 'is greater than' },
    { value: 'less_than', label: 'is less than' },
  ],
  value: [
    { value: 'review_received', label: 'Review received' },
    { value: 'google', label: 'Google' },
    { value: '48_hours', label: '48 hours' },
  ],
};

const makeCondition = (id) => ({ id, fieldValue: '', operatorValue: '', valueValue: '' });

function resolveTrigger(initialValues) {
  const raw = initialValues.triggerType ?? initialValues.triggerName ?? '';
  return (
    REVIEW_TRIGGER_OPTIONS.find((o) => o.value === raw || o.label === raw) ??
    DEFAULT_TRIGGER
  );
}

/** Builds the "IF ..." pseudo-code preview from the current conditions — a representative
 *  rendering for the prototype, not a real rules compiler. */
function buildPreview(entity, conditions, conditionOptions, logic) {
  const lines = conditions
    .filter((c) => c.fieldValue && c.operatorValue && c.valueValue)
    .map((c, i) => {
      const fieldLabel = conditionOptions.field.find((o) => o.value === c.fieldValue)?.label ?? c.fieldValue;
      const valueLabel = conditionOptions.value.find((o) => o.value === c.valueValue)?.label ?? c.valueValue;
      const opSymbol = OPERATOR_SYMBOLS[c.operatorValue] ?? '==';
      const connector = c.connector ?? logic;
      const prefix = i === 0 ? '' : `${connector} `;
      return `${prefix}${entity}.${fieldLabel.toLowerCase().replace(/\s+/g, '_')} ${opSymbol} ("${valueLabel}");`;
    });
  if (!lines.length) return null;
  return ['IF', ...lines].join('\n');
}

export default function ReviewTriggerBody({ initialValues = {}, onFieldChange }) {
  const initialTrigger = resolveTrigger(initialValues);
  const [trigger, setTrigger] = useState(initialTrigger);
  const [pickerOpen, setPickerOpen] = useState(false);
  const triggerFieldRef = useRef(null);
  const [description, setDescription] = useState(
    initialValues.description ?? initialTrigger.agentDescription ?? '',
  );
  const [conditions, setConditions] = useState([]);
  const [logic, setLogic] = useState(initialValues.logic ?? 'AND');
  const conditionOptions = initialValues.conditionOptions ?? DEFAULT_CONDITION_OPTIONS;

  // Keep the card empty by default (Add condition only). Drop any blank placeholder rows
  // that older nodeDetails still carry so Selects don't reappear on open.
  useEffect(() => {
    const list = initialValues.conditions;
    if (!list?.length) return;
    const hasAnyValue = list.some((c) => c.fieldValue || c.operatorValue || c.valueValue);
    if (!hasAnyValue) {
      setConditions([]);
      onFieldChange?.('conditions', []);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleTriggerSelect = (opt) => {
    setTrigger(opt);
    onFieldChange?.('triggerType', opt.value);
    onFieldChange?.('triggerName', opt.label);
    if (!description || description === trigger.agentDescription) {
      setDescription(opt.agentDescription);
      onFieldChange?.('description', opt.agentDescription);
    }
  };

  const handleDescription = (e) => {
    const val = e.target.value;
    setDescription(val);
    onFieldChange?.('description', val);
  };

  function handleConditionChange(id, field, value) {
    setConditions((prev) => {
      const next = prev.map((c) => (c.id === id ? { ...c, [`${field}Value`]: value } : c));
      onFieldChange?.('conditions', next);
      return next;
    });
  }

  function handleRemoveCondition(id) {
    setConditions((prev) => {
      const next = prev.filter((c) => c.id !== id);
      onFieldChange?.('conditions', next);
      return next;
    });
  }

  function handleConnectorChange(id, value) {
    setConditions((prev) => {
      const next = prev.map((c) => (c.id === id ? { ...c, connector: value } : c));
      onFieldChange?.('conditions', next);
      return next;
    });
  }

  function handleAddCondition() {
    setConditions((prev) => {
      const next = [...prev, makeCondition(Date.now())];
      onFieldChange?.('conditions', next);
      return next;
    });
  }

  const preview = useMemo(
    () => buildPreview('Review', conditions, conditionOptions, logic),
    [conditions, conditionOptions, logic],
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={{ fontSize: 12, lineHeight: '16px', color: '#757575', fontFamily: '"Roboto", sans-serif' }}>
          Trigger<span style={{ color: '#d32f2f' }}>*</span>
        </span>
        <div className="tc-dropdown" ref={triggerFieldRef}>
          <button
            type="button"
            name="trigger"
            className={`tc-dropdown__trigger${pickerOpen ? ' tc-dropdown__trigger--open' : ''}`}
            onClick={() => setPickerOpen((open) => !open)}
            aria-haspopup="dialog"
            aria-expanded={pickerOpen}
          >
            <span className="tc-dropdown__value">{trigger.label}</span>
            <span className="material-symbols-outlined tc-dropdown__chevron">expand_more</span>
          </button>
        </div>
      </div>
      <TextArea
        name="description"
        label="Description"
        placeholder="Enter description"
        value={description}
        onChange={handleDescription}
        noFloatingLabel
      />
      <Conditions
        conditions={conditions}
        logic={logic}
        onConditionChange={handleConditionChange}
        onLogicChange={(val) => { setLogic(val); onFieldChange?.('logic', val); }}
        onConnectorChange={handleConnectorChange}
        onAddCondition={handleAddCondition}
        onRemoveCondition={handleRemoveCondition}
        conditionOptions={conditionOptions}
        label="Trigger condition"
        showAdvancedFilters={false}
      />
      {preview && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 12, lineHeight: '16px', color: '#757575', fontFamily: '"Roboto", sans-serif' }}>
            Preview
          </span>
          <pre
            style={{
              margin: 0,
              padding: '10px 12px',
              borderRadius: 6,
              background: '#f7f8fa',
              border: '1px solid #e5e9f0',
              color: '#212121',
              fontFamily: '"Roboto Mono", "Courier New", monospace',
              fontSize: 12,
              lineHeight: '18px',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {preview}
          </pre>
        </div>
      )}

      <ChooseTriggerModal
        open={pickerOpen}
        selectedValue={trigger.value}
        anchorRef={triggerFieldRef}
        onClose={() => setPickerOpen(false)}
        onSelect={handleTriggerSelect}
      />
    </div>
  );
}
