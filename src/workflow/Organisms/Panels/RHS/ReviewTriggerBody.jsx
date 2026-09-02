import React, { useMemo, useRef, useState } from 'react';
import { TextArea } from '../../../elemental-stubs';
import Conditions from '../../../Molecules/Conditions/Conditions';
import ChooseTriggerModal, { REVIEW_TRIGGER_OPTIONS } from './ChooseTriggerModal';
import { DraftBlockedField, rhsFieldLock } from '../../../components/DraftBlockedTooltip';
import { CONDITION_OPERATORS, operatorNeedsValue } from '../../../constants/conditionOperators';
import descStyles from './TriggerDescription.module.css';

const DEFAULT_TRIGGER = REVIEW_TRIGGER_OPTIONS[2];

const OPERATOR_SYMBOLS = {
  is_blank: '== null',
  is_not_blank: '!= null',
  is_within: 'in',
  between: 'between',
  before: '<',
  after: '>',
  equals: '==',
  is: '==',
  is_not: '!=',
  contains: '.includes',
  greater_than: '>',
  less_than: '<',
};

const TRIGGER_CONDITION_HELP = 'Define when this workflow should run.';

/** Placeholder help article — swap for the real trigger-condition docs URL when available. */
const TRIGGER_CONDITION_LEARN_MORE_HREF =
  'https://help.birdeye.com/hc/en-us/articles/trigger-conditions-in-workflows';

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

const DEFAULT_CONDITIONS = [{ id: 1, fieldValue: '', operatorValue: '', valueValue: '' }];

const makeCondition = (id) => ({ id, fieldValue: '', operatorValue: '', valueValue: '' });

function normalizeInitialConditions(list) {
  if (!list?.length) return DEFAULT_CONDITIONS;
  const hasAnyValue = list.some((c) => c.fieldValue || c.operatorValue || c.valueValue);
  if (!hasAnyValue) return DEFAULT_CONDITIONS;
  return list;
}

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
    .filter((c) => {
      if (!c.fieldValue || !c.operatorValue) return false;
      return operatorNeedsValue(c.operatorValue) ? Boolean(c.valueValue) : true;
    })
    .map((c, i) => {
      const fieldLabel = conditionOptions.field.find((o) => o.value === c.fieldValue)?.label ?? c.fieldValue;
      const opSymbol = OPERATOR_SYMBOLS[c.operatorValue] ?? '==';
      const connector = c.connector ?? logic;
      const prefix = i === 0 ? '' : `${connector} `;
      if (!operatorNeedsValue(c.operatorValue)) {
        return `${prefix}${entity}.${fieldLabel.toLowerCase().replace(/\s+/g, '_')} ${opSymbol};`;
      }
      const valueLabel = conditionOptions.value.find((o) => o.value === c.valueValue)?.label ?? c.valueValue;
      return `${prefix}${entity}.${fieldLabel.toLowerCase().replace(/\s+/g, '_')} ${opSymbol} ("${valueLabel}");`;
    });
  if (!lines.length) return null;
  return ['IF', ...lines].join('\n');
}

export default function ReviewTriggerBody({
  initialValues = {},
  onFieldChange,
  viewOnly = false,
  draftBlocked = false,
  onEditDraft,
}) {
  const { inputDisabled, inputReadOnly, fieldsLocked } = rhsFieldLock({ viewOnly, draftBlocked });

  const blockField = (node, className = '') => (
    <DraftBlockedField
      draftBlocked={draftBlocked}
      viewOnly={viewOnly}
      onEditDraft={onEditDraft}
      className={className}
    >
      {node}
    </DraftBlockedField>
  );

  const initialTrigger = resolveTrigger(initialValues);
  const [trigger, setTrigger] = useState(initialTrigger);
  const [pickerOpen, setPickerOpen] = useState(false);
  const triggerFieldRef = useRef(null);
  const [description, setDescription] = useState(initialValues.description ?? '');
  const [descriptionOpen, setDescriptionOpen] = useState(
    () => Boolean(String(initialValues.description ?? '').trim()),
  );
  const [conditions, setConditions] = useState(() => normalizeInitialConditions(initialValues.conditions));
  const [logic, setLogic] = useState(initialValues.logic ?? 'AND');
  const conditionOptions = initialValues.conditionOptions ?? DEFAULT_CONDITION_OPTIONS;

  const handleTriggerSelect = (opt) => {
    setTrigger(opt);
    onFieldChange?.('triggerType', opt.value);
    onFieldChange?.('triggerName', opt.label);
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
      if (prev.length <= 1) return prev;
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

  const triggerField = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ fontSize: 12, lineHeight: '16px', color: '#757575', fontFamily: '"Roboto", sans-serif' }}>
        Trigger<span style={{ color: '#d32f2f' }}>*</span>
      </span>
      <div className="tc-dropdown" ref={triggerFieldRef}>
        <button
          type="button"
          name="trigger"
          className={`tc-dropdown__trigger${pickerOpen ? ' tc-dropdown__trigger--open' : ''}${fieldsLocked ? ' tc-dropdown__trigger--readonly' : ''}`}
          onClick={() => { if (!fieldsLocked) setPickerOpen((open) => !open); }}
          aria-haspopup="dialog"
          aria-expanded={pickerOpen}
          disabled={inputDisabled}
        >
          <span className="tc-dropdown__value">{trigger.label}</span>
          <span className="material-symbols-outlined tc-dropdown__chevron">expand_more</span>
        </button>
      </div>
    </div>
  );

  const descriptionField = descriptionOpen ? (
    <div className={descStyles.descriptionField}>
      <TextArea
        name="description"
        label="Description"
        placeholder="Enter description"
        value={description}
        onChange={handleDescription}
        noFloatingLabel
        readOnly={inputReadOnly}
        disabled={inputDisabled}
      />
    </div>
  ) : !fieldsLocked ? (
    <button
      type="button"
      className={descStyles.addDescriptionBtn}
      onClick={() => setDescriptionOpen(true)}
    >
      <span className="material-symbols-outlined">add_circle</span>
      Add description
    </button>
  ) : null;

  const conditionsField = (
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
      labelHelp={TRIGGER_CONDITION_HELP}
      labelHelpLearnMoreHref={TRIGGER_CONDITION_LEARN_MORE_HREF}
      showAdvancedFilters={false}
      disabled={inputDisabled}
    />
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {blockField(triggerField)}
      {descriptionField ? blockField(descriptionField) : null}
      {blockField(conditionsField)}
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
              color: '#757575',
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

      {!fieldsLocked && (
        <ChooseTriggerModal
          open={pickerOpen}
          selectedValue={trigger.value}
          anchorRef={triggerFieldRef}
          onClose={() => setPickerOpen(false)}
          onSelect={handleTriggerSelect}
        />
      )}
    </div>
  );
}
