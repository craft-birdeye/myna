import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { Icon } from '../../../components/Icon/Icon';
import { Tooltip } from '../../../components/Tooltip/Tooltip';
import { operatorNeedsValue } from '../../constants/conditionOperators';
import './Conditions.css';
import styles from './Conditions.module.css';

function getScrollParent(el) {
  let node = el?.parentElement;
  while (node && node !== document.body) {
    const { overflowY, overflow } = window.getComputedStyle(node);
    if (/(auto|scroll|overlay)/.test(overflowY) || /(auto|scroll|overlay)/.test(overflow)) {
      return node;
    }
    node = node.parentElement;
  }
  return null;
}

function getRhsFooterTop(anchorEl) {
  let node = anchorEl;
  while (node && node !== document.body) {
    const next = node.nextElementSibling;
    if (next) {
      const saveBtn = next.querySelector('button');
      if (saveBtn && /save/i.test(saveBtn.textContent || '')) {
        return next.getBoundingClientRect().top;
      }
    }
    node = node.parentElement;
  }
  return null;
}

function getBoundaryBottom(anchorEl) {
  const footerTop = getRhsFooterTop(anchorEl);
  if (footerTop != null) return footerTop;
  const scrollParent = getScrollParent(anchorEl);
  return scrollParent?.getBoundingClientRect().bottom ?? window.innerHeight;
}

function shouldOpenMenuUp(anchorEl, menuHeight) {
  if (!anchorEl || !menuHeight) return false;
  const anchorRect = anchorEl.getBoundingClientRect();
  const scrollParent = getScrollParent(anchorEl);
  const boundaryTop = scrollParent?.getBoundingClientRect().top ?? 0;
  const boundaryBottom = getBoundaryBottom(anchorEl);
  const spaceBelow = boundaryBottom - anchorRect.bottom - 4;
  const spaceAbove = anchorRect.top - boundaryTop - 4;
  if (spaceBelow >= menuHeight) return false;
  if (spaceAbove >= menuHeight) return true;
  return spaceAbove > spaceBelow;
}

function estimateMenuHeight(optionCount, menuEl) {
  if (menuEl?.offsetHeight) return menuEl.offsetHeight;
  return Math.min(optionCount * 36 + 8, 240);
}

function Dropdown({ name, selected, options, onChange, placeholder = 'Select', onOptionsChange }) {
  const [open, setOpen] = useState(false);
  const [menuOpensUp, setMenuOpensUp] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [draftOptions, setDraftOptions] = useState([]);
  const ref = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    const close = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
        setEditMode(false);
      }
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  useLayoutEffect(() => {
    if (!open) return undefined;
    const trigger = ref.current?.querySelector('.tc-dropdown__trigger');
    if (!trigger) return undefined;

    const updatePlacement = () => {
      const menuHeight = estimateMenuHeight(options.length, menuRef.current);
      setMenuOpensUp(shouldOpenMenuUp(trigger, menuHeight));
    };

    updatePlacement();
    const raf = requestAnimationFrame(updatePlacement);
    window.addEventListener('resize', updatePlacement);
    window.addEventListener('scroll', updatePlacement, true);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', updatePlacement);
      window.removeEventListener('scroll', updatePlacement, true);
    };
  }, [open, options.length]);

  const selectedLabel = options.find((o) => o.value === selected)?.label;

  const handleEditClick = (e) => {
    e.stopPropagation();
    setOpen(false);
    setDraftOptions(options.map((o) => ({ ...o })));
    setEditMode(true);
  };

  const updateDraftLabel = (index, label) => {
    setDraftOptions((prev) => prev.map((o, i) => i === index ? { ...o, label } : o));
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

  return (
    <div className={styles.dropdownOuter} ref={ref}>
      <div className="tc-dropdown">
        <button
          type="button"
          className={`tc-dropdown__trigger${open ? ' tc-dropdown__trigger--open' : ''} ${styles.dropdownTrigger}`}
          onClick={() => {
            if (editMode) return;
            setOpen((wasOpen) => {
              if (wasOpen) return false;
              const trigger = ref.current?.querySelector('.tc-dropdown__trigger');
              const menuHeight = estimateMenuHeight(options.length, null);
              setMenuOpensUp(shouldOpenMenuUp(trigger, menuHeight));
              return true;
            });
          }}
          aria-haspopup="listbox"
          aria-expanded={open}
        >
          <span className={`tc-dropdown__value${!selectedLabel ? ' tc-dropdown__value--placeholder' : ''}`}>
            {selectedLabel || placeholder}
          </span>
          {onOptionsChange && (
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

        {open && (
          <ul
            ref={menuRef}
            className={`tc-dropdown__menu${menuOpensUp ? ' tc-dropdown__menu--up' : ''}`}
            role="listbox"
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
          </ul>
        )}

        {editMode && (
          <div className={styles.optionsEditor}>
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
          </div>
        )}
      </div>
    </div>
  );
}

function LogicConnector({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  return (
    <div className="tc-connector" ref={ref}>
      <button type="button" className="tc-connector__btn" onClick={() => setOpen((v) => !v)}>
        <span>{value}</span>
        <span className="material-symbols-outlined">expand_more</span>
      </button>
      {open && (
        <ul className="tc-connector__menu">
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
        </ul>
      )}
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
  onRemoveCondition,
  onAdvancedFilters,
  conditionOptions,
  onOptionsChange,
  label = 'Conditions',
  labelHelp,
  labelHelpLearnMoreHref,
  labelHelpLearnMoreLabel,
  showAdvancedFilters = true,
}) {
  return (
    <div className="trigger-conditions">
      <div className="trigger-conditions__section">
        <div className="trigger-conditions__label-row">
          <span className="trigger-conditions__label">{label}</span>
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
        <div className="trigger-conditions__card">
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
              const canRemove = conditions.length > 1 && onRemoveCondition;

              const conditionHeader = (
                <div className={styles.conditionHeader}>
                  {index === 0 ? (
                    <span className={styles.whenLabel}>When</span>
                  ) : (
                    <LogicConnector
                      value={connector}
                      onChange={(val) =>
                        onConnectorChange ? onConnectorChange(condition.id, val) : onLogicChange?.(val)
                      }
                    />
                  )}
                  {canRemove && index > 0 ? (
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
                    onChange={(opt) => onConditionChange?.(condition.id, 'field', opt.value)}
                    onOptionsChange={onOptionsChange ? (opts) => onOptionsChange('field', opts) : undefined}
                  />
                  <Dropdown
                    name={`operator-${condition.id}`}
                    selected={condition.operatorValue}
                    options={operatorOpts}
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
          <button type="button" className="trigger-conditions__add-btn" onClick={onAddCondition}>
            <span className="material-symbols-outlined">add_circle</span>
            Add condition
          </button>
        </div>
      </div>
      {showAdvancedFilters && (
        <button type="button" className="trigger-conditions__advanced-filters" onClick={onAdvancedFilters}>
          Advanced filters
        </button>
      )}
    </div>
  );
}
