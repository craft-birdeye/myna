import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Copy, Check } from 'lucide-react';
import type { SearchAIRecommendation } from '@/search-ai/SearchAIRecommendationsPanel';
import { ContentScoreInfoTooltip } from '@/content-hub/shared/ContentScoreInfoTooltip';

// ── AEO sub-scores (mocked) ───────────────────────────────────────────────────

const BLOG_SUBSCORES = [
  { name: 'Intent Match',         you: 89 },
  { name: 'Search Visibility',    you: 94 },
  { name: 'Content Depth',        you: 91 },
  { name: 'Brand Alignment',      you: 88 },
  { name: 'Publishing Readiness', you: 91 },
];

const AEO_SCORE = 92;

// ── Copy button ───────────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text).catch(() => {});
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
    >
      {copied
        ? <Check size={13} strokeWidth={1.6} absoluteStrokeWidth className="text-primary" />
        : <Copy size={13} strokeWidth={1.6} absoluteStrokeWidth />}
    </button>
  );
}

// ── Modal ─────────────────────────────────────────────────────────────────────

interface SearchAIBlogPreviewModalProps {
  rec: SearchAIRecommendation | null;
  open: boolean;
  onClose: () => void;
}

export function SearchAIBlogPreviewModal({ rec, open, onClose }: SearchAIBlogPreviewModalProps) {
  if (!open || !rec) return null;
  const blog = rec.blogContent;
  if (!blog) return null;

  const slug = rec.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto"
      style={{ backgroundColor: 'rgba(33,33,33,0.64)' }}
      onClick={onClose}
    >
      <div
        className="relative bg-background rounded-lg shadow-modal flex flex-col overflow-hidden mt-12 mb-12"
        style={{ width: 1200, maxWidth: 'calc(100vw - 48px)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-border bg-background rounded-t-lg">
          <span className="text-[16px] text-foreground">Preview blog</span>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="h-9 rounded-md bg-primary px-4 text-[14px] text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Accept and edit blog
            </button>
            <button
              onClick={onClose}
              className="flex size-8 items-center justify-center rounded-md hover:bg-muted transition-colors"
            >
              <X size={16} strokeWidth={1.6} absoluteStrokeWidth className="text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Body: two bordered cards */}
        <div className="flex gap-5 px-5 pb-5 pt-5" style={{ maxHeight: 'calc(90vh - 64px)' }}>
          {/* Left card: AEO score panel */}
          <div className="w-[320px] shrink-0 border border-border rounded-lg overflow-y-auto bg-background">
            <div className="flex flex-col gap-4 px-5 py-5">
              {/* Big score */}
              <div className="flex items-baseline gap-1.5">
                <span className="text-[44px] leading-none" style={{ color: '#377e2c' }}>{AEO_SCORE}</span>
                <span className="text-[15px] text-muted-foreground">/ 100</span>
              </div>
              {/* Label */}
              <div className="flex items-center gap-1.5 -mt-2">
                <span className="text-[14px] text-muted-foreground">AEO Content score</span>
                <ContentScoreInfoTooltip side="bottom" sideOffset={6} />
              </div>
              {/* Progress bar */}
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${AEO_SCORE}%`, backgroundColor: '#377e2c' }}
                />
              </div>
              {/* Sub-scores */}
              <div className="flex flex-col divide-y divide-border">
                {BLOG_SUBSCORES.map(sub => (
                  <div key={sub.name} className="flex items-center justify-between gap-2 py-2.5">
                    <span className="text-[13px] text-foreground">{sub.name}</span>
                    <div className="flex items-baseline gap-0.5 shrink-0">
                      <span className="text-[14px] text-foreground">{sub.you}</span>
                      <span className="text-[12px] text-muted-foreground">/100</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right card: full article */}
          <div className="flex-1 min-w-0 border border-border rounded-lg overflow-y-auto flex flex-col">
            {/* Article header */}
            <div className="px-10 pt-8 pb-5 shrink-0">
              <h1 className="text-[24px] leading-tight tracking-tight text-foreground mb-4">
                {rec.title}
              </h1>
              <div className="flex items-center gap-2">
                <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                  AI
                </div>
                <span className="text-sm text-foreground">Birdeye AI</span>
                <span className="text-muted-foreground text-sm">·</span>
                <span className="text-sm text-muted-foreground">15 min read</span>
              </div>
            </div>

            {/* Hero image */}
            <div className="px-10 pb-6 shrink-0">
              <img
                src={blog.heroImage}
                alt={rec.title}
                className="w-full h-[220px] object-cover rounded-xl"
              />
            </div>

            {/* Article body */}
            <article className="flex flex-col flex-1 px-10 pb-8">
              {blog.sections.map((section, i) => (
                <div key={i} className={section.heading ? 'mt-6' : 'mt-2'}>
                  {section.heading && (
                    <h2 className="mb-2 text-[18px] text-foreground">{section.heading}</h2>
                  )}
                  {section.body && (
                    <p className="text-[14px] text-foreground leading-relaxed">{section.body}</p>
                  )}
                  {section.listItems && section.listItems.length > 0 && (
                    <ul className="mt-2 flex flex-col gap-1.5">
                      {section.listItems.map((item, j) => (
                        <li key={j} className="flex items-start gap-2.5 text-[14px] text-foreground leading-relaxed">
                          <span className="mt-2 w-1 h-1 rounded-full bg-primary shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </article>

            {/* SEO metadata footer */}
            <div className="border-t border-border px-8 py-5 shrink-0 flex flex-col gap-3 bg-muted/30">
              <p className="text-[11px] text-muted-foreground uppercase tracking-wide">SEO metadata</p>
              <div className="flex flex-col gap-2">
                {[
                  { label: 'Meta title',       value: blog.metaTitle,       mono: false },
                  { label: 'Meta description', value: blog.metaDescription, mono: false },
                  { label: 'Slug',             value: `/${slug}`,           mono: true  },
                ].map(({ label, value, mono }) => (
                  <div key={label} className="flex items-start justify-between gap-2 bg-background border border-border rounded px-3 py-2">
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</span>
                      <span className={`text-[13px] text-foreground leading-snug mt-1${mono ? ' font-mono text-muted-foreground' : ''}`}>
                        {value}
                      </span>
                    </div>
                    <CopyButton text={value} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
