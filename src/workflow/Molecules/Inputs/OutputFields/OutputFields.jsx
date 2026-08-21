import React, { useState, useRef, useEffect } from 'react';
import VariableChip, { CHIP_TYPES, DataTypeIcon } from '../VariableChip/VariableChip';
import AiWandIcon from '../../../Organisms/Panels/RHS/icons/ai_text_grammar_wand.svg';
import { Tooltip } from '../../../../components/Tooltip/Tooltip';
import AddOutputFieldModal from '../../../Organisms/Modals/AddOutputFieldModal/AddOutputFieldModal';
import styles from './OutputFields.module.css';

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

const COLLAPSED_VISIBLE_COUNT = 4;

const normalizeFields = (arr) => {
  if (!Array.isArray(arr)) return [];
  return arr.map((item) =>
    typeof item === 'string' ? { value: item, type: 'variable' } : item
  );
};

const MOCK_GENERATED_FIELDS = [
  'sentiment_score',
  'key_themes',
  'staff_rating',
  'overall_experience',
  'recommendation_likelihood',
];

function Spinner() {
  return <div className={styles.spinner} />;
}

export default function OutputFields({
  fields = [],
  onFieldsChange,
  showInfo,
  /** Exploration: Locations-style chips + label-row "+ Add" / generate icon. */
  collapseToOneLine = false,
}) {
  const normalizedFields = normalizeFields(fields);
  const [generateState, setGenerateState] = useState('idle');
  const [addingNew, setAddingNew] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerFor, setPickerFor] = useState(null);
  const [pendingType, setPendingType] = useState('variable');
  const [expanded, setExpanded] = useState(false);
  const [outputModalOpen, setOutputModalOpen] = useState(false);
  const pickerRef = useRef(null);

  const showCollapsed = collapseToOneLine && !expanded && !addingNew;
  const hiddenCount = showCollapsed
    ? Math.max(0, normalizedFields.length - COLLAPSED_VISIBLE_COUNT)
    : 0;
  const visibleFields = showCollapsed
    ? normalizedFields.slice(0, COLLAPSED_VISIBLE_COUNT)
    : normalizedFields;

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

  const openForAdd = () => {
    if (collapseToOneLine) {
      setOutputModalOpen(true);
      return;
    }
    setPickerFor('add');
    setPickerOpen(true);
  };
  const openForChip = (i) => { setPickerFor(i); setPickerOpen(true); };

  const selectType = (type) => {
    setPickerOpen(false);
    if (pickerFor === 'add') {
      setPendingType(type);
      setAddingNew(true);
    } else if (typeof pickerFor === 'number') {
      onFieldsChange?.(normalizedFields.map((f, idx) => idx === pickerFor ? { ...f, type } : f));
    }
    setPickerFor(null);
  };

  const handleGenerate = () => {
    setGenerateState('generating');
    setTimeout(() => setGenerateState('generated'), 2000);
  };

  const handleAcceptGenerated = () => {
    onFieldsChange?.([...normalizedFields, ...MOCK_GENERATED_FIELDS.map((v) => ({ value: v, type: 'variable' }))]);
    setGenerateState('idle');
  };

  const handleRegenerate = () => {
    setGenerateState('generating');
    setTimeout(() => setGenerateState('generated'), 2000);
  };

  const handleClose = () => setGenerateState('idle');

  const onChipChange = (i, v) => onFieldsChange?.(normalizedFields.map((f, idx) => idx === i ? { ...f, value: v } : f));
  const onChipDelete = (i) => onFieldsChange?.(normalizedFields.filter((_, idx) => idx !== i));
  const onCommitAdd = (v) => {
    onFieldsChange?.([...normalizedFields, { value: v, type: pendingType }]);
    setAddingNew(false);
  };

  const handleOutputModalAdd = ({ fieldName }) => {
    if (!fieldName) return;
    onFieldsChange?.([...normalizedFields, { value: fieldName, type: 'variable' }]);
    setOutputModalOpen(false);
  };

  const hasChips = normalizedFields.length > 0 || addingNew;
  const isEmptyExploration = collapseToOneLine && normalizedFields.length === 0 && !addingNew;

  const chipsBlock = hasChips && (
    <div className={`${styles.chipWrap}${collapseToOneLine ? ` ${styles.chipWrapExploration}` : ''}`}>
      {visibleFields.map((f, i) => (
        <VariableChip
          key={i}
          value={f.value}
          type={f.type}
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
          onChange={onCommitAdd}
          onDelete={() => setAddingNew(false)}
        />
      )}
    </div>
  );

  const viewMoreBtn = hiddenCount > 0 && (
    <button
      type="button"
      className={styles.moreLink}
      onClick={() => setExpanded(true)}
    >
      {`+ ${hiddenCount} more`}
    </button>
  );

  const generateUi = (
    <>
      {!collapseToOneLine && generateState === 'idle' && (
        <button className={styles.generateBtn} type="button" onClick={handleGenerate}>
          <img src={AiWandIcon} alt="" className={styles.generateIcon} />
          <span className={styles.generateLabel}>Generate from prompt</span>
        </button>
      )}

      {generateState === 'generating' && (
        <div className={styles.aiBox}>
          <div className={styles.generatingRow}>
            <Spinner />
            <span className={styles.generatingText}>Generating summary</span>
          </div>
        </div>
      )}

      {generateState === 'generated' && (
        <div className={styles.aiBox}>
          <button className={styles.aiCloseBtn} type="button" onClick={handleClose}>
            <span className="material-symbols-outlined">close</span>
          </button>
          <ul className={styles.generatedList}>
            {MOCK_GENERATED_FIELDS.map((f) => <li key={f}>{f}</li>)}
          </ul>
          <div className={styles.aiActions}>
            <button className={styles.aiActionBtn} type="button" onClick={handleAcceptGenerated}>
              <span className="material-symbols-outlined">check_circle</span>
              Accept
            </button>
            <div className={styles.aiActionDivider} />
            <button className={styles.aiActionBtn} type="button" onClick={handleRegenerate}>
              <span className="material-symbols-outlined">restart_alt</span>
              Regenerate
            </button>
          </div>
        </div>
      )}
    </>
  );

  return (
    <div className={styles.wrap}>
      <div className={styles.labelRow}>
        <span className={styles.label}>Output fields</span>
        {showInfo && <span className={`material-symbols-outlined ${styles.infoIcon}`}>info</span>}
        {collapseToOneLine && (
          <div className={styles.labelActions}>
            {!isEmptyExploration && (
              <button type="button" className={styles.fieldAddBtn} onClick={openForAdd}>
                + Add
              </button>
            )}
            {generateState === 'idle' && (
              <Tooltip content="Generate from prompt" variant="brief" side="bottom">
                <button
                  type="button"
                  className={styles.generateIconBtn}
                  onClick={handleGenerate}
                  aria-label="Generate from prompt"
                >
                  <img src={AiWandIcon} alt="" className={styles.generateIcon} />
                </button>
              </Tooltip>
            )}
          </div>
        )}
      </div>

      {collapseToOneLine ? (
        isEmptyExploration ? (
          <button type="button" className={styles.addLink} onClick={openForAdd}>
            + Add
          </button>
        ) : (
          <div className={styles.explorationChipsField}>
            {chipsBlock}
            {viewMoreBtn}
          </div>
        )
      ) : (
        <div className={styles.chipContainer}>
          {chipsBlock}
          <div className={styles.addRow} ref={pickerRef}>
            <button className={styles.addBtn} type="button" onClick={openForAdd}>
              <span className="material-symbols-outlined">add_circle</span>
              <span className={styles.addBtnLabel}>Add</span>
            </button>
            {pickerOpen && (
              <div className={styles.typePicker}>
                {CHIP_TYPES.map((ct) => (
                  <button
                    key={ct.type}
                    className={styles.typePickerItem}
                    type="button"
                    onClick={() => selectType(ct.type)}
                  >
                    <span className={`${styles.typePickerSwatch} ${styles[`tpSwatch${cap(ct.type)}`] || ''}`}>
                      {ct.icon
                        ? <span className={`material-symbols-outlined ${styles[`tpIcon${cap(ct.type)}`] || ''}`}>{ct.icon}</span>
                        : <DataTypeIcon />
                      }
                    </span>
                    <span className={styles.typePickerLabel}>{ct.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {generateUi}

      {collapseToOneLine && outputModalOpen && (
        <AddOutputFieldModal
          onClose={() => setOutputModalOpen(false)}
          onAdd={handleOutputModalAdd}
        />
      )}
    </div>
  );
}
