import React from 'react';
import { Plus, ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/contenthub-ui/utils';
import { type BlockComponentProps } from '../blockTypes';

interface FAQItem { id: string; question: string; answer: string }
interface FAQSectionContent { title: string; items: FAQItem[] }

export function FAQSectionBlock({ content, focused, onChange }: BlockComponentProps<FAQSectionContent>) {
  const { title, items } = content;

  function updateItem(id: string, patch: Partial<FAQItem>) {
    onChange({ items: items.map(it => it.id === id ? { ...it, ...patch } : it) });
  }

  function addItem() {
    onChange({ items: [...items, { id: crypto.randomUUID(), question: '', answer: '' }] });
  }

  function removeItem(id: string) {
    if (items.length <= 1) return;
    onChange({ items: items.filter(it => it.id !== id) });
  }

  return (
    <div className="w-full space-y-3">
      {/* Section title */}
      <div
        contentEditable
        suppressContentEditableWarning
        data-placeholder="Section title (e.g. General questions)…"
        onInput={e => onChange({ title: (e.target as HTMLElement).innerText })}
        className="text-[16px] text-foreground outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground/50"
      >
        {title || undefined}
      </div>

      {/* Q&A pairs */}
      <div className="space-y-2">
        {items.map((item, idx) => (
          <div key={item.id} className="group/qa rounded-xl border border-border bg-background overflow-hidden">
            {/* Question */}
            <div className="flex items-start gap-2 px-4 py-2">
              <span className="text-[11px] font-mono text-muted-foreground/60 flex-none mt-0.5">Q{idx + 1}</span>
              <div
                contentEditable
                suppressContentEditableWarning
                data-placeholder="Question…"
                onInput={e => updateItem(item.id, { question: (e.target as HTMLElement).innerText })}
                className="flex-1 text-[13px] text-foreground outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground/50"
              >
                {item.question || undefined}
              </div>
              {focused && (
                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  className="opacity-0 group-hover/qa:opacity-100 transition-opacity text-muted-foreground hover:text-destructive text-[10px] flex-none"
                >
                  ✕
                </button>
              )}
            </div>
            {/* Answer */}
            <div className="flex items-start gap-2 px-4 pb-3 border-t border-border/40">
              <span className="text-[11px] font-mono text-muted-foreground/60 flex-none mt-2">A</span>
              <div
                contentEditable
                suppressContentEditableWarning
                data-placeholder="Answer…"
                onInput={e => updateItem(item.id, { answer: (e.target as HTMLElement).innerText })}
                className="flex-1 text-[13px] text-muted-foreground leading-relaxed outline-none mt-1.5 empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground/40"
              >
                {item.answer || undefined}
              </div>
            </div>
          </div>
        ))}
      </div>

      {focused && (
        <button
          type="button"
          onClick={addItem}
          className="flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-primary transition-colors"
        >
          <Plus size={12} strokeWidth={1.6} absoluteStrokeWidth />
          Add Q&amp;A
        </button>
      )}
    </div>
  );
}
