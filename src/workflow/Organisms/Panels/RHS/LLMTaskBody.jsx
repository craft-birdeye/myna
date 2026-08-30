import React, { useState, useRef, useEffect, useLayoutEffect, forwardRef, useImperativeHandle } from 'react';
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

/** R1/R2/R3: collapsible section with a chevron toggle, matching the `advancedToggle` header style.
 *  R2 (`bare`) drops the card border/background — label + chevron only, no boxes or divider lines.
 *  R3 (`bare` + `lined`) is the same bare style but adds a subtle hairline between sections. */
function AccordionSection({ id, label, open, onToggle, children, bare = false, lined = false }) {
  return (
    <div
      className={`${styles.accordionSection}${bare ? ` ${styles.accordionSectionBare}` : ''}${open && !bare ? ` ${styles.accordionSectionOpen}` : ''}${lined ? ` ${styles.accordionSectionLined}` : ''}`}
    >
      <button
        type="button"
        className={`${styles.accordionHeader}${bare ? ` ${styles.accordionHeaderBare}` : ''}`}
        onClick={() => onToggle(id)}
        aria-expanded={open}
      >
        <span className={styles.accordionHeaderLabel}>{label}</span>
        <span
          className={`material-symbols-outlined ${styles.accordionChevron}${open ? ` ${styles.accordionChevronOpen}` : ''}`}
          aria-hidden
        >
          expand_more
        </span>
      </button>
      {open && (
        <div className={`${styles.accordionBody}${bare ? ` ${styles.accordionBodyBare}` : ''}`}>
          {children}
        </div>
      )}
    </div>
  );
}

const LLMTaskBody = forwardRef(function LLMTaskBody({
  initialValues = {},
  onFieldChange,
  onOpenToolDrawer,
  onOpenTool,
  onOpenGlossary,
  /** Exploration only: Setup / Configure tabs + footer Continue flow (not Sep 1). */
  collapseChipsToOneLine = false,
  /** Exploration chrome (incl. Sep 1): two chip lines + "View N more". */
  collapseChipsToTwoLines = false,
  /** Option 2: Setup / Configure as R4-style body tabs (not a second header dropdown). */
  setupConfigureTabs = false,
  /** @deprecated Prefer setupConfigureTabs — kept so older callers don't crash. */
  setupConfigureInHeader = false,
  /** Option 3: description has no visible label (placeholder only). */
  hideDescriptionLabel = false,
  /** Option 3: tighter / equal gap between Setup fields. */
  tightNameDescription = false,
  /** Option 3: vertical stepper (Basic / Prompts & Fields / Context & Model) instead of tabs. */
  option3Stepper = false,
  /** R1/R2/R3: accordion layout — Basic config / Prompts / Fields / Context / Models. */
  accordionLayout = false,
  /** R2/R3: same accordion structure as R1, but sections render as plain
   *  text + chevron rows instead of bordered cards. */
  accordionBare = false,
  /** R3 only: adds a subtle hairline between accordion sections (bare style only). */
  accordionLined = false,
  /** R4 / Sep 1: segmented tab bar — Basic/Prompts/Fields/Context each swap the same
   *  content pane (model picker lives under Context, not its own tab). */
  segmentedLayout = false,
  /** Controlled Setup / Configure tab (Option 2) or legacy callers. */
  activeTab: activeTabProp,
  onTabChange,
  /** R1/R2/R3/R4: notified whenever the missing-required-field state changes, so the RHS
   *  footer's Save button can disable itself and show the warning. */
  onValidationChange,
}, ref) {
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
  const [openAccordionSections, setOpenAccordionSections] = useState({
    basic: true,
    prompts: true,
    fields: false,
    context: false,
    models: false,
  });
  const toggleAccordionSection = (id) =>
    setOpenAccordionSections((prev) => ({ ...prev, [id]: !prev[id] }));
  /** R4: which segment's content pane is currently shown. */
  const [activeSegment, setActiveSegment] = useState('basic');
  /** Option 3: which accordion steps are open (any combination). Also used by Option 2. */
  const [openOption3Steps, setOpenOption3Steps] = useState({
    1: false,
    2: true,
    3: false,
  });
  /** Option 3: steps flagged after a failed Save (persist until that step is fixed). */
  const [option3ErrorSteps, setOption3ErrorSteps] = useState(() => new Set());
  const toggleOption3Step = (id) =>
    setOpenOption3Steps((prev) => ({ ...prev, [id]: !prev[id] }));
  const useSetupConfigureTabs = setupConfigureTabs || setupConfigureInHeader;
  const [localSetupTab, setLocalSetupTab] = useState('setup');
  const activeSetupTab = activeTabProp === 'setup' || activeTabProp === 'advanced' || activeTabProp === 'configure'
    ? (activeTabProp === 'configure' ? 'advanced' : activeTabProp)
    : localSetupTab;
  const setActiveSetupTab = (id) => {
    if (onTabChange) onTabChange(id);
    else setLocalSetupTab(id);
  };
  const emit = (field, val) => onFieldChange?.(field, val);

  /** R1 only: which required field (if any) failed the last Save attempt. */
  const [invalidField, setInvalidField] = useState(null);

  const segmentedRequiredFields = () => [
    { key: 'taskName', value: taskName, section: 'basic' },
    { key: 'description', value: description, section: 'basic' },
    { key: 'systemPrompt', value: systemPrompt, section: 'prompts' },
    { key: 'userPrompt', value: userPrompt, section: 'prompts' },
  ];

  const segmentHasMissingFields = (sectionId) =>
    segmentedRequiredFields().some(
      (f) => f.section === sectionId && !(f.value ?? '').trim(),
    );

  useEffect(() => {
    const segmentedMissing =
      segmentedLayout && segmentedRequiredFields().some((f) => !(f.value ?? '').trim());
    onValidationChange?.(
      invalidField !== null || option3ErrorSteps.size > 0 || segmentedMissing,
    );
  }, [
    invalidField,
    option3ErrorSteps,
    segmentedLayout,
    taskName,
    description,
    systemPrompt,
    userPrompt,
    onValidationChange,
  ]);

  const clearInvalid = (key, val) => {
    if (invalidField === key && (val ?? '').trim()) setInvalidField(null);
    if (!option3Stepper) return;
    if (key === 'taskName') clearOption3StepErrorIfFixed(1, { taskName: val });
    else if (key === 'description') clearOption3StepErrorIfFixed(1, { description: val });
    else if (key === 'systemPrompt') clearOption3StepErrorIfFixed(2, { systemPrompt: val });
    else if (key === 'userPrompt') clearOption3StepErrorIfFixed(2, { userPrompt: val });
    else if (key === 'context') clearOption3StepErrorIfFixed(3, { contextOk: !!(val ?? '').trim() });
  };

  const option3RequiredFields = () => [
    { key: 'taskName', value: taskName, section: 1 },
    { key: 'description', value: description, section: 1 },
    { key: 'systemPrompt', value: systemPrompt, section: 2 },
    { key: 'userPrompt', value: userPrompt, section: 2 },
    { key: 'context', value: contextFields.length > 0 ? 'ok' : '', section: 3 },
  ];

  const clearOption3StepErrorIfFixed = (sectionId, overrides = {}) => {
    setOption3ErrorSteps((prev) => {
      if (!prev.has(sectionId)) return prev;
      const values = {
        taskName,
        description,
        systemPrompt,
        userPrompt,
        contextOk: contextFields.length > 0,
        ...overrides,
      };
      const stillBroken =
        sectionId === 1
          ? !(values.taskName ?? '').trim() || !(values.description ?? '').trim()
          : sectionId === 2
            ? !(values.systemPrompt ?? '').trim() || !(values.userPrompt ?? '').trim()
            : sectionId === 3
              ? !values.contextOk
              : false;
      if (stillBroken) return prev;
      const next = new Set(prev);
      next.delete(sectionId);
      return next;
    });
  };

  useImperativeHandle(ref, () => ({
    /** Returns true if valid. Otherwise opens the offending accordion/step, flags the
     *  first empty required field in order, and returns false. */
    validate: () => {
      if (!accordionLayout && !segmentedLayout && !option3Stepper) return true;
      const requiredFields = option3Stepper
        ? option3RequiredFields()
        : segmentedRequiredFields();
      const incomplete = requiredFields.filter((f) => !(f.value ?? '').trim());
      if (incomplete.length === 0) {
        setInvalidField(null);
        if (option3Stepper) setOption3ErrorSteps(new Set());
        return true;
      }
      const firstInvalid = incomplete[0];
      if (option3Stepper) {
        const brokenSteps = new Set(incomplete.map((f) => f.section));
        setOption3ErrorSteps(brokenSteps);
        setOpenOption3Steps((prev) => {
          const next = { ...prev };
          brokenSteps.forEach((id) => { next[id] = true; });
          return next;
        });
      } else if (accordionLayout) {
        setOpenAccordionSections((prev) => ({ ...prev, [firstInvalid.section]: true }));
      } else {
        setActiveSegment(firstInvalid.section);
      }
      setInvalidField(firstInvalid.key);
      return false;
    },
  }));

  const updateContextFields = (next) => {
    setContextFields(next);
    emit('contextFields', next);
    clearInvalid('context', next.length > 0 ? 'ok' : '');
  };
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
      onChange={(val) => { setSystemPrompt(val); emit('systemPrompt', val); clearInvalid('systemPrompt', val); }}
      required
      error={invalidField === 'systemPrompt'}
      showExpandButton={!accordionLayout && !segmentedLayout}
    />
  );

  const userPromptSection = (
    <UserPromptInput
      value={userPrompt}
      onChange={(val) => { setUserPrompt(val); emit('userPrompt', val); clearInvalid('userPrompt', val); }}
      required
      onOpenToolDrawer={onOpenToolDrawer}
      onOpenTool={onOpenTool}
      showTriggerFields
      error={invalidField === 'userPrompt'}
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
        <span className={styles.label}>LLM model</span>
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

  const taskNameField = (
    <FormInput
      name="taskName"
      type="text"
      label={accordionLayout || segmentedLayout ? 'Task name' : 'Action name'}
      placeholder="Enter name"
      value={taskName}
      onChange={(e) => {
        setTaskName(e.target.value);
        emit('taskName', e.target.value);
        clearInvalid('taskName', e.target.value);
      }}
      required
      error={invalidField === 'taskName'}
    />
  );

  const descriptionField = (
    <div
      className={`${styles.descriptionField}${
        segmentedLayout ? ` ${styles.descriptionFieldSegmented}` : ''
      }${
        hideDescriptionLabel ? ` ${styles.descriptionFieldTwoLine}` : ''
      }`}
    >
      <TextArea
        name="description"
        label={hideDescriptionLabel ? undefined : 'Description'}
        placeholder="Enter description"
        value={description}
        onChange={(e) => {
          setDescription(e.target.value);
          emit('description', e.target.value);
          clearInvalid('description', e.target.value);
        }}
        required={!hideDescriptionLabel}
        noFloatingLabel
        rows={3}
        resize={hideDescriptionLabel ? 'none' : undefined}
        error={invalidField === 'description'}
        errorMessage={hideDescriptionLabel ? 'Description is required' : undefined}
      />
    </div>
  );

  if (option3Stepper) {
    // Option 3 exploration: always show the canvas-style error icon on Context & Model.
    const stepHasError = (stepId) => stepId === 3 || option3ErrorSteps.has(stepId);
    const OPTION3_STEPS = [
      {
        id: 1,
        label: 'Basic',
        content: (
          <div className={styles.essentialsGroupEqual}>
            {taskNameField}
            {descriptionField}
          </div>
        ),
      },
      {
        id: 2,
        label: 'Prompts & Fields',
        content: (
          <div className={`${styles.essentialsGroupEqual} ${styles.option3PromptsFields}`}>
            {systemPromptSection}
            {userPromptSection}
            {outputFieldsSection}
            {inputFieldsSection}
          </div>
        ),
      },
      {
        id: 3,
        label: 'Context & Model',
        content: (
          <div className={styles.essentialsGroupEqual}>
            {contextSection}
            {llmModelSection}
          </div>
        ),
      },
    ];
    return (
      <div className={`${styles.option3Container}${collapseChipsToOneLine ? ` ${styles.containerExploration}` : ''}`}>
        <nav className={styles.option3Stepper} aria-label="Action setup steps">
          <ol className={styles.option3StepperList}>
            {OPTION3_STEPS.map((step) => {
              const isOpen = !!openOption3Steps[step.id];
              const hasError = stepHasError(step.id);
              return (
                <li key={step.id} className={styles.option3StepperItem}>
                  <div className={styles.option3StepperRail}>
                    <span
                      className={`${styles.option3StepMarker}${
                        isOpen ? ` ${styles.option3StepMarkerActive}` : ''
                      }${hasError ? ` ${styles.option3StepMarkerError}` : ''}`}
                      aria-hidden
                    >
                      {step.id}
                    </span>
                    <div className={styles.option3StepConnector} aria-hidden />
                  </div>
                  <div className={styles.option3StepMain}>
                    <button
                      type="button"
                      className={styles.option3StepHeader}
                      onClick={() => toggleOption3Step(step.id)}
                      aria-expanded={isOpen}
                    >
                      <span
                        className={`${styles.option3StepLabel}${
                          isOpen ? ` ${styles.option3StepLabelActive}` : ''
                        }`}
                      >
                        {step.label}
                      </span>
                      {hasError && (
                        <Tooltip content="Missing mandatory fields" variant="detail" side="top">
                          <span
                            className={styles.option3StepErrorIcon}
                            role="img"
                            aria-label="Missing mandatory fields"
                            onClick={(e) => e.stopPropagation()}
                            onMouseDown={(e) => e.stopPropagation()}
                          >
                            <span className="material-symbols-outlined" aria-hidden>
                              error
                            </span>
                          </span>
                        </Tooltip>
                      )}
                      <span
                        className={`material-symbols-outlined ${styles.option3StepChevron}${
                          isOpen ? ` ${styles.option3StepChevronOpen}` : ''
                        }`}
                        aria-hidden
                      >
                        expand_more
                      </span>
                    </button>
                    {isOpen && (
                      <div className={styles.option3StepBody}>
                        {step.content}
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </nav>
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

  if (useSetupConfigureTabs) {
    const SETUP_SEGMENTS = [
      { id: 'setup', label: 'Setup' },
      { id: 'advanced', label: 'Advanced' },
    ];
    const setupContent = tightNameDescription ? (
      <div className={styles.essentialsGroupEqual}>
        {taskNameField}
        {descriptionField}
        {userPromptSection}
        {outputFieldsSection}
      </div>
    ) : (
      <div className={styles.essentialsGroup}>
        <div className={styles.nameDescriptionGroup}>
          {taskNameField}
          {descriptionField}
        </div>
        <div className={styles.promptOutputGroup}>
          {userPromptSection}
          {outputFieldsSection}
        </div>
      </div>
    );
    const advancedContent = (
      <div className={styles.advancedBody}>
        {inputFieldsSection}
        {systemPromptSection}
        {contextSection}
        {llmModelSection}
      </div>
    );
    return (
      <div className={`${styles.segmentedContainer}${collapseChipsToOneLine ? ` ${styles.containerExploration}` : ''}`}>
        <div className={styles.segmentedTrack} role="tablist" aria-label="Action sections">
          {SETUP_SEGMENTS.map((segment) => (
            <button
              key={segment.id}
              type="button"
              role="tab"
              className={`${styles.segmentedTab}${activeSetupTab === segment.id ? ` ${styles.segmentedTabActive}` : ''}`}
              onClick={() => setActiveSetupTab(segment.id)}
              aria-selected={activeSetupTab === segment.id}
            >
              {segment.label}
            </button>
          ))}
        </div>
        <div className={styles.segmentedContent} role="tabpanel">
          {activeSetupTab === 'advanced' ? advancedContent : setupContent}
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

  if (segmentedLayout) {
    const SEGMENTS = [
      { id: 'basic', label: 'Basic' },
      { id: 'prompts', label: 'Prompts' },
      { id: 'fields', label: 'Fields' },
      { id: 'context', label: 'Context' },
    ];
    const segmentContent = {
      basic: <>{taskNameField}{descriptionField}</>,
      prompts: <>{systemPromptSection}{userPromptSection}</>,
      fields: <>{inputFieldsSection}{outputFieldsSection}</>,
      context: <>{contextSection}{llmModelSection}</>,
    };
    return (
      <div className={styles.segmentedContainer}>
        <div className={styles.segmentedTrack}>
          {SEGMENTS.map((segment) => {
            const hasError = segmentHasMissingFields(segment.id);
            return (
              <button
                key={segment.id}
                type="button"
                className={`${styles.segmentedTab}${activeSegment === segment.id ? ` ${styles.segmentedTabActive}` : ''}`}
                onClick={() => setActiveSegment(segment.id)}
                aria-pressed={activeSegment === segment.id}
              >
                <span className={styles.segmentedTabInner}>
                  {segment.label}
                  {hasError && (
                    <Tooltip content="Missing mandatory fields" variant="detail" side="top">
                      <span
                        className={styles.segmentedTabErrorIcon}
                        role="img"
                        aria-label="Missing mandatory fields"
                        onClick={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                      >
                        <span className="material-symbols-outlined" aria-hidden>
                          error
                        </span>
                      </span>
                    </Tooltip>
                  )}
                </span>
              </button>
            );
          })}
        </div>
        <div className={styles.segmentedContent}>
          {segmentContent[activeSegment]}
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

  if (accordionLayout) {
    return (
      <div className={`${styles.accordionContainer}${accordionLined ? ` ${styles.accordionContainerLined}` : ''}`}>
        <AccordionSection
          id="basic"
          label="Basic config"
          open={openAccordionSections.basic}
          onToggle={toggleAccordionSection}
          bare={accordionBare}
          lined={accordionLined}
        >
          {taskNameField}
          {descriptionField}
        </AccordionSection>

        <AccordionSection
          id="prompts"
          label="Prompts"
          open={openAccordionSections.prompts}
          onToggle={toggleAccordionSection}
          bare={accordionBare}
          lined={accordionLined}
        >
          {systemPromptSection}
          {userPromptSection}
        </AccordionSection>

        <AccordionSection
          id="fields"
          label="Fields"
          open={openAccordionSections.fields}
          onToggle={toggleAccordionSection}
          bare={accordionBare}
          lined={accordionLined}
        >
          {inputFieldsSection}
          {outputFieldsSection}
        </AccordionSection>

        <AccordionSection
          id="context"
          label="Context"
          open={openAccordionSections.context}
          onToggle={toggleAccordionSection}
          bare={accordionBare}
          lined={accordionLined}
        >
          {contextSection}
        </AccordionSection>

        <AccordionSection
          id="models"
          label="Models"
          open={openAccordionSections.models}
          onToggle={toggleAccordionSection}
          bare={accordionBare}
          lined={accordionLined}
        >
          {llmModelSection}
        </AccordionSection>

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

  return (
    <div className={`${styles.container}${collapseChipsToOneLine ? ` ${styles.containerExploration}` : ''}`}>
      <div className={styles.essentialsGroup}>
        <div className={styles.nameDescriptionGroup}>
          {taskNameField}
          {descriptionField}
        </div>

        <div className={styles.promptOutputGroup}>
          {userPromptSection}
          {outputFieldsSection}
        </div>
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
            {inputFieldsSection}
            {systemPromptSection}
            {contextSection}
            {llmModelSection}
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
});

export default LLMTaskBody;
