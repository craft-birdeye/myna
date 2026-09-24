import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { AeroFormModal } from '../../../../components/AeroFormModal/AeroFormModal';
import { Icon } from '../../../../components/Icon/Icon';
import { VariableIcon } from '../../../Molecules/Inputs/PromptToolbarIcons.jsx';
import FieldPickerModal from '../FieldPickerModal/FieldPickerModal.jsx';
import { UPDATE_STATE_FIELD_CATEGORIES } from '../FieldPickerModal/fieldPickerData.js';

const STATE_FIELD_MODAL_SUBTITLE =
  'Define how this field\'s state should be updated.';

const LLM_EVALUATION = 'LLM Evaluation';

/** Value kinds shown in the Field type dropdown (menu header: Values). */
const FIELD_TYPE_OPTIONS = [
  'String',
  'Number',
  'True',
  'False',
  'Null',
  'Dynamic Variable',
  LLM_EVALUATION,
];

function mapValueTypeToFieldType(valueType) {
  switch (valueType) {
    case 'number':
      return 'Number';
    case 'boolean':
      return 'True';
    case 'string':
    default:
      return 'String';
  }
}

function FieldLabel({ children, required = false }) {
  return (
    <div className="flex items-center gap-xs">
      <span className="text-small text-text-primary">{children}</span>
      {required && <span className="text-small text-chip-danger-text">*</span>}
    </div>
  );
}

function FieldTypeDropdown({ value, onChange, menuZIndex = 2200 }) {
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return undefined;

    function updatePosition() {
      const rect = triggerRef.current.getBoundingClientRect();
      const menuMaxHeight = 320;
      const spaceBelow = window.innerHeight - rect.bottom - 8;
      const spaceAbove = rect.top - 8;
      const openUp = spaceBelow < menuMaxHeight && spaceAbove > spaceBelow;

      setMenuStyle({
        position: 'fixed',
        left: rect.left,
        width: rect.width,
        zIndex: menuZIndex,
        ...(openUp
          ? { bottom: window.innerHeight - rect.top + 4, maxHeight: Math.min(menuMaxHeight, spaceAbove) }
          : { top: rect.bottom + 4, maxHeight: Math.min(menuMaxHeight, spaceBelow) }),
      });
    }

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [open, menuZIndex]);

  useEffect(() => {
    if (!open) return undefined;
    function handleClickOutside(e) {
      const t = e.target;
      if (triggerRef.current?.contains(t) || menuRef.current?.contains(t)) return;
      setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const menu = open && menuStyle && createPortal(
    <div
      ref={menuRef}
      style={menuStyle}
      className="flex flex-col overflow-hidden rounded-sm border border-border bg-surface shadow-dropdown"
    >
      <div className="shrink-0 border-b border-border px-md py-sm">
        <span className="text-small text-text-secondary">Values</span>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto py-xs">
        {FIELD_TYPE_OPTIONS.map((opt) => {
          const selected = opt === value;
          return (
            <button
              key={opt}
              type="button"
              onClick={() => { onChange(opt); setOpen(false); }}
              className={`flex h-9 w-full items-center justify-between px-md text-left text-body text-text-primary hover:bg-surface-hover ${
                selected ? 'bg-surface-selected' : ''
              }`}
            >
              <span>{opt}</span>
              {selected && <Icon name="check" size={18} className="text-text-primary" />}
            </button>
          );
        })}
      </div>
    </div>,
    document.body,
  );

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 w-full items-center justify-between rounded-sm border border-border-input bg-surface px-md text-body text-text-primary hover:bg-surface-l2"
      >
        <span className={value ? 'text-text-primary' : 'text-text-tertiary'}>
          {value || 'Select field type'}
        </span>
        <Icon
          name="expand_more"
          size={20}
          className={`text-text-icon transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {menu}
    </div>
  );
}

/**
 * Add / edit a dynamic field for the Update state action.
 * Matches the Add output field modal chrome (AeroFormModal).
 *
 * Field type Values: String / Number / True / False / Null / Dynamic Variable /
 * LLM Evaluation. Only LLM Evaluation shows Instructions; all others show Field value.
 * Global availability is controlled on the Select fields section, not in this modal.
 */
export default function AddStateFieldModal({
  onClose,
  onAdd,
  /** Above CustomToolViewer / NativeDrawer (9999) so the form isn't trapped behind the drawer. */
  zIndex = 10050,
  initialValues = null,
}) {
  const isEdit = Boolean(initialValues?.variable);
  const [fieldName, setFieldName] = useState(initialValues?.variable ?? '');
  const [fieldType, setFieldType] = useState(initialValues?.fieldType ?? '');
  const [instructions, setInstructions] = useState(
    initialValues?.fieldType === LLM_EVALUATION ? (initialValues?.instructions ?? '') : '',
  );
  const [fieldValue, setFieldValue] = useState(
    initialValues?.fieldType === LLM_EVALUATION
      ? ''
      : (initialValues?.fieldValue ?? initialValues?.instructions ?? ''),
  );
  const [fieldPickerOpen, setFieldPickerOpen] = useState(false);
  const [valuePickerOpen, setValuePickerOpen] = useState(false);
  const fieldBoxRef = useRef(null);
  const valueBoxRef = useRef(null);

  const isLlmEvaluation = fieldType === LLM_EVALUATION;
  const valueComplete = isLlmEvaluation ? Boolean(instructions.trim()) : Boolean(fieldValue.trim());
  const canSubmit = Boolean(fieldName.trim()) && Boolean(fieldType) && valueComplete;

  function handleFieldTypeChange(next) {
    setFieldType(next);
    if (next === 'True' || next === 'False' || next === 'Null') {
      setFieldValue(next.toLowerCase());
    }
  }

  function handleAdd() {
    if (!canSubmit) return;
    onAdd({
      fieldName: fieldName.trim(),
      fieldType,
      description: isLlmEvaluation ? instructions.trim() : '',
      fieldValue: isLlmEvaluation ? '' : fieldValue.trim(),
    });
    onClose();
  }

  return (
    <>
      <AeroFormModal
        title="Update field"
        subtitle={STATE_FIELD_MODAL_SUBTITLE}
        onClose={onClose}
        onPrimary={handleAdd}
        primaryLabel={isEdit ? 'Save' : 'Add'}
        primaryDisabled={!canSubmit}
        zIndex={zIndex}
        widthClassName="w-[650px]"
        fitContent
      >
        <div className="flex flex-col gap-lg pb-md">
          <div className="flex flex-col gap-xs">
            <FieldLabel required>Add field</FieldLabel>
            <div
              ref={fieldBoxRef}
              className={`relative flex h-9 items-center rounded-sm border bg-surface pl-md pr-10 ${
                fieldPickerOpen ? 'border-primary' : 'border-border-input'
              }`}
            >
              <input
                type="text"
                value={fieldName}
                onChange={(e) => setFieldName(e.target.value)}
                placeholder="Enter a new field or select a variable"
                className="min-w-0 flex-1 bg-transparent text-body text-text-primary outline-none placeholder:text-text-tertiary"
                aria-label="Add field"
              />
              <button
                type="button"
                className="absolute right-sm top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-sm text-text-primary hover:bg-surface-hover"
                aria-label="Select variable"
                aria-expanded={fieldPickerOpen}
                onClick={() => {
                  setValuePickerOpen(false);
                  setFieldPickerOpen((o) => !o);
                }}
              >
                <VariableIcon />
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-xs">
            <FieldLabel required>Field type</FieldLabel>
            <FieldTypeDropdown value={fieldType} onChange={handleFieldTypeChange} menuZIndex={zIndex + 100} />
          </div>

          {isLlmEvaluation ? (
            <label className="flex flex-col gap-xs">
              <FieldLabel required>Instructions</FieldLabel>
              <textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="Add instructions or examples for how the agent should update this field"
                rows={3}
                className="w-full resize-none rounded-sm border border-border-input bg-surface px-md py-sm text-body text-text-primary outline-none placeholder:text-text-tertiary focus:border-primary"
              />
            </label>
          ) : (
            <div className="flex flex-col gap-xs">
              <FieldLabel required>Field value</FieldLabel>
              <div
                ref={valueBoxRef}
                className={`relative flex h-9 items-center rounded-sm border bg-surface pl-md ${
                  fieldType === 'Dynamic Variable' ? 'pr-10' : 'pr-md'
                } ${valuePickerOpen ? 'border-primary' : 'border-border-input'}`}
              >
                <input
                  type="text"
                  value={fieldValue}
                  onChange={(e) => setFieldValue(e.target.value)}
                  placeholder={
                    fieldType === 'Dynamic Variable'
                      ? 'Select a variable'
                      : 'Enter field value'
                  }
                  className="min-w-0 flex-1 bg-transparent text-body text-text-primary outline-none placeholder:text-text-tertiary"
                  aria-label="Field value"
                />
                {fieldType === 'Dynamic Variable' && (
                  <button
                    type="button"
                    className="absolute right-sm top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-sm text-text-primary hover:bg-surface-hover"
                    aria-label="Select variable"
                    aria-expanded={valuePickerOpen}
                    onClick={() => {
                      setFieldPickerOpen(false);
                      setValuePickerOpen((o) => !o);
                    }}
                  >
                    <VariableIcon />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </AeroFormModal>

      {fieldPickerOpen && (
        <FieldPickerModal
          onClose={() => setFieldPickerOpen(false)}
          onSelectField={(_value, name, field) => {
            setFieldName(name || _value || '');
            if (field?.valueType) {
              setFieldType(mapValueTypeToFieldType(field.valueType));
            }
            setFieldPickerOpen(false);
          }}
          anchorEl={fieldBoxRef.current}
          placement="dropdown"
          categories={UPDATE_STATE_FIELD_CATEGORIES}
          overlayZIndex={zIndex + 200}
          insertedText={fieldName ? `{{${fieldName}}}` : ''}
        />
      )}

      {valuePickerOpen && (
        <FieldPickerModal
          onClose={() => setValuePickerOpen(false)}
          onSelectField={(_value, name) => {
            setFieldValue(name || _value || '');
            setValuePickerOpen(false);
          }}
          anchorEl={valueBoxRef.current}
          placement="dropdown"
          categories={UPDATE_STATE_FIELD_CATEGORIES}
          overlayZIndex={zIndex + 200}
          insertedText={fieldValue ? `{{${fieldValue}}}` : ''}
        />
      )}
    </>
  );
}
