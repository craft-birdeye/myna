import React, { useState, useRef, useEffect } from 'react';
import UserPromptInput from '../../../Molecules/Inputs/UserPromptInput/UserPromptInput';
import VariableChip, { CHIP_TYPES, DataTypeIcon } from '../../../Molecules/Inputs/VariableChip/VariableChip';
import etStyles from './EntityTaskBody.module.css';
import llmStyles from './LLMTaskBody.module.css';
import styles from './ProcedureDetailBody.module.css';

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

const normalizeChips = (arr) => {
  if (!Array.isArray(arr)) return [];
  return arr.map((item) =>
    typeof item === 'string' ? { value: item, type: 'variable' } : item
  );
};

// ─── ChipContainer — same as LLMTaskBody ─────────────────────────────────────

function ChipContainer({ chips, onChipChange, onChipDelete, addingNew, onStartAdd, onCancelAdd, onCommitAdd, onChangeChipType, defaultType = 'variable', viewOnly }) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerFor, setPickerFor] = useState(null);
  const [pendingType, setPendingType] = useState(defaultType);
  const pickerRef = useRef(null);

  useEffect(() => {
    if (!pickerOpen) return;
    const handler = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) setPickerOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [pickerOpen]);

  const openForAdd = () => { setPickerFor('add'); setPickerOpen(true); };
  const openForChip = (i) => { setPickerFor(i); setPickerOpen(true); };
  const selectType = (type) => {
    setPickerOpen(false);
    if (pickerFor === 'add') { setPendingType(type); onStartAdd(); }
    else if (typeof pickerFor === 'number') { onChangeChipType(pickerFor, type); }
    setPickerFor(null);
  };

  const hasChips = chips.length > 0 || addingNew;

  return (
    <div className={llmStyles.chipContainer}>
      {hasChips && (
        <div className={llmStyles.chipWrap}>
          {chips.map((chip, i) => (
            <VariableChip
              key={i}
              value={chip.value}
              type={chip.type}
              onChange={(v) => onChipChange(i, v)}
              onDelete={() => onChipDelete(i)}
              onSwatchClick={viewOnly ? undefined : () => openForChip(i)}
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
      )}
      {!viewOnly && (
        <div className={llmStyles.addRow} ref={pickerRef}>
          <button className={llmStyles.addBtn} type="button" onClick={openForAdd}>
            <span className="material-symbols-outlined">add_circle</span>
            <span className={llmStyles.addBtnLabel}>Add</span>
          </button>
          {pickerOpen && (
            <div className={llmStyles.typePicker}>
              {CHIP_TYPES.map((ct) => (
                <button
                  key={ct.type}
                  className={llmStyles.typePickerItem}
                  type="button"
                  onClick={() => selectType(ct.type)}
                >
                  <span className={`${llmStyles.typePickerSwatch} ${llmStyles[`tpSwatch${cap(ct.type)}`] || ''}`}>
                    {ct.icon
                      ? <span className={`material-symbols-outlined ${llmStyles[`tpIcon${cap(ct.type)}`] || ''}`}>{ct.icon}</span>
                      : <DataTypeIcon />}
                  </span>
                  <span className={llmStyles.typePickerLabel}>{ct.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Chip section — no inner container, just label + chips ───────────────────

function ChipSection({ label, chips, onChange, defaultType = 'variable', viewOnly }) {
  const [adding, setAdding] = useState(false);

  const commitAdd = (v, type) => { onChange([...chips, { value: v, type }]); setAdding(false); };
  const changeChip = (i, v) => { const n = [...chips]; n[i] = { ...n[i], value: v }; onChange(n); };
  const deleteChip = (i) => onChange(chips.filter((_, idx) => idx !== i));
  const changeType = (i, type) => { const n = [...chips]; n[i] = { ...n[i], type }; onChange(n); };

  return (
    <div className={styles.section}>
      <div className={etStyles.sectionLabelWrapper}>
        <span className={etStyles.sectionLabelText}>{label}</span>
        <span className={`material-symbols-outlined ${etStyles.sectionLabelIcon}`}>info</span>
      </div>
      <ChipContainer
        chips={chips}
        onChipChange={changeChip}
        onChipDelete={deleteChip}
        addingNew={adding}
        onStartAdd={() => setAdding(true)}
        onCancelAdd={() => setAdding(false)}
        onCommitAdd={commitAdd}
        onChangeChipType={changeType}
        defaultType={defaultType}
        viewOnly={viewOnly}
      />
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ProcedureDetailBody({ initialValues = {}, onFieldChange, viewOnly = false }) {
  // Always start empty — user fills in details from scratch
  const [whenToUse, setWhenToUse] = useState(initialValues.whenToUse ?? '');
  const [toolChips, setToolChips] = useState(normalizeChips(initialValues.toolChips ?? []));
  const [contextChips, setContextChips] = useState(normalizeChips(initialValues.contextChips ?? []));
  const [stepsText, setStepsText] = useState(initialValues.stepsText ?? '');

  return (
    <div className={styles.body}>

      {/* ─── When to use ─── */}
      <div className={styles.section}>
        <div className={etStyles.sectionLabelWrapper}>
          <span className={etStyles.sectionLabelText}>
            When to use this procedure?<span className={styles.required}> *</span>
          </span>
        </div>
        <textarea
          className={styles.whenToUseTextarea}
          placeholder="Describe when this procedure should be triggered..."
          value={whenToUse}
          rows={4}
          onChange={(e) => {
            const val = e.target.value;
            setWhenToUse(val);
            onFieldChange?.('whenToUse', val);
          }}
        />
      </div>

      {/* ─── Tools ─── */}
      <ChipSection
        label="Tools"
        chips={toolChips}
        onChange={(next) => { setToolChips(next); onFieldChange?.('toolChips', next); }}
        defaultType="tool"
        viewOnly={viewOnly}
      />

      {/* ─── Context ─── */}
      <ChipSection
        label="Context"
        chips={contextChips}
        onChange={(next) => { setContextChips(next); onFieldChange?.('contextChips', next); }}
        defaultType="variable"
        viewOnly={viewOnly}
      />

      {/* ─── Steps — UserPromptInput with toolbar, no "User prompt" label ─── */}
      <div className={styles.section}>
        <div className={etStyles.sectionLabelWrapper}>
          <span className={etStyles.sectionLabelText}>Steps</span>
        </div>
        <UserPromptInput
          hideLabel
          value={stepsText}
          onChange={(val) => { setStepsText(val); onFieldChange?.('stepsText', val); }}
        />
      </div>

    </div>
  );
}
