import React from 'react';
import { type BlockComponentProps } from '../blockTypes';

interface QuoteContent { text: string; attribution: string }

export function QuoteBlock({ content, onChange }: BlockComponentProps<QuoteContent>) {
  return (
    <div className="border-l-4 border-primary/40 pl-4 py-1 w-full space-y-2">
      <div
        contentEditable
        suppressContentEditableWarning
        data-placeholder="Pull quote…"
        onInput={e => onChange({ text: (e.target as HTMLElement).innerText })}
        className="text-[16px] italic text-foreground leading-relaxed outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground/50"
      >
        {content.text || undefined}
      </div>
      <div
        contentEditable
        suppressContentEditableWarning
        data-placeholder="— Attribution (optional)"
        onInput={e => onChange({ attribution: (e.target as HTMLElement).innerText })}
        className="text-[12px] text-muted-foreground outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground/40"
      >
        {content.attribution || undefined}
      </div>
    </div>
  );
}
