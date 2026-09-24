import { ALL_REVIEWS } from './reviewsData'
import type { TestRunBatch, TestSuite } from '../components/GhostwriterTestRunPanel/GhostwriterTestRunPanel.types'

/** Response agent (23 Sep) only — the Test tab's Test suite and Test runs sections start
 *  seeded with this data instead of empty, so the tab reads like an account with a history
 *  the first time it's opened. Every id/name here is fictional; `reviewCount` is the same kind
 *  of plausible mock total `GhostwriterTestRunPanel`'s own suite editor already reports. */
export const DEFAULT_23SEP_TEST_SUITES: TestSuite[] = [
  {
    id: 'suite-low-ratings',
    name: 'Low ratings',
    conditions: [{ id: 'cond-low-ratings-1', field: 'rating', operator: 'less_than', ratingValue: '3' }],
    reviewCount: 187,
    reviewsSource: 'customer',
  },
  {
    id: 'suite-five-star',
    name: '5-star reviews',
    conditions: [{ id: 'cond-five-star-1', field: 'rating', operator: 'equals', ratingValue: '5' }],
    reviewCount: 612,
    reviewsSource: 'customer',
  },
  {
    id: 'suite-recent-reviews',
    name: 'Recent reviews',
    conditions: [{ id: 'cond-recent-1', field: 'date', operator: 'between', dateRange: 'Sep 1, 2026 to Sep 30, 2026' }],
    reviewCount: 248,
    reviewsSource: 'customer',
  },
  {
    id: 'suite-google-only',
    name: 'Google reviews',
    conditions: [{ id: 'cond-google-1', field: 'source', operator: 'in', sourceValues: ['google'] }],
    reviewCount: 940,
    reviewsSource: 'customer',
  },
  {
    id: 'suite-negative-yelp',
    name: 'Negative Yelp reviews',
    conditions: [
      { id: 'cond-neg-yelp-1', field: 'rating', operator: 'less_than', ratingValue: '3' },
      { id: 'cond-neg-yelp-2', field: 'source', operator: 'in', sourceValues: ['yelp'] },
    ],
    reviewCount: 76,
    reviewsSource: 'customer',
  },
]

/** Names its own suite by string only (same as a real run) — no id link needed since the
 *  batch card and report just display `suiteName` as text. */
export const DEFAULT_23SEP_TEST_BATCHES: TestRunBatch[] = [
  {
    reviews: ALL_REVIEWS,
    testedAt: 'Sep 20, 2026, 2:15 PM',
    testedBy: 'Haresh Rajamannar',
    suiteName: 'Low ratings',
    displayReviewCount: 187,
    runName: '#1 test run',
    qualityEvaluationIds: ['completeness', 'latency'],
  },
  {
    reviews: ALL_REVIEWS,
    testedAt: 'Sep 22, 2026, 10:40 AM',
    testedBy: 'Rupa Chintala',
    suiteName: '5-star reviews',
    displayReviewCount: 612,
    runName: '#2 test run',
    qualityEvaluationIds: ['coherence'],
  },
]
