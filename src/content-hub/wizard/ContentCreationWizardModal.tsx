/**
 * ContentCreationWizardModal
 *
 * Full-screen centered dialog that hosts the 3-step creation wizard for
 * FAQ, Blog, Landing, and Project modes.
 *
 * - Step indicator at top (read-only; navigation is forward-only via Next/Back buttons)
 * - Scrollable step body in the middle
 * - Sticky footer: Cancel · Back · Next / [Start generating | Regenerate]
 * - isRegenerateMode=true: header reads "Edit generation settings", primary CTA = "Regenerate"
 * - Composes the existing FAQWizardStep* components for FAQ mode and new step
 *   components for Blog, Landing, and Project modes.
 */

import React, { useState } from 'react';
import { X, ChevronLeft } from 'lucide-react';
import { cn } from '@/contenthub-ui/utils';
import { Button } from '@/contenthub-ui/button';
import {
  Dialog,
  DialogPortal,
  DialogOverlay,
} from '@/contenthub-ui/dialog';
import * as DialogPrimitive from '@radix-ui/react-dialog';

// FAQ step components (already exist)
import { FAQWizardStep1 } from '../faq/FAQWizardStep1';
import { FAQWizardStep2 } from '../faq/FAQWizardStep2';
import { FAQWizardStep3Combined } from '../faq/FAQWizardStep3Combined';

// Blog / Landing step components
import { BlogWizardStep1 } from './BlogWizardStep1';
import { BlogWizardStep2 } from './BlogWizardStep2';
import { BlogWizardStep3 } from './BlogWizardStep3';

// Project step components
import { ProjectWizardStep1 } from './ProjectWizardStep1';
import { ProjectWizardStep2 } from './ProjectWizardStep2';
import { ProjectWizardStep3 } from './ProjectWizardStep3';

import type { WizardMode, WizardData } from './wizardTypes';

// ── Step labels per mode ──────────────────────────────────────────────────────

const STEP_LABELS: Record<WizardMode, [string, string, string]> = {
  faq:     ['Template',     'Source & context', 'Tune & publish'],
  blog:    ['Goal',         'Source & context', 'Tune & publish'],
  landing: ['Goal',         'Source & context', 'Tune & publish'],
  project: ['Brand & location', 'Source & context', 'Tune & publish'],
};

const MODAL_TITLE: Record<WizardMode, string> = {
  faq:     'Create FAQ',
  blog:    'Create blog post',
  landing: 'Create landing page',
  project: 'Create project',
};

// ── Step indicator ────────────────────────────────────────────────────────────

interface StepIndicatorProps {
  labels: [string, string, string];
  current: number; // 0-indexed
}

function StepIndicator({ labels, current }: StepIndicatorProps) {
  return (
    <div className="flex items-center gap-0 px-8 py-4 border-b border-border flex-shrink-0">
      {labels.map((label, i) => {
        const done    = i < current;
        const active  = i === current;
        const pending = i > current;
        return (
          <React.Fragment key={label}>
            {/* Step pill */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <div
                className={cn(
                  'size-6 rounded-full flex items-center justify-center text-[11px] font-semibold flex-shrink-0 border transition-colors',
                  done    && 'bg-primary border-primary text-primary-foreground',
                  active  && 'bg-primary border-primary text-primary-foreground',
                  pending && 'bg-background border-border text-muted-foreground',
                )}
              >
                {done ? (
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M2 5l2.5 2.5L8 2.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  i + 1
                )}
              </div>
              <span
                className={cn(
                  'text-[13px] font-medium whitespace-nowrap',
                  active  && 'text-foreground',
                  done    && 'text-muted-foreground',
                  pending && 'text-muted-foreground',
                )}
              >
                {label}
              </span>
            </div>

            {/* Connector */}
            {i < labels.length - 1 && (
              <div className={cn(
                'flex-1 h-px mx-4 transition-colors',
                i < current ? 'bg-primary' : 'bg-border',
              )} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ── Props ─────────────────────────────────────────────────────────────────────

export interface ContentCreationWizardModalProps {
  open: boolean;
  mode: WizardMode;
  /** When true, header shows "Edit generation settings" and CTA becomes "Regenerate" */
  isRegenerateMode?: boolean;
  /** Pre-populate all steps from a previous completion */
  initialData?: WizardData;
  onComplete: (data: WizardData) => void;
  onCancel: () => void;
}

// ── Default state factories ───────────────────────────────────────────────────

function defaultStep1(mode: WizardMode): Record<string, unknown> {
  if (mode === 'faq')     return { template: 'aeo',       agent: 'balanced' };
  if (mode === 'project') return { projectName: '', brandKit: 'olive-garden', locations: [] };
  return { goal: 'seo', agent: 'balanced' };
}

function defaultStep2(): Record<string, unknown> {
  return {};
}

function defaultStep3(mode: WizardMode): Record<string, unknown> {
  if (mode === 'faq') {
    return {
      goalData: { objective: 'visibility', persona: 'Homeowners in suburban US markets looking for professional landscaping services', tone: 'Professional', readingLevel: 'general', faqCount: 12 },
      outputData: { destinations: ['library', 'searchai'], schemaMarkup: 'jsonld', approvalFlow: 'review' },
    };
  }
  if (mode === 'project') {
    return {
      objective: 'visibility',
      audience: '',
      tone: 'Professional',
      contentMix: [
        { type: 'Blog post', count: 2 },
        { type: 'Social posts', count: 5 },
        { type: 'FAQ', count: 1 },
      ],
      approvalFlow: 'review',
    };
  }
  // blog / landing
  return {
    audience: '',
    tone: 'Professional',
    length: 'medium',
    sections: ['intro', 'takeaways', 'cta'],
    destinations: ['library'],
    approvalFlow: 'review',
  };
}

// ── Main modal ────────────────────────────────────────────────────────────────

export function ContentCreationWizardModal({
  open,
  mode,
  isRegenerateMode = false,
  initialData,
  onComplete,
  onCancel,
}: ContentCreationWizardModalProps) {
  const [step, setStep] = useState(0);

  const [step1, setStep1] = useState<Record<string, unknown>>(
    initialData?.step1 ?? defaultStep1(mode),
  );
  const [step2, setStep2] = useState<Record<string, unknown>>(
    initialData?.step2 ?? defaultStep2(),
  );
  const [step3, setStep3] = useState<Record<string, unknown>>(
    initialData?.step3 ?? defaultStep3(mode),
  );

  const labels = STEP_LABELS[mode];
  const title  = isRegenerateMode ? 'Edit generation settings' : MODAL_TITLE[mode];

  function handleNext() {
    if (step < 2) { setStep(s => s + 1); return; }
    // Step 3 — complete
    onComplete({ mode, step1, step2, step3 });
  }

  function handleBack() {
    if (step > 0) setStep(s => s - 1);
  }

  const primaryLabel = step < 2
    ? 'Next'
    : isRegenerateMode ? 'Regenerate' : 'Start generating';

  const canProceed = mode === 'project' && step === 0
    ? ((step1.projectName as string) ?? '').trim().length > 0
    : true;

  // ── Render step body ──────────────────────────────────────────────────────

  function renderStep() {
    if (mode === 'faq') {
      if (step === 0) {
        return (
          <FAQWizardStep1
            selectedTemplate={(step1.template as string) ?? 'aeo'}
            selectedAgent={(step1.agent as string) ?? 'balanced'}
            onTemplateChange={v => setStep1(s => ({ ...s, template: v }))}
            onAgentChange={v => setStep1(s => ({ ...s, agent: v }))}
          />
        );
      }
      if (step === 1) {
        return (
          <FAQWizardStep2
            template={(step1.template as string) ?? 'aeo'}
            onSourceDataChange={data => setStep2(data)}
          />
        );
      }
      // step 2
      const goalData = (step3.goalData as Parameters<typeof FAQWizardStep3Combined>[0]['goalData']) ?? {
        objective: 'visibility', persona: '', tone: 'Professional', readingLevel: 'general', faqCount: 12,
      };
      const outputData = (step3.outputData as Parameters<typeof FAQWizardStep3Combined>[0]['outputData']) ?? {
        destinations: ['library'], schemaMarkup: 'jsonld', approvalFlow: 'review',
      };
      return (
        <FAQWizardStep3Combined
          goalData={goalData}
          outputData={outputData}
          onGoalDataChange={d => setStep3(s => ({ ...s, goalData: d }))}
          onOutputDataChange={d => setStep3(s => ({ ...s, outputData: d }))}
        />
      );
    }

    if (mode === 'blog' || mode === 'landing') {
      if (step === 0) return <BlogWizardStep1 mode={mode} data={step1} onChange={setStep1} />;
      if (step === 1) return <BlogWizardStep2 mode={mode} step1Data={step1} data={step2} onChange={setStep2} />;
      return <BlogWizardStep3 mode={mode} step1Data={step1} data={step3} onChange={setStep3} />;
    }

    if (mode === 'project') {
      if (step === 0) return <ProjectWizardStep1 data={step1} onChange={setStep1} />;
      if (step === 1) return <ProjectWizardStep2 step1Data={step1} data={step2} onChange={setStep2} />;
      return <ProjectWizardStep3 step1Data={step1} data={step3} onChange={setStep3} />;
    }

    return null;
  }

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onCancel(); }}>
      <DialogPortal>
        <DialogOverlay />
        <DialogPrimitive.Content
          className={cn(
            'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50',
            'bg-background rounded-xl shadow-xl',
            'w-full max-w-[640px] max-h-[88vh]',
            'flex flex-col overflow-hidden',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
            'duration-200',
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 flex-shrink-0">
            <p className="text-[15px] font-semibold text-foreground">{title}</p>
            <button
              type="button"
              onClick={onCancel}
              className="flex items-center justify-center size-7 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            >
              <X size={15} strokeWidth={1.6} absoluteStrokeWidth />
            </button>
          </div>

          {/* Step indicator */}
          <StepIndicator labels={labels} current={step} />

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto">
            {renderStep()}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-border flex-shrink-0">
            <Button variant="ghost" size="sm" onClick={onCancel}>
              Cancel
            </Button>
            <div className="flex items-center gap-2">
              {step > 0 && (
                <Button variant="outline" size="sm" onClick={handleBack}>
                  <ChevronLeft size={14} strokeWidth={1.6} absoluteStrokeWidth />
                  Back
                </Button>
              )}
              <Button
                size="sm"
                onClick={handleNext}
                disabled={!canProceed}
                className={isRegenerateMode && step === 2 ? 'bg-amber-600 hover:bg-amber-700' : ''}
              >
                {primaryLabel}
              </Button>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}
