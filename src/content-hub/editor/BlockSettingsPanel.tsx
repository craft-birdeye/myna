/**
 * BlockSettingsPanel
 *
 * Schema-driven right pane for the selected block. The panel stays generic:
 * blockDefinitions.ts owns which controls appear for each block type.
 */

import React, { useRef } from 'react';
import { AlignCenter, AlignLeft, AlignRight, ImageIcon, Plus, Trash2, Upload, X } from 'lucide-react';
import { cn } from '@/contenthub-ui/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/contenthub-ui/select';
import { type Block } from './blockTypes';
import { type InspectorField, getBlockDefinition } from './blockDefinitions';
import { useBlockEditorContext } from './BlockEditorContext';

function SettingsGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-[11px] text-muted-foreground/70 uppercase">{label}</p>
      {children}
    </div>
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function getAtPath(source: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((current, key) => {
    if (!isRecord(current)) return undefined;
    return current[key];
  }, source);
}

function setAtPath(path: string, value: unknown): Record<string, unknown> {
  const [root, ...parts] = path.split('.');
  if (!root) return {};

  if (parts.length === 0) return { [root]: value };

  const nested: Record<string, unknown> = {};
  let cursor = nested;
  parts.forEach((part, index) => {
    if (index === parts.length - 1) {
      cursor[part] = value;
      return;
    }
    cursor[part] = {};
    cursor = cursor[part] as Record<string, unknown>;
  });

  return { [root]: nested };
}

function primitiveFieldValue(field: InspectorField): unknown {
  if (field.control === 'toggle') return false;
  if (field.control === 'number' || field.control === 'slider') return field.min ?? 0;
  return '';
}

function defaultRepeaterItem(field: InspectorField): unknown {
  const itemFields = field.itemFields ?? [];
  if (itemFields.length === 1 && itemFields[0]?.path === 'value') {
    return primitiveFieldValue(itemFields[0]);
  }
  return itemFields.reduce<Record<string, unknown>>((item, itemField) => {
    item[itemField.path] = primitiveFieldValue(itemField);
    return item;
  }, {});
}

function FieldLabel({ field }: { field: InspectorField }) {
  return <label className="text-[12px] text-foreground">{field.label}</label>;
}

function TextControl({
  field,
  value,
  onChange,
}: {
  field: InspectorField;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  if (field.control === 'textarea') {
    return (
      <textarea
        value={String(value ?? '')}
        onChange={event => onChange(event.target.value)}
        placeholder={field.placeholder}
        rows={3}
        className="w-full rounded-lg border border-border bg-background px-4 py-2 text-[12px] leading-relaxed text-foreground outline-none transition-colors resize-none focus:border-primary"
      />
    );
  }

  return (
    <input
      type={field.control === 'url' ? 'url' : 'text'}
      value={String(value ?? '')}
      onChange={event => onChange(event.target.value)}
      placeholder={field.placeholder}
      className="w-full rounded-lg border border-border bg-background px-4 py-2 text-[12px] text-foreground outline-none transition-colors focus:border-primary"
    />
  );
}

function ImageControl({
  field,
  value,
  onChange,
}: {
  field: InspectorField;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const src = String(value ?? '');

  function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    onChange(URL.createObjectURL(file));
    event.target.value = '';
  }

  return (
    <div className="space-y-2">
      {src ? (
        <div className="overflow-hidden rounded-lg border border-border bg-muted/20">
          <img src={src} alt="" className="h-28 w-full object-cover" />
        </div>
      ) : (
        <div className="flex h-24 items-center justify-center rounded-lg border border-dashed border-border bg-muted/20">
          <ImageIcon size={20} strokeWidth={1.6} absoluteStrokeWidth className="text-muted-foreground" />
        </div>
      )}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex h-[34px] flex-1 items-center justify-center gap-2 rounded-lg border border-border bg-background text-[12px] text-foreground transition-colors hover:bg-surface-hover"
        >
          <Upload size={13} strokeWidth={1.6} absoluteStrokeWidth />
          {src ? 'Replace image' : 'Upload image'}
        </button>
        {src && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="h-[34px] rounded-lg border border-border bg-background px-4 text-[12px] text-muted-foreground transition-colors hover:bg-surface-hover hover:text-destructive"
          >
            Remove
          </button>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="sr-only" onChange={handleFile} />
      <input
        type="url"
        value={src}
        onChange={event => onChange(event.target.value)}
        placeholder={field.placeholder ?? 'https://example.com/image.jpg'}
        className="w-full rounded-lg border border-border bg-background px-4 py-2 text-[12px] text-foreground outline-none transition-colors focus:border-primary"
      />
    </div>
  );
}

function SegmentedControl({
  field,
  value,
  onChange,
}: {
  field: InspectorField;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  return (
    <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
      {(field.options ?? []).map(option => (
        <button
          key={String(option.value)}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            'flex-1 rounded-md px-2 py-1.5 text-[11px] transition-colors',
            value === option.value
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function AlignmentControl({
  value,
  onChange,
}: {
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  const options = [
    { value: 'left', icon: AlignLeft, label: 'Left' },
    { value: 'center', icon: AlignCenter, label: 'Center' },
    { value: 'right', icon: AlignRight, label: 'Right' },
  ];

  return (
    <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
      {options.map(option => {
        const Icon = option.icon;
        return (
          <button
            key={option.value}
            type="button"
            title={option.label}
            onClick={() => onChange(option.value)}
            className={cn(
              'flex h-[34px] flex-1 items-center justify-center rounded-md transition-colors',
              value === option.value
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Icon size={14} strokeWidth={1.6} absoluteStrokeWidth />
          </button>
        );
      })}
    </div>
  );
}

function SelectControl({
  field,
  value,
  onChange,
}: {
  field: InspectorField;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  const options = field.options ?? [];
  return (
    <Select value={String(value ?? options[0]?.value ?? '')} onValueChange={onChange}>
      <SelectTrigger size="sm" className="h-[34px] rounded-lg border-border bg-background text-[12px]">
        <SelectValue placeholder="Choose" />
      </SelectTrigger>
      <SelectContent align="start">
        {options.map(option => (
          <SelectItem key={String(option.value)} value={String(option.value)}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function ToggleControl({
  value,
  onChange,
}: {
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  const checked = Boolean(value);
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={cn(
        'flex w-full items-center justify-between rounded-lg border border-border px-4 py-2 text-[12px] transition-colors',
        checked ? 'bg-primary/8 text-foreground' : 'bg-background text-muted-foreground hover:bg-surface-hover',
      )}
    >
      <span>{checked ? 'Enabled' : 'Disabled'}</span>
      <span
        className={cn(
          'relative h-4 w-7 rounded-full transition-colors',
          checked ? 'bg-primary' : 'bg-muted-foreground/30',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 h-3 w-3 rounded-full bg-background transition-transform',
            checked ? 'translate-x-3.5' : 'translate-x-0.5',
          )}
        />
      </span>
    </button>
  );
}

function RangeControl({
  field,
  value,
  onChange,
}: {
  field: InspectorField;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  const numericValue = Number(value ?? field.min ?? 0);
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <input
          type="range"
          min={field.min}
          max={field.max}
          step={field.step}
          value={numericValue}
          onChange={event => onChange(Number(event.target.value))}
          className="w-full accent-primary"
        />
        <input
          type="number"
          min={field.min}
          max={field.max}
          step={field.step}
          value={numericValue}
          onChange={event => onChange(Number(event.target.value))}
          className="h-[34px] w-16 rounded-lg border border-border bg-background px-2 text-[12px] text-foreground outline-none focus:border-primary"
        />
      </div>
    </div>
  );
}

function ColorControl({
  field,
  value,
  onChange,
}: {
  field: InspectorField;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const colorValue = String(value ?? '');
  const displayColor = colorValue.startsWith('#') ? colorValue : (colorValue || '#ffffff');

  return (
    <div className="flex items-center justify-between">
      <span className="text-[12px] text-foreground">{field.label}</span>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        title={colorValue || 'Choose color'}
        className="size-[34px] rounded-full border border-border/50 shadow-sm transition-transform hover:scale-110 active:scale-95"
        style={{ backgroundColor: displayColor }}
      />
      <input
        ref={inputRef}
        type="color"
        value={displayColor}
        onChange={e => onChange(e.target.value)}
        className="sr-only"
      />
    </div>
  );
}

function RepeaterControl({
  field,
  value,
  onChange,
}: {
  field: InspectorField;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  const items = Array.isArray(value) ? value : [];

  function updateItem(index: number, itemField: InspectorField, nextValue: unknown) {
    const next = [...items];
    const current = next[index];
    if (!isRecord(current)) {
      next[index] = nextValue;
    } else {
      next[index] = { ...current, [itemField.path]: nextValue };
    }
    onChange(next);
  }

  function itemValue(item: unknown, itemField: InspectorField): unknown {
    if (isRecord(item)) return item[itemField.path];
    return itemField.path === 'value' ? item : undefined;
  }

  return (
    <div className="space-y-2">
      {items.map((item, index) => (
        <div key={index} className="space-y-2 rounded-lg border border-border bg-muted/20 p-2">
          <div className="flex items-center justify-between">
            <p className="text-[11px] text-muted-foreground">
              {field.itemLabel ?? 'Item'} {index + 1}
            </p>
            <button
              type="button"
              onClick={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))}
              className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-surface-hover hover:text-destructive"
              aria-label={`Remove ${field.itemLabel ?? 'item'} ${index + 1}`}
            >
              <Trash2 size={13} strokeWidth={1.6} absoluteStrokeWidth />
            </button>
          </div>
          {(field.itemFields ?? []).map(itemField => (
            <InspectorFieldControl
              key={itemField.id}
              field={itemField}
              value={itemValue(item, itemField)}
              onChange={nextValue => updateItem(index, itemField, nextValue)}
            />
          ))}
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...items, defaultRepeaterItem(field)])}
        className="flex h-[34px] w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border text-[12px] text-muted-foreground transition-colors hover:border-primary hover:text-primary"
      >
        <Plus size={13} strokeWidth={1.6} absoluteStrokeWidth />
        Add {field.itemLabel?.toLowerCase() ?? 'item'}
      </button>
    </div>
  );
}

function InspectorFieldControl({
  field,
  value,
  onChange,
}: {
  field: InspectorField;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  let control: React.ReactNode;

  switch (field.control) {
    case 'textarea':
    case 'text':
    case 'url':
    case 'link':
      control = <TextControl field={field} value={value} onChange={onChange} />;
      break;
    case 'image':
      control = <ImageControl field={field} value={value} onChange={onChange} />;
      break;
    case 'select':
      control = <SelectControl field={field} value={value} onChange={onChange} />;
      break;
    case 'segmented':
    case 'spacing':
      control = <SegmentedControl field={field} value={value} onChange={onChange} />;
      break;
    case 'alignment':
      control = <AlignmentControl value={value ?? 'left'} onChange={onChange} />;
      break;
    case 'color':
      return <ColorControl field={field} value={value ?? ''} onChange={onChange} />;

    case 'number':
    case 'slider':
      control = <RangeControl field={field} value={value} onChange={onChange} />;
      break;
    case 'toggle':
      control = <ToggleControl value={value} onChange={onChange} />;
      break;
    case 'repeater':
      control = <RepeaterControl field={field} value={value} onChange={onChange} />;
      break;
    default:
      control = null;
  }

  return (
    <div className="space-y-1">
      <FieldLabel field={field} />
      {control}
    </div>
  );
}

export function BlockSettingsPanel() {
  const { blocks, focusedId, updateBlock, focusBlock } = useBlockEditorContext();
  const block = blocks.find(item => item.id === focusedId) ?? null;
  const isOpen = focusedId !== null;
  const definition = block ? getBlockDefinition(block.type) : null;

  return (
    <div
      className={cn(
        'flex-none flex flex-col overflow-hidden rounded-xl bg-background shadow-sm transition-all duration-200',
        isOpen ? 'w-[320px]' : 'w-0',
      )}
      aria-hidden={!isOpen}
    >
      <div className="flex h-full w-[320px] flex-col overflow-hidden">
        {block && definition && (
          <>
            <div className="flex h-12 flex-none items-center justify-between border-b border-border px-4">
              <span className="text-[13px] text-foreground">{definition.label}</span>
              <button
                type="button"
                onClick={() => focusBlock(null)}
                aria-label="Close settings"
                className="flex size-7 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground"
              >
                <X size={14} strokeWidth={1.6} absoluteStrokeWidth />
              </button>
            </div>

            <div className="flex-1 space-y-6 overflow-y-auto px-4 py-4">
              {definition.inspector.map(group => (
                <SettingsGroup key={group.id} label={group.label}>
                  <div className="space-y-3">
                    {group.fields.map(field => (
                      <InspectorFieldControl
                        key={field.id}
                        field={field}
                        value={getAtPath(block, field.path)}
                        onChange={value => updateBlock(block.id, setAtPath(field.path, value))}
                      />
                    ))}
                  </div>
                </SettingsGroup>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
