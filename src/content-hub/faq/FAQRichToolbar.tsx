/**
 * FAQRichToolbar — sticky formatting toolbar that appears above the canvas
 * when a question or answer is focused for inline editing.
 *
 * Controls: TextStyle · FontFamily · FontSize · Bold · Italic · Underline ·
 * Strikethrough · Alignment · Color · LineHeight · BulletList · NumberedList ·
 * AI+ · Personalize
 */
import React from 'react';
import {
  Bold, Italic, Underline, Strikethrough,
  AlignLeft, AlignCenter, AlignRight,
  List, ListOrdered, Sparkles, ChevronDown, Palette,
} from 'lucide-react';
import { cn } from '@/contenthub-ui/utils';

// ── Helpers ────────────────────────────────────────────────────────────────────

function execCmd(cmd: string, value?: string) {
  document.execCommand(cmd, false, value ?? undefined);
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function Divider() {
  return <div className="w-px h-4 bg-border mx-0.5 flex-shrink-0" />;
}

interface ToolBtnProps {
  onClick: () => void;
  title: string;
  children: React.ReactNode;
  active?: boolean;
}
function ToolBtn({ onClick, title, children, active }: ToolBtnProps) {
  return (
    <button
      onMouseDown={e => { e.preventDefault(); onClick(); }}
      title={title}
      className={cn(
        'flex items-center justify-center w-6 h-6 rounded transition-colors flex-shrink-0',
        active
          ? 'bg-primary/10 text-primary'
          : 'hover:bg-surface-hover text-muted-foreground hover:text-foreground',
      )}
    >
      {children}
    </button>
  );
}

interface SelectPillProps {
  label: string;
  minWidth?: string;
}
function SelectPill({ label, minWidth = 'auto' }: SelectPillProps) {
  return (
    <button
      onMouseDown={e => e.preventDefault()}
      className="flex items-center gap-0.5 h-6 px-1.5 rounded hover:bg-surface-hover text-muted-foreground hover:text-foreground transition-colors flex-shrink-0 text-[11px]"
      style={{ minWidth }}
    >
      <span className="truncate">{label}</span>
      <ChevronDown size={10} strokeWidth={1.6} absoluteStrokeWidth className="flex-shrink-0" />
    </button>
  );
}

// ── Component ──────────────────────────────────────────────────────────────────

interface FAQRichToolbarProps {
  /** Show/hide with a fade — false collapses opacity but keeps height so layout stays stable */
  visible: boolean;
}

export const FAQRichToolbar = ({ visible }: FAQRichToolbarProps) => {
  return (
    <div
      className={cn(
        'flex-shrink-0 flex items-center gap-0.5 px-2 h-10 border-b border-border bg-background',
        'overflow-x-auto transition-opacity duration-150',
        visible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
      )}
    >
      {/* Text style */}
      <SelectPill label="Paragraph" minWidth="76px" />
      <Divider />

      {/* Font family */}
      <SelectPill label="Inter" minWidth="56px" />

      {/* Font size */}
      <SelectPill label="14" minWidth="40px" />
      <Divider />

      {/* Bold / Italic / Underline / Strike */}
      <ToolBtn onClick={() => execCmd('bold')} title="Bold">
        <Bold size={13} strokeWidth={1.6} absoluteStrokeWidth />
      </ToolBtn>
      <ToolBtn onClick={() => execCmd('italic')} title="Italic">
        <Italic size={13} strokeWidth={1.6} absoluteStrokeWidth />
      </ToolBtn>
      <ToolBtn onClick={() => execCmd('underline')} title="Underline">
        <Underline size={13} strokeWidth={1.6} absoluteStrokeWidth />
      </ToolBtn>
      <ToolBtn onClick={() => execCmd('strikeThrough')} title="Strikethrough">
        <Strikethrough size={13} strokeWidth={1.6} absoluteStrokeWidth />
      </ToolBtn>
      <Divider />

      {/* Alignment */}
      <ToolBtn onClick={() => execCmd('justifyLeft')} title="Align left">
        <AlignLeft size={13} strokeWidth={1.6} absoluteStrokeWidth />
      </ToolBtn>
      <ToolBtn onClick={() => execCmd('justifyCenter')} title="Align center">
        <AlignCenter size={13} strokeWidth={1.6} absoluteStrokeWidth />
      </ToolBtn>
      <ToolBtn onClick={() => execCmd('justifyRight')} title="Align right">
        <AlignRight size={13} strokeWidth={1.6} absoluteStrokeWidth />
      </ToolBtn>
      <Divider />

      {/* Color */}
      <button
        onMouseDown={e => e.preventDefault()}
        title="Text color"
        className="flex items-center justify-center w-6 h-6 rounded hover:bg-surface-hover transition-colors flex-shrink-0"
      >
        <Palette size={13} strokeWidth={1.6} absoluteStrokeWidth className="text-muted-foreground" />
      </button>

      {/* Line height */}
      <SelectPill label="1.5×" minWidth="44px" />
      <Divider />

      {/* Lists */}
      <ToolBtn onClick={() => execCmd('insertUnorderedList')} title="Bullet list">
        <List size={13} strokeWidth={1.6} absoluteStrokeWidth />
      </ToolBtn>
      <ToolBtn onClick={() => execCmd('insertOrderedList')} title="Numbered list">
        <ListOrdered size={13} strokeWidth={1.6} absoluteStrokeWidth />
      </ToolBtn>
      <Divider />

      {/* AI+ button */}
      <button
        onMouseDown={e => e.preventDefault()}
        className="flex items-center gap-1 h-6 px-2 rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors flex-shrink-0 text-[11px]"
      >
        <Sparkles size={11} strokeWidth={1.6} absoluteStrokeWidth />
        AI+
      </button>

      {/* Personalize */}
      <SelectPill label="Personalize" minWidth="80px" />
    </div>
  );
};
