/**
 * elemental-stubs.jsx
 *
 * Native HTML drop-in replacements for @birdeye/elemental atoms used in the
 * embedded agent-builder prototype.  These match the prop API of the real
 * elemental components so the body components need only a one-line import
 * change — no other edits required.
 *
 * Styled to look clean but deliberately lightweight: no external deps.
 */
import React, { useState, useRef, useEffect } from 'react';
import './Molecules/Conditions/Conditions.css';

const font = '"Roboto", arial, sans-serif';

/* ─── FormInput ─────────────────────────────────────────────────────────── */
export function FormInput({
  name,
  type = 'text',
  label,
  placeholder = '',
  value,
  onChange,
  required,
  min,
  max,
  disabled,
  readOnly,
  checked,
  labelInside,
  styleConfig,
}) {
  /* Radio button layout */
  if (type === 'radio') {
    return (
      <label
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          cursor: 'pointer',
          fontFamily: font,
          fontSize: 14,
          color: '#212121',
          lineHeight: '20px',
        }}
      >
        <input
          type="radio"
          name={name}
          value={value}
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          style={{ accentColor: '#1976d2', width: 16, height: 16, flexShrink: 0 }}
        />
        {label && <span>{label}</span>}
      </label>
    );
  }

  const noBorder = styleConfig?.removeBorder;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {label && (
        <label
          htmlFor={name}
          style={{
            fontSize: 12,
            fontWeight: 400,
            lineHeight: '18px',
            letterSpacing: '-0.24px',
            color: '#212121',
            fontFamily: font,
          }}
        >
          {label}
          {required && <span style={{ color: '#de1b0c', marginLeft: 2 }}>*</span>}
        </label>
      )}
      <input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        value={value ?? ''}
        onChange={onChange}
        min={min}
        max={max}
        disabled={disabled}
        readOnly={readOnly}
        style={{
          height: 36,
          padding: '0 12px',
          border: noBorder ? 'none' : '1px solid #c5cad3',
          borderRadius: noBorder ? 0 : 4,
          fontSize: 14,
          fontFamily: font,
          color: '#212121',
          background: readOnly ? '#FAFAFA' : disabled ? '#f5f5f5' : '#fff',
          outline: 'none',
          boxSizing: 'border-box',
          width: '100%',
          cursor: readOnly ? 'default' : undefined,
        }}
        onFocus={(e) => { if (!noBorder && !readOnly) e.target.style.borderColor = '#1976d2'; }}
        onBlur={(e) => { if (!noBorder && !readOnly) e.target.style.borderColor = '#c5cad3'; }}
      />
    </div>
  );
}

/* ─── TextArea ───────────────────────────────────────────────────────────── */
export function TextArea({
  name,
  label,
  placeholder = '',
  value,
  onChange,
  required,
  noFloatingLabel,
  rows = 3,
  disabled,
  readOnly,
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {label && !noFloatingLabel && (
        <label
          htmlFor={name}
          style={{
            fontSize: 12,
            fontWeight: 400,
            lineHeight: '18px',
            letterSpacing: '-0.24px',
            color: '#212121',
            fontFamily: font,
          }}
        >
          {label}
          {required && <span style={{ color: '#de1b0c', marginLeft: 2 }}>*</span>}
        </label>
      )}
      {label && noFloatingLabel && (
        <label
          htmlFor={name}
          style={{
            fontSize: 12,
            fontWeight: 400,
            lineHeight: '18px',
            letterSpacing: '-0.24px',
            color: '#212121',
            fontFamily: font,
          }}
        >
          {label}
          {required && <span style={{ color: '#de1b0c', marginLeft: 2 }}>*</span>}
        </label>
      )}
      <textarea
        id={name}
        name={name}
        placeholder={placeholder}
        value={value ?? ''}
        onChange={onChange}
        rows={rows}
        disabled={disabled}
        readOnly={readOnly}
        style={{
          padding: '8px 12px',
          border: '1px solid #c5cad3',
          borderRadius: 4,
          fontSize: 14,
          fontFamily: font,
          color: '#212121',
          background: readOnly ? '#FAFAFA' : disabled ? '#f5f5f5' : '#fff',
          outline: 'none',
          resize: readOnly ? 'none' : 'vertical',
          boxSizing: 'border-box',
          width: '100%',
          lineHeight: '20px',
          cursor: readOnly ? 'default' : undefined,
        }}
        onFocus={(e) => { if (!readOnly) e.target.style.borderColor = '#1976d2'; }}
        onBlur={(e) => { if (!readOnly) e.target.style.borderColor = '#c5cad3'; }}
      />
    </div>
  );
}

/* ─── SingleSelect ───────────────────────────────────────────────────────── */
export function SingleSelect({
  name,
  selected,
  options = [],
  onChange,
  placeholder = 'Select',
  disabled,
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open || disabled) return undefined;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, disabled]);

  const selectedLabel = options.find((o) => o.value === selected)?.label;

  return (
    <div className="tc-dropdown" ref={ref}>
      <button
        type="button"
        id={name}
        name={name}
        className={`tc-dropdown__trigger${open ? ' tc-dropdown__trigger--open' : ''}${disabled ? ' tc-dropdown__trigger--readonly' : ''}`}
        onClick={() => { if (!disabled) setOpen((v) => !v); }}
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={disabled}
      >
        <span className={`tc-dropdown__value${!selectedLabel ? ' tc-dropdown__value--placeholder' : ''}`}>
          {selectedLabel || placeholder}
        </span>
        <span className="material-symbols-outlined tc-dropdown__chevron">expand_more</span>
      </button>
      {open && !disabled && (
        <ul className="tc-dropdown__menu" role="listbox">
          {options.map((opt) => (
            <li
              key={opt.value}
              role="option"
              aria-selected={opt.value === selected}
              className={`tc-dropdown__option${opt.value === selected ? ' tc-dropdown__option--selected' : ''}`}
              onClick={() => { onChange?.(opt); setOpen(false); }}
            >
              {opt.label}
              {opt.value === selected && (
                <span className="material-symbols-outlined tc-dropdown__check">check</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ─── Chip ───────────────────────────────────────────────────────────────── */
const CHIP_COLOR_MAP = {
  green:  { bg: '#e6f4ea', color: '#1b6f36', dot: '#34a853' },
  yellow: { bg: '#fef9e5', color: '#7a5f00', dot: '#f9ab00' },
  grey:   { bg: '#f4f6f7', color: '#555555', dot: '#9e9e9e' },
  red:    { bg: '#fde8e8', color: '#b42318', dot: '#e53935' },
  blue:   { bg: '#e3f2fd', color: '#0d47a1', dot: '#1976d2' },
};

export function Chip({ label, rightIcon: RightIcon, onIconClick, size = 'medium', colorType }) {
  const isSmall = size === 'small';
  const colors = CHIP_COLOR_MAP[colorType] || CHIP_COLOR_MAP.grey;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        height: isSmall ? 22 : 28,
        padding: isSmall ? '0 8px' : '0 10px',
        background: colors.bg,
        border: `1px solid ${colors.bg}`,
        borderRadius: 14,
        fontSize: isSmall ? 11 : 13,
        fontFamily: font,
        color: colors.color,
        whiteSpace: 'nowrap',
        fontWeight: 500,
      }}
    >
      {colorType && (
        <span style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: colors.dot,
          display: 'inline-block',
          flexShrink: 0,
        }} />
      )}
      {label}
      {RightIcon && (
        <button
          type="button"
          onClick={onIconClick}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            color: '#666',
            lineHeight: 1,
          }}
        >
          <RightIcon />
        </button>
      )}
    </span>
  );
}

/* ─── Toggle ─────────────────────────────────────────────────────────────── */
export function Toggle({ name, checked, onChange, roundedToggle, disabled }) {
  const handleChange = (e) => {
    // elemental Toggle calls onChange(value, event) — we mirror that shape
    onChange?.(e.target.checked, e);
  };

  const width = 32;
  const height = 16;
  const knobSize = 12;
  const knobTop = (height - knobSize) / 2;
  const on = !!checked;

  return (
    <label
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        position: 'relative',
        cursor: disabled ? 'not-allowed' : 'pointer',
        userSelect: 'none',
        flexShrink: 0,
        lineHeight: 0,
      }}
      title={on ? 'Enabled' : 'Disabled'}
    >
      <input
        type="checkbox"
        name={name}
        checked={on}
        disabled={disabled}
        onChange={handleChange}
        style={{ position: 'absolute', opacity: 0, width: 0, height: 0, margin: 0 }}
      />
      {/* Track */}
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          width,
          height,
          borderRadius: roundedToggle ? height / 2 : 4,
          background: on ? '#1976d2' : '#b0bec5',
          transition: 'background 0.2s',
          position: 'relative',
          flexShrink: 0,
          opacity: disabled ? 0.5 : 1,
        }}
      >
        {/* Knob */}
        <span
          style={{
            position: 'absolute',
            top: knobTop,
            left: on ? width - knobSize - 2 : 2,
            width: knobSize,
            height: knobSize,
            borderRadius: '50%',
            background: '#fff',
            boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
            transition: 'left 0.2s',
          }}
        />
      </span>
    </label>
  );
}

/* ─── Button ─────────────────────────────────────────────────────────────── */
/**
 * Stub for @birdeye/elemental Button.
 * Supports: theme="primary"|"secondary"|"tertiary"|"link"
 *           type="primary"|"secondary"|"link" (legacy prop alias)
 *           label, onClick, disabled, expanded (full-width)
 */
export function Button({
  label,
  children,
  theme,
  type,
  onClick,
  disabled,
  expanded,
  customIcon,
  noHover,
  'aria-label': ariaLabel,
}) {
  const resolvedTheme = theme || type || 'secondary';

  /* Shared base */
  const base = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 36,
    padding: expanded ? '0 0' : '0 16px',
    width: expanded ? '100%' : undefined,
    borderRadius: 4,
    fontSize: 14,
    fontWeight: 500,
    fontFamily: font,
    letterSpacing: '-0.28px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    border: 'none',
    outline: 'none',
    transition: 'background 0.15s, color 0.15s',
    boxSizing: 'border-box',
    userSelect: 'none',
    opacity: disabled ? 0.5 : 1,
  };

  const themes = {
    primary:   { background: '#1976d2', color: '#fff' },
    secondary: { background: '#fff', color: '#1976d2', border: '1px solid #1976d2' },
    tertiary:  { background: '#f4f6f7', color: '#212121', border: '1px solid #e5e9f0' },
    link:      { background: 'none', color: '#1976d2', padding: 0, height: 'auto' },
  };

  const themeStyle = themes[resolvedTheme] || themes.secondary;

  return (
    <button
      type="button"
      style={{ ...base, ...themeStyle }}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      aria-label={ariaLabel || label}
    >
      {customIcon && <span style={{ display: 'inline-flex', alignItems: 'center' }}>{customIcon}</span>}
      {label || children}
    </button>
  );
}

/* ─── TabHeader ─────────────────────────────────────────────────────────── */
export function TabHeader({ content = [], activeTab, clickTab, isAeroDesign }) {
  return (
    <div style={{ display: 'flex', gap: 0 }}>
      {content.map((tab) => {
        const id = tab.value ?? tab.id;
        const active = activeTab === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => clickTab(id)}
            style={{
              padding: '10px 16px',
              background: 'transparent',
              border: 'none',
              borderBottom: active ? '2px solid #1976d2' : '2px solid transparent',
              cursor: 'pointer',
              fontFamily: '"Inter", sans-serif',
              fontSize: 14,
              fontWeight: 400,
              lineHeight: '20px',
              color: active ? '#1976d2' : '#555',
              whiteSpace: 'nowrap',
            }}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

/* ─── Tooltip ───────────────────────────────────────────────────────────── */
export function Tooltip({ text, children, position = 'top', display = 'inline-flex' }) {
  const [visible, setVisible] = React.useState(false);
  const [coords, setCoords] = React.useState(null);
  const ref = React.useRef(null);

  function show() {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    setCoords({
      x: r.left + r.width / 2,
      y: position === 'bottom' ? r.bottom + 6 : r.top - 6,
    });
    setVisible(true);
  }

  return (
    <span
      ref={ref}
      style={{ position: 'relative', display }}
      onMouseEnter={show}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && coords && (
        <span
          role="tooltip"
          style={{
            position: 'fixed',
            left: coords.x,
            top: coords.y,
            transform: position === 'bottom' ? 'translateX(-50%)' : 'translate(-50%, -100%)',
            background: '#212121',
            color: '#fff',
            fontSize: 12,
            lineHeight: '18px',
            padding: '4px 8px',
            borderRadius: 4,
            whiteSpace: 'nowrap',
            zIndex: 10000,
            pointerEvents: 'none',
            fontFamily: '"Roboto", arial, sans-serif',
          }}
        >
          {text}
        </span>
      )}
    </span>
  );
}

/* ─── DrawerHeader ──────────────────────────────────────────────────────── */
export function DrawerHeader({ title = '', onBack, actions = [] }) {
  const visibleActions = actions.slice(0, 2);
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '24px 24px 16px 24px',
        background: '#ffffff',
        width: '100%',
        boxSizing: 'border-box',
        fontFamily: '"Inter", sans-serif',
      }}
    >
      <button
        type="button"
        onClick={onBack}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: 'transparent',
          border: 'none',
          padding: 0,
          cursor: onBack ? 'pointer' : 'default',
          color: '#1f2328',
        }}
        aria-label={onBack ? `Back from ${title}` : title}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <line x1="19" y1="12" x2="5" y2="12" />
          <polyline points="12 19 5 12 12 5" />
        </svg>
        <span style={{ fontSize: 16, fontWeight: 400, lineHeight: '24px', color: '#1f2328', whiteSpace: 'nowrap' }}>
          {title}
        </span>
      </button>
      {visibleActions.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {visibleActions.map((action, idx) => (
            <Button
              key={action.key ?? action.label ?? idx}
              type={action.type ?? (idx === visibleActions.length - 1 ? 'primary' : 'secondary')}
              label={action.label}
              onClick={action.onClick}
              disabled={action.disabled}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Default export for convenience ────────────────────────────────────── */
export default { FormInput, TextArea, SingleSelect, Chip, Toggle, Button, TabHeader, Tooltip, DrawerHeader };
