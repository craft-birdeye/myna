import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/contenthub-ui/utils';
import { type BlockComponentProps } from '../blockTypes';

interface FAQQAContent { question: string; answer: string }

export function FAQQABlock({ content, focused, onChange }: BlockComponentProps<FAQQAContent>) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className={cn(
      'w-full rounded-xl border transition-colors',
      focused ? 'border-primary/30 bg-primary/[0.02]' : 'border-border bg-background',
    )}>
      {/* Question row */}
      <div className="flex items-start gap-2 px-4 py-2">
        <span className="text-[11px] font-mono text-muted-foreground/60 flex-none mt-0.5">Q</span>
        <div
          contentEditable
          suppressContentEditableWarning
          data-placeholder="Type your question…"
          onInput={e => onChange({ question: (e.target as HTMLElement).innerText })}
          className="flex-1 text-[14px] text-foreground outline-none leading-snug empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground/50"
        >
          {content.question || undefined}
        </div>
        <button
          type="button"
          onClick={() => setExpanded(v => !v)}
          className="flex-none text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronDown
            size={14}
            strokeWidth={1.6}
            absoluteStrokeWidth
            className={cn('transition-transform duration-200', expanded ? 'rotate-0' : '-rotate-90')}
          />
        </button>
      </div>

      {/* Answer */}
      {expanded && (
        <div className="flex items-start gap-2 px-4 pb-4 border-t border-border/40">
          <span className="text-[11px] font-mono text-muted-foreground/60 flex-none mt-2.5">A</span>
          <div
            contentEditable
            suppressContentEditableWarning
            data-placeholder="Write a clear, helpful answer…"
            onInput={e => onChange({ answer: (e.target as HTMLElement).innerText })}
            className="flex-1 text-[13px] text-foreground leading-relaxed outline-none mt-2 empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground/50"
          >
            {content.answer || undefined}
          </div>
        </div>
      )}
    </div>
  );
}
