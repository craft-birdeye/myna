import React, { useRef } from 'react';
import { ImageIcon, Upload } from 'lucide-react';
import { type BlockComponentProps } from '../blockTypes';
import { cn } from '@/contenthub-ui/utils';

interface HeroContent {
  headline: string;
  subheadline: string;
  ctaLabel: string;
  ctaUrl: string;
  imageSrc?: string;
  imageAlt?: string;
  imagePosition?: 'none' | 'top' | 'left' | 'right' | 'background';
}

export function HeroBlock({ content, style, focused, onChange }: BlockComponentProps<HeroContent>) {
  const { headline, subheadline, ctaLabel, ctaUrl, imageSrc, imageAlt, imagePosition = 'none' } = content;
  const fileRef = useRef<HTMLInputElement>(null);
  const align = style?.align === 'left' || style?.align === 'right' ? style.align : 'center';
  const maxWidth = style?.maxWidth === 'sm' ? 'max-w-[440px]' : style?.maxWidth === 'lg' ? 'max-w-[720px]' : style?.maxWidth === 'full' ? 'max-w-none' : 'max-w-[560px]';
  const imageRadius = Number(style?.imageRadius ?? 12);
  const buttonRadius = Number(style?.buttonRadius ?? 8);
  const hasSideImage = Boolean(imageSrc) && (imagePosition === 'left' || imagePosition === 'right');
  const hasTopImage = Boolean(imageSrc) && imagePosition === 'top';
  const hasBackgroundImage = Boolean(imageSrc) && imagePosition === 'background';

  function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    onChange({
      imageSrc: URL.createObjectURL(file),
      imagePosition: imagePosition === 'none' ? 'top' : imagePosition,
    });
    event.target.value = '';
  }

  const textAlignClass = align === 'left' ? 'items-start text-left' : align === 'right' ? 'items-end text-right' : 'items-center text-center';
  const image = imageSrc ? (
    <div className="group/hero-img relative overflow-hidden" style={{ borderRadius: imageRadius }}>
      <img src={imageSrc} alt={imageAlt ?? ''} className="h-full min-h-[220px] w-full object-cover" />
      {focused && (
        <div className="absolute right-2 top-2 flex items-center gap-1 opacity-0 transition-opacity group-hover/hero-img:opacity-100">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="rounded border border-border bg-background/90 px-2 py-1 text-[11px] text-foreground"
          >
            Replace
          </button>
          <button
            type="button"
            onClick={() => onChange({ imageSrc: '', imagePosition: 'none' })}
            className="rounded border border-border bg-background/90 px-2 py-1 text-[11px] text-muted-foreground hover:text-destructive"
          >
            Remove
          </button>
        </div>
      )}
    </div>
  ) : null;

  return (
    <div
      className={cn(
        'relative w-full overflow-hidden rounded-xl border border-primary/15 bg-gradient-to-br from-primary/8 to-primary/3 p-8',
        hasSideImage ? 'grid gap-8 md:grid-cols-2' : 'flex flex-col gap-4',
      )}
    >
      {hasBackgroundImage && (
        <>
          <img src={imageSrc} alt="" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-background/75" />
        </>
      )}
      <input ref={fileRef} type="file" accept="image/*" className="sr-only" onChange={handleFile} />

      {hasTopImage && <div className="relative z-[1]">{image}</div>}
      {hasSideImage && imagePosition === 'left' && <div className="relative z-[1]">{image}</div>}

      <div className={cn('relative z-[1] flex flex-col gap-4', textAlignClass, hasSideImage && 'justify-center')}>
      {/* Headline */}
      <div
        contentEditable
        suppressContentEditableWarning
        data-placeholder="Main headline…"
        onInput={e => onChange({ headline: (e.target as HTMLElement).innerText })}
        className={cn('text-[28px] leading-tight text-foreground outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground/50', maxWidth)}
      >
        {headline || undefined}
      </div>

      {/* Subheadline */}
      <div
        contentEditable
        suppressContentEditableWarning
        data-placeholder="Supporting subheadline…"
        onInput={e => onChange({ subheadline: (e.target as HTMLElement).innerText })}
        className={cn('text-[16px] leading-relaxed text-muted-foreground outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground/40', maxWidth)}
      >
        {subheadline || undefined}
      </div>

      {/* CTA */}
      <div className={cn('flex flex-col gap-1', align === 'left' ? 'items-start' : align === 'right' ? 'items-end' : 'items-center')}>
        <div className="bg-primary px-6 py-2 text-[15px] text-primary-foreground" style={{ borderRadius: buttonRadius }}>
          <span
            contentEditable
            suppressContentEditableWarning
            data-placeholder="CTA label…"
            onInput={e => onChange({ ctaLabel: (e.target as HTMLElement).innerText })}
            className="outline-none empty:before:content-[attr(data-placeholder)] empty:before:opacity-60"
          >
            {ctaLabel || undefined}
          </span>
        </div>
        {focused && (
          <input
            type="url"
            value={ctaUrl}
            onChange={e => onChange({ ctaUrl: e.target.value })}
            placeholder="Button URL…"
            className="text-[11px] text-muted-foreground bg-transparent border-b border-border/60 outline-none w-56 pb-0.5 focus:border-primary transition-colors text-center"
          />
        )}
      </div>
      {focused && !imageSrc && (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="mt-2 flex h-[34px] items-center gap-2 rounded-lg border border-dashed border-border px-4 text-[12px] text-muted-foreground transition-colors hover:border-primary hover:text-primary"
        >
          <Upload size={13} strokeWidth={1.6} absoluteStrokeWidth />
          Add hero image
        </button>
      )}
      {focused && imageSrc && imagePosition === 'none' && (
        <button
          type="button"
          onClick={() => onChange({ imagePosition: 'top' })}
          className="mt-2 flex h-[34px] items-center gap-2 rounded-lg border border-border px-4 text-[12px] text-muted-foreground transition-colors hover:bg-surface-hover"
        >
          <ImageIcon size={13} strokeWidth={1.6} absoluteStrokeWidth />
          Show image
        </button>
      )}
      </div>

      {hasSideImage && imagePosition === 'right' && <div className="relative z-[1]">{image}</div>}
    </div>
  );
}
