import React, { useState } from 'react';
import { FormInput, TextArea, Tooltip } from '../../../elemental-stubs';
import Conditions from '../../../Molecules/Conditions/Conditions';
import styles from './ControlBranchBody.module.css';

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

function makeCondition(id, fieldValue = '') {
  return { id, fieldValue, operatorValue: '', valueValue: '' };
}

function isBlankCondition(c) {
  return !(c?.fieldValue || c?.operatorValue || c?.valueValue);
}

function normalizeBranches(list) {
  return (list || []).map((b) => ({ ...b, percentage: b.percentage ?? 0 }));
}

/** Default collapsed rows matching the Branch RHS design. */
function getDefaultBranches(branchNodeId) {
  const idBase = branchNodeId || 'branch';
  return [
    { id: `${idBase}-path-1`, name: 'Branch 1', percentage: 0 },
    { id: `${idBase}-path-fallback`, name: 'No conditions met', isFallback: true, percentage: 0 },
  ];
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
  onDragEnd,
  onDelete,
  onPathFieldChange,
}) {
  const itemRef = React.useRef(null);
  const addMenuRef = React.useRef(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const [addMenuOpen, setAddMenuOpen] = React.useState(false);
  const isFallback = !!branch.isFallback;
  const rawName = pathDetail.branchName ?? branch.name ?? '';
  const name = rawName === 'None met' ? 'No conditions met' : rawName;
  const description = pathDetail.description ?? '';
  const conditions = pathDetail.conditions ?? [];
  const filledConditions = conditions.filter((c) => !isBlankCondition(c));
  const logic = pathDetail.logic ?? 'OR';
  const conditionOptions = pathDetail.conditionOptions ?? DEFAULT_CONDITION_OPTIONS;
  const fieldOptions = conditionOptions.field ?? [];

  function updateConditions(next) {
    onPathFieldChange?.(branch.id, 'conditions', next);
  }

  // Drop blank placeholder rows so empty state stays "Add condition" only.
  React.useEffect(() => {
    if (conditions.length > 0 && conditions.every(isBlankCondition)) {
      updateConditions([]);
    }
  }, [branch.id]); // eslint-disable-line react-hooks/exhaustive-deps

  React.useEffect(() => {
    if (!addMenuOpen) return undefined;
    const onDocClick = (e) => {
      if (!addMenuRef.current?.contains(e.target)) setAddMenuOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [addMenuOpen]);

  function handlePickConditionField(opt) {
    const next = [
      ...filledConditions,
      makeCondition(Date.now(), opt.value),
    ];
    updateConditions(next);
    setAddMenuOpen(false);
  }

  const addConditionControl = (
    <div className={styles.addConditionWrap} ref={addMenuRef}>
      <button
        type="button"
        className={styles.addConditionBtn}
        onClick={() => setAddMenuOpen((open) => !open)}
        aria-expanded={addMenuOpen}
        aria-haspopup="listbox"
      >
        <span className="material-symbols-outlined">add_circle</span>
        Add condition
        <span className={`material-symbols-outlined ${styles.addConditionChevron}`}>
          expand_more
        </span>
      </button>
      {addMenuOpen && (
        <div className={styles.addConditionMenu} role="listbox">
          {fieldOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={styles.addConditionMenuItem}
              role="option"
              onClick={() => handlePickConditionField(opt)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  // Expanded non-fallback rows use a fixed "Branch name" header label (Figma);
  // collapsed rows show the live branch title.
  const headerTitle = !isFallback && expanded
    ? 'Branch name'
    : (name || 'Untitled branch');

  const header = (
    <div
      className={`${styles.accordionHeader}${expanded ? ` ${styles.accordionHeaderOpen}` : ''}`}
      onClick={() => onToggle?.()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
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
          const card = itemRef.current;
          if (card && e.dataTransfer) {
            const rect = card.getBoundingClientRect();
            e.dataTransfer.effectAllowed = 'move';
            // Show the full branch card as the drag ghost (not just the handle icon).
            e.dataTransfer.setDragImage(card, e.clientX - rect.left, e.clientY - rect.top);
          }
          setIsDragging(true);
          onDragStart?.(e);
        }}
        onDragEnd={(e) => {
          setIsDragging(false);
          onDragEnd?.(e);
        }}
        onClick={(e) => e.stopPropagation()}
        aria-hidden
      >
        <span className="material-symbols-outlined">drag_indicator</span>
      </span>
      <span className={styles.accordionTitle}>{headerTitle}</span>
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
        <span className="material-symbols-outlined" aria-hidden>
          {expanded ? 'expand_less' : 'expand_more'}
        </span>
      </div>
    </div>
  );

  return (
    <div
      ref={itemRef}
      className={[
        styles.accordionItem,
        expanded ? styles.accordionItemOpen : '',
        isDragging ? styles.accordionItemDragging : '',
      ].filter(Boolean).join(' ')}
      onDragOver={canReorder || onDragOver ? onDragOver : undefined}
      onDrop={canReorder || onDrop ? onDrop : undefined}
    >
      {isFallback ? (
        <Tooltip text="This branch runs last when no conditions match." position="top" display="block">
          {header}
        </Tooltip>
      ) : (
        header
      )}

      {expanded && (
        <div className={styles.accordionBody}>
          {isFallback ? (
            <p className={styles.fallbackNote}>
              This path runs when none of the branch conditions above are met.
            </p>
          ) : (
            <>
              <FormInput
                name={`branch-name-${branch.id}`}
                type="text"
                placeholder="Enter name"
                value={name}
                onChange={(e) => onPathFieldChange?.(branch.id, 'branchName', e.target.value)}
              />
              <div className={styles.fieldBlock}>
                <SectionLabel label="Description" />
                <TextArea
                  name={`branch-desc-${branch.id}`}
                  placeholder="Enter branch description"
                  value={description}
                  onChange={(e) => onPathFieldChange?.(branch.id, 'description', e.target.value)}
                  noFloatingLabel
                  rows={3}
                />
              </div>
              <div className={styles.conditionsBlock}>
                {filledConditions.length === 0 ? (
                  <>
                    <SectionLabel label="Condition" />
                    {addConditionControl}
                  </>
                ) : (
                  <Conditions
                    conditions={filledConditions}
                    logic={logic}
                    label="Condition"
                    showAdvancedFilters={false}
                    onConditionChange={(id, field, value) => {
                      updateConditions(
                        filledConditions.map((c) =>
                          c.id === id ? { ...c, [`${field}Value`]: value } : c,
                        ),
                      );
                    }}
                    onLogicChange={(val) => onPathFieldChange?.(branch.id, 'logic', val)}
                    onAddCondition={() => setAddMenuOpen(true)}
                    onRemoveCondition={(id) =>
                      updateConditions(filledConditions.filter((c) => c.id !== id))
                    }
                    onAdvancedFilters={() => {}}
                    conditionOptions={conditionOptions}
                  />
                )}
                {filledConditions.length > 0 && addMenuOpen && (
                  <div className={styles.addConditionWrap} ref={addMenuRef}>
                    <div className={`${styles.addConditionMenu} ${styles.addConditionMenuBelowConditions}`} role="listbox">
                      {fieldOptions.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          className={styles.addConditionMenuItem}
                          role="option"
                          onClick={() => handlePickConditionField(opt)}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
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
  const basedOn = initialValues.basedOn ?? 'conditions';
  const [branches, setBranches] = useState(() => {
    const initial = normalizeBranches(initialValues.branches);
    return initial.length > 0 ? initial : getDefaultBranches(initialValues.branchNodeId);
  });
  const [pathDetails, setPathDetails] = useState(() => {
    if (initialValues.pathDetails && Object.keys(initialValues.pathDetails).length > 0) {
      return initialValues.pathDetails;
    }
    const defaults = getDefaultBranches(initialValues.branchNodeId);
    return Object.fromEntries(
      defaults.map((b) => [
        b.id,
        {
          branchName: b.name,
          description: '',
          conditions: [],
          parentId: initialValues.branchNodeId,
          isBranchPath: true,
          isFallback: !!b.isFallback,
          nodes: [],
        },
      ]),
    );
  });
  // Match design: rows start collapsed.
  const [expandedId, setExpandedId] = useState(null);
  const [dragIndex, setDragIndex] = useState(null);
  /** @type {[{ index: number, position: 'before' | 'after' } | null, Function]} */
  const [dropIndicator, setDropIndicator] = useState(null);
  const didSeedDefaultsRef = React.useRef(false);

  const branchIdsKey = (initialValues.branches ?? []).map((b) => b.id).join('|');
  React.useEffect(() => {
    const incoming = normalizeBranches(initialValues.branches);
    if (incoming.length > 0) {
      setBranches(incoming);
      if (initialValues.pathDetails) {
        setPathDetails((prev) => ({ ...prev, ...initialValues.pathDetails }));
      }
      return;
    }
    // Parent has no paths yet — seed Branch 1 + No conditions met once and persist.
    if (didSeedDefaultsRef.current) return;
    didSeedDefaultsRef.current = true;
    const defaults = getDefaultBranches(initialValues.branchNodeId);
    setBranches(defaults);
    setPathDetails(
      Object.fromEntries(
        defaults.map((b) => [
          b.id,
          {
            branchName: b.name,
            description: '',
            conditions: [],
            parentId: initialValues.branchNodeId,
            isBranchPath: true,
            isFallback: !!b.isFallback,
            nodes: [],
          },
        ]),
      ),
    );
    onFieldChange?.('branches', defaults);
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
      setExpandedId(null);
    }
    onDeleteBranch?.(branchId);
  }

  function addBranch() {
    const nonFallback = branches.filter((branch) => !branch.isFallback);
    const fallback = branches.filter((branch) => branch.isFallback);
    const branchNumber = nonFallback.length + 1;
    const idBase = initialValues.branchNodeId || 'branch';
    const newId = `${idBase}-path-${Date.now()}`;
    const newBranch = { id: newId, name: `Branch ${branchNumber}`, percentage: 0 };
    const next = [...nonFallback, newBranch, ...fallback];
    const newPathDetail = {
      branchName: newBranch.name,
      description: '',
      conditions: [],
      parentId: initialValues.branchNodeId,
      isBranchPath: true,
      nodes: [],
    };

    setBranches(next);
    setPathDetails((details) => ({
      ...details,
      [newId]: newPathDetail,
    }));
    setExpandedId(newId);
    onFieldChange?.('branches', next);
  }

  function clearDragState() {
    setDragIndex(null);
    setDropIndicator(null);
  }

  function handleItemDragOver(e, index) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragIndex === null || dragIndex === index) {
      setDropIndicator(null);
      return;
    }
    // Fallback stays last — only allow dropping before it.
    if (branches[index]?.isFallback) {
      setDropIndicator({ index, position: 'before' });
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const position = e.clientY < rect.top + rect.height / 2 ? 'before' : 'after';
    setDropIndicator({ index, position });
  }

  function reorderToIndicator() {
    if (!canReorderOrDelete || dragIndex === null || !dropIndicator) {
      clearDragState();
      return;
    }
    if (branches[dragIndex]?.isFallback) {
      clearDragState();
      return;
    }

    let insertAt = dropIndicator.position === 'before'
      ? dropIndicator.index
      : dropIndicator.index + 1;

    setBranches((prev) => {
      if (prev[dragIndex]?.isFallback) return prev;
      const from = dragIndex;
      if (from < insertAt) insertAt -= 1;
      const without = prev.filter((_, idx) => idx !== from);
      const fallbackIdx = without.findIndex((b) => b.isFallback);
      if (fallbackIdx !== -1 && insertAt > fallbackIdx) insertAt = fallbackIdx;
      if (insertAt < 0) insertAt = 0;
      if (insertAt > without.length) insertAt = without.length;
      const moved = prev[from];
      const next = [
        ...without.slice(0, insertAt),
        moved,
        ...without.slice(insertAt),
      ];
      const sameOrder = next.every((b, idx) => b.id === prev[idx]?.id);
      if (sameOrder) return prev;
      onFieldChange?.('branches', next);
      return next;
    });
    clearDragState();
  }

  function handleItemDrop(e) {
    e.preventDefault();
    reorderToIndicator();
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
      <div className={styles.branchesSection}>
        <div className={styles.branchesHeader}>
          <SectionLabel label="Branches" />
          {basedOn === 'percentage' && (
            <span className={totalPercentage === 100 ? styles.pctOk : styles.pctBad}>
              Total: {totalPercentage}%
            </span>
          )}
        </div>
        <p className={styles.branchesHint}>Branches run in the order listed</p>

        <div className={styles.accordionList}>
          {branches.map((b, i) =>
            basedOn === 'percentage' ? (
              <div key={b.id} className={styles.pctItem}>
                <span className="material-symbols-outlined">drag_indicator</span>
                <span className={styles.pctName}>
                  {b.name}
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
              <div key={b.id} className={styles.accordionSlot}>
                {dropIndicator?.index === i && dropIndicator.position === 'before' && (
                  <div className={`${styles.dropLine} ${styles.dropLineBefore}`} aria-hidden />
                )}
                <BranchAccordionItem
                  branch={b}
                  pathDetail={pathDetails[b.id] || {}}
                  expanded={expandedId === b.id}
                  canReorder={canReorderOrDelete && !b.isFallback}
                  canDelete={canReorderOrDelete && !b.isFallback}
                  onToggle={() => setExpandedId((id) => (id === b.id ? null : b.id))}
                  onDragStart={() => setDragIndex(i)}
                  onDragOver={(e) => handleItemDragOver(e, i)}
                  onDrop={handleItemDrop}
                  onDragEnd={clearDragState}
                  onDelete={() => deleteBranch(b.id)}
                  onPathFieldChange={handlePathFieldChange}
                />
                {dropIndicator?.index === i && dropIndicator.position === 'after' && (
                  <div className={`${styles.dropLine} ${styles.dropLineAfter}`} aria-hidden />
                )}
              </div>
            ),
          )}
        </div>

        <button type="button" className={styles.addLink} onClick={addBranch}>
          <span className="material-symbols-outlined">add_circle</span>
          Add a branch
        </button>
      </div>
    </div>
  );
}
