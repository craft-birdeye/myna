import type { Metric } from '../components/MetricTiles/MetricTiles.types'

export type LogStatus = 'Complete' | 'Failed' | 'In progress'

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
  [key: string]: string | string[] | LogStepId[] | undefined
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
    topic: 'Tooth pain screening',
    implementedSteps: ['trigger', 'procedures'],
  },
  {
    timestamp: 'Feb 09, 2024, 11:12 am',
    status: 'Complete',
    contact: 'Robert Cho',
    channel: 'Voice call',
    duration: '1:36',
    topic: 'New patient scheduling',
    implementedSteps: ['trigger', 'procedures'],
  },
  {
    timestamp: 'Feb 05, 2024, 2:47 pm',
    status: 'Complete',
    contact: '+1 (628) 555-0110',
    channel: 'Web chat',
    duration: '1:11',
    topic: 'Appointment reschedule',
    implementedSteps: ['trigger', 'procedures'],
  },
  {
    timestamp: 'Jan 25, 2024, 9:05 am',
    status: 'Failed',
    contact: '+1 (310) 555-0190',
    channel: 'Web chat',
    duration: '1:04',
    topic: 'Emergency dental concern',
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
  implementedSteps?: LogStepId[]
  executedNodeIds?: string[]
  [key: string]: string | string[] | LogStepId[] | undefined
}

export const REVIEW_RESPONSE_LOGS_ROWS: ReviewResponseLogRow[] = [
  {
    timestamp: 'Feb 25, 2024, 5:30 pm',
    status: 'Complete',
    contact: 'Dana Whitfield',
    source: 'Google',
    implementedSteps: ['trigger', 'procedures'],
  },
  {
    timestamp: 'Feb 09, 2024, 5:30 pm',
    status: 'Complete',
    contact: 'Robert Cho',
    source: 'Yelp',
    implementedSteps: ['trigger', 'procedures'],
  },
  {
    timestamp: 'Feb 05, 2024, 5:30 pm',
    status: 'Failed',
    contact: '+1 (628) 555-0110',
    source: 'Facebook',
    implementedSteps: ['trigger'],
  },
  {
    timestamp: 'Jan 25, 2024, 5:30 pm',
    status: 'Failed',
    contact: '+1 (310) 555-0190',
    source: 'Google',
    implementedSteps: ['trigger'],
  },
  {
    timestamp: 'Jan 18, 2024, 5:30 pm',
    status: 'In progress',
    contact: 'Elena Sokolova',
    source: 'Birdeye',
    implementedSteps: ['trigger'],
  },
]

/** Maps a review-response log row into the shared HealthcareLogRow shape used by RunDetailView. */
export function toHealthcareLogRow(row: ReviewResponseLogRow): HealthcareLogRow {
  return {
    timestamp: row.timestamp,
    status: row.status,
    contact: row.contact,
    channel: row.source,
    duration: '—',
    topic: 'Review response',
    implementedSteps: row.implementedSteps,
    executedNodeIds: row.executedNodeIds,
    source: row.source,
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

// ─── Query fanout agent (Search AI) — a run per submitted prompt, no conversation/contact. ────

export interface FanoutLogRow {
  timestamp: string
  status: LogStatus
  prompt: string
  fanoutQueries: string[]
  executedNodeIds?: string[]
  [key: string]: string | string[] | undefined
}

export const FANOUT_LOGS_ROWS: FanoutLogRow[] = [
  {
    timestamp: 'Aug 12, 2026, 9:14 am',
    status: 'Complete',
    prompt: 'How much do dental implants cost in Austin?',
    fanoutQueries: [
      'dental implant financing Austin TX',
      'average cost of single tooth implant',
      'dental implants near me price comparison',
      'does insurance cover dental implants',
      'full mouth dental implants cost',
      'cheapest dental implants Austin',
      'dental implant payment plans',
      'same day dental implants cost',
    ],
    executedNodeIds: ['qf-1', 'qf-2', 'qf-3', 'qf-4', 'qf-5'],
  },
  {
    timestamp: 'Aug 10, 2026, 2:05 pm',
    status: 'Complete',
    prompt: 'What are my orthodontic treatment options?',
    fanoutQueries: [
      'Invisalign vs traditional braces cost',
      'clear aligners vs metal braces',
      'how long does Invisalign take',
      'best orthodontist for adults',
      'ceramic braces pros and cons',
      'orthodontic treatment for overbite',
    ],
    executedNodeIds: ['qf-1', 'qf-2', 'qf-3', 'qf-4', 'qf-5'],
  },
  {
    timestamp: 'Aug 8, 2026, 11:40 am',
    status: 'In progress',
    prompt: 'Is teeth whitening safe for sensitive teeth?',
    fanoutQueries: [],
    executedNodeIds: ['qf-1', 'qf-2'],
  },
  {
    timestamp: 'Aug 5, 2026, 4:22 pm',
    status: 'Failed',
    prompt: 'What should I expect during a root canal procedure?',
    fanoutQueries: [],
    executedNodeIds: ['qf-1', 'qf-2', 'qf-3'],
  },
  {
    timestamp: 'Aug 1, 2026, 8:03 am',
    status: 'Complete',
    prompt: 'How do I choose the best dentist for my family?',
    fanoutQueries: Array.from({ length: 32 }, (_, i) => `family dentist evaluation criteria #${i + 1}`),
    executedNodeIds: ['qf-1', 'qf-2', 'qf-3', 'qf-4', 'qf-5'],
  },
]

/** Maps a Query fanout run into the shared HealthcareLogRow shape used by RunDetailView. */
export function toFanoutLogRow(row: FanoutLogRow): HealthcareLogRow {
  return {
    timestamp: row.timestamp,
    status: row.status,
    contact: row.prompt,
    channel: 'On-demand',
    duration: '—',
    topic: 'Query fanout run',
    executedNodeIds: row.executedNodeIds,
    fanoutQueries: row.fanoutQueries,
  }
}

// ─── Domain health agent (Search AI) — a run per monitored domain, no conversation/contact. ───

export interface DomainHealthLogRow {
  timestamp: string
  status: LogStatus
  domain: string
  issuesDetected: string
  executedNodeIds?: string[]
  [key: string]: string | string[] | undefined
}

export const DOMAIN_HEALTH_LOGS_ROWS: DomainHealthLogRow[] = [
  {
    timestamp: 'Aug 27, 2026, 2:00 am',
    status: 'Complete',
    domain: 'astondental.com',
    issuesDetected: '4',
    executedNodeIds: ['dh-1', 'dh-2', 'dh-3', 'dh-4', 'dh-5', 'dh-5-path-1', 'dh-6', 'dh-7', 'dh-8'],
  },
  {
    timestamp: 'Aug 26, 2026, 2:00 am',
    status: 'Complete',
    domain: 'westsidefamilydental.com',
    issuesDetected: '2',
    executedNodeIds: ['dh-1', 'dh-2', 'dh-3', 'dh-4', 'dh-5', 'dh-5-path-1', 'dh-6', 'dh-7', 'dh-8'],
  },
  {
    timestamp: 'Aug 25, 2026, 2:00 am',
    status: 'In progress',
    domain: 'brightsmilesclinic.com',
    issuesDetected: '—',
    executedNodeIds: ['dh-1', 'dh-2', 'dh-3', 'dh-4'],
  },
  {
    timestamp: 'Aug 24, 2026, 2:00 am',
    status: 'Failed',
    domain: 'oakstreetdental.com',
    issuesDetected: '—',
    executedNodeIds: ['dh-1', 'dh-2', 'dh-3', 'dh-4', 'dh-5', 'dh-5-path-2'],
  },
  {
    timestamp: 'Aug 23, 2026, 2:00 am',
    status: 'Complete',
    domain: 'lakeviewortho.com',
    issuesDetected: '7',
    executedNodeIds: ['dh-1', 'dh-2', 'dh-3', 'dh-4', 'dh-5', 'dh-5-path-1', 'dh-6', 'dh-7', 'dh-8'],
  },
]

/** Maps a Domain health run into the shared HealthcareLogRow shape used by RunDetailView. */
export function toDomainHealthLogRow(row: DomainHealthLogRow): HealthcareLogRow {
  return {
    timestamp: row.timestamp,
    status: row.status,
    contact: row.domain,
    channel: 'Scheduled',
    duration: '—',
    topic: 'Domain health check',
    executedNodeIds: row.executedNodeIds,
    issuesDetected: row.issuesDetected,
  }
}
