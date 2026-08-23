import React, { useState } from 'react';
import { FormInput, TextArea } from '../../../elemental-stubs';
import Conditions from '../../../Molecules/Conditions/Conditions';
import { CONDITION_OPERATORS } from '../../../constants/conditionOperators';
import descStyles from './TriggerDescription.module.css';

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
  operator: [...CONDITION_OPERATORS],
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

export default function EntityTriggerBody({ initialValues = {}, onFieldChange }) {
  const [triggerName, setTriggerName] = useState(initialValues.triggerName ?? '');
  const [description, setDescription] = useState(initialValues.description ?? '');
  const [descriptionOpen, setDescriptionOpen] = useState(
    () => Boolean(String(initialValues.description ?? '').trim()),
  );
  const [conditions, setConditions] = useState(
    initialValues.conditions?.length ? initialValues.conditions : DEFAULT_CONDITIONS
  );
  const [logic, setLogic] = useState(initialValues.logic ?? 'AND');
  const [conditionOptions, setConditionOptions] = useState(
    initialValues.conditionOptions ?? DEFAULT_CONDITION_OPTIONS
  );

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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <FormInput
        name="triggerName"
        type="text"
        label="Trigger name"
        placeholder="Enter name"
        value={triggerName}
        onChange={handleTriggerName}
        required
      />
      {descriptionOpen ? (
        <div className={descStyles.descriptionField}>
          <TextArea
            name="description"
            label="Description"
            placeholder="Enter description"
            value={description}
            onChange={handleDescription}
            noFloatingLabel
          />
        </div>
      ) : (
        <button
          type="button"
          className={descStyles.addDescriptionBtn}
          onClick={() => setDescriptionOpen(true)}
        >
          <span className="material-symbols-outlined">add_circle</span>
          Add description
        </button>
      )}
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
    </div>
  );
}
