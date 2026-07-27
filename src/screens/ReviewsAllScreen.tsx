import { useRef, useState } from 'react'
import { Chip, DateRangeSelector, Icon, TopNav } from '../components'
import iconGoogle from '../assets/icon-google.svg'

interface Review {
  id: string
  rating: number
  reviewerName: string
  date: string
  featured?: boolean
  employeeCount: number
  location: string
  text: string
  photos?: string[]
  replyAsName: string
  suggestedReply: string
}

const SORT_OPTIONS = ['Recent reviews', 'Highest rated', 'Lowest rated', 'Most photos']

const REVIEWS: Review[] = [
  {
    id: 'r1',
    rating: 4,
    reviewerName: 'Jay Jariwala',
    date: 'Jul 25, 2026',
    employeeCount: 2,
    location: 'California',
    text: "Friendly front desk staff and the wait time was shorter than expected. Only reason it's not 5 stars is parking was a bit tight.",
    replyAsName: 'Sampada (me)',
    suggestedReply: 'Thank you for the kind words, Jay! We appreciate the feedback on parking and will look into it.',
  },
  {
    id: 'r2',
    rating: 5,
    reviewerName: 'Arya Stark',
    date: 'Jan 7, 2023',
    featured: true,
    employeeCount: 2,
    location: 'Georgia',
    text: "I had a great time here, the place is situated near Wagle circle. It has top notch ambience and a really cool vibe. The food and drinks were pretty good and would definitely recommend this out to all the non veg lovers. The restaurant is pretty big and can accommodate a huge crowd with indoor as well as an outdoor seating. The prices for the dishes are pretty reasonable and totally worth it! My personal preference were the desserts, especially the DIY cake. Would definitely visit again! ❤️",
    photos: [
      'https://picsum.photos/seed/reviews-1a/400/300',
      'https://picsum.photos/seed/reviews-1b/400/300',
      'https://picsum.photos/seed/reviews-1c/400/300',
      'https://picsum.photos/seed/reviews-1d/400/300',
      'https://picsum.photos/seed/reviews-1e/400/300',
      'https://picsum.photos/seed/reviews-1f/400/300',
    ],
    replyAsName: 'Sampada (me)',
    suggestedReply: 'We appreciate your feedback! Thank you for taking the time to share your experience with us.',
  },
  {
    id: 'r3',
    rating: 4,
    reviewerName: 'Daniel Peirre',
    date: 'Jan 7, 2023',
    employeeCount: 2,
    location: 'Texas',
    text: 'I recently had a experience of dining at Magna and I must say that it was an outstanding experience from start to end. The menu is so diverse and thoughtfully curated.',
    replyAsName: 'Sampada (me)',
    suggestedReply: 'We appreciate your feedback! Thank you for taking the time to share your experience with us.',
  },
  {
    id: 'r4',
    rating: 5,
    reviewerName: 'Marcus Webb',
    date: 'Jan 5, 2023',
    employeeCount: 3,
    location: 'Illinois',
    text: 'Booked online and got a table right away — service was quick and friendly. Will be back for the weekend brunch.',
    replyAsName: 'Sampada (me)',
    suggestedReply: 'Thank you, Marcus! We loved having you and look forward to seeing you again soon.',
  },
  {
    id: 'r5',
    rating: 3,
    reviewerName: 'Renee Ortiz',
    date: 'Jan 3, 2023',
    employeeCount: 1,
    location: 'Florida',
    text: 'Food was decent but we waited almost 20 minutes for our order to be taken. Ambience is nice though.',
    photos: [
      'https://picsum.photos/seed/reviews-4a/400/300',
      'https://picsum.photos/seed/reviews-4b/400/300',
      'https://picsum.photos/seed/reviews-4c/400/300',
    ],
    replyAsName: 'Sampada (me)',
    suggestedReply: "Thank you for your feedback — we're sorry about the wait and will share this with our team.",
  },
]

function GoldStars({ rating, size = 18 }: { rating: number; size?: number }) {
  const full = Math.round(rating)
  return (
    <span className="flex items-center gap-[1px]">
      {Array.from({ length: 5 }).map((_, i) => (
        <Icon key={i} name="star" size={size} fill={i < full} className={i < full ? 'text-[#f5a623]' : 'text-[#d4d4d4]'} />
      ))}
    </span>
  )
}

function PhotoCarousel({ photos }: { photos: string[] }) {
  const ref = useRef<HTMLDivElement>(null)
  const scroll = (dir: number) => ref.current?.scrollBy({ left: dir * 260, behavior: 'smooth' })
  return (
    <div className="group relative">
      <div ref={ref} className="flex gap-sm overflow-x-auto scroll-smooth" style={{ scrollbarWidth: 'none' }}>
        {photos.map((src, i) => (
          <img key={i} src={src} alt="" className="h-[140px] w-[220px] shrink-0 rounded-md object-cover" />
        ))}
      </div>
      <button
        type="button"
        aria-label="Previous photos"
        onClick={() => scroll(-1)}
        className="absolute left-sm top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-text-icon opacity-0 shadow-dropdown transition-opacity hover:bg-white group-hover:opacity-100"
      >
        <Icon name="chevron_left" size={20} />
      </button>
      <button
        type="button"
        aria-label="Next photos"
        onClick={() => scroll(1)}
        className="absolute right-sm top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-text-icon opacity-0 shadow-dropdown transition-opacity hover:bg-white group-hover:opacity-100"
      >
        <Icon name="chevron_right" size={20} />
      </button>
    </div>
  )
}

function HeaderIconButton({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      className="flex size-9 items-center justify-center rounded-sm border border-border-selected bg-surface text-text-icon hover:bg-surface-l2"
    >
      {children}
    </button>
  )
}

function ReviewCard({ review }: { review: Review }) {
  return (
    <article className="flex flex-col gap-lg border-b border-border py-2xl first:pt-0">
      <div className="flex items-start justify-between gap-lg">
        <div className="flex items-center gap-md">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full border border-border bg-white">
            <img src={iconGoogle} alt="Google" className="size-6" />
          </span>
          <div className="flex flex-col gap-xs">
            <GoldStars rating={review.rating} size={20} />
            <div className="flex flex-wrap items-center gap-xs text-body">
              <span className="font-medium text-text-primary">{review.reviewerName}</span>
              <span className="text-text-tertiary">•</span>
              <span className="text-text-secondary">{review.date}</span>
              {review.featured && (
                <>
                  <span className="text-text-tertiary">•</span>
                  <Chip label="Featured" variant="neutral" />
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-lg text-small text-text-secondary">
          <span className="flex items-center gap-xs">
            <Icon name="group" size={16} className="text-text-icon" />
            {review.employeeCount} employee{review.employeeCount === 1 ? '' : 's'}
          </span>
          <span className="flex items-center gap-xs">
            <Icon name="place" size={16} className="text-text-icon" />
            {review.location}
          </span>
        </div>
      </div>

      <p className="text-body text-text-primary">{review.text}</p>

      {review.photos && <PhotoCarousel photos={review.photos} />}

      <div className="flex flex-col gap-sm rounded-md bg-ai-summary p-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-xs text-small text-text-secondary">
            <span>BirdAI suggested reply</span>
            <span>•</span>
            <span>
              Reply as <button type="button" className="text-text-action">{review.replyAsName}</button>
            </span>
            <Icon name="expand_more" size={16} className="text-text-icon" />
          </div>
          <button type="button" aria-label="More" className="text-text-icon hover:text-text-primary">
            <Icon name="more_vert" size={18} />
          </button>
        </div>
        <p className="text-body text-text-primary">{review.suggestedReply}</p>
        <div className="flex justify-end gap-sm">
          <button type="button" className="flex h-9 items-center rounded-sm border border-border-selected px-lg text-body font-normal text-text-primary hover:bg-surface-hover">
            Post reply
          </button>
          <button type="button" aria-label="Comment" className="flex size-9 items-center justify-center rounded-sm border border-border-selected text-text-icon hover:bg-surface-hover">
            <Icon name="sms" size={18} />
          </button>
          <button type="button" aria-label="More options" className="flex size-9 items-center justify-center rounded-sm border border-border-selected text-text-icon hover:bg-surface-hover">
            <Icon name="more_vert" size={18} />
          </button>
        </div>
      </div>
    </article>
  )
}

export function ReviewsAllScreen() {
  const [sort, setSort] = useState('Recent reviews')

  return (
    <div className="flex h-full flex-col">
      <TopNav initials="S" />
      <div className="flex-1 overflow-y-auto bg-surface">
        <div className="flex items-start justify-between px-2xl py-xl">
          <div className="flex flex-col gap-xs">
            <h1 className="text-h3 text-text-primary">All reviews</h1>
            <div className="flex items-center gap-xs text-small text-text-secondary">
              <span>832 total reviews</span>
              <span>•</span>
              <span>4.1</span>
              <GoldStars rating={4.1} size={14} />
            </div>
          </div>
          <div className="flex items-center gap-sm">
            <HeaderIconButton label="Search reviews">
              <Icon name="search" size={20} />
            </HeaderIconButton>
            <DateRangeSelector value={sort} options={SORT_OPTIONS} onChange={setSort} />
            <HeaderIconButton label="AI actions">
              <Icon name="auto_awesome" size={20} className="text-ai-brand" />
            </HeaderIconButton>
            <HeaderIconButton label="More">
              <Icon name="more_vert" size={20} />
            </HeaderIconButton>
            <HeaderIconButton label="Filters">
              <Icon name="filter_list" size={20} />
            </HeaderIconButton>
          </div>
        </div>

        <div className="flex flex-col px-2xl pb-2xl">
          {REVIEWS.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      </div>
    </div>
  )
}
