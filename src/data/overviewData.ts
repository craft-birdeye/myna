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
  'Dec 2022', 'Jan 2023', 'Feb 2023', 'Mar 2023', 'Apr 2023', 'May 2023', 'Jun 2023', 'Jul 2023', 'Aug 2023',
  'Sep 2023', 'Oct 2023', 'Nov 2023', 'Dec 2023', 'Jan 2024', 'Feb 2024', 'Mar 2024', 'Apr 2024', 'May 2024',
  'Jun 2024', 'Jul 2024', 'Aug 2024', 'Sep 2024', 'Oct 2024', 'Nov 2024', 'Dec 2024', 'Jan 2025', 'Feb 2025',
  'Mar 2025', 'Apr 2025', 'May 2025', 'Jun 2025', 'Jul 2025', 'Aug 2025', 'Sep 2025', 'Oct 2025', 'Nov 2025',
  'Dec 2025',
]

export const OVERVIEW_SOCIAL_DATA: Array<Record<string, string | number>> = SOCIAL_MONTHS.map((month, i) => {
  if (i === 0) return { month, facebook: 0, instagram: 68, google: 0, linkedin: 0 }
  if (i === 4) return { month, facebook: 12, instagram: 4, google: 0, linkedin: 0 }
  if (i === 5) return { month, facebook: 6, instagram: 2, google: 0, linkedin: 0 }
  return { month, facebook: 1, instagram: 1, google: 0, linkedin: 0 }
})
