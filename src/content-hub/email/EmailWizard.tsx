import React, { useState } from 'react';
import { ContentWizardShell } from '../shared/ContentWizardShell';
import { EmailWizardStep1 } from './EmailWizardStep1';
import { EmailWizardStep2 } from './EmailWizardStep2';
import { EmailWizardStep3 } from './EmailWizardStep3';
import { EmailPreviewPanel } from '../shared/EmailPreviewPanel';

const STEPS = ['Template', 'Audience', 'Tune & send'];
const DEFAULT_LOCATIONS = ['All 500 locations', 'Downtown Chicago', 'Miami Beach'];
const DEFAULT_TOKENS = ['First name', 'Location name', 'Last visit date', 'Top service'];

export interface EmailWizardState {
  template: string;
  segments: string[];
  tokens: string[];
  locations: string[];
  tone: string;
  subjectCount: number;
  sendTime: string;
  sendDate: string;
  requireApproval: boolean;
}

interface EmailWizardProps {
  onExit: () => void;
  onComplete: (state: EmailWizardState) => void;
  /** When true, suppresses the breadcrumb nav strip (use inside CreateView) */
  embedded?: boolean;
}

export const EmailWizard = ({ onExit, onComplete, embedded }: EmailWizardProps) => {
  const [step, setStep] = useState(0);

  // Step 1
  const [template, setTemplate] = useState('welcome');

  // Step 2
  const [segments, setSegments] = useState<string[]>(['all']);
  const [tokens, setTokens] = useState<string[]>(DEFAULT_TOKENS);
  const [locations, setLocations] = useState<string[]>(DEFAULT_LOCATIONS);

  // Step 3
  const [tone, setTone] = useState('warm');
  const [subjectCount, setSubjectCount] = useState(3);
  const [sendTime, setSendTime] = useState('best');
  const [sendDate, setSendDate] = useState('');
  const [requireApproval, setRequireApproval] = useState(true);

  const isFinalStep = step === STEPS.length - 1;

  const handleNext = () => {
    if (isFinalStep) {
      onComplete({ template, segments, tokens, locations, tone, subjectCount, sendTime, sendDate, requireApproval });
    } else {
      setStep((s) => s + 1);
    }
  };

  return (
    <ContentWizardShell
      contentType="Email"
      steps={STEPS}
      currentStep={step}
      canAdvance={Boolean(template)}
      isFinalStep={isFinalStep}
      onNext={handleNext}
      onBack={() => setStep((s) => Math.max(0, s - 1))}
      onExit={onExit}
      embedded={embedded}
      previewSlot={
        <EmailPreviewPanel
          templateId={template}
          segments={segments}
          tone={tone}
          subjectCount={subjectCount}
        />
      }
    >
      {step === 0 && (
        <EmailWizardStep1 selectedTemplate={template} onTemplateChange={setTemplate} />
      )}
      {step === 1 && (
        <EmailWizardStep2
          segments={segments} onSegmentsChange={setSegments}
          tokens={tokens} onTokensChange={setTokens}
          locations={locations} onLocationsChange={setLocations}
        />
      )}
      {step === 2 && (
        <EmailWizardStep3
          tone={tone} onToneChange={setTone}
          subjectCount={subjectCount} onSubjectCountChange={setSubjectCount}
          sendTime={sendTime} onSendTimeChange={setSendTime}
          sendDate={sendDate} onSendDateChange={setSendDate}
          requireApproval={requireApproval} onRequireApprovalChange={setRequireApproval}
        />
      )}
    </ContentWizardShell>
  );
};
