import React, { useState } from 'react';
import { SingleSelect, FormInput, TextArea, Toggle, Tooltip } from '../../../elemental-stubs';
import Conditions from '../../../Molecules/Conditions/Conditions';
import styles from './ControlBranchBody.module.css';

const BASED_ON_OPTIONS = [
  { value: 'conditions', label: 'Conditions' },
  { value: 'field', label: 'Field' },
  { value: 'percentage', label: 'Percentage' },
  { value: 'prompts', label: 'Prompts' },
];

const DEFAULT_CONDITION_OPTIONS = {
  field: [
    { value: 'rating', label: 'Rating' },
    { value: 'sentiment', label: 'Sentiment' },
    { value: 'source', label: 'Source' },
    { value: 'location', label: 'Location' },
    { value: 'keyword', label: 'Keyword' },
  ],
  operator: [
    { value: 'equals', label: 'Equals' },
    { value: 'not_equals', label: 'Does not equal' },
    { value: 'contains', label: 'Contains' },
    { value: 'greater_than', label: 'Greater than' },
    { value: 'less_than', label: 'Less than' },
  ],
  value: [
    { value: '1', label: '1 star' },
    { value: '2', label: '2 stars' },
    { value: '3', label: '3 stars' },
    { value: '4', label: '4 stars' },
    { value: '5', label: '5 stars' },
  ],
};

function SectionLabel({ label, required }) {
  return (
    <div className={styles.sectionLabel}>
      <span className={styles.sectionLabelText}>{label}</span>
      {required && <span className={styles.required}>*</span>}
    </div>
  );
}

function makeCondition(id) {
  return { id, fieldValue: '', operatorValue: '', valueValue: '' };
}

function BranchAccordionItem({
  branch,
  pathDetail,
  expanded,
  canReorder,
  canDelete,
  onToggle,
  onDragStart,
  onDragOver,
  onDrop,
  onDelete,
  onPathFieldChange,
}) {
  const isFallback = !!branch.isFallback;
  const name = pathDetail.branchName ?? branch.name ?? '';
  const description = pathDetail.description ?? '';
  const conditions = pathDetail.conditions ?? [];
  const logic = pathDetail.logic ?? 'OR';
  const conditionOptions = pathDetail.conditionOptions ?? DEFAULT_CONDITION_OPTIONS;

  function updateConditions(next) {
    onPathFieldChange?.(branch.id, 'conditions', next);
  }

  const header = (
    <div
      className={`${styles.accordionHeader}${expanded ? ` ${styles.accordionHeaderOpen}` : ''}`}
      onClick={() => !isFallback && onToggle?.()}
      role={isFallback ? undefined : 'button'}
      tabIndex={isFallback ? undefined : 0}
      onKeyDown={(e) => {
        if (isFallback) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onToggle?.();
        }
      }}
    >
      <span
        className={`${styles.dragHandle}${canReorder ? '' : ` ${styles.dragHandleDisabled}`}`}
        draggable={canReorder}
        onDragStart={(e) => {
          if (!canReorder) return;
          e.stopPropagation();
          onDragStart?.(e);
        }}
        onClick={(e) => e.stopPropagation()}
        aria-hidden
      >
        <span className="material-symbols-outlined">drag_indicator</span>
      </span>
      <span className={styles.accordionTitle}>{name || 'Untitled branch'}</span>
      <div className={styles.accordionActions}>
        {canDelete && (
          <button
            type="button"
            className={styles.deleteBtn}
            aria-label="Delete branch"
            onClick={(e) => {
              e.stopPropagation();
              onDelete?.();
            }}
          >
            <span className="material-symbols-outlined">delete</span>
          </button>
        )}
        {!isFallback && (
          <span className="material-symbols-outlined">{expanded ? 'expand_less' : 'expand_more'}</span>
        )}
      </div>
    </div>
  );

  return (
    <div
      className={`${styles.accordionItem}${expanded ? ` ${styles.accordionItemOpen}` : ''}`}
      onDragOver={canReorder ? onDragOver : undefined}
      onDrop={canReorder ? onDrop : undefined}
    >
      {isFallback ? (
        <Tooltip text="This branch runs last when no conditions match." position="top" display="block">
          {header}
        </Tooltip>
      ) : (
        header
      )}

      {expanded && !isFallback && (
        <div className={styles.accordionBody}>
          <FormInput
            name={`branch-name-${branch.id}`}
            type="text"
            label="Branch name"
            placeholder="Enter name"
            value={name}
            onChange={(e) => onPathFieldChange?.(branch.id, 'branchName', e.target.value)}
            required
          />
          <TextArea
            name={`branch-desc-${branch.id}`}
            label="Description"
            placeholder="E.g. Send an email"
            value={description}
            onChange={(e) => onPathFieldChange?.(branch.id, 'description', e.target.value)}
            noFloatingLabel
            required
          />
          <div className={styles.conditionsBlock}>
            <SectionLabel label="Conditions" required />
            {conditions.length === 0 ? (
              <button
                type="button"
                className={styles.addLink}
                onClick={() => updateConditions([makeCondition(1)])}
              >
                <span className="material-symbols-outlined">add_circle</span>
                Add condition
              </button>
            ) : (
              <Conditions
                conditions={conditions}
                logic={logic}
                onConditionChange={(id, field, value) => {
                  updateConditions(
                    conditions.map((c) => (c.id === id ? { ...c, [`${field}Value`]: value } : c)),
                  );
                }}
                onLogicChange={(val) => onPathFieldChange?.(branch.id, 'logic', val)}
                onAddCondition={() =>
                  updateConditions([...conditions, makeCondition(conditions.length + 1)])
                }
                onRemoveCondition={(id) => updateConditions(conditions.filter((c) => c.id !== id))}
                onAdvancedFilters={() => {}}
                conditionOptions={conditionOptions}
                onOptionsChange={(key, opts) =>
                  onPathFieldChange?.(branch.id, 'conditionOptions', {
                    ...conditionOptions,
                    [key]: opts,
                  })
                }
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ControlBranchBody({
  initialValues = {},
  onFieldChange,
  onPathFieldChange,
  onDeleteBranch,
}) {
  const [basedOn, setBasedOn] = useState(initialValues.basedOn ?? 'conditions');
  const [fieldName, setFieldName] = useState(initialValues.fieldName ?? '');
  const [description, setDescription] = useState(initialValues.description ?? '');
  const [mergeBranches, setMergeBranches] = useState(initialValues.mergeBranches ?? true);
  const [branches, setBranches] = useState(() => {
    const initial = initialValues.branches ?? [];
    return initial.map((b) => ({ ...b, percentage: b.percentage ?? 0 }));
  });
  const [pathDetails, setPathDetails] = useState(() => initialValues.pathDetails ?? {});
  const [expandedId, setExpandedId] = useState(() => {
    const first = (initialValues.branches ?? []).find((b) => !b.isFallback);
    return first?.id ?? null;
  });
  const [dragIndex, setDragIndex] = useState(null);

  const branchIdsKey = (initialValues.branches ?? []).map((b) => b.id).join('|');
  React.useEffect(() => {
    const next = (initialValues.branches ?? []).map((b) => ({ ...b, percentage: b.percentage ?? 0 }));
    setBranches(next);
    if (initialValues.pathDetails) setPathDetails(initialValues.pathDetails);
  }, [branchIdsKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const canReorderOrDelete = branches.length > 2;

  function deleteBranch(branchId) {
    if (!canReorderOrDelete) return;
    setBranches((prev) => {
      const next = prev.filter((b) => b.id !== branchId);
      onFieldChange?.('branches', next);
      return next;
    });
    if (expandedId === branchId) {
      const first = branches.find((b) => !b.isFallback && b.id !== branchId);
      setExpandedId(first?.id ?? null);
    }
    onDeleteBranch?.(branchId);
  }

  function addBranch() {
    setBranches((prev) => {
      const nonFallback = prev.filter((branch) => !branch.isFallback);
      const fallback = prev.filter((branch) => branch.isFallback);
      const branchNumber = nonFallback.length + 1;
      const idBase = initialValues.branchNodeId || 'branch';
      const newId = `${idBase}-path-${Date.now()}`;
      const newBranch = { id: newId, name: `Branch ${branchNumber}`, percentage: 0 };
      const next = [...nonFallback, newBranch, ...fallback];
      onFieldChange?.('branches', next);
      setPathDetails((details) => ({
        ...details,
        [newId]: {
          branchName: newBranch.name,
          description: '',
          conditions: [],
          parentId: initialValues.branchNodeId,
          isBranchPath: true,
        },
      }));
      setExpandedId(newId);
      return next;
    });
  }

  function reorderBranch(overIndex) {
    if (!canReorderOrDelete || dragIndex === null || dragIndex === overIndex) return;
    setBranches((prev) => {
      if (prev[dragIndex]?.isFallback || prev[overIndex]?.isFallback) return prev;
      const next = [...prev];
      const [moved] = next.splice(dragIndex, 1);
      next.splice(overIndex, 0, moved);
      onFieldChange?.('branches', next);
      return next;
    });
    setDragIndex(null);
  }

  function handlePathFieldChange(pathId, field, value) {
    setPathDetails((prev) => ({
      ...prev,
      [pathId]: { ...(prev[pathId] || {}), [field]: value },
    }));
    if (field === 'branchName') {
      setBranches((prev) => {
        const next = prev.map((b) => (b.id === pathId ? { ...b, name: value } : b));
        onFieldChange?.('branches', next);
        return next;
      });
    }
    onPathFieldChange?.(pathId, field, value);
  }

  function updatePercentage(index, value) {
    setBranches((prev) => {
      const next = prev.map((b, i) => (i === index ? { ...b, percentage: value } : b));
      onFieldChange?.('branches', next);
      return next;
    });
  }

  const totalPercentage = branches.reduce((sum, b) => sum + (b.percentage || 0), 0);

  return (
    <div className={styles.root}>
      <div className={styles.field}>
        <SectionLabel label="Based on" required />
        <SingleSelect
          name="basedOn"
          selected={basedOn}
          options={BASED_ON_OPTIONS}
          onChange={(opt) => {
            setBasedOn(opt.value);
            onFieldChange?.('basedOn', opt.value);
          }}
          placeholder="Select"
        />
      </div>

      {basedOn === 'field' && (
        <div className={styles.field}>
          <SectionLabel label="Field" required />
          <FormInput
            name="fieldName"
            type="text"
            label="Field name"
            value={fieldName}
            onChange={(e) => {
              setFieldName(e.target.value);
              onFieldChange?.('fieldName', e.target.value);
            }}
          />
          <span className={styles.hint}>Select the field whose value determines the branch</span>
        </div>
      )}

      <div className={styles.field}>
        <SectionLabel label="Description" required />
        <TextArea
          name="branch-description"
          placeholder="Build condition-specific flows"
          value={description}
          onChange={(e) => {
            setDescription(e.target.value);
            onFieldChange?.('description', e.target.value);
          }}
          noFloatingLabel
        />
      </div>

      <div className={styles.mergeRow}>
        <span className={styles.mergeLabel}>Merge branches</span>
        <Toggle
          name="mergeBranches"
          checked={mergeBranches}
          roundedToggle
          onChange={(checked) => {
            setMergeBranches(checked);
            onFieldChange?.('mergeBranches', checked);
          }}
        />
      </div>

      <div className={styles.branchesSection}>
        <div className={styles.branchesHeader}>
          <SectionLabel label="Branches" />
          {basedOn === 'percentage' && (
            <span className={totalPercentage === 100 ? styles.pctOk : styles.pctBad}>
              Total: {totalPercentage}%
            </span>
          )}
        </div>
        <p className={styles.branchesHint}>Branches run in the order listed.</p>

        <div className={styles.accordionList}>
          {branches.map((b, i) =>
            basedOn === 'percentage' ? (
              <div key={b.id} className={styles.pctItem}>
                <span className="material-symbols-outlined">drag_indicator</span>
                <span className={styles.pctName}>
                  {i + 1}. {b.name}
                </span>
                <div className={styles.pctInput}>
                  <FormInput
                    name={`branch-pct-${i}`}
                    type="number"
                    value={String(b.percentage)}
                    onChange={(e) => updatePercentage(i, Number(e.target.value))}
                    min="0"
                    max="100"
                  />
                  <span>%</span>
                </div>
              </div>
            ) : (
              <BranchAccordionItem
                key={b.id}
                branch={b}
                pathDetail={pathDetails[b.id] || {}}
                expanded={expandedId === b.id}
                canReorder={canReorderOrDelete && !b.isFallback}
                canDelete={canReorderOrDelete && !b.isFallback}
                onToggle={() => setExpandedId((id) => (id === b.id ? null : b.id))}
                onDragStart={() => setDragIndex(i)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => reorderBranch(i)}
                onDelete={() => deleteBranch(b.id)}
                onPathFieldChange={handlePathFieldChange}
              />
            ),
          )}
        </div>

        <button type="button" className={styles.addLink} onClick={addBranch}>
          <span className="material-symbols-outlined">add_circle</span>
          Add branch
        </button>
      </div>
    </div>
  );
}
