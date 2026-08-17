import React from 'react';
import { UserCircle, X } from 'lucide-react';
import { type BlockComponentProps } from '../blockTypes';

interface AuthorBarContent { name: string; date: string; tags: string[] }

export function AuthorBarBlock({ content, focused, onChange }: BlockComponentProps<AuthorBarContent>) {
  const { name, date, tags } = content;

  function removeTag(idx: number) {
    onChange({ tags: tags.filter((_, i) => i !== idx) });
  }

  function handleTagKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if ((e.key === 'Enter' || e.key === ',') && e.currentTarget.value.trim()) {
      e.preventDefault();
      onChange({ tags: [...tags, e.currentTarget.value.trim()] });
      e.currentTarget.value = '';
    }
  }

  return (
    <div className="flex items-center gap-2 w-full py-2 border-y border-border/60">
      {/* Avatar placeholder */}
      <div className="size-[34px] rounded-full bg-primary/10 flex items-center justify-center flex-none">
        <UserCircle size={18} strokeWidth={1.6} absoluteStrokeWidth className="text-primary/60" />
      </div>

      <div className="flex flex-col gap-0.5 flex-1 min-w-0">
        {/* Author name */}
        <span
          contentEditable
          suppressContentEditableWarning
          data-placeholder="Author name…"
          onInput={e => onChange({ name: (e.target as HTMLElement).innerText })}
          className="text-[13px] text-foreground outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground/50"
        >
          {name || undefined}
        </span>

        {/* Date */}
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={date}
            onChange={e => onChange({ date: e.target.value })}
            className="text-[11px] text-muted-foreground bg-transparent outline-none border-0 p-0"
          />
        </div>
      </div>

      {/* Tags */}
      <div className="flex items-center gap-1 flex-wrap">
        {tags.map((tag, idx) => (
          <span key={idx} className="flex items-center gap-1 bg-primary/8 text-primary text-[11px] px-2 py-0.5 rounded-full">
            {tag}
            {focused && (
              <button type="button" onClick={() => removeTag(idx)}>
                <X size={10} strokeWidth={1.6} />
              </button>
            )}
          </span>
        ))}
        {focused && (
          <input
            type="text"
            placeholder="Add tag…"
            onKeyDown={handleTagKeyDown}
            className="text-[11px] text-muted-foreground bg-transparent outline-none border-b border-border/60 w-20 focus:border-primary transition-colors"
          />
        )}
      </div>
    </div>
  );
}
