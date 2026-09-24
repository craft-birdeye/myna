import React, { useRef } from 'react';
import { ImageIcon, AlignLeft, AlignRight } from 'lucide-react';
import { type BlockComponentProps } from '../blockTypes';

interface ImageTextContent {
  src: string; alt: string; headline: string; body: string;
  imagePosition: 'left' | 'right';
}

export function ImageTextBlock({ content, style, focused, onChange }: BlockComponentProps<ImageTextContent>) {
  const { src, alt, headline, body, imagePosition } = content;
  const fileRef = useRef<HTMLInputElement>(null);
  const imageRadius = Number(style?.imageRadius ?? 8);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    onChange({ src: URL.createObjectURL(file) });
  }

  const imageSlot = (
    <div className="flex-1 min-w-0">
      {src ? (
        <div className="group/image-text relative overflow-hidden" style={{ borderRadius: imageRadius }}>
          <img src={src} alt={alt} className="h-[240px] w-full object-cover" />
          {focused && (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="absolute right-2 top-2 rounded border border-border bg-background/90 px-2 py-1 text-[11px] text-foreground opacity-0 transition-opacity group-hover/image-text:opacity-100"
            >
              Replace
            </button>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex h-[240px] w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-muted/30 transition-colors hover:border-primary/40"
          style={{ borderRadius: imageRadius }}
        >
          <ImageIcon size={20} strokeWidth={1.6} absoluteStrokeWidth className="text-muted-foreground" />
          <span className="text-[12px] text-muted-foreground">Upload image</span>
        </button>
      )}
      <input ref={fileRef} type="file" accept="image/*" className="sr-only" onChange={handleFile} />
    </div>
  );

  const textSlot = (
    <div className="flex-1 min-w-0 flex flex-col gap-2 justify-center">
      <div
        contentEditable
        suppressContentEditableWarning
        data-placeholder="Headline…"
        onInput={e => onChange({ headline: (e.target as HTMLElement).innerText })}
        className="text-[20px] text-foreground leading-snug outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground/50"
      >
        {headline || undefined}
      </div>
      <div
        contentEditable
        suppressContentEditableWarning
        data-placeholder="Body text…"
        onInput={e => onChange({ body: (e.target as HTMLElement).innerText })}
        className="text-[14px] text-foreground leading-relaxed outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground/50"
      >
        {body || undefined}
      </div>
    </div>
  );

  return (
    <div className="w-full space-y-3">
      {/* Position toggle */}
      {focused && (
        <div className="flex items-center gap-1">
          {([{ val: 'left' as const, icon: AlignLeft, label: 'Image left' }, { val: 'right' as const, icon: AlignRight, label: 'Image right' }]).map(({ val, icon: Icon, label }) => (
            <button
              key={val}
              type="button"
              onClick={() => onChange({ imagePosition: val })}
              className={`flex items-center gap-1 text-[11px] px-2 py-0.5 rounded transition-colors ${
                imagePosition === val
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-surface-hover/80'
              }`}
            >
              <Icon size={11} strokeWidth={1.6} absoluteStrokeWidth />
              {label}
            </button>
          ))}
        </div>
      )}

      <div className="flex gap-6">
        {imagePosition === 'left' ? <>{imageSlot}{textSlot}</> : <>{textSlot}{imageSlot}</>}
      </div>
    </div>
  );
}
