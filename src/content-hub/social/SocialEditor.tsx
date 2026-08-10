/**
 * SocialEditor — 3-column editor for social post content.
 *
 * Left: AI/Manual toggle + mode-specific input
 * Center: Phone frame preview (live reactive)
 * Right: Content score breakdown + publish gate
 */
import React, { useState } from 'react';
import { ArrowLeft, Sparkles, Send, RotateCcw, CheckCircle2, TriangleAlert } from 'lucide-react';
import { AIIcon } from '@/assets/icons/AIIcon';
import { Button } from '@/contenthub-ui/button';
import { SegmentedToggle } from '@/contenthub-ui/segmented-toggle.v1';
import { SocialPhonePreviewPanel } from '../shared/SocialPhonePreviewPanel';
import { MiniScoreRing } from '../faq/MiniScoreRing';
import { scoreColor, scoreStrokeColor, STATUS_COLORS } from '../shared/scoreColors';
import { DIMENSIONS_BY_TYPE } from '../shared/ContentCard';

// ── Types ─────────────────────────────────────────────────────────────────────

type Mode = 'ai' | 'manual';

type Platform = 'instagram' | 'facebook' | 'linkedin' | 'twitter';

const PLATFORMS: Array<{ id: Platform; label: string }> = [
  { id: 'instagram', label: 'Instagram' },
  { id: 'facebook',  label: 'Facebook'  },
  { id: 'linkedin',  label: 'LinkedIn'  },
  { id: 'twitter',   label: 'X (Twitter)' },
];

// ── Mock score (fixed for demo) ───────────────────────────────────────────────

const MOCK_SCORE = 84;
const MOCK_DIMS = DIMENSIONS_BY_TYPE.social.map((label, i) => ({
  label,
  score: [87, 79, 90, 76][i],
}));

// ── Left panel — AI mode ──────────────────────────────────────────────────────

function AIModePanel({
  platform,
  onGenerate,
}: {
  platform: Platform;
  onGenerate: (prompt: string) => void;
}) {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const suggestions = [
    'Promote our spring special offer with urgency',
    'Highlight customer success story from last month',
    'Announce extended business hours for the season',
  ];

  const handleGenerate = () => {
    if (!prompt.trim() || isGenerating) return;
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      onGenerate(prompt);
    }, 1600);
  };

  return (
    <div className="flex flex-col gap-4 p-4 h-full overflow-y-auto">
      <div className="flex items-center gap-2">
        <Sparkles size={13} strokeWidth={1.6} absoluteStrokeWidth className="text-primary" />
        <span className="text-[12px] text-foreground">AI generates your post</span>
      </div>

      <div className="bg-muted/60 rounded-lg px-2 py-2">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Platform</span>
        <p className="text-[13px] text-foreground mt-0.5">{PLATFORMS.find((p) => p.id === platform)?.label}</p>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] text-muted-foreground">Describe what you want to say</label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g. Share how our spring promotions can help customers save on landscaping services…"
          rows={4}
          className="w-full text-[12px] border border-input rounded-md px-2 py-2 bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 leading-relaxed"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-[11px] text-muted-foreground">Or try a suggestion</span>
        {suggestions.map((s) => (
          <button
            key={s}
            onClick={() => setPrompt(s)}
            className="text-left text-[12px] text-foreground px-2 py-2 border border-border rounded-lg hover:border-primary/40 hover:bg-surface-hover transition-colors"
          >
            {s}
          </button>
        ))}
      </div>

      <Button
        variant="default"
        size="sm"
        disabled={!prompt.trim() || isGenerating}
        onClick={handleGenerate}
        className="mt-auto"
      >
        {isGenerating ? (
          <>
            <div className="w-3 h-3 rounded-full border-[1.5px] border-primary-foreground border-t-transparent animate-spin mr-2" />
            Generating…
          </>
        ) : (
          <>
            <Sparkles size={12} strokeWidth={1.6} absoluteStrokeWidth className="mr-1.5" />
            Generate post
          </>
        )}
      </Button>
    </div>
  );
}

// ── Left panel — Manual mode ──────────────────────────────────────────────────

function ManualModePanel({
  platform,
  caption,
  hashtags,
  onChange,
}: {
  platform: Platform;
  caption: string;
  hashtags: string;
  onChange: (caption: string, hashtags: string) => void;
}) {
  return (
    <div className="flex flex-col gap-4 p-4 h-full overflow-y-auto">
      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] text-muted-foreground">Platform</label>
        <div className="flex flex-wrap gap-1.5">
          {PLATFORMS.map((p) => (
            <span
              key={p.id}
              className={`text-[11px] px-2 py-0.5 rounded-md border cursor-default ${
                p.id === platform
                  ? 'border-primary/40 bg-primary/10 text-primary'
                  : 'border-border bg-muted text-muted-foreground'
              }`}
            >
              {p.label}
            </span>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] text-muted-foreground">
          Caption
          <span className="ml-1 tabular-nums">{caption.length}/2200</span>
        </label>
        <textarea
          value={caption}
          onChange={(e) => onChange(e.target.value, hashtags)}
          placeholder="Write your post caption here…"
          rows={6}
          className="w-full text-[12px] border border-input rounded-md px-2 py-2 bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 leading-relaxed"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] text-muted-foreground">Hashtags</label>
        <textarea
          value={hashtags}
          onChange={(e) => onChange(caption, e.target.value)}
          placeholder="#spring #local #offer"
          rows={2}
          className="w-full text-[12px] border border-input rounded-md px-2 py-2 bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        <p className="text-[10px] text-muted-foreground">Separate with spaces. AI suggests 5–8 hashtags for best reach.</p>
      </div>

      <Button variant="outline" size="sm" className="w-full gap-1.5 mt-auto">
        <Sparkles size={11} strokeWidth={1.6} absoluteStrokeWidth />
        Suggest hashtags with AI
      </Button>
    </div>
  );
}

// ── Right panel — Score ───────────────────────────────────────────────────────

function ScorePanel({
  score,
  dimensions,
  onPublish,
}: {
  score: number;
  dimensions: { label: string; score: number }[];
  onPublish: () => void;
}) {
  const { bg, text } = scoreColor(score);
  const canPublish = score >= 70;

  return (
    <div className="flex flex-col gap-4 p-4 border-l border-border h-full overflow-y-auto bg-background">
      {/* Score ring */}
      <div className="flex flex-col items-center gap-1 pt-2">
        <MiniScoreRing score={score} size={56} />
        <span className="text-[11px] text-muted-foreground mt-1">Content score</span>
        <span
          className="text-[11px] px-2 py-0.5 rounded-md"
          style={{ background: bg, color: text }}
        >
          {score >= 85 ? 'Strong' : score >= 70 ? 'Good — minor tweaks needed' : 'Needs improvement'}
        </span>
      </div>

      {/* Dimension breakdown */}
      <div className="border-t border-border pt-3">
        <p className="text-[11px] text-muted-foreground uppercase tracking-wide mb-2">Score breakdown</p>
        <div className="flex flex-col gap-2">
          {dimensions.map((d) => {
            const stroke = scoreStrokeColor(d.score);
            return (
              <div key={d.label} className="flex items-center gap-2">
                <span className="text-[11px] text-foreground w-[120px] shrink-0 leading-tight">{d.label}</span>
                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${d.score}%`, background: stroke }}
                  />
                </div>
                <span className="text-[10px] w-6 text-right shrink-0" style={{ color: stroke }}>
                  {d.score}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Compliance */}
      <div className="flex items-center gap-2 border-t border-border pt-3">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M7 1L2 3.5v3.5C2 9.93 4.24 12.22 7 13c2.76-.78 5-3.07 5-6V3.5L7 1z" stroke="#4CAE3D" strokeWidth="1.4" />
          <path d="M4.5 7L6.5 9L9.5 5" stroke="#4CAE3D" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="text-[12px]" style={{ color: STATUS_COLORS.ready.text }}>Compliance · Passed</span>
      </div>

      {/* Reach estimate */}
      <div className="bg-muted/50 rounded-lg px-2 py-2.5 border-t border-border">
        <p className="text-[11px] text-muted-foreground mb-1">Estimated reach</p>
        <div className="flex items-baseline gap-1">
          <span className="text-[18px] text-foreground">4.2K</span>
          <span className="text-[11px] text-muted-foreground">impressions</span>
        </div>
        <p className="text-[10px] text-muted-foreground mt-0.5">Based on your avg. engagement rate</p>
      </div>

      {/* Publish / save */}
      <div className="flex flex-col gap-2 mt-auto">
        {!canPublish && (
          <div className="flex items-start gap-2 bg-surface-hover border border-border rounded-lg px-2 py-2.5">
            <TriangleAlert size={13} strokeWidth={1.6} absoluteStrokeWidth className="text-text-secondary mt-0.5 shrink-0" />
            <p className="text-[11px] text-text-secondary leading-snug">Score below 70 — review before publishing</p>
          </div>
        )}
        {canPublish && (
          <div className="flex items-start gap-2 bg-primary/5 border border-green-200 rounded-lg px-2 py-2.5">
            <CheckCircle2 size={13} strokeWidth={1.6} absoluteStrokeWidth className="text-text-primary mt-0.5 shrink-0" />
            <p className="text-[11px] text-text-primary leading-snug">Ready to publish</p>
          </div>
        )}
        <Button variant="default" size="sm" className="w-full" onClick={onPublish} disabled={!canPublish}>
          <Send size={13} strokeWidth={1.6} absoluteStrokeWidth className="mr-1.5" />
          Publish post
        </Button>
        <Button variant="outline" size="sm" className="w-full">
          Save draft
        </Button>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export interface SocialEditorProps {
  /** The platform to edit for — drives preview + label */
  platform?: Platform;
  /** Initial caption (pre-filled from content card) */
  initialCaption?: string;
  /** Initial hashtags */
  initialHashtags?: string;
  onBack: () => void;
  onPublish?: () => void;
}

export const SocialEditor: React.FC<SocialEditorProps> = ({
  platform = 'instagram',
  initialCaption = '',
  initialHashtags = '',
  onBack,
  onPublish,
}) => {
  const [mode, setMode] = useState<Mode>('ai');
  const [caption, setCaption] = useState(initialCaption);
  const [hashtags, setHashtags] = useState(initialHashtags);
  const [generating, setGenerating] = useState(false);

  const handleAIGenerate = (prompt: string) => {
    void prompt;
    // Simulate AI fill
    setCaption('Transform your outdoor space this season 🌿 Our design team brings your vision to life — from drought-resistant gardens to full yard makeovers. Book a free consultation today.');
    setHashtags('#Landscaping #OutdoorLiving #GardenDesign #SustainableLandscaping #Spring');
    setGenerating(false);
  };

  return (
    <div className="flex flex-col h-full w-full bg-muted/20">
      {/* Header bar */}
      <div className="flex-shrink-0 bg-surface flex items-center justify-between px-2xl py-xl">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={16} strokeWidth={1.6} />
            Back to review
          </button>
          <div className="h-4 w-px bg-border" />
          <span className="text-[14px] text-foreground">Social post editor</span>
          <span className="text-[11px] px-2 py-0.5 rounded-md bg-muted text-muted-foreground">
            {PLATFORMS.find((p) => p.id === platform)?.label}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm">
            <RotateCcw size={13} strokeWidth={1.6} absoluteStrokeWidth className="mr-1.5" />
            Regenerate
          </Button>
        </div>
      </div>

      {/* Three columns */}
      <div className="flex flex-grow overflow-hidden">
        {/* Left — 260px */}
        <div className="w-[260px] flex-shrink-0 bg-background border-r border-border flex flex-col overflow-hidden">
          {/* AI/Manual toggle */}
          <div className="flex-shrink-0 px-4 py-2 border-b border-border">
            <SegmentedToggle
              items={[
                { value: 'ai' as Mode,     label: 'AI',     icon: <AIIcon size={20} /> },
                { value: 'manual' as Mode, label: 'Manual'  },
              ]}
              value={mode}
              onChange={setMode}
              className="w-full"
            />
          </div>
          <div className="flex-grow overflow-hidden">
            {mode === 'ai' ? (
              <AIModePanel platform={platform} onGenerate={handleAIGenerate} />
            ) : (
              <ManualModePanel
                platform={platform}
                caption={caption}
                hashtags={hashtags}
                onChange={(c, h) => { setCaption(c); setHashtags(h); }}
              />
            )}
          </div>
        </div>

        {/* Center — flex-1, phone preview */}
        <div className="flex-1 flex items-center justify-center overflow-auto bg-muted/30 p-8">
          <div className="flex flex-col items-center gap-6">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Preview</p>
            <SocialPhonePreviewPanel
              platforms={[platform]}
              postType="standard"
              tone="professional"
              autoHashtags={!hashtags}
              customHashtags={hashtags}
            />
          </div>
        </div>

        {/* Right — 272px */}
        <div className="w-[272px] flex-shrink-0 overflow-hidden">
          <ScorePanel
            score={MOCK_SCORE}
            dimensions={MOCK_DIMS}
            onPublish={onPublish ?? onBack}
          />
        </div>
      </div>
    </div>
  );
};
