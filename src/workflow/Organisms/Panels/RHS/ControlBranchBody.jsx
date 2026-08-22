import React, { useState } from 'react';
import { FormInput, TextArea } from '../../../elemental-stubs';
import Conditions from '../../../Molecules/Conditions/Conditions';
import { InfoTooltip } from '../../../../components/InfoTooltip/InfoTooltip';
import { CONDITION_OPERATORS } from '../../../constants/conditionOperators';
import styles from './ControlBranchBody.module.css';

const FALLBACK_PATH_INFO =
  'If none of the criteria are met, follow this branch.';
const FALLBACK_BRANCH_NAME = 'Fallback branch';
const LEGACY_FALLBACK_NAMES = new Set([
  'None met',
  'No conditions met',
  'Fall back branch',
  'Fallback branch',
  'Fallback',
]);

const DEFAULT_CONDITION_OPTIONS = {
  field: [
    { value: 'review_text', label: 'Review Text' },
    { value: 'rating', label: 'Rating' },
    { value: 'sentiment', label: 'Sentiment' },
    { value: 'source', label: 'Source' },
    { value: 'location', label: 'Location' },
    { value: 'keyword', label: 'Keyword' },
  ],
  operator: [...CONDITION_OPERATORS],
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

function makeCondition(id, fieldValue = '', indent = 0) {
  return { id, fieldValue, operatorValue: '', valueValue: '', indent };
}

function defaultPathDetail(branch, branchNodeId) {
  return {
    branchName: branch.name,
    description: '',
    conditions: branch.isFallback ? [] : [makeCondition(`${branch.id}-cond-1`)],
    parentId: branchNodeId,
    isBranchPath: true,
    isFallback: !!branch.isFallback,
    nodes: [],
  };
}

function normalizeBranches(list) {
  return (list || []).map((b) => ({ ...b, percentage: b.percentage ?? 0 }));
}

/** Default collapsed rows matching the Branch RHS design. */
function getDefaultBranches(branchNodeId) {
  const idBase = branchNodeId || 'branch';
  return [
    { id: `${idBase}-path-1`, name: 'Branch 1', percentage: 0 },
    { id: `${idBase}-path-fallback`, name: FALLBACK_BRANCH_NAME, isFallback: true, percentage: 0 },
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
  const [isDragging, setIsDragging] = React.useState(false);
  const [descriptionOpen, setDescriptionOpen] = React.useState(
    () => Boolean(String(pathDetail.description ?? '').trim()),
  );
  const rawName = pathDetail.branchName ?? branch.name ?? '';
  const isFallback = !!branch.isFallback
    || !!pathDetail.isFallback
    || LEGACY_FALLBACK_NAMES.has(rawName);
  const name = isFallback || LEGACY_FALLBACK_NAMES.has(rawName)
    ? FALLBACK_BRANCH_NAME
    : rawName;
  const description = pathDetail.description ?? '';
  const conditions = pathDetail.conditions ?? [];
  const logic = pathDetail.logic ?? 'OR';
  const conditionOptions = pathDetail.conditionOptions ?? DEFAULT_CONDITION_OPTIONS;

  // Non-fallback branches always show at least one empty condition row (no initial CTA).
  React.useEffect(() => {
    if (isFallback) return;
    if ((pathDetail.conditions ?? []).length > 0) return;
    onPathFieldChange?.(branch.id, 'conditions', [makeCondition(`${branch.id}-cond-1`)]);
  }, [isFallback, branch.id, pathDetail.conditions?.length, onPathFieldChange]);

  function updateConditions(next) {
    onPathFieldChange?.(branch.id, 'conditions', next);
  }

  function handleAddCondition() {
    const lastIndent = conditions[conditions.length - 1]?.indent ?? 0;
    updateConditions([...conditions, makeCondition(Date.now(), '', lastIndent)]);
  }

  function handleAddConditionGroup() {
    const lastIndent = conditions[conditions.length - 1]?.indent ?? 0;
    updateConditions([
      ...conditions,
      makeCondition(Date.now(), '', Math.min(lastIndent + 1, 2)),
    ]);
  }

  // Expanded non-fallback rows use a fixed "Branch name" header label (Figma);
  // collapsed rows show the live branch title.
  const headerTitle = !isFallback && expanded
    ? 'Branch name'
    : (name || 'Untitled branch');

  if (isFallback) {
    return (
      <div ref={itemRef} className={`${styles.accordionItem} ${styles.accordionItemFallback}`}>
        <div className={styles.fallbackBlock}>
          <div className={styles.fallbackLabelRow}>
            <span className={styles.fallbackLabel}>{FALLBACK_BRANCH_NAME}</span>
            <span className={styles.fallbackInfo}>
              <InfoTooltip text={FALLBACK_PATH_INFO} variant="detail" />
            </span>
          </div>
        </div>
      </div>
    );
  }

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
      {header}

      {expanded && !isFallback && (
        <div className={styles.accordionBody}>
          <FormInput
            name={`branch-name-${branch.id}`}
            type="text"
            placeholder="Enter name"
            value={name}
            onChange={(e) => onPathFieldChange?.(branch.id, 'branchName', e.target.value)}
          />

          {descriptionOpen ? (
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
          ) : (
            <button
              type="button"
              className={styles.addDescriptionBtn}
              onClick={() => setDescriptionOpen(true)}
            >
              <span className="material-symbols-outlined">add_circle</span>
              Add description
            </button>
          )}

          <div className={styles.conditionsBlock}>
            <Conditions
              conditions={conditions.length > 0 ? conditions : [makeCondition(`${branch.id}-cond-1`)]}
              logic={logic}
              label="Condition"
              showAdvancedFilters={false}
              onConditionChange={(id, field, value) => {
                const base = conditions.length > 0 ? conditions : [makeCondition(`${branch.id}-cond-1`)];
                updateConditions(
                  base.map((c) =>
                    c.id === id ? { ...c, [`${field}Value`]: value } : c,
                  ),
                );
              }}
              onLogicChange={(val) => onPathFieldChange?.(branch.id, 'logic', val)}
              onAddCondition={handleAddCondition}
              onAddConditionGroup={handleAddConditionGroup}
              onRemoveCondition={(id) => {
                const next = conditions.filter((c) => c.id !== id);
                // Keep one empty row so the condition box stays open by default.
                updateConditions(next.length > 0 ? next : [makeCondition(`${branch.id}-cond-1`)]);
              }}
              onAdvancedFilters={() => {}}
              conditionOptions={conditionOptions}
            />
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
  onFocusBranchPath,
  onOpenGlossary,
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
      defaults.map((b) => [b.id, defaultPathDetail(b, initialValues.branchNodeId)]),
    );
  });
  // Match design: rows start collapsed, unless a canvas path chip requested one open.
  const [expandedId, setExpandedId] = useState(
    () => initialValues.initialExpandedPathId || null,
  );
  const [dragIndex, setDragIndex] = useState(null);
  /** @type {[{ index: number, position: 'before' | 'after' } | null, Function]} */
  const [dropIndicator, setDropIndicator] = useState(null);
  const didSeedDefaultsRef = React.useRef(false);
  const accordionListRef = React.useRef(null);

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
    // Parent has no paths yet — seed Branch 1 + Fallback once and persist.
    if (didSeedDefaultsRef.current) return;
    didSeedDefaultsRef.current = true;
    const defaults = getDefaultBranches(initialValues.branchNodeId);
    setBranches(defaults);
    setPathDetails(
      Object.fromEntries(
        defaults.map((b) => [b.id, defaultPathDetail(b, initialValues.branchNodeId)]),
      ),
    );
    onFieldChange?.('branches', defaults);
  }, [branchIdsKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep the requested path expanded when opening from a canvas chip. Clearing
  // the prop (e.g. opening the parent Branch card) collapses all rows again.
  // `expandNonce` re-applies expand when the same chip is clicked again.
  // Fallback branch has no editable body — never expand it.
  React.useEffect(() => {
    const pathId = initialValues.initialExpandedPathId || null;
    if (!pathId) {
      setExpandedId(null);
      return undefined;
    }
    const fromDetails = initialValues.pathDetails?.[pathId];
    const fromBranches = (initialValues.branches || []).find((b) => b.id === pathId);
    const isFallbackPath = !!(fromDetails?.isFallback || fromBranches?.isFallback);
    setExpandedId(isFallbackPath ? null : pathId);
    const frame = requestAnimationFrame(() => {
      const el = accordionListRef.current?.querySelector(`[data-branch-path-id="${pathId}"]`);
      el?.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' });
    });
    return () => cancelAnimationFrame(frame);
  }, [initialValues.initialExpandedPathId, initialValues.expandNonce]); // eslint-disable-line react-hooks/exhaustive-deps

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
    const newPathDetail = defaultPathDetail(newBranch, initialValues.branchNodeId);

    setBranches(next);
    setPathDetails((details) => ({
      ...details,
      [newId]: newPathDetail,
    }));
    setExpandedId(newId);
    onFieldChange?.('branches', next);
    onFocusBranchPath?.(newId);
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
      <div className={styles.branchesSection} ref={accordionListRef}>
        <div className={styles.branchesHeader}>
          <SectionLabel label="Branches" />
          {basedOn === 'percentage' && (
            <span className={totalPercentage === 100 ? styles.pctOk : styles.pctBad}>
              Total: {totalPercentage}%
            </span>
          )}
        </div>
        <p className={styles.branchesHint}>
          Branches run in the order listed.{' '}
          <button
            type="button"
            className={styles.branchesHintLink}
            onClick={() => onOpenGlossary?.('branch')}
          >
            Learn more
          </button>
        </p>

        <div className={styles.accordionList}>
          {branches.map((b, i) => {
            const isFallbackBranch = !!b.isFallback
              || !!pathDetails[b.id]?.isFallback
              || LEGACY_FALLBACK_NAMES.has(pathDetails[b.id]?.branchName ?? b.name ?? '');
            if (basedOn !== 'percentage' && isFallbackBranch) return null;
            return basedOn === 'percentage' ? (
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
              <div key={b.id} className={styles.accordionSlot} data-branch-path-id={b.id}>
                {dropIndicator?.index === i && dropIndicator.position === 'before' && (
                  <div className={`${styles.dropLine} ${styles.dropLineBefore}`} aria-hidden />
                )}
                <BranchAccordionItem
                  branch={b}
                  pathDetail={pathDetails[b.id] || {}}
                  expanded={expandedId === b.id}
                  canReorder={canReorderOrDelete && !b.isFallback}
                  canDelete={canReorderOrDelete && !b.isFallback}
                  onToggle={() => {
                    if (b.isFallback) {
                      onFocusBranchPath?.(b.id);
                      return;
                    }
                    const next = expandedId === b.id ? null : b.id;
                    setExpandedId(next);
                    onFocusBranchPath?.(next);
                  }}
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
            );
          })}
        </div>

        {basedOn !== 'percentage' && (
          <button type="button" className={styles.addLink} onClick={addBranch}>
            <span className="material-symbols-outlined">add</span>
            Add a branch
          </button>
        )}

        {basedOn !== 'percentage' && (
          <div className={`${styles.accordionList} ${styles.fallbackList}`}>
            {branches.map((b) => {
              const isFallbackBranch = !!b.isFallback
                || !!pathDetails[b.id]?.isFallback
                || LEGACY_FALLBACK_NAMES.has(pathDetails[b.id]?.branchName ?? b.name ?? '');
              if (!isFallbackBranch) return null;
              return (
                <div key={b.id} className={styles.accordionSlot} data-branch-path-id={b.id}>
                  <BranchAccordionItem
                    branch={{ ...b, isFallback: true }}
                    pathDetail={pathDetails[b.id] || {}}
                    expanded={false}
                    canReorder={false}
                    canDelete={false}
                    onToggle={() => onFocusBranchPath?.(b.id)}
                    onPathFieldChange={handlePathFieldChange}
                  />
                </div>
              );
            })}
          </div>
        )}

        {basedOn === 'percentage' && (
          <button type="button" className={styles.addLink} onClick={addBranch}>
            <span className="material-symbols-outlined">add</span>
            Add a branch
          </button>
        )}
      </div>
    </div>
  );
}
