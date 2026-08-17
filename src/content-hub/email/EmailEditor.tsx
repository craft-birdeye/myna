/**
 * EmailEditor — 3-column editor for email campaign content.
 *
 * Left:   AI/Manual toggle + mode-specific fields
 * Center: Email template preview (600px width simulation)
 * Right:  Content score + open-rate prediction + publish gate
 */
import React, { useState } from 'react';
import { ArrowLeft, Sparkles, Send, RotateCcw, CheckCircle2, TriangleAlert, Plus, Minus } from 'lucide-react';
import { AIIcon } from '@/assets/icons/AIIcon';
import { Button } from '@/contenthub-ui/button';
import { SegmentedToggle } from '@/contenthub-ui/segmented-toggle.v1';
import { EmailPreviewPanel } from '../shared/EmailPreviewPanel';
import { MiniScoreRing } from '../faq/MiniScoreRing';
import { scoreColor, scoreStrokeColor, STATUS_COLORS } from '../shared/scoreColors';
import { DIMENSIONS_BY_TYPE } from '../shared/ContentCard';

// ── Types ─────────────────────────────────────────────────────────────────────

type Mode = 'ai' | 'manual';

// ── Mock score ────────────────────────────────────────────────────────────────

const MOCK_SCORE = 81;
const MOCK_DIMS = DIMENSIONS_BY_TYPE.email.map((label, i) => ({
  label,
  score: [85, 78, 83, 72][i],
}));
const MOCK_OPEN_RATE = 34;

// ── Subject variant row ───────────────────────────────────────────────────────

function SubjectVariantRow({
  variants,
  onAdd,
  onRemove,
  onChange,
}: {
  variants: string[];
  onAdd: () => void;
  onRemove: (i: number) => void;
  onChange: (i: number, val: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label className="text-[11px] text-muted-foreground">Subject lines</label>
        {variants.length < 3 && (
          <button
            onClick={onAdd}
            className="flex items-center gap-0.5 text-[11px] text-primary hover:underline"
          >
            <Plus size={10} strokeWidth={1.6} absoluteStrokeWidth />
            Add variant
          </button>
        )}
      </div>
      {variants.map((v, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <span className="text-[10px] text-muted-foreground w-4 shrink-0">{String.fromCharCode(65 + i)}</span>
          <input
            value={v}
            onChange={(e) => onChange(i, e.target.value)}
            className="flex-1 text-[12px] border border-input rounded-md h-[34px] px-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 min-w-0"
            placeholder={`Subject variant ${String.fromCharCode(65 + i)}`}
          />
          {variants.length > 1 && (
            <button
              onClick={() => onRemove(i)}
              className="text-muted-foreground hover:text-destructive transition-colors flex-shrink-0"
            >
              <Minus size={12} strokeWidth={1.6} absoluteStrokeWidth />
            </button>
          )}
        </div>
      ))}
      <p className="text-[10px] text-muted-foreground">A/B test up to 3 subject line variants</p>
    </div>
  );
}

// ── Left panel — AI mode ──────────────────────────────────────────────────────

function AIModePanel({ onGenerate }: { onGenerate: (prompt: string) => void }) {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const suggestions = [
    'Re-engage customers who haven\'t visited in 90 days',
    'Announce a seasonal promotion with 10% discount',
    'Request a review after a positive service interaction',
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
        <span className="text-[12px] text-foreground">AI generates your email</span>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] text-muted-foreground">What's the goal of this email?</label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g. Re-engage lapsed customers with a spring promotion for our Downtown Chicago location…"
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
            Generate email
          </>
        )}
      </Button>
    </div>
  );
}

// ── Left panel — Manual mode ──────────────────────────────────────────────────

function ManualModePanel({
  subjects,
  previewText,
  body,
  onSubjectsChange,
  onPreviewChange,
  onBodyChange,
}: {
  subjects: string[];
  previewText: string;
  body: string;
  onSubjectsChange: (s: string[]) => void;
  onPreviewChange: (s: string) => void;
  onBodyChange: (s: string) => void;
}) {
  return (
    <div className="flex flex-col gap-4 p-4 h-full overflow-y-auto">
      <SubjectVariantRow
        variants={subjects}
        onAdd={() => onSubjectsChange([...subjects, ''])}
        onRemove={(i) => onSubjectsChange(subjects.filter((_, idx) => idx !== i))}
        onChange={(i, val) => {
          const next = [...subjects];
          next[i] = val;
          onSubjectsChange(next);
        }}
      />

      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] text-muted-foreground">Preview text</label>
        <input
          value={previewText}
          onChange={(e) => onPreviewChange(e.target.value)}
          className="w-full text-[12px] border border-input rounded-md h-[34px] px-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
          placeholder="Short preview shown in inbox…"
        />
        <p className="text-[10px] text-muted-foreground">Shown after subject line in inbox previews</p>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] text-muted-foreground">
          Body
          <span className="ml-1 tabular-nums text-muted-foreground">{body.length} chars</span>
        </label>
        <textarea
          value={body}
          onChange={(e) => onBodyChange(e.target.value)}
          placeholder="Hi {{first_name}},&#10;&#10;Write your email body here…"
          rows={8}
          className="w-full text-[12px] border border-input rounded-md px-2 py-2 bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 leading-relaxed"
        />
      </div>

      <Button variant="outline" size="sm" className="w-full gap-1.5 mt-auto">
        <Sparkles size={11} strokeWidth={1.6} absoluteStrokeWidth />
        Improve with AI
      </Button>
    </div>
  );
}

// ── Right panel — Score ───────────────────────────────────────────────────────

function ScorePanel({
  score,
  dimensions,
  openRate,
  onPublish,
}: {
  score: number;
  dimensions: { label: string; score: number }[];
  openRate: number;
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

      {/* Open-rate prediction */}
      <div className="bg-muted/50 rounded-lg px-2 py-2.5">
        <p className="text-[11px] text-muted-foreground mb-1">Predicted open rate</p>
        <div className="flex items-baseline gap-1">
          <span className="text-[22px] text-foreground">{openRate}%</span>
        </div>
        <div className="w-full h-1.5 bg-muted rounded-full mt-1.5 overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-700"
            style={{ width: `${openRate}%` }}
          />
        </div>
        <p className="text-[10px] text-muted-foreground mt-1">Industry avg: 22% · Your avg: 28%</p>
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

      {/* Publish / save */}
      <div className="flex flex-col gap-2 mt-auto">
        {!canPublish && (
          <div className="flex items-start gap-2 bg-surface-hover border border-border rounded-lg px-2 py-2.5">
            <TriangleAlert size={13} strokeWidth={1.6} absoluteStrokeWidth className="text-text-secondary mt-0.5 shrink-0" />
            <p className="text-[11px] text-text-secondary leading-snug">Score below 70 — review before sending</p>
          </div>
        )}
        {canPublish && (
          <div className="flex items-start gap-2 bg-primary/5 border border-green-200 rounded-lg px-2 py-2.5">
            <CheckCircle2 size={13} strokeWidth={1.6} absoluteStrokeWidth className="text-text-primary mt-0.5 shrink-0" />
            <p className="text-[11px] text-text-primary leading-snug">Ready to send</p>
          </div>
        )}
        <Button variant="default" size="sm" className="w-full" onClick={onPublish} disabled={!canPublish}>
          <Send size={13} strokeWidth={1.6} absoluteStrokeWidth className="mr-1.5" />
          Send email
        </Button>
        <Button variant="outline" size="sm" className="w-full">
          Save draft
        </Button>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export interface EmailEditorProps {
  initialSubjects?: string[];
  initialBody?: string;
  onBack: () => void;
  onPublish?: () => void;
}

export const EmailEditor: React.FC<EmailEditorProps> = ({
  initialSubjects = ['Your spring offer is ready, {{first_name}}'],
  initialBody = '',
  onBack,
  onPublish,
}) => {
  const [mode, setMode] = useState<Mode>('ai');
  const [subjects, setSubjects] = useState<string[]>(initialSubjects);
  const [previewText, setPreviewText] = useState('Spring is the perfect time to transform your outdoor space…');
  const [body, setBody] = useState(initialBody);

  const handleAIGenerate = (prompt: string) => {
    void prompt;
    setSubjects([
      'Your spring offer is ready, {{first_name}} 🌿',
      'Transform your yard this season — exclusive offer inside',
    ]);
    setPreviewText('Spring is here and we have something special for you…');
    setBody('Hi {{first_name}},\n\nSpring is here and there\'s no better time to bring your outdoor vision to life. Whether you\'re dreaming of a drought-resistant garden or a full yard makeover, our team is ready.\n\nBook your free consultation this week and get 10% off any project over $1,000.\n\nWarm regards,\nThe Team');
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
          <span className="text-[14px] text-foreground">Email editor</span>
          <span className="text-[11px] px-2 py-0.5 rounded-md bg-muted text-muted-foreground">
            {subjects.length} subject variant{subjects.length !== 1 ? 's' : ''}
          </span>
        </div>
        <Button variant="ghost" size="sm">
          <RotateCcw size={13} strokeWidth={1.6} absoluteStrokeWidth className="mr-1.5" />
          Regenerate
        </Button>
      </div>

      {/* Three columns */}
      <div className="flex flex-grow overflow-hidden">
        {/* Left — 260px */}
        <div className="w-[260px] flex-shrink-0 bg-background border-r border-border flex flex-col overflow-hidden">
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
              <AIModePanel onGenerate={handleAIGenerate} />
            ) : (
              <ManualModePanel
                subjects={subjects}
                previewText={previewText}
                body={body}
                onSubjectsChange={setSubjects}
                onPreviewChange={setPreviewText}
                onBodyChange={setBody}
              />
            )}
          </div>
        </div>

        {/* Center — flex-1, email preview */}
        <div className="flex-1 flex items-start justify-center overflow-auto bg-muted/30 p-8">
          <div className="flex flex-col items-center gap-4 w-full max-w-[600px]">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wide self-start">Preview</p>
            <div className="w-full">
              <EmailPreviewPanel
                templateId="welcome"
                segments={['All contacts']}
                tone="warm"
                subjectCount={subjects.length}
              />
            </div>
          </div>
        </div>

        {/* Right — 272px */}
        <div className="w-[272px] flex-shrink-0 overflow-hidden">
          <ScorePanel
            score={MOCK_SCORE}
            dimensions={MOCK_DIMS}
            openRate={MOCK_OPEN_RATE}
            onPublish={onPublish ?? onBack}
          />
        </div>
      </div>
    </div>
  );
};
