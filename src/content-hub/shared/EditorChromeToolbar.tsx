import React from 'react';
import {
  AlignLeft,
  Bold,
  ChevronDown,
  ChevronRight,
  Gauge,
  Italic,
  List,
  MapPin,
  Maximize2,
  Mic,
  Minimize2,
  Redo2,
  ScanText,
  SpellCheck,
  StretchHorizontal,
  Type,
  Underline,
  Undo2,
  Sparkles,
  ZoomIn,
  ZoomOut,
  Strikethrough,
  Indent,
  Outdent,
  Highlighter,
  PaintRoller,
  Minus,
  Plus,
  AlignVerticalSpaceAround,
  TrendingUp,
  MousePointerClick,
  BookOpen,
} from 'lucide-react';
import { cn } from '@/contenthub-ui/utils';

export interface EditorToolbarPosition {
  top: number;
  left: number;
}

interface EditorChromeToolbarProps {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  zoom: number;
  onZoomOut: () => void;
  onZoomIn: () => void;
  richTextVisible?: boolean;
  canvasPosition: EditorToolbarPosition;
  richTextPosition?: EditorToolbarPosition;
  inlineMode?: boolean;
  mode?: 'blog' | 'faq';
}

type TextInput = HTMLInputElement | HTMLTextAreaElement;

const COLOR_SWATCH_ROWS = [
  ['#2f3340', '#45464a', '#5d5e62', '#9b9c9f', '#adadaf', '#c8c8ca', '#e3e4e6', '#ffffff'],
  ['#1f4f83', '#2a756d', '#2f701f', '#d3a915', '#b95412', '#b6281c', '#94145b', '#52307e'],
  ['#2f78bd', '#4aa891', '#4dad2f', '#ffd84d', '#f28a49', '#ef3b28', '#c93177', '#8250bd'],
  ['#3b99e8', '#65d2c8', '#82d663', '#ffe06b', '#ffad72', '#f6684d', '#e74792', '#9a78d1'],
  ['#67b9ed', '#9be5dc', '#98ee73', '#fff183', '#ffc166', '#f29d8d', '#e884b5', '#c5a7e8'],
  ['#dce7f9', '#d8f3ee', '#daf5dc', '#fbf5d4', '#f9e8c9', '#f8dddd', '#f6e2ee', '#eee0f4'],
] as const;

const TONE_OPTIONS = ['Friendly', 'Witty', 'Descriptive', 'Informative', 'Formal'] as const;

const MODIFY_ACTIONS = [
  { id: 'shorter', label: 'Make shorter', icon: Minimize2 },
  { id: 'longer', label: 'Make longer', icon: Maximize2 },
  { id: 'spelling', label: 'Fix spelling and grammar', icon: SpellCheck },
] as const;

const IMPROVE_ACTIONS_BLOG = [
  { id: 'boost-seo', label: 'Boost SEO', icon: TrendingUp },
  { id: 'strengthen-cta', label: 'Strengthen CTA', icon: MousePointerClick },
  { id: 'improve-readability', label: 'Improve readability', icon: BookOpen },
] as const;

const IMPROVE_ACTIONS_FAQ = [
  { id: 'aeo', label: 'Improve AEO score', icon: Gauge },
  { id: 'local', label: 'Add local context', icon: MapPin },
  { id: 'clarity', label: 'Rewrite for clarity', icon: ScanText },
] as const;

type AiActionId = 'boost-seo' | 'strengthen-cta' | 'improve-readability' | 'aeo' | 'clarity' | 'local' | 'shorter' | 'longer' | 'spelling';

function activeTextInput(): TextInput | null {
  const active = document.activeElement;
  if (active instanceof HTMLTextAreaElement) return active;
  if (active instanceof HTMLInputElement && active.type === 'text') return active;
  return null;
}

function applyInputStyle(styles: Partial<CSSStyleDeclaration>, listStyle?: 'bulleted' | 'numbered') {
  const input = activeTextInput();
  if (!input) return false;
  Object.assign(input.style, styles);
  input.dataset.hasRichStyle = 'true';
  if (listStyle) input.dataset.listStyle = listStyle;
  // Auto-resize textarea so content is never clipped when font size changes
  if (input instanceof HTMLTextAreaElement) {
    input.style.height = 'auto';
    input.style.height = `${input.scrollHeight}px`;
    input.style.overflow = 'hidden';
  }
  // Notify the React component owning this input so it can persist styles across edit/view transitions
  input.dispatchEvent(new CustomEvent('richstylechange', { detail: styles }));
  return true;
}

function execRichCommand(command: string, value?: string) {
  const active = document.activeElement;
  if (active instanceof HTMLElement && active.isContentEditable) {
    document.execCommand(command, false, value);
  }
}

function formatSelection(kind: 'bold' | 'italic' | 'underline' | 'link' | 'color' | 'fontSize' | 'fontName' | 'alignLeft' | 'bulleted' | 'numbered', value?: string) {
  const input = activeTextInput();
  if (input) {
    if (kind === 'bold') applyInputStyle({ fontWeight: input.style.fontWeight === '700' ? '' : '700' });
    if (kind === 'italic') applyInputStyle({ fontStyle: input.style.fontStyle === 'italic' ? '' : 'italic' });
    if (kind === 'underline') applyInputStyle({ textDecoration: input.style.textDecoration === 'underline' ? '' : 'underline' });
    if (kind === 'link') applyInputStyle({ color: 'var(--primary)', textDecoration: 'underline' });
    if (kind === 'color') applyInputStyle({ color: value ?? '' });
    if (kind === 'fontSize') applyInputStyle({ fontSize: value ? `${value}px` : '' });
    if (kind === 'fontName') applyInputStyle({ fontFamily: value ?? '' });
    if (kind === 'alignLeft') applyInputStyle({ textAlign: 'left' });
    if (kind === 'bulleted') applyInputStyle({ paddingLeft: '24px' }, 'bulleted');
    if (kind === 'numbered') applyInputStyle({ paddingLeft: '24px' }, 'numbered');
    return;
  }

  if (kind === 'bold') execRichCommand('bold');
  if (kind === 'italic') execRichCommand('italic');
  if (kind === 'underline') execRichCommand('underline');
  if (kind === 'link') execRichCommand('createLink', 'https://');
  if (kind === 'color') execRichCommand('foreColor', value);
  if (kind === 'fontSize') execRichCommand('fontSize', value);
  if (kind === 'fontName') execRichCommand('fontName', value);
  if (kind === 'alignLeft') execRichCommand('justifyLeft');
  if (kind === 'bulleted') execRichCommand('insertUnorderedList');
  if (kind === 'numbered') execRichCommand('insertOrderedList');
}

function improveTextWithAi(text: string, action: AiActionId) {
  const trimmed = text.trim();
  const base = trimmed || 'Add a clear answer for your customers.';

  if (action === 'expand' || action === 'longer') {
    return `${base} Include what customers can expect, when they should take action, and the next best step.`;
  }
  if (action === 'concise' || action === 'shorter') {
    return base
      .replace(/\s+/g, ' ')
      .replace(/\btypically\s+/gi, '')
      .replace(/\bto minimize disruption and ensure your safety\b/gi, 'to keep you safe')
      .trim();
  }
  if (action === 'spelling') {
    return base
      .replace(/\s+/g, ' ')
      .replace(/\butilize\b/gi, 'use')
      .replace(/\bprioritize\b/gi, 'focus on')
      .trim();
  }
  if (action === 'aeo') {
    return `${base} In short: ${base.split(/[.!?]/)[0].trim()}. This gives search and AI answer engines a direct, citation-friendly response.`;
  }
  if (action === 'clarity') {
    return base.replace(/\s+/g, ' ').replace(/\butilize\b/gi, 'use').trim();
  }
  return `${base} For local customers, this applies across your nearby service area and can be tailored by city, suburb, or neighborhood.`;
}

function replaceInputText(input: TextInput, nextText: string) {
  const start = input.selectionStart ?? 0;
  const end = input.selectionEnd ?? input.value.length;
  const hasSelection = end > start;
  const nextValue = hasSelection
    ? `${input.value.slice(0, start)}${nextText}${input.value.slice(end)}`
    : nextText;

  input.value = nextValue;
  input.dispatchEvent(new Event('input', { bubbles: true }));
  const cursor = hasSelection ? start + nextText.length : nextText.length;
  input.setSelectionRange(cursor, cursor);
}

function applyAiAction(action: AiActionId) {
  const input = activeTextInput();
  const active = document.activeElement;

  if (input) {
    const start = input.selectionStart ?? 0;
    const end = input.selectionEnd ?? input.value.length;
    const selectedText = end > start ? input.value.slice(start, end) : input.value;
    input.classList.add('animate-pulse', 'bg-primary/[0.06]');
    window.setTimeout(() => {
      replaceInputText(input, improveTextWithAi(selectedText, action));
      input.classList.remove('animate-pulse', 'bg-primary/[0.06]');
      input.focus();
    }, 650);
    return;
  }

  if (active instanceof HTMLElement && active.isContentEditable) {
    const selectedText = window.getSelection()?.toString() || active.innerText;
    active.classList.add('animate-pulse', 'bg-primary/[0.06]');
    window.setTimeout(() => {
      document.execCommand('insertText', false, improveTextWithAi(selectedText, action));
      active.classList.remove('animate-pulse', 'bg-primary/[0.06]');
      active.focus();
    }, 650);
  }
}

function ToolbarButton({
  title,
  onClick,
  disabled,
  children,
  className,
}: {
  title: string;
  onClick?: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      disabled={disabled}
      onMouseDown={event => event.preventDefault()}
      onClick={onClick}
      className={cn(
        'flex size-[34px] items-center justify-center rounded-md text-muted-foreground transition-colors',
        'hover:bg-surface-hover hover:text-foreground disabled:opacity-30',
        className,
      )}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="h-5 w-px bg-border" />;
}

function MenuControl({
  title,
  value,
  options,
  onSelect,
  open,
  onOpenChange,
  className,
}: {
  title: string;
  value: string;
  options: string[];
  onSelect: (value: string) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  className?: string;
}) {
  return (
    <div className="relative">
      <button
        type="button"
        title={title}
        aria-label={title}
        onMouseDown={event => event.preventDefault()}
        onClick={() => onOpenChange(!open)}
        className={cn('relative flex h-[34px] items-center rounded-md pl-2 pr-6 text-[13px] text-foreground hover:bg-surface-hover', className)}
      >
        <span className="truncate">{value}</span>
        <ChevronDown size={13} strokeWidth={1.6} absoluteStrokeWidth className="absolute right-1.5 text-muted-foreground" />
      </button>
      {open && (
        <div className="absolute left-0 top-10 z-50 min-w-full rounded-md border border-border bg-background p-1 shadow-dropdown">
          {options.map(option => (
            <button
              key={option}
              type="button"
              onMouseDown={event => event.preventDefault()}
              onClick={() => {
                onSelect(option);
                onOpenChange(false);
              }}
              className={cn(
                'flex h-[34px] w-full items-center rounded-md px-2 text-left text-[13px] transition-colors hover:bg-surface-hover',
                option === value ? 'text-primary' : 'text-foreground',
              )}
            >
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ColorControl({
  value,
  open,
  onOpenChange,
  onSelect,
}: {
  value: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (value: string) => void;
}) {
  return (
    <div className="relative">
      <button
        type="button"
        title="Text color"
        aria-label="Text color"
        aria-expanded={open}
        onMouseDown={event => event.preventDefault()}
        onClick={() => onOpenChange(!open)}
        className={cn(
          'flex size-[34px] items-center justify-center rounded-md text-muted-foreground transition-colors',
          open ? 'bg-muted text-foreground' : 'hover:bg-surface-hover hover:text-foreground',
        )}
      >
        <span className="relative flex h-5 w-5 items-center justify-center">
          <Type size={18} strokeWidth={1.6} absoluteStrokeWidth />
          <span className="absolute bottom-0 h-0.5 w-4 rounded-full" style={{ backgroundColor: value }} />
        </span>
      </button>
      {open && (
        <div className="absolute left-0 top-10 z-50 w-[264px] rounded-md border border-border bg-background p-2 shadow-dropdown">
          <div className="grid grid-cols-8 gap-2">
            {COLOR_SWATCH_ROWS.flat().map(color => (
              <button
                key={color}
                type="button"
                title={color}
                aria-label={`Text color ${color}`}
                onMouseDown={event => event.preventDefault()}
                onClick={() => {
                  onSelect(color);
                  onOpenChange(false);
                }}
                className={cn(
                  'h-6 w-6 rounded-full shadow-sm ring-1 ring-border transition-transform hover:scale-105',
                  color === value && 'ring-2 ring-foreground ring-offset-2 ring-offset-background',
                )}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AiActionControl({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <div className="relative">
      <button
        type="button"
        title="AI actions"
        aria-label="AI actions"
        aria-expanded={open}
        onMouseDown={event => event.preventDefault()}
        onClick={() => onOpenChange(!open)}
        className={cn(
          'flex size-[34px] items-center justify-center rounded-md text-primary transition-colors',
          open ? 'bg-primary/10' : 'hover:bg-surface-hover',
        )}
      >
        <Sparkles size={17} strokeWidth={1.6} absoluteStrokeWidth />
      </button>
      {open && (
        <div className="absolute left-0 top-10 z-50 w-[216px] rounded-md border border-border bg-background p-1 shadow-dropdown">
          {AI_ACTIONS.map(action => {
            const Icon = action.icon;
            return (
              <button
                key={action.label}
                type="button"
                onMouseDown={event => event.preventDefault()}
                onClick={() => {
                  applyAiAction(action.id);
                  onOpenChange(false);
                }}
                className="flex h-[34px] w-full items-center gap-2 rounded-md px-2 text-left text-[13px] text-foreground transition-colors hover:bg-surface-hover"
              >
                <Icon size={15} strokeWidth={1.6} absoluteStrokeWidth className="text-muted-foreground" />
                <span>{action.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function EditorChromeToolbar({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  zoom,
  onZoomOut,
  onZoomIn,
  richTextVisible = false,
  canvasPosition,
  richTextPosition,
  inlineMode = false,
  mode = 'blog',
}: EditorChromeToolbarProps) {
  const [fontFamily, setFontFamily] = React.useState('Inter');
  const [textColor, setTextColor] = React.useState('#2f3340');
  const [openMenu, setOpenMenu] = React.useState<'ai' | 'font' | 'color' | null>(null);
  const [fontSizeNum, setFontSizeNum] = React.useState(15);
  const [toneOpen, setToneOpen] = React.useState(false);
  const position = richTextVisible && richTextPosition ? richTextPosition : canvasPosition;
  const improveActions = mode === 'faq' ? IMPROVE_ACTIONS_FAQ : IMPROVE_ACTIONS_BLOG;

  const richTextContent = (
    <>
      {/* 1. Magic Write */}
      <div className="relative">
        <button
          type="button"
          title="Magic Write"
          aria-label="Magic Write"
          onMouseDown={event => event.preventDefault()}
          onClick={() => { setOpenMenu(openMenu === 'ai' ? null : 'ai'); setToneOpen(false); }}
          className="flex size-[34px] items-center justify-center rounded-md transition-colors hover:bg-surface-hover"
        >
          <Sparkles size={16} strokeWidth={1.6} absoluteStrokeWidth className="text-[#9970D7]" />
        </button>
        {openMenu === 'ai' && (
          <div className="absolute left-0 top-10 z-50 w-[232px] rounded-md border border-border bg-background p-1 shadow-dropdown">
            {/* MODIFY section */}
            <p className="px-2 pb-1 pt-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
              Modify
            </p>

            {/* Change tone — has submenu */}
            <div className="relative">
              <button
                type="button"
                onMouseDown={event => event.preventDefault()}
                onClick={() => setToneOpen(v => !v)}
                className={cn(
                  'flex h-[34px] w-full items-center gap-2 rounded-md px-2 text-left text-[13px] transition-colors',
                  toneOpen ? 'bg-[#9970D7]/8 text-[#9970D7]' : 'text-foreground hover:bg-surface-hover',
                )}
              >
                <Mic size={15} strokeWidth={1.6} absoluteStrokeWidth className="shrink-0 text-[#9970D7]" />
                <span className="flex-1">Change tone</span>
                <ChevronRight size={13} strokeWidth={1.6} absoluteStrokeWidth className="shrink-0 text-muted-foreground" />
              </button>
              {toneOpen && (
                <div className="absolute left-full top-0 z-50 ml-1 w-[148px] rounded-md border border-border bg-background p-1 shadow-dropdown">
                  {TONE_OPTIONS.map(tone => (
                    <button
                      key={tone}
                      type="button"
                      onMouseDown={event => event.preventDefault()}
                      onClick={() => {
                        setToneOpen(false);
                        setOpenMenu(null);
                      }}
                      className="flex h-[34px] w-full items-center rounded-md px-2 text-left text-[13px] text-foreground transition-colors hover:bg-surface-hover"
                    >
                      {tone}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Make shorter / longer / Fix spelling */}
            {MODIFY_ACTIONS.map(action => {
              const Icon = action.icon;
              return (
                <button
                  key={action.id}
                  type="button"
                  onMouseDown={event => event.preventDefault()}
                  onClick={() => {
                    applyAiAction(action.id as AiActionId);
                    setOpenMenu(null);
                    setToneOpen(false);
                  }}
                  className="flex h-[34px] w-full items-center gap-2 rounded-md px-2 text-left text-[13px] text-foreground transition-colors hover:bg-surface-hover"
                >
                  <Icon size={15} strokeWidth={1.6} absoluteStrokeWidth className="shrink-0 text-[#9970D7]" />
                  <span>{action.label}</span>
                </button>
              );
            })}

          </div>
        )}
      </div>

      {/* 2. Divider */}
      <Divider />

      {/* 3. H1 */}
      <button
        type="button"
        title="Heading 1"
        aria-label="Heading 1"
        onMouseDown={event => event.preventDefault()}
        onClick={() => execRichCommand('formatBlock', 'H1')}
        className="flex size-[34px] items-center justify-center rounded-md text-[14px] text-muted-foreground hover:bg-surface-hover hover:text-foreground transition-colors"
      >
        H1
      </button>

      {/* 4. H2 */}
      <button
        type="button"
        title="Heading 2"
        aria-label="Heading 2"
        onMouseDown={event => event.preventDefault()}
        onClick={() => execRichCommand('formatBlock', 'H2')}
        className="flex size-[34px] items-center justify-center rounded-md text-[14px] text-muted-foreground hover:bg-surface-hover hover:text-foreground transition-colors"
      >
        H2
      </button>

      {/* 5. Divider */}
      <Divider />

      {/* 6. Font family */}
      <MenuControl
        title="Font family"
        value={fontFamily}
        options={['Inter', 'Arial', 'Georgia', 'Times New Roman']}
        open={openMenu === 'font'}
        onOpenChange={open => setOpenMenu(open ? 'font' : null)}
        onSelect={value => {
          setFontFamily(value);
          formatSelection('fontName', value);
        }}
        className="w-[130px] rounded-md border border-border"
      />

      {/* 7. Font size stepper */}
      <div className="flex items-center rounded-md border border-border">
        <button
          type="button"
          title="Decrease font size"
          aria-label="Decrease font size"
          onMouseDown={event => event.preventDefault()}
          onClick={() => {
            const next = Math.max(8, fontSizeNum - 1);
            setFontSizeNum(next);
            formatSelection('fontSize', String(next));
          }}
          className="flex h-7 w-7 items-center justify-center rounded-l-md text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground"
        >
          <Minus size={13} strokeWidth={1.6} absoluteStrokeWidth />
        </button>
        <span className="min-w-[28px] border-x border-border text-center text-[13px] tabular-nums text-foreground leading-7">
          {fontSizeNum}
        </span>
        <button
          type="button"
          title="Increase font size"
          aria-label="Increase font size"
          onMouseDown={event => event.preventDefault()}
          onClick={() => {
            const next = Math.min(96, fontSizeNum + 1);
            setFontSizeNum(next);
            formatSelection('fontSize', String(next));
          }}
          className="flex h-7 w-7 items-center justify-center rounded-r-md text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground"
        >
          <Plus size={13} strokeWidth={1.6} absoluteStrokeWidth />
        </button>
      </div>

      {/* 8. Divider */}
      <Divider />

      {/* 9. Text color */}
      <div className="relative">
        <button
          type="button"
          title="Text color"
          aria-label="Text color"
          aria-expanded={openMenu === 'color'}
          onMouseDown={event => event.preventDefault()}
          onClick={() => setOpenMenu(openMenu === 'color' ? null : 'color')}
          className={cn(
            'flex size-[34px] items-center justify-center rounded-md text-muted-foreground transition-colors',
            openMenu === 'color' ? 'bg-muted text-foreground' : 'hover:bg-surface-hover hover:text-foreground',
          )}
        >
          <span className="relative flex h-5 w-5 items-center justify-center">
            <Type size={18} strokeWidth={1.6} absoluteStrokeWidth />
            <span
              className="absolute bottom-0 h-0.5 w-4 rounded-full"
              style={{ background: 'linear-gradient(to right, #f44336, #ff9800, #ffeb3b, #4caf50, #2196f3, #9c27b0)' }}
            />
          </span>
        </button>
        {openMenu === 'color' && (
          <div className="absolute left-0 top-10 z-50 w-[264px] rounded-md border border-border bg-background p-2 shadow-dropdown">
            <div className="grid grid-cols-8 gap-2">
              {COLOR_SWATCH_ROWS.flat().map(color => (
                <button
                  key={color}
                  type="button"
                  title={color}
                  aria-label={`Text color ${color}`}
                  onMouseDown={event => event.preventDefault()}
                  onClick={() => {
                    setTextColor(color);
                    formatSelection('color', color);
                    setOpenMenu(null);
                  }}
                  className={cn(
                    'h-6 w-6 rounded-full shadow-sm ring-1 ring-border transition-transform hover:scale-105',
                    color === textColor && 'ring-2 ring-foreground ring-offset-2 ring-offset-background',
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 10. Highlight */}
      <div className="relative">
        <button
          type="button"
          title="Highlight color"
          onMouseDown={e => e.preventDefault()}
          onClick={() => execRichCommand('hiliteColor', '#fff176')}
          className="flex size-[34px] items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground"
        >
          <span className="relative flex h-5 w-5 items-center justify-center">
            <Highlighter size={16} strokeWidth={1.6} absoluteStrokeWidth />
            <span
              className="absolute bottom-0 h-0.5 w-4 rounded-full"
              style={{ background: 'linear-gradient(to right, #f44336, #ff9800, #ffeb3b, #4caf50, #2196f3, #9c27b0)' }}
            />
          </span>
        </button>
      </div>

      {/* 11. Divider */}
      <Divider />

      {/* 12. Bold */}
      <ToolbarButton title="Bold" onClick={() => formatSelection('bold')}>
        <Bold size={16} strokeWidth={1.6} absoluteStrokeWidth />
      </ToolbarButton>

      {/* 13. Italic */}
      <ToolbarButton title="Italic" onClick={() => formatSelection('italic')}>
        <Italic size={16} strokeWidth={1.6} absoluteStrokeWidth />
      </ToolbarButton>

      {/* 14. Underline */}
      <ToolbarButton title="Underline" onClick={() => formatSelection('underline')}>
        <Underline size={16} strokeWidth={1.6} absoluteStrokeWidth />
      </ToolbarButton>

      {/* 15. Strikethrough */}
      <ToolbarButton title="Strikethrough" onClick={() => execRichCommand('strikeThrough')}>
        <Strikethrough size={16} strokeWidth={1.6} absoluteStrokeWidth />
      </ToolbarButton>

      {/* 16. Divider */}
      <Divider />

      {/* 17. Align left */}
      <ToolbarButton title="Align left" onClick={() => formatSelection('alignLeft')}>
        <AlignLeft size={16} strokeWidth={1.6} absoluteStrokeWidth />
      </ToolbarButton>

      {/* 18. Bullets */}
      <ToolbarButton title="Bulleted list" onClick={() => formatSelection('bulleted')}>
        <List size={17} strokeWidth={1.6} absoluteStrokeWidth />
      </ToolbarButton>

      {/* 19. Line spacing */}
      <ToolbarButton title="Line spacing">
        <AlignVerticalSpaceAround size={16} strokeWidth={1.6} absoluteStrokeWidth />
      </ToolbarButton>

      {/* 20. Indent */}
      <ToolbarButton title="Indent" onClick={() => execRichCommand('indent')}>
        <Indent size={16} strokeWidth={1.6} absoluteStrokeWidth />
      </ToolbarButton>

      {/* 21. Outdent */}
      <ToolbarButton title="Outdent" onClick={() => execRichCommand('outdent')}>
        <Outdent size={16} strokeWidth={1.6} absoluteStrokeWidth />
      </ToolbarButton>

      {/* 22. Divider */}
      <Divider />

      {/* 23. Format painter */}
      <ToolbarButton title="Format painter">
        <PaintRoller size={16} strokeWidth={1.6} absoluteStrokeWidth />
      </ToolbarButton>
    </>
  );

  const nonRichContent = (
    <>
      <ToolbarButton title="Undo" onClick={onUndo} disabled={!canUndo}>
        <Undo2 size={16} strokeWidth={1.6} absoluteStrokeWidth />
      </ToolbarButton>
      <ToolbarButton title="Redo" onClick={onRedo} disabled={!canRedo}>
        <Redo2 size={16} strokeWidth={1.6} absoluteStrokeWidth />
      </ToolbarButton>
      <Divider />
      <ToolbarButton title="Zoom out" onClick={onZoomOut}>
        <ZoomOut size={16} strokeWidth={1.6} absoluteStrokeWidth />
      </ToolbarButton>
      <span className="min-w-10 text-center text-[13px] text-muted-foreground tabular-nums">
        {Math.round(zoom * 100)}%
      </span>
      <ToolbarButton title="Zoom in" onClick={onZoomIn}>
        <ZoomIn size={16} strokeWidth={1.6} absoluteStrokeWidth />
      </ToolbarButton>
    </>
  );

  if (inlineMode) {
    return (
      <div className="relative flex h-[48px] w-full flex-none items-center gap-1 rounded-md border border-border/60 bg-background px-4">
        {richTextVisible ? richTextContent : nonRichContent}
      </div>
    );
  }

  return (
    <div
      className="fixed z-50 -translate-x-1/2"
      style={{ top: position.top, left: position.left }}
    >
      <div className="flex h-[48px] items-center gap-1 rounded-md border border-border/60 bg-background px-4">
        {richTextVisible ? richTextContent : nonRichContent}
      </div>
    </div>
  );
}
