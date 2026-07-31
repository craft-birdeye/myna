import { useState } from 'react'
import { HeaderSearchField, Icon, TopNav } from '../components'

interface ReviewEntry {
  id: string
  reviewer: string
  initial: string
  rating: number
  date: string
  text: string
  refId: string
  business: string
  response?: {
    postedOn: string
    agent: string
    timestamp: string
    text: string
  }
}

const REVIEWS: ReviewEntry[] = [
  {
    id: 'r-1',
    reviewer: 'Prem',
    initial: 'B',
    rating: 2,
    date: 'Jul 22, 2026',
    text: "Had them install a sprinkler system. Two of the zones didn't work properly from day one. They came back to fix it, but then a pipe started leaking a week later. It took three service calls to get everything functioning. The system works now, but the whole process was stressful and way more drawn out than it should have been. Giving an extra star because they didn't charge for the repairs at least.",
    refId: '1730455',
    business: 'Lush Landscaping Corporate',
    response: {
      postedOn: 'Birdeye',
      agent: 'Review response agent',
      timestamp: 'Jul 22, 2026 01:32 PM (PKT)',
      text: "We appreciate your feedback, Prem. If you would like to discuss your experience further, don't hesitate to reach out to us at (602) 791-9826 or rebecca.sprynczynatyk@birdeye.com. We would love the opportunity to resolve any issues.",
    },
  },
  {
    id: 'r-2',
    reviewer: 'jenny Sampago',
    initial: 'B',
    rating: 2,
    date: 'Jul 22, 2026',
    text: 'The actual landscaping work is okay — not amazing, not terrible. But scheduling with this company is a nightmare. They canceled on me four times in two months. I work from home and rearranged my meetings to accommodate them, only to get a "we need to reschedule" text the morning of. Respect people\'s time, please.',
    refId: '1730451',
    business: 'Lush Landscaping Corporate',
    response: {
      postedOn: 'Birdeye',
      agent: 'Review response agent',
      timestamp: 'Jul 22, 2026 01:31 PM (PKT)',
      text: "Thank you for sharing your thoughts, Jenny. We'd love to hear how we could earn 5 stars from you. If there's anything we can do to improve your experience, please feel free to give us a call at (602) 791-9826.",
    },
  },
  {
    id: 'r-3',
    reviewer: 'Marcus Webb',
    initial: 'B',
    rating: 5,
    date: 'Jul 21, 2026',
    text: 'Fantastic experience from start to finish. The crew showed up on time, walked me through the design plan, and finished the full backyard renovation two days ahead of schedule. Our lawn has never looked better and the drip irrigation they installed has already cut our water bill.',
    refId: '1730432',
    business: 'Bright Smile Dental Studio',
    response: {
      postedOn: 'Birdeye',
      agent: 'Review response agent',
      timestamp: 'Jul 21, 2026 04:12 PM (PKT)',
      text: "Thank you so much, Marcus! We're thrilled the renovation exceeded your expectations. Enjoy the new backyard, and don't hesitate to reach out if you ever need anything.",
    },
  },
  {
    id: 'r-4',
    reviewer: 'Alina Torres',
    initial: 'B',
    rating: 4,
    date: 'Jul 20, 2026',
    text: 'Good service overall. The team was professional and the pricing was fair. Only reason for four stars instead of five is that communication before the appointment could have been better — I had to call twice to confirm the time.',
    refId: '1730398',
    business: 'Sunrise Family Medicine',
  },
]

function Stars({ rating, size = 18 }: { rating: number; size?: number }) {
  return (
    <span className="flex items-center">
      {[1, 2, 3, 4, 5].map((i) => (
        <Icon
          key={i}
          name="star"
          size={size}
          fill={i <= rating}
          className={i <= rating ? 'text-chip-warning-text' : 'text-control-border'}
        />
      ))}
    </span>
  )
}

function ReviewCard({ review }: { review: ReviewEntry }) {
  return (
    <article className="border-b border-border px-2xl py-2xl">
      {/* Reviewer row */}
      <div className="flex items-start justify-between gap-lg">
        <div className="flex items-center gap-md">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary text-h3 text-white">
            {review.initial}
          </span>
          <div className="flex flex-col gap-xs">
            <Stars rating={review.rating} />
            <div className="flex items-center gap-sm text-body">
              <span className="text-text-primary">{review.reviewer}</span>
              <span className="text-text-tertiary">•</span>
              <span className="text-text-secondary">{review.date}</span>
            </div>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-lg text-body text-text-tertiary">
          <span className="flex items-center gap-xs">
            <Icon name="sell" size={16} className="text-text-tertiary" />
            {review.refId}
          </span>
          <span className="flex items-center gap-xs">
            <Icon name="location_on" size={16} className="text-text-tertiary" />
            {review.business}
          </span>
        </div>
      </div>

      {/* Review text */}
      <p className="mt-lg text-body text-text-primary">{review.text}</p>

      {/* Agent response */}
      {review.response && (
        <>
          <div className="mt-lg rounded-md bg-surface-l2 p-xl">
            <div className="flex flex-wrap items-center gap-xs text-body text-text-secondary">
              <span>Posted on</span>
              <span className="text-text-action">{review.response.postedOn}</span>
              <span>by {review.response.agent}</span>
              <span className="text-text-tertiary">•</span>
              <span>{review.response.timestamp}</span>
            </div>
            <p className="mt-sm text-body text-text-primary">{review.response.text}</p>
          </div>
          <div className="mt-lg flex items-center justify-end gap-sm">
            <button
              type="button"
              className="flex h-9 items-center rounded-sm border border-border-selected bg-surface px-lg text-body text-text-primary hover:bg-surface-l2"
            >
              Edit reply
            </button>
            <button
              type="button"
              aria-label="More options"
              className="flex size-9 items-center justify-center rounded-sm border border-border-selected bg-surface text-text-icon hover:bg-surface-l2"
            >
              <Icon name="more_vert" size={20} />
            </button>
          </div>
        </>
      )}
    </article>
  )
}

export function AllReviewsScreen() {
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const q = searchQuery.trim().toLowerCase()
  const visible = q
    ? REVIEWS.filter(
        (r) =>
          r.reviewer.toLowerCase().includes(q)
          || r.text.toLowerCase().includes(q)
          || r.business.toLowerCase().includes(q),
      )
    : REVIEWS

  return (
    <div className="flex h-full flex-col">
      <TopNav initials="S" />

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between bg-surface px-2xl py-xl">
          <div className="flex flex-col gap-xs">
            <h1 className="text-h3 text-text-primary">All reviews</h1>
            <div className="flex items-center gap-sm text-body text-text-secondary">
              <span>1,035 total reviews</span>
              <span className="text-text-tertiary">•</span>
              <span>3.8</span>
              <Stars rating={4} size={16} />
            </div>
          </div>
          <div className="flex items-center gap-sm">
            <HeaderSearchField open={searchOpen} value={searchQuery} onOpenChange={setSearchOpen} onChange={setSearchQuery} />
            <button
              type="button"
              className="flex h-9 items-center gap-sm rounded-sm border border-border-selected bg-surface px-lg text-body text-text-primary hover:bg-surface-l2"
            >
              Recent reviews
              <Icon name="expand_more" size={18} className="text-text-icon" />
            </button>
            <button
              type="button"
              aria-label="More options"
              className="flex size-9 items-center justify-center rounded-sm border border-border-selected bg-surface text-text-icon hover:bg-surface-l2"
            >
              <Icon name="more_vert" size={20} />
            </button>
            <button
              type="button"
              aria-label="Filters"
              className="flex size-9 items-center justify-center rounded-sm border border-border-selected bg-surface text-text-icon hover:bg-surface-l2"
            >
              <Icon name="filter_list" size={20} />
            </button>
          </div>
        </div>

        {/* Review list */}
        <div className="flex-1 overflow-y-auto">
          {visible.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
          {visible.length === 0 && (
            <div className="flex h-48 items-center justify-center text-body text-text-tertiary">
              No reviews match your search
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
