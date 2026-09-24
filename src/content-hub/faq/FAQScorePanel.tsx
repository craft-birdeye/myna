/**
 * @deprecated — retired. Use shared/ContentScorePanel.tsx instead.
 * This file is kept only because the mounted filesystem does not allow deletion.
 * Do not import from here. Import ContentScorePanel from:
 *   import { ContentScorePanel } from '../shared/ContentScorePanel';
 */
export { ContentScorePanel as FAQScorePanel, DEFAULT_AEO_DIMS as DEFAULT_FAQ_DIMS } from '../shared/ContentScorePanel';
export type { ContentScorePanelProps as FAQScorePanelProps } from '../shared/ContentScorePanel';

/** @deprecated – use DEFAULT_OVERALL_SCORE from shared/ContentScorePanel */
export function makeDimensions(overallScore: number) {
  return [
    { label: 'Brand voice',         score: overallScore,     weight: 30 },
    { label: 'Factual accuracy',    score: overallScore - 1, weight: 30 },
    { label: 'Content readability', score: overallScore - 2, weight: 25 },
    { label: 'Originality',         score: overallScore + 3, weight: 15 },
  ];
}
