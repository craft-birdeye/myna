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
  /** When true, the reviewId/location row sits on its own line below the reviewer header
   *  instead of pinned top-right — for narrower containers (e.g. a run log's side panel). */
  stacked?: boolean
}

export interface StarRatingProps {
  rating: number
  size?: number
}
