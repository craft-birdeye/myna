import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/contenthub-ui/button';
import { cn } from '@/contenthub-ui/utils';

interface ContentWizardShellProps {
  contentType: string;
  contentTypeIcon?: React.ReactNode;
  steps: string[];
  currentStep: number; // 0-indexed
  canAdvance?: boolean;
  isFinalStep?: boolean;
  onNext: () => void;
  onBack: () => void;
  onExit: () => void;
  children: React.ReactNode;
  /**
   * If provided, renders a fixed 320px right column showing a live preview.
   * The step content (`children`) is constrained to the left, and the preview
   * stays locked in place across all steps.
   */
  previewSlot?: React.ReactNode;
  /**
   * When true the breadcrumb strip ("Content hub → …") is suppressed.
   * Use this when the wizard is embedded inside a two-column layout that
   * already provides its own navigation context (e.g., CreateView).
   */
  embedded?: boolean;
}

export const ContentWizardShell = ({
  contentType,
  steps,
  currentStep,
  canAdvance = true,
  isFinalStep = false,
  onNext,
  onBack,
  onExit,
  children,
  previewSlot,
  embedded = false,
}: ContentWizardShellProps) => {
  return (
    <div className={cn('flex flex-col h-full overflow-hidden', embedded ? 'bg-background' : 'bg-muted')}>
      {/* Breadcrumb strip — suppressed in embedded mode */}
      {!embedded && (
        <div className="bg-muted border-b border-border px-6 py-2 flex items-center gap-2 flex-shrink-0">
          <button
            onClick={onExit}
            className="text-[13px] text-muted-foreground hover:text-foreground transition-colors"
          >
            Content hub
          </button>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0 text-muted-foreground">
            <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-[13px] text-foreground">{contentType}</span>
        </div>
      )}

      {/* Stepper strip */}
      <div className="bg-background border-b border-border px-6 py-0 flex items-center gap-0 flex-shrink-0">
        {steps.map((label, i) => {
          const stepNum = i + 1;
          const isActive = i === currentStep;
          const isCompleted = i < currentStep;
          const isUpcoming = i > currentStep;
          return (
            <React.Fragment key={label}>
              <div
                className={cn(
                  'flex items-center gap-2 px-4 py-2 border-b-2 text-[13px] transition-colors',
                  isActive && 'border-primary text-foreground',
                  isCompleted && 'border-transparent text-muted-foreground',
                  isUpcoming && 'border-transparent text-muted-foreground',
                )}
              >
                {isCompleted ? (
                  <CheckCircle2 size={14} strokeWidth={1.6} className="text-primary shrink-0" />
                ) : (
                  <span
                    className={cn(
                      'w-5 h-5 rounded-full flex items-center justify-center text-[11px] shrink-0',
                      isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
                    )}
                  >
                    {stepNum}
                  </span>
                )}
                {label}
              </div>
              {i < steps.length - 1 && (
                <div className="w-px h-4 bg-border mx-1 self-center" />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Body — step content + optional fixed preview column */}
      <div className="flex flex-row flex-grow overflow-hidden">
        {/* Step content */}
        <div className="flex-grow overflow-y-auto">
          {children}
        </div>

        {/* Fixed preview column — only rendered when previewSlot is provided AND not in embedded mode
            (in embedded mode the parent InfiniteCanvas serves as the live preview) */}
        {previewSlot && !embedded && (
          <div className="w-[320px] flex-shrink-0 border-l border-border bg-muted/30 overflow-y-auto p-6">
            {previewSlot}
          </div>
        )}
      </div>

      {/* Bottom action bar */}
      <div className="bg-background border-t border-border px-6 py-2 flex items-center justify-between flex-shrink-0">
        <Button variant="ghost" size="sm" onClick={onExit}>
          Cancel
        </Button>
        <div className="flex items-center gap-2">
          {currentStep > 0 && (
            <Button variant="outline" size="sm" onClick={onBack}>
              Back
            </Button>
          )}
          <Button
            variant="default"
            size="sm"
            onClick={onNext}
            disabled={!canAdvance}
          >
            {isFinalStep ? 'Start generating →' : 'Next'}
          </Button>
        </div>
      </div>
    </div>
  );
};
