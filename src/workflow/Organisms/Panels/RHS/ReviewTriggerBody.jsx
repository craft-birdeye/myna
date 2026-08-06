import React, { useMemo, useState } from 'react';
import { FormInput, TextArea, SingleSelect } from '../../../elemental-stubs';
import Conditions from '../../../Molecules/Conditions/Conditions';

const TRIGGER_TYPE_OPTIONS = [
  { value: 'Reviews', label: 'Reviews' },
  { value: 'Inbox', label: 'Inbox' },
  { value: 'Listings', label: 'Listings' },
  { value: 'Social', label: 'Social' },
  { value: 'Surveys', label: 'Surveys' },
  { value: 'Ticketing', label: 'Ticketing' },
  { value: 'External apps', label: 'External apps' },
];

// Singular entity name used in the pseudo-code Preview block below.
const TRIGGER_TYPE_ENTITY = {
  Reviews: 'Review',
  Inbox: 'Inbox',
  Listings: 'Listing',
  Social: 'Social',
  Surveys: 'Survey',
  Ticketing: 'Ticket',
  'External apps': 'External app',
};

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

const DEFAULT_CONDITIONS = [
  { id: 1, fieldValue: '', operatorValue: '', valueValue: '' },
];

const makeCondition = (id) => ({ id, fieldValue: '', operatorValue: '', valueValue: '' });

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
  const [triggerType, setTriggerType] = useState(initialValues.triggerType ?? 'Reviews');
  const [triggerName, setTriggerName] = useState(initialValues.triggerName ?? '');
  const [description, setDescription] = useState(initialValues.description ?? '');
  const [conditions, setConditions] = useState(
    initialValues.conditions?.length ? initialValues.conditions : DEFAULT_CONDITIONS
  );
  const [logic, setLogic] = useState(initialValues.logic ?? 'AND');
  const [conditionOptions, setConditionOptions] = useState(
    initialValues.conditionOptions ?? DEFAULT_CONDITION_OPTIONS
  );

  const handleTriggerType = (opt) => {
    setTriggerType(opt.value);
    onFieldChange?.('triggerType', opt.value);
  };

  const handleTriggerName = (e) => {
    const val = e.target.value;
    setTriggerName(val);
    onFieldChange?.('triggerName', val);
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

  function handleOptionsChange(key, opts) {
    setConditionOptions((prev) => {
      const next = { ...prev, [key]: opts };
      onFieldChange?.('conditionOptions', next);
      return next;
    });
  }

  const entity = TRIGGER_TYPE_ENTITY[triggerType] ?? 'Review';
  const preview = useMemo(
    () => buildPreview(entity, conditions, conditionOptions, logic),
    [entity, conditions, conditionOptions, logic]
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={{ fontSize: 12, lineHeight: '16px', color: '#757575', fontFamily: '"Roboto", sans-serif' }}>
          Trigger type
        </span>
        <SingleSelect
          name="triggerType"
          selected={triggerType}
          options={TRIGGER_TYPE_OPTIONS}
          onChange={handleTriggerType}
        />
      </div>
      <FormInput
        name="triggerName"
        type="text"
        label="Trigger name"
        placeholder="Enter name"
        value={triggerName}
        onChange={handleTriggerName}
        required
      />
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
        onAdvancedFilters={() => {}}
        conditionOptions={conditionOptions}
        onOptionsChange={handleOptionsChange}
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
    </div>
  );
}
