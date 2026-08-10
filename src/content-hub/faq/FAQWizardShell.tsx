import React from 'react';
import { ContentWizardShell } from '../shared/ContentWizardShell';

const FAQ_STEPS = ['Template', 'Source & context', 'Tune & publish'];

interface FAQWizardShellProps {
  currentStep: number; // 1-indexed (legacy interface preserved)
  onNext: () => void;
  onBack: () => void;
  onExit: () => void;
  children: React.ReactNode;
  canAdvance?: boolean;
  isFinalStep?: boolean;
  previewSlot?: React.ReactNode;
  embedded?: boolean;
}

export const FAQWizardShell = ({
  currentStep,
  onNext,
  onBack,
  onExit,
  children,
  canAdvance = true,
  isFinalStep = false,
  previewSlot,
  embedded = false,
}: FAQWizardShellProps) => (
  <ContentWizardShell
    contentType="FAQ page"
    steps={FAQ_STEPS}
    currentStep={currentStep - 1} // convert 1-indexed → 0-indexed
    canAdvance={canAdvance}
    isFinalStep={isFinalStep}
    onNext={onNext}
    onBack={onBack}
    onExit={onExit}
    previewSlot={previewSlot}
    embedded={embedded}
  >
    {children}
  </ContentWizardShell>
);
