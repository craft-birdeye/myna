import type { TrendPoint } from '../components/charts/TrendLineChart'

export interface OverviewStat {
  id: string
  value: string
  label: string
  danger?: boolean
}

export const OVERVIEW_INBOX_ALERT_STATS: OverviewStat[] = [
  { id: 'unread', value: '457', label: 'Unread messages' },
  { id: 'open-leads', value: '628', label: 'Open leads' },
]

export const OVERVIEW_REVIEWS_RATING = 4.4

export const OVERVIEW_REVIEWS_BREAKDOWN: { stars: number; count: number; pct: number }[] = [
  { stars: 5, count: 916721, pct: 100 },
  { stars: 4, count: 172433, pct: 19 },
  { stars: 3, count: 68884, pct: 8 },
  { stars: 2, count: 32081, pct: 4 },
  { stars: 1, count: 96516, pct: 11 },
]

export interface OverviewReviewSource {
  id: string
  name: string
  rating: number
  reviewCount: string
  icon: string
  iconColorClassName: string
}

export const OVERVIEW_REVIEW_SOURCES: OverviewReviewSource[] = [
  { id: 'google', name: 'Google', rating: 4.4, reviewCount: '650.2K reviews', icon: 'G', iconColorClassName: 'bg-white text-[#4285F4]' },
  { id: 'google-play', name: 'Google Play', rating: 4.5, reviewCount: '239.9K reviews', icon: 'play_arrow', iconColorClassName: 'bg-white text-[#01875f]' },
  { id: 'shopper-approved', name: 'ShopperApproved', rating: 4.8, reviewCount: '82.3K reviews', icon: 'verified', iconColorClassName: 'bg-[#212121] text-white' },
]

export const OVERVIEW_REVIEWS_STATS: OverviewStat[] = [
  { id: 'requests-sent', value: '385K', label: 'Requests sent' },
  { id: 'reviews-received', value: '1.3M', label: 'Reviews received' },
  { id: '3-star-or-less', value: '197K', label: '3 star or less', danger: true },
  { id: 'havent-replied', value: '1M', label: "Haven't replied" },
]

export const OVERVIEW_LISTINGS_GOOGLE_REPORT: OverviewStat[] = [
  { id: 'profile-impressions', value: '18.3K', label: 'Profile impressions' },
  { id: 'website-visits', value: '17', label: 'Website visits' },
  { id: 'direction-clicks', value: '6.3K', label: 'Direction clicks' },
  { id: 'call-clicks', value: '151', label: 'Call clicks' },
]

export const OVERVIEW_LISTINGS_QA: OverviewStat[] = [
  { id: 'without-any-answer', value: '0', label: 'Without any answer', danger: true },
  { id: 'without-owner-answer', value: '0', label: 'Without owner answer', danger: true },
  { id: 'without-qa', value: '12', label: 'Without Q&A', danger: true },
  { id: 'with-qa', value: '0', label: 'With Q&A' },
]

export const OVERVIEW_REFERRALS_STATS: OverviewStat[] = [
  { id: 'requests-sent', value: '124.6K', label: 'Requests sent' },
  { id: 'shared', value: '522', label: 'Shared' },
  { id: 'leads', value: '460', label: 'Leads' },
]

export const OVERVIEW_APPOINTMENTS_STATS: OverviewStat[] = [
  { id: 'total-appointments', value: '3K', label: 'Total appointments' },
  { id: 'booked-via-birdeye', value: '126', label: 'Booked via Birdeye' },
  { id: 'confirmation-rate-via-birdeye', value: '1.1%', label: 'Confirmation rate via Birdeye' },
  { id: 'confirmation-rate-via-office', value: '5.7%', label: 'Confirmation rate via office' },
  { id: 'no-show-rate', value: '25.6%', label: 'No-show rate', danger: true },
]

export const OVERVIEW_INBOX_ACTIVITY_STATS: OverviewStat[] = [
  { id: 'median-response-time', value: 'N/A', label: 'Median response time' },
  { id: 'active-conversations', value: '68.3K', label: 'Active conversations' },
  { id: 'received-messages', value: '13.9K', label: 'Received messages' },
]

export const OVERVIEW_MEDIAN_RESPONSE_TREND: TrendPoint[] = [
  { label: "Jan 01 '22", value: 0 },
  { label: "Jan 01 '23", value: 2 },
  { label: "Jan 01 '24", value: 76 },
  { label: "Jan 01 '25", value: 1 },
  { label: "Jan 01 '26", value: 13 },
]

export const OVERVIEW_SOCIAL_NEW_FOLLOWERS = '189'

export interface OverviewSocialSeries {
  key: string
  label: string
  color: string
}

export const OVERVIEW_SOCIAL_SERIES: OverviewSocialSeries[] = [
  { key: 'facebook', label: 'Facebook', color: '#1976d2' },
  { key: 'instagram', label: 'Instagram', color: '#e056c7' },
  { key: 'google', label: 'Google', color: '#4cae3d' },
  { key: 'linkedin', label: 'LinkedIn', color: '#0a66c2' },
]

const SOCIAL_MONTHS = [
  'Jan 2024', 'Feb 2024', 'Mar 2024', 'Apr 2024', 'May 2024',
  'Jun 2024', 'Jul 2024', 'Aug 2024', 'Sep 2024', 'Oct 2024', 'Nov 2024', 'Dec 2024', 'Jan 2025', 'Feb 2025',
  'Mar 2025', 'Apr 2025', 'May 2025', 'Jun 2025', 'Jul 2025', 'Aug 2025', 'Sep 2025', 'Oct 2025', 'Nov 2025',
  'Dec 2025',
]

export const OVERVIEW_SOCIAL_DATA: Array<Record<string, string | number>> = SOCIAL_MONTHS.map((month, i) => {
  if (i === 2) return { month, facebook: 12, instagram: 4, google: 0, linkedin: 0 }
  if (i === 3) return { month, facebook: 6, instagram: 2, google: 0, linkedin: 0 }
  return { month, facebook: 1, instagram: 1, google: 0, linkedin: 0 }
})

export interface OverviewScore {
  id: string
  label: string
  value: number
  industryAverage: number
  max: number
  tooltip?: string
}

export const OVERVIEW_BIRDEYE_SCORE: OverviewScore = {
  id: 'birdeye-score',
  label: 'Birdeye Score',
  value: 75.5,
  industryAverage: 104.6,
  max: 150,
  tooltip: 'A composite score of your online reputation and visibility relative to competitors.',
}

export const OVERVIEW_UNDERSTANDING_SCORES: OverviewScore[] = [
  { id: 'sentiment', label: 'Sentiment Score', value: 78.6, industryAverage: 85.8, max: 100 },
  { id: 'reputation', label: 'Reputation Score', value: 49.3, industryAverage: 54.4, max: 100 },
  { id: 'listing', label: 'Listing Score', value: 34.9, industryAverage: 34.9, max: 100 },
]

export interface OverviewLocationScoreRow {
  id: string
  location: string
  birdeyeScore: number
  sentimentScore: number
  reputationScore: number
  listingScore: number
  [key: string]: string | number
}

export const OVERVIEW_TOP_LOCATIONS: OverviewLocationScoreRow[] = [
  { id: 'test-1', location: 'Test 1', birdeyeScore: 126.9, sentimentScore: 100, reputationScore: 70.0, listingScore: 0 },
  { id: 'vignesh', location: 'Vignesh', birdeyeScore: 118.2, sentimentScore: 0, reputationScore: 70.0, listingScore: 73.0 },
  { id: 'cut-n-looks', location: 'Cut n Looks Unisex Salon', birdeyeScore: 114.7, sentimentScore: 90.0, reputationScore: 78.0, listingScore: 93.0 },
  { id: 'cape-town', location: 'Cape Town', birdeyeScore: 114.2, sentimentScore: 93.5, reputationScore: 95.3, listingScore: 60.0 },
  { id: 'anaheim', location: 'Anaheim, CA - Amit K', birdeyeScore: 113.9, sentimentScore: 93.4, reputationScore: 77.6, listingScore: 86.0 },
]
