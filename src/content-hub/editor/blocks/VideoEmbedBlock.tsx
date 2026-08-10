import React, { useState } from 'react';
import { Video, ExternalLink } from 'lucide-react';
import { type BlockComponentProps } from '../blockTypes';

interface VideoEmbedContent { url: string; caption: string }

function extractEmbedUrl(url: string): string | null {
  // YouTube
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  return null;
}

export function VideoEmbedBlock({ content, focused, onChange }: BlockComponentProps<VideoEmbedContent>) {
  const { url, caption } = content;
  const [inputVal, setInputVal] = useState(url);
  const embedUrl = url ? extractEmbedUrl(url) : null;

  function handleConfirm() {
    onChange({ url: inputVal });
  }

  return (
    <div className="w-full space-y-2">
      {embedUrl ? (
        <div className="relative w-full rounded-lg overflow-hidden aspect-video bg-surface">
          <iframe
            src={embedUrl}
            title="Video embed"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
          />
          {focused && (
            <button
              type="button"
              onClick={() => onChange({ url: '' })}
              className="absolute top-2 right-2 bg-background/90 border border-border text-[11px] px-2 py-1 rounded text-muted-foreground hover:text-destructive transition-colors"
            >
              Remove
            </button>
          )}
        </div>
      ) : (
        <div className="w-full h-[180px] rounded-lg border-2 border-dashed border-border bg-muted/30 flex flex-col items-center justify-center gap-2">
          <div className="size-10 rounded-full bg-muted flex items-center justify-center">
            <Video size={18} strokeWidth={1.6} absoluteStrokeWidth className="text-muted-foreground" />
          </div>
          <span className="text-[13px] text-muted-foreground">Paste a YouTube or Vimeo URL</span>
          <div className="flex items-center gap-2 w-[320px]">
            <input
              type="url"
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleConfirm()}
              placeholder="https://youtube.com/watch?v=…"
              className="flex-1 text-[12px] border border-border rounded-md px-2 py-1.5 outline-none focus:border-primary transition-colors text-foreground bg-background"
            />
            <button
              type="button"
              onClick={handleConfirm}
              className="flex items-center gap-1 px-2 py-1.5 rounded-md bg-primary text-primary-foreground text-[12px] hover:bg-primary/90 transition-colors"
            >
              <ExternalLink size={12} strokeWidth={1.6} absoluteStrokeWidth />
              Embed
            </button>
          </div>
        </div>
      )}

      {(url || focused) && (
        <div
          contentEditable
          suppressContentEditableWarning
          data-placeholder="Video caption (optional)…"
          onInput={e => onChange({ caption: (e.target as HTMLElement).innerText })}
          className="text-[12px] text-center text-muted-foreground outline-none empty:before:content-[attr(data-placeholder)] empty:before:opacity-50"
        >
          {caption || undefined}
        </div>
      )}
    </div>
  );
}
