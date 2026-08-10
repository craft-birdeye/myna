import React from 'react';
import { type BlockComponentProps } from '../blockTypes';
import { cn } from '@/contenthub-ui/utils';

interface CTAContent { label: string; url: string; variant: 'primary' | 'secondary' | 'outline'; align?: 'left' | 'center' | 'right' }

export function CTABlock({ content, style, focused, onChange }: BlockComponentProps<CTAContent>) {
  const { label, url, variant } = content;
  const align = content.align ?? (style?.align as string | undefined) ?? 'left';
  const sizeClass = style?.size === 'sm' ? 'px-4 py-2 text-[13px]' : style?.size === 'lg' ? 'px-6 py-2 text-[15px]' : 'px-4 py-2.5 text-[14px]';
  const radius = Number(style?.radius ?? 8);

  const btnClass =
    variant === 'primary'   ? 'bg-primary text-primary-foreground hover:bg-primary/90' :
    variant === 'secondary' ? 'bg-secondary text-secondary-foreground hover:bg-secondary/80' :
                              'border border-border text-foreground hover:bg-surface-hover';

  return (
    <div
      className={cn(
        'flex w-full flex-col gap-2',
        align === 'center' ? 'items-center' : align === 'right' ? 'items-end' : 'items-start',
      )}
    >
      {/* Variant picker */}
      {focused && (
        <div className="flex items-center gap-1">
          {(['primary', 'secondary', 'outline'] as const).map(v => (
            <button
              key={v}
              type="button"
              onClick={() => onChange({ variant: v })}
              className={`text-[11px] px-2 py-0.5 rounded capitalize transition-colors ${
                variant === v
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-surface-hover/80'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      )}

      {/* Button preview — editable label */}
      <div className={cn('inline-flex items-center transition-colors', sizeClass, btnClass)} style={{ borderRadius: radius }}>
        <span
          contentEditable
          suppressContentEditableWarning
          data-placeholder="Button label…"
          onInput={e => onChange({ label: (e.target as HTMLElement).innerText })}
          className="outline-none empty:before:content-[attr(data-placeholder)] empty:before:opacity-60"
          onClick={e => e.preventDefault()}
        >
          {label || undefined}
        </span>
      </div>

      {/* URL input */}
      {focused && (
        <input
          type="url"
          value={url}
          onChange={e => onChange({ url: e.target.value })}
          placeholder="https://…"
          className="text-[12px] text-muted-foreground bg-transparent border-b border-border outline-none w-64 pb-0.5 focus:border-primary transition-colors"
        />
      )}
    </div>
  );
}
