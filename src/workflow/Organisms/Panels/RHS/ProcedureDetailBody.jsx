import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { EmptyHintField } from '../../../../components/EmptyHintField/EmptyHintField';
import { Icon } from '../../../../components/Icon/Icon';
import { serializeRichFrom, deserializeRichInto, insertChipAt } from '../../../Molecules/Inputs/promptChipHelpers.js';
import '../../../Molecules/Inputs/prompt-chip.css';
import StepsEditorToolbar from '../../../Molecules/Inputs/StepsEditorToolbar/StepsEditorToolbar.jsx';
import { ToolSlashMenu, getCaretAnchor } from '../../../Molecules/Inputs/ToolSlashMenu/ToolSlashMenu';
import UserPromptInput from '../../../Molecules/Inputs/UserPromptInput/UserPromptInput.jsx';
import VariableChip, { CHIP_TYPES, DataTypeIcon, ProcedureBookIcon } from '../../../Molecules/Inputs/VariableChip/VariableChip';
import chipStyles from '../../../Molecules/Inputs/VariableChip/VariableChip.module.css';
import etStyles from './EntityTaskBody.module.css';
import llmStyles from './LLMTaskBody.module.css';
import styles from './ProcedureDetailBody.module.css';

const FIELD_SHELL = 'rounded-sm border border-border-input bg-surface transition-colors hover:border-border focus-within:!border-primary';
const TITLE_SHELL = `h-10 ${FIELD_SHELL}`;
const STEPS_CREATE_PLACEHOLDER = 'Start writing steps. Type / to insert a tool, or add fields and procedures.';
const STEPS_CREATE_MIN_HEIGHT = 214;

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

/* ── Token → chip type resolver ── */
// Known token names → VariableChip type suffix (matches chipStyles class names).
// 'variable' = default (blue bracket DataTypeIcon, no suffix).
const KNOWN_TOKENS = {
  'agent_turn':                  'tool',
  'Intent identifier':           'tool',
  'Transfer_call':               'tool',
  'Initiate voice call':         'tool',
  'End_conversation':            'tool',
  'Escalate_to_staff':           'tool',
  'escalate_to_staff':           'tool',
  'End conversation':            'product',   // procedure
  'Close_session':               'product',   // procedure
  'close_session':               'product',
  'Talk to Human':               'product',   // procedure
  'Appointment_Management_agent':'address',   // subagent
  'appointment_management_agent':'address',
};

function resolveTokenType(label) {
  if (KNOWN_TOKENS[label]) return KNOWN_TOKENS[label];
  // Heuristic: lowercase_underscore names → tool; ends in _agent → subagent
  if (/_agent$/i.test(label)) return 'address';
  if (/^[a-z][a-z0-9_]+$/.test(label)) return 'tool';
  // Contains '=' → field/variable
  if (label.includes('=')) return 'variable';
  // Default → variable (blue bracket)
  return 'variable';
}

/* ── Hover tooltip for section-label info icons ── */
function SectionInfoIcon({ tooltip }) {
  const [pos, setPos] = useState(null);
  const ref = useRef(null);

  function show() {
    if (!tooltip || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    setPos({ x: rect.left + rect.width / 2, y: rect.top - 8 });
  }

  return (
    <span ref={ref} className="inline-flex items-center" onMouseEnter={show} onMouseLeave={() => setPos(null)}>
      <span className={`material-symbols-outlined ${etStyles.sectionLabelIcon}`}>info</span>
      {pos && tooltip && createPortal(
        <div
          className="pointer-events-none fixed z-[120] w-max max-w-[280px] rounded-sm bg-[#212121] px-sm py-xs text-small text-white shadow-dropdown"
          style={{ left: pos.x, top: pos.y, transform: 'translate(-50%, -100%)' }}
        >
          {tooltip}
        </div>,
        document.body,
      )}
    </span>
  );
}

/* ── Inline chip renderer — uses exact VariableChip.module.css classes ── */
function InlineChip({ label }) {
  const type = resolveTokenType(label);
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

  const chipClass = [chipStyles.chip, type !== 'variable' && chipStyles[`chip${cap(type)}`]]
    .filter(Boolean).join(' ');
  const swatchClass = [chipStyles.chipSwatch, type === 'tool' ? chipStyles.swatchTool : type !== 'variable' && chipStyles[`swatch${cap(type)}`]]
    .filter(Boolean).join(' ');

  return (
    <span className={chipClass} style={{ verticalAlign: 'middle', display: 'inline-flex', margin: '2px 4px' }}>
      <span className={swatchClass}>
        {type === 'variable' && <DataTypeIcon />}
        {type === 'tool' && <span className={`material-symbols-outlined ${chipStyles.iconTool}`}>build</span>}
        {type === 'address' && <span className={`material-symbols-outlined ${chipStyles.iconAddress}`}>smart_toy</span>}
        {type === 'product' && <ProcedureBookIcon />}
        {type === 'attachment' && <span className={`material-symbols-outlined ${chipStyles.iconAttachment}`}>attach_file</span>}
        {type === 'link' && <span className={`material-symbols-outlined ${chipStyles.iconLink}`}>link</span>}
      </span>
      <span className={`${chipStyles.chipLabel} ${chipStyles.chipLabelReadOnly}`}>{label}</span>
    </span>
  );
}

/* ── Inline token parser — handles {{chip}}, **bold**, *italic*, ~underline~, [label](url) ──
 * Italic uses `*` (not `_`) since step text is full of snake_case tool/variable
 * names that `_..._` would misparse as italic markup. Each call builds its own
 * RegExp rather than sharing one module-level instance — recursive calls (for
 * nested marks) would otherwise clobber the outer call's lastIndex via the
 * auto-reset-to-0-on-no-match behavior of `g`-flagged regexes, spinning forever. */
const RICH_TEXT_SOURCE = '(\\{\\{[^}]+\\}\\})|(\\[[^\\]]+\\]\\([^)]+\\))|(\\*\\*[^*]+\\*\\*)|(~[^~]+~)|(\\*[^*]+\\*)';

function renderInlineText(text, keyPrefix = '') {
  const nodes = [];
  let lastIndex = 0;
  let i = 0;
  let m;
  const richTextRe = new RegExp(RICH_TEXT_SOURCE, 'g');
  while ((m = richTextRe.exec(text))) {
    if (m.index > lastIndex) nodes.push(text.slice(lastIndex, m.index));
    const key = `${keyPrefix}${i++}`;
    if (m[1]) {
      nodes.push(<InlineChip key={key} label={m[1].slice(2, -2)} />);
    } else if (m[2]) {
      const linkMatch = m[2].match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      nodes.push(
        <a key={key} className={styles.stepLink} href={linkMatch[2]} target="_blank" rel="noreferrer">
          {renderInlineText(linkMatch[1], `${key}-`)}
        </a>,
      );
    } else if (m[3]) {
      nodes.push(<b key={key}>{renderInlineText(m[3].slice(2, -2), `${key}-`)}</b>);
    } else if (m[4]) {
      nodes.push(<u key={key}>{renderInlineText(m[4].slice(1, -1), `${key}-`)}</u>);
    } else if (m[5]) {
      nodes.push(<em key={key}>{renderInlineText(m[5].slice(1, -1), `${key}-`)}</em>);
    }
    lastIndex = richTextRe.lastIndex;
  }
  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
  return nodes;
}

/* ── Steps text → structured array ──
 * Bullets carry `indent` (0-2) and `ordered` (numbered vs bulleted) so nested
 * numbered/bulleted sub-lists round-trip through the flat text. Indent is
 * encoded as leading tab characters; an ordered marker ("1." / "1)") only
 * counts as such at indent >= 1, so it can't be confused with a step header. */
export function parseStepsText(text) {
  if (!text?.trim()) return [];
  const lines = text.split('\n');
  const steps = [];
  let current = null;

  for (const raw of lines) {
    if (!raw.trim()) continue;
    const indent = Math.min((raw.match(/^\t*/) || [''])[0].length, 2);
    const line = raw.trim();

    const numbered = indent === 0 && line.match(/^(\d+)\.\s*(.+)/);
    if (numbered) {
      current = { number: parseInt(numbered[1], 10), title: numbered[2], bullets: [] };
      steps.push(current);
      continue;
    }

    if (!current) {
      steps.push({ number: null, title: line, bullets: [] });
      continue;
    }

    const orderedMatch = indent > 0 && line.match(/^\d+[.)]\s*(.+)/);
    const bulletMatch = line.match(/^[•\-]\s*(.+)/);
    const content = orderedMatch ? orderedMatch[1] : bulletMatch ? bulletMatch[1] : line;
    current.bullets.push({ text: content, indent, ordered: Boolean(orderedMatch) });
  }
  return steps;
}

const BULLET_MARKER_ALPHA = 'abcdefghijklmnopqrstuvwxyz';

/* ── Marker glyph per bullet: •/◦/▪ for unordered, 1./a. for ordered, per indent level ── */
function bulletMarkers(bullets) {
  const counters = [0, 0, 0];
  let prevIndent = -1;
  let prevOrdered = false;
  return bullets.map((b) => {
    if (b.ordered) {
      if (prevIndent !== b.indent || !prevOrdered) counters[b.indent] = 0;
      counters[b.indent] += 1;
      prevIndent = b.indent;
      prevOrdered = true;
      return b.indent >= 2 ? `${BULLET_MARKER_ALPHA[(counters[b.indent] - 1) % 26]}.` : `${counters[b.indent]}.`;
    }
    prevIndent = b.indent;
    prevOrdered = false;
    return b.indent === 0 ? '•' : b.indent === 1 ? '◦' : '▪';
  });
}

/* ── Single contenteditable line with inline {{chip}} rendering ── */
function EditableLine({ text, className, onInput, onFocusLine, onSlash }) {
  const ref = useRef(null);
  const lastSynced = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (text === lastSynced.current) return;
    lastSynced.current = text;
    deserializeRichInto(el, text, () => {
      const s = serializeRichFrom(el);
      lastSynced.current = s;
      onInput(s);
    }, resolveTokenType);
  }, [text, onInput]);

  return (
    <span
      ref={ref}
      className={className}
      contentEditable
      suppressContentEditableWarning
      onFocus={() => onFocusLine?.(ref.current)}
      onKeyDown={onSlash ? (e) => {
        if (e.key === '/') {
          e.preventDefault();
          onSlash();
        }
      } : undefined}
      onInput={() => {
        const s = serializeRichFrom(ref.current);
        lastSynced.current = s;
        onInput(s);
      }}
    />
  );
}

function serializeStepsList(rootEl) {
  if (!rootEl) return '';
  const lines = [];
  rootEl.querySelectorAll('[data-step-block]').forEach((stepEl) => {
    const num = stepEl.getAttribute('data-step-num') || '1';
    // Use data-step-title / data-step-bullet wrappers; fall back to ordered
    // contenteditable scan for resilience (title = first, bullets = rest).
    const titleWrapper = stepEl.querySelector('[data-step-title]');
    const titleEl = titleWrapper
      ? titleWrapper.querySelector('[contenteditable]:not([contenteditable="false"])')
      : Array.from(stepEl.querySelectorAll('[contenteditable]:not([contenteditable="false"])'))[0];
    const titleText = titleEl ? serializeRichFrom(titleEl).trim() : '';

    const bulletLines = [];
    const bulletWrappers = stepEl.querySelectorAll('[data-step-bullet]');
    if (bulletWrappers.length) {
      bulletWrappers.forEach((bw) => {
        const bulletEl = bw.querySelector('[contenteditable]:not([contenteditable="false"])');
        const bulletText = bulletEl ? serializeRichFrom(bulletEl).trim() : '';
        if (!bulletText) return;
        const indent = Math.min(Number(bw.dataset.indent || 0), 2);
        const ordered = bw.dataset.ordered === '1';
        bulletLines.push(`${'\t'.repeat(indent)}${ordered ? '1.' : '•'} ${bulletText}`);
      });
    } else {
      // Fallback: all editables after the first are bullets
      const all = Array.from(stepEl.querySelectorAll('[contenteditable]:not([contenteditable="false"])'));
      all.slice(1).forEach((el) => {
        const bulletText = serializeRichFrom(el).trim();
        if (bulletText) bulletLines.push(`• ${bulletText}`);
      });
    }

    // Skip fully empty steps so clearing content returns to zero-state
    if (!titleText && bulletLines.length === 0) return;
    lines.push(`${num}. ${titleText}`);
    lines.push(...bulletLines);
  });
  return lines.join('\n');
}

/* ── Create-mode steps: freeform paragraph field (matches ProcedureDetailScreen) ── */
function CreateStepsField({ text, onChange, onOpenToolDrawer }) {
  const [isFocused, setIsFocused] = useState(false);
  const shellRef = useRef(null);

  return (
    <div
      ref={shellRef}
      className={`${styles.stepsEditorShell} ${styles.stepsEditorShellCreate} ${isFocused ? styles.stepsEditorShellFocused : ''}`}
      onFocusCapture={() => setIsFocused(true)}
      onBlurCapture={() => {
        requestAnimationFrame(() => {
          if (!shellRef.current?.contains(document.activeElement)) setIsFocused(false);
        });
      }}
    >
      <div className={`${styles.stepsEditorBody} ${styles.stepsEditorBodyCreate} ${styles.stepsCreatePrompt}`}>
        <UserPromptInput
          hideLabel
          autoHeight
          value={text}
          onChange={onChange}
          resolveType={resolveTokenType}
          minEditorHeight={STEPS_CREATE_MIN_HEIGHT}
          placeholder={STEPS_CREATE_PLACEHOLDER}
          onOpenToolDrawer={onOpenToolDrawer}
          showProcedureButton
        />
      </div>
    </div>
  );
}

/* ── Editable steps — identical layout to StepsRenderer ── */
function EditableStepsRenderer({ text, onChange }) {
  const rootRef = useRef(null);
  const shellRef = useRef(null);
  const activeEditableRef = useRef(null);
  const lastEmitted = useRef(text);
  const slashRangeRef = useRef(null);
  const [isFocused, setIsFocused] = useState(false);
  const [slashOpen, setSlashOpen] = useState(false);
  const [slashAnchor, setSlashAnchor] = useState(null);
  const steps = parseStepsText(text);

  useEffect(() => {
    lastEmitted.current = text;
  }, [text]);

  const getActiveEditable = useCallback(() => {
    const active = document.activeElement;
    if (
      active
      && rootRef.current?.contains(active)
      && active.getAttribute('contenteditable') === 'true'
    ) {
      return active;
    }
    return activeEditableRef.current;
  }, []);

  const emitChange = useCallback(() => {
    let next = text;
    if (rootRef.current?.querySelector('[data-step-block]')) {
      next = serializeStepsList(rootRef.current);
    } else {
      const active = getActiveEditable();
      if (active) next = serializeRichFrom(active);
    }
    if (next !== lastEmitted.current) {
      lastEmitted.current = next;
      onChange(next);
    }
  }, [onChange, text, getActiveEditable]);

  // Opens the same tool search whether triggered from the bottom toolbar's
  // Tools button or by typing "/" in a step title/bullet — saves the live
  // selection first since the slash menu's own search input steals focus.
  const openToolSlash = useCallback(() => {
    const el = getActiveEditable();
    if (!el) return;
    const sel = window.getSelection();
    if (sel?.rangeCount > 0 && el.contains(sel.getRangeAt(0).commonAncestorContainer)) {
      slashRangeRef.current = sel.getRangeAt(0).cloneRange();
    }
    const anchor = getCaretAnchor(el);
    if (!anchor) return;
    setSlashAnchor(anchor);
    setSlashOpen(true);
  }, [getActiveEditable]);

  const handleToolSelect = useCallback((tool) => {
    setSlashOpen(false);
    setSlashAnchor(null);
    const el = getActiveEditable();
    if (!el) return;
    insertChipAt(el, slashRangeRef.current, () => {
      slashRangeRef.current = null;
      emitChange();
    }, 'tool', tool.name);
  }, [getActiveEditable, emitChange]);

  const handleFocusLine = useCallback((el) => {
    if (el) activeEditableRef.current = el;
    setIsFocused(true);
  }, []);

  const handleShellFocus = useCallback(() => {
    setIsFocused(true);
  }, []);

  const handleShellBlur = useCallback(() => {
    requestAnimationFrame(() => {
      if (!shellRef.current?.contains(document.activeElement)) {
        setIsFocused(false);
      }
    });
  }, []);

  const handleShellMouseDown = useCallback((e) => {
    const shell = shellRef.current;
    const root = rootRef.current;
    if (!shell || !root) return;
    if (e.target === shell || e.target === root || root.contains(e.target) && e.target.getAttribute?.('aria-hidden') === 'true') {
      const active = document.activeElement;
      if (root.contains(active) && active?.getAttribute?.('contenteditable') === 'true') return;
      const el = root.querySelector('[contenteditable="true"]');
      if (el) {
        e.preventDefault();
        el.focus();
      }
    }
  }, []);

  const nestedListClass = [
    styles.stepsList,
    styles.stepsListNested,
    !steps.length && styles.stepsListNestedEmpty,
    !steps.length && styles.stepsListWithHint,
  ].filter(Boolean).join(' ');

  const stepsInner = !steps.length ? (
    <div className={nestedListClass}>
      {!text.trim() && (
        <div className={styles.stepsEmptyHint} aria-hidden>
          {STEPS_CREATE_PLACEHOLDER}
        </div>
      )}
      <EditableLine
        text={text}
        className={styles.stepsEmptyEditable}
        onFocusLine={handleFocusLine}
        onSlash={openToolSlash}
        onInput={(lineText) => {
          lastEmitted.current = lineText;
          onChange(lineText);
        }}
      />
    </div>
  ) : (
    <div className={nestedListClass}>
      {steps.map((step, i) => (
        <div
          key={i}
          className={styles.step}
          data-step-block
          data-step-num={step.number ?? i + 1}
        >
          <div className={styles.stepTitleRow} data-step-title>
            {step.number !== null && (
              <span className={styles.stepNumberPrefix}>{step.number}.</span>
            )}
            <EditableLine
              text={step.title}
              className={styles.stepTitleText}
              onFocusLine={handleFocusLine}
              onSlash={openToolSlash}
              onInput={emitChange}
            />
          </div>
          {step.bullets.length > 0 && (
            <div className={styles.stepBullets}>
              {bulletMarkers(step.bullets).map((marker, j) => {
                const b = step.bullets[j];
                return (
                  <div
                    key={j}
                    className={styles.stepBulletRow}
                    data-step-bullet
                    data-indent={b.indent}
                    data-ordered={b.ordered ? '1' : '0'}
                    style={{ marginLeft: b.indent * 20 }}
                  >
                    <span className={styles.bulletMarker} aria-hidden>{marker}</span>
                    <EditableLine
                      text={b.text}
                      className={styles.stepBulletText}
                      onFocusLine={handleFocusLine}
                      onSlash={openToolSlash}
                      onInput={emitChange}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div
      ref={shellRef}
      className={`${styles.stepsEditorShell} ${isFocused ? styles.stepsEditorShellFocused : ''}`}
      onFocusCapture={handleShellFocus}
      onBlurCapture={handleShellBlur}
      onMouseDown={handleShellMouseDown}
    >
      <div
        className={styles.stepsEditorBody}
        ref={rootRef}
      >
        {stepsInner}
      </div>
      <StepsEditorToolbar
        getActiveEditable={getActiveEditable}
        onAfterInsert={emitChange}
        onOpenToolSlash={openToolSlash}
        hasContent={Boolean(text?.trim())}
      />
      <ToolSlashMenu
        open={slashOpen}
        anchor={slashAnchor}
        onClose={() => { setSlashOpen(false); setSlashAnchor(null); }}
        onSelect={handleToolSelect}
      />
    </div>
  );
}

/* ── Formatted read-only steps display ── */
function StepsRenderer({ text }) {
  const steps = parseStepsText(text);
  if (!steps.length) {
    return <p className={styles.stepsEmpty}>No steps defined.</p>;
  }
  return (
    <div className={styles.stepsList}>
      {steps.map((step, i) => (
        <div key={i} className={styles.step}>
          <div className={styles.stepTitleRow}>
            {step.number !== null && (
              <span className={styles.stepNumberPrefix}>{step.number}.</span>
            )}
            <span className={styles.stepTitleText}>{renderInlineText(step.title)}</span>
          </div>
          {step.bullets.length > 0 && (
            <div className={styles.stepBullets}>
              {bulletMarkers(step.bullets).map((marker, j) => {
                const b = step.bullets[j];
                return (
                  <div key={j} className={styles.stepBulletRow} style={{ marginLeft: b.indent * 20 }}>
                    <span className={styles.bulletMarker} aria-hidden>{marker}</span>
                    <span className={styles.stepBulletText}>{renderInlineText(b.text)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

const normalizeChips = (arr) => {
  if (!Array.isArray(arr)) return [];
  return arr.map((item) =>
    typeof item === 'string' ? { value: item, type: 'variable' } : item
  );
};

function ChipContainer({
  chips,
  onChipChange,
  onChipDelete,
  addingNew,
  onCancelAdd,
  onCommitAdd,
  onChangeChipType,
  pendingAddType = 'variable',
  viewOnly,
  moreCount = 0,
  chipsReadOnly = false,
  showContainerAdd = false,
  libraryContextStyle = false,
  addPickerOpen = false,
  onToggleAddPicker,
  onSelectAddType,
  addPickerRef,
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerFor, setPickerFor] = useState(null);
  const pickerRef = useRef(null);

  useEffect(() => {
    if (!pickerOpen) return;
    const handler = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) setPickerOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [pickerOpen]);

  const openForChip = (i) => { setPickerFor(i); setPickerOpen(true); };
  const selectType = (type) => {
    setPickerOpen(false);
    if (typeof pickerFor === 'number') { onChangeChipType(pickerFor, type); }
    setPickerFor(null);
  };

  const hasChips = chips.length > 0 || addingNew;
  const containerClass = libraryContextStyle
    ? `${styles.libraryContextBox}${viewOnly ? ` ${styles.libraryContextBoxReadOnly}` : ''}`
    : llmStyles.chipContainer;
  const chipWrapClass = libraryContextStyle ? styles.libraryContextChips : llmStyles.chipWrap;

  return (
    <div className={containerClass}>
      {hasChips && (
        <div className={chipWrapClass}>
          {chips.map((chip, i) => (
            <VariableChip
              key={i}
              value={chip.value}
              type={chip.type}
              readOnly={chipsReadOnly}
              onChange={chipsReadOnly || viewOnly ? undefined : (v) => onChipChange(i, v)}
              onDelete={viewOnly || chipsReadOnly ? undefined : () => onChipDelete(i)}
              onSwatchClick={chipsReadOnly || viewOnly ? undefined : () => openForChip(i)}
            />
          ))}
          {addingNew && (
            <VariableChip
              value=""
              type={pendingAddType}
              autoFocus
              onChange={(v) => onCommitAdd(v, pendingAddType)}
              onDelete={onCancelAdd}
            />
          )}
        </div>
      )}
      {moreCount > 0 && (
        <span className={styles.moreContext}>+ {moreCount} more</span>
      )}
      {showContainerAdd && (
        <div
          className={libraryContextStyle ? styles.libraryContextFooter : styles.contextAddRowInContainer}
          ref={addPickerRef}
        >
          <button
            className={libraryContextStyle ? styles.libraryContextAddBtn : styles.contextAddBtn}
            type="button"
            onClick={onToggleAddPicker}
          >
            {libraryContextStyle && <Icon name="add_circle" size={16} />}
            Add
          </button>
          {addPickerOpen && (
            <div className={llmStyles.typePicker}>
              {CHIP_TYPES.map((ct) => (
                <button
                  key={ct.type}
                  className={llmStyles.typePickerItem}
                  type="button"
                  onClick={() => onSelectAddType(ct.type)}
                >
                  <span className={`${llmStyles.typePickerSwatch} ${llmStyles[`tpSwatch${cap(ct.type)}`] || ''}`}>
                    {ct.icon
                      ? <span className={`material-symbols-outlined ${llmStyles[`tpIcon${cap(ct.type)}`] || ''}`}>{ct.icon}</span>
                      : <DataTypeIcon />}
                  </span>
                  <span className={llmStyles.typePickerLabel}>{ct.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      {!viewOnly && !chipsReadOnly && (
        <div className={styles.chipTypePickerAnchor} ref={pickerRef}>
          {pickerOpen && typeof pickerFor === 'number' && (
            <div className={llmStyles.typePicker}>
              {CHIP_TYPES.map((ct) => (
                <button
                  key={ct.type}
                  className={llmStyles.typePickerItem}
                  type="button"
                  onClick={() => selectType(ct.type)}
                >
                  <span className={`${llmStyles.typePickerSwatch} ${llmStyles[`tpSwatch${cap(ct.type)}`] || ''}`}>
                    {ct.icon
                      ? <span className={`material-symbols-outlined ${llmStyles[`tpIcon${cap(ct.type)}`] || ''}`}>{ct.icon}</span>
                      : <DataTypeIcon />}
                  </span>
                  <span className={llmStyles.typePickerLabel}>{ct.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function ChipSection({
  label,
  chips,
  onChange,
  defaultType = 'variable',
  viewOnly,
  moreCount = 0,
  chipsReadOnly = false,
  showContextAdd = false,
  libraryContextStyle = false,
  tooltip,
  onAddContext,
}) {
  const [adding, setAdding] = useState(false);
  const [addPickerOpen, setAddPickerOpen] = useState(false);
  const [pendingAddType, setPendingAddType] = useState(defaultType);
  const addPickerRef = useRef(null);

  useEffect(() => {
    if (!addPickerOpen) return;
    const handler = (e) => {
      if (addPickerRef.current && !addPickerRef.current.contains(e.target)) setAddPickerOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [addPickerOpen]);

  const commitAdd = (v, type) => { onChange([...chips, { value: v, type }]); setAdding(false); };
  const changeChip = (i, v) => { const n = [...chips]; n[i] = { ...n[i], value: v }; onChange(n); };
  const deleteChip = (i) => onChange(chips.filter((_, idx) => idx !== i));
  const changeType = (i, type) => { const n = [...chips]; n[i] = { ...n[i], type }; onChange(n); };

  const selectAddType = (type) => {
    setPendingAddType(type);
    setAddPickerOpen(false);
    setAdding(true);
  };

  const handleAddClick = () => {
    if (onAddContext) {
      onAddContext();
      return;
    }
    setAddPickerOpen((open) => !open);
  };

  const showAdd = !viewOnly && (
    Boolean(onAddContext) || (!chipsReadOnly && (libraryContextStyle || !showContextAdd))
  );

  return (
    <div className={styles.section}>
      <div className={styles.sectionLabelRow}>
        <div className={etStyles.sectionLabelWrapper}>
          <span className={etStyles.sectionLabelText}>{label}</span>
          <SectionInfoIcon tooltip={tooltip} />
        </div>
        {!viewOnly && showContextAdd && (
          <div className={styles.contextAddRow} ref={addPickerRef}>
            <button
              className={styles.contextAddBtn}
              type="button"
              onClick={handleAddClick}
            >
              + Add
            </button>
            {addPickerOpen && !onAddContext && (
              <div className={llmStyles.typePicker}>
                {CHIP_TYPES.map((ct) => (
                  <button
                    key={ct.type}
                    className={llmStyles.typePickerItem}
                    type="button"
                    onClick={() => selectAddType(ct.type)}
                  >
                    <span className={`${llmStyles.typePickerSwatch} ${llmStyles[`tpSwatch${cap(ct.type)}`] || ''}`}>
                      {ct.icon
                        ? <span className={`material-symbols-outlined ${llmStyles[`tpIcon${cap(ct.type)}`] || ''}`}>{ct.icon}</span>
                        : <DataTypeIcon />}
                    </span>
                    <span className={llmStyles.typePickerLabel}>{ct.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      <ChipContainer
        chips={chips}
        onChipChange={changeChip}
        onChipDelete={deleteChip}
        addingNew={adding && !onAddContext}
        onCancelAdd={() => setAdding(false)}
        onCommitAdd={commitAdd}
        onChangeChipType={changeType}
        pendingAddType={pendingAddType}
        viewOnly={viewOnly}
        moreCount={moreCount}
        chipsReadOnly={chipsReadOnly && !onAddContext}
        showContainerAdd={showAdd && !showContextAdd}
        libraryContextStyle={libraryContextStyle}
        addPickerOpen={addPickerOpen && !onAddContext}
        onToggleAddPicker={handleAddClick}
        onSelectAddType={selectAddType}
        addPickerRef={addPickerRef}
      />
    </div>
  );
}

const TITLE_PLACEHOLDER = 'e.g. "Appointment rescheduling"';
const WHEN_CREATE_PLACEHOLDER = 'Describe the trigger that should activate this procedure, e.g. "Customer wants to reschedule an appointment."';
const WHEN_EDIT_PLACEHOLDER = 'Describe when this procedure should be triggered...';
const EXIT_CREATE_PLACEHOLDER = 'Describe when this procedure is complete. e.g. when customer ends the conversation.';
const EXIT_EDIT_PLACEHOLDER = 'Describe when this procedure is complete. e.g. when customer ends the conversation.';

export default function ProcedureDetailBody({
  initialValues = {},
  onFieldChange,
  viewOnly = false,
  showTitle = false,
  showLibraryCheckbox = false,
  contextEditable = false,
  contextLibraryStyle = false,
  showTypeField = false,
  whenToUseLabel = 'When should this procedure be used?',
  onOpenToolDrawer = undefined,
  onAddContext,
  hideContext = false,
  isNewProcedure = false,
}) {
  const [title, setTitle] = useState(initialValues.name ?? '');
  const [whenToUse, setWhenToUse] = useState(initialValues.whenToUse ?? '');
  const [whenToExit, setWhenToExit] = useState(initialValues.whenToExit ?? '');
  const [contextChips, setContextChips] = useState(normalizeChips(initialValues.contextChips ?? []));
  const [stepsText, setStepsText] = useState(initialValues.stepsText ?? '');
  const [addToLibrary, setAddToLibrary] = useState(initialValues.addToLibrary ?? false);
  const procedureType = initialValues.procedureType ?? 'Inbound';
  const moreContextCount = initialValues.moreContextCount ?? 0;
  const whenToUseRef = useRef(null);
  const whenToExitRef = useRef(null);

  useEffect(() => {
    setTitle(initialValues.name ?? '');
    setWhenToUse(initialValues.whenToUse ?? '');
    setWhenToExit(initialValues.whenToExit ?? '');
    setContextChips(normalizeChips(initialValues.contextChips ?? []));
    setStepsText(initialValues.stepsText ?? '');
    setAddToLibrary(initialValues.addToLibrary ?? false);
  }, [initialValues.name, initialValues.whenToUse, initialValues.whenToExit, initialValues.contextChips, initialValues.stepsText, initialValues.addToLibrary, initialValues.id]);

  useEffect(() => {
    const el = whenToUseRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [whenToUse]);

  useEffect(() => {
    const el = whenToExitRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [whenToExit]);

  return (
    <div
      className={styles.body}
      style={viewOnly ? { pointerEvents: 'auto' } : undefined}
    >
      {showTitle && (
        <div className={styles.section}>
          <div className={etStyles.sectionLabelWrapper}>
            <span className={etStyles.sectionLabelText}>
              Procedure title<span className={styles.required}> *</span>
            </span>
          </div>
          {viewOnly ? (
            <input
              type="text"
              className={styles.readOnlyField}
              value={title}
              readOnly
              tabIndex={-1}
              aria-readonly="true"
            />
          ) : (
            <EmptyHintField
              hint={TITLE_PLACEHOLDER}
              isEmpty={!title.trim()}
              className={TITLE_SHELL}
              hintClassName="flex items-center px-md"
            >
              <input
                type="text"
                className="h-10 w-full bg-transparent px-md text-body text-text-primary outline-none"
                value={title}
                onChange={(e) => {
                  const val = e.target.value;
                  setTitle(val);
                  onFieldChange?.('name', val);
                }}
              />
            </EmptyHintField>
          )}
        </div>
      )}

      <div className={styles.section}>
        <div className={etStyles.sectionLabelWrapper}>
          <span className={etStyles.sectionLabelText}>
            {whenToUseLabel}<span className={styles.required}> *</span>
          </span>
        </div>
        {viewOnly ? (
          showTitle ? (
            <textarea
              className={`${styles.readOnlyField} ${styles.readOnlyTextarea}`}
              value={whenToUse}
              readOnly
              tabIndex={-1}
              aria-readonly="true"
              rows={5}
            />
          ) : (
            <input
              type="text"
              className={styles.readOnlyField}
              value={whenToUse}
              readOnly
              tabIndex={-1}
              aria-readonly="true"
            />
          )
        ) : showTitle ? (
          <EmptyHintField
            hint={WHEN_CREATE_PLACEHOLDER}
            isEmpty={!whenToUse.trim()}
            className={FIELD_SHELL}
            hintClassName="p-md"
          >
            <textarea
              ref={whenToUseRef}
              className="min-h-[80px] w-full resize-none overflow-hidden bg-transparent p-md text-body leading-relaxed text-text-primary outline-none"
              value={whenToUse}
              rows={1}
              onChange={(e) => {
                const val = e.target.value;
                setWhenToUse(val);
                onFieldChange?.('whenToUse', val);
              }}
            />
          </EmptyHintField>
        ) : (
          <EmptyHintField
            hint={WHEN_EDIT_PLACEHOLDER}
            isEmpty={!whenToUse.trim()}
            className={TITLE_SHELL}
            hintClassName="flex items-center px-md"
          >
            <input
              type="text"
              className="h-10 w-full bg-transparent px-md text-body text-text-primary outline-none"
              value={whenToUse}
              onChange={(e) => {
                const val = e.target.value;
                setWhenToUse(val);
                onFieldChange?.('whenToUse', val);
              }}
            />
          </EmptyHintField>
        )}
      </div>

      {!hideContext && (
        <ChipSection
          label="Context"
          chips={contextChips}
          onChange={(next) => { setContextChips(next); onFieldChange?.('contextChips', next); }}
          defaultType="variable"
          viewOnly={viewOnly}
          moreCount={moreContextCount}
          chipsReadOnly={viewOnly || (!contextEditable && !onAddContext)}
          showContextAdd={false}
          libraryContextStyle={
            viewOnly || contextLibraryStyle || contextEditable || Boolean(onAddContext)
          }
          tooltip="Uses your brand voice, industry knowledge, to generate accurate responses"
          onAddContext={viewOnly ? undefined : onAddContext}
        />
      )}

      {showTypeField && (
        <div className={styles.section}>
          <div className={etStyles.sectionLabelWrapper}>
            <span className={etStyles.sectionLabelText}>Type</span>
          </div>
          <div
            className={`flex h-9 w-full cursor-default items-center gap-sm rounded-sm border border-border-input bg-surface-l2 px-md text-body text-text-primary ${
              viewOnly ? 'pointer-events-none' : ''
            }`}
            aria-disabled={viewOnly || undefined}
          >
            <span className="min-w-0 flex-1 truncate">{procedureType}</span>
            {!viewOnly && (
              <Icon name="expand_more" size={20} className="shrink-0 text-text-icon" />
            )}
          </div>
        </div>
      )}

      <div className={styles.section}>
        <div className={etStyles.sectionLabelWrapper}>
          <span className={etStyles.sectionLabelText}>
            Steps<span className={styles.required}> *</span>
          </span>
          <SectionInfoIcon tooltip="Information your agent can refer to during a conversation, like your location details, knowledge base, and connected files" />
        </div>
        {viewOnly ? (
          <div className={`${styles.readOnlyField} ${styles.readOnlySteps}`}>
            <StepsRenderer text={stepsText} />
          </div>
        ) : isNewProcedure ? (
          <CreateStepsField
            text={stepsText}
            onOpenToolDrawer={onOpenToolDrawer}
            onChange={(val) => { setStepsText(val); onFieldChange?.('stepsText', val); }}
          />
        ) : (
          <EditableStepsRenderer
            text={stepsText}
            onChange={(val) => { setStepsText(val); onFieldChange?.('stepsText', val); }}
          />
        )}
      </div>

      <div className={styles.section}>
        <div className={etStyles.sectionLabelWrapper}>
          <span className={etStyles.sectionLabelText}>When to exit this procedure?</span>
        </div>
        {viewOnly ? (
          showTitle ? (
            <textarea
              className={`${styles.readOnlyField} ${styles.readOnlyTextarea}`}
              value={whenToExit}
              readOnly
              tabIndex={-1}
              aria-readonly="true"
              rows={5}
            />
          ) : (
            <input
              type="text"
              className={styles.readOnlyField}
              value={whenToExit}
              readOnly
              tabIndex={-1}
              aria-readonly="true"
            />
          )
        ) : showTitle ? (
          <EmptyHintField
            hint={EXIT_CREATE_PLACEHOLDER}
            isEmpty={!whenToExit.trim()}
            className={FIELD_SHELL}
            hintClassName="p-md"
          >
            <textarea
              ref={whenToExitRef}
              className="min-h-[80px] w-full resize-none overflow-hidden bg-transparent p-md text-body leading-relaxed text-text-primary outline-none"
              value={whenToExit}
              rows={1}
              onChange={(e) => {
                const val = e.target.value;
                setWhenToExit(val);
                onFieldChange?.('whenToExit', val);
              }}
            />
          </EmptyHintField>
        ) : (
          <EmptyHintField
            hint={EXIT_EDIT_PLACEHOLDER}
            isEmpty={!whenToExit.trim()}
            className={TITLE_SHELL}
            hintClassName="flex items-center px-md"
          >
            <input
              type="text"
              className="h-10 w-full bg-transparent px-md text-body text-text-primary outline-none"
              value={whenToExit}
              onChange={(e) => {
                const val = e.target.value;
                setWhenToExit(val);
                onFieldChange?.('whenToExit', val);
              }}
            />
          </EmptyHintField>
        )}
      </div>

      {showLibraryCheckbox && !viewOnly && (
        <label className={styles.libraryCheckbox}>
          <input
            type="checkbox"
            checked={addToLibrary}
            onChange={(e) => {
              setAddToLibrary(e.target.checked);
              onFieldChange?.('addToLibrary', e.target.checked);
            }}
          />
          <span>Add this procedure to the library</span>
        </label>
      )}
    </div>
  );
}
