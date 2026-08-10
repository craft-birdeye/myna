import React, { useState } from 'react';
import { ContentWizardShell } from '../shared/ContentWizardShell';
import { SocialWizardStep1 } from './SocialWizardStep1';
import { SocialWizardStep2 } from './SocialWizardStep2';
import { SocialWizardStep3 } from './SocialWizardStep3';
import { SocialPhonePreviewPanel } from '../shared/SocialPhonePreviewPanel';

const STEPS = ['Platforms', 'Source & context', 'Tune & publish'];

export interface SocialWizardState {
  platforms: string[];
  postType: string;
  sourceType: string;
  sourceText: string;
  locations: string[];
  useSentiment: boolean;
  tone: string;
  postCount: number;
  autoHashtags: boolean;
  customHashtags: string;
  schedule: string;
  scheduleDate: string;
  requireApproval: boolean;
}

interface SocialWizardProps {
  onExit: () => void;
  onComplete: (state: SocialWizardState) => void;
  /** When true, suppresses the breadcrumb nav strip (use inside CreateView) */
  embedded?: boolean;
}

const DEFAULT_LOCATIONS = ['All 500 locations', 'Downtown Chicago', 'Miami Beach'];

export const SocialWizard = ({ onExit, onComplete, embedded }: SocialWizardProps) => {
  const [step, setStep] = useState(0);

  // Step 1 state
  const [platforms, setPlatforms] = useState<string[]>(['facebook', 'instagram']);
  const [postType, setPostType] = useState('promotional');

  // Step 2 state
  const [sourceType, setSourceType] = useState('brief');
  const [sourceText, setSourceText] = useState('');
  const [locations, setLocations] = useState<string[]>(DEFAULT_LOCATIONS);
  const [useSentiment, setUseSentiment] = useState(false);

  // Step 3 state
  const [tone, setTone] = useState('friendly');
  const [postCount, setPostCount] = useState(5);
  const [autoHashtags, setAutoHashtags] = useState(true);
  const [customHashtags, setCustomHashtags] = useState('');
  const [schedule, setSchedule] = useState('immediate');
  const [scheduleDate, setScheduleDate] = useState('');
  const [requireApproval, setRequireApproval] = useState(true);

  const canAdvance = step === 0 ? platforms.length > 0 : true;
  const isFinalStep = step === STEPS.length - 1;

  const handleNext = () => {
    if (isFinalStep) {
      onComplete({
        platforms, postType,
        sourceType, sourceText, locations, useSentiment,
        tone, postCount, autoHashtags, customHashtags,
        schedule, scheduleDate, requireApproval,
      });
    } else {
      setStep((s) => s + 1);
    }
  };

  const handleBack = () => setStep((s) => Math.max(0, s - 1));

  return (
    <ContentWizardShell
      contentType="Social post"
      steps={STEPS}
      currentStep={step}
      canAdvance={canAdvance}
      isFinalStep={isFinalStep}
      onNext={handleNext}
      onBack={handleBack}
      onExit={onExit}
      embedded={embedded}
      previewSlot={
        <SocialPhonePreviewPanel
          platforms={platforms}
          postType={postType}
          tone={tone}
          autoHashtags={autoHashtags}
          customHashtags={customHashtags}
        />
      }
    >
      {step === 0 && (
        <SocialWizardStep1
          selectedPlatforms={platforms}
          onPlatformsChange={setPlatforms}
          postType={postType}
          onPostTypeChange={setPostType}
        />
      )}
      {step === 1 && (
        <SocialWizardStep2
          sourceType={sourceType}
          onSourceTypeChange={setSourceType}
          sourceText={sourceText}
          onSourceTextChange={setSourceText}
          locations={locations}
          onLocationsChange={setLocations}
          useSentiment={useSentiment}
          onUseSentimentChange={setUseSentiment}
        />
      )}
      {step === 2 && (
        <SocialWizardStep3
          tone={tone} onToneChange={setTone}
          postCount={postCount} onPostCountChange={setPostCount}
          autoHashtags={autoHashtags} onAutoHashtagsChange={setAutoHashtags}
          customHashtags={customHashtags} onCustomHashtagsChange={setCustomHashtags}
          schedule={schedule} onScheduleChange={setSchedule}
          scheduleDate={scheduleDate} onScheduleDateChange={setScheduleDate}
          requireApproval={requireApproval} onRequireApprovalChange={setRequireApproval}
        />
      )}
    </ContentWizardShell>
  );
};
