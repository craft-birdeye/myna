import React from 'react';
import { type BlockComponentProps } from '../blockTypes';
import { cn } from '@/contenthub-ui/utils';

interface HeadingContent { text: string; level: 'h1' | 'h2' | 'h3'; align?: 'left' | 'center' | 'right' }

export function HeadingBlock({ content, style, focused, onChange }: BlockComponentProps<HeadingContent>) {
  const { text, level } = content;
  const align = content.align ?? (style?.align as string | undefined) ?? 'left';
  const maxWidth = style?.maxWidth === 'sm' ? 'max-w-[440px]' : style?.maxWidth === 'md' ? 'max-w-[640px]' : style?.maxWidth === 'lg' ? 'max-w-[800px]' : '';

  const sizeClass =
    level === 'h1' ? 'text-[28px]' :
    level === 'h2' ? 'text-[22px]' :
                     'text-[18px]';

  return (
    <div
      className={cn(
        'w-full',
        align === 'center' && 'text-center',
        align === 'right' && 'text-right',
      )}
    >
      {/* Level picker — only visible when focused */}
      {focused && (
        <div className="flex items-center gap-1 mb-2">
          {(['h1', 'h2', 'h3'] as const).map(l => (
            <button
              key={l}
              type="button"
              onClick={() => onChange({ level: l })}
              className={`text-[11px] px-2 py-0.5 rounded transition-colors ${
                level === l
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-surface-hover/80'
              }`}
            >
              {l.toUpperCase()}
            </button>
          ))}
        </div>
      )}
      <div
        contentEditable
        suppressContentEditableWarning
        data-placeholder={`${level.toUpperCase()} heading…`}
        onInput={e => onChange({ text: (e.target as HTMLElement).innerText })}
        className={cn(
          'w-full leading-snug text-foreground outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground/50',
          sizeClass,
          maxWidth,
          align === 'center' && 'mx-auto',
          align === 'right' && 'ml-auto',
        )}
      >
        {text || undefined}
      </div>
    </div>
  );
}
