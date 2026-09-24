/**
 * Shared types for ContentCreationWizardModal and all wizard step components.
 */

export type WizardMode = 'faq' | 'blog' | 'landing' | 'project';

/** Opaque per-step data buckets — each step component owns its own typing internally */
export interface WizardData {
  mode: WizardMode;
  step1: Record<string, unknown>;
  step2: Record<string, unknown>;
  step3: Record<string, unknown>;
}

/**
 * Condensed representation of wizard settings shown in the canvas info bar.
 * Populated from WizardData after the wizard completes.
 */
export interface GenerationInfo {
  /** Human-readable summary, e.g. "AEO template · Professional · 12 FAQs" */
  label: string;
  wizardData: WizardData;
}
