/**
 * Centralised editorial score colour helper.
 * Used by FAQReviewCard, EditorialScorePanel, EmailReviewCard, SocialReviewCard.
 *
 * Thresholds:  ≥ 80 → green   ≥ 50 → orange   < 50 → red
 */

export interface ScoreColorPair {
  bg: string;
  text: string;
}

export function scoreColor(score: number): ScoreColorPair {
  if (score >= 80) return { bg: '#EAF3DE', text: '#3B6D11' };
  if (score >= 50) return { bg: '#FEF3C7', text: '#D97706' };
  return { bg: '#FCEBEB', text: '#A32D2D' };
}

export function scoreStrokeColor(score: number): string {
  if (score >= 80) return '#3B6D11';
  if (score >= 50) return '#D97706';
  return '#A32D2D';
}

/** Tailwind class pair for semantic status chips (ready / needs-work / blocked) */
export const STATUS_COLORS = {
  ready:        { bg: '#EAF3DE', text: '#3B6D11', label: 'Ready' },
  'needs-work': { bg: '#FAEEDA', text: '#854F0B', label: 'Needs work' },
  blocked:      { bg: '#FCEBEB', text: '#A32D2D', label: 'Blocked' },
} as const;

export type ContentStatus = keyof typeof STATUS_COLORS;
