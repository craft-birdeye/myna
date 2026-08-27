import React, { useState, useMemo, useEffect, useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import CloseIcon from '../../../Molecules/RHS/RHSHeader/icons/close.svg';
import { Tooltip } from '../../../../components/Tooltip/Tooltip';
import { DataTypeIcon } from '../../../Molecules/Inputs/VariableChip/VariableChip';
import {
  BASE_CATEGORIES,
  WORKFLOW_CATEGORIES,
  SAMPLE_COLOR,
  normalizeCategory,
  filterTrees,
  formatSample,
  countLeaves,
} from './fieldPickerData';
import styles from './FieldPickerModal.module.css';

const POPOVER_WIDTH = 672;
const POPOVER_MAX_HEIGHT = 560;
const DRAWER_GAP = 0;
const BASE_CATEGORY_IDS = new Set(BASE_CATEGORIES.map((c) => c.id));

const FIELDS_SUBTITLE =
  'Insert data fields to pull in real business or workflow details.';

/** Placeholder help article — swap for the real Fields docs URL when available. */
const FIELDS_LEARN_MORE_HREF =
  'https://help.birdeye.com/hc/en-us/articles/fields-in-workflows';

const WORKFLOW_SECTION_HEADING = 'Output fields from previous steps';

/**
 * Spacious body height for the docked Fields card: 3 base categories + section
 * heading + 5 workflow steps. A 6th step scrolls into view below this.
 */
const SPACIOUS_BODY_HEIGHT_PX = 460;
const SIDEBAR_VISIBLE_WORKFLOW_COUNT = 5;

function FieldChip({ name }) {
  return (
    <span className={styles.chip}>
      <span className={styles.chipSwatch} aria-hidden>
        <DataTypeIcon />
      </span>
      <span className={styles.chipLabel}>{name}</span>
    </span>
  );
}

/** Two-line sidebar label; full text in a tooltip only when clamped.
 *  Numbered workflow steps (`2. Action: …`) hang-indent so wrapped lines align under the type label. */
function CatLabel({ text }) {
  const ref = useRef(null);
  const [truncated, setTruncated] = useState(false);
  const numbered = String(text ?? '').match(/^(\d+\.)(.*)$/);
  const prefix = numbered?.[1] ?? null;
  const body = numbered?.[2] ?? text;

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const measure = () => {
      setTruncated(el.scrollHeight > el.clientHeight + 1);
    };
    measure();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
    ro?.observe(el);
    window.addEventListener('resize', measure);
    return () => {
      ro?.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [text]);

  return (
    <Tooltip
      content={text}
      variant="detail"
      side="top"
      disabled={!truncated}
      className={styles.catLabelWrap}
    >
      {prefix ? (
        <span className={styles.catLabelNumbered}>
          <span className={styles.catLabelPrefix}>{prefix}</span>
          <span ref={ref} className={styles.catLabelBody}>
            {body}
          </span>
        </span>
      ) : (
        <span ref={ref} className={styles.catLabel}>
          {text}
        </span>
      )}
    </Tooltip>
  );
}

function FieldLeaf({ field, onSelect }) {
  const sample = formatSample(field.sample, field.valueType);
  return (
    <button
      type="button"
      className={styles.fieldRow}
      onClick={() => onSelect?.(field.value, field.name)}
      aria-label={`Insert ${field.name}`}
    >
      <FieldChip name={field.name} />
      <span
        className={styles.sample}
        style={{ color: SAMPLE_COLOR[field.valueType] ?? '#555' }}
        title={sample}
      >
        {sample}
      </span>
    </button>
  );
}

function TreeBranch({ node, onSelect, depth = 0, allowCollapse = true }) {
  const [open, setOpen] = useState(true);
  const isGroup = node.type === 'group';
  const isObject = node.type === 'object';
  const kids = node.children || [];
  const propertyCount = node.propertyCount ?? kids.length;
  const showCount = isObject || (isGroup && node.showPropertyCount);
  /** Only leaf fields under this node — no nested groups/objects. */
  const isSingleLevel = kids.length > 0 && kids.every((child) => child.type === 'field');

  if (node.type === 'field') {
    return <FieldLeaf field={node} onSelect={onSelect} />;
  }

  const label = isGroup ? node.label : node.name;

  // No accordion when: flat catalogs, or a lone root section with only leaf fields.
  const skipAccordion = isSingleLevel && (node.flat || (depth === 0 && !allowCollapse));

  if (skipAccordion) {
    const showStaticTitle = !node.flat && depth === 0;
    return (
      <div className={styles.treeBranch}>
        {showStaticTitle && (
          <div className={styles.treeHeader}>
            {isObject ? (
              <FieldChip name={label} />
            ) : (
              <span className={styles.treeGroupLabel}>{label}</span>
            )}
            {showCount && (
              <span className={styles.treePropCount}>{`{ ${propertyCount} properties }`}</span>
            )}
          </div>
        )}
        <div className={node.flat ? styles.treeFlatList : styles.treeChildrenSingle}>
          {kids.map((child) => (
            <FieldLeaf
              key={child.id || child.value || child.name}
              field={child}
              onSelect={onSelect}
            />
          ))}
        </div>
      </div>
    );
  }

  // Multiple root sections (e.g. Action outputs + Tool) or nested trees — collapsible.
  return (
    <div className={styles.treeBranch}>
      <button
        type="button"
        className={styles.treeToggle}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span
          className={`material-symbols-outlined ${styles.treeChevron}`}
          aria-hidden
        >
          {open ? 'expand_more' : 'chevron_right'}
        </span>
        {isObject ? (
          <FieldChip name={label} />
        ) : (
          <span className={styles.treeGroupLabel}>{label}</span>
        )}
        {showCount && (
          <span className={styles.treePropCount}>{`{ ${propertyCount} properties }`}</span>
        )}
      </button>
      {open && kids.length > 0 && (
        <div className={depth > 0 ? styles.treeChildrenNested : styles.treeChildren}>
          {kids.map((child) => (
            <TreeBranch
              key={child.id || child.value || child.name}
              node={child}
              onSelect={onSelect}
              depth={depth + 1}
              allowCollapse
            />
          ))}
        </div>
      )}
    </div>
  );
}

/** Panels the picker docks to the left of — slide-in drawers and the workflow node-config RHS. */
const PANEL_SELECTOR = 'aside, .agent-builder__rhs';

function computeDockPosition(anchorEl) {
  const margin = 12;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const panelEl = anchorEl?.closest ? anchorEl.closest(PANEL_SELECTOR) : null;
  const anchorRect = anchorEl?.getBoundingClientRect ? anchorEl.getBoundingClientRect() : null;

  if (panelEl) {
    const panelRect = panelEl.getBoundingClientRect();
    const availableWidth = Math.max(320, panelRect.left - DRAWER_GAP - margin);
    const width = Math.min(POPOVER_WIDTH, availableWidth);
    const left = Math.max(margin, panelRect.left - DRAWER_GAP - width);
    // Match the spacious 5-step Fields card — do not shrink to the RHS panel height.
    const maxHeight = Math.min(POPOVER_MAX_HEIGHT, vh - margin * 2);
    const idealTop = panelRect.top;
    const top = Math.min(Math.max(margin, idealTop), Math.max(margin, vh - maxHeight - margin));
    return { top, left, width, maxHeight };
  }

  const width = Math.min(POPOVER_WIDTH, vw - margin * 2);
  const maxHeight = Math.min(POPOVER_MAX_HEIGHT, vh - margin * 2);

  let top = (anchorRect?.top ?? vh / 2) - maxHeight - margin;
  let left = anchorRect?.left ?? margin;

  if (top < margin) {
    top = (anchorRect?.bottom ?? margin) + margin;
  }
  if (top + maxHeight > vh - margin) {
    top = Math.max(margin, vh - maxHeight - margin);
  }

  left = Math.min(left, vw - width - margin);
  left = Math.max(margin, left);

  return { top, left, width, maxHeight };
}

function computeDropdownPosition(anchorEl) {
  const margin = 8;
  const gap = 4;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const anchorRect = anchorEl?.getBoundingClientRect?.() ?? null;
  const anchorWidth = anchorRect?.width ?? 0;
  // Full-width field triggers (e.g. Add input field → Field value): match width
  // so the picker reads as a dropdown under the control. Icon-only triggers keep
  // the wider default popover.
  const width = anchorWidth >= 280
    ? Math.min(Math.max(anchorWidth, 280), vw - margin * 2)
    : Math.min(POPOVER_WIDTH, vw - margin * 2);
  const maxHeight = Math.min(POPOVER_MAX_HEIGHT, vh - margin * 2);

  let left = anchorRect?.left ?? margin;
  // Prefer left-align with the field; if it overflows the viewport, shift left.
  if (left + width > vw - margin) {
    left = Math.max(margin, vw - width - margin);
  }
  left = Math.max(margin, left);

  const spaceBelow = vh - (anchorRect?.bottom ?? 0) - margin;
  const spaceAbove = (anchorRect?.top ?? 0) - margin;
  const openBelow = spaceBelow >= Math.min(maxHeight, 280) || spaceBelow >= spaceAbove;

  let top;
  let height = maxHeight;
  if (openBelow) {
    top = (anchorRect?.bottom ?? margin) + gap;
    height = Math.min(maxHeight, Math.max(240, spaceBelow - gap));
  } else {
    height = Math.min(maxHeight, Math.max(240, spaceAbove - gap));
    top = Math.max(margin, (anchorRect?.top ?? height) - height - gap);
  }

  return { top, left, width, maxHeight: height };
}

function computePosition(anchorEl, placement = 'dock') {
  return placement === 'dropdown'
    ? computeDropdownPosition(anchorEl)
    : computeDockPosition(anchorEl);
}

/**
 * Contextual Fields picker — docks to the left of the nearest drawer, or opens as a
 * dropdown under the trigger. Nested trees match workflow task/tool output shapes.
 */
export default function FieldPickerModal({
  onClose,
  onSelectField,
  anchorEl = null,
  overlayZIndex = 120,
  /** Workflow canvas / tool drawers — include trigger + task output trees. */
  showTriggerFields = false,
  /** `dock` = left of enclosing panel; `dropdown` = under the trigger. */
  placement = 'dock',
}) {
  const [search, setSearch] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('business');
  const [searchSelectedId, setSearchSelectedId] = useState(null);
  const [pos, setPos] = useState(() => computePosition(anchorEl, placement));
  const [userMoved, setUserMoved] = useState(false);
  const rootRef = useRef(null);
  const dragRef = useRef(null);

  const categories = useMemo(() => {
    const base = BASE_CATEGORIES.map(normalizeCategory);
    if (!showTriggerFields) return base;
    return [...base, ...WORKFLOW_CATEGORIES.map(normalizeCategory)];
  }, [showTriggerFields]);

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId) ?? categories[0];
  const query = search.trim();
  const isSearching = query.length > 0;

  const matchingCategories = useMemo(() => {
    if (!isSearching) return [];
    return categories
      .map((cat) => {
        const trees = filterTrees(cat.trees, query);
        return {
          ...cat,
          trees,
          count: countLeaves(trees),
        };
      })
      .filter((cat) => cat.count > 0);
  }, [categories, isSearching, query]);

  const activeContentCategory = useMemo(() => {
    if (isSearching) {
      if (!searchSelectedId) return null;
      return matchingCategories.find((c) => c.id === searchSelectedId) ?? null;
    }
    return selectedCategory;
  }, [isSearching, searchSelectedId, matchingCategories, selectedCategory]);

  const contentHeading = (
    activeContentCategory
    && BASE_CATEGORY_IDS.has(activeContentCategory.id)
    && activeContentCategory.contentHeading
  ) || null;

  const visibleTrees = useMemo(() => {
    if (!isSearching) return selectedCategory?.trees ?? [];
    if (searchSelectedId) {
      return matchingCategories.find((c) => c.id === searchSelectedId)?.trees ?? [];
    }
    // Stack every matching category's trees while searching.
    return matchingCategories.flatMap((cat) => cat.trees);
  }, [isSearching, selectedCategory, matchingCategories, searchSelectedId]);

  const sidebarCategories = useMemo(
    () => (isSearching ? matchingCategories : categories),
    [categories, matchingCategories, isSearching],
  );

  const baseSidebarCategories = useMemo(
    () => sidebarCategories.filter((cat) => BASE_CATEGORY_IDS.has(cat.id)),
    [sidebarCategories],
  );

  const workflowSidebarCategories = useMemo(
    () => sidebarCategories.filter((cat) => !BASE_CATEGORY_IDS.has(cat.id)),
    [sidebarCategories],
  );

  const clipSidebarToFiveSteps =
    showTriggerFields
    && !isSearching
    && workflowSidebarCategories.length > SIDEBAR_VISIBLE_WORKFLOW_COUNT;

  const renderCategoryButton = (cat) => {
    const isSelected = isSearching
      ? cat.id === searchSelectedId
      : cat.id === selectedCategoryId;
    return (
      <button
        key={cat.id}
        type="button"
        className={`${styles.catBtn}${isSelected ? ` ${styles.catBtnSelected}` : ''}`}
        onClick={() => {
          if (isSearching) setSearchSelectedId((prev) => (prev === cat.id ? null : cat.id));
          else setSelectedCategoryId(cat.id);
        }}
      >
        <CatLabel text={cat.label} />
        <span className={styles.catMeta}>
          <span className={styles.catCount}>{cat.count}</span>
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 16, color: '#8f8f8f', fontVariationSettings: "'FILL' 0, 'wght' 300" }}
          >
            chevron_right
          </span>
        </span>
      </button>
    );
  };

  const handleSearchChange = (value) => {
    setSearch(value);
    setSearchSelectedId(null);
  };

  const clearSearch = () => {
    setSearch('');
    setSearchSelectedId(null);
  };

  const handleSelect = (value, name) => {
    onSelectField?.(value, name);
  };

  useEffect(() => {
    if (!showTriggerFields && WORKFLOW_CATEGORIES.some((c) => c.id === selectedCategoryId)) {
      setSelectedCategoryId('business');
    }
  }, [showTriggerFields, selectedCategoryId]);

  useLayoutEffect(() => {
    if (userMoved) return;
    setPos(computePosition(anchorEl, placement));
  }, [anchorEl, placement, userMoved]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    const onDown = (e) => {
      if (dragRef.current) return;
      if (rootRef.current && !rootRef.current.contains(e.target)) onClose();
    };
    const reposition = () => {
      if (userMoved) {
        setPos((prev) => {
          const next = computePosition(anchorEl, placement);
          const margin = 12;
          const vw = window.innerWidth;
          const vh = window.innerHeight;
          const width = next.width;
          const maxHeight = next.maxHeight;
          const top = Math.min(Math.max(margin, prev.top), Math.max(margin, vh - maxHeight - margin));
          const left = Math.min(Math.max(margin, prev.left), Math.max(margin, vw - width - margin));
          return { top, left, width, maxHeight };
        });
        return;
      }
      setPos(computePosition(anchorEl, placement));
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onDown);
    window.addEventListener('resize', reposition);
    document.addEventListener('scroll', reposition, true);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onDown);
      window.removeEventListener('resize', reposition);
      document.removeEventListener('scroll', reposition, true);
    };
  }, [onClose, anchorEl, placement, userMoved]);

  const clampPos = (top, left, width, maxHeight) => {
    const margin = 12;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    return {
      top: Math.min(Math.max(margin, top), Math.max(margin, vh - maxHeight - margin)),
      left: Math.min(Math.max(margin, left), Math.max(margin, vw - width - margin)),
      width,
      maxHeight,
    };
  };

  const handleDragPointerDown = (e) => {
    if (e.button !== 0) return;
    if (e.target.closest('a, button, input, textarea, select, [role="button"]')) return;
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    const startTop = pos.top;
    const startLeft = pos.left;
    dragRef.current = { startX, startY, startTop, startLeft };
    setUserMoved(true);

    const onMove = (ev) => {
      const drag = dragRef.current;
      if (!drag) return;
      const nextTop = drag.startTop + (ev.clientY - drag.startY);
      const nextLeft = drag.startLeft + (ev.clientX - drag.startX);
      setPos((prev) => clampPos(nextTop, nextLeft, prev.width, prev.maxHeight));
    };

    const onUp = () => {
      dragRef.current = null;
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
      document.body.style.removeProperty('user-select');
      document.body.style.removeProperty('cursor');
    };

    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'grabbing';
    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
  };

  return createPortal(
    <div
      ref={rootRef}
      className={`${styles.popover}${placement === 'dropdown' ? ` ${styles.popoverDropdown}` : ''}`}
      style={{
        top: pos.top,
        left: pos.left,
        width: pos.width,
        // Spacious 5-step card: don't let the dock/RHS maxHeight crop the list.
        maxHeight: clipSidebarToFiveSteps ? undefined : pos.maxHeight,
        zIndex: overlayZIndex,
      }}
      role="dialog"
      aria-label="Fields"
    >
      <div
        className={styles.header}
        onPointerDown={handleDragPointerDown}
        role="presentation"
      >
        <div className={styles.titleBlock}>
          <span className={styles.title}>Fields</span>
          <span className={styles.subtitle}>
            {FIELDS_SUBTITLE}{' '}
            <a
              href={FIELDS_LEARN_MORE_HREF}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.learnMore}
              onClick={(e) => e.stopPropagation()}
            >
              Learn more
            </a>
          </span>
        </div>
        <button type="button" onClick={onClose} className={styles.closeBtn} aria-label="Close">
          <img src={CloseIcon} alt="" width={24} height={24} />
        </button>
      </div>

      <div className={styles.searchRow}>
        <div className={styles.search}>
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 18, color: '#8f8f8f', flexShrink: 0, fontVariationSettings: "'FILL' 0, 'wght' 300" }}
          >
            search
          </span>
          <input
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search"
            className={styles.searchInput}
            aria-label="Search fields"
          />
          {isSearching && (
            <button
              type="button"
              onClick={clearSearch}
              className={styles.searchClear}
              aria-label="Clear search"
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 18, fontVariationSettings: "'FILL' 0, 'wght' 300" }}
              >
                close
              </span>
            </button>
          )}
        </div>
      </div>

      <div
        className={`${styles.body}${clipSidebarToFiveSteps ? ` ${styles.bodySpacious}` : ''}`}
        style={clipSidebarToFiveSteps ? { height: SPACIOUS_BODY_HEIGHT_PX } : undefined}
      >
        <div
          className={`${styles.sidebar}${clipSidebarToFiveSteps ? ` ${styles.sidebarScrollable}` : ''}`}
        >
          {baseSidebarCategories.map(renderCategoryButton)}
          {workflowSidebarCategories.length > 0 && (
            <>
              <div className={styles.sidebarSectionHeading}>
                {WORKFLOW_SECTION_HEADING}
              </div>
              {workflowSidebarCategories.map(renderCategoryButton)}
            </>
          )}
        </div>

        <div className={styles.content}>
          <div className={styles.card}>
            {visibleTrees.length === 0 ? (
              <span className={styles.empty}>{`No fields match "${query}"`}</span>
            ) : (
              <>
                {contentHeading && (
                  <h3 className={styles.contentHeading}>{contentHeading}</h3>
                )}
                <div className={styles.treeList}>
                  {visibleTrees.map((node) => {
                    const kids = node.children || [];
                    const isSingleLevel = kids.length > 0 && kids.every((child) => child.type === 'field');
                    // Accordion only when more than one root section exists (or the node nests further).
                    const allowCollapse = visibleTrees.length > 1 || !isSingleLevel;
                    return (
                      <TreeBranch
                        key={node.id || node.value || node.name || node.label}
                        node={node}
                        onSelect={handleSelect}
                        allowCollapse={allowCollapse}
                      />
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
