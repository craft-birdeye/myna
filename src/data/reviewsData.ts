export interface ReviewReply {
  channel: string
  agentName: string
  postedAt: string
  text: string
}

export interface Review {
  id: string
  reviewerName: string
  rating: number
  date: string
  reviewId: string
  location: string
  text: string
  reply?: ReviewReply
}

export const ALL_REVIEWS: Review[] = [
  {
    id: 'r1',
    reviewerName: 'Prem',
    rating: 2,
    date: 'Jul 22, 2026',
    reviewId: '1730455',
    location: 'Lush Landscaping Corporate',
    text: "Had them install a sprinkler system. Two of the zones didn't work properly from day one. They came back to fix it, but then a pipe started leaking a week later. It took three service calls to get everything functioning. The system works now, but the whole process was stressful and way more drawn out than it should have been. Giving an extra star because they didn't charge for the repairs at least.",
    reply: {
      channel: 'Birdeye',
      agentName: 'Review response agent',
      postedAt: 'Jul 22, 2026 01:32 PM (PKT)',
      text: 'We appreciate your feedback, Prem. If you would like to discuss your experience further, don\'t hesitate to reach out to us at (602) 791-9826 or rebecca.sprynczynatyk@birdeye.com. We would love the opportunity to resolve any issues.',
    },
  },
  {
    id: 'r2',
    reviewerName: 'jenny Sampago',
    rating: 2,
    date: 'Jul 22, 2026',
    reviewId: '1730451',
    location: 'Lush Landscaping Corporate',
    text: 'The actual landscaping work is okay — not amazing, not terrible. But scheduling with this company is a nightmare. They canceled on me four times in two months. I work from home and rearranged my meetings to accommodate them, only to get a "we need to reschedule" text the morning of. Respect people\'s time, please.',
    reply: {
      channel: 'Birdeye',
      agentName: 'Review response agent',
      postedAt: 'Jul 22, 2026 01:31 PM (PKT)',
      text: "Thank you for sharing your thoughts, Jenny. We'd love to hear how we could earn 5 stars from you. If there's anything we can do to improve your experience, please feel free to give us a call at (602) 791-9826.",
    },
  },
  {
    id: 'r3',
    reviewerName: 'Marcus Webb',
    rating: 5,
    date: 'Jul 21, 2026',
    reviewId: '1730432',
    location: 'Bright Smile Dental Studio',
    text: 'Fantastic experience from start to finish. The crew showed up on time, walked me through the design plan, and finished the full backyard renovation two days ahead of schedule. Our lawn has never looked better and the drip irrigation they installed has already cut our water bill.',
    reply: {
      channel: 'Birdeye',
      agentName: 'Review response agent',
      postedAt: 'Jul 21, 2026 04:12 PM (PKT)',
      text: "Thank you so much, Marcus! We're thrilled the renovation exceeded your expectations. Enjoy the new backyard, and don't hesitate to reach out if you ever need anything.",
    },
  },
  {
    id: 'r4',
    reviewerName: 'Alina Torres',
    rating: 4,
    date: 'Jul 20, 2026',
    reviewId: '1730398',
    location: 'Sunrise Family Medicine',
    text: 'Good service overall. The team was professional and the pricing was fair. Only reason for four stars instead of five is that communication before the appointment could have been better — I had to call twice to confirm the time.',
  },
  {
    id: 'r5',
    reviewerName: 'Denise M.',
    rating: 5,
    date: 'Jul 19, 2026',
    reviewId: '1730381',
    location: 'Cut n Looks Unisex Salon',
    text: 'Always a great experience. The stylists listen carefully and the salon feels clean and welcoming every visit.',
  },
  {
    id: 'r6',
    reviewerName: 'Jordan Lee',
    rating: 3,
    date: 'Jul 18, 2026',
    reviewId: '1730364',
    location: 'Lush Landscaping Corporate',
    text: 'The work looks fine, but the crew left a mess in the driveway and never followed up after I called about it.',
  },
  {
    id: 'r7',
    reviewerName: 'Priya Shah',
    rating: 1,
    date: 'Jul 17, 2026',
    reviewId: '1730349',
    location: 'Bright Smile Dental Studio',
    text: 'Waited over an hour past my appointment time with no update. Very frustrating.',
  },
]
