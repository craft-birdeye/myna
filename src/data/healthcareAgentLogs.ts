import type { Metric } from '../components/MetricTiles/MetricTiles.types'

export type LogStatus = 'Complete' | 'Completed' | 'Failed' | 'In progress' | 'Resolved' | 'Not resolved' | 'Aborted'

export type LogStepId = 'trigger' | 'procedures'

export interface HealthcareLogRow {
  timestamp: string
  status: LogStatus
  contact: string
  channel: string
  duration: string
  topic: string
  /** Workflow steps executed during this run — shown with a green border on the log canvas */
  implementedSteps?: LogStepId[]
  /** Explicit canvas node ids to highlight; when set, overrides branch-path inference. */
  executedNodeIds?: string[]
  /** Review-response rows only: star rating and reviewer comment on the underlying review. */
  rating?: number
  comment?: string
  [key: string]: string | number | string[] | LogStepId[] | undefined
}

export const HEALTHCARE_LOGS_METRICS: Metric[] = [
  { id: 'total', value: '12', label: 'Total conversation', info: true, tooltip: 'Total number of conversations handled by the agent in the selected period.' },
  { id: 'resolved', value: '8', label: 'Resolved', info: true, tooltip: 'Conversations that were fully resolved by the agent without human escalation.' },
  { id: 'transferred', value: '3', label: 'Transferred', info: true, tooltip: 'Conversations handed off to a human agent for further assistance.' },
  { id: 'abandoned', value: '1', label: 'Abandoned', info: true, tooltip: 'Conversations where the customer disconnected before resolution.' },
]

export type PrevisitLogStatus = 'Complete' | 'Failed' | 'In progress'

export interface PrevisitLogRow {
  timestamp: string
  status: PrevisitLogStatus
  contact: string
  channel: string
  duration: string
  topic: string
  [key: string]: string
}

export const PREVISIT_LOGS_METRICS: Metric[] = [
  { id: 'total',      value: '15',  label: 'Total outreach',     info: true },
  { id: 'complete',   value: '10',  label: 'Complete',           info: true },
  { id: 'failed',     value: '3',   label: 'Failed',             info: true },
  { id: 'inprogress', value: '2',   label: 'In progress',        info: true },
]

export const PREVISIT_LOGS_ROWS: PrevisitLogRow[] = [
  {
    timestamp: 'Feb 25, 2024, 5:30 pm',
    status: 'Complete',
    contact: 'Dana Whitfield',
    channel: 'Voice',
    duration: '2min 30sec',
    topic: 'Pre-visit form outreach',
  },
  {
    timestamp: 'Feb 09, 2024, 5:30 pm',
    status: 'Complete',
    contact: 'Robert Cho',
    channel: 'Voice',
    duration: '2min',
    topic: 'Pre-visit form outreach',
  },
  {
    timestamp: 'Feb 05, 2024, 5:30 pm',
    status: 'Complete',
    contact: '+1 (628) 555-0110',
    channel: 'Chat',
    duration: '1min',
    topic: 'Pre-visit form outreach',
  },
  {
    timestamp: 'Jan 25, 2024, 5:30 pm',
    status: 'Failed',
    contact: '+1 (310) 555-0190',
    channel: 'Chat',
    duration: '1min',
    topic: 'Pre-visit form outreach',
  },
  {
    timestamp: 'Jan 18, 2024, 5:30 pm',
    status: 'In progress',
    contact: 'Elena Sokolova',
    channel: 'Voice',
    duration: '30sec',
    topic: 'Pre-visit form outreach',
  },
]

export const HEALTHCARE_LOGS_ROWS: HealthcareLogRow[] = [
  {
    timestamp: 'Feb 25, 2024, 5:30 pm',
    status: 'Complete',
    contact: 'Dana Whitfield',
    channel: 'Voice call',
    duration: '0:53',
    topic: 'Appointment booked',
    implementedSteps: ['trigger', 'procedures'],
  },
  {
    timestamp: 'Feb 09, 2024, 11:12 am',
    status: 'Complete',
    contact: 'Robert Cho',
    channel: 'Voice call',
    duration: '1:36',
    topic: 'Appointment cancelled',
    implementedSteps: ['trigger', 'procedures'],
  },
  {
    timestamp: 'Feb 05, 2024, 2:47 pm',
    status: 'Complete',
    contact: '+1 (628) 555-0110',
    channel: 'Web chat',
    duration: '1:11',
    topic: 'Appointment booked',
    implementedSteps: ['trigger', 'procedures'],
  },
  {
    timestamp: 'Jan 25, 2024, 9:05 am',
    status: 'Failed',
    contact: '+1 (310) 555-0190',
    channel: 'Web chat',
    duration: '1:04',
    topic: 'Appointment cancelled',
    implementedSteps: ['trigger'],
  },
  {
    timestamp: 'Jan 18, 2024, 4:18 pm',
    status: 'In progress',
    contact: 'Elena Sokolova',
    channel: 'Voice call',
    duration: '0:18',
    topic: 'Insurance inquiry',
    implementedSteps: ['trigger'],
  },
]

export const REMINDER_LOGS_ROWS: HealthcareLogRow[] = [
  {
    timestamp: 'Feb 25, 2024, 5:30 pm',
    status: 'Complete',
    contact: 'Dana Whitfield',
    channel: 'Voice call',
    duration: '5:32',
    topic: 'Appointment reminder confirmed',
    implementedSteps: ['trigger', 'procedures'],
  },
  {
    timestamp: 'Feb 09, 2024, 5:30 pm',
    status: 'Complete',
    contact: 'Robert Cho',
    channel: 'Voice call',
    duration: '4:48',
    topic: 'Appointment reminder confirmed',
    implementedSteps: ['trigger', 'procedures'],
  },
  {
    timestamp: 'Feb 05, 2024, 5:30 pm',
    status: 'Failed',
    contact: '+1 (628) 555-0110',
    channel: 'Web chat, Voice call',
    duration: '1:20',
    topic: 'Appointment reminder',
    implementedSteps: ['trigger'],
  },
  {
    timestamp: 'Jan 25, 2024, 5:30 pm',
    status: 'Failed',
    contact: '+1 (310) 555-0190',
    channel: 'Web chat',
    duration: '0:45',
    topic: 'Appointment reminder',
    implementedSteps: ['trigger'],
  },
  {
    timestamp: 'Jan 18, 2024, 5:30 pm',
    status: 'In progress',
    contact: 'Elena Sokolova',
    channel: 'Voice call',
    duration: '2:10',
    topic: 'Appointment reminder',
    implementedSteps: ['trigger'],
  },
]

export interface ReviewResponseLogRow {
  timestamp: string
  status: LogStatus
  contact: string
  source: string
  duration?: string
  /** Star rating on the underlying review; absent for rows with no rating (e.g. direct feedback). */
  rating?: number
  comment?: string
  implementedSteps?: LogStepId[]
  executedNodeIds?: string[]
  [key: string]: string | number | string[] | LogStepId[] | undefined
}

export const REVIEW_RESPONSE_LOGS_ROWS: ReviewResponseLogRow[] = [
  {
    timestamp: 'Feb 25, 2024, 5:30 pm',
    status: 'Completed',
    contact: 'Sarah Chen',
    source: 'Birdeye',
    duration: '0:24',
    rating: 2,
    comment:
      'Very disappointed with the service. The wait time was longer than expected and staff seemed rushed when I asked about my appointment.',
    implementedSteps: ['trigger', 'procedures'],
  },
  {
    timestamp: 'Feb 22, 2024, 3:47 pm',
    status: 'Completed',
    contact: 'Marcus Webb',
    source: 'Google',
    duration: '0:09',
    rating: 5,
    comment:
      'Dr. Patel explained everything clearly and the front desk got me checked in quickly. Best visit I have had in years.',
    implementedSteps: ['trigger', 'procedures'],
  },
  {
    timestamp: 'Feb 19, 2024, 3:41 pm',
    status: 'Failed',
    contact: 'Marcus Webb',
    source: 'Google',
    duration: '0:04',
    rating: 5,
    comment:
      'Dr. Patel explained everything clearly and the front desk got me checked in quickly. Best visit I have had in years.',
    implementedSteps: ['trigger'],
  },
  {
    timestamp: 'Feb 15, 2024, 11:02 am',
    status: 'Completed',
    contact: 'Priya Anand',
    source: 'Direct Feedback',
    duration: '0:15',
    comment:
      'Thanks for following up on my billing question — the explanation was clear and I got it sorted the same day.',
    implementedSteps: ['trigger', 'procedures'],
  },
  {
    timestamp: 'Feb 12, 2024, 3:36 pm',
    status: 'Aborted',
    contact: 'Marcus Webb',
    source: 'Google',
    duration: '0:09',
    rating: 5,
    comment:
      'Dr. Patel explained everything clearly and the front desk got me checked in quickly. Best visit I have had in years.',
    implementedSteps: ['trigger'],
  },
  {
    timestamp: 'Feb 09, 2024, 5:30 pm',
    status: 'Completed',
    contact: 'Elena Vasquez',
    source: 'Yelp',
    duration: '0:25',
    rating: 5,
    comment:
      'Scheduling was easy online and the hygienist was gentle and thorough. Will definitely recommend to friends.',
    implementedSteps: ['trigger', 'procedures'],
  },
  {
    timestamp: 'Feb 05, 2024, 2:47 pm',
    status: 'Completed',
    contact: '—',
    source: '—',
    duration: '0:12',
    comment: 'Appreciated the callback about my test results — saved me a trip to the office.',
    implementedSteps: ['trigger', 'procedures'],
  },
  {
    timestamp: 'Jan 25, 2024, 9:05 am',
    status: 'Completed',
    contact: 'David Kim',
    source: 'Birdeye',
    duration: '0:27',
    rating: 5,
    comment:
      'Smooth check-in, on-time appointment, and the team answered all my insurance questions without making me wait.',
    implementedSteps: ['trigger', 'procedures'],
  },
]

/** Maps a review-response log row into the shared HealthcareLogRow shape used by RunDetailView. */
export function toHealthcareLogRow(row: ReviewResponseLogRow): HealthcareLogRow {
  return {
    timestamp: row.timestamp,
    status: row.status,
    contact: row.contact,
    channel: row.source,
    duration: row.duration ?? '—',
    topic: 'Review response',
    implementedSteps: row.implementedSteps,
    executedNodeIds: row.executedNodeIds,
    source: row.source,
    rating: row.rating,
    comment: row.comment,
  }
}

export const REVIEW_GENERATION_LOGS_ROWS: ReviewResponseLogRow[] = [
  {
    timestamp: 'Feb 25, 2024, 5:30 pm',
    status: 'Complete',
    contact: 'Dana Whitfield',
    source: 'Email, Text',
    implementedSteps: ['trigger', 'procedures'],
    executedNodeIds: ['rg-1', 'rg-2', 'rg-3'],
  },
  {
    timestamp: 'Feb 09, 2024, 5:30 pm',
    status: 'Complete',
    contact: 'Robert Cho',
    source: 'Email, Text',
    implementedSteps: ['trigger', 'procedures'],
    executedNodeIds: ['rg-1', 'rg-2', 'rg-3'],
  },
  {
    timestamp: 'Feb 05, 2024, 5:30 pm',
    status: 'Failed',
    contact: 'Maria Santos',
    source: 'Email',
    implementedSteps: ['trigger'],
    executedNodeIds: ['rg-1', 'rg-2'],
  },
  {
    timestamp: 'Jan 25, 2024, 5:30 pm',
    status: 'Failed',
    contact: 'James Okonkwo',
    source: 'Email, Text',
    implementedSteps: ['trigger'],
    executedNodeIds: ['rg-1', 'rg-2', 'rg-3'],
  },
  {
    timestamp: 'Jan 18, 2024, 5:30 pm',
    status: 'In progress',
    contact: 'Elena Sokolova',
    source: 'Email',
    implementedSteps: ['trigger'],
    executedNodeIds: ['rg-1', 'rg-2'],
  },
]

/** Maps a review-generation log row into the shared HealthcareLogRow shape used by RunDetailView. */
export function toReviewGenerationLogRow(row: ReviewResponseLogRow): HealthcareLogRow {
  return {
    timestamp: row.timestamp,
    status: row.status,
    contact: row.contact,
    channel: row.source,
    duration: '—',
    topic: 'Review request',
    implementedSteps: row.implementedSteps,
    executedNodeIds: row.executedNodeIds,
    source: row.source,
  }
}
