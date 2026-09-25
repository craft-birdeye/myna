import type React from 'react'

export interface ReviewCardReply {
  channel: string
  agentName: string
  postedAt: string
  text: string
}

export interface ReviewCardData {
  reviewerName: string
  rating: number
  date: string
  reviewId: string
  location: string
  text: string
  reply?: ReviewCardReply
}

export interface ReviewCardBodyProps {
  review: ReviewCardData
  className?: string
  /** Rendered at the bottom of the reply block (only when `review.reply` exists) — e.g. the
   *  thumbs-up/down row that coaches the agent on an agent-written reply. */
  replyFooter?: React.ReactNode
  /** When true, the reviewId/location row sits on its own line below the reviewer header
   *  instead of pinned top-right — for narrower containers (e.g. a run log's side panel). */
  stacked?: boolean
}

export interface StarRatingProps {
  rating: number
  size?: number
}
