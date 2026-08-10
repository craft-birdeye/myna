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
        style={{
          height: 36,
          padding: '0 12px',
          border: noBorder ? 'none' : '1px solid #c5cad3',
          borderRadius: noBorder ? 0 : 4,
          fontSize: 14,
          fontFamily: font,
          color: '#212121',
          background: disabled ? '#f5f5f5' : '#fff',
          outline: 'none',
          boxSizing: 'border-box',
          width: '100%',
        }}
        onFocus={(e) => { if (!noBorder) e.target.style.borderColor = '#1976d2'; }}
        onBlur={(e) => { if (!noBorder) e.target.style.borderColor = '#c5cad3'; }}
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
        style={{
          padding: '8px 12px',
          border: '1px solid #c5cad3',
          borderRadius: 4,
          fontSize: 14,
          fontFamily: font,
          color: '#212121',
          background: disabled ? '#f5f5f5' : '#fff',
          outline: 'none',
          resize: 'vertical',
          boxSizing: 'border-box',
          width: '100%',
          lineHeight: '20px',
        }}
        onFocus={(e) => { e.target.style.borderColor = '#1976d2'; }}
        onBlur={(e) => { e.target.style.borderColor = '#c5cad3'; }}
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
  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <select
        id={name}
        name={name}
        value={selected ?? ''}
        disabled={disabled}
        onChange={(e) => {
          const opt = options.find((o) => o.value === e.target.value);
          if (opt) onChange?.(opt);
        }}
        style={{
          appearance: 'none',
          WebkitAppearance: 'none',
          height: 36,
          padding: '0 32px 0 12px',
          border: '1px solid #c5cad3',
          borderRadius: 4,
          fontSize: 14,
          fontFamily: font,
          color: selected ? '#212121' : '#999',
          background: disabled ? '#f5f5f5' : '#fff',
          outline: 'none',
          cursor: disabled ? 'not-allowed' : 'pointer',
          boxSizing: 'border-box',
          width: '100%',
        }}
        onFocus={(e) => { e.target.style.borderColor = '#1976d2'; }}
        onBlur={(e) => { e.target.style.borderColor = '#c5cad3'; }}
      >
        {!selected && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {/* Chevron icon */}
      <span
        className="material-symbols-outlined"
        style={{
          position: 'absolute',
          right: 8,
          top: '50%',
          transform: 'translateY(-50%)',
          fontSize: 18,
          color: '#666',
          pointerEvents: 'none',
          lineHeight: 1,
        }}
      >
        expand_more
      </span>
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

  const width = 36;
  const height = 20;
  const knobSize = 14;
  const on = !!checked;

  return (
    <label
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        cursor: disabled ? 'not-allowed' : 'pointer',
        userSelect: 'none',
        flexShrink: 0,
      }}
      title={on ? 'Enabled' : 'Disabled'}
    >
      <input
        type="checkbox"
        name={name}
        checked={on}
        disabled={disabled}
        onChange={handleChange}
        style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
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
            left: on ? width - knobSize - 3 : 3,
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

/* ─── Default export for convenience ────────────────────────────────────── */
export default { FormInput, TextArea, SingleSelect, Chip, Toggle, Button };
