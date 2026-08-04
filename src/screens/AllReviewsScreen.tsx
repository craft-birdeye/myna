import { useState } from 'react'
import { HeaderSearchField, Icon, TopNav } from '../components'
import { ALL_REVIEWS, type Review } from '../data/reviewsData'

function StarRating({ rating, size = 18 }: { rating: number; size?: number }) {
  return (
    <span className="flex items-center">
      {Array.from({ length: 5 }, (_, i) => (
        <Icon
          key={i}
          name="star"
          size={size}
          fill={i < rating}
          className={i < rating ? 'text-chip-warning-text' : 'text-control-border'}
        />
      ))}
    </span>
  )
}

function ReviewCard({ review }: { review: Review }) {
  return (
    <article className="border-b border-border px-2xl py-2xl">
      <div className="flex items-start justify-between gap-lg">
        <div className="flex items-center gap-md">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary text-h3 text-white">
            B
          </span>
          <div className="flex flex-col gap-xs">
            <StarRating rating={review.rating} />
            <div className="flex items-center gap-sm text-body">
              <span className="text-text-primary">{review.reviewerName}</span>
              <span className="text-text-tertiary">•</span>
              <span className="text-text-secondary">{review.date}</span>
            </div>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-lg text-body text-text-tertiary">
          <span className="flex items-center gap-xs">
            <Icon name="sell" size={16} className="text-text-tertiary" />
            {review.reviewId}
          </span>
          <span className="flex items-center gap-xs">
            <Icon name="location_on" size={16} className="text-text-tertiary" />
            {review.location}
          </span>
        </div>
      </div>

      <p className="mt-lg text-body text-text-primary">{review.text}</p>

      {review.reply && (
        <>
          <div className="mt-lg rounded-md bg-surface-l2 p-xl">
            <div className="flex flex-wrap items-center gap-xs text-body text-text-secondary">
              <span>Posted on</span>
              <span className="text-text-action">{review.reply.channel}</span>
              <span>by {review.reply.agentName}</span>
              <span className="text-text-tertiary">•</span>
              <span>{review.reply.postedAt}</span>
            </div>
            <p className="mt-sm text-body text-text-primary">{review.reply.text}</p>
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

  const filtered = searchQuery.trim()
    ? ALL_REVIEWS.filter((review) => {
        const q = searchQuery.toLowerCase()
        return (
          review.reviewerName.toLowerCase().includes(q)
          || review.text.toLowerCase().includes(q)
          || review.location.toLowerCase().includes(q)
          || review.reviewId.includes(q)
        )
      })
    : ALL_REVIEWS

  return (
    <div className="flex h-full flex-col">
      <TopNav initials="S" />
      <div className="flex shrink-0 items-center justify-between bg-surface px-2xl py-xl">
        <div className="flex flex-col gap-xs">
          <h1 className="text-h3 text-text-primary">All reviews</h1>
          <div className="flex items-center gap-sm text-body text-text-secondary">
            <span>1,035 total reviews</span>
            <span className="text-text-tertiary">•</span>
            <span>3.8</span>
            <StarRating rating={4} size={16} />
          </div>
        </div>
        <div className="flex items-center gap-sm">
          <HeaderSearchField
            open={searchOpen}
            value={searchQuery}
            onOpenChange={setSearchOpen}
            onChange={setSearchQuery}
            placeholder="Search reviews"
          />
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
      <div className="flex-1 overflow-y-auto">
        {filtered.map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>
    </div>
  )
}
