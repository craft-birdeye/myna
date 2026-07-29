import { X, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/contenthub-ui/utils';
import { Input } from '@/contenthub-ui/input';
import { Textarea } from '@/contenthub-ui/textarea';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface BlogMetaPanelProps {
  open: boolean;
  onClose: () => void;
}

// ── Mock seed data ─────────────────────────────────────────────────────────────

const LOCATION_OPTIONS = [
  '1001 - Mountain view, CA',
  '1002 - San Jose, CA',
  '1003 - Palo Alto, CA',
  '1004 - Sunnyvale, CA',
  '1005 - Santa Clara, CA',
];

// ── Sub-components ─────────────────────────────────────────────────────────────

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-[13px] text-foreground mb-1.5">
      {children}
      {required && <span className="text-destructive ml-0.5">*</span>}
    </label>
  );
}

function ImageThumbnail({ src, onEdit }: { src: string; onEdit: () => void }) {
  return (
    <div className="relative rounded-lg overflow-hidden border border-border aspect-video bg-muted">
      <img src={src} alt="Blog featured image" className="w-full h-full object-cover" />
      <button
        type="button"
        onClick={onEdit}
        className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-md bg-background/90 text-foreground shadow-sm border border-border hover:bg-surface-hover transition-colors"
        aria-label="Edit image"
      >
        <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 2l2 2-7 7H3v-2L10 2z" />
        </svg>
      </button>
    </div>
  );
}

// ── Panel content ──────────────────────────────────────────────────────────────

function BlogMetaPanelContent({ onClose }: { onClose: () => void }) {
  const [title, setTitle] = useState('Are dental implants right for you?');
  const [author, setAuthor] = useState('Smile Dental Group');
  const [summary, setSummary] = useState(
    'Dental implants are the gold standard for replacing missing teeth — a permanent, natural-looking solution that preserves jaw bone and restores full function.',
  );
  const [urlSlug, setUrlSlug] = useState('are-dental-implants-right-for-you');
  const [locationOpen, setLocationOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(LOCATION_OPTIONS[0]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between bg-surface px-2xl py-xl">
        <span className="text-[13px] text-foreground">Configure blog metadata</span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close metadata panel"
          className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-surface-hover hover:text-foreground transition-colors"
        >
          <X size={14} strokeWidth={1.6} absoluteStrokeWidth />
        </button>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">
        {/* Title */}
        <div>
          <FieldLabel>Title</FieldLabel>
          <Input
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="h-[34px] rounded-md border border-border-selected bg-surface text-[13px] focus-visible:border-primary focus-visible:ring-primary/10"
          />
        </div>

        {/* Author */}
        <div>
          <FieldLabel>Author</FieldLabel>
          <Input
            value={author}
            onChange={e => setAuthor(e.target.value)}
            className="h-[34px] rounded-md border border-border-selected bg-surface text-[13px] focus-visible:border-primary focus-visible:ring-primary/10"
          />
        </div>

        {/* Summary */}
        <div>
          <FieldLabel>Summary</FieldLabel>
          <Textarea
            value={summary}
            onChange={e => setSummary(e.target.value)}
            rows={4}
            className="rounded-md border border-border-selected bg-surface text-[13px] resize-none focus-visible:border-primary focus-visible:ring-primary/10"
          />
        </div>

        {/* URL Slug */}
        <div>
          <FieldLabel>URL Slug</FieldLabel>
          <Input
            value={urlSlug}
            onChange={e => setUrlSlug(e.target.value)}
            className="h-[34px] rounded-md border border-border-selected bg-surface text-[13px] font-mono focus-visible:border-primary focus-visible:ring-primary/10"
          />
        </div>

        {/* Image */}
        <div>
          <FieldLabel>Image</FieldLabel>
          <ImageThumbnail
            src="https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=600&q=80"
            onEdit={() => {}}
          />
        </div>

        {/* Keywords / Location */}
        <div>
          <FieldLabel>Keywords</FieldLabel>
          <div className="relative">
            <button
              type="button"
              onClick={() => setLocationOpen(v => !v)}
              className={cn(
                'flex h-[34px] w-full items-center justify-between rounded-md border bg-surface px-md text-[13px] text-text-primary transition-colors hover:bg-surface-l2',
                locationOpen
                  ? 'border-primary ring-[3px] ring-primary/10'
                  : 'border-border-selected',
              )}
            >
              <span className="truncate">{selectedLocation}</span>
              <ChevronDown size={13} strokeWidth={1.6} absoluteStrokeWidth className={cn('shrink-0 text-muted-foreground transition-transform', locationOpen && 'rotate-180')} />
            </button>
            {locationOpen && (
              <div className="absolute z-10 mt-1 w-full rounded-md border border-border bg-background shadow-card overflow-hidden">
                {LOCATION_OPTIONS.map(loc => (
                  <button
                    key={loc}
                    type="button"
                    onClick={() => { setSelectedLocation(loc); setLocationOpen(false); }}
                    className={cn(
                      'flex w-full items-center px-2 py-2 text-[13px] text-left transition-colors hover:bg-surface-hover',
                      loc === selectedLocation && 'text-primary',
                    )}
                  >
                    {loc}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Export ─────────────────────────────────────────────────────────────────────

export function BlogMetaPanel({ open, onClose }: BlogMetaPanelProps) {
  return (
    <div
      className={cn(
        'flex-none flex flex-col h-full transition-all duration-200 overflow-hidden',
        open ? 'w-[300px]' : 'w-0',
      )}
      aria-hidden={!open}
    >
      <div className="w-[300px] flex flex-col flex-1 min-h-0 rounded-xl border border-border/60 bg-background overflow-hidden">
        {open && <BlogMetaPanelContent onClose={onClose} />}
      </div>
    </div>
  );
}
