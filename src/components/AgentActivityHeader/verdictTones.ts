/**
 * Shared verdict tones for the Ghostwriter playbook surfaces. Green / amber / red are the
 * tones the findings blocks already use for their callouts; grey means "not possible on this
 * account" and the plan card's blue means "buildable, but read this first".
 */
export type VerdictTone = 'green' | 'amber' | 'red' | 'grey' | 'blue'

export const VERDICT_TONE: Record<VerdictTone, { color: string; chip: string }> = {
  green: { color: '#15803d', chip: 'bg-[#f0fdf4] text-[#2f7a3d]' },
  amber: { color: '#b7791f', chip: 'bg-[#fef9e7] text-[#8a6d1f]' },
  red: { color: '#d32f2f', chip: 'bg-[#fef2f2] text-[#d32f2f]' },
  grey: { color: '#9aa0a6', chip: 'bg-surface-l2 text-text-secondary' },
  blue: { color: '#1a73e8', chip: 'bg-[#e8f1fc] text-text-action' },
}
