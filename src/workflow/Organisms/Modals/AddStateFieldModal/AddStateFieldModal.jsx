import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { AeroFormModal } from '../../../../components/AeroFormModal/AeroFormModal';
import { Icon } from '../../../../components/Icon/Icon';
import { VariableIcon } from '../../../Molecules/Inputs/PromptToolbarIcons.jsx';
import FieldPickerModal from '../FieldPickerModal/FieldPickerModal.jsx';

const STATE_FIELD_MODAL_SUBTITLE =
  'Define how this field\'s state should be updated.';

const FIELD_TYPE_OPTIONS = [
  'Text', 'Number', 'Boolean', 'Email', 'Phone number',
  'URL', 'Object', 'Date and time', 'Time',
  'Category - Multi select', 'Category - Single select',
];

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
  const [search, setSearch] = useState('');
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

  const filtered = FIELD_TYPE_OPTIONS.filter((o) =>
    o.toLowerCase().includes(search.toLowerCase()),
  );

  const menu = open && menuStyle && createPortal(
    <div
      ref={menuRef}
      style={menuStyle}
      className="flex flex-col overflow-hidden rounded-sm border border-border bg-surface shadow-dropdown"
    >
      <div className="shrink-0 border-b border-border px-md py-sm">
        <span className="text-small text-text-secondary">Field type</span>
      </div>
      <div className="shrink-0 px-md py-sm">
        <div className="flex h-9 items-center gap-sm rounded-sm border border-border-input bg-surface px-md">
          <Icon name="search" size={18} className="text-text-icon" />
          <input
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search"
            className="min-w-0 flex-1 bg-transparent text-body text-text-primary outline-none placeholder:text-text-tertiary"
          />
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-md pb-sm">
        {filtered.map((opt) => {
          const selected = opt === value;
          return (
            <button
              key={opt}
              type="button"
              onClick={() => { onChange(opt); setOpen(false); setSearch(''); }}
              className={`flex h-9 w-full items-center justify-between rounded-sm px-md text-left text-body text-text-primary hover:bg-surface-hover ${
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
 */
export default function AddStateFieldModal({
  onClose,
  onAdd,
  zIndex = 2100,
  initialValues = null,
}) {
  const isEdit = Boolean(initialValues?.variable);
  const [fieldName, setFieldName] = useState(initialValues?.variable ?? '');
  const [fieldType, setFieldType] = useState(initialValues?.fieldType ?? '');
  const [instructions, setInstructions] = useState(initialValues?.instructions ?? '');
  const [fieldPickerOpen, setFieldPickerOpen] = useState(false);
  const fieldBoxRef = useRef(null);

  function handleAdd() {
    if (!fieldName.trim() || !fieldType || !instructions.trim()) return;
    onAdd({
      fieldName: fieldName.trim(),
      fieldType,
      description: instructions.trim(),
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
        primaryDisabled={!fieldName.trim() || !fieldType || !instructions.trim()}
        zIndex={zIndex}
        widthClassName="w-[650px]"
        fitContent
      >
        <div className="flex flex-col gap-lg pb-md">
          <div className="flex flex-col gap-xs">
            <FieldLabel required>Select field</FieldLabel>
            <div
              ref={fieldBoxRef}
              className={`relative flex h-9 items-center rounded-sm border bg-surface pl-md pr-10 ${
                fieldPickerOpen ? 'border-primary' : 'border-border-input'
              }`}
            >
              <span
                className={`min-w-0 flex-1 truncate text-body ${
                  fieldName ? 'text-text-primary' : 'text-text-tertiary'
                }`}
              >
                {fieldName || 'Variable to update'}
              </span>
              <button
                type="button"
                className="absolute right-sm top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-sm text-text-primary hover:bg-surface-hover"
                aria-label="Select field"
                aria-expanded={fieldPickerOpen}
                onClick={() => setFieldPickerOpen((o) => !o)}
              >
                <VariableIcon />
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-xs">
            <FieldLabel required>Field type</FieldLabel>
            <FieldTypeDropdown value={fieldType} onChange={setFieldType} menuZIndex={zIndex + 100} />
          </div>

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
        </div>
      </AeroFormModal>

      {fieldPickerOpen && (
        <FieldPickerModal
          onClose={() => setFieldPickerOpen(false)}
          onSelectField={(value, name) => {
            setFieldName(name || value);
            setFieldPickerOpen(false);
          }}
          anchorEl={fieldBoxRef.current}
          placement="dropdown"
          showTriggerFields
          overlayZIndex={zIndex + 200}
          insertedText={fieldName ? `{{${fieldName}}}` : ''}
        />
      )}
    </>
  );
}
