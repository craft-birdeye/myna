import React, { useState } from 'react';
import { SingleSelect, TextArea } from '../../../elemental-stubs';

const ON_DEMAND_TRIGGER_OPTIONS = [
  {
    value: 'on-demand-fanout-query-generation',
    label: 'On demand fanout query generation',
    agentDescription: 'Runs when triggered manually or via Run test — no schedule.',
  },
];

const DEFAULT_TRIGGER = ON_DEMAND_TRIGGER_OPTIONS[0];

function resolveTrigger(initialValues) {
  const raw = initialValues.triggerType ?? initialValues.triggerName ?? '';
  return (
    ON_DEMAND_TRIGGER_OPTIONS.find((o) => o.value === raw || o.label === raw) ??
    DEFAULT_TRIGGER
  );
}

/** On-demand trigger only ever has one option, so this is a plain single-option `SingleSelect`
 *  dropdown instead of `ReviewTriggerBody`'s heavier `ChooseTriggerModal` picker (which makes
 *  sense when there's a real list of triggers to search/browse, not one fixed choice). */
export default function OnDemandTriggerBody({ initialValues = {}, onFieldChange }) {
  const initialTrigger = resolveTrigger(initialValues);
  const [trigger, setTrigger] = useState(initialTrigger);
  const [description, setDescription] = useState(
    initialValues.description ?? initialTrigger.agentDescription ?? '',
  );

  const handleTriggerSelect = (opt) => {
    const next = ON_DEMAND_TRIGGER_OPTIONS.find((o) => o.value === opt.value) ?? DEFAULT_TRIGGER;
    setTrigger(next);
    onFieldChange?.('triggerType', next.value);
    onFieldChange?.('triggerName', next.label);
    if (!description || description === trigger.agentDescription) {
      setDescription(next.agentDescription);
      onFieldChange?.('description', next.agentDescription);
    }
  };

  const handleDescription = (e) => {
    const val = e.target.value;
    setDescription(val);
    onFieldChange?.('description', val);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={{ fontSize: 12, lineHeight: '16px', color: '#757575', fontFamily: '"Roboto", sans-serif' }}>
          Trigger<span style={{ color: '#d32f2f' }}>*</span>
        </span>
        <SingleSelect
          name="trigger"
          selected={trigger.value}
          options={ON_DEMAND_TRIGGER_OPTIONS}
          onChange={handleTriggerSelect}
          placeholder="Select"
        />
      </div>
      <TextArea
        name="description"
        label="Description"
        placeholder="Enter description"
        value={description}
        onChange={handleDescription}
        noFloatingLabel
      />
    </div>
  );
}
