import React, { useState } from 'react';
import { FAQWizardShell } from './FAQWizardShell';
import { FAQWizardStep1 } from './FAQWizardStep1';
import { FAQWizardStep2 } from './FAQWizardStep2';
import { FAQWizardStep3Combined } from './FAQWizardStep3Combined';
import { FAQPreviewPanel } from '../shared/FAQPreviewPanel';

export interface FAQWizardState {
  template: string;
  agent: string;
  sourceData: Record<string, unknown>;
  goalData: {
    objective: string;
    persona: string;
    tone: string;
    readingLevel: string;
    faqCount: number;
  };
  outputData: {
    destinations: string[];
    schemaMarkup: string;
    approvalFlow: string;
  };
}

const DEFAULT_STATE: FAQWizardState = {
  template: '',
  agent: 'balanced',
  sourceData: {},
  goalData: {
    objective: '',
    persona: 'Homeowners in suburban US markets looking for professional landscaping services',
    tone: 'Professional',
    readingLevel: 'general',
    faqCount: 12,
  },
  outputData: {
    destinations: ['library'],
    schemaMarkup: 'jsonld',
    approvalFlow: 'auto',
  },
};

interface FAQWizardProps {
  onExit: () => void;
  onComplete: (state: FAQWizardState) => void;
  /** When true, suppresses the breadcrumb nav strip (use inside CreateView) */
  embedded?: boolean;
  /** Optional pre-filled state from the AI copilot conversation (T5) */
  prefilledState?: Partial<FAQWizardState>;
}

export const FAQWizard = ({ onExit, onComplete, embedded, prefilledState }: FAQWizardProps) => {
  const [step, setStep] = useState(1);
  const [wizardState, setWizardState] = useState<FAQWizardState>({
    ...DEFAULT_STATE,
    ...prefilledState,
    goalData: { ...DEFAULT_STATE.goalData, ...(prefilledState?.goalData ?? {}) },
    outputData: { ...DEFAULT_STATE.outputData, ...(prefilledState?.outputData ?? {}) },
  });
  /** Tracks which template card the user is hovering in step 1 */
  const [hoveredTemplate, setHoveredTemplate] = useState<string | null>(null);

  const updateState = (partial: Partial<FAQWizardState>) => {
    setWizardState(prev => ({ ...prev, ...partial }));
  };

  const canAdvance = (): boolean => {
    if (step === 1) return wizardState.template !== '';
    if (step === 2) return true; // source is optional
    if (step === 3) return wizardState.goalData.objective !== '';
    return true;
  };

  const handleNext = () => {
    if (step < 3) {
      setStep(s => s + 1);
    } else {
      onComplete(wizardState);
    }
  };

  const handleBack = () => setStep(s => Math.max(1, s - 1));

  return (
    <FAQWizardShell
      currentStep={step}
      onNext={handleNext}
      onBack={handleBack}
      onExit={onExit}
      canAdvance={canAdvance()}
      isFinalStep={step === 3}
      embedded={embedded}
      previewSlot={
        <FAQPreviewPanel
          template={wizardState.template}
          hoveredTemplate={hoveredTemplate}
          objective={wizardState.goalData.objective}
          tone={wizardState.goalData.tone}
          faqCount={wizardState.goalData.faqCount}
          destinations={wizardState.outputData.destinations}
        />
      }
    >
      {step === 1 && (
        <FAQWizardStep1
          selectedTemplate={wizardState.template}
          selectedAgent={wizardState.agent}
          onTemplateChange={(template) => updateState({ template })}
          onAgentChange={(agent) => updateState({ agent })}
          onHoverTemplate={setHoveredTemplate}
        />
      )}
      {step === 2 && (
        <FAQWizardStep2
          template={wizardState.template}
          onSourceDataChange={(sourceData) => updateState({ sourceData })}
        />
      )}
      {step === 3 && (
        <FAQWizardStep3Combined
          goalData={wizardState.goalData}
          outputData={wizardState.outputData}
          onGoalDataChange={(goalData) => updateState({ goalData })}
          onOutputDataChange={(outputData) => updateState({ outputData })}
        />
      )}
    </FAQWizardShell>
  );
};
