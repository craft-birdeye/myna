import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { AeroFormModal } from '../../../../components/AeroFormModal/AeroFormModal';
import { Icon } from '../../../../components/Icon/Icon';

const OUTPUT_FIELD_MODAL_SUBTITLE =
  'Define fields and AI will automatically populate them with structured data. Use clear names and descriptions for each field.';
const OUTPUT_FIELDS_LEARN_MORE_HREF =
  'https://help.birdeye.com/hc/en-us/articles/output-fields-in-workflows';

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
    if (!open || !triggerRef.current) return;

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
    if (!open) return;
    function handleClickOutside(e) {
      const t = e.target;
      if (
        triggerRef.current?.contains(t) ||
        menuRef.current?.contains(t)
      ) {
        return;
      }
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

export default function AddOutputFieldModal({ onClose, onAdd, zIndex = 2100, onLearnMore }) {
  const [fieldName, setFieldName] = useState('');
  const [fieldType, setFieldType] = useState('');
  const [description, setDescription] = useState('');
  const [required, setRequired] = useState(false);

  function handleAdd() {
    if (!fieldName || !fieldType || !description.trim()) return;
    onAdd({ fieldName, fieldType, description: description.trim(), required });
    onClose();
  }

  return (
    <AeroFormModal
      title="Add output field"
      subtitle={OUTPUT_FIELD_MODAL_SUBTITLE}
      learnMoreHref={onLearnMore ? undefined : OUTPUT_FIELDS_LEARN_MORE_HREF}
      onLearnMore={onLearnMore}
      onClose={onClose}
      onPrimary={handleAdd}
      primaryDisabled={!fieldName || !fieldType || !description.trim()}
      zIndex={zIndex}
      widthClassName="w-[650px]"
      fitContent
    >
      <div className="flex flex-col gap-lg pb-md">
        <label className="flex flex-col gap-xs">
          <FieldLabel required>Field name</FieldLabel>
          <input
            type="text"
            value={fieldName}
            onChange={(e) => setFieldName(e.target.value)}
            placeholder="Field name"
            className="h-9 w-full rounded-sm border border-border-input bg-surface px-md text-body text-text-primary outline-none placeholder:text-text-tertiary focus:border-primary"
          />
        </label>

        <label className="flex flex-col gap-xs">
          <FieldLabel required>Field type</FieldLabel>
          <FieldTypeDropdown value={fieldType} onChange={setFieldType} menuZIndex={zIndex + 100} />
        </label>

        <label className="flex flex-col gap-xs">
          <FieldLabel required>Description</FieldLabel>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add instructions or examples which will be sent to LLM to generate this output"
            rows={3}
            className="w-full resize-none rounded-sm border border-border-input bg-surface px-md py-sm text-body text-text-primary outline-none placeholder:text-text-tertiary focus:border-primary"
          />
        </label>

        <label className="flex cursor-pointer items-center gap-sm">
          <input
            type="checkbox"
            checked={required}
            onChange={(e) => setRequired(e.target.checked)}
            className="size-[18px] rounded-sm border border-control-border accent-primary"
          />
          <span className="text-body text-text-primary">Is this output field required?</span>
        </label>
      </div>
    </AeroFormModal>
  );
}
