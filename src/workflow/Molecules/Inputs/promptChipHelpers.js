/**
 * Shared DOM helpers for variable chips inside contentEditable prompt areas.
 * Uses the exact OptionDataType SVG paths from the design system.
 */

const DATA_TYPE_ICON_SVG = `<svg width="16" height="15" viewBox="5 5.5 16 15" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M7.24889 13.2505C7.46549 13.4287 7.64002 13.6525 7.76 13.906C8.06667 14.5385 8.06667 15.3116 8.06667 16.0616C8.06667 17.6148 8.13056 18.3616 9.6 18.3616C9.73556 18.3616 9.86556 18.4155 9.96141 18.5113C10.0573 18.6072 10.1111 18.7372 10.1111 18.8727C10.1111 19.0083 10.0573 19.1383 9.96141 19.2342C9.86556 19.33 9.73556 19.3839 9.6 19.3839C8.48322 19.3839 7.72678 18.9916 7.35111 18.2172C7.04444 17.5847 7.04444 16.8117 7.04444 16.0616C7.04444 14.5085 6.98056 13.7616 5.51111 13.7616C5.37556 13.7616 5.24555 13.7078 5.1497 13.6119C5.05385 13.5161 5 13.3861 5 13.2505C5 13.115 5.05385 12.985 5.1497 12.8891C5.24555 12.7933 5.37556 12.7394 5.51111 12.7394C6.98056 12.7394 7.04444 11.9925 7.04444 10.4394C7.04444 9.69063 7.04444 8.9163 7.35111 8.2838C7.72806 7.50947 8.4845 7.11719 9.60128 7.11719C9.73683 7.11719 9.86684 7.17104 9.96269 7.26689C10.0585 7.36274 10.1124 7.49274 10.1124 7.6283C10.1124 7.76385 10.0585 7.89386 9.96269 7.98971C9.86684 8.08556 9.73683 8.13941 9.60128 8.13941C8.13183 8.13941 8.06794 8.88627 8.06794 10.4394C8.06794 11.1882 8.06794 11.9625 7.76128 12.595C7.64093 12.8486 7.46595 13.0725 7.24889 13.2505ZM20.8235 12.7394C19.3541 12.7394 19.2902 11.9925 19.2902 10.4394C19.2902 9.69063 19.2902 8.9163 18.9835 8.2838C18.6078 7.50947 17.8514 7.11719 16.7346 7.11719C16.5991 7.11719 16.4691 7.17104 16.3732 7.26689C16.2773 7.36274 16.2235 7.49274 16.2235 7.6283C16.2235 7.76385 16.2773 7.89386 16.3732 7.98971C16.4691 8.08556 16.5991 8.13941 16.7346 8.13941C18.2041 8.13941 18.2679 8.88627 18.2679 10.4394C18.2679 11.1882 18.2679 11.9625 18.5746 12.595C18.6946 12.8485 18.8691 13.0724 19.0857 13.2505C18.8691 13.4287 18.6946 13.6525 18.5746 13.906C18.2679 14.5385 18.2679 15.3116 18.2679 16.0616C18.2679 17.6148 18.2041 18.3616 16.7346 18.3616C16.5991 18.3616 16.4691 18.4155 16.3732 18.5113C16.2773 18.6072 16.2235 18.7372 16.2235 18.8727C16.2235 19.0083 16.2773 19.1383 16.3732 19.2342C16.4691 19.33 16.5991 19.3839 16.7346 19.3839C17.8514 19.3839 18.6078 18.9916 18.9835 18.2172C19.2902 17.5847 19.2902 16.8117 19.2902 16.0616C19.2902 14.5085 19.3541 13.7616 20.8235 13.7616C20.9591 13.7616 21.0891 13.7078 21.1849 13.6119C21.2808 13.5161 21.3346 13.3861 21.3346 13.2505C21.3346 13.115 21.2808 12.985 21.1849 12.8891C21.0891 12.7933 20.9591 12.7394 20.8235 12.7394Z" fill="#1976D2"/>
  <path d="M14.4142 12.0861L13 13.5003L11.5858 14.9145M11.5858 12.0861L14.4142 14.9145" stroke="#1976D2" stroke-linecap="round"/>
</svg>`;

const CLOSE_ICON_SVG = `<svg width="16" height="16" viewBox="158 5 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M166 13.6188L163.151 16.4675C163.059 16.5598 162.959 16.6042 162.853 16.6008C162.747 16.5974 162.645 16.5474 162.549 16.4508C162.452 16.3542 162.404 16.251 162.404 16.1412C162.404 16.0314 162.452 15.9282 162.549 15.8316L165.381 12.9995L162.532 10.1508C162.44 10.0585 162.395 9.95637 162.399 9.8444C162.402 9.73245 162.452 9.62818 162.549 9.5316C162.645 9.43501 162.748 9.38672 162.858 9.38672C162.968 9.38672 163.071 9.43501 163.168 9.5316L166 12.3803L168.849 9.5316C168.941 9.43929 169.043 9.39207 169.155 9.38994C169.267 9.38779 169.371 9.43501 169.468 9.5316C169.564 9.62818 169.613 9.73138 169.613 9.8412C169.613 9.95102 169.564 10.0542 169.468 10.1508L166.619 12.9995L169.468 15.8483C169.56 15.9406 169.607 16.0399 169.609 16.1463C169.612 16.2527 169.564 16.3542 169.468 16.4508C169.371 16.5474 169.268 16.5957 169.158 16.5957C169.048 16.5957 168.945 16.5474 168.849 16.4508L166 13.6188Z" fill="#303030"/>
</svg>`;

const PROCEDURE_BOOK_ICON_SVG = `<svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M13.1984 4.19922H9.59844C9.28795 4.19922 8.98172 4.27151 8.70401 4.41036C8.4263 4.54922 8.18473 4.75083 7.99844 4.99922C7.81214 4.75083 7.57057 4.54922 7.29286 4.41036C7.01515 4.27151 6.70893 4.19922 6.39844 4.19922H2.79844C2.69235 4.19922 2.59061 4.24136 2.51559 4.31638C2.44058 4.39139 2.39844 4.49313 2.39844 4.59922V11.7992C2.39844 11.9053 2.44058 12.007 2.51559 12.0821C2.59061 12.1571 2.69235 12.1992 2.79844 12.1992H6.39844C6.7167 12.1992 7.02192 12.3256 7.24697 12.5507C7.47201 12.7757 7.59844 13.081 7.59844 13.3992C7.59844 13.5053 7.64058 13.607 7.71559 13.6821C7.79061 13.7571 7.89235 13.7992 7.99844 13.7992C8.10452 13.7992 8.20627 13.7571 8.28128 13.6821C8.35629 13.607 8.39844 13.5053 8.39844 13.3992C8.39844 13.081 8.52486 12.7757 8.74991 12.5507C8.97495 12.3256 9.28018 12.1992 9.59844 12.1992H13.1984C13.3045 12.1992 13.4063 12.1571 13.4813 12.0821C13.5563 12.007 13.5984 11.9053 13.5984 11.7992V4.59922C13.5984 4.49313 13.5563 4.39139 13.4813 4.31638C13.4063 4.24136 13.3045 4.19922 13.1984 4.19922ZM6.39844 11.3992H3.19844V4.99922H6.39844C6.7167 4.99922 7.02192 5.12565 7.24697 5.35069C7.47201 5.57573 7.59844 5.88096 7.59844 6.19922V11.7992C7.25257 11.539 6.83129 11.3985 6.39844 11.3992ZM12.7984 11.3992H9.59844C9.16558 11.3985 8.7443 11.539 8.39844 11.7992V6.19922C8.39844 5.88096 8.52486 5.57573 8.74991 5.35069C8.97495 5.12565 9.28018 4.99922 9.59844 4.99922H12.7984V11.3992Z" fill="#37A248"/></svg>`;

const CHIP_TYPE_MAP = {
  variable:   { chipMod: '',                       swatchMod: '',                                iconHtml: null },
  attachment: { chipMod: 'prompt-chip--attachment', swatchMod: 'prompt-chip-swatch--attachment', iconHtml: '<span class="material-symbols-outlined prompt-chip-mat-icon">attach_file</span>' },
  link:       { chipMod: 'prompt-chip--link',       swatchMod: 'prompt-chip-swatch--link',       iconHtml: '<span class="material-symbols-outlined prompt-chip-mat-icon">link</span>' },
  address:    { chipMod: 'prompt-chip--address',    swatchMod: 'prompt-chip-swatch--address',    iconHtml: '<span class="material-symbols-outlined prompt-chip-mat-icon">smart_toy</span>' },
  product:    { chipMod: 'prompt-chip--product',    swatchMod: 'prompt-chip-swatch--product',    iconHtml: PROCEDURE_BOOK_ICON_SVG },
  tool:       { chipMod: 'prompt-chip--tool',       swatchMod: 'prompt-chip-swatch--tool',       iconHtml: '<span class="material-symbols-outlined prompt-chip-mat-icon">build</span>' },
};

export function serializeFrom(el) {
  if (!el) return '';
  let text = '';
  el.childNodes.forEach((node) => {
    if (node.nodeType === 3) {
      text += node.textContent;
    } else if (node.nodeName === 'BR') {
      text += '\n';
    } else if (node.nodeType === 1 && node.dataset.chip !== undefined) {
      text += `{{${node.dataset.chip}}}`;
    } else if (node.nodeType === 1) {
      text += serializeFrom(node);
    }
  });
  return text;
}

function buildViewChipContents(chip, name, onDelete, type = 'variable') {
  const cfg = CHIP_TYPE_MAP[type] || CHIP_TYPE_MAP.variable;
  chip.innerHTML = '';
  chip.dataset.chip = name;
  chip.className = ['prompt-chip', cfg.chipMod].filter(Boolean).join(' ');

  const swatch = document.createElement('span');
  swatch.className = ['prompt-chip-swatch', cfg.swatchMod].filter(Boolean).join(' ');
  swatch.innerHTML = cfg.iconHtml ?? DATA_TYPE_ICON_SVG;
  chip.appendChild(swatch);

  const label = document.createElement('span');
  label.className = 'prompt-chip-label';
  label.textContent = name;
  chip.appendChild(label);

  if (onDelete) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'prompt-chip-del';
    btn.onmousedown = (e) => e.preventDefault();
    btn.onclick = () => { chip.remove(); onDelete(); };
    btn.innerHTML = CLOSE_ICON_SVG;
    chip.appendChild(btn);
  }
}

export function createViewChip(name, onDelete) {
  const chip = document.createElement('span');
  chip.contentEditable = 'false';
  chip.className = 'prompt-chip';
  buildViewChipContents(chip, name, onDelete);
  return chip;
}

export function deserializeInto(el, value, onDelete) {
  el.innerHTML = '';
  if (!value) return;
  const parts = value.split(/({{[^}]+}})/);
  parts.forEach((part) => {
    const m = part.match(/^{{(.+)}}$/);
    if (m) {
      el.appendChild(createViewChip(m[1], onDelete));
    } else {
      const lines = part.split('\n');
      lines.forEach((line, i) => {
        if (line) el.appendChild(document.createTextNode(line));
        if (i < lines.length - 1) el.appendChild(document.createElement('br'));
      });
    }
  });
}

/** Like deserializeInto but resolves each chip's type via a caller-supplied function. */
export function deserializeIntoTyped(el, value, onDelete, resolveType) {
  el.innerHTML = '';
  if (!value) return;
  const parts = value.split(/({{[^}]+}})/);
  parts.forEach((part) => {
    const m = part.match(/^{{(.+)}}$/);
    if (m) {
      const name = m[1];
      const type = resolveType ? resolveType(name) : 'variable';
      const chip = document.createElement('span');
      chip.contentEditable = 'false';
      buildViewChipContents(chip, name, onDelete, type);
      el.appendChild(chip);
    } else {
      const lines = part.split('\n');
      lines.forEach((line, i) => {
        if (line) el.appendChild(document.createTextNode(line));
        if (i < lines.length - 1) el.appendChild(document.createElement('br'));
      });
    }
  });
}

/* ── Rich text (bold / italic / underline / links) on top of chip tokens ──
 * Adds `**bold**`, `*italic*`, `~underline~` and `[label](url)` markup to the
 * plain-text serialization used by chip-aware contentEditable fields. Kept as
 * separate exports (rather than changing serializeFrom/deserializeIntoTyped)
 * so existing prompt inputs that don't want rich text are unaffected.
 * Italic uses `*` rather than `_` because step text is full of snake_case
 * tool/variable names (e.g. `verify_patient_identity`) that `_..._` would
 * misparse as italic markup. */
const RICH_TOKEN_SOURCE = '(\\{\\{[^}]+\\}\\})|(\\[[^\\]]+\\]\\([^)]+\\))|(\\*\\*[^*]+\\*\\*)|(~[^~]+~)|(\\*[^*]+\\*)';

function appendPlainText(el, text) {
  const lines = text.split('\n');
  lines.forEach((line, i) => {
    if (line) el.appendChild(document.createTextNode(line));
    if (i < lines.length - 1) el.appendChild(document.createElement('br'));
  });
}

function appendRichNodes(el, value, onDelete, resolveType) {
  if (!value) return;
  let lastIndex = 0;
  let m;
  // A fresh RegExp per call (rather than a shared module-level one) so that
  // recursive calls building nested marks don't clobber the outer call's
  // lastIndex — a shared `g`-flagged regex resets to 0 whenever an inner
  // exec() run completes, which desyncs the outer loop and spins forever.
  const richTokenRe = new RegExp(RICH_TOKEN_SOURCE, 'g');
  while ((m = richTokenRe.exec(value))) {
    if (m.index > lastIndex) appendPlainText(el, value.slice(lastIndex, m.index));
    if (m[1]) {
      const name = m[1].slice(2, -2);
      const type = resolveType ? resolveType(name) : 'variable';
      const chip = document.createElement('span');
      chip.contentEditable = 'false';
      buildViewChipContents(chip, name, onDelete, type);
      el.appendChild(chip);
    } else if (m[2]) {
      const linkMatch = m[2].match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      const a = document.createElement('a');
      a.href = linkMatch[2];
      a.className = 'prompt-rich-link';
      appendRichNodes(a, linkMatch[1], onDelete, resolveType);
      el.appendChild(a);
    } else if (m[3]) {
      const b = document.createElement('b');
      appendRichNodes(b, m[3].slice(2, -2), onDelete, resolveType);
      el.appendChild(b);
    } else if (m[4]) {
      const u = document.createElement('u');
      appendRichNodes(u, m[4].slice(1, -1), onDelete, resolveType);
      el.appendChild(u);
    } else if (m[5]) {
      const em = document.createElement('em');
      appendRichNodes(em, m[5].slice(1, -1), onDelete, resolveType);
      el.appendChild(em);
    }
    lastIndex = richTokenRe.lastIndex;
  }
  if (lastIndex < value.length) appendPlainText(el, value.slice(lastIndex));
}

/** Like deserializeIntoTyped but also parses **bold**, *italic*, ~underline~, [label](url). */
export function deserializeRichInto(el, value, onDelete, resolveType) {
  el.innerHTML = '';
  appendRichNodes(el, value, onDelete, resolveType);
}

/** Like serializeFrom but also emits **bold**, *italic*, ~underline~, [label](url) for the tags deserializeRichInto understands. */
export function serializeRichFrom(el) {
  if (!el) return '';
  let text = '';
  el.childNodes.forEach((node) => {
    if (node.nodeType === 3) {
      text += node.textContent;
    } else if (node.nodeName === 'BR') {
      text += '\n';
    } else if (node.nodeType === 1 && node.dataset.chip !== undefined) {
      text += `{{${node.dataset.chip}}}`;
    } else if (node.nodeType === 1) {
      const inner = serializeRichFrom(node);
      if (!inner) return;
      switch (node.nodeName) {
        case 'B':
        case 'STRONG':
          text += `**${inner}**`;
          break;
        case 'U':
          text += `~${inner}~`;
          break;
        case 'I':
        case 'EM':
          text += `_${inner}_`;
          break;
        case 'A':
          text += `[${inner}](${node.getAttribute('href') || ''})`;
          break;
        default:
          text += inner;
      }
    }
  });
  return text;
}

export function insertChipAt(el, range, onFinalize, type = 'variable', initialValue = null) {
  const cfg = CHIP_TYPE_MAP[type] || CHIP_TYPE_MAP.variable;

  const chip = document.createElement('span');
  chip.contentEditable = 'false';
  chip.className = ['prompt-chip', 'prompt-chip--editing', cfg.chipMod].filter(Boolean).join(' ');

  const swatch = document.createElement('span');
  swatch.className = ['prompt-chip-swatch', cfg.swatchMod].filter(Boolean).join(' ');
  swatch.innerHTML = cfg.iconHtml ?? DATA_TYPE_ICON_SVG;
  chip.appendChild(swatch);

  // If a value was provided upfront (e.g. from FieldPickerModal), skip the inline input
  if (initialValue) {
    buildViewChipContents(chip, initialValue, onFinalize, type);
    if (range && el.contains(range.commonAncestorContainer)) {
      range.deleteContents();
      range.insertNode(chip);
      const newRange = document.createRange();
      newRange.setStartAfter(chip);
      newRange.collapse(true);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(newRange);
    } else {
      el.appendChild(chip);
    }
    onFinalize();
    return;
  }

  const input = document.createElement('input');
  input.className = 'prompt-chip-input';
  input.placeholder = 'variable';
  input.size = 8;

  const finalize = () => {
    const name = input.value.trim();
    if (!name) {
      chip.remove();
    } else {
      buildViewChipContents(chip, name, onFinalize, type);
    }
    onFinalize();
  };

  input.onkeydown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); finalize(); }
    if (e.key === 'Escape') { e.preventDefault(); chip.remove(); onFinalize(); }
  };
  input.onblur = finalize;
  chip.appendChild(input);

  if (range && el.contains(range.commonAncestorContainer)) {
    range.deleteContents();
    range.insertNode(chip);
    const newRange = document.createRange();
    newRange.setStartAfter(chip);
    newRange.collapse(true);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(newRange);
  } else {
    el.appendChild(chip);
  }
  input.focus();
}
