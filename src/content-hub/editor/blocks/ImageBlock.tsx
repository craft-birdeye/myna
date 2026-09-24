import React, { useRef } from 'react';
import { ImageIcon, Upload } from 'lucide-react';
import { type BlockComponentProps } from '../blockTypes';
import { cn } from '@/contenthub-ui/utils';

interface ImageContent { src: string; alt: string; caption: string; objectFit?: 'cover' | 'contain' | 'fill' }

export function ImageBlock({ content, style, focused, onChange }: BlockComponentProps<ImageContent>) {
  const { src, alt, caption, objectFit = 'cover' } = content;
  const fileRef = useRef<HTMLInputElement>(null);
  const align = style?.align === 'center' || style?.align === 'right' ? style.align : 'left';
  const width = style?.width === 'contained' ? 'contained' : 'full';
  const radius = Number(style?.radius ?? 8);
  const aspectRatio = typeof style?.aspectRatio === 'string' && style.aspectRatio !== 'auto'
    ? style.aspectRatio
    : undefined;

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    onChange({ src: url });
  }

  return (
    <div
      className={cn(
        'w-full space-y-2',
        align === 'center' && 'text-center',
        align === 'right' && 'text-right',
      )}
    >
      {src ? (
        <div
          className={cn(
            'relative group/img overflow-hidden',
            width === 'contained' && 'max-w-[720px]',
            align === 'center' && 'mx-auto',
            align === 'right' && 'ml-auto',
          )}
          style={{ borderRadius: radius, aspectRatio }}
        >
          <img
            src={src}
            alt={alt}
            className="h-full max-h-[400px] w-full"
            style={{ objectFit }}
          />
          {focused && (
            <div className="absolute right-2 top-2 flex items-center gap-1 opacity-0 transition-opacity group-hover/img:opacity-100">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="rounded border border-border bg-background/90 px-2 py-1 text-[11px] text-foreground"
              >
                Replace
              </button>
              <button
                type="button"
                onClick={() => onChange({ src: '' })}
                className="rounded border border-border bg-background/90 px-2 py-1 text-[11px] text-muted-foreground hover:text-destructive"
              >
                Remove
              </button>
            </div>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex h-[180px] w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-muted/30 transition-colors hover:border-primary/40"
          style={{ borderRadius: radius }}
        >
          <div className="size-10 rounded-full bg-muted flex items-center justify-center">
            <ImageIcon size={18} strokeWidth={1.6} absoluteStrokeWidth className="text-muted-foreground" />
          </div>
          <span className="text-[13px] text-muted-foreground">Click to upload image</span>
          <span className="text-[11px] text-muted-foreground/60">or paste an image URL below</span>
        </button>
      )}

      <input ref={fileRef} type="file" accept="image/*" className="sr-only" onChange={handleFile} />

      {/* URL input when empty */}
      {!src && focused && (
        <input
          type="url"
          placeholder="https://example.com/image.jpg"
          className="w-full text-[12px] border border-border rounded-md px-2 py-1.5 outline-none focus:border-primary transition-colors text-foreground bg-background"
          onBlur={e => { if (e.target.value) onChange({ src: e.target.value }); }}
        />
      )}

      {/* Alt text + caption */}
      {focused && (
        <div className="flex flex-col gap-1">
          <input
            type="text"
            value={alt}
            onChange={e => onChange({ alt: e.target.value })}
            placeholder="Alt text (for accessibility)…"
            className="text-[12px] text-muted-foreground bg-transparent border-b border-border/60 outline-none pb-0.5 focus:border-primary transition-colors"
          />
        </div>
      )}

      {/* Caption — always shown when there's content */}
      {(src || focused) && (
        <div
          contentEditable
          suppressContentEditableWarning
          data-placeholder="Add a caption (optional)…"
          onInput={e => onChange({ caption: (e.target as HTMLElement).innerText })}
          className="text-[12px] text-center text-muted-foreground outline-none empty:before:content-[attr(data-placeholder)] empty:before:opacity-50"
        >
          {caption || undefined}
        </div>
      )}
    </div>
  );
}
