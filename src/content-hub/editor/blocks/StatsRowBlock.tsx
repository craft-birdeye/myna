import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { type BlockComponentProps } from '../blockTypes';

interface Stat { value: string; label: string }
interface StatsRowContent { stats: Stat[] }

export function StatsRowBlock({ content, focused, onChange }: BlockComponentProps<StatsRowContent>) {
  const { stats } = content;

  function updateStat(idx: number, patch: Partial<Stat>) {
    onChange({ stats: stats.map((s, i) => i === idx ? { ...s, ...patch } : s) });
  }

  function addStat() {
    onChange({ stats: [...stats, { value: '', label: '' }] });
  }

  function removeStat(idx: number) {
    if (stats.length <= 1) return;
    onChange({ stats: stats.filter((_, i) => i !== idx) });
  }

  return (
    <div className="w-full">
      <div className="flex items-stretch gap-px bg-border rounded-xl overflow-hidden">
        {stats.map((stat, idx) => (
          <div key={idx} className="group/stat relative flex flex-col items-center gap-1 flex-1 bg-background px-4 py-6">
            {/* Delete */}
            {focused && (
              <button
                type="button"
                onClick={() => removeStat(idx)}
                className="absolute top-2 right-2 opacity-0 group-hover/stat:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
              >
                <Trash2 size={11} strokeWidth={1.6} absoluteStrokeWidth />
              </button>
            )}
            {/* Big value */}
            <div
              contentEditable
              suppressContentEditableWarning
              data-placeholder="0"
              onInput={e => updateStat(idx, { value: (e.target as HTMLElement).innerText })}
              className="text-[32px] text-foreground leading-none outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground/40 text-center"
            >
              {stat.value || undefined}
            </div>
            {/* Label */}
            <div
              contentEditable
              suppressContentEditableWarning
              data-placeholder="Label…"
              onInput={e => updateStat(idx, { label: (e.target as HTMLElement).innerText })}
              className="text-[12px] text-muted-foreground outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground/40 text-center"
            >
              {stat.label || undefined}
            </div>
          </div>
        ))}
      </div>

      {focused && stats.length < 5 && (
        <button
          type="button"
          onClick={addStat}
          className="flex items-center gap-1.5 mt-2 text-[12px] text-muted-foreground hover:text-primary transition-colors"
        >
          <Plus size={12} strokeWidth={1.6} absoluteStrokeWidth />
          Add stat
        </button>
      )}
    </div>
  );
}
