export interface V2Stat {
  id: string
  value: string
  label: string
}

export interface V2Agent {
  id: string
  name: string
  stats: V2Stat[]
}

export interface V2Section {
  id: string
  label: string
  icon: string
  /** Top-level widget stats shown right under the section heading. */
  stats?: V2Stat[]
  agents: V2Agent[]
  actionNeeded?: V2Stat[]
}

export interface V2FrontDeskSubArea {
  id: string
  label: string
  agentName: string
  businessMetrics: V2Stat[]
  agentOutcomes: V2Stat[]
  humanActions: V2Stat[]
}

export const OVERVIEW_V2_FRONTDESK_SUBAREAS: V2FrontDeskSubArea[] = [
  {
    id: 'conversations',
    label: 'Conversations',
    agentName: 'Front desk agent',
    businessMetrics: [
      { id: 'ai-handled-share', value: '72%', label: 'AI-handled share' },
      { id: 'insurance-verification-rate', value: '94.2%', label: 'Insurance verification rate' },
    ],
    agentOutcomes: [
      { id: 'conversations-resolved', value: '16.2K', label: 'Conversations resolved' },
      { id: 'resolution-rate', value: '88%', label: 'Resolution rate' },
      { id: 'time-saved', value: '40h', label: 'Time saved' },
      { id: 'cost-saved', value: '$2.8K', label: 'Cost saved' },
    ],
    humanActions: [{ id: 'open-recommendations', value: '14', label: 'Open recommendations' }],
  },
  {
    id: 'appointments',
    label: 'Appointments',
    agentName: 'Reminder agent',
    businessMetrics: [
      { id: 'total-bookings', value: '1.5K', label: 'Total bookings' },
      { id: 'rescheduled', value: '450', label: 'Rescheduled' },
      { id: 'cancelled', value: '25', label: 'Cancelled' },
    ],
    agentOutcomes: [
      { id: 'appointments-confirmed', value: '100', label: 'Appointments confirmed' },
      { id: 'confirmation-rate', value: '23.7%', label: 'Confirmation rate' },
      { id: 'cost-saved', value: '$0.9K', label: 'Cost saved' },
    ],
    humanActions: [
      { id: 'unconfirmed', value: '5', label: 'Unconfirmed appointments' },
      { id: 'no-shows', value: '4', label: 'No-shows' },
    ],
  },
  {
    id: 'waitlist',
    label: 'Waitlist',
    agentName: 'Waitlist agent',
    businessMetrics: [
      { id: 'slots-filled', value: '7.9K', label: 'Slots filled' },
      { id: 'avg-fill-time', value: '2.5h', label: 'Average fill time' },
    ],
    agentOutcomes: [
      { id: 'fill-rate', value: '23.7%', label: 'Fill rate' },
      { id: 'outreach-sent', value: '5.5K', label: 'Outreach sent' },
      { id: 'cost-saved', value: '$0.2K', label: 'Cost saved' },
    ],
    humanActions: [{ id: 'waitlisted', value: '13', label: 'Waitlisted patients (5 high priority)' }],
  },
  {
    id: 'intake',
    label: 'Intake',
    agentName: 'Pre-visit agent',
    businessMetrics: [
      { id: 'intakes-completed-3mo', value: '750', label: 'Intakes completed (3-mo)' },
      { id: 'avg-completion-time', value: '8.5min', label: 'Average completion time' },
    ],
    agentOutcomes: [
      { id: 'intakes-completed', value: '2.7K', label: 'Intakes completed' },
      { id: 'completion-rate', value: '90%', label: 'Completion rate' },
      { id: 'cost-saved', value: '$0.1K', label: 'Cost saved' },
    ],
    humanActions: [{ id: 'overdue-intakes', value: '11', label: 'Overdue intakes' }],
  },
]

export const OVERVIEW_V2_SECTIONS: V2Section[] = [
  {
    id: 'listings',
    label: 'Listings',
    icon: 'place',
    stats: [
      { id: 'listings', value: '119', label: 'Listings' },
      { id: 'synced', value: '7', label: 'Synced' },
      { id: 'not-synced', value: '42', label: 'Not synced' },
      { id: 'submitted', value: '4', label: 'Submitted' },
      { id: 'not-connected', value: '10', label: 'Not connected' },
      { id: 'opted-out', value: '56', label: 'Opted out' },
      { id: 'profile-completeness', value: '53%', label: 'Profile completeness' },
    ],
    agents: [
      {
        id: 'listing-optimizer',
        name: 'Listing optimizer agent',
        stats: [
          { id: 'recs-generated', value: '9', label: 'Recommendations generated' },
          { id: 'recs-accepted', value: '7', label: 'Recommendations accepted' },
          { id: 'fields-updated', value: '42', label: 'Profile fields updated' },
          { id: 'time-saved', value: '4h', label: 'Time saved' },
        ],
      },
    ],
    actionNeeded: [{ id: 'awaiting-review', value: '4', label: 'Recommendations awaiting review' }],
  },
  {
    id: 'search-ai',
    label: 'Search AI',
    icon: 'travel_explore',
    stats: [
      { id: 'search-ai-score', value: '33.6%', label: 'Search AI score' },
      { id: 'citation-share', value: '17.6%', label: 'Citation share' },
      { id: 'visibility-score', value: '60.2%', label: 'Visibility score' },
      { id: 'average-rank', value: '4', label: 'Average rank' },
    ],
    agents: [
      {
        id: 'recommendations-agent',
        name: 'Recommendations agent',
        stats: [
          { id: 'recs-generated', value: '18', label: 'Recommendations generated' },
          { id: 'recs-accepted', value: '7', label: 'Recommendations accepted' },
          { id: 'recs-completed', value: '2', label: 'Recommendations completed' },
          { id: 'time-saved', value: '4h', label: 'Time saved' },
        ],
      },
    ],
    actionNeeded: [{ id: 'pending-review', value: '6', label: 'Recommendations pending review' }],
  },
  {
    id: 'reviews',
    label: 'Reviews',
    icon: 'star',
    stats: [
      { id: 'requests-sent', value: '1.9K', label: 'Request sent' },
      { id: 'reviews-received', value: '7', label: 'Reviews received' },
      { id: '3-star-or-less', value: '2', label: '3 star or less' },
    ],
    agents: [
      {
        id: 'review-marketing',
        name: 'Review marketing agent',
        stats: [
          { id: 'review-shared', value: '18', label: 'Review shared' },
          { id: 'time-saved', value: '7h', label: 'Time saved' },
        ],
      },
      {
        id: 'review-tagging',
        name: 'Review tagging agent',
        stats: [
          { id: 'review-tagged', value: '18', label: 'Review tagged' },
          { id: 'tagging-rate', value: '7', label: 'Tagging rate' },
        ],
      },
      {
        id: 'review-generation',
        name: 'Review generation agent',
        stats: [
          { id: 'review-tagged', value: '18', label: 'Review tagged' },
          { id: 'contacts-reached', value: '7', label: 'Contacts reached' },
          { id: 'click-through-rate', value: '7', label: 'Click through rate' },
        ],
      },
      {
        id: 'review-response',
        name: 'Review response agent',
        stats: [
          { id: 'review-responded', value: '18', label: 'Review responded' },
          { id: 'response-rate', value: '7', label: 'Response rate' },
          { id: 'time-saved', value: '7', label: 'Time saved' },
        ],
      },
    ],
    actionNeeded: [{ id: 'replies-awaiting-approval', value: '4', label: 'Replies awaiting approval' }],
  },
  {
    id: 'social',
    label: 'Social',
    icon: 'workspaces',
    stats: [{ id: 'new-follower', value: '188', label: 'New follower' }],
    agents: [
      {
        id: 'social-publishing',
        name: 'Social publishing agent',
        stats: [
          { id: 'post-generated', value: '18', label: 'Post generated' },
          { id: 'post-published', value: '18', label: 'Post published' },
          { id: 'calendar-coverage', value: '63%', label: 'Calendar coverage' },
          { id: 'time-saved', value: '7h', label: 'Time saved' },
        ],
      },
      {
        id: 'social-engagement',
        name: 'Social engagement agent',
        stats: [
          { id: 'messages-auto-handled', value: '18', label: 'Messages auto-handled' },
          { id: 'reply-time', value: '7', label: 'Reply time' },
        ],
      },
    ],
    actionNeeded: [
      { id: 'post-awaiting-approval', value: '18', label: 'Post awaiting approval' },
      { id: 'failed-posts', value: '7', label: 'Failed posts' },
      { id: 'rejected-posts', value: '7', label: 'Rejected posts' },
    ],
  },
  {
    id: 'content-hub',
    label: 'Content hub',
    icon: 'description',
    agents: [
      {
        id: 'faq-agent',
        name: 'FAQ agent',
        stats: [
          { id: 'faq-generated', value: '18', label: 'FAQ generated' },
          { id: 'time-saved', value: '7h', label: 'Time saved' },
        ],
      },
      {
        id: 'blog-agent',
        name: 'Blog agent',
        stats: [
          { id: 'blogs-created', value: '18', label: 'Blogs created' },
          { id: 'time-saved', value: '7', label: 'Time saved' },
        ],
      },
    ],
  },
  {
    id: 'surveys',
    label: 'Surveys',
    icon: 'assignment_turned_in',
    agents: [
      {
        id: 'survey-distribution',
        name: 'Survey distribution agent',
        stats: [
          { id: 'responses-received', value: '18', label: 'Responses received' },
          { id: 'unique-contacts-reached', value: '7h', label: 'Unique contacts reached' },
        ],
      },
      {
        id: 'survey-response',
        name: 'Survey response agent',
        stats: [
          { id: 'surveys-responded', value: '18', label: 'Surveys responded' },
          { id: 'response-rate', value: '7', label: 'Response rate' },
          { id: 'time-saved', value: '7', label: 'Time saved' },
        ],
      },
    ],
    actionNeeded: [{ id: 'survey-approval-pending', value: '18', label: 'Survey approval pending' }],
  },
  {
    id: 'ticketing',
    label: 'Ticketing',
    icon: 'confirmation_number',
    stats: [
      { id: 'avg-resolution-time', value: '6h', label: 'Average resolution time' },
      { id: 'new-tickets', value: '9', label: 'New' },
      { id: 'assigned-tickets', value: '14', label: 'Assigned' },
      { id: 'in-progress-tickets', value: '6', label: 'In progress' },
    ],
    agents: [
      {
        id: 'ticketing-surveys',
        name: 'Ticketing agent · Surveys',
        stats: [
          { id: 'tickets-created', value: '212', label: 'Tickets created' },
          { id: 'tickets-escalated', value: '5', label: 'Tickets escalated' },
        ],
      },
      {
        id: 'ticketing-reviews',
        name: 'Ticketing agent · Reviews',
        stats: [
          { id: 'tickets-created', value: '158', label: 'Tickets created' },
          { id: 'tickets-escalated', value: '4', label: 'Tickets escalated' },
        ],
      },
    ],
    actionNeeded: [{ id: 'assigned-to-me', value: '11', label: 'Tickets assigned to me' }],
  },
]
