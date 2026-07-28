import React, { useState, useRef, useEffect } from 'react';
import { Check, ChevronDown, Info, Minus, Plus, Search, X } from 'lucide-react';
import { cn } from '@/contenthub-ui/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/contenthub-ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/contenthub-ui/tooltip';
import { Input } from '@/contenthub-ui/input';
import { InlineSelectField } from '@/contenthub-ui/inline-select-field';
import { Textarea } from '@/contenthub-ui/textarea';
import { Checkbox } from '@/contenthub-ui/checkbox';

export interface ContentFlowStep {
  id: string;
  label: string;
}

export const CONTENT_FLOW_STEP_TITLE_CLASS = 'text-[16px] leading-6 text-foreground';
export const CONTENT_FLOW_FIELD_CLASS =
  'h-10 rounded-[8px] border-border bg-white px-4 text-[15px] md:text-[15px] font-normal text-text-primary placeholder:text-text-secondary transition-[color,box-shadow,border-color] hover:border-border focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-primary/10 dark:border-[#333a47] dark:bg-[#262b35] dark:text-[#e4e4e4] dark:placeholder:text-[#4d5568] dark:hover:border-[#4d5568]';
export const CONTENT_FLOW_TEXTAREA_CLASS =
  'min-h-28 rounded-[8px] border-border bg-white px-4 py-2 text-[15px] md:text-[15px] font-normal leading-6 text-text-primary placeholder:text-text-secondary transition-[color,box-shadow,border-color] hover:border-border focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-primary/10 dark:border-[#333a47] dark:bg-[#262b35] dark:text-[#e4e4e4] dark:placeholder:text-[#4d5568] dark:hover:border-[#4d5568]';

export function ContentFlowTextInput({
  className,
  ...props
}: React.ComponentProps<typeof Input>) {
  return <Input className={cn(CONTENT_FLOW_FIELD_CLASS, className)} {...props} />;
}

export function ContentFlowTextarea({
  className,
  ...props
}: React.ComponentProps<typeof Textarea>) {
  return <Textarea className={cn(CONTENT_FLOW_TEXTAREA_CLASS, className)} {...props} />;
}

export function ContentFlowInfoLabel({
  children,
  tooltip,
  required = false,
  className,
}: {
  children: React.ReactNode;
  tooltip?: React.ReactNode;
  required?: boolean;
  className?: string;
}) {
  const labelText = typeof children === 'string' ? children : 'Field';

  return (
    <div className={cn('flex items-center gap-1.5 text-[13px] text-foreground', className)}>
      <span>{children}</span>
      {required && <span className="text-destructive">*</span>}
      {tooltip && (
        <TooltipProvider delayDuration={150}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-label={`${labelText} information`}
                className="inline-flex size-4 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Info size={13} strokeWidth={1.6} absoluteStrokeWidth />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" align="start" className="max-w-[260px] text-[12px] leading-snug">
              {tooltip}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
}

export function ContentFlowStepper({
  steps,
  currentStep,
  onStepChange,
}: {
  steps: ContentFlowStep[];
  currentStep: number;
  onStepChange?: (step: number) => void;
}) {
  return (
    <nav aria-label="Content creation steps" className="flex flex-col gap-1">
      {steps.map((step, index) => {
        const done = index < currentStep;
        const active = index === currentStep;
        const clickable = Boolean(onStepChange);

        return (
          <div key={step.id} className="relative">
            <button
              type="button"
              onClick={() => onStepChange?.(index)}
              disabled={!clickable}
              className={cn(
                'relative z-10 flex h-[34px] w-full items-center gap-2 rounded-md px-2 text-left text-[13px] transition-colors',
                clickable && 'hover:bg-surface-hover',
                !clickable && 'cursor-default',
                active && 'bg-muted text-foreground',
                !active && 'text-muted-foreground',
              )}
            >
              <span
                className={cn(
                  'flex size-5 shrink-0 items-center justify-center rounded-full border text-[10px]',
                  done && 'border-accent-positive bg-accent-positive text-white',
                  active && !done && 'border-[#eaeaea] bg-white text-foreground',
                  !active && !done && 'border-border bg-background text-muted-foreground',
                )}
              >
                {done ? <Check size={11} strokeWidth={1.6} absoluteStrokeWidth /> : index + 1}
              </span>
              <span>{step.label}</span>
            </button>
          </div>
        );
      })}
    </nav>
  );
}

export function ContentFlowChip({
  label,
  selected,
  onClick,
  disabled = false,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      className={cn(
        'inline-flex h-[34px] items-center gap-1.5 rounded-full border px-4 text-[13px] transition-colors disabled:cursor-not-allowed disabled:opacity-50',
        selected
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-border bg-background text-foreground hover:border-primary/40 hover:bg-surface-hover/40',
      )}
    >
      {selected && <Check size={12} strokeWidth={1.6} absoluteStrokeWidth />}
      {label}
    </button>
  );
}

export function ContentFlowChoiceCard({
  selected,
  onClick,
  icon: Icon,
  title,
  description,
  tags,
  selectionMode = 'single',
}: {
  selected: boolean;
  onClick: () => void;
  icon: React.ElementType;
  title: string;
  description: string;
  tags?: string[];
  selectionMode?: 'single' | 'multi';
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        'flex w-full items-start gap-4 rounded-[8px] border bg-background px-4 py-4 text-left transition-colors',
        selected
          ? 'border-primary bg-primary/[0.04] ring-1 ring-primary/20'
          : 'border-border hover:border-primary/30 hover:bg-surface-hover',
      )}
    >
      <span
        className={cn(
          'mt-0.5 flex size-[34px] shrink-0 items-center justify-center rounded-sm',
          selected ? 'bg-primary/10' : 'bg-muted',
        )}
      >
        <Icon
          size={16}
          strokeWidth={1.6}
          absoluteStrokeWidth
          className={selected ? 'text-primary' : 'text-foreground/60'}
        />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="text-[13px] text-foreground">{title}</span>
          {tags?.map(tag => (
            <span key={tag} className="rounded-md bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">
              {tag}
            </span>
          ))}
        </span>
        <span className="mt-0.5 block text-[12px] leading-snug text-muted-foreground">{description}</span>
      </span>
      <span
        className={cn(
          'mt-1 flex size-5 shrink-0 items-center justify-center border transition-colors',
          selectionMode === 'single' ? 'rounded-full' : 'rounded-md',
          selected ? 'border-primary bg-primary' : 'border-border bg-background',
        )}
      >
        {selected && <Check size={10} strokeWidth={1.6} absoluteStrokeWidth className="text-primary-foreground" />}
      </span>
    </button>
  );
}

export function ContentFlowRadioCard({
  selected,
  onClick,
  title,
  description,
}: {
  selected: boolean;
  onClick: () => void;
  title: string;
  description?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        'flex w-full items-start gap-2 rounded-[8px] border bg-background px-4 py-4 text-left transition-colors',
        selected
          ? 'border-primary bg-primary/[0.03]'
          : 'border-border hover:border-primary/40 hover:bg-background',
      )}
    >
      <span
        className={cn(
          'mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border transition-colors',
          selected ? 'border-primary' : 'border-border',
        )}
      >
        {selected && <span className="size-2 rounded-full bg-primary" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[13px] leading-snug text-foreground">{title}</span>
        {description ? (
          <span className="mt-1 block text-[12px] leading-relaxed text-muted-foreground">{description}</span>
        ) : null}
      </span>
    </button>
  );
}

export function ContentFlowCountStepper({
  value,
  min = 1,
  max = 20,
  onChange,
  ariaLabel,
}: {
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
  ariaLabel: string;
}) {
  return (
    <div className="inline-flex h-[34px] items-center rounded-[8px] border border-border bg-background">
      <button
        type="button"
        aria-label={`Decrease ${ariaLabel}`}
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        className="flex size-[34px] items-center justify-center rounded-l-md text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
      >
        <Minus size={14} strokeWidth={1.6} absoluteStrokeWidth />
      </button>
      <span className="min-w-[34px] px-1 text-center text-[13px] text-foreground">{value}</span>
      <button
        type="button"
        aria-label={`Increase ${ariaLabel}`}
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className="flex size-[34px] items-center justify-center rounded-r-md text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
      >
        <Plus size={14} strokeWidth={1.6} absoluteStrokeWidth />
      </button>
    </div>
  );
}

export function ContentFlowSelect({
  value,
  options,
  onChange,
  placeholder,
}: {
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const selectedOption = options.find(option => option.value === value);
  const displayValue = selectedOption?.label ?? placeholder ?? 'Select';

  const handleChange = (nextLabel: string) => {
    const nextOption = options.find(option => option.label === nextLabel);
    if (!nextOption) return;
    onChange(nextOption.value);
  };

  return (
    <InlineSelectField
      size="md"
      value={displayValue}
      options={options.map(option => option.label)}
      onChange={handleChange}
    />
  );
}

export function ContentFlowMultiSelect({
  values,
  options,
  onChange,
  placeholder = 'Select options',
}: {
  values: string[];
  options: { value: string; label: string }[];
  onChange: (values: string[]) => void;
  placeholder?: string;
}) {
  const toggleValue = (value: string) => {
    onChange(values.includes(value)
      ? values.filter(item => item !== value)
      : [...values, value]);
  };

  const removeValue = (value: string) => {
    onChange(values.filter(item => item !== value));
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <div
          role="button"
          tabIndex={0}
          className={cn(
            'flex min-h-12 w-full cursor-pointer items-center gap-2 rounded-[8px] border border-border bg-background px-4 py-2 text-left transition-[color,box-shadow]',
            'focus-visible:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/15',
          )}
        >
          <span className="flex min-w-0 flex-1 flex-wrap gap-2">
            {values.length > 0 ? (
              values.map(value => {
                const label = options.find(option => option.value === value)?.label ?? value;
                return (
                  <span
                    key={value}
                    className="inline-flex h-[34px] items-center gap-1 rounded-md bg-muted px-4 text-[13px] text-foreground"
                  >
                    {label}
                    <span
                      role="button"
                      tabIndex={0}
                      aria-label={`Remove ${label}`}
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        removeValue(value);
                      }}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          event.stopPropagation();
                          removeValue(value);
                        }
                      }}
                      className="rounded-sm text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                    >
                      <X size={20} strokeWidth={1.6} absoluteStrokeWidth />
                    </span>
                  </span>
                );
              })
            ) : (
              <span className="py-1 text-[13px] text-muted-foreground">{placeholder}</span>
            )}
          </span>
          <ChevronDown size={20} strokeWidth={1.6} absoluteStrokeWidth className="size-5 shrink-0 text-[#888] dark:text-[#6b7280]" />
        </div>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] p-2">
        <div className="flex flex-col gap-1">
          {options.map(option => {
            const selected = values.includes(option.value);
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => toggleValue(option.value)}
                className={cn(
                  'flex h-[34px] w-full items-center gap-2 rounded-sm px-4 text-left text-[13px] transition-colors',
                  selected ? 'bg-muted text-foreground' : 'text-foreground hover:bg-surface-hover',
                )}
              >
                <span
                  className={cn(
                    'flex size-4 items-center justify-center rounded border',
                    selected ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background',
                  )}
                >
                  {selected && <Check size={11} strokeWidth={1.6} absoluteStrokeWidth />}
                </span>
                <span>{option.label}</span>
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ── Keyword tag input: free-type + Enter, plus suggestion dropdown ─────────────

export function ContentFlowKeywordTagInput({
  values,
  suggestions = [],
  onChange,
  placeholder = 'Select or enter keywords',
}: {
  values: string[];
  suggestions?: { value: string; label: string }[];
  onChange: (values: string[]) => void;
  placeholder?: string;
}) {
  const [inputValue, setInputValue] = useState('');
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredSuggestions = suggestions.filter(s =>
    !values.includes(s.value) &&
    (inputValue === '' || s.label.toLowerCase().includes(inputValue.toLowerCase()))
  );

  function addKeyword(keyword: string) {
    const trimmed = keyword.trim();
    if (!trimmed || values.includes(trimmed)) return;
    onChange([...values, trimmed]);
    setInputValue('');
  }

  function removeKeyword(keyword: string) {
    onChange(values.filter(v => v !== keyword));
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addKeyword(inputValue);
    } else if (e.key === 'Backspace' && inputValue === '' && values.length > 0) {
      removeKeyword(values[values.length - 1]);
    }
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getLabelForValue = (val: string) =>
    suggestions.find(s => s.value === val)?.label ?? val;

  return (
    <div ref={containerRef} className="relative">
      <div
        className={cn(
          'flex min-h-[42px] w-full flex-wrap items-center gap-1.5 rounded-[8px] border border-border bg-background px-2 py-2 cursor-text transition-[box-shadow,border-color]',
          open && 'border-primary/50 ring-2 ring-primary/15',
        )}
        onClick={() => { inputRef.current?.focus(); setOpen(true); }}
      >
        {values.map(val => (
          <span
            key={val}
            className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-[12px] text-foreground"
          >
            {getLabelForValue(val)}
            <button
              type="button"
              onClick={e => { e.stopPropagation(); removeKeyword(val); }}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X size={11} strokeWidth={1.6} absoluteStrokeWidth />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={e => { setInputValue(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={values.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[120px] bg-transparent text-[13px] text-foreground placeholder:text-muted-foreground outline-none"
        />
      </div>

      {open && filteredSuggestions.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-[8px] border border-border bg-background shadow-card overflow-hidden">
          <div className="max-h-[200px] overflow-y-auto p-1 flex flex-col gap-2">
            {filteredSuggestions.map(s => (
              <button
                key={s.value}
                type="button"
                onMouseDown={e => { e.preventDefault(); addKeyword(s.value); }}
                className="flex w-full items-center rounded-md px-2 py-1 text-[13px] text-left text-foreground hover:bg-surface-hover transition-colors"
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const LOCATION_INFO_ITEMS = ['Source material', 'Brand profile', 'Target customers', 'Style and voice', 'Media', 'Guardrails'];

export function ContentFlowLocationInfoTooltip() {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button type="button" className="inline-flex shrink-0 text-muted-foreground hover:text-foreground transition-colors">
            <Info size={14} strokeWidth={1.6} absoluteStrokeWidth />
          </button>
        </TooltipTrigger>
        <TooltipContent side="right" align="start" className="max-w-[220px] p-2">
          <p className="text-[12px] leading-relaxed text-muted-foreground">
            Content will be generated using the selected brand identity.
          </p>
          <ul className="mt-2 space-y-1">
            {LOCATION_INFO_ITEMS.map(item => (
              <li key={item} className="flex items-center gap-1.5 text-[12px] text-foreground">
                <Check size={10} strokeWidth={1.6} absoluteStrokeWidth className="text-primary shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

const SELECT_BY_OPTIONS = [
  'location', 'region', 'city', 'zip', 'division',
  'content manager', 'social manager', 'area code',
  'region manager', 'room custom',
];

export function ContentFlowLocationFlatList({
  values,
  options,
  onChange,
  description,
}: {
  values: string[];
  options: { value: string; label: string }[];
  onChange: (values: string[]) => void;
  description?: string;
}) {
  const [search, setSearch] = React.useState('');
  const [selectBy, setSelectBy] = React.useState('location');
  const [selectByOpen, setSelectByOpen] = React.useState(false);

  const filteredOptions = React.useMemo(
    () => options.filter(o => o.label.toLowerCase().includes(search.toLowerCase())),
    [options, search],
  );

  const allSelected = values.length === options.length && options.length > 0;
  const someSelected = values.length > 0 && !allSelected;

  const handleSelectAll = () => {
    onChange(allSelected ? [] : options.map(o => o.value));
  };

  const handleToggle = (value: string) => {
    onChange(values.includes(value) ? values.filter(v => v !== value) : [...values, value]);
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Description with "Select by" inline dropdown */}
      {description && (
        <p className="flex flex-wrap items-center gap-1 text-[12px] text-muted-foreground">
          <span>{description} Select by</span>
          <Popover open={selectByOpen} onOpenChange={setSelectByOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="inline-flex items-center gap-0.5 text-primary transition-colors hover:text-primary/80"
              >
                {selectBy}
                <ChevronDown
                  size={12}
                  strokeWidth={1.6}
                  absoluteStrokeWidth
                  className={cn('transition-transform duration-150', selectByOpen && 'rotate-180')}
                />
              </button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-[176px] p-1">
              <div className="flex flex-col">
                {SELECT_BY_OPTIONS.map(opt => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => { setSelectBy(opt); setSelectByOpen(false); }}
                    className={cn(
                      'flex h-[34px] w-full items-center rounded-md px-2 text-[13px] transition-colors',
                      selectBy === opt
                        ? 'bg-muted text-foreground'
                        : 'text-foreground hover:bg-surface-hover',
                    )}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </p>
      )}

      {/* Search — standalone bordered input */}
      <div className="flex items-center gap-2 rounded-[8px] border border-border bg-white px-2 dark:border-[#333a47] dark:bg-[#262b35]">
        <Search size={14} strokeWidth={1.6} absoluteStrokeWidth className="shrink-0 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search location"
          className="flex-1 bg-transparent py-2.5 text-[15px] text-text-primary outline-none placeholder:text-text-secondary dark:text-[#e4e4e4] dark:placeholder:text-[#4d5568]"
        />
      </div>

      {/* Select all — standalone row */}
      <div
        role="button"
        tabIndex={0}
        onClick={handleSelectAll}
        onKeyDown={e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); handleSelectAll(); } }}
        className="flex cursor-pointer items-center justify-between py-2 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <Checkbox
            checked={allSelected ? true : someSelected ? 'indeterminate' : false}
            onCheckedChange={handleSelectAll}
            onClick={e => e.stopPropagation()}
          />
          <span className="text-[13px] text-foreground">Select all</span>
        </div>
        <span className="text-[13px] text-muted-foreground">{values.length} locations selected</span>
      </div>

      {/* Location rows — no outer container, only border-b between rows */}
      <div>
        {filteredOptions.map((option, index) => {
          const checked = values.includes(option.value);
          return (
            <div
              key={option.value}
              role="button"
              tabIndex={0}
              onClick={() => handleToggle(option.value)}
              onKeyDown={e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); handleToggle(option.value); } }}
              className="flex cursor-pointer items-center gap-2.5 rounded-sm py-2.5 transition-colors hover:bg-surface-hover/40"
            >
              <Checkbox
                checked={checked}
                onCheckedChange={() => handleToggle(option.value)}
                onClick={e => e.stopPropagation()}
              />
              <span className="text-[13px] text-text-primary dark:text-[#e4e4e4]">{option.label}</span>
            </div>
          );
        })}
        {filteredOptions.length === 0 && (
          <div className="py-4 text-center text-[13px] text-muted-foreground">No locations found</div>
        )}
      </div>
    </div>
  );
}

export function ContentFlowLocationMultiSelect({
  values,
  options,
  onChange,
  placeholder = 'Select location',
}: {
  values: string[];
  options: { value: string; label: string }[];
  onChange: (values: string[]) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const allOption = options[0];
  const specificOptions = options.slice(1);
  const isAllSelected = values.includes(allOption?.value ?? '');

  const triggerLabel = (() => {
    if (values.length === 0) return placeholder;
    if (isAllSelected) return allOption.label;
    if (values.length === 1) return options.find(o => o.value === values[0])?.label ?? placeholder;
    return `${values.length} locations selected`;
  })();

  const handleAllToggle = () => {
    onChange(isAllSelected ? [] : [allOption.value]);
  };

  const handleSpecificToggle = (value: string) => {
    if (isAllSelected) {
      onChange(specificOptions.map(o => o.value).filter(v => v !== value));
    } else if (values.includes(value)) {
      onChange(values.filter(v => v !== value));
    } else {
      onChange([...values, value]);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            'flex h-10 w-full items-center justify-between rounded-[8px] border border-border bg-white px-4 text-[15px] transition-[color,box-shadow,border-color]',
            'hover:border-border focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-primary/10 focus-visible:outline-none',
            'dark:border-[#333a47] dark:bg-[#262b35]',
            values.length > 0 ? 'text-text-primary dark:text-[#e4e4e4]' : 'text-text-secondary dark:text-[#4d5568]',
          )}
        >
          <span className="truncate">{triggerLabel}</span>
          <ChevronDown size={16} strokeWidth={1.6} absoluteStrokeWidth className="shrink-0 text-[#888] dark:text-[#6b7280]" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] p-1">
        <div className="flex flex-col">
          <div
            role="button"
            tabIndex={0}
            onClick={handleAllToggle}
            onKeyDown={e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); handleAllToggle(); } }}
            className="flex h-[34px] w-full cursor-pointer items-center gap-2.5 rounded-md px-2 text-[13px] transition-colors hover:bg-surface-hover"
          >
            <Checkbox
              checked={isAllSelected}
              onCheckedChange={handleAllToggle}
              onClick={e => e.stopPropagation()}
            />
            <span className="text-foreground">{allOption.label}</span>
          </div>
          <div className="my-1 h-px bg-border" />
          {specificOptions.map(option => {
            const checked = isAllSelected || values.includes(option.value);
            return (
              <div
                key={option.value}
                role="button"
                tabIndex={0}
                onClick={() => handleSpecificToggle(option.value)}
                onKeyDown={e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); handleSpecificToggle(option.value); } }}
                className="flex h-[34px] w-full cursor-pointer items-center gap-2.5 rounded-md px-2 text-[13px] transition-colors hover:bg-surface-hover"
              >
                <Checkbox
                  checked={checked}
                  onCheckedChange={() => handleSpecificToggle(option.value)}
                  onClick={e => e.stopPropagation()}
                />
                <span className="text-foreground">{option.label}</span>
              </div>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

const DEFAULT_BRAND_KIT_SUMMARY_ITEMS = [
  { label: 'Source material', description: 'Approved docs, locations, services, and business context' },
  { label: 'Brand profile', description: 'Positioning, tone, personality, and core brand facts' },
  { label: 'Target customers', description: 'Audience segments, local context, and customer needs' },
  { label: 'Style and voice', description: 'Writing style, vocabulary, formatting, and answer depth' },
  { label: 'Media', description: 'Approved images, banners, visual direction, and reusable assets' },
  { label: 'Guardrails', description: 'Claims, competitor rules, compliance notes, and topics to avoid' },
];

export function ContentFlowBrandKitSummary({
  contentLabel = 'Generated content',
  items = DEFAULT_BRAND_KIT_SUMMARY_ITEMS,
}: {
  contentLabel?: string;
  items?: { label: string; description: string }[];
}) {
  return (
    <section className="space-y-2">
      <p className="text-[12px] leading-relaxed text-muted-foreground">
        <span className="text-foreground">{contentLabel}</span> will be generated using the selected
        brand identity.
      </p>

      <ul className="flex flex-wrap gap-2">
        {items.map(item => (
          <li
            key={item.label}
            className="inline-flex h-7 items-center gap-1.5 rounded-full border border-border/80 px-2.5 text-[12px] text-muted-foreground"
            title={item.description}
          >
            <Check size={11} strokeWidth={1.6} absoluteStrokeWidth className="shrink-0 text-primary" />
            <span>{item.label}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
