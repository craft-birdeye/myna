import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { FormInput, TextArea, SingleSelect } from '../../../elemental-stubs';
import SystemPromptInput from '../../../Molecules/Inputs/SystemPromptInput/SystemPromptInput';
import UserPromptInput from '../../../Molecules/Inputs/UserPromptInput/UserPromptInput';
import OutputFields from '../../../Molecules/Inputs/OutputFields/OutputFields';
import VariableChip, { CHIP_TYPES, DataTypeIcon } from '../../../Molecules/Inputs/VariableChip/VariableChip';
import { ContextModal } from '../../../../components/ContextModal/ContextModal';
import { InfoTooltip } from '../../../../components/InfoTooltip/InfoTooltip';
import { Tooltip } from '../../../../components/Tooltip/Tooltip';
import infoIconUrl from '../../../../assets/icon-info.svg';
import AddInputFieldModal from '../../Modals/AddInputFieldModal/AddInputFieldModal';
import { useTwoLineChipCollapse } from '../../../Molecules/Inputs/chipTwoLineCollapse';
import styles from './LLMTaskBody.module.css';

const LLM_MODEL_OPTIONS = [
  { value: 'Fast', label: 'Fast' },
  { value: 'Balanced', label: 'Balanced' },
  { value: 'Thinking', label: 'Thinking' },
  { value: 'Standard', label: 'Standard' },
  { value: 'Advanced', label: 'Advanced' },
];

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

const INPUT_FIELDS_INFO =
  'Input fields add context to your prompt and are automatically included when generating the output.';
const INPUT_FIELDS_LEARN_MORE_HREF =
  'https://help.birdeye.com/hc/en-us/articles/input-fields-in-workflows';

const CONTEXT_INFO =
  'Uses your brand voice, industry knowledge, and agent-specific context to generate accurate responses';
const CONTEXT_LEARN_MORE_HREF =
  'https://help.birdeye.com/hc/en-us/articles/context-in-workflows';

const OUTPUT_FIELDS_INFO =
  'Define fields and AI will automatically populate them with structured data. Use clear names and descriptions for each field.';
const OUTPUT_FIELDS_LEARN_MORE_HREF =
  'https://help.birdeye.com/hc/en-us/articles/output-fields-in-workflows';

const LLM_MODEL_TOOLTIP = (
  <span className="flex flex-col gap-xs">
    <span>Choose an LLM model:</span>
    <span>Fast: Instant answers with minimal reasoning</span>
    <span>Balanced: A good mix of speed and depth</span>
    <span>Thinking: Deeper reasoning for research or complex tasks</span>
  </span>
);

const normalizeChips = (arr) => {
  if (!Array.isArray(arr)) return [];
  return arr.map((item) =>
    typeof item === 'string' ? { value: item, type: 'variable' } : item
  );
};

/** Map ContextModal save payload → VariableChip list. */
function contextModalResultToChips(result) {
  const chips = [];
  (result.fields || [])
    .filter((f) => f.enabled)
    .forEach((f) => chips.push({ value: f.name.replace(/\s+/g, '.'), type: 'variable' }));
  (result.knowledge?.files || []).forEach((f) => chips.push({ value: f.name, type: 'attachment' }));
  (result.knowledge?.links || []).forEach((l) => chips.push({ value: l.url, type: 'link' }));
  (result.brandItems || [])
    .filter((b) => b.enabled)
    .forEach((b) => chips.push({ value: b.name, type: 'variable' }));
  if (result.industryEnabled) chips.push({ value: 'Industry.context', type: 'variable' });
  return chips;
}

function ChipContainer({
  label,
  showInfo = false,
  infoTooltip,
  infoLearnMoreHref,
  infoOnLearnMore,
  chips,
  onChipChange,
  onChipDelete,
  addingNew,
  onStartAdd,
  onCancelAdd,
  onCommitAdd,
  onChangeChipType,
  /** Exploration: bordered box, two chip lines + "View N more". */
  collapseToTwoLines = false,
  /** Exploration: "+ Add" on the label row instead of inside the chip box. */
  addInLabelRow = false,
  /** Exploration Context / Input: add opens an external modal — hide inline type picker. */
  suppressAdd = false,
  viewMoreLabel = (n) => `View ${n} more`,
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerFor, setPickerFor] = useState(null);
  const [pendingType, setPendingType] = useState('variable');
  const [expanded, setExpanded] = useState(false);
  const pickerRef = useRef(null);
  const measureRef = useRef(null);

  const { visibleCount, hiddenCount, showViewMore } = useTwoLineChipCollapse({
    enabled: collapseToTwoLines,
    expanded: expanded || addingNew,
    itemCount: chips.length,
    measureRef,
  });

  const visibleChips = collapseToTwoLines && !expanded && !addingNew
    ? chips.slice(0, visibleCount)
    : chips;

  useEffect(() => {
    if (!pickerOpen) return;
    const handler = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        setPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [pickerOpen]);

  useLayoutEffect(() => {
    if (!collapseToTwoLines) setExpanded(false);
  }, [collapseToTwoLines, chips.length]);

  const openForAdd = () => {
    setExpanded(true);
    setPickerFor('add');
    setPickerOpen(true);
  };

  const openForChip = (i) => {
    setPickerFor(i);
    setPickerOpen(true);
  };

  const selectType = (type) => {
    setPickerOpen(false);
    if (pickerFor === 'add') {
      setPendingType(type);
      onStartAdd();
    } else if (typeof pickerFor === 'number') {
      onChangeChipType(pickerFor, type);
    }
    setPickerFor(null);
  };

  const hasChips = chips.length > 0 || addingNew;
  const isEmpty = chips.length === 0 && !addingNew;
  const showLabelAdd = !suppressAdd && addInLabelRow && !isEmpty;
  const showInlineAdd = !suppressAdd && (!addInLabelRow || isEmpty);

  const chipsBlock = hasChips && (
    <div className={`${styles.chipWrap}${addInLabelRow ? ` ${styles.chipWrapCompact}` : ''}`}>
      {visibleChips.map((chip, i) => (
        <VariableChip
          key={`${chip.value}-${i}`}
          value={chip.value}
          type={chip.type}
          onChange={(v) => onChipChange(i, v)}
          onDelete={() => onChipDelete(i)}
          onSwatchClick={() => openForChip(i)}
        />
      ))}
      {addingNew && (
        <VariableChip
          value=""
          type={pendingType}
          autoFocus
          onChange={(v) => onCommitAdd(v, pendingType)}
          onDelete={onCancelAdd}
        />
      )}
    </div>
  );

  const measureLayer = collapseToTwoLines && !expanded && !addingNew && chips.length > 0 && (
    <div
      ref={measureRef}
      className={`${styles.chipMeasure}${addInLabelRow ? ` ${styles.chipMeasureCompact}` : ''}`}
      aria-hidden
    >
      {chips.map((chip, i) => (
        <span key={`m-${chip.value}-${i}`} data-chip-measure className={styles.chipMeasureItem}>
          <VariableChip value={chip.value} type={chip.type} />
        </span>
      ))}
    </div>
  );

  const viewMoreBtn = showViewMore && (
    <button
      type="button"
      className={styles.moreLink}
      onClick={() => setExpanded(true)}
    >
      {viewMoreLabel(hiddenCount)}
    </button>
  );

  const typePicker = pickerOpen && (
    <div className={styles.typePicker}>
      {CHIP_TYPES.map((ct) => (
        <button
          key={ct.type}
          className={styles.typePickerItem}
          type="button"
          onClick={() => selectType(ct.type)}
        >
          <span className={`${styles.typePickerSwatch} ${styles[`tpSwatch${cap(ct.type)}`] || ''}`}>
            {ct.icon ? (
              <span className={`material-symbols-outlined ${styles[`tpIcon${cap(ct.type)}`] || ''}`}>
                {ct.icon}
              </span>
            ) : (
              <DataTypeIcon />
            )}
          </span>
          <span className={styles.typePickerLabel}>{ct.label}</span>
        </button>
      ))}
    </div>
  );

  const addRow = (
    <div className={styles.addRow} ref={pickerRef}>
      <button className={styles.addBtn} type="button" onClick={openForAdd}>
        <span className="material-symbols-outlined">add_circle</span>
        <span className={styles.addBtnLabel}>Add</span>
      </button>
      {typePicker}
    </div>
  );

  const labelAddControl = showLabelAdd && (
    <div className={styles.labelAddWrap} ref={pickerRef}>
      <button type="button" className={styles.fieldAddBtn} onClick={openForAdd}>
        <span className="material-symbols-outlined">add_circle</span>
        <span className={styles.fieldAddBtnLabel}>Add</span>
      </button>
      {typePicker}
    </div>
  );

  const showChipBox = !addInLabelRow || hasChips || isEmpty;

  const chipBox = showChipBox && (
    <div
      className={`${styles.chipContainer}${
        addInLabelRow && !isEmpty ? ` ${styles.chipContainerCompact}` : ''
      }${addInLabelRow && isEmpty ? ` ${styles.chipContainerEmpty}` : ''}`}
    >
      {measureLayer}
      {chipsBlock}
      {viewMoreBtn}
      {showInlineAdd && addRow}
    </div>
  );

  if (!label) {
    return chipBox;
  }

  return (
    <div className={`${styles.fieldGroup}${addInLabelRow ? ` ${styles.fieldGroupCompact}` : ''}`}>
      <div className={styles.labelRow}>
        <span className={styles.label}>{label}</span>
        {showInfo && infoTooltip ? (
          <InfoTooltip
            text={infoTooltip}
            variant="detail"
            learnMoreHref={infoOnLearnMore ? undefined : infoLearnMoreHref}
            onLearnMore={infoOnLearnMore}
          />
        ) : showInfo ? (
          <span className={`material-symbols-outlined ${styles.infoIcon}`}>info</span>
        ) : null}
        {labelAddControl}
      </div>
      {chipBox}
    </div>
  );
}

export default function LLMTaskBody({
  initialValues = {},
  onFieldChange,
  onOpenToolDrawer,
  onOpenTool,
  onOpenGlossary,
  /** Exploration only: Setup / Configure tabs + footer Continue flow (not Sep 1). */
  collapseChipsToOneLine = false,
  /** Exploration chrome (incl. Sep 1): two chip lines + "View N more". */
  collapseChipsToTwoLines = false,
  /** Option 2: Setup / Configure in the header — legacy prop (body tabs removed). */
  setupConfigureInHeader = false,
  /** Controlled Setup / Configure tab — legacy prop (body tabs removed). */
  activeTab: activeTabProp,
  onTabChange,
}) {
  const [taskName, setTaskName] = useState(initialValues.taskName ?? '');
  const [description, setDescription] = useState(initialValues.description ?? '');
  const [llmModel, setLlmModel] = useState(initialValues.llmModel ?? 'Fast');
  const [systemPrompt, setSystemPrompt] = useState(initialValues.systemPrompt ?? '');
  const [userPrompt, setUserPrompt] = useState(initialValues.userPrompt ?? '');

  const [contextFields, setContextFields] = useState(normalizeChips(initialValues.contextFields));
  const [addingContext, setAddingContext] = useState(false);
  const [contextModalOpen, setContextModalOpen] = useState(false);

  const [inputFields, setInputFields] = useState(normalizeChips(initialValues.inputFields));
  const [addingInput, setAddingInput] = useState(false);
  const [inputModalOpen, setInputModalOpen] = useState(false);

  const [outputFields, setOutputFields] = useState(() => {
    const raw = initialValues.outputFields ?? [];
    return raw.map((item) => typeof item === 'string' ? { value: item, type: 'variable' } : item);
  });
  const [advancedOpen, setAdvancedOpen] = useState(true);
  const emit = (field, val) => onFieldChange?.(field, val);

  const updateContextFields = (next) => { setContextFields(next); emit('contextFields', next); };
  const updateInputFields = (next) => { setInputFields(next); emit('inputFields', next); };
  const updateOutputFields = (next) => { setOutputFields(next); emit('outputFields', next); };

  const handleContextSave = (result) => {
    updateContextFields(contextModalResultToChips(result));
    setContextModalOpen(false);
  };

  const handleInputAdd = ({ fieldName, fieldValue }) => {
    const valueFromVars = Array.isArray(fieldValue) && fieldValue.length > 0
      ? fieldValue[0]
      : fieldName;
    updateInputFields([
      ...inputFields,
      { value: fieldName || valueFromVars, type: 'variable' },
    ]);
    setInputModalOpen(false);
  };

  const contextSection = collapseChipsToTwoLines ? (
    <div className={`${styles.fieldGroup} ${styles.fieldGroupCompact}`}>
      <div className={styles.labelRow}>
        <span className={styles.label}>Context</span>
        <InfoTooltip
          text={CONTEXT_INFO}
          variant="detail"
          learnMoreHref={onOpenGlossary ? undefined : CONTEXT_LEARN_MORE_HREF}
          onLearnMore={onOpenGlossary ? () => onOpenGlossary('context') : undefined}
        />
        {contextFields.length > 0 && (
          <button
            type="button"
            className={styles.fieldAddBtn}
            onClick={() => setContextModalOpen(true)}
          >
            <span className="material-symbols-outlined">add_circle</span>
            <span className={styles.fieldAddBtnLabel}>Add</span>
          </button>
        )}
      </div>
      {contextFields.length === 0 ? (
        <div className={`${styles.chipContainer} ${styles.chipContainerEmpty}`}>
          <button
            type="button"
            className={styles.addBtn}
            onClick={() => setContextModalOpen(true)}
          >
            <span className="material-symbols-outlined">add_circle</span>
            <span className={styles.addBtnLabel}>Add</span>
          </button>
        </div>
      ) : (
        <ChipContainer
          chips={contextFields}
          onChipChange={(i, v) => updateContextFields(contextFields.map((c, idx) => idx === i ? { ...c, value: v } : c))}
          onChipDelete={(i) => updateContextFields(contextFields.filter((_, idx) => idx !== i))}
          addingNew={false}
          onStartAdd={() => {}}
          onCancelAdd={() => {}}
          onCommitAdd={() => {}}
          onChangeChipType={(i, type) => updateContextFields(contextFields.map((c, idx) => idx === i ? { ...c, type } : c))}
          collapseToTwoLines
          addInLabelRow
          suppressAdd
        />
      )}
    </div>
  ) : (
    <ChipContainer
      label="Context"
      showInfo
      infoTooltip={CONTEXT_INFO}
      infoLearnMoreHref={CONTEXT_LEARN_MORE_HREF}
      infoOnLearnMore={onOpenGlossary ? () => onOpenGlossary('context') : undefined}
      chips={contextFields}
      onChipChange={(i, v) => updateContextFields(contextFields.map((c, idx) => idx === i ? { ...c, value: v } : c))}
      onChipDelete={(i) => updateContextFields(contextFields.filter((_, idx) => idx !== i))}
      addingNew={addingContext}
      onStartAdd={() => setAddingContext(true)}
      onCancelAdd={() => setAddingContext(false)}
      onCommitAdd={(v, t) => { updateContextFields([...contextFields, { value: v, type: t || 'variable' }]); setAddingContext(false); }}
      onChangeChipType={(i, type) => updateContextFields(contextFields.map((c, idx) => idx === i ? { ...c, type } : c))}
    />
  );

  const inputFieldsSection = collapseChipsToTwoLines ? (
    <div className={`${styles.fieldGroup} ${styles.fieldGroupCompact}`}>
      <div className={styles.labelRow}>
        <span className={styles.label}>Input fields</span>
        <InfoTooltip
          text={INPUT_FIELDS_INFO}
          variant="detail"
          learnMoreHref={onOpenGlossary ? undefined : INPUT_FIELDS_LEARN_MORE_HREF}
          onLearnMore={onOpenGlossary ? () => onOpenGlossary('input-field') : undefined}
        />
        {inputFields.length > 0 && (
          <button
            type="button"
            className={styles.fieldAddBtn}
            onClick={() => setInputModalOpen(true)}
          >
            <span className="material-symbols-outlined">add_circle</span>
            <span className={styles.fieldAddBtnLabel}>Add</span>
          </button>
        )}
      </div>
      {inputFields.length === 0 ? (
        <div className={`${styles.chipContainer} ${styles.chipContainerEmpty}`}>
          <button
            type="button"
            className={styles.addBtn}
            onClick={() => setInputModalOpen(true)}
          >
            <span className="material-symbols-outlined">add_circle</span>
            <span className={styles.addBtnLabel}>Add</span>
          </button>
        </div>
      ) : (
        <ChipContainer
          chips={inputFields}
          onChipChange={(i, v) => updateInputFields(inputFields.map((c, idx) => idx === i ? { ...c, value: v } : c))}
          onChipDelete={(i) => updateInputFields(inputFields.filter((_, idx) => idx !== i))}
          addingNew={false}
          onStartAdd={() => {}}
          onCancelAdd={() => {}}
          onCommitAdd={() => {}}
          onChangeChipType={(i, type) => updateInputFields(inputFields.map((c, idx) => idx === i ? { ...c, type } : c))}
          collapseToTwoLines
          addInLabelRow
          suppressAdd
        />
      )}
    </div>
  ) : (
    <ChipContainer
      label="Input fields"
      showInfo
      infoTooltip={INPUT_FIELDS_INFO}
      infoLearnMoreHref={INPUT_FIELDS_LEARN_MORE_HREF}
      infoOnLearnMore={onOpenGlossary ? () => onOpenGlossary('input-field') : undefined}
      chips={inputFields}
      onChipChange={(i, v) => updateInputFields(inputFields.map((c, idx) => idx === i ? { ...c, value: v } : c))}
      onChipDelete={(i) => updateInputFields(inputFields.filter((_, idx) => idx !== i))}
      addingNew={addingInput}
      onStartAdd={() => setAddingInput(true)}
      onCancelAdd={() => setAddingInput(false)}
      onCommitAdd={(v, t) => { updateInputFields([...inputFields, { value: v, type: t || 'variable' }]); setAddingInput(false); }}
      onChangeChipType={(i, type) => updateInputFields(inputFields.map((c, idx) => idx === i ? { ...c, type } : c))}
    />
  );

  const systemPromptSection = (
    <SystemPromptInput
      value={systemPrompt}
      onChange={(val) => { setSystemPrompt(val); emit('systemPrompt', val); }}
      required
    />
  );

  const userPromptSection = (
    <UserPromptInput
      value={userPrompt}
      onChange={(val) => { setUserPrompt(val); emit('userPrompt', val); }}
      required
      onOpenToolDrawer={onOpenToolDrawer}
      onOpenTool={onOpenTool}
      showTriggerFields
    />
  );

  const outputFieldsSection = (
    <OutputFields
      fields={outputFields}
      onFieldsChange={updateOutputFields}
      showInfo
      infoTooltip={OUTPUT_FIELDS_INFO}
      infoLearnMoreHref={OUTPUT_FIELDS_LEARN_MORE_HREF}
      infoOnLearnMore={onOpenGlossary ? () => onOpenGlossary('output-field') : undefined}
      onOpenGlossary={onOpenGlossary}
      collapseToTwoLines={collapseChipsToTwoLines}
      addInLabelRow={collapseChipsToTwoLines}
    />
  );

  const llmModelSection = (
    <div className={styles.fieldGroup}>
      <div className={styles.labelRow}>
        <span className={styles.label}>LLM Model</span>
        <Tooltip
          content={
            onOpenGlossary ? (
              <span className="flex flex-col gap-xs">
                {LLM_MODEL_TOOLTIP}
                <button
                  type="button"
                  className="m-0 cursor-pointer border-0 bg-transparent p-0 text-left text-white underline-offset-2 hover:underline"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenGlossary('llm-model');
                  }}
                >
                  Learn more
                </button>
              </span>
            ) : (
              LLM_MODEL_TOOLTIP
            )
          }
          variant="detail"
          side="top"
          interactive={Boolean(onOpenGlossary)}
        >
          <button
            type="button"
            className="flex items-center justify-center text-text-tertiary hover:text-text-secondary"
            aria-label="More info"
          >
            <img src={infoIconUrl} alt="" width={16} height={16} className="opacity-40 hover:opacity-60" />
          </button>
        </Tooltip>
      </div>
      <SingleSelect
        name="llmModel"
        selected={llmModel}
        options={LLM_MODEL_OPTIONS}
        onChange={(opt) => { setLlmModel(opt.value); emit('llmModel', opt.value); }}
        placeholder="Select"
      />
    </div>
  );

  return (
    <div className={`${styles.container}${collapseChipsToOneLine ? ` ${styles.containerExploration}` : ''}`}>
      <div className={styles.essentialsGroup}>
        {collapseChipsToOneLine ? (
          <div className={styles.nameDescriptionGroup}>
            <FormInput
              name="taskName"
              type="text"
              label="Task name"
              placeholder="Enter name"
              value={taskName}
              onChange={(e) => { setTaskName(e.target.value); emit('taskName', e.target.value); }}
              required
            />
            <TextArea
              name="description"
              label="Description"
              placeholder="Enter description"
              value={description}
              onChange={(e) => { setDescription(e.target.value); emit('description', e.target.value); }}
              required
              noFloatingLabel
            />
          </div>
        ) : (
          <>
            <FormInput
              name="taskName"
              type="text"
              label="Task name"
              placeholder="Enter name"
              value={taskName}
              onChange={(e) => { setTaskName(e.target.value); emit('taskName', e.target.value); }}
              required
            />
            <TextArea
              name="description"
              label="Description"
              placeholder="Enter description"
              value={description}
              onChange={(e) => { setDescription(e.target.value); emit('description', e.target.value); }}
              required
              noFloatingLabel
            />
          </>
        )}

        {systemPromptSection}
        {userPromptSection}
      </div>

      <div className={styles.advancedSection}>
        <button
          type="button"
          className={styles.advancedToggle}
          onClick={() => setAdvancedOpen((open) => !open)}
          aria-expanded={advancedOpen}
        >
          <span className={styles.advancedToggleLabel}>Advanced settings</span>
          <span
            className={`material-symbols-outlined ${styles.advancedToggleChevron}${advancedOpen ? ` ${styles.advancedToggleChevronOpen}` : ''}`}
            aria-hidden
          >
            expand_more
          </span>
        </button>
        {advancedOpen && (
          <div className={styles.advancedBody}>
            {llmModelSection}
            {contextSection}
            {inputFieldsSection}
            {outputFieldsSection}
          </div>
        )}
      </div>

      {collapseChipsToTwoLines && contextModalOpen && (
        <ContextModal
          open
          onClose={() => setContextModalOpen(false)}
          onSave={handleContextSave}
          overlayZIndex={2100}
          onLearnMore={onOpenGlossary ? () => onOpenGlossary('context') : undefined}
        />
      )}

      {collapseChipsToTwoLines && inputModalOpen && (
        <AddInputFieldModal
          onClose={() => setInputModalOpen(false)}
          onAdd={handleInputAdd}
          onLearnMore={onOpenGlossary ? () => onOpenGlossary('input-field') : undefined}
        />
      )}
    </div>
  );
}
