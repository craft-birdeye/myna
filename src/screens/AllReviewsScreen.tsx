import { useEffect, useMemo, useState } from 'react'
import { FilterPanel, HeaderSearchField, Icon, ReviewCardBody, ShareFeedbackModal, StarRating, Toast, Tooltip, TopNav } from '../components'
import type { FilterField } from '../components'
import iconAgentsPurple from '../assets/icon-agents-purple.svg'
import { ALL_REVIEWS, type Review } from '../data/reviewsData'
import { useFeedbackRecommendationsStore } from '../data/FeedbackRecommendationsStoreContext'
import { REVIEW_COACHING_AGENT, REVIEW_COACHING_COPY } from '../data/reviewCoaching'

const opts = (...labels: string[]) => labels.map((l) => ({ value: l, label: l }))

const FILTER_FIELDS: FilterField[] = [
  { id: 'location', label: 'Location', options: opts('Cut n Looks Unisex Salon', 'Lush Landscaping Corporate', 'Bright Smile Dental Studio', 'Sunrise Family Medicine') },
  { id: 'dental-services', label: 'Dental services', options: opts('Cleaning', 'Whitening', 'Braces', 'Root canal', 'Extraction', 'Implants') },
  { id: 'equipment-available', label: 'Equipment available', options: opts('X-ray', 'Intraoral camera', 'Laser', 'CEREC') },
  { id: 'insurance-provider', label: 'Insurance provider', options: opts('Delta Dental', 'Cigna', 'Aetna', 'MetLife', 'Guardian') },
  { id: 'medical-conditions', label: 'Medical conditions', options: opts('Diabetes', 'Hypertension', 'Pregnancy', 'None') },
  { id: 'name-contain-test', label: 'Name contain test', options: opts('Test', 'Test patient', 'Test user') },
  { id: 'provider-or-clinic', label: 'Provider or clinic', options: opts('Dr. Patel', 'Dr. Nguyen', 'Dr. Alvarez', 'Downtown clinic') },
  { id: 'managed-by', label: 'Managed by', options: opts('Front desk', 'Office manager', 'Owner') },
  { id: 'gift-card-links', label: 'Gift card links', options: opts('Enabled', 'Disabled') },
  { id: 'colors', label: 'Colors', options: opts('Red', 'Blue', 'Green', 'Yellow') },
  { id: 'test-number-custom-field', label: 'Test number custom field', options: opts('1', '2', '3') },
  { id: 'test-text-custom-field', label: 'Test text custom field', options: opts('Sample A', 'Sample B') },
]

type ReviewSortId =
  | 'recent'
  | 'oldest'
  | 'lowest'
  | 'highest'
  | 'location-az'
  | 'location-za'

const REVIEW_SORT_OPTIONS: { id: ReviewSortId; label: string }[] = [
  { id: 'recent', label: 'Recent reviews' },
  { id: 'oldest', label: 'Oldest reviews' },
  { id: 'lowest', label: 'Lowest rated' },
  { id: 'highest', label: 'Highest rated' },
  { id: 'location-az', label: 'Location A-Z' },
  { id: 'location-za', label: 'Location Z-A' },
]

function parseReviewDate(value: string) {
  const time = Date.parse(value)
  return Number.isNaN(time) ? 0 : time
}

function sortReviews(reviews: Review[], sortId: ReviewSortId) {
  const sorted = [...reviews]
  switch (sortId) {
    case 'oldest':
      return sorted.sort((a, b) => parseReviewDate(a.date) - parseReviewDate(b.date))
    case 'lowest':
      return sorted.sort((a, b) => a.rating - b.rating || parseReviewDate(b.date) - parseReviewDate(a.date))
    case 'highest':
      return sorted.sort((a, b) => b.rating - a.rating || parseReviewDate(b.date) - parseReviewDate(a.date))
    case 'location-az':
      return sorted.sort((a, b) => a.location.localeCompare(b.location) || parseReviewDate(b.date) - parseReviewDate(a.date))
    case 'location-za':
      return sorted.sort((a, b) => b.location.localeCompare(a.location) || parseReviewDate(b.date) - parseReviewDate(a.date))
    case 'recent':
    default:
      return sorted.sort((a, b) => parseReviewDate(b.date) - parseReviewDate(a.date))
  }
}

function useOpenTransition(open: boolean, duration = 150) {
  const [mounted, setMounted] = useState(open)
  const [entered, setEntered] = useState(open)

  useEffect(() => {
    let raf1 = 0
    let raf2 = 0
    let timer: ReturnType<typeof setTimeout> | undefined
    if (open) {
      setMounted(true)
      raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(() => setEntered(true))
      })
    } else {
      setEntered(false)
      timer = setTimeout(() => setMounted(false), duration)
    }
    return () => {
      cancelAnimationFrame(raf1)
      cancelAnimationFrame(raf2)
      if (timer) clearTimeout(timer)
    }
  }, [open, duration])

  return { mounted, entered }
}

function ReviewsSortDropdown({
  value,
  onChange,
}: {
  value: ReviewSortId
  onChange: (value: ReviewSortId) => void
}) {
  const [open, setOpen] = useState(false)
  const { mounted, entered } = useOpenTransition(open)
  const selectedLabel = REVIEW_SORT_OPTIONS.find((option) => option.id === value)!.label

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex h-9 items-center gap-sm rounded-md border border-border-selected bg-surface px-lg text-body text-text-primary hover:bg-surface-l2"
      >
        {selectedLabel}
        <Icon name="expand_more" size={18} className="text-text-icon" />
      </button>
      {mounted && (
        <>
          <div className="fixed inset-0 z-[100]" onClick={() => setOpen(false)} aria-hidden />
          <div
            className={`absolute right-0 top-full z-[110] mt-xs min-w-[200px] origin-top-right rounded-sm border border-border bg-surface py-xs shadow-dropdown transition-all duration-150 ease-out ${
              entered ? 'translate-y-0 scale-100 opacity-100' : '-translate-y-1 scale-95 opacity-0'
            }`}
          >
            <p className="px-md pb-xs pt-sm text-small text-text-tertiary">Sort by</p>
            {REVIEW_SORT_OPTIONS.map((option) => {
              const selected = option.id === value
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => {
                    onChange(option.id)
                    setOpen(false)
                  }}
                  className={`flex w-full items-center gap-sm px-md py-sm text-left ${
                    selected ? 'bg-surface-selected' : 'hover:bg-surface-hover'
                  }`}
                >
                  <span className="min-w-0 flex-1 truncate text-body text-text-primary">{option.label}</span>
                  {selected && <Icon name="check" size={18} className="shrink-0 text-text-icon" />}
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

function ReviewsMoreMenu() {
  const [open, setOpen] = useState(false)
  const { mounted, entered } = useOpenTransition(open)

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="More options"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="flex size-9 items-center justify-center rounded-md border border-border-selected bg-surface text-text-icon hover:bg-surface-l2"
      >
        <Icon name="more_vert" size={20} />
      </button>
      {mounted && (
        <>
          <div className="fixed inset-0 z-[100]" onClick={() => setOpen(false)} aria-hidden />
          <div
            className={`absolute right-0 top-full z-[110] mt-xs min-w-[220px] origin-top-right rounded-sm border border-border bg-surface py-xs shadow-dropdown transition-all duration-150 ease-out ${
              entered ? 'translate-y-0 scale-100 opacity-100' : '-translate-y-1 scale-95 opacity-0'
            }`}
          >
            {(
              [
                { label: 'Enable BirdAI suggested reply' },
                { label: 'Compare review accuracy' },
                { label: 'Download', disabled: true },
                { label: 'Email' },
                { label: 'Schedule' },
              ] as const
            ).map((item) => (
              <button
                key={item.label}
                type="button"
                disabled={'disabled' in item && item.disabled}
                onClick={() => setOpen(false)}
                className={`block w-full px-md py-sm text-left text-body ${
                  'disabled' in item && item.disabled
                    ? 'cursor-not-allowed text-text-tertiary'
                    : 'text-text-primary hover:bg-surface-hover'
                }`}
              >
                {item.label}
              </button>
            ))}
            <p className="px-md pb-xs pt-sm text-small uppercase tracking-wide text-text-tertiary">
              Bulk actions
            </p>
            {(['Reply', 'Create tickets', 'Manage tags'] as const).map((label) => (
              <button
                key={label}
                type="button"
                onClick={() => setOpen(false)}
                className="block w-full px-md py-sm text-left text-body text-text-primary hover:bg-surface-hover"
              >
                {label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

type ReplyFeedback = 'up' | 'down' | null

/** Thumbs on an agent-written reply — same widget as the Inbox's `ChatBubble` feedback, plus
 *  the "Coach agent" / "Track your feedback" link that the Inbox shows on agent bubbles. */
function ReplyFeedbackRow({
  value,
  tracked,
  onChange,
  onTrack,
}: {
  value: ReplyFeedback
  tracked: boolean
  onChange: (next: 'up' | 'down') => void
  onTrack: () => void
}) {
  const btn = (active: boolean, tone: string) =>
    `flex size-6 items-center justify-center rounded-sm transition-colors hover:bg-surface-hover ${active ? tone : 'text-text-tertiary'}`
  return (
    <div className="mt-md flex items-center justify-between gap-md border-t border-border pt-md">
      <div className="flex items-center gap-xs">
        <Tooltip content="Good reply" variant="brief">
          <button type="button" aria-label="Good reply" aria-pressed={value === 'up'} onClick={() => onChange('up')} className={btn(value === 'up', 'text-accent-positive')}>
            <Icon name="thumb_up" size={16} />
          </button>
        </Tooltip>
        <Tooltip content={tracked ? 'Feedback submitted' : 'Coach the agent on this reply'} variant="brief">
          <button type="button" aria-label={tracked ? 'Feedback submitted' : 'Bad reply'} aria-pressed={value === 'down'} onClick={() => onChange('down')} className={btn(value === 'down', 'text-chip-danger-text')}>
            <Icon name="thumb_down" size={16} />
          </button>
        </Tooltip>
      </div>
      <button
        type="button"
        onClick={tracked ? onTrack : () => onChange('down')}
        className="flex items-center gap-xs rounded-sm px-sm py-xs text-small text-text-action hover:bg-surface-hover"
      >
        <Icon name={tracked ? 'track_changes' : 'school'} size={16} />
        {tracked ? REVIEW_COACHING_COPY.trackLink : REVIEW_COACHING_COPY.coachLink}
      </button>
    </div>
  )
}

function ReviewCard({
  review,
  feedback,
  tracked,
  onFeedback,
  onTrack,
}: {
  review: Review
  feedback: ReplyFeedback
  tracked: boolean
  onFeedback: (next: 'up' | 'down') => void
  onTrack: () => void
}) {
  const isAgentReply = Boolean(review.reply && /agent/i.test(review.reply.agentName))
  return (
    <article className="relative px-2xl py-2xl after:absolute after:inset-x-2xl after:bottom-0 after:border-b after:border-border">
      <ReviewCardBody
        review={review}
        replyFooter={isAgentReply ? <ReplyFeedbackRow value={feedback} tracked={tracked} onChange={onFeedback} onTrack={onTrack} /> : undefined}
      />

      {review.reply ? (
        <>
          <div className="mt-lg flex items-center justify-end gap-sm">
            <button
              type="button"
              className="flex h-9 items-center rounded-md border border-border-selected bg-surface px-lg text-body text-text-primary hover:bg-surface-l2"
            >
              Edit reply
            </button>
            <button
              type="button"
              aria-label="More options"
              className="flex size-9 items-center justify-center rounded-md border border-border-selected bg-surface text-text-icon hover:bg-surface-l2"
            >
              <Icon name="more_vert" size={20} />
            </button>
          </div>
        </>
      ) : (
        <div className="mt-lg flex items-center justify-end gap-sm">
          <button
            type="button"
            className="flex h-9 items-center rounded-md border border-border-selected bg-surface px-lg text-body text-text-primary hover:bg-surface-l2"
          >
            Reply
          </button>
          <button
            type="button"
            aria-label="Comment"
            className="flex size-9 items-center justify-center rounded-md border border-border-selected bg-surface text-text-icon hover:bg-surface-l2"
          >
            <Icon name="chat_bubble" size={20} />
          </button>
          <button
            type="button"
            aria-label="More options"
            className="flex size-9 items-center justify-center rounded-md border border-border-selected bg-surface text-text-icon hover:bg-surface-l2"
          >
            <Icon name="more_vert" size={20} />
          </button>
        </div>
      )}
    </article>
  )
}

export function AllReviewsScreen({
  unansweredOnly = false,
  agentRepliesOnly = false,
  onTrackFeedback,
}: {
  unansweredOnly?: boolean
  agentRepliesOnly?: boolean
  /** "Track feedback" on a coached reply — the host opens the review response agent's canvas
   *  with the copilot working on that coaching item. */
  onTrackFeedback?: (recommendationId: string, review: Review) => void
}) {
  const { submitFeedback } = useFeedbackRecommendationsStore()
  const [feedbackByReview, setFeedbackByReview] = useState<Record<string, ReplyFeedback>>({})
  const [recIdByReview, setRecIdByReview] = useState<Record<string, string>>({})
  const [shareFeedbackReviewId, setShareFeedbackReviewId] = useState<string | null>(null)
  const [toastMessage, setToastMessage] = useState('')
  const [toastVisible, setToastVisible] = useState(false)
  const [toastRecId, setToastRecId] = useState<string | null>(null)
  const showToast = (message: string, recId: string | null = null) => {
    setToastMessage(message)
    setToastRecId(recId)
    setToastVisible(true)
  }
  const handleFeedback = (review: Review, next: 'up' | 'down') => {
    if (next === 'down') {
      // Ask what was wrong before committing the thumbs-down — that text is the coaching.
      setShareFeedbackReviewId(review.id)
      return
    }
    setFeedbackByReview((prev) => ({ ...prev, [review.id]: prev[review.id] === 'up' ? null : 'up' }))
    showToast(REVIEW_COACHING_COPY.thanksToast)
  }
  const handleShareFeedbackSubmit = (details: string) => {
    const review = ALL_REVIEWS.find((r) => r.id === shareFeedbackReviewId)
    setShareFeedbackReviewId(null)
    if (!review) return
    const recId = submitFeedback({
      text: details,
      agentName: REVIEW_COACHING_AGENT,
      conversation: { name: review.reviewerName, message: details, channel: 'Text', date: review.date, location: review.location },
      conversationId: review.id,
      messageId: review.id,
      reportedExcerpt: [{ speaker: review.reply?.agentName ?? 'Agent', text: review.reply?.text ?? '' }],
      review,
      reportedBy: 'You',
    })
    setFeedbackByReview((prev) => ({ ...prev, [review.id]: 'down' }))
    setRecIdByReview((prev) => ({ ...prev, [review.id]: recId }))
    showToast(REVIEW_COACHING_COPY.feedbackToast, recId)
  }
  const track = (review: Review) => {
    const recId = recIdByReview[review.id]
    if (recId) onTrackFeedback?.(recId, review)
  }
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<ReviewSortId>('recent')
  const [filterOpen, setFilterOpen] = useState(false)

  const filtered = useMemo(() => {
    let base = ALL_REVIEWS
    if (unansweredOnly) base = base.filter((review) => !review.reply)
    if (agentRepliesOnly) base = base.filter((review) => Boolean(review.reply))
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      base = base.filter((review) => (
        review.reviewerName.toLowerCase().includes(q)
        || review.text.toLowerCase().includes(q)
        || review.location.toLowerCase().includes(q)
        || review.reviewId.includes(q)
      ))
    }
    return sortReviews(base, sortBy)
  }, [searchQuery, sortBy, unansweredOnly, agentRepliesOnly])

  const title = unansweredOnly
    ? 'Respond to reviews'
    : agentRepliesOnly
      ? 'Monitor agent replies'
      : 'View all reviews'
  const totalLabel = unansweredOnly ? '1,048,675 total reviews' : '1,035 total reviews'
  const averageRating = unansweredOnly ? 4.4 : 3.8

  return (
    <div className="flex h-full flex-col">
      <TopNav initials="S" />
      <div className="flex flex-1 overflow-hidden">
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <div className="flex shrink-0 items-center justify-between bg-surface px-2xl py-xl">
            <div className="flex flex-col gap-xs">
              <h1 className="text-h3 text-text-primary">{title}</h1>
              <div className="flex items-center gap-sm text-body text-text-secondary">
                <span>{totalLabel}</span>
                <span className="text-text-tertiary">•</span>
                <span>{averageRating}</span>
                <StarRating rating={averageRating} size={16} />
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
              <ReviewsSortDropdown value={sortBy} onChange={setSortBy} />
              <Tooltip content="Summarize using BirdAI" variant="brief">
                <button
                  type="button"
                  aria-label="Summarize using BirdAI"
                  className="flex size-9 items-center justify-center rounded-md border border-border-selected bg-surface hover:bg-surface-l2"
                >
                  <img src={iconAgentsPurple} alt="" className="size-6" />
                </button>
              </Tooltip>
              <ReviewsMoreMenu />
              <button
                type="button"
                aria-label="Filters"
                onClick={() => setFilterOpen((current) => !current)}
                className={`flex size-9 items-center justify-center rounded-md border border-border-selected text-text-icon hover:bg-surface-l2 ${
                  filterOpen ? 'bg-surface-selected' : 'bg-surface'
                }`}
              >
                <Icon name="filter_list" size={20} />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filtered.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                feedback={feedbackByReview[review.id] ?? null}
                tracked={Boolean(recIdByReview[review.id])}
                onFeedback={(next) => handleFeedback(review, next)}
                onTrack={() => track(review)}
              />
            ))}
          </div>
        </div>
        <FilterPanel open={filterOpen} fields={FILTER_FIELDS} onClose={() => setFilterOpen(false)} />
      </div>
      <ShareFeedbackModal
        open={shareFeedbackReviewId !== null}
        onClose={() => setShareFeedbackReviewId(null)}
        onSubmit={handleShareFeedbackSubmit}
      />
      <Toast
        message={toastMessage}
        visible={toastVisible}
        onClose={() => setToastVisible(false)}
        actionLabel={toastRecId ? REVIEW_COACHING_COPY.feedbackToastAction : undefined}
        onAction={
          toastRecId
            ? () => {
                const review = ALL_REVIEWS.find((r) => recIdByReview[r.id] === toastRecId)
                setToastVisible(false)
                if (review) onTrackFeedback?.(toastRecId, review)
              }
            : undefined
        }
      />
    </div>
  )
}
