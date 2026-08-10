import React from 'react';
import { Plus, Trash2, Star } from 'lucide-react';
import { type BlockComponentProps } from '../blockTypes';

interface Testimonial { quote: string; author: string; role: string }
interface TestimonialsContent { items: Testimonial[] }

export function TestimonialsBlock({ content, focused, onChange }: BlockComponentProps<TestimonialsContent>) {
  const { items } = content;

  function updateItem(idx: number, patch: Partial<Testimonial>) {
    onChange({ items: items.map((t, i) => i === idx ? { ...t, ...patch } : t) });
  }

  function addItem() {
    onChange({ items: [...items, { quote: '', author: '', role: '' }] });
  }

  function removeItem(idx: number) {
    if (items.length <= 1) return;
    onChange({ items: items.filter((_, i) => i !== idx) });
  }

  const cols = items.length === 1 ? 'grid-cols-1' : items.length === 2 ? 'grid-cols-2' : 'grid-cols-3';

  return (
    <div className="w-full space-y-3">
      <div className={`grid ${cols} gap-4`}>
        {items.map((item, idx) => (
          <div key={idx} className="group/t relative flex flex-col gap-2 p-5 rounded-xl border border-border bg-background">
            {/* Delete */}
            {focused && (
              <button
                type="button"
                onClick={() => removeItem(idx)}
                className="absolute top-2 right-2 opacity-0 group-hover/t:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
              >
                <Trash2 size={12} strokeWidth={1.6} absoluteStrokeWidth />
              </button>
            )}
            {/* Stars */}
            <div className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} size={12} strokeWidth={0} fill="#F59E0B" className="text-text-secondary" />
              ))}
            </div>
            {/* Quote */}
            <div
              contentEditable
              suppressContentEditableWarning
              data-placeholder="Customer quote…"
              onInput={e => updateItem(idx, { quote: (e.target as HTMLElement).innerText })}
              className="text-[13px] text-foreground italic leading-relaxed outline-none flex-1 empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground/50"
            >
              {item.quote || undefined}
            </div>
            {/* Author */}
            <div className="flex flex-col gap-0.5 border-t border-border/60 pt-3">
              <div
                contentEditable
                suppressContentEditableWarning
                data-placeholder="Customer name…"
                onInput={e => updateItem(idx, { author: (e.target as HTMLElement).innerText })}
                className="text-[12px] text-foreground outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground/50"
              >
                {item.author || undefined}
              </div>
              <div
                contentEditable
                suppressContentEditableWarning
                data-placeholder="Role or location…"
                onInput={e => updateItem(idx, { role: (e.target as HTMLElement).innerText })}
                className="text-[11px] text-muted-foreground outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground/40"
              >
                {item.role || undefined}
              </div>
            </div>
          </div>
        ))}
      </div>

      {focused && items.length < 4 && (
        <button
          type="button"
          onClick={addItem}
          className="flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-primary transition-colors"
        >
          <Plus size={12} strokeWidth={1.6} absoluteStrokeWidth />
          Add testimonial
        </button>
      )}
    </div>
  );
}
