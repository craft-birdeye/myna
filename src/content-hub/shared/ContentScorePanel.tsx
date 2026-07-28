/**
 * ContentScorePanel — canonical AEO / content score right panel.
 *
 * ONE version, used everywhere: FAQ canvas, Blog editor, Landing page editor.
 *
 * Score is owned by the parent — this component reports bumps up via onItemFixed
 * so the parent can update the score displayed in both the card's ScoreBar and
 * this panel consistently.
 */

import React, { useState, useEffect } from 'react';
import { X, ChevronRight, AlertTriangle, Check } from 'lucide-react';
import { cn } from '@/contenthub-ui/utils';
import { scoreColor, scoreStrokeColor } from './scoreColors';
import { ContentScoreInfoTooltip } from './ContentScoreInfoTooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/contenthub-ui/dialog';
import { Checkbox } from '@/contenthub-ui/checkbox';

/**
 * Sentence-cases a metric label while preserving all-caps acronyms (SEO, AEO).
 * "Intent Match" → "Intent match", "SEO optimization" → "SEO optimization".
 */
function toSentenceCase(label: string): string {
  return label
    .split(' ')
    .map((word, idx) => {
      const isAcronym = word.length >= 2 && word === word.toUpperCase() && /[A-Z]/.test(word);
      if (isAcronym) return word;
      if (idx === 0) return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      return word.toLowerCase();
    })
    .join(' ');
}

// ── Types ──────────────────────────────────────────────────────────────────────

export interface ScoreDim {
  label: string;
  score: number;
  weight?: number;
  description?: string;
}

// Kept for backward compatibility
export interface QuickWin {
  label: string;
  description: string;
  action: string;
}

export interface ContentScorePanelProps {
  title?: string;
  /** Final display score (0–100), owned and computed by the parent */
  score: number;
  scoreLabel?: string;
  dimensions: ScoreDim[];
  quickWins?: QuickWin[];
  isRecalculating?: boolean;
  showClose?: boolean;
  onClose?: () => void;
  /** Called when an item fix resolves — parent adds bump to its score state */
  onItemFixed?: (bump: number) => void;
  /** Called immediately when an item's action is clicked — triggers canvas shimmer */
  onItemFixing?: () => void;
  /** Called immediately when "Fix all" is clicked — triggers canvas shimmer */
  onFixAll?: () => void;
  className?: string;
  /** Content changed since last score calculation */
  isStale?: boolean;
  /** User clicked "Recalculate score" */
  onRecalculate?: () => void;
  /** Max number of improvement items to show (undefined = show all) */
  maxImprovements?: number;
  /** Which fix copy to surface — FAQ-specific or blog-specific. Default 'faq'. */
  improvementSet?: 'faq' | 'blog';
  /** Blog is currently being regenerated — show loading state instead of stale score */
  isRegenerating?: boolean;
}

// ── Improvement items ─────────────────────────────────────────────────────────

interface ImprovementItem {
  id: string;
  label: string;
  description: string;
  action: string;
  scoreBump: number;
  /**
   * Index of the breakdown dimension this improvement belongs to.
   * Keyed by position (not label) so it maps correctly across editors whose
   * dimension sets differ (AEO: Intent Match…, Blog: Brand voice…).
   */
  dim: number;
  current: string;
  suggested: string;
}

// FAQ-flavoured fixes — copy references questions, answers, FAQ schema.
const FAQ_IMPROVEMENTS: ImprovementItem[] = [
  {
    id: 'variants',
    label: 'Add conversational variants',
    description: 'Rewrite 3–4 questions in the phrasing users actually type ("how do I…", "what is the best…") to capture voice search.',
    action: 'Rewrite questions',
    scoreBump: 3,
    dim: 0,
    current: 'How do I get more reviews?',
    suggested: 'How do I get more customer reviews for my business? What\'s the best way to ask for reviews without seeming pushy? These questions come up constantly — here\'s what actually works.',
  },
  {
    id: 'location',
    label: 'Add location keywords',
    description: 'Mention 2–3 city names in your answers to lift local citation probability.',
    action: 'Make it local',
    scoreBump: 5,
    dim: 1,
    current: 'We help businesses manage their online reputation.',
    suggested: 'We help businesses in Austin, Houston, and Dallas manage their online reputation and build trust with local customers.',
  },
  {
    id: 'schema',
    label: 'Add FAQ schema markup',
    description: 'Structured data lets search engines display your answers directly in results, boosting click-through rate by up to 20%.',
    action: 'Add schema',
    scoreBump: 5,
    dim: 1,
    current: '(No structured data added)',
    suggested: 'FAQ schema markup added — search engines can now surface your answers directly in results, improving click-through rate by up to 20%.',
  },
  {
    id: 'expand',
    label: 'Expand short answers',
    description: 'Answers under 40 words rank lower in AI-generated summaries.',
    action: 'Expand answers',
    scoreBump: 3,
    dim: 2,
    current: 'Yes, we offer refunds.',
    suggested: 'Yes, we offer full refunds within 30 days of purchase. To request a refund, contact our support team with your order number and reason. Refunds are processed within 5–7 business days to your original payment method.',
  },
  {
    id: 'bullets',
    label: 'Format long answers as bullets',
    description: 'Answers with 4+ sentences are 30% more likely to be featured in AI summaries when restructured as bullet points.',
    action: 'Reformat',
    scoreBump: 2,
    dim: 2,
    current: 'Our platform includes review management, social listening, messaging, surveys, insights dashboards, referral tracking, and listing management all in one place so teams don\'t need to switch between tools.',
    suggested: 'Our platform includes:\n• Review management and monitoring\n• Social listening and messaging\n• Surveys and insights dashboards\n• Referral tracking and listing management',
  },
  {
    id: 'links',
    label: 'Link to service pages',
    description: 'Anchor 2–3 answers to relevant service pages. Internal links strengthen page authority and lower bounce rate.',
    action: 'Add links',
    scoreBump: 4,
    dim: 3,
    current: 'Learn more about how we can help your business.',
    suggested: 'Learn more about our reputation management and local SEO services to see how we can help your business grow.',
  },
];

// Blog-flavoured fixes — copy references the article, sections, headings, links.
const BLOG_IMPROVEMENTS: ImprovementItem[] = [
  {
    id: 'blog-intent',
    label: 'Match the search query in your intro',
    description: 'Restate the target query in the first paragraph and H1 so the article signals its intent immediately.',
    action: 'Rewrite intro',
    scoreBump: 3,
    dim: 0,
    current: 'Social media no longer relies solely on manual effort.',
    suggested: 'If you\'re looking to scale social media with AI in 2026, this guide covers the data-backed trends transforming how teams plan, publish, and respond — without burning out.',
  },
  {
    id: 'blog-location',
    label: 'Add location keywords',
    description: 'Mention 2–3 city or region names across the article to lift local search visibility.',
    action: 'Make it local',
    scoreBump: 5,
    dim: 1,
    current: 'Businesses across the country are adopting AI tools for social media management.',
    suggested: 'Businesses in Austin, Dallas, and Houston are adopting AI tools for social media management — and gaining a measurable edge over competitors in their local markets.',
  },
  {
    id: 'blog-meta',
    label: 'Add a meta title and description',
    description: 'A keyword-rich meta title and description improve click-through from search results.',
    action: 'Add meta tags',
    scoreBump: 5,
    dim: 1,
    current: '(No meta description set)',
    suggested: 'Discover how AI is transforming social media in 2026. Birdeye data reveals the top trends — from automated scheduling to intelligent content creation — that businesses can\'t afford to ignore.',
  },
  {
    id: 'blog-expand',
    label: 'Expand thin sections',
    description: 'Sections under 80 words rank lower. Add detail or an example to each short section.',
    action: 'Expand sections',
    scoreBump: 3,
    dim: 2,
    current: 'AI tools can help with social media posting.',
    suggested: 'AI tools can help your team schedule posts at optimal times, monitor brand mentions in real time, respond to reviews instantly, and generate on-brand content — all without the manual overhead that slows most teams down.',
  },
  {
    id: 'blog-bullets',
    label: 'Break long paragraphs into bullets',
    description: 'Paragraphs over four sentences are easier to scan and more likely to be featured when restructured as bullet points.',
    action: 'Reformat',
    scoreBump: 2,
    dim: 2,
    current: 'The platform offers scheduling, analytics, reporting, engagement tracking, and content generation all in one place which makes it much easier for teams to manage their social presence without switching between multiple applications.',
    suggested: 'The platform offers:\n• Scheduling and smart analytics\n• Review monitoring and rapid response\n• On-brand AI content generation\n• Team collaboration without app-switching',
  },
  {
    id: 'blog-links',
    label: 'Link to service pages',
    description: 'Anchor 2–3 relevant phrases to your service pages to strengthen internal linking and page authority.',
    action: 'Add links',
    scoreBump: 4,
    dim: 3,
    current: 'This helps businesses grow their online presence and stay ahead of competitors.',
    suggested: 'This helps businesses grow their online presence. See how our reputation management and social media tools drive measurable results.',
  },
];

// ── Component ──────────────────────────────────────────────────────────────────

const RECALC_STEPS = [
  'Intent match',
  'Search visibility',
  'Content depth',
  'Brand alignment',
  'Publishing readiness',
];

export function ContentScorePanel({
  title = 'Content score',
  score,
  scoreLabel = 'AEO Content score',
  dimensions,
  isRecalculating = false,
  showClose = false,
  onClose,
  onItemFixed,
  onItemFixing,
  onFixAll,
  className,
  maxImprovements,
  improvementSet = 'faq',
  isStale = false,
  onRecalculate,
  isRegenerating = false,
}: ContentScorePanelProps) {
  const [doneIds, setDoneIds] = useState<Set<string>>(new Set());
  const [fixingIds, setFixingIds] = useState<Set<string>>(new Set());
  // Index of the dimension currently running its "Apply all fixes" action.
  const [fixingDim, setFixingDim] = useState<number | null>(null);
  // The single dimension label currently expanded (exclusive accordion).
  const [expandedDim, setExpandedDim] = useState<string | null>(null);
  // Current recalculation step index.
  const [recalcStep, setRecalcStep] = useState(0);

  type FixModalState =
    | { type: 'single'; item: ImprovementItem }
    | { type: 'multi'; dimLabel: string; dimIndex: number; items: ImprovementItem[] }
    | null;

  const [fixModal, setFixModal] = useState<FixModalState>(null);
  const [multiSelected, setMultiSelected] = useState<Set<string>>(new Set());

  // Fix copy varies by surface: blog editor talks about articles/sections,
  // FAQ editor talks about questions/answers.
  const ALL_IMPROVEMENTS = improvementSet === 'blog' ? BLOG_IMPROVEMENTS : FAQ_IMPROVEMENTS;

  // Single amber accent for the "needs attention" issue badge.
  const ATTENTION = scoreColor(60);

  // When the parent caps the visible list (e.g. recommendation flow shows
  // exactly one improvement), retire the whole section once the cap of fixes
  // has been reached — don't pull a replacement card in.
  const reachedFixCap = maxImprovements !== undefined && doneIds.size >= maxImprovements;
  const pendingItems = ALL_IMPROVEMENTS.filter(item => !doneIds.has(item.id));
  const visibleItems = reachedFixCap
    ? []
    : pendingItems.slice(0, maxImprovements ?? pendingItems.length);

  const cumulativeBump = ALL_IMPROVEMENTS
    .filter(i => doneIds.has(i.id))
    .reduce((sum, i) => sum + i.scoreBump, 0);
  const displayScore = Math.min(100, score + cumulativeBump);

  const pct = Math.max(0, Math.min(displayScore, 100));
  const color = scoreColor(displayScore).text;
  const barColor = scoreStrokeColor(displayScore);

  function handleFixItem(id: string) {
    if (fixingIds.has(id) || doneIds.has(id)) return;
    const item = ALL_IMPROVEMENTS.find(i => i.id === id)!;
    setFixingIds(prev => new Set([...prev, id]));
    onItemFixing?.();
    setTimeout(() => {
      setFixingIds(prev => { const next = new Set(prev); next.delete(id); return next; });
      setDoneIds(prev => new Set([...prev, id]));
      onItemFixed?.(item.scoreBump);
    }, 1200);
  }

  function handleFixDimension(dimIndex: number) {
    if (fixingDim !== null) return;
    const items = visibleItems.filter(item => item.dim === dimIndex);
    if (items.length === 0) return;
    const pendingIds = items.map(i => i.id);
    const totalBump = items.reduce((sum, i) => sum + i.scoreBump, 0);
    setFixingDim(dimIndex);
    setFixingIds(new Set(pendingIds));
    onFixAll?.();
    setTimeout(() => {
      setFixingIds(new Set());
      setDoneIds(prev => new Set([...prev, ...pendingIds]));
      setFixingDim(null);
      onItemFixed?.(totalBump);
    }, 1800);
  }

  function toggleDim(label: string) {
    setExpandedDim(prev => (prev === label ? null : label));
  }

  useEffect(() => {
    if (!isRecalculating) { setRecalcStep(0); return; }
    setRecalcStep(0);
    const timers: ReturnType<typeof setTimeout>[] = [];
    RECALC_STEPS.forEach((_, i) => {
      timers.push(setTimeout(() => setRecalcStep(i + 1), 1200 * (i + 1)));
    });
    return () => timers.forEach(clearTimeout);
  }, [isRecalculating]);

  function commitSingleFix(item: ImprovementItem) {
    setFixModal(null);
    handleFixItem(item.id);
  }

  function commitMultiFix(dimIndex: number, items: ImprovementItem[], selectedIds: Set<string>) {
    setFixModal(null);
    const selectedItems = items.filter(i => selectedIds.has(i.id));
    if (selectedItems.length === 0) return;
    if (selectedItems.length === 1) {
      handleFixItem(selectedItems[0].id);
    } else {
      handleFixDimension(dimIndex);
    }
  }

  return (
    <div className={cn('flex flex-col h-full min-h-0 bg-background', className)}>

      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between bg-surface px-2xl py-xl">
        <div className="flex items-center gap-1.5">
          <span className="text-[13px] text-foreground">{title}</span>
          <ContentScoreInfoTooltip side="bottom" sideOffset={6} />
        </div>
        {showClose && (
          <button
            type="button"
            onClick={onClose}
            className="flex items-center justify-center w-7 h-7 rounded hover:bg-surface-hover transition-colors text-muted-foreground hover:text-foreground"
            aria-label="Close"
          >
            <X size={14} strokeWidth={1.6} absoluteStrokeWidth />
          </button>
        )}
      </div>

      {/* Scrollable body */}
      <div className="flex-grow overflow-y-auto flex flex-col gap-4 px-4 py-5">

        {/* ── Phase 1: Blog regenerating — shimmer placeholder ── */}
        {isRegenerating ? (
          <div className="flex flex-col gap-4">
            <div className="flex items-baseline gap-1.5">
              <div className="h-12 w-20 animate-pulse rounded-lg bg-muted" />
              <div className="h-5 w-12 animate-pulse rounded-md bg-muted" />
            </div>
            <div className="h-3 w-28 animate-pulse rounded-full bg-muted -mt-2" />
            <div className="h-2 w-full animate-pulse rounded-full bg-muted" />
            <div className="flex flex-col gap-2 mt-2">
              {[58, 72, 64, 80, 50].map((w, i) => (
                <div key={i} className="flex items-center justify-between gap-4">
                  <div className="h-3 animate-pulse rounded-full bg-muted" style={{ width: `${w}%` }} />
                  <div className="h-3 w-6 animate-pulse rounded-full bg-muted" />
                </div>
              ))}
            </div>
          </div>

        ) : isRecalculating ? (
          /* ── Phase 2: Score recalculating — step animation ── */
          <div className="flex flex-col gap-4">
            {/* Score number still visible */}
            <div className="flex items-baseline gap-1.5">
              <span className="text-[52px] leading-none" style={{ color }}>{displayScore}</span>
              <span className="text-[20px] text-muted-foreground font-normal leading-none">/ 100</span>
            </div>
            <div className="flex items-center gap-1.5 -mt-2">
              <span className="text-[13px] text-muted-foreground">{scoreLabel}</span>
              <span className="text-[11px] animate-pulse ml-1" style={{ color }}>Recalculating…</span>
            </div>
            <div className="overflow-hidden" style={{ width: '100%', height: 8, borderRadius: 999, backgroundColor: '#E5E7EB' }}>
              <div style={{ width: `${pct}%`, height: '100%', borderRadius: 999, backgroundColor: barColor, transition: 'width 700ms ease' }} />
            </div>
          </div>

        ) : (
          /* ── Phase 3: Idle — stale banner + score + accordion ── */
          <div className="flex flex-col gap-4">
            {isStale && (
              <div className="rounded-lg border border-border bg-surface-hover p-2 flex flex-col gap-2">
                <div className="flex items-start gap-2">
                  <AlertTriangle size={14} strokeWidth={1.6} absoluteStrokeWidth className="text-text-secondary mt-0.5 flex-none" />
                  <div>
                    <p className="text-[12px] text-foreground">Score is out of date</p>
                    <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">
                      Your content has changed since the last calculation. Finish all edits before recalculating to get the most accurate score.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onRecalculate}
                  className="w-full rounded-md border border-border bg-background py-2 text-[12px] text-foreground hover:bg-surface-hover transition-colors"
                >
                  Recalculate score
                </button>
              </div>
            )}
            <div className="flex items-baseline gap-1.5">
              <span className="text-[52px] leading-none transition-all duration-700" style={{ color }}>{displayScore}</span>
              <span className="text-[20px] text-muted-foreground font-normal leading-none">/ 100</span>
            </div>
            <div className="flex items-center gap-1.5 -mt-2">
              <span className="text-[13px] text-muted-foreground font-normal leading-[20px]">{scoreLabel}</span>
            </div>
            <div
              className="overflow-hidden"
              aria-label={`${scoreLabel} progress: ${pct} percent`}
              role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}
              style={{ width: '100%', height: 8, minHeight: 8, borderRadius: 999, backgroundColor: '#E5E7EB' }}
            >
              <div style={{ width: `${pct}%`, minWidth: pct > 0 ? 8 : 0, height: '100%', borderRadius: 999, backgroundColor: barColor, transition: 'width 700ms ease, background-color 700ms ease' }} />
            </div>
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground/70 -mb-2">Score breakdown</p>
          </div>
        )}

        {/* Recalculating step list (phase 2) and accordion (phase 3) */}
        {!isRegenerating && (isRecalculating ? (
          <div className="flex flex-col gap-1 pt-1">
            <p className="text-[11px] text-muted-foreground mb-2">Analysing your content...</p>
            {RECALC_STEPS.map((step, idx) => {
              const isDone = idx < recalcStep;
              const isActive = idx === recalcStep;
              return (
                <div key={step} className="flex items-center gap-2 py-1">
                  <div className="flex-none size-4 flex items-center justify-center">
                    {isDone ? (
                      <div className="size-4 rounded-full bg-primary flex items-center justify-center">
                        <Check size={10} strokeWidth={1.6} absoluteStrokeWidth className="text-white" />
                      </div>
                    ) : isActive ? (
                      <div className="size-4 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
                    ) : (
                      <div className="size-4 rounded-full border-2 border-border" />
                    )}
                  </div>
                  <span className={cn(
                    'text-[12px]',
                    isDone ? 'text-foreground' : isActive ? 'text-foreground' : 'text-muted-foreground/60',
                  )}>
                    {step}
                  </span>
                  {isDone && (
                    <span className="ml-auto text-[11px] tabular-nums text-muted-foreground/60">
                      —
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {dimensions.map((dim, i) => {
              const dimItems = visibleItems.filter(item => item.dim === i);
              const dimBump = ALL_IMPROVEMENTS
                .filter(item => item.dim === i && doneIds.has(item.id))
                .reduce((sum, item) => sum + item.scoreBump, 0);
              const dimScore = Math.min(100, dim.score + dimBump);
              const isOpen = expandedDim === dim.label;
              const dimFixing = fixingDim === i;

              return (
                <div key={dim.label}>
                  {/* Metric header — always expandable */}
                  <button
                    type="button"
                    onClick={() => toggleDim(dim.label)}
                    className="w-full flex items-center justify-between gap-2 py-2 text-left cursor-pointer"
                    aria-expanded={isOpen}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <ChevronRight
                        size={14}
                        strokeWidth={1.6}
                        absoluteStrokeWidth
                        className={cn(
                          'flex-none text-muted-foreground/60 transition-transform duration-200',
                          isOpen && 'rotate-90',
                        )}
                      />
                      <span className="text-[13px] text-foreground truncate leading-[18px]">
                        {toSentenceCase(dim.label)}
                      </span>
                      {dimItems.length > 0 && (
                        <span
                          className="inline-flex items-center gap-0.5 rounded px-1 py-0.5 flex-none"
                          style={{ backgroundColor: ATTENTION.bg, color: ATTENTION.text }}
                        >
                          <AlertTriangle size={11} strokeWidth={1.6} absoluteStrokeWidth />
                          <span className="text-[11px] leading-none">{dimItems.length}</span>
                        </span>
                      )}
                    </div>
                    <span className="text-[13px] text-foreground tabular-nums leading-none flex-none">
                      {dimScore}
                    </span>
                  </button>

                  {/* Expanded content — description + issue list */}
                  {isOpen && (
                    <div className="flex flex-col gap-2 pb-2 pl-6">
                      {dim.description && (
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                          {dim.description}
                        </p>
                      )}
                      {dimItems.map(item => {
                        const isFixing = fixingIds.has(item.id) || dimFixing;
                        return (
                          <div
                            key={item.id}
                            className="rounded-lg border border-border bg-background p-4 flex flex-col gap-1.5"
                          >
                            {isFixing ? (
                              <div className="flex flex-col gap-2 animate-pulse">
                                <div className="h-2.5 w-1/3 rounded-full bg-muted" />
                                <div className="h-2.5 w-3/4 rounded-full bg-muted" />
                                <div className="h-2.5 w-full rounded-full bg-muted" />
                                <div className="h-2.5 w-1/4 rounded-full bg-primary/20" />
                              </div>
                            ) : (
                              <>
                                <span className="text-[12px] text-foreground">{item.label}</span>
                                <p className="text-[11px] text-muted-foreground leading-relaxed">{item.description}</p>
                                <button
                                  type="button"
                                  onClick={() => setFixModal({ type: 'single', item })}
                                  className="self-start text-[11px] text-primary mt-0.5"
                                >
                                  Fix this
                                </button>
                              </>
                            )}
                          </div>
                        );
                      })}
                      {dimItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            setMultiSelected(new Set(dimItems.map(it => it.id)));
                            setFixModal({ type: 'multi', dimLabel: toSentenceCase(dim.label), dimIndex: i, items: dimItems });
                          }}
                          disabled={dimFixing}
                          className="self-start text-[12px] text-primary disabled:opacity-50"
                        >
                          Apply {dimItems.length} fixes
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}

        <div className="h-2" />
      </div>

      {/* Single fix modal */}
      {fixModal?.type === 'single' && (() => {
        const item = fixModal.item;
        return (
          <Dialog open onOpenChange={() => setFixModal(null)}>
            <DialogContent className="sm:max-w-none w-[800px] max-h-[88vh] flex flex-col">
              <DialogHeader>
                <DialogTitle className="text-[15px]">Apply fix</DialogTitle>
                <p className="text-[12px] text-muted-foreground mt-0.5">{item.description}</p>
              </DialogHeader>

              <div className="grid grid-cols-2 gap-4 flex-1 overflow-y-auto py-2">
                {/* Current */}
                <div className="flex flex-col gap-2">
                  <span className="text-[11px] uppercase tracking-wide text-muted-foreground/70">Current</span>
                  <div className="rounded-md border border-border bg-surface-hover px-2 py-2 flex-1">
                    <p className="text-[13px] text-foreground leading-relaxed whitespace-pre-line">{item.current}</p>
                  </div>
                </div>
                {/* Suggested */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] uppercase tracking-wide text-muted-foreground/70">Suggested</span>
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] text-primary">
                      +{item.scoreBump} score lift
                    </span>
                  </div>
                  <div className="rounded-md border border-primary/30 bg-primary/5 px-2 py-2 flex-1">
                    <p className="text-[13px] text-foreground leading-relaxed whitespace-pre-line">{item.suggested}</p>
                  </div>
                </div>
              </div>

              <DialogFooter className="gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setFixModal(null)}
                  className="rounded-lg border border-border bg-background px-4 py-2 text-[13px] text-foreground hover:bg-surface-hover transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => commitSingleFix(item)}
                  className="rounded-lg bg-primary px-4 py-2 text-[13px] text-white hover:bg-primary/90 transition-colors"
                >
                  Apply fix
                </button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        );
      })()}

      {/* Multi fix modal */}
      {fixModal?.type === 'multi' && (() => {
        const { dimLabel, dimIndex, items } = fixModal;
        const allSelected = items.every(it => multiSelected.has(it.id));
        const selectedCount = items.filter(it => multiSelected.has(it.id)).length;

        function toggleAll() {
          if (allSelected) setMultiSelected(new Set());
          else setMultiSelected(new Set(items.map(it => it.id)));
        }

        function toggleItem(id: string) {
          setMultiSelected(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
          });
        }

        return (
          <Dialog open onOpenChange={() => setFixModal(null)}>
            <DialogContent className="sm:max-w-none w-[800px] max-h-[88vh] flex flex-col">
              <DialogHeader>
                <DialogTitle className="text-[15px]">Apply {dimLabel} fixes</DialogTitle>
                <p className="text-[12px] text-muted-foreground mt-0.5">
                  {items.length} issues found · Select the fixes you want to apply
                </p>
              </DialogHeader>

              {/* Select all row */}
              <div className="flex items-center justify-between border-b border-border pb-3 pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={toggleAll}
                  />
                  <span className="text-[13px] text-foreground">Select all</span>
                </label>
                <span className="text-[12px] text-muted-foreground">{selectedCount} of {items.length} selected</span>
              </div>

              {/* Scrollable list */}
              <div className="flex flex-col gap-4 overflow-y-auto flex-1 pr-1">
                {items.map(item => (
                  <label key={item.id} className="flex items-start gap-2 cursor-pointer">
                    <Checkbox
                      checked={multiSelected.has(item.id)}
                      onCheckedChange={() => toggleItem(item.id)}
                      className="mt-0.5 flex-none"
                    />
                    <div className="flex flex-col gap-2 flex-1 min-w-0">
                      <p className="text-[13px] text-foreground leading-relaxed">{item.description}</p>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] uppercase tracking-wide text-muted-foreground/70">Current</span>
                          <div className="rounded-md border border-border bg-surface-hover px-2.5 py-2">
                            <p className="text-[11px] text-foreground leading-relaxed whitespace-pre-line">{item.current}</p>
                          </div>
                        </div>
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] uppercase tracking-wide text-muted-foreground/70">Suggested</span>
                            <span className="text-[10px] text-primary">+{item.scoreBump} score lift</span>
                          </div>
                          <div className="rounded-md border border-primary/30 bg-primary/5 px-2.5 py-2">
                            <p className="text-[11px] text-foreground leading-relaxed whitespace-pre-line">{item.suggested}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </label>
                ))}
              </div>

              <DialogFooter className="gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setFixModal(null)}
                  className="rounded-lg border border-border bg-background px-4 py-2 text-[13px] text-foreground hover:bg-surface-hover transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={selectedCount === 0}
                  onClick={() => commitMultiFix(dimIndex, items, multiSelected)}
                  className="rounded-lg bg-primary px-4 py-2 text-[13px] text-white hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Apply {selectedCount} {selectedCount === 1 ? 'fix' : 'fixes'}
                </button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        );
      })()}
    </div>
  );
}

// ── Defaults ──────────────────────────────────────────────────────────────────

export const DEFAULT_AEO_DIMS: ScoreDim[] = [
  {
    label: 'Intent Match', score: 96, weight: 30,
    description: 'Measures how directly the content delivers on its title, topic, and the reader\'s search intent.',
  },
  {
    label: 'Search Visibility', score: 94, weight: 25,
    description: 'Evaluates how well the content is optimized to be surfaced by Google and AI search engines, covering keyword integration, query coverage, and internal linking.',
  },
  {
    label: 'Content Depth', score: 93, weight: 20,
    description: 'Assesses whether the content has real substance, a clear point of view, and brand-specific detail rather than generic filler.',
  },
  {
    label: 'Brand Alignment', score: 95, weight: 15,
    description: 'Checks that tone, terminology, differentiators, and calls to action are consistent with your brand voice and positioning.',
  },
  {
    label: 'Publishing Readiness', score: 92, weight: 10,
    description: 'A compliance gate that flags unsupported claims, missing disclaimers, and banned words. Scores below 70 block publishing regardless of other scores.',
  },
];

export const DEFAULT_OVERALL_SCORE: number = Math.round(
  DEFAULT_AEO_DIMS.reduce((s, d) => s + d.score * (d.weight ?? 25), 0) /
  DEFAULT_AEO_DIMS.reduce((s, d) => s + (d.weight ?? 25), 0),
);

export const DEFAULT_QUICK_WINS: QuickWin[] = [
  {
    label: 'Add location keywords',
    description: 'Mention 2–3 city names in your answers to lift local citation probability.',
    action: 'Make it local',
  },
  {
    label: 'Expand short answers',
    description: 'Answers under 40 words rank lower in AI-generated summaries.',
    action: 'Expand answers',
  },
];
