import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { type BlockComponentProps } from '../blockTypes';
import { cn } from '@/contenthub-ui/utils';

interface Feature { icon: string; title: string; description: string }
interface FeatureGridContent { features: Feature[] }

export function FeatureGridBlock({ content, style, focused, onChange }: BlockComponentProps<FeatureGridContent>) {
  const { features } = content;
  const configuredColumns = Number(style?.columns ?? 0);
  const cardStyle = style?.cardStyle === 'elevated' ? 'elevated' : style?.cardStyle === 'outlined' ? 'outlined' : 'subtle';

  function updateFeature(idx: number, patch: Partial<Feature>) {
    onChange({ features: features.map((f, i) => i === idx ? { ...f, ...patch } : f) });
  }

  function addFeature() {
    onChange({ features: [...features, { icon: '✨', title: '', description: '' }] });
  }

  function removeFeature(idx: number) {
    if (features.length <= 1) return;
    onChange({ features: features.filter((_, i) => i !== idx) });
  }

  const columnCount = configuredColumns || (features.length <= 2 ? 2 : features.length === 3 ? 3 : 4);
  const cols = columnCount === 2 ? 'grid-cols-2' : columnCount === 3 ? 'grid-cols-3' : 'grid-cols-4';

  return (
    <div className="w-full space-y-3">
      <div className={`grid ${cols} gap-4`}>
        {features.map((feat, idx) => (
          <div
            key={idx}
            className={cn(
              'group/feat relative flex flex-col gap-2 rounded-xl border p-4 transition-colors hover:border-primary/20',
              cardStyle === 'elevated' && 'border-transparent bg-background shadow-sm',
              cardStyle === 'outlined' && 'border-border bg-background',
              cardStyle === 'subtle' && 'border-border bg-muted/30',
            )}
          >
            {/* Delete */}
            {focused && (
              <button
                type="button"
                onClick={() => removeFeature(idx)}
                className="absolute top-2 right-2 opacity-0 group-hover/feat:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
              >
                <Trash2 size={12} strokeWidth={1.6} absoluteStrokeWidth />
              </button>
            )}
            {/* Icon */}
            <input
              type="text"
              value={feat.icon}
              onChange={e => updateFeature(idx, { icon: e.target.value })}
              className="text-[24px] w-[34px] bg-transparent outline-none leading-none"
              maxLength={2}
            />
            {/* Title */}
            <div
              contentEditable
              suppressContentEditableWarning
              data-placeholder="Feature title…"
              onInput={e => updateFeature(idx, { title: (e.target as HTMLElement).innerText })}
              className="text-[14px] text-foreground outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground/50"
            >
              {feat.title || undefined}
            </div>
            {/* Description */}
            <div
              contentEditable
              suppressContentEditableWarning
              data-placeholder="Short description…"
              onInput={e => updateFeature(idx, { description: (e.target as HTMLElement).innerText })}
              className="text-[13px] text-muted-foreground leading-relaxed outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground/40"
            >
              {feat.description || undefined}
            </div>
          </div>
        ))}
      </div>

      {focused && features.length < 4 && (
        <button
          type="button"
          onClick={addFeature}
          className="flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-primary transition-colors"
        >
          <Plus size={13} strokeWidth={1.6} absoluteStrokeWidth />
          Add feature
        </button>
      )}
    </div>
  );
}
