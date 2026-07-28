/**
 * BlogGenerationProgress
 *
 * Animated 4-step generation loading surface shown between the inline flow
 * and the final blog canvas.
 *
 * Steps animate: pending -> active (spinner) -> done (green check), 1.5 s apart.
 * After all steps complete + 600 ms grace period, calls onComplete().
 */

import React, { useState, useEffect } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/contenthub-ui/utils';
import type { BlogSection } from './BlogInlineCreationFlow';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface BlogGenerationProgressProps {
  sections: BlogSection[];
  brandKit?: string;
  topic?: string;
  onComplete: () => void;
  isExiting?: boolean;
  isRegen?: boolean;
}

type StepStatus = 'pending' | 'active' | 'done';

interface GenStep {
  id: string;
  label: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const STEP_DURATION_MS = 1500;
const DONE_GRACE_MS = 600;

const GEN_STEPS: GenStep[] = [
  { id: 'profile', label: 'Analyzing business profile' },
  { id: 'outline', label: 'Building blog outline' },
  { id: 'writing', label: 'Writing content sections' },
  { id: 'seo',     label: 'Optimizing for SEO' },
];

const REGEN_STEPS: GenStep[] = [
  { id: 'brand',   label: 'Applying your brand guidelines' },
  { id: 'outline', label: 'Rebuilding the blog structure' },
  { id: 'writing', label: 'Rewriting content sections' },
  { id: 'seo',     label: 'Optimizing for SEO' },
];

const PREVIEW_BLOCKS = [
  {
    heading: 'Why local visibility matters',
    body: 'Customers often compare businesses before they call, book, or visit. Strong content helps answer those questions before competitors do.',
  },
  {
    heading: 'How to turn search intent into useful content',
    body: 'The best pages match real customer questions with clear answers, local details, and next steps that make action easy.',
  },
];

// ── Sub-components ────────────────────────────────────────────────────────────

function StepRow({ step, status }: { step: GenStep; status: StepStatus }) {
  return (
    <div className="flex items-center gap-2 py-1">
      <div className={cn(
        'flex size-5 flex-shrink-0 items-center justify-center rounded-full transition-all duration-300',
        status === 'pending' && 'border-border bg-background',
        status === 'pending' && 'border-2',
        status === 'done'    && 'border-accent-positive bg-accent-positive',
      )}>
        {status === 'active' && (
          <span className="size-5 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
        )}
        {status === 'done' && (
          <Check size={12} strokeWidth={1.6} absoluteStrokeWidth className="text-white" />
        )}
      </div>
      <p className="text-[15px] text-foreground">{step.label}</p>
    </div>
  );
}

function PreviewBlock({ heading, body }: { heading: string; body: string }) {
  return (
    <div className="animate-in fade-in duration-500 space-y-2">
      <p className="text-[15px] text-foreground">{heading}</p>
      <p className="text-[14px] leading-7 text-muted-foreground">{body}</p>
    </div>
  );
}

function ShimmerLines() {
  return (
    <div className="space-y-4 pt-2" aria-hidden>
      <div className="h-4 w-full animate-pulse rounded-full bg-muted" />
      <div className="h-4 w-full animate-pulse rounded-full bg-muted" />
      <div className="h-4 w-5/12 animate-pulse rounded-full bg-muted" />
      <div className="h-4 w-full animate-pulse rounded-full bg-muted" />
      <div className="h-4 w-3/12 animate-pulse rounded-full bg-muted" />
      <div className="h-4 w-full animate-pulse rounded-full bg-muted" />
      <div className="h-4 w-5/12 animate-pulse rounded-full bg-muted" />
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function BlogGenerationProgress({
  sections,
  brandKit,
  topic,
  onComplete,
  isExiting = false,
  isRegen = false,
}: BlogGenerationProgressProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const totalWords = sections.reduce((sum, section) => sum + section.wordCount, 0);
  const steps = isRegen ? REGEN_STEPS : GEN_STEPS;

  useEffect(() => {
    // Advance one step every STEP_DURATION_MS
    const timers: ReturnType<typeof setTimeout>[] = [];

    steps.forEach((_, i) => {
      timers.push(
        setTimeout(() => {
          setCurrentStep(i + 1); // moves step i from 'active' to 'done', i+1 becomes 'active'
        }, STEP_DURATION_MS * (i + 1))
      );
    });

    // After all steps done, call onComplete
    timers.push(
      setTimeout(() => {
        onComplete();
      }, STEP_DURATION_MS * steps.length + DONE_GRACE_MS)
    );

    return () => timers.forEach(clearTimeout);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const progressPercent = Math.round((currentStep / steps.length) * 100);
  const visiblePreviewCount = Math.min(PREVIEW_BLOCKS.length, Math.max(0, currentStep - 1));

  const getStatus = (idx: number): StepStatus => {
    if (idx < currentStep) return 'done';
    if (idx === currentStep) return 'active';
    return 'pending';
  };

  return (
    <div className={cn(
      'relative min-h-0 flex-1 overflow-y-auto rounded-xl bg-transparent',
      isExiting && 'animate-out fade-out slide-out-to-top-4 fill-mode-forwards duration-[320ms]',
    )}>
      <div className="px-8 py-6 pb-10">
        <div className="rounded-xl border border-border/60 bg-background">
          <div className="p-8">
            <div className="space-y-4">
              <div className="space-y-1">
                <h2 className="text-[18px] text-foreground">
                  {isRegen ? 'Regenerating your blog post' : 'Generating your blog post'}
                </h2>
                <p className="text-[13px] text-muted-foreground">{totalWords} words · {sections.length} sections</p>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-700 ease-out"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[14px] text-muted-foreground">
                  {brandKit ? `Brand identity: ${brandKit}` : topic ? `Topic: ${topic}` : 'Processing...'}
                </span>
                <span className="text-[14px] text-primary">{progressPercent}%</span>
              </div>
            </div>

            <div className="mt-6 space-y-2">
              {steps.map((step, idx) => (
                <StepRow key={step.id} step={step} status={getStatus(idx)} />
              ))}
            </div>

            <p className="mt-4 text-[14px] text-muted-foreground">
              {isRegen
                ? 'This usually takes 2–3 minutes. Results will appear automatically.'
                : 'This usually takes 15-20 seconds. Results will appear automatically.'}
            </p>

            <div className="mt-8 space-y-8">
              {PREVIEW_BLOCKS.slice(0, visiblePreviewCount).map(item => (
                <PreviewBlock key={item.heading} heading={item.heading} body={item.body} />
              ))}
              {currentStep < steps.length && <ShimmerLines />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
