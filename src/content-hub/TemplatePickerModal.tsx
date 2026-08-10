import React, { useState, useMemo } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/contenthub-ui/utils';
import { Dialog, DialogContent } from '@/contenthub-ui/dialog';
import { Badge } from '@/contenthub-ui/badge';
import { Input } from '@/contenthub-ui/input';
import { TEMPLATES, type TemplateItem, type ContentType } from './TemplateGallery';
import { EmailPreviewPanel } from './shared/EmailPreviewPanel';
import { SocialPhonePreviewPanel } from './shared/SocialPhonePreviewPanel';
import { FAQPreviewPanel } from './shared/FAQPreviewPanel';

// ── Filter tabs ────────────────────────────────────────────────────────────────

type FilterTab = 'all' | ContentType;

const FILTER_TABS: Array<{ id: FilterTab; label: string }> = [
  { id: 'all',      label: 'All' },
  { id: 'faq',      label: 'FAQ' },
  { id: 'social',   label: 'Social' },
  { id: 'email',    label: 'Email' },
  { id: 'blog',     label: 'Blog' },
  { id: 'response', label: 'Reviews' },
  { id: 'ads',      label: 'Ads' },
];

const TYPE_LABEL: Record<ContentType, string> = {
  faq: 'FAQ',
  social: 'Social',
  email: 'Email',
  blog: 'Blog',
  response: 'Review response',
  ads: 'Ads',
};

const TYPE_BADGE_VARIANT: Record<ContentType, 'default' | 'secondary' | 'outline' | 'success' | 'warning' | 'purple'> = {
  faq:      'outline',
  social:   'purple',
  email:    'default',
  blog:     'secondary',
  response: 'warning',
  ads:      'secondary',
};

// ── Canvas preview per type ────────────────────────────────────────────────────

function TemplatePreview({ template }: { template: TemplateItem }) {
  if (template.type === 'email') {
    return (
      <EmailPreviewPanel
        templateId={template.id === 'em-1' ? 'welcome' : template.id === 'em-2' ? 'promo' : template.id === 'em-3' ? 'reengagement' : 'review'}
        tone="warm"
        subjectCount={3}
      />
    );
  }
  if (template.type === 'social') {
    return (
      <SocialPhonePreviewPanel
        platforms={['facebook', 'instagram']}
        postType={template.id === 'soc-1' ? 'promotional' : 'engagement'}
        tone="friendly"
        autoHashtags
      />
    );
  }
  if (template.type === 'faq') {
    return (
      <FAQPreviewPanel
        template={template.id === 'faq-1' ? 'newpage' : template.id === 'faq-4' ? 'aeo' : 'optimizer'}
        objective={template.description}
        tone="Professional"
        faqCount={10}
        destinations={['library']}
      />
    );
  }
  // Blog / response / ads — generic shimmer preview
  return (
    <div className="bg-background border border-border rounded-[8px] p-5 flex flex-col gap-2 w-full">
      <div className="h-3 w-3/4 bg-muted rounded-full" />
      <div className="h-2 w-full bg-muted/60 rounded-full" />
      <div className="h-2 w-5/6 bg-muted/60 rounded-full" />
      <div className="h-2 w-4/6 bg-muted/60 rounded-full" />
      <div className="mt-2 h-2 w-full bg-muted/60 rounded-full" />
      <div className="h-2 w-3/4 bg-muted/60 rounded-full" />
      {template.previewLines.map((w, i) => (
        <div key={i} className="h-[8px] rounded-full bg-muted" style={{ width: `${w}%` }} />
      ))}
    </div>
  );
}

// ── Props ──────────────────────────────────────────────────────────────────────

interface TemplatePickerModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (template: TemplateItem) => void;
}

// ── Component ──────────────────────────────────────────────────────────────────

export const TemplatePickerModal = ({ open, onClose, onSelect }: TemplatePickerModalProps) => {
  const [filter, setFilter] = useState<FilterTab>('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<TemplateItem | null>(TEMPLATES[0]);

  const filtered = useMemo(() => {
    return TEMPLATES.filter((t) => {
      const matchesType = filter === 'all' || t.type === filter;
      const matchesSearch = !search.trim() || t.name.toLowerCase().includes(search.toLowerCase()) || t.description.toLowerCase().includes(search.toLowerCase());
      return matchesType && matchesSearch;
    });
  }, [filter, search]);

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-[920px] p-0 flex flex-row overflow-hidden max-h-[88vh] [&>button:last-of-type]:hidden"
                     style={{ height: 'min(680px, 88vh)' }}>

        {/* ── Left: filter + list ─────────────────────────────────────────── */}
        <div className="w-[300px] flex-shrink-0 border-r border-border flex flex-col overflow-hidden">

          {/* Header */}
          <div className="px-4 py-4 border-b border-border flex-shrink-0">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[14px] text-foreground">Templates</span>
              <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
                <X size={16} strokeWidth={1.6} absoluteStrokeWidth />
              </button>
            </div>
            {/* Search */}
            <div className="relative">
              <Search size={13} strokeWidth={1.6} absoluteStrokeWidth className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search templates…"
                className="pl-8 pr-3 text-[12px]"
              />
            </div>
          </div>

          {/* Filter pills */}
          <div className="flex flex-wrap gap-1.5 px-4 py-2 border-b border-border flex-shrink-0">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={cn(
                  'px-2.5 py-1 rounded-full text-[11px] transition-all',
                  filter === tab.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-surface-hover/80',
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Template list */}
          <div className="flex-grow overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-4 py-8 text-center text-[12px] text-muted-foreground">No templates match your search.</div>
            ) : (
              filtered.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelected(t)}
                  className={cn(
                    'w-full text-left px-4 py-2 border-b border-border transition-colors flex flex-col gap-0.5',
                    selected?.id === t.id
                      ? 'bg-primary/5 border-l-2 border-l-primary'
                      : 'hover:bg-surface-hover',
                  )}
                >
                  <Badge variant={TYPE_BADGE_VARIANT[t.type]} className="text-[10px] uppercase tracking-wide">{TYPE_LABEL[t.type]}</Badge>
                  <span className="text-[12px] text-foreground leading-snug">{t.name}</span>
                  <span className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">{t.description}</span>
                </button>
              ))
            )}
          </div>
        </div>

        {/* ── Right: preview ──────────────────────────────────────────────── */}
        <div className="flex-grow flex flex-col overflow-hidden bg-muted/20">

          {/* Preview area */}
          <div className="flex-grow overflow-y-auto flex items-start justify-center p-8">
            {selected ? (
              <div className="w-full max-w-[400px]">
                <TemplatePreview template={selected} />
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-[13px] text-muted-foreground">Select a template to preview</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex-shrink-0 border-t border-border bg-background px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {selected && (
                <>
                  <Badge variant={TYPE_BADGE_VARIANT[selected.type]} className="text-[10px] uppercase tracking-wide">{TYPE_LABEL[selected.type]}</Badge>
                  <span className="text-[13px] text-foreground">{selected.name}</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={onClose} className="px-4 py-2 text-[13px] text-muted-foreground hover:text-foreground transition-colors">
                Cancel
              </button>
              <button
                onClick={() => selected && onSelect(selected)}
                disabled={!selected}
                className={cn(
                  'px-4 py-2 rounded-md text-[13px] transition-all',
                  selected
                    ? 'bg-primary text-primary-foreground hover:opacity-90'
                    : 'bg-muted text-muted-foreground cursor-not-allowed',
                )}
              >
                Use this template →
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
