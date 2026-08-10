import { useEffect, useMemo, useState } from 'react'
import { FilterPanel, HeaderSearchField, Icon, Tooltip, TopNav } from '../components'
import type { FilterField } from '../components'
import iconAgentsPurple from '../assets/icon-agents-purple.svg'
import { ALL_REVIEWS, type Review } from '../data/reviewsData'

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
        className="flex h-9 items-center gap-sm rounded-sm border border-border-selected bg-surface px-lg text-body text-text-primary hover:bg-surface-l2"
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
        className="flex size-9 items-center justify-center rounded-sm border border-border-selected bg-surface text-text-icon hover:bg-surface-l2"
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

function StarRating({ rating, size = 18 }: { rating: number; size?: number }) {
  const boxClass = size <= 16 ? 'size-4' : 'size-[18px]'

  return (
    <span className="flex items-center">
      {Array.from({ length: 5 }, (_, i) => {
        const filled = rating - i
        if (filled >= 1) {
          return (
            <Icon
              key={i}
              name="star"
              size={size}
              fill
              className="text-rating-star"
            />
          )
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
        return (
          <Icon
            key={i}
            name="star"
            size={size}
            fill
            className="text-rating-empty"
          />
        )
      })}
    </span>
  )
}

function ReviewCard({ review }: { review: Review }) {
  return (
    <article className="relative px-2xl py-2xl after:absolute after:inset-x-2xl after:bottom-0 after:border-b after:border-border">
      <div className="flex items-start justify-between gap-lg">
        <div className="flex items-center gap-md">
          <span className="flex size-[35px] shrink-0 items-center justify-center rounded-full bg-primary text-body text-white">
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

      {review.reply ? (
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
      ) : (
        <div className="mt-lg flex items-center justify-end gap-sm">
          <button
            type="button"
            className="flex h-9 items-center rounded-sm border border-border-selected bg-surface px-lg text-body text-text-primary hover:bg-surface-l2"
          >
            Reply
          </button>
          <button
            type="button"
            aria-label="Comment"
            className="flex size-9 items-center justify-center rounded-sm border border-border-selected bg-surface text-text-icon hover:bg-surface-l2"
          >
            <Icon name="chat_bubble" size={20} />
          </button>
          <button
            type="button"
            aria-label="More options"
            className="flex size-9 items-center justify-center rounded-sm border border-border-selected bg-surface text-text-icon hover:bg-surface-l2"
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
}: {
  unansweredOnly?: boolean
  agentRepliesOnly?: boolean
}) {
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
                  className="flex size-9 items-center justify-center rounded-sm border border-border-selected bg-surface hover:bg-surface-l2"
                >
                  <img src={iconAgentsPurple} alt="" className="size-6" />
                </button>
              </Tooltip>
              <ReviewsMoreMenu />
              <button
                type="button"
                aria-label="Filters"
                onClick={() => setFilterOpen((current) => !current)}
                className={`flex size-9 items-center justify-center rounded-sm border border-border-selected text-text-icon hover:bg-surface-l2 ${
                  filterOpen ? 'bg-surface-selected' : 'bg-surface'
                }`}
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
        <FilterPanel open={filterOpen} fields={FILTER_FIELDS} onClose={() => setFilterOpen(false)} />
      </div>
    </div>
  )
}
