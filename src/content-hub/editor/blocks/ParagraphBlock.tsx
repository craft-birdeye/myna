import React, { useRef, useEffect } from 'react';
import { type BlockComponentProps } from '../blockTypes';
import { cn } from '@/contenthub-ui/utils';

interface ParagraphContent { text: string; align?: 'left' | 'center' | 'right' }

export function ParagraphBlock({ content, style, onChange }: BlockComponentProps<ParagraphContent>) {
  const ref = useRef<HTMLDivElement>(null);
  const align = content.align ?? (style?.align as string | undefined) ?? 'left';
  const maxWidth = style?.maxWidth === 'sm' ? 'max-w-[440px]' : style?.maxWidth === 'md' ? 'max-w-[640px]' : style?.maxWidth === 'lg' ? 'max-w-[800px]' : '';

  // Sync external content changes (e.g. AI-generated text)
  useEffect(() => {
    if (ref.current && ref.current.innerText !== content.text) {
      ref.current.innerText = content.text ?? '';
    }
  }, [content.text]);

  return (
    <div
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      data-placeholder="Start writing…"
      onInput={e => onChange({ text: (e.target as HTMLElement).innerText })}
      className={cn(
        'w-full text-[14px] leading-relaxed text-foreground outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground/50',
        align === 'center' && 'mx-auto text-center',
        align === 'right' && 'ml-auto text-right',
        maxWidth,
      )}
    />
  );
}
