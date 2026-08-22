import React, { useState, useRef, useEffect } from 'react';
import { Button } from '../../../elemental-stubs';
import PlayArrowIcon from './icons/play_arrow.svg';
import '../../../Molecules/Conditions/Conditions.css';
import styles from './RHSHeader.module.css';

function HeaderMiniDropdown({
  value,
  options,
  onChange,
  ariaLabel,
  showSelectedLabel = false,
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div className="tc-dropdown" ref={ref} style={{ width: 'auto', flexShrink: 0 }}>
      <button
        type="button"
        className={`tc-dropdown__trigger${open ? ' tc-dropdown__trigger--open' : ''}`}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel ?? (selected ? selected.label : 'Select')}
        style={{
          minHeight: 0,
          height: 24,
          padding: showSelectedLabel ? '0 2px 0 6px' : '0 2px',
          gap: 2,
          border: 'none',
          background: 'none',
          boxShadow: 'none',
        }}
      >
        {showSelectedLabel && selected && (
          <span
            style={{
              fontSize: 12,
              lineHeight: '18px',
              letterSpacing: '-0.24px',
              color: '#9ca3af',
              fontFamily: '"Roboto", sans-serif',
              whiteSpace: 'nowrap',
            }}
          >
            {selected.label}
          </span>
        )}
        <span
          className="material-symbols-outlined"
          style={{
            fontSize: 16,
            width: 16,
            height: 16,
            lineHeight: 1,
            color: '#303030',
            fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 20",
          }}
        >
          expand_more
        </span>
      </button>
      {open && (
        <ul className="tc-dropdown__menu" role="listbox" style={{ minWidth: 120 }}>
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <li
                key={opt.value}
                role="option"
                aria-selected={isSelected}
                className={`tc-dropdown__option${isSelected ? ' tc-dropdown__option--selected' : ''}`}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
              >
                {opt.label}
                {isSelected && (
                  <span className="material-symbols-outlined tc-dropdown__check">check</span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default function RHSPanelHeader({
  title = 'Title',
  onPreview,
  onClose,
  onBack = undefined,
  showActions = true,
  showMoreMenu = false,
  /** Exploration LLM task: toggle Option 1 (body tabs) vs Option 2 (header Setup/Configure). */
  titleLayoutMenu = null,
  /** Option 2 only: Setup / Configure menu beside the layout picker. */
  titleTabMenu = null,
}) {
  const svgStyle = { width: 24, height: 24, display: 'block' };

  return (
    <div className={styles.header}>
      <div className={styles.headerLeft}>
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            aria-label="Back"
            className={styles.iconBtn}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
              <path d="M5.98854 10.6267L8.73215 13.3703C8.85608 13.4943 8.91724 13.6393 8.91565 13.8054C8.91403 13.9715 8.85287 14.1192 8.73215 14.2485C8.60288 14.3778 8.45438 14.4446 8.28665 14.4488C8.11892 14.4531 7.97042 14.3906 7.84115 14.2613L4.10877 10.529C3.95813 10.3783 3.88281 10.2026 3.88281 10.0017C3.88281 9.80088 3.95813 9.62514 4.10877 9.4745L7.84115 5.74212C7.96508 5.61819 8.11224 5.55703 8.28265 5.55862C8.45305 5.56024 8.60288 5.62567 8.73215 5.75494C8.85287 5.88421 8.91537 6.03058 8.91965 6.19404C8.92392 6.3575 8.86142 6.50386 8.73215 6.63312L5.98854 9.37675H15.7931C15.9704 9.37675 16.1189 9.43658 16.2386 9.55623C16.3582 9.67588 16.418 9.82438 16.418 10.0017C16.418 10.1791 16.3582 10.3276 16.2386 10.4472C16.1189 10.5669 15.9704 10.6267 15.7931 10.6267H5.98854Z" fill="currentColor"/>
            </svg>
          </button>
        )}
        <span className={styles.title}>{title}</span>
        {titleLayoutMenu && (
          <HeaderMiniDropdown
            value={titleLayoutMenu.value}
            options={titleLayoutMenu.options}
            onChange={titleLayoutMenu.onChange}
            ariaLabel="Task layout"
            showSelectedLabel
          />
        )}
        {titleTabMenu && (
          <HeaderMiniDropdown
            value={titleTabMenu.value}
            options={titleTabMenu.options}
            onChange={titleTabMenu.onChange}
            ariaLabel={titleTabMenu.value === 'setup' ? 'Task section: Setup' : 'Task section: Configure'}
          />
        )}
      </div>
      <div className={styles.headerRight}>
        {showMoreMenu && (
          <button
            type="button"
            aria-label="More actions"
            className={styles.iconBtn}
          >
            <span className={`material-symbols-outlined ${styles.iconGlyph}`}>more_vert</span>
          </button>
        )}
        {showActions && onPreview && (
          <Button
            type="link"
            customIcon={<img src={PlayArrowIcon} alt="" style={svgStyle} />}
            onClick={onPreview}
            noHover
            aria-label="Preview"
          />
        )}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className={styles.iconBtn}
        >
          <span className={`material-symbols-outlined ${styles.iconGlyph}`} aria-hidden>
            close
          </span>
        </button>
      </div>
    </div>
  );
}
