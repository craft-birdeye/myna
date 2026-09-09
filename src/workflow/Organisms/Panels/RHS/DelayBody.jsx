import React, { useState, useRef, useEffect, useLayoutEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { MultiSelect, SingleSelect } from '../../../elemental-stubs';
import { InfoTooltip } from '../../../../components/InfoTooltip/InfoTooltip';
import { MessageTemplateModal } from '../../../../components/MessageTemplateModal/MessageTemplateModal';
import { formatTemplateSelection } from '../../../../data/messageTemplateLibrary';
import { buildFixedMenuStyle } from '../../../menuPlacement';
import '../../../Molecules/Conditions/Conditions.css';
import styles from './DelayBody.module.css';

const font = '"Roboto", arial, sans-serif';

/** Option cards are two lines (label + example), so they need a taller row estimate than
 *  the shared single-line default — and a taller menu, since there are 8 of them. */
const DELAY_MENU_Z_INDEX = 5200;
const DELAY_MENU_OPTION_HEIGHT = 54;
const DELAY_MENU_MAX_HEIGHT = 420;
/** Month picker is a fixed-size panel, not a list — one "option" that tall. */
const CALENDAR_PANEL_HEIGHT = 300;

const DELAY_OPTIONS = [
  {
    value: 'set-time',
    label: 'Set amount of time',
    example: 'Example : Delay for 5 days',
  },
  {
    value: 'calendar-date',
    label: 'Calendar date',
    example: 'Example: Delay until March 15, 2026',
  },
  {
    value: 'date-property',
    label: 'Update in the date field',
    example: "Example: Delay until contact's last activity",
  },
  {
    value: 'day-of-week',
    label: 'Day of the week',
    example: 'Example: Delay until tuesday',
  },
  {
    value: 'time-of-day',
    label: 'Specific time of the day',
    example: 'Example: Delay until 5:00 PM IST',
  },
  {
    value: 'optimal-send-time',
    label: 'Optimal send time and day',
    example: 'Example: Delay until 5:00 PM IST',
  },
  {
    value: 'event-occurs',
    label: 'Event occurs',
    example: 'Example: Delay until 5:00 PM IST',
  },
  {
    value: 'dnd-window-end',
    label: 'DND window ends',
    example: 'Example: Delay until 5:00 PM IST',
  },
];

/** Shown for a node that has no saved amount yet — kept here so the panel's fields and
 *  `formatDelaySummary`'s card title can't drift apart. */
const DEFAULT_DURATION = '5';
const DEFAULT_UNIT = 'days';

/** "Delay for" amount picker — 1-30 covers the realistic minute/hour/day spans. */
const DELAY_AMOUNT_OPTIONS = Array.from({ length: 30 }, (_, i) => ({
  value: String(i + 1),
  label: String(i + 1),
}));

const TIME_UNIT_OPTIONS = [
  { value: 'minutes', label: 'Minutes' },
  { value: 'hours', label: 'Hours' },
  { value: 'days', label: 'Days' },
  { value: 'seconds', label: 'Seconds' },
];

const DAY_OF_WEEK_OPTIONS = [
  { value: 'monday', label: 'Monday' },
  { value: 'tuesday', label: 'Tuesday' },
  { value: 'wednesday', label: 'Wednesday' },
  { value: 'thursday', label: 'Thursday' },
  { value: 'friday', label: 'Friday' },
  { value: 'saturday', label: 'Saturday' },
  { value: 'sunday', label: 'Sunday' },
];

const DATE_PROPERTY_OPTIONS = [
  { value: 'last_activity', label: "Contact's last activity" },
  { value: 'created_at', label: 'Contact created date' },
  { value: 'appointment_date', label: 'Appointment date' },
  { value: 'follow_up_date', label: 'Follow-up date' },
];

/** "Contact submitted a review" event config. */
const REVIEW_SOURCE_OPTIONS = [
  { value: 'google', label: 'Google' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'yelp', label: 'Yelp' },
  { value: 'birdeye', label: 'Birdeye' },
  { value: 'direct_feedback', label: 'Direct feedback' },
];

const REVIEW_RATING_OPTIONS = Array.from({ length: 5 }, (_, i) => ({
  value: String(i + 1),
  label: String(i + 1),
}));

/** "Contact completed a survey" event config. */
const SURVEY_OPTIONS = [
  { value: 'post_visit_satisfaction', label: 'Post-visit satisfaction' },
  { value: 'nps', label: 'NPS survey' },
  { value: 'service_feedback', label: 'Service feedback' },
  { value: 'appointment_follow_up', label: 'Appointment follow-up' },
  { value: 'onboarding_experience', label: 'Onboarding experience' },
];

/** Email-delivery events — all four share the same template + timeout config. */
const EMAIL_TEMPLATE_EVENTS = ['email_sent', 'email_delivered', 'email_opened', 'email_link_clicked'];

/** Events the delay can wait on. Each will grow its own follow-up config, one at a time. */
const EVENT_OPTIONS = [
  { value: 'review_submitted', label: 'Contact submitted a review' },
  { value: 'survey_completed', label: 'Contact completed a survey' },
  { value: 'email_sent', label: 'Email sent' },
  { value: 'email_delivered', label: 'Email delivered' },
  { value: 'email_opened', label: 'Email opened' },
  { value: 'email_link_clicked', label: 'Link is clicked on an email' },
  { value: 'tickets_closed', label: 'All tickets closed for contact' },
  { value: 'email_text_link_clicked', label: 'Link is clicked on an email/text' },
];

/** "Time" row for the Calendar date option — hour / minute / meridiem, as in the design. */
const HOUR_OPTIONS = Array.from({ length: 12 }, (_, i) => {
  const h = String(i + 1).padStart(2, '0');
  return { value: h, label: h };
});
const MINUTE_OPTIONS = Array.from({ length: 60 }, (_, i) => {
  const m = String(i).padStart(2, '0');
  return { value: m, label: m };
});
const MERIDIEM_OPTIONS = [
  { value: 'AM', label: 'AM' },
  { value: 'PM', label: 'PM' },
];

/** Optimal send time and day — what the model is allowed to optimise. */
const AI_CONSIDERATION_OPTIONS = [
  {
    key: 'bestDayToSend',
    label: 'Best day to send',
    info: "Picks the weekday this contact is most likely to engage on, based on their past activity.",
  },
  {
    key: 'bestTimeToSend',
    label: 'Best time to send',
    info: "Picks the time of day this contact is most likely to engage at, based on their past activity.",
  },
];

/** Date field option — when to fire relative to the field's date, and which time to use. */
const DATE_OFFSET_OPTIONS = [
  { value: 'on', label: 'On date' },
  { value: 'before', label: 'Before date' },
  { value: 'after', label: 'After date' },
];

const DATE_TIME_MODE_OPTIONS = [
  { value: 'field', label: 'Use the time from the date field' },
  { value: 'custom', label: 'Select a custom time' },
];

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const WEEKDAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

/** 'YYYY-MM-DD' (native date input) -> 'March 15, 2026'. */
function formatCalendarDate(value) {
  const [y, m, d] = String(value || '').split('-').map(Number);
  if (!y || !m || !d || m > 12) return '';
  return `${MONTHS[m - 1]} ${d}, ${y}`;
}

/** 'HH:MM' (the native time input this panel used to render) -> the three picker parts. */
function splitClockTime(value) {
  const [h, min] = String(value || '').split(':').map(Number);
  if (Number.isNaN(h)) return null;
  return {
    hour: String(h % 12 === 0 ? 12 : h % 12).padStart(2, '0'),
    minute: String(Number.isNaN(min) ? 0 : min).padStart(2, '0'),
    meridiem: h >= 12 ? 'PM' : 'AM',
  };
}

/** Picker parts -> '6:18 PM'; empty until all three are set. */
function formatTimeParts(hour, minute, meridiem) {
  if (!hour || !minute || !meridiem) return '';
  return `${Number(hour)}:${minute} ${meridiem}`;
}

/** The panel has no timezone field yet, so the card states the business default. */
const DELAY_TIMEZONE = 'PST';

/** '2:50 PM PST', or nothing while the time row is incomplete. */
function formatTimeWithZone(hour, minute, meridiem) {
  const time = formatTimeParts(hour, minute, meridiem);
  return time ? `${time} ${DELAY_TIMEZONE}` : '';
}

/** The same stamp as a trailing clause: ' at 2:50 PM PST'. */
function atTimeClause(hour, minute, meridiem) {
  const stamp = formatTimeWithZone(hour, minute, meridiem);
  return stamp ? ` at ${stamp}` : '';
}

/** Lowercases a label for mid-sentence use, leaving acronyms/proper nouns alone. */
function midSentence(label) {
  if (!label) return '';
  return /^[A-Z]{2,}/.test(label) ? label : label.charAt(0).toLowerCase() + label.slice(1);
}

const optionLabel = (options, value) => options.find((o) => o.value === value)?.label || '';

/**
 * ['sunday','monday'] -> 'Sunday or Monday' — the delay fires on whichever lands first, so
 * the days read as alternatives. Listed in the order they were picked. Used for the canvas
 * card title, which has room for the full list.
 */
export function formatDayList(days) {
  const labels = (Array.isArray(days) ? days : [days])
    .filter(Boolean)
    .map((d) => optionLabel(DAY_OF_WEEK_OPTIONS, d))
    .filter(Boolean);
  if (labels.length === 0) return '';
  if (labels.length === 1) return labels[0];
  return `${labels.slice(0, -1).join(', ')} or ${labels[labels.length - 1]}`;
}

/** Field label: a single day reads by name, several collapse to "2 selected", the whole
 *  week to "All selected". */
function formatDaysTriggerLabel(days) {
  const list = Array.isArray(days) ? days : [days].filter(Boolean);
  if (list.length === 0) return '';
  if (list.length === 1) return formatDayList(list);
  if (list.length >= DAY_OF_WEEK_OPTIONS.length) return 'All selected';
  return `${list.length} selected`;
}

/**
 * Human summary of a delay node's config, used as the canvas card's title so the card
 * reflects what was configured (e.g. "Delay for 5 days") once the panel is saved.
 * Falls back to the option's generic phrasing while its required value is still empty.
 */
export function formatDelaySummary(details = {}) {
  const option = details.delayOption || 'set-time';

  switch (option) {
    case 'set-time': {
      const amount = String(details.duration ?? '').trim() || DEFAULT_DURATION;
      const unit = midSentence(optionLabel(TIME_UNIT_OPTIONS, details.unit || DEFAULT_UNIT));
      return `Delay for ${amount} ${amount === '1' ? unit.replace(/s$/, '') : unit}`;
    }
    case 'calendar-date': {
      const date = formatCalendarDate(details.calendarDate);
      if (!date) return 'Delay until a calendar date';
      return `Delay until ${date}${atTimeClause(details.calendarHour, details.calendarMinute, details.calendarMeridiem)}`;
    }
    case 'date-property': {
      const prop = midSentence(optionLabel(DATE_PROPERTY_OPTIONS, details.dateProperty));
      if (!prop) return 'Delay until a date field updates';
      const offset = details.dateOffset === 'before' || details.dateOffset === 'after'
        ? `${details.dateOffset} `
        : '';
      const customTime = details.dateTimeMode === 'custom'
        ? atTimeClause(details.propertyHour, details.propertyMinute, details.propertyMeridiem)
        : '';
      return `Delay until ${offset}${prop}${customTime}`;
    }
    case 'day-of-week': {
      const days = formatDayList(details.dayOfWeek);
      if (!days) return 'Delay until a day of the week';
      return `Delay until ${days}${atTimeClause(details.dayHour, details.dayMinute, details.dayMeridiem)}`;
    }
    case 'time-of-day': {
      const legacy = splitClockTime(details.timeOfDay);
      const stamp = formatTimeWithZone(
        details.timeHour ?? legacy?.hour,
        details.timeMinute ?? legacy?.minute,
        details.timeMeridiem ?? legacy?.meridiem,
      );
      return stamp ? `Delay until ${stamp}` : 'Delay until a specific time of the day';
    }
    case 'optimal-send-time': {
      const { bestDayToSend: day, bestTimeToSend: time } = details;
      if (day && time) return 'Delay until best day and time to send';
      if (day) return 'Delay until best day to send';
      if (time) return 'Delay until best time to send';
      return 'Delay until optimal send time';
    }
    case 'event-occurs': {
      const event = midSentence(optionLabel(EVENT_OPTIONS, details.eventType));
      return event ? `Delay until ${event}` : 'Delay until an event occurs';
    }
    case 'dnd-window-end':
      return 'Delay until DND window ends';
    default:
      return '';
  }
}

function FieldLabel({ label, required }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <span style={{
        fontSize: 12,
        fontWeight: 400,
        lineHeight: '18px',
        letterSpacing: '-0.24px',
        color: '#212121',
        fontFamily: font,
      }}>
        {label}
      </span>
      {required && (
        <span style={{ fontSize: 12, lineHeight: '18px', color: '#de1b0c', fontFamily: font }}>*</span>
      )}
    </div>
  );
}

function DelayNote({ children }) {
  return <div className={styles.delayNote}>{children}</div>;
}

/** Hour / minute / meridiem selects — shared by the Calendar date and Date field options. */
function TimeSelectRow({ name, hour, minute, meridiem, onPartChange, disabled }) {
  const parts = [
    { key: 'Hour', value: hour, options: HOUR_OPTIONS, placeholder: '06' },
    { key: 'Minute', value: minute, options: MINUTE_OPTIONS, placeholder: '18' },
    { key: 'Meridiem', value: meridiem, options: MERIDIEM_OPTIONS, placeholder: 'PM' },
  ];

  return (
    <div style={{ display: 'flex', gap: 12 }}>
      {parts.map((part) => (
        <div key={part.key} style={{ flex: 1, minWidth: 0 }}>
          <SingleSelect
            name={`${name}${part.key}`}
            selected={part.value}
            options={part.options}
            onChange={(opt) => onPartChange(part.key.toLowerCase(), opt.value)}
            placeholder={part.placeholder}
            disabled={disabled}
            portalMenu
          />
        </div>
      ))}
    </div>
  );
}

/** "Delay for" amount + unit pair — shared by the Set amount of time and Event options. */
function DelayForField({ amount, amountOptions, unit, onAmountChange, onUnitChange, disabled }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <FieldLabel label="Delay for" required />
      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <SingleSelect
            name="unitValue"
            selected={amount}
            options={amountOptions}
            onChange={(opt) => onAmountChange(opt.value)}
            placeholder="Select"
            disabled={disabled}
            portalMenu
          />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <SingleSelect
            name="timeUnit"
            selected={unit}
            options={TIME_UNIT_OPTIONS}
            onChange={(opt) => onUnitChange(opt.value)}
            placeholder="Select"
            disabled={disabled}
            portalMenu
          />
        </div>
      </div>
    </div>
  );
}

/**
 * Template field — the shared `tc-dropdown` trigger chrome, but clicking it opens
 * `MessageTemplateModal` (thumbnails + categories + search) instead of a menu, since a
 * library of 200+ templates doesn't browse well in a dropdown.
 */
function TemplateField({ label, value, kind, onOpen, disabled }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <FieldLabel label={label} required />
      <div className="tc-dropdown">
        <button
          type="button"
          className={`tc-dropdown__trigger${disabled ? ' tc-dropdown__trigger--readonly' : ''}`}
          onClick={() => { if (!disabled) onOpen(); }}
          aria-haspopup="dialog"
          disabled={disabled}
        >
          <span className={`tc-dropdown__value${value?.length ? '' : ' tc-dropdown__value--placeholder'}`}>
            {formatTemplateSelection(kind, value) || 'Select'}
          </span>
          <span className="material-symbols-outlined tc-dropdown__chevron">expand_more</span>
        </button>
      </div>
    </div>
  );
}

/** Grey callout offering a fallback branch when the event doesn't complete in time. */
function BranchCallout({ checked, onChange, disabled }) {
  return (
    <DelayNote>
      If the event isn&apos;t completed, add a branch to send these contacts to another set of actions.
      <label className={styles.noteCheckbox}>
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
        />
        <span>Yes, add a branch</span>
      </label>
    </DelayNote>
  );
}

/** Radio group — `inline` lays the options out in a row (On / Before / After date). */
function RadioGroup({ name, value, options, onChange, disabled, inline = false }) {
  return (
    <div className={inline ? styles.radioRowInline : styles.radioRowStacked}>
      {options.map((opt) => (
        <label key={opt.value} className={styles.radioOption}>
          <input
            type="radio"
            name={name}
            value={opt.value}
            checked={value === opt.value}
            onChange={() => onChange(opt.value)}
            disabled={disabled}
          />
          <span>{opt.label}</span>
        </label>
      ))}
    </div>
  );
}

/** 'YYYY-MM-DD' -> { year, month (0-based), day }. */
function parseISODate(value) {
  const [y, m, d] = String(value || '').split('-').map(Number);
  if (!y || !m || !d || m > 12) return null;
  return { year: y, month: m - 1, day: d };
}

const toISODate = (year, month, day) =>
  `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

/**
 * Date field for the Calendar date option — the shared `tc-dropdown` trigger chrome over a
 * body-portaled month picker. `DatePickerModal` (the Tailwind screen-level one) isn't a fit
 * here: it's 560px of preset lists / time slots at `z-index: 130`, so it would both overflow
 * the 390px panel and stack under the builder.
 */
function DateField({ value, onChange, disabled }) {
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState(null);
  const ref = useRef(null);
  const panelRef = useRef(null);

  const selected = parseISODate(value);
  const [view, setView] = useState(() => {
    const today = new Date();
    return selected
      ? { year: selected.year, month: selected.month }
      : { year: today.getFullYear(), month: today.getMonth() };
  });

  useEffect(() => {
    if (!open || disabled) return undefined;
    const handler = (e) => {
      if (ref.current?.contains(e.target) || panelRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, disabled]);

  useLayoutEffect(() => {
    if (!open || disabled || !ref.current) return undefined;
    const updatePlacement = () => {
      setMenuStyle(
        buildFixedMenuStyle(ref.current, 1, DELAY_MENU_Z_INDEX, {
          optionHeight: CALENDAR_PANEL_HEIGHT,
          maxHeight: CALENDAR_PANEL_HEIGHT,
        }),
      );
    };
    updatePlacement();
    window.addEventListener('resize', updatePlacement);
    window.addEventListener('scroll', updatePlacement, true);
    return () => {
      window.removeEventListener('resize', updatePlacement);
      window.removeEventListener('scroll', updatePlacement, true);
    };
  }, [open, disabled]);

  const shiftMonth = (delta) => {
    setView((prev) => {
      const next = new Date(prev.year, prev.month + delta, 1);
      return { year: next.getFullYear(), month: next.getMonth() };
    });
  };

  const leadingBlanks = new Date(view.year, view.month, 1).getDay();
  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();

  const panel = open && menuStyle
    ? createPortal(
      <div ref={panelRef} className={styles.calendarPanel} style={menuStyle}>
        <div className={styles.calendarHeader}>
          <button type="button" className={styles.calendarNav} onClick={() => shiftMonth(-1)} aria-label="Previous month">
            <span className="material-symbols-outlined">chevron_left</span>
          </button>
          <span className={styles.calendarMonth}>{`${MONTHS[view.month]} ${view.year}`}</span>
          <button type="button" className={styles.calendarNav} onClick={() => shiftMonth(1)} aria-label="Next month">
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
        </div>
        <div className={styles.calendarGrid}>
          {WEEKDAY_LABELS.map((d) => (
            <div key={d} className={styles.calendarWeekday}>{d}</div>
          ))}
          {Array.from({ length: leadingBlanks }, (_, i) => (
            <div key={`blank-${i}`} className={styles.calendarBlank} />
          ))}
          {Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1;
            const isSelected = selected
              && selected.year === view.year
              && selected.month === view.month
              && selected.day === day;
            return (
              <button
                key={day}
                type="button"
                className={`${styles.calendarDay}${isSelected ? ` ${styles.calendarDaySelected}` : ''}`}
                onClick={() => { onChange(toISODate(view.year, view.month, day)); setOpen(false); }}
              >
                {day}
              </button>
            );
          })}
        </div>
      </div>,
      document.body,
    )
    : null;

  const label = formatCalendarDate(value);

  return (
    <div className="tc-dropdown" ref={ref}>
      <button
        type="button"
        className={`tc-dropdown__trigger${open ? ' tc-dropdown__trigger--open' : ''}${disabled ? ' tc-dropdown__trigger--readonly' : ''}`}
        onClick={() => { if (!disabled) setOpen((o) => !o); }}
        aria-haspopup="dialog"
        aria-expanded={open}
        disabled={disabled}
      >
        <span className={`tc-dropdown__value${!label ? ' tc-dropdown__value--placeholder' : ''}`}>
          {label || 'Select'}
        </span>
        <span className="material-symbols-outlined tc-dropdown__chevron">expand_more</span>
      </button>
      {panel}
    </div>
  );
}

function DelayOptionDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState(null);
  const ref = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const handler = (e) => {
      // The menu is portaled to <body>, so a click on an option is NOT inside the
      // trigger wrapper — check both, or picking an option would close first and swallow it.
      if (ref.current?.contains(e.target) || menuRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Anchor the portaled menu to the trigger; the RHS body scrolls, so re-measure.
  useLayoutEffect(() => {
    if (!open || !ref.current) return undefined;
    const updatePlacement = () => {
      setMenuStyle(
        buildFixedMenuStyle(ref.current, DELAY_OPTIONS.length, DELAY_MENU_Z_INDEX, {
          optionHeight: DELAY_MENU_OPTION_HEIGHT,
          maxHeight: DELAY_MENU_MAX_HEIGHT,
        }),
      );
    };
    updatePlacement();
    window.addEventListener('resize', updatePlacement);
    window.addEventListener('scroll', updatePlacement, true);
    return () => {
      window.removeEventListener('resize', updatePlacement);
      window.removeEventListener('scroll', updatePlacement, true);
    };
  }, [open]);

  const selected = DELAY_OPTIONS.find((o) => o.value === value);

  const menu = open && menuStyle
    ? createPortal(
      <div
        ref={menuRef}
        className={`tc-dropdown__menu tc-dropdown__menu--portaled ${styles.delayMenu}`}
        style={menuStyle}
        role="listbox"
      >
        {DELAY_OPTIONS.map((opt) => {
          const isSelected = opt.value === value;
          return (
            <div
              key={opt.value}
              role="option"
              aria-selected={isSelected}
              className={`tc-dropdown__option ${styles.delayOption}${isSelected ? ' tc-dropdown__option--selected' : ''}`}
              onClick={() => { onChange(opt.value); setOpen(false); }}
            >
              <div className={styles.delayOptionText}>
                <div className={styles.delayOptionLabel}>{opt.label}</div>
                <div className={styles.delayOptionExample}>{opt.example}</div>
              </div>
              {isSelected && (
                <span className="material-symbols-outlined tc-dropdown__check">check</span>
              )}
            </div>
          );
        })}
      </div>,
      document.body,
    )
    : null;

  return (
    <div className="tc-dropdown" ref={ref}>
      <button
        type="button"
        className={`tc-dropdown__trigger${open ? ' tc-dropdown__trigger--open' : ''}`}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={`tc-dropdown__value${!selected ? ' tc-dropdown__value--placeholder' : ''}`}>
          {selected ? selected.label : 'Select delay option'}
        </span>
        <span className="material-symbols-outlined tc-dropdown__chevron">expand_more</span>
      </button>

      {menu}
    </div>
  );
}

export default function DelayBody({ initialValues = {}, onFieldChange, viewOnly = false }) {
  const [delayOption, setDelayOption] = useState(initialValues.delayOption ?? 'set-time');
  const [timeUnit, setTimeUnit] = useState(initialValues.unit || DEFAULT_UNIT);
  const [unitValue, setUnitValue] = useState(
    initialValues.duration != null && initialValues.duration !== ''
      ? String(initialValues.duration)
      : DEFAULT_DURATION,
  );
  const [calendarDate, setCalendarDate] = useState(initialValues.calendarDate ?? '');
  const [calendarTime, setCalendarTime] = useState({
    hour: initialValues.calendarHour ?? '',
    minute: initialValues.calendarMinute ?? '',
    meridiem: initialValues.calendarMeridiem ?? '',
  });
  const [addBranch, setAddBranch] = useState(initialValues.addBranch ?? true);
  const [dateOffset, setDateOffset] = useState(initialValues.dateOffset ?? 'on');
  const [dateTimeMode, setDateTimeMode] = useState(initialValues.dateTimeMode ?? 'field');
  const [propertyTime, setPropertyTime] = useState({
    hour: initialValues.propertyHour ?? '',
    minute: initialValues.propertyMinute ?? '',
    meridiem: initialValues.propertyMeridiem ?? '',
  });
  const [dayTime, setDayTime] = useState({
    hour: initialValues.dayHour ?? '',
    minute: initialValues.dayMinute ?? '',
    meridiem: initialValues.dayMeridiem ?? '',
  });
  const [dateProperty, setDateProperty] = useState(initialValues.dateProperty ?? '');
  // Multi-select now ("Days"), so tolerate a single saved day from the earlier single-select.
  const [dayOfWeek, setDayOfWeek] = useState(() => {
    const saved = initialValues.dayOfWeek;
    if (Array.isArray(saved)) return saved;
    return saved ? [saved] : [];
  });
  // Three-part picker now; migrate a node saved by the old native time input ('17:00').
  const [timeOfDay, setTimeOfDay] = useState(() => {
    const legacy = splitClockTime(initialValues.timeOfDay);
    return {
      hour: initialValues.timeHour ?? legacy?.hour ?? '',
      minute: initialValues.timeMinute ?? legacy?.minute ?? '',
      meridiem: initialValues.timeMeridiem ?? legacy?.meridiem ?? '',
    };
  });
  const [eventType, setEventType] = useState(initialValues.eventType ?? '');
  const [aiConsiderations, setAiConsiderations] = useState({
    bestDayToSend: Boolean(initialValues.bestDayToSend),
    bestTimeToSend: Boolean(initialValues.bestTimeToSend),
  });
  const [reviewSource, setReviewSource] = useState(initialValues.reviewSource ?? 'google');
  const [reviewRating, setReviewRating] = useState(initialValues.reviewRating ?? '4');
  const [surveyId, setSurveyId] = useState(initialValues.surveyId ?? '');
  // Multi-select: a list of template ids (tolerates a single saved id from the earlier picker).
  const asIdList = (saved) => (Array.isArray(saved) ? saved : saved ? [saved] : []);
  const [emailTemplate, setEmailTemplate] = useState(() => asIdList(initialValues.emailTemplate));
  const [textTemplate, setTextTemplate] = useState(() => asIdList(initialValues.textTemplate));
  /** null | 'email' | 'text' — which template library the picker is showing. */
  const [templatePicker, setTemplatePicker] = useState(null);

  // A saved node can carry an amount outside the 1-30 picker (e.g. a 48-hour delay) — keep it
  // selectable instead of falling back to the placeholder.
  const amountOptions = useMemo(() => {
    if (unitValue && !DELAY_AMOUNT_OPTIONS.some((o) => o.value === unitValue)) {
      return [{ value: unitValue, label: unitValue }, ...DELAY_AMOUNT_OPTIONS];
    }
    return DELAY_AMOUNT_OPTIONS;
  }, [unitValue]);

  const handleDelayOptionChange = (val) => {
    setDelayOption(val);
    onFieldChange?.('delayOption', val);
  };

  /** Commits one part of a time row, saved as e.g. `calendarHour` / `propertyMeridiem`. */
  const makeTimeChangeHandler = (setTime, keyPrefix) => (part, value) => {
    setTime((prev) => ({ ...prev, [part]: value }));
    onFieldChange?.(`${keyPrefix}${part.charAt(0).toUpperCase()}${part.slice(1)}`, value);
  };
  const handleCalendarTimeChange = makeTimeChangeHandler(setCalendarTime, 'calendar');
  const handlePropertyTimeChange = makeTimeChangeHandler(setPropertyTime, 'property');
  const handleTimeOfDayChange = makeTimeChangeHandler(setTimeOfDay, 'time');
  const handleDayTimeChange = makeTimeChangeHandler(setDayTime, 'day');

  const handleAiConsiderationChange = (key, checked) => {
    setAiConsiderations((prev) => ({ ...prev, [key]: checked }));
    onFieldChange?.(key, checked);
  };

  const handleAmountChange = (val) => { setUnitValue(val); onFieldChange?.('duration', val); };
  const handleUnitChange = (val) => { setTimeUnit(val); onFieldChange?.('unit', val); };
  const handleAddBranchChange = (checked) => { setAddBranch(checked); onFieldChange?.('addBranch', checked); };

  const handleTemplatesChange = (ids) => {
    if (templatePicker === 'text') {
      setTextTemplate(ids);
      onFieldChange?.('textTemplate', ids);
    } else {
      setEmailTemplate(ids);
      onFieldChange?.('emailTemplate', ids);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Delay options */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <FieldLabel label="Delay until" required />
        <DelayOptionDropdown
          value={delayOption}
          onChange={handleDelayOptionChange}
        />
      </div>

      {/* Conditional fields */}
      {delayOption === 'set-time' && (
        <DelayForField
          amount={unitValue}
          amountOptions={amountOptions}
          unit={timeUnit}
          onAmountChange={handleAmountChange}
          onUnitChange={handleUnitChange}
          disabled={viewOnly}
        />
      )}

      {delayOption === 'calendar-date' && (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <FieldLabel label="Date" required />
            <DateField
              value={calendarDate}
              onChange={(val) => { setCalendarDate(val); onFieldChange?.('calendarDate', val); }}
              disabled={viewOnly}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <FieldLabel label="Time" required />
            <TimeSelectRow
              name="calendar"
              hour={calendarTime.hour}
              minute={calendarTime.minute}
              meridiem={calendarTime.meridiem}
              onPartChange={handleCalendarTimeChange}
              disabled={viewOnly}
            />
          </div>

          <BranchCallout checked={addBranch} onChange={handleAddBranchChange} disabled={viewOnly} />
        </>
      )}

      {delayOption === 'date-property' && (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <FieldLabel label="Date field" required />
            <SingleSelect
              name="dateProperty"
              selected={dateProperty}
              options={DATE_PROPERTY_OPTIONS}
              onChange={(opt) => { setDateProperty(opt.value); onFieldChange?.('dateProperty', opt.value); }}
              placeholder="Select"
              disabled={viewOnly}
              portalMenu
            />
          </div>

          <RadioGroup
            inline
            name="dateOffset"
            value={dateOffset}
            options={DATE_OFFSET_OPTIONS}
            onChange={(val) => { setDateOffset(val); onFieldChange?.('dateOffset', val); }}
            disabled={viewOnly}
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <FieldLabel label="Time" required />
            <RadioGroup
              name="dateTimeMode"
              value={dateTimeMode}
              options={DATE_TIME_MODE_OPTIONS}
              onChange={(val) => { setDateTimeMode(val); onFieldChange?.('dateTimeMode', val); }}
              disabled={viewOnly}
            />
            {dateTimeMode === 'custom' && (
              <TimeSelectRow
                name="property"
                hour={propertyTime.hour}
                minute={propertyTime.minute}
                meridiem={propertyTime.meridiem}
                onPartChange={handlePropertyTimeChange}
                disabled={viewOnly}
              />
            )}
          </div>
        </>
      )}

      {delayOption === 'day-of-week' && (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <FieldLabel label="Days" required />
            <MultiSelect
              name="dayOfWeek"
              selected={dayOfWeek}
              options={DAY_OF_WEEK_OPTIONS}
              onChange={(next) => { setDayOfWeek(next); onFieldChange?.('dayOfWeek', next); }}
              formatLabel={formatDaysTriggerLabel}
              selectAllLabel="Select all"
              placeholder="Select"
              disabled={viewOnly}
              portalMenu
            />
          </div>

          {dayOfWeek.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <FieldLabel label="Time" required />
              <TimeSelectRow
                name="day"
                hour={dayTime.hour}
                minute={dayTime.minute}
                meridiem={dayTime.meridiem}
                onPartChange={handleDayTimeChange}
                disabled={viewOnly}
              />
            </div>
          )}
        </>
      )}

      {delayOption === 'time-of-day' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <FieldLabel label="Time" required />
          <TimeSelectRow
            name="time"
            hour={timeOfDay.hour}
            minute={timeOfDay.minute}
            meridiem={timeOfDay.meridiem}
            onPartChange={handleTimeOfDayChange}
            disabled={viewOnly}
          />
        </div>
      )}

      {delayOption === 'optimal-send-time' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <FieldLabel label="AI considerations" />
          <div className={styles.checkboxStack}>
            {AI_CONSIDERATION_OPTIONS.map((opt) => (
              <label key={opt.key} className={styles.checkboxOption}>
                <input
                  type="checkbox"
                  checked={Boolean(aiConsiderations[opt.key])}
                  onChange={(e) => handleAiConsiderationChange(opt.key, e.target.checked)}
                  disabled={viewOnly}
                />
                <span>{opt.label}</span>
                <InfoTooltip text={opt.info} />
              </label>
            ))}
          </div>
        </div>
      )}

      {delayOption === 'event-occurs' && (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <FieldLabel label="Event" required />
            <SingleSelect
              name="eventType"
              selected={eventType}
              options={EVENT_OPTIONS}
              onChange={(opt) => { setEventType(opt.value); onFieldChange?.('eventType', opt.value); }}
              placeholder="Select"
              disabled={viewOnly}
              portalMenu
              searchable
              menuHeader="Select events"
            />
          </div>

          {eventType === 'review_submitted' && (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <FieldLabel label="Review source" required />
                <SingleSelect
                  name="reviewSource"
                  selected={reviewSource}
                  options={REVIEW_SOURCE_OPTIONS}
                  onChange={(opt) => { setReviewSource(opt.value); onFieldChange?.('reviewSource', opt.value); }}
                  placeholder="Select"
                  disabled={viewOnly}
                  portalMenu
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <FieldLabel label="Review rating" required />
                <SingleSelect
                  name="reviewRating"
                  selected={reviewRating}
                  options={REVIEW_RATING_OPTIONS}
                  onChange={(opt) => { setReviewRating(opt.value); onFieldChange?.('reviewRating', opt.value); }}
                  placeholder="Select"
                  disabled={viewOnly}
                  portalMenu
                />
              </div>

              <DelayForField
                amount={unitValue}
                amountOptions={amountOptions}
                unit={timeUnit}
                onAmountChange={handleAmountChange}
                onUnitChange={handleUnitChange}
                disabled={viewOnly}
              />

              <BranchCallout checked={addBranch} onChange={handleAddBranchChange} disabled={viewOnly} />
            </>
          )}

          {eventType === 'survey_completed' && (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <FieldLabel label="Survey" required />
                <SingleSelect
                  name="surveyId"
                  selected={surveyId}
                  options={SURVEY_OPTIONS}
                  onChange={(opt) => { setSurveyId(opt.value); onFieldChange?.('surveyId', opt.value); }}
                  placeholder="Select survey"
                  disabled={viewOnly}
                  portalMenu
                />
              </div>

              <DelayForField
                amount={unitValue}
                amountOptions={amountOptions}
                unit={timeUnit}
                onAmountChange={handleAmountChange}
                onUnitChange={handleUnitChange}
                disabled={viewOnly}
              />

              <BranchCallout checked={addBranch} onChange={handleAddBranchChange} disabled={viewOnly} />
            </>
          )}

          {EMAIL_TEMPLATE_EVENTS.includes(eventType) && (
            <>
              <TemplateField
                label="Email template"
                kind="email"
                value={emailTemplate}
                onOpen={() => setTemplatePicker('email')}
                disabled={viewOnly}
              />

              <DelayForField
                amount={unitValue}
                amountOptions={amountOptions}
                unit={timeUnit}
                onAmountChange={handleAmountChange}
                onUnitChange={handleUnitChange}
                disabled={viewOnly}
              />
            </>
          )}

          {eventType === 'email_text_link_clicked' && (
            <>
              <TemplateField
                label="Email template"
                kind="email"
                value={emailTemplate}
                onOpen={() => setTemplatePicker('email')}
                disabled={viewOnly}
              />

              <TemplateField
                label="Text template"
                kind="text"
                value={textTemplate}
                onOpen={() => setTemplatePicker('text')}
                disabled={viewOnly}
              />

              <DelayForField
                amount={unitValue}
                amountOptions={amountOptions}
                unit={timeUnit}
                onAmountChange={handleAmountChange}
                onUnitChange={handleUnitChange}
                disabled={viewOnly}
              />
            </>
          )}

          {/* Nothing to scope — the event is the contact's own tickets, so just the timeout. */}
          {eventType === 'tickets_closed' && (
            <DelayForField
              amount={unitValue}
              amountOptions={amountOptions}
              unit={timeUnit}
              onAmountChange={handleAmountChange}
              onUnitChange={handleUnitChange}
              disabled={viewOnly}
            />
          )}
        </>
      )}

      {delayOption === 'dnd-window-end' && (
        <DelayNote>
          Delivery will resume as soon as the contact's do-not-disturb window ends.
        </DelayNote>
      )}

      <MessageTemplateModal
        open={templatePicker !== null}
        kind={templatePicker ?? 'text'}
        selected={templatePicker === 'text' ? textTemplate : emailTemplate}
        onClose={() => setTemplatePicker(null)}
        onChange={handleTemplatesChange}
      />
    </div>
  );
}
