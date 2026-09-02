import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '../../../components/Icon/Icon';
import { Tooltip } from '../../../components/Tooltip/Tooltip';
import VariableChip from '../Inputs/VariableChip/VariableChip';
import { operatorNeedsValue } from '../../constants/conditionOperators';
import './Conditions.css';
import styles from './Conditions.module.css';

const MENU_Z_INDEX = 5200;
const MENU_MAX_HEIGHT = 240;

function buildFixedMenuStyle(triggerEl, optionCount, zIndex = MENU_Z_INDEX) {
  if (!triggerEl) return null;
  const rect = triggerEl.getBoundingClientRect();
  const estimatedHeight = Math.min(optionCount * 36 + 8, MENU_MAX_HEIGHT);
  const spaceBelow = window.innerHeight - rect.bottom - 8;
  const spaceAbove = rect.top - 8;
  const openUp = spaceBelow < estimatedHeight && spaceAbove > spaceBelow;

  return {
    position: 'fixed',
    left: rect.left,
    width: rect.width,
    zIndex,
    ...(openUp
      ? { bottom: window.innerHeight - rect.top + 4, maxHeight: Math.min(MENU_MAX_HEIGHT, spaceAbove) }
      : { top: rect.bottom + 4, maxHeight: Math.min(MENU_MAX_HEIGHT, spaceBelow) }),
  };
}

function Dropdown({
  name,
  selected,
  options,
  onChange,
  placeholder = 'Select',
  onOptionsChange,
  valueAsChip = false,
  disabled = false,
}) {
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editorStyle, setEditorStyle] = useState(null);
  const [draftOptions, setDraftOptions] = useState([]);
  const ref = useRef(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const editorRef = useRef(null);

  useEffect(() => {
    if (!open && !editMode) return undefined;
    const close = (e) => {
      const t = e.target;
      if (
        ref.current?.contains(t)
        || menuRef.current?.contains(t)
        || editorRef.current?.contains(t)
      ) {
        return;
      }
      setOpen(false);
      setEditMode(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open, editMode]);

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return undefined;

    const updatePlacement = () => {
      setMenuStyle(buildFixedMenuStyle(triggerRef.current, options.length));
    };

    updatePlacement();
    window.addEventListener('resize', updatePlacement);
    window.addEventListener('scroll', updatePlacement, true);
    return () => {
      window.removeEventListener('resize', updatePlacement);
      window.removeEventListener('scroll', updatePlacement, true);
    };
  }, [open, options.length]);

  useLayoutEffect(() => {
    if (!editMode || !triggerRef.current) return undefined;

    const updatePlacement = () => {
      setEditorStyle({
        ...buildFixedMenuStyle(triggerRef.current, Math.max(draftOptions.length, 3), MENU_Z_INDEX),
        right: 'auto',
      });
    };

    updatePlacement();
    window.addEventListener('resize', updatePlacement);
    window.addEventListener('scroll', updatePlacement, true);
    return () => {
      window.removeEventListener('resize', updatePlacement);
      window.removeEventListener('scroll', updatePlacement, true);
    };
  }, [editMode, draftOptions.length]);

  const selectedLabel = options.find((o) => o.value === selected)?.label;

  const handleEditClick = (e) => {
    e.stopPropagation();
    setOpen(false);
    setDraftOptions(options.map((o) => ({ ...o })));
    setEditMode(true);
  };

  const updateDraftLabel = (index, label) => {
    setDraftOptions((prev) => prev.map((o, i) => (i === index ? { ...o, label } : o)));
  };

  const removeDraftOption = (index) => {
    setDraftOptions((prev) => prev.filter((_, i) => i !== index));
  };

  const addDraftOption = () => {
    setDraftOptions((prev) => [...prev, { value: `opt_${Date.now()}`, label: '' }]);
  };

  const applyOptions = () => {
    const cleaned = draftOptions
      .filter((o) => o.label.trim())
      .map((o) => ({
        value: o.value || o.label.toLowerCase().replace(/\s+/g, '_'),
        label: o.label.trim(),
      }));
    onOptionsChange?.(cleaned);
    setEditMode(false);
  };

  const menu = open && menuStyle
    ? createPortal(
      <ul
        ref={menuRef}
        className="tc-dropdown__menu tc-dropdown__menu--portaled"
        style={menuStyle}
        role="listbox"
        data-dropdown-name={name}
      >
        {options.map((opt) => (
          <li
            key={opt.value}
            role="option"
            aria-selected={opt.value === selected}
            className={`tc-dropdown__option${opt.value === selected ? ' tc-dropdown__option--selected' : ''}`}
            onClick={() => { onChange(opt); setOpen(false); }}
          >
            {opt.label}
            {opt.value === selected && (
              <span className="material-symbols-outlined tc-dropdown__check">check</span>
            )}
          </li>
        ))}
      </ul>,
      document.body,
    )
    : null;

  const editor = editMode && editorStyle
    ? createPortal(
      <div ref={editorRef} className={styles.optionsEditor} style={editorStyle}>
        <div className={styles.optionsEditorList}>
          {draftOptions.map((opt, i) => (
            <div key={opt.value || i} className={styles.optionRow}>
              <input
                className={styles.optionInput}
                value={opt.label}
                placeholder="Option label"
                onChange={(e) => updateDraftLabel(i, e.target.value)}
              />
              <button
                type="button"
                className={styles.optionRemoveBtn}
                onClick={() => removeDraftOption(i)}
              >
                <span className={`material-symbols-outlined ${styles.optionRemoveBtnIcon}`}>close</span>
              </button>
            </div>
          ))}
        </div>
        <div className={styles.editorFooter}>
          <button type="button" className={styles.addOptionBtn} onClick={addDraftOption}>
            <span className={`material-symbols-outlined ${styles.addOptionIcon}`}>add</span>
            Add option
          </button>
          <button type="button" className={styles.applyBtn} onClick={applyOptions}>
            <span className={`material-symbols-outlined ${styles.applyBtnIcon}`}>check</span>
          </button>
        </div>
      </div>,
      document.body,
    )
    : null;

  return (
    <div className={styles.dropdownOuter} ref={ref}>
      <div className="tc-dropdown">
        <button
          ref={triggerRef}
          type="button"
          className={`tc-dropdown__trigger${open ? ' tc-dropdown__trigger--open' : ''}${disabled ? ' tc-dropdown__trigger--readonly' : ''} ${styles.dropdownTrigger}`}
          onClick={() => {
            if (disabled || editMode) return;
            setOpen((wasOpen) => !wasOpen);
          }}
          aria-haspopup="listbox"
          aria-expanded={open}
          disabled={disabled}
        >
          {valueAsChip && selectedLabel ? (
            <span className={styles.chipValue}>
              <VariableChip
                value={selectedLabel}
                type="variable"
                onDelete={disabled ? undefined : () => onChange({ value: '', label: '' })}
              />
            </span>
          ) : (
            <span className={`tc-dropdown__value${!selectedLabel ? ' tc-dropdown__value--placeholder' : ''}`}>
              {selectedLabel || placeholder}
            </span>
          )}
          {onOptionsChange && !disabled && (
            <span
              className={styles.editTrigger}
              role="button"
              tabIndex={0}
              aria-label="Edit options"
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleEditClick(e);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  e.stopPropagation();
                  handleEditClick(e);
                }
              }}
            >
              <span className={`material-symbols-outlined ${styles.editTriggerIcon}`}>edit</span>
            </span>
          )}
          <span className="material-symbols-outlined tc-dropdown__chevron">expand_more</span>
        </button>
        {menu}
        {editor}
      </div>
    </div>
  );
}

function LogicConnector({ value, onChange, disabled = false }) {
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState(null);
  const ref = useRef(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const close = (e) => {
      if (ref.current?.contains(e.target) || menuRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return undefined;
    const updatePlacement = () => {
      const rect = triggerRef.current.getBoundingClientRect();
      setMenuStyle({
        position: 'fixed',
        left: rect.left,
        top: rect.bottom + 4,
        zIndex: MENU_Z_INDEX,
        minWidth: Math.max(rect.width, 120),
      });
    };
    updatePlacement();
    window.addEventListener('resize', updatePlacement);
    window.addEventListener('scroll', updatePlacement, true);
    return () => {
      window.removeEventListener('resize', updatePlacement);
      window.removeEventListener('scroll', updatePlacement, true);
    };
  }, [open]);

  const menu = open && menuStyle
    ? createPortal(
      <ul ref={menuRef} className="tc-connector__menu tc-connector__menu--portaled" style={menuStyle}>
        {['AND', 'OR'].map((opt) => (
          <li
            key={opt}
            className={`tc-connector__option${value === opt ? ' tc-connector__option--selected' : ''}`}
            onClick={() => { onChange(opt); setOpen(false); }}
          >
            <span>{opt}</span>
            {value === opt && <span className="material-symbols-outlined">check</span>}
          </li>
        ))}
      </ul>,
      document.body,
    )
    : null;

  return (
    <div className="tc-connector" ref={ref}>
      <button
        ref={triggerRef}
        type="button"
        className={`tc-connector__btn${disabled ? ' tc-connector__btn--disabled' : ''}`}
        onClick={() => { if (!disabled) setOpen((v) => !v); }}
        disabled={disabled}
      >
        <span>{value}</span>
        <span className="material-symbols-outlined">expand_more</span>
      </button>
      {menu}
    </div>
  );
}

function AddConditionButton({ onAddCondition, onAddConditionGroup, disabled = false }) {
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState(null);
  const wrapRef = useRef(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const showGroup = typeof onAddConditionGroup === 'function';

  useEffect(() => {
    if (!open || disabled) return undefined;
    const close = (e) => {
      if (wrapRef.current?.contains(e.target) || menuRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open, disabled]);

  useLayoutEffect(() => {
    if (!open || disabled || !triggerRef.current) return undefined;
    const updatePlacement = () => {
      const rect = triggerRef.current.getBoundingClientRect();
      setMenuStyle({
        position: 'fixed',
        left: rect.left,
        top: rect.bottom + 4,
        zIndex: MENU_Z_INDEX,
        minWidth: Math.max(rect.width, 200),
      });
    };
    updatePlacement();
    window.addEventListener('resize', updatePlacement);
    window.addEventListener('scroll', updatePlacement, true);
    return () => {
      window.removeEventListener('resize', updatePlacement);
      window.removeEventListener('scroll', updatePlacement, true);
    };
  }, [open, disabled]);

  if (disabled) {
    return (
      <div className="tc-add-wrap">
        <button
          type="button"
          className="trigger-conditions__add-btn trigger-conditions__add-btn--disabled"
          disabled
        >
          <span className="material-symbols-outlined">add_circle</span>
          Add condition
        </button>
      </div>
    );
  }

  const pick = (action) => {
    setOpen(false);
    action?.();
  };

  const menu = open && menuStyle
    ? createPortal(
      <div
        ref={menuRef}
        className="tc-add-menu"
        style={menuStyle}
        role="menu"
      >
        <button
          type="button"
          className="tc-add-menu__item"
          role="menuitem"
          onClick={() => pick(onAddCondition)}
        >
          <span className="material-symbols-outlined">add</span>
          Add condition
        </button>
        {showGroup ? (
          <button
            type="button"
            className="tc-add-menu__item"
            role="menuitem"
            onClick={() => pick(onAddConditionGroup)}
          >
            <span className="material-symbols-outlined">account_tree</span>
            Add condition group
          </button>
        ) : null}
      </div>,
      document.body,
    )
    : null;

  return (
    <div className="tc-add-wrap" ref={wrapRef}>
      <button
        ref={triggerRef}
        type="button"
        className="trigger-conditions__add-btn"
        onClick={() => {
          if (!showGroup) {
            onAddCondition?.();
            return;
          }
          setOpen((v) => !v);
        }}
        aria-haspopup={showGroup ? 'menu' : undefined}
        aria-expanded={showGroup ? open : undefined}
      >
        <span className="material-symbols-outlined">add_circle</span>
        Add condition
        {showGroup ? (
          <span className="material-symbols-outlined trigger-conditions__add-chevron">expand_more</span>
        ) : null}
      </button>
      {menu}
    </div>
  );
}

export default function Conditions({
  conditions = [],
  logic = 'OR',
  onConditionChange,
  onLogicChange,
  onConnectorChange,
  onAddCondition,
  onAddConditionGroup,
  onRemoveCondition,
  onAdvancedFilters,
  conditionOptions,
  onOptionsChange,
  label = 'Conditions',
  labelHelp,
  labelHelpLearnMoreHref,
  labelHelpLearnMoreLabel,
  showAdvancedFilters = true,
  disabled = false,
}) {
  return (
    <div className="trigger-conditions">
      <div className="trigger-conditions__section">
        {(label || labelHelp) ? (
          <div className="trigger-conditions__label-row">
            {label ? <span className="trigger-conditions__label">{label}</span> : null}
            {labelHelp ? (
              <Tooltip
                content={
                  labelHelpLearnMoreHref ? (
                    <span className="flex flex-col gap-xs">
                      <span>{labelHelp}</span>
                      <a
                        href={labelHelpLearnMoreHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-white no-underline hover:text-white hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {labelHelpLearnMoreLabel ?? 'Learn more'}
                      </a>
                    </span>
                  ) : (
                    labelHelp
                  )
                }
                variant="detail"
                interactive={Boolean(labelHelpLearnMoreHref)}
              >
                <button
                  type="button"
                  className="trigger-conditions__label-help"
                  aria-label="Help"
                >
                  <Icon name="help" size={16} />
                </button>
              </Tooltip>
            ) : null}
          </div>
        ) : null}
        <div className={`trigger-conditions__card${disabled ? ' trigger-conditions__card--disabled' : ''}`}>
          <div className="trigger-conditions__conditions">
            {conditions.map((condition, index) => {
              const fieldOpts = conditionOptions?.field ?? condition.fieldOptions ?? [];
              const operatorOpts = conditionOptions?.operator ?? condition.operatorOptions ?? [];
              const valueOpts = conditionOptions?.value ?? condition.valueOptions ?? [];
              // Indentation nests a condition under the previous one (Figma: nested AND/OR groups).
              // Falls back to 0 for plain flat condition lists used by other agents.
              const indent = condition.indent ?? 0;
              // Per-row connector lets sibling groups differ (AND within a group, OR between groups).
              // Falls back to the single shared `logic` prop for callers that haven't opted in yet.
              const connector = condition.connector ?? logic;
              const showValueField = operatorNeedsValue(condition.operatorValue);
              const canRemove = !disabled && conditions.length > 1 && Boolean(onRemoveCondition);

              const conditionHeader = (
                <div className={styles.conditionHeader}>
                  {index === 0 ? (
                    <span className={styles.whenLabel}>When</span>
                  ) : (
                    <LogicConnector
                      value={connector}
                      disabled={disabled}
                      onChange={(val) =>
                        onConnectorChange ? onConnectorChange(condition.id, val) : onLogicChange?.(val)
                      }
                    />
                  )}
                  {canRemove ? (
                    <button
                      type="button"
                      className={styles.removeBtn}
                      onClick={() => onRemoveCondition(condition.id)}
                      title="Remove condition"
                    >
                      <span className={`material-symbols-outlined ${styles.removeBtnIcon}`}>delete</span>
                    </button>
                  ) : null}
                </div>
              );

              const conditionFields = (
                <div className={styles.conditionDropdowns}>
                  <Dropdown
                    name={`field-${condition.id}`}
                    selected={condition.fieldValue}
                    options={fieldOpts}
                    valueAsChip
                    placeholder="Select"
                    disabled={disabled}
                    onChange={(opt) => onConditionChange?.(condition.id, 'field', opt.value)}
                    onOptionsChange={onOptionsChange ? (opts) => onOptionsChange('field', opts) : undefined}
                  />
                  <Dropdown
                    name={`operator-${condition.id}`}
                    selected={condition.operatorValue}
                    options={operatorOpts}
                    placeholder="Select"
                    disabled={disabled}
                    onChange={(opt) => {
                      onConditionChange?.(condition.id, 'operator', opt.value);
                      if (!operatorNeedsValue(opt.value)) {
                        onConditionChange?.(condition.id, 'value', '');
                      }
                    }}
                    onOptionsChange={onOptionsChange ? (opts) => onOptionsChange('operator', opts) : undefined}
                  />
                  {showValueField ? (
                    <Dropdown
                      name={`value-${condition.id}`}
                      selected={condition.valueValue}
                      options={valueOpts}
                      placeholder="Select"
                      disabled={disabled}
                      onChange={(opt) => onConditionChange?.(condition.id, 'value', opt.value)}
                      onOptionsChange={onOptionsChange ? (opts) => onOptionsChange('value', opts) : undefined}
                    />
                  ) : null}
                </div>
              );

              // Wrap each condition in `indent` nested left-border guides,
              // so consecutive conditions at deeper levels read as visually grouped.
              let body = (
                <div className="trigger-conditions__condition">
                  {conditionHeader}
                  {conditionFields}
                </div>
              );
              for (let i = 0; i < indent; i++) {
                body = <div className={styles.indentWrap}>{body}</div>;
              }

              return (
                <React.Fragment key={condition.id}>
                  {body}
                </React.Fragment>
              );
            })}
          </div>
          <AddConditionButton
            onAddCondition={onAddCondition}
            onAddConditionGroup={onAddConditionGroup}
            disabled={disabled}
          />
        </div>
      </div>
      {showAdvancedFilters && !disabled && (
        <button type="button" className="trigger-conditions__advanced-filters" onClick={onAdvancedFilters}>
          Advanced filters
        </button>
      )}
    </div>
  );
}
