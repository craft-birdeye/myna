/**
 * ProjectGenerationProgress
 *
 * Animated 4-step generation loading surface shown between the project inline
 * flow and the final canvas. Matches the FAQ/Blog equivalent design.
 *
 * Steps animate: pending -> active (spinner) -> done (green check), 1.4 s apart.
 * After all steps complete + 500 ms grace period, calls onComplete().
 */

import React, { useState, useEffect } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/contenthub-ui/utils';
import type { InlineFlowData } from './inline/InlineCreationFlow';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ProjectGenerationProgressProps {
  flowData: InlineFlowData;
  onComplete: () => void;
  isExiting?: boolean;
}

type StepStatus = 'pending' | 'active' | 'done';

interface GenStep {
  id: string;
  label: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const STEP_DURATION_MS = 1400;
const DONE_GRACE_MS = 500;

const GEN_STEPS: GenStep[] = [
  { id: 'brand',    label: 'Analyzing brand identity' },
  { id: 'brief',    label: 'Processing project brief' },
  { id: 'content',  label: 'Generating content pieces' },
  { id: 'finalize', label: 'Applying brand voice' },
];

const PREVIEW_BLOCKS = [
  {
    heading: 'Spring garden cleanup',
    body: 'Drafting a coordinated content set with FAQ answers, blog guidance, social copy, and email messaging for local customers.',
  },
  {
    heading: 'Channel plan',
    body: 'Mapping each piece to the right publishing channel while keeping the brand voice consistent across the campaign.',
  },
  {
    heading: 'Review-ready output',
    body: 'Preparing content cards with scores, captions, summaries, and next steps so the project can move into review.',
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

export function ProjectGenerationProgress({
  flowData,
  onComplete,
  isExiting = false,
}: ProjectGenerationProgressProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const totalItems = flowData.ideas?.length
    ?? flowData.contentMix?.reduce((s, m) => s + m.count, 0)
    ?? 4;
  const brandKitLabel = flowData.brandKit
    ? flowData.brandKit.charAt(0).toUpperCase() + flowData.brandKit.slice(1)
    : 'Brand identity';

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    GEN_STEPS.forEach((_, i) => {
      timers.push(setTimeout(() => setCurrentStep(i + 1), STEP_DURATION_MS * (i + 1)));
    });
    timers.push(setTimeout(onComplete, STEP_DURATION_MS * GEN_STEPS.length + DONE_GRACE_MS));
    return () => timers.forEach(clearTimeout);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const progressPercent = Math.round((currentStep / GEN_STEPS.length) * 100);
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
                <h2 className="text-[18px] text-foreground">Generating your project</h2>
                <p className="text-[13px] text-muted-foreground">
                  {totalItems} piece{totalItems !== 1 ? 's' : ''} · {flowData.objective || flowData.goal || 'Content campaign'}
                </p>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-700 ease-out"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[14px] text-muted-foreground">Brand identity: {brandKitLabel}</span>
                <span className="text-[14px] text-primary">{progressPercent}%</span>
              </div>
            </div>

            <div className="mt-6 space-y-2">
              {GEN_STEPS.map((step, idx) => (
                <StepRow key={step.id} step={step} status={getStatus(idx)} />
              ))}
            </div>

            <p className="mt-4 text-[14px] text-muted-foreground">
              This usually takes 15-20 seconds. Results will appear automatically.
            </p>

            <div className="mt-8 space-y-8">
              {PREVIEW_BLOCKS.slice(0, visiblePreviewCount).map(item => (
                <PreviewBlock key={item.heading} heading={item.heading} body={item.body} />
              ))}
              {currentStep < GEN_STEPS.length && <ShimmerLines />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
