import { Icon } from '../Icon/Icon'
import { Tooltip } from '../Tooltip/Tooltip'
import birdeyeLogo from '../../assets/birdeye-logo.svg'
import { REVIEW_SOURCE_LOGOS } from '../../data/reviewSourceLogos'
import type { ReviewCardBodyProps, StarRatingProps } from './ReviewCard.types'

export function StarRating({ rating, size = 18 }: StarRatingProps) {
  const boxClass = size <= 16 ? 'size-4' : 'size-[18px]'

  return (
    <span className="flex items-center">
      {Array.from({ length: 5 }, (_, i) => {
        const filled = rating - i
        if (filled >= 1) {
          return <Icon key={i} name="star" size={size} fill className="text-rating-star" />
        }
        if (filled > 0) {
          return (
            <span key={i} className={`relative inline-flex ${boxClass}`}>
              <Icon name="star" size={size} fill className="text-rating-empty" />
              <span
                className="absolute inset-y-0 left-0 overflow-hidden"
                style={{ width: `${filled * 100}%` }}
              >
                <Icon name="star" size={size} fill className="text-rating-star" />
              </span>
            </span>
          )
        }
        return <Icon key={i} name="star" size={size} fill className="text-rating-empty" />
      })}
    </span>
  )
}

/** The reviewer/rating header, review text, and posted-reply block of a review — the shared
 *  visual core of the reviews list card, reused wherever a single review needs to be shown
 *  read-only (e.g. a log run's "Review details" tab). */
export function ReviewCardBody({ review, className = '', stacked = false }: ReviewCardBodyProps) {
  const avatar = (
    <Tooltip variant="brief" content="Birdeye">
      <span className="flex size-[35px] shrink-0 items-center justify-center rounded-full bg-surface-l2">
        <img src={birdeyeLogo} alt="Birdeye" className="size-[20px]" />
      </span>
    </Tooltip>
  )

  const nameAndDate = (
    <div className="flex items-center gap-sm text-body">
      <span className="text-text-primary">{review.reviewerName}</span>
      <span className="text-text-tertiary">•</span>
      <span className="text-text-secondary">{review.date}</span>
    </div>
  )

  const tagAndLocation = (
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
  )

  return (
    <div className={className}>
      <div className={stacked ? 'flex items-start gap-md' : 'flex items-start justify-between gap-lg'}>
        {stacked ? (
          <>
            {avatar}
            <div className="flex flex-col gap-sm">
              <StarRating rating={review.rating} />
              {nameAndDate}
              {tagAndLocation}
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-md">
              {avatar}
              <div className="flex flex-col gap-xs">
                <StarRating rating={review.rating} />
                {nameAndDate}
              </div>
            </div>
            {tagAndLocation}
          </>
        )}
      </div>

      <p className="mt-lg text-body text-text-primary">{review.text}</p>

      {review.reply && (
        <div className="mt-lg rounded-md bg-surface-l2 p-xl">
          <div className="flex flex-col gap-xs text-body text-text-secondary">
            <div className="flex flex-wrap items-center gap-xs">
              <span>Posted on</span>
              {REVIEW_SOURCE_LOGOS[review.reply.channel] ? (
                <Tooltip variant="brief" content={review.reply.channel}>
                  <img
                    src={REVIEW_SOURCE_LOGOS[review.reply.channel]}
                    alt={review.reply.channel}
                    className="size-[16px]"
                  />
                </Tooltip>
              ) : (
                <span className="text-text-action">{review.reply.channel}</span>
              )}
              <span>by {review.reply.agentName}</span>
            </div>
            <span>{review.reply.postedAt}</span>
          </div>
          <p className="mt-sm text-body text-text-primary">{review.reply.text}</p>
        </div>
      )}
    </div>
  )
}
