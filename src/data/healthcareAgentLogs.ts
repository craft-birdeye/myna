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
  [key: string]: string | LogStepId[] | undefined
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
    duration: '0:53',
    topic: 'Appointment reminder',
    implementedSteps: ['trigger', 'procedures'],
  },
  {
    timestamp: 'Feb 09, 2024, 5:30 pm',
    status: 'Complete',
    contact: 'Robert Cho',
    channel: 'Voice call',
    duration: '1:36',
    topic: 'Appointment reminder',
    implementedSteps: ['trigger', 'procedures'],
  },
  {
    timestamp: 'Feb 05, 2024, 5:30 pm',
    status: 'Failed',
    contact: '+1 (628) 555-0110',
    channel: 'Web chat, Voice call',
    duration: '1:11',
    topic: 'Appointment reminder',
    implementedSteps: ['trigger'],
  },
  {
    timestamp: 'Jan 25, 2024, 5:30 pm',
    status: 'Failed',
    contact: '+1 (310) 555-0190',
    channel: 'Web chat',
    duration: '1:04',
    topic: 'Appointment reminder',
    implementedSteps: ['trigger'],
  },
  {
    timestamp: 'Jan 18, 2024, 5:30 pm',
    status: 'In progress',
    contact: 'Elena Sokolova',
    channel: 'Voice call',
    duration: '0:18',
    topic: 'Appointment reminder',
    implementedSteps: ['trigger'],
  },
]
