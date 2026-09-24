/**
 * CreateBlogPage
 *
 * Standalone full-page blog creation wizard, matching contenthub 2.0's
 * CreateBlogPage pattern. Shows a 250px stepper sidebar + BlogInlineCreationFlow
 * body, with Cancel/Back/Continue/Generate buttons in the page header.
 *
 * Usage in App.tsx:
 *   <CreateBlogPage
 *     onCancel={() => setCreateBlogPageOpen(false)}
 *     onGenerate={(data) => { setCreateBlogFlowData(data); setEditorMode('blog'); setCreateBlogPageOpen(false); }}
 *   />
 */

import { useRef, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { BlogInlineCreationFlow } from './BlogInlineCreationFlow';
import type { BlogFlowData, FlowNavControls, FlowNavState } from './BlogInlineCreationFlow';
import { ContentFlowStepper } from '../shared/ContentFlowControls';
import type { ContentFlowStep } from '../shared/ContentFlowControls';

// ── Steps (mirrors BlogInlineCreationFlow step labels) ────────────────────────

const STEPS: ContentFlowStep[] = [
  { id: 'brand-kit', label: 'Brand identity' },
  { id: 'setup',     label: 'Blog setup'     },
];

// ── Props ─────────────────────────────────────────────────────────────────────

export interface CreateBlogPageProps {
  onCancel: () => void;
  /** Called with the completed flow data once the user clicks Generate and the
   *  flow validates successfully. App.tsx should then set editorMode='blog' and
   *  pass this data as initialBlogFlowData to ContentEditorShell with
   *  skipSetupPhase=true. */
  onGenerate: (data: BlogFlowData) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function CreateBlogPage({ onCancel, onGenerate }: CreateBlogPageProps) {
  const flowNavRef = useRef<FlowNavControls | null>(null);
  const [navState, setNavState] = useState<FlowNavState>({
    step: 0,
    totalSteps: STEPS.length,
    canAdvance: false,
  });

  const isLastStep = navState.totalSteps > 0 && navState.step >= navState.totalSteps - 1;

  function handleContinue() {
    if (isLastStep) {
      flowNavRef.current?.generate();
    } else {
      flowNavRef.current?.advance();
    }
  }

  return (
    <div className="flex flex-col h-full bg-background">

      {/* ── Header ── */}
      <div className="flex shrink-0 items-center justify-between px-6 py-[9px]">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onCancel}
            className="flex size-[34px] items-center justify-center rounded-md text-text-icon hover:bg-surface-hover transition-colors"
          >
            <ArrowLeft size={16} strokeWidth={1.6} absoluteStrokeWidth />
          </button>
          <span className="text-[16px] text-text-primary">Create blog</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="h-9 px-md rounded-md text-body text-text-primary hover:bg-surface-hover transition-colors"
          >
            Cancel
          </button>
          {navState.step > 0 && (
            <button
              type="button"
              onClick={() => flowNavRef.current?.back()}
              className="h-9 px-md rounded-md border border-border-selected text-body text-text-primary hover:bg-surface-hover transition-colors"
            >
              Back
            </button>
          )}
          <button
            type="button"
            onClick={handleContinue}
            disabled={!navState.canAdvance}
            className="h-9 px-md rounded-md bg-primary text-body text-white hover:bg-primary-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isLastStep ? 'Generate' : 'Continue'}
          </button>
        </div>
      </div>

      {/* ── Body: stepper sidebar + form ── */}
      <div className="flex-1 min-h-0 flex overflow-hidden">

        {/* Stepper sidebar */}
        <aside className="w-[250px] shrink-0 bg-background">
          <div className="px-4 py-4">
            <ContentFlowStepper steps={STEPS} currentStep={navState.step} />
          </div>
        </aside>

        {/* Blog inline creation flow */}
        <div className="flex-1 min-w-0 min-h-0 bg-surface rounded-md overflow-hidden">
          <BlogInlineCreationFlow
            onComplete={onGenerate}
            onCancel={onCancel}
            controlRef={flowNavRef}
            onNavStateChange={setNavState}
            hideProgress
          />
        </div>

      </div>
    </div>
  );
}
