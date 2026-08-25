import React, { useEffect, useRef, useState } from 'react'
import {
  ChartCard,
  ChartStatRow,
  DataTable,
  DateRangeSelector,
  DonutChart,
  EstimateSavingsModal,
  FilterPanel,
  Icon,
  InfoTooltip,
  NOUN_FORMS,
  ReportHeader,
  SankeyChart,
  SelectMenu,
  StackedBarChart,
  SummaryStats,
  TopNav,
  TrendLineChart,
  ViewModeToggle,
  scaleForViewMode,
  type Column,
  type EstimateSavingsValues,
  type FilterField,
  type NounForms,
  type SankeyLink,
  type SankeyNode,
  type ViewMode,
} from '../components'

// Funnel outcome volumes (Jul anchor, 1,000 total) — shared by trend + location tables.
const FUNNEL_OUTCOME_VOLUMES = {
  scheduled: 145,
  rescheduled: 85,
  cancelled: 40,
  informationProvided: 400,
  humanTransfer: 100,
  actionPending: 190,
  incompleteInteraction: 20,
  other: 20,
} as const
const RESOLVED_OUTCOME_KEYS = ['scheduled', 'rescheduled', 'cancelled', 'informationProvided'] as const
const NOT_RESOLVED_OUTCOME_KEYS = ['humanTransfer', 'actionPending', 'incompleteInteraction', 'other'] as const
const RESOLVED_OUTCOME_TOTAL = RESOLVED_OUTCOME_KEYS.reduce((s, k) => s + FUNNEL_OUTCOME_VOLUMES[k], 0)
const NOT_RESOLVED_OUTCOME_TOTAL = NOT_RESOLVED_OUTCOME_KEYS.reduce((s, k) => s + FUNNEL_OUTCOME_VOLUMES[k], 0)

const FUNNEL_SUBOUTCOME_VOLUMES = {
  paymentBilling: 80,
  insuranceCoverage: 90,
  treatmentRelated: 100,
  referrals: 60,
  generalEnquiry: 70,
  callAttended: 65,
  callNotAttended: 35,
  followUp: 190,
  callDisconnected: 12,
  abandoned: 8,
  wrongNumbers: 8,
  salesCalls: 6,
  humanResources: 6,
} as const

// ─── Conversation data per funnel node ────────────────────────────────────────

interface FunnelConversation {
  id: string
  name: string
  verified?: boolean
  message: string
  location: string
  assignee?: string
  date: string
  unread?: boolean
}


const CONVERSATIONS_BY_NODE: Record<string, FunnelConversation[]> = {
  'Call': [
    { id: 'ch-call-1', name: 'Priya Anand',                  message: 'Called in asking about same-day availability for a sick visit.',     location: 'North Clinic',    assignee: 'Front desk AI', date: '09:05 AM', unread: true },
    { id: 'ch-call-2', name: 'Robert Hail',                   message: 'Phoned to ask if walk-ins are accepted on weekends.',                location: 'South Clinic',    assignee: 'Front desk AI', date: '08:40 AM' },
    { id: 'ch-call-3', name: 'Sofia Kim',   verified: true,   message: 'Called about a billing question — routed to a human agent.',         location: 'Downtown Clinic', assignee: 'Front desk AI', date: 'Jun 10, 2025' },
    { id: 'ch-call-4', name: 'Marcus Webb',                   message: 'Called to ask about parking near the North Clinic.',                 location: 'North Clinic',    assignee: 'Front desk AI', date: '09:20 AM' },
    { id: 'ch-call-5', name: 'Renee Ortiz', verified: true,   message: 'Phoned to confirm insurance is still on file.',                       location: 'Downtown Clinic', assignee: 'Front desk AI', date: 'Jun 8, 2025' },
    { id: 'ch-call-6', name: 'Devon Blake',                    message: 'Called about rescheduling a missed appointment.',                    location: 'South Clinic',    assignee: 'Front desk AI', date: 'Jun 7, 2025', unread: true },
  ],
  'Text': [
    { id: 'ch-text-1', name: 'Malik Johnson',                 message: 'Texted to confirm an appointment reminder.',                         location: 'North Clinic',    assignee: 'Front desk AI', date: '10:02 AM', unread: true },
    { id: 'ch-text-2', name: 'Diane Foster',                  message: 'Texted asking to move Friday visit up a day.',                       location: 'South Clinic',    assignee: 'Front desk AI', date: '09:20 AM' },
    { id: 'ch-text-3', name: 'Aaron Blake',                    message: 'Replied "Y" to confirm the upcoming appointment.',                   location: 'Downtown Clinic', assignee: 'Front desk AI', date: 'Jun 9, 2025' },
    { id: 'ch-text-4', name: 'Priya Anand',                    message: 'Texted to ask if the clinic is open on Saturday.',                   location: 'North Clinic',    assignee: 'Front desk AI', date: '10:15 AM' },
    { id: 'ch-text-5', name: 'Sofia Kim',   verified: true,   message: 'Texted a photo of her insurance card.',                               location: 'Downtown Clinic', assignee: 'Front desk AI', date: 'Jun 8, 2025' },
    { id: 'ch-text-6', name: 'Robert Hail',                    message: 'Texted to cancel his 3pm appointment.',                              location: 'South Clinic',    assignee: 'Front desk AI', date: 'Jun 7, 2025', unread: true },
  ],
  'Webchat': [
    { id: 'ch-email-1', name: 'Helen Cho',                    message: 'Messaged requesting a copy of the visit summary.',                    location: 'North Clinic',    assignee: 'Front desk AI', date: '11:00 AM', unread: true },
    { id: 'ch-email-2', name: 'Victor Reyes',                  message: 'Messaged about insurance documentation needed before the visit.',     location: 'South Clinic',    assignee: 'Front desk AI', date: 'Jun 10, 2025' },
    { id: 'ch-email-3', name: 'Lauren Diaz',                   message: 'Messaged to reschedule due to a work conflict.',                      location: 'Downtown Clinic', assignee: 'Front desk AI', date: 'Jun 8, 2025' },
    { id: 'ch-email-4', name: 'Grace Liu',                     message: 'Messaged to request records be sent to a specialist.',                location: 'North Clinic',    assignee: 'Front desk AI', date: 'Jun 9, 2025' },
    { id: 'ch-email-5', name: 'Tomás Rivera',                  message: 'Messaged asking about payment plan options.',                         location: 'South Clinic',    assignee: 'Front desk AI', date: 'Jun 7, 2025', unread: true },
  ],
  'AI agents involved': [
    { id: 'inv-myna-1', name: 'Grace Liu',                   message: 'AI confirmed appointment details and answered an insurance question.', location: 'North Clinic',    assignee: 'Front desk AI', date: '09:14 AM', unread: true },
    { id: 'inv-myna-2', name: 'Tomás Rivera',                  message: 'AI booked a new consult without any escalation.',                    location: 'South Clinic',    assignee: 'Front desk AI', date: '08:52 AM' },
    { id: 'inv-myna-3', name: 'Nina Patel',                    message: 'AI handled a reschedule request end-to-end.',                        location: 'Downtown Clinic', assignee: 'Front desk AI', date: 'Jun 10, 2025' },
    { id: 'inv-myna-4', name: 'Walter Boone',                  message: 'AI confirmed prescription refill was sent to the pharmacy.',         location: 'North Clinic',    assignee: 'Front desk AI', date: '09:40 AM' },
    { id: 'inv-myna-5', name: 'Camille Ortiz',                 message: 'AI answered a question about lab result turnaround time.',           location: 'South Clinic',    assignee: 'Front desk AI', date: 'Jun 10, 2025' },
    { id: 'inv-myna-6', name: 'Derek Chow', verified: true,   message: 'AI rebooked a missed appointment for the following week.',           location: 'Downtown Clinic', assignee: 'Front desk AI', date: 'Jun 9, 2025', unread: true },
  ],
  'Human involved': [
    { id: 'inv-human-1', name: 'Walter Boone',                message: 'Escalated — complex billing dispute needs manager review.',           location: 'North Clinic',    assignee: 'Kelsy Hiltz',  date: '10:15 AM', unread: true },
    { id: 'inv-human-2', name: 'Camille Ortiz',                message: 'Escalated — patient requested to speak with the office manager.',    location: 'South Clinic',    assignee: 'Marcus Webb',  date: '09:41 AM' },
    { id: 'inv-human-3', name: 'Derek Chow',                   message: 'Escalated — clinical question routed to the on-call nurse.',         location: 'Downtown Clinic', assignee: 'Ana Reyes',    date: 'Jun 9, 2025' },
    { id: 'inv-human-4', name: 'Isabel Marsh',                 message: 'Escalated — patient requested a same-day callback from the office manager.', location: 'North Clinic', assignee: 'Kelsy Hiltz', date: 'Jun 10, 2025' },
    { id: 'inv-human-5', name: 'Julian Cross',                 message: 'Escalated — insurance dispute needs a human review.',                location: 'South Clinic',    assignee: 'Marcus Webb',  date: 'Jun 8, 2025', unread: true },
  ],
  'Not answered': [
    { id: 'na-1', name: 'Isabel Marsh',                       message: 'Call went unanswered — voicemail left, no callback yet.',            location: 'North Clinic',    date: '09:58 AM', unread: true },
    { id: 'na-2', name: 'Julian Cross',                        message: 'Call disconnected before front desk picked up.',                    location: 'South Clinic',    date: 'Jun 9, 2025' },
    { id: 'na-3', name: 'Aditi Rao',                           message: 'Call dropped before it could be answered.',                          location: 'Downtown Clinic', date: 'Jun 7, 2025' },
  ],
  // Same underlying interactions as "Not answered" — this is where they land as a final outcome.
  'Missed': [
    { id: 'na-1', name: 'Isabel Marsh',                       message: 'Call went unanswered — voicemail left, no callback yet.',            location: 'North Clinic',    date: '09:58 AM', unread: true },
    { id: 'na-2', name: 'Julian Cross',                        message: 'Call disconnected before front desk picked up.',                    location: 'South Clinic',    date: 'Jun 9, 2025' },
    { id: 'na-3', name: 'Aditi Rao',                           message: 'Call dropped before it could be answered.',                          location: 'Downtown Clinic', date: 'Jun 7, 2025' },
  ],
  'Resolved': [
    { id: 'res-1', name: 'Aditi Rao',                          message: 'Appointment confirmed and all questions answered on the same call.', location: 'North Clinic',    assignee: 'Front desk AI', date: '09:10 AM', unread: true },
    { id: 'res-2', name: 'Brandon Lee',                        message: 'Billing question resolved directly by a human agent.',              location: 'South Clinic',    assignee: 'Kelsy Hiltz',  date: '08:44 AM' },
    { id: 'res-3', name: 'Fatima Noor',                        message: 'Prescription refill confirmed, no further action needed.',           location: 'Downtown Clinic', assignee: 'Front desk AI', date: 'Jun 10, 2025' },
    { id: 'res-4', name: 'Nathaniel Cole',                     message: 'Confirmed appointment details, no further action needed.',           location: 'North Clinic',    assignee: 'Front desk AI', date: '09:25 AM' },
    { id: 'res-5', name: 'Paloma Ruiz',                        message: 'Insurance question answered on the same call.',                      location: 'South Clinic',    assignee: 'Front desk AI', date: 'Jun 10, 2025' },
    { id: 'res-6', name: 'Elliot Gray', verified: true,       message: 'Prescription refill confirmed and resolved.',                        location: 'Downtown Clinic', assignee: 'Front desk AI', date: 'Jun 9, 2025', unread: true },
  ],
  'Transferred': [
    { id: 'trf-1', name: 'Nathaniel Cole',                     message: 'Transferred to the billing team for a disputed charge.',            location: 'North Clinic',    assignee: 'Marcus Webb',  date: '09:36 AM', unread: true },
    { id: 'trf-2', name: 'Paloma Ruiz',                        message: 'Transferred to clinical staff for a medication question.',           location: 'South Clinic',    assignee: 'Ana Reyes',    date: 'Jun 10, 2025' },
    { id: 'trf-3', name: 'Elliot Gray',                        message: 'Transferred to the scheduling supervisor for a multi-visit request.', location: 'Downtown Clinic', assignee: 'Kelsy Hiltz',  date: 'Jun 9, 2025' },
    { id: 'trf-4', name: 'Grace Liu',                          message: 'Transferred to a specialist\'s office for a referral question.',     location: 'North Clinic',    assignee: 'Ana Reyes',    date: 'Jun 8, 2025' },
    { id: 'trf-5', name: 'Tomás Rivera',                       message: 'Transferred to billing for a payment plan request.',                 location: 'South Clinic',    assignee: 'Marcus Webb',  date: 'Jun 7, 2025', unread: true },
  ],
  'Answered': [
    { id: 'ans1', name: 'Angela Martinez', verified: true, message: 'Called to confirm which insurance plans are accepted — confirmed Blue Cross in-network.', location: 'North Clinic',    assignee: 'Front desk AI', date: '09:12 AM', unread: true },
    { id: 'ans2', name: 'David Kim',                        message: 'Asked about post-op care instructions after knee surgery.',                          location: 'South Clinic',    assignee: 'Front desk AI', date: '08:47 AM', unread: true },
    { id: 'ans3', name: 'Renee Ortiz',    verified: true,   message: 'Confirmed pharmacy on file for prescription pickup.',                                 location: 'Downtown Clinic', assignee: 'Front desk AI', date: 'Jun 10, 2025' },
    { id: 'ans4', name: 'Marcus Webb',                       message: 'Asked about clinic hours for the holiday weekend.',                                   location: 'North Clinic',    assignee: 'Front desk AI', date: 'Jun 9, 2025' },
    { id: 'ans5', name: 'Walter Boone',                      message: 'Asked about accepted insurance plans for a new patient.',                            location: 'Downtown Clinic', assignee: 'Front desk AI', date: 'Jun 8, 2025' },
  ],
  'Pending': [
    { id: 'pen1', name: 'Sandra Lee',                        message: 'Awaiting callback from Dr. Patel regarding lab results.',                            location: 'Downtown Clinic', assignee: 'Front desk AI', date: '10:20 AM', unread: true },
    { id: 'pen2', name: 'Thomas Reyes',                      message: 'Requested a callback about referral status — pending review.',                       location: 'South Clinic',    assignee: 'Front desk AI', date: '09:55 AM' },
    { id: 'pen3', name: 'Priya Chandran', verified: true,    message: 'Insurance pre-authorization request submitted, pending approval.',                    location: 'North Clinic',    assignee: 'Front desk AI', date: 'Jun 10, 2025' },
    { id: 'pen4', name: 'Wesley Grant',                      message: 'Awaiting confirmation from specialist\'s office on availability.',                    location: 'Downtown Clinic', assignee: 'Front desk AI', date: 'Jun 9, 2025',  unread: true },
    { id: 'pen5', name: 'Camille Ortiz',                     message: 'Awaiting confirmation on a referral to a specialist.',                               location: 'North Clinic',    assignee: 'Front desk AI', date: 'Jun 8, 2025', unread: true },
  ],
  'Not resolved': [
    { id: 'nr-1', name: 'Nathaniel Cole',  message: 'Transferred to the billing team for a disputed charge.',            location: 'North Clinic',    assignee: 'Marcus Webb',  date: '09:36 AM', unread: true },
    { id: 'nr-2', name: 'Sandra Lee',      message: 'Awaiting callback from Dr. Patel regarding lab results.',            location: 'Downtown Clinic', assignee: 'Front desk AI', date: '10:20 AM', unread: true },
    { id: 'nr-3', name: 'Isabel Marsh',    message: 'Call went unanswered — voicemail left, no callback yet.',            location: 'North Clinic',    date: '09:58 AM', unread: true },
    { id: 'nr-4', name: 'Paloma Ruiz',     message: 'Transferred to clinical staff for a medication question.',           location: 'South Clinic',    assignee: 'Ana Reyes',    date: 'Jun 10, 2025' },
    { id: 'nr-5', name: 'Thomas Reyes',    message: 'Requested a callback about referral status — pending review.',       location: 'South Clinic',    assignee: 'Front desk AI', date: '09:55 AM' },
  ],
  'Scheduled': [
    { id: 'bkg1', name: 'Natalie Brooks',  verified: true,   message: 'Booked new patient consult for Jun 14 at 10am.',                                      location: 'North Clinic',    assignee: 'Front desk AI', date: '09:30 AM', unread: true },
    { id: 'bkg2', name: 'Carlos Jimenez',                    message: 'Scheduled annual physical for next Tuesday.',                                        location: 'South Clinic',    assignee: 'Front desk AI', date: '08:58 AM' },
    { id: 'bkg3', name: 'Ingrid Sorensen',                   message: 'Booked follow-up visit after recent ER discharge.',                                  location: 'Downtown Clinic', assignee: 'Front desk AI', date: 'Jun 10, 2025' },
    { id: 'bkg4', name: 'Om Prakash',                         message: 'New patient intake appointment booked for Jun 16.',                                  location: 'North Clinic',    assignee: 'Front desk AI', date: 'Jun 9, 2025',  unread: true },
  ],
  'Rescheduled': [
    { id: 'res1', name: 'Bethany Coleman',                   message: 'Moved Thursday visit to next Monday due to travel.',                                 location: 'South Clinic',    assignee: 'Front desk AI', date: '11:05 AM', unread: true },
    { id: 'res2', name: 'Frank Delgado',                     message: 'Rescheduled physical therapy session to Friday afternoon.',                          location: 'North Clinic',    assignee: 'Front desk AI', date: '10:40 AM' },
    { id: 'res3', name: 'Yuki Tanaka',     verified: true,   message: 'Pushed dermatology follow-up back two weeks.',                                       location: 'Downtown Clinic', assignee: 'Front desk AI', date: 'Jun 10, 2025' },
    { id: 'res4', name: 'Harold Simmons',                    message: 'Moved appointment earlier due to a schedule conflict.',                              location: 'South Clinic',    assignee: 'Front desk AI', date: 'Jun 9, 2025' },
    { id: 'res5', name: 'Isabel Marsh',                      message: 'Rescheduled due to a transportation conflict.',                                       location: 'Downtown Clinic', assignee: 'Front desk AI', date: 'Jun 8, 2025' },
  ],
  'Cancelled': [
    { id: 'can1', name: 'Gabriela Nunez',                    message: 'Cancelled Friday appointment — feeling better, no longer needed.',                    location: 'North Clinic',    assignee: 'Front desk AI', date: '09:48 AM', unread: true },
    { id: 'can2', name: 'Trevor Adams',                      message: 'Cancelled follow-up — switched to a different provider.',                            location: 'South Clinic',    assignee: 'Front desk AI', date: 'Jun 10, 2025' },
    { id: 'can3', name: 'Monica Silva',    verified: true,   message: 'Cancelled annual checkup — will rebook next quarter.',                                location: 'Downtown Clinic', assignee: 'Front desk AI', date: 'Jun 9, 2025' },
  ],
  'Information provided': [
    { id: 'ans1', name: 'Angela Martinez', verified: true, message: 'Called to confirm which insurance plans are accepted — confirmed Blue Cross in-network.', location: 'North Clinic',    assignee: 'Front desk AI', date: '09:12 AM', unread: true },
    { id: 'ans2', name: 'David Kim',                        message: 'Asked about post-op care instructions after knee surgery.',                          location: 'South Clinic',    assignee: 'Front desk AI', date: '08:47 AM', unread: true },
    { id: 'ans3', name: 'Renee Ortiz',    verified: true,   message: 'Confirmed pharmacy on file for prescription pickup.',                                 location: 'Downtown Clinic', assignee: 'Front desk AI', date: 'Jun 10, 2025' },
    { id: 'ans4', name: 'Marcus Webb',                       message: 'Asked about clinic hours for the holiday weekend.',                                   location: 'North Clinic',    assignee: 'Front desk AI', date: 'Jun 9, 2025' },
  ],
  'Human transfer': [
    { id: 'trf-1', name: 'Nathaniel Cole',                     message: 'Transferred to the billing team for a disputed charge.',            location: 'North Clinic',    assignee: 'Marcus Webb',  date: '09:36 AM', unread: true },
    { id: 'trf-2', name: 'Paloma Ruiz',                        message: 'Transferred to clinical staff for a medication question.',           location: 'South Clinic',    assignee: 'Ana Reyes',    date: 'Jun 10, 2025' },
    { id: 'trf-3', name: 'Elliot Gray',                        message: 'Transferred to the scheduling supervisor for a multi-visit request.', location: 'Downtown Clinic', assignee: 'Kelsy Hiltz',  date: 'Jun 9, 2025' },
    { id: 'trf-4', name: 'Grace Liu',                          message: 'Transferred to a specialist\'s office for a referral question.',     location: 'North Clinic',    assignee: 'Ana Reyes',    date: 'Jun 8, 2025' },
  ],
  'Action pending': [
    { id: 'pen1', name: 'Sandra Lee',                        message: 'Awaiting callback from Dr. Patel regarding lab results.',                            location: 'Downtown Clinic', assignee: 'Front desk AI', date: '10:20 AM', unread: true },
    { id: 'pen2', name: 'Thomas Reyes',                      message: 'Requested a callback about referral status — pending review.',                       location: 'South Clinic',    assignee: 'Front desk AI', date: '09:55 AM' },
    { id: 'pen3', name: 'Priya Chandran', verified: true,    message: 'Insurance pre-authorization request submitted, pending approval.',                    location: 'North Clinic',    assignee: 'Front desk AI', date: 'Jun 10, 2025' },
    { id: 'pen4', name: 'Wesley Grant',                      message: 'Awaiting confirmation from specialist\'s office on availability.',                    location: 'Downtown Clinic', assignee: 'Front desk AI', date: 'Jun 9, 2025',  unread: true },
  ],
  'Incomplete interaction': [
    { id: 'na-1', name: 'Isabel Marsh',                       message: 'Call went unanswered — voicemail left, no callback yet.',            location: 'North Clinic',    date: '09:58 AM', unread: true },
    { id: 'na-2', name: 'Julian Cross',                        message: 'Call disconnected before front desk picked up.',                    location: 'South Clinic',    date: 'Jun 9, 2025' },
    { id: 'na-3', name: 'Aditi Rao',                           message: 'Call dropped before it could be answered.',                          location: 'Downtown Clinic', date: 'Jun 7, 2025' },
  ],
  'Other': [
    { id: 'oth-1', name: 'Vendor Rep',                        message: 'Sales call about office supplies — not a patient inquiry.',           location: 'North Clinic',    date: 'Jun 8, 2025' },
    { id: 'oth-2', name: 'Unknown caller',                    message: 'Wrong number — caller was looking for a different clinic.',          location: 'South Clinic',    date: 'Jun 7, 2025' },
    { id: 'oth-3', name: 'Jordan Ellis',                      message: 'HR inquiry about a job posting at the practice.',                    location: 'Downtown Clinic', date: 'Jun 6, 2025' },
  ],
  'Payment and billing': [
    { id: 'pb-1', name: 'Brandon Lee',                       message: 'Asked about a duplicate charge on the last statement.',              location: 'South Clinic',    assignee: 'Kelsy Hiltz',   date: '08:44 AM' },
    { id: 'pb-2', name: 'Tomás Rivera',                      message: 'Asked about payment plan options for an outstanding balance.',     location: 'South Clinic',    assignee: 'Front desk AI', date: 'Jun 7, 2025', unread: true },
  ],
  'Insurance coverage': [
    { id: 'ins-1', name: 'Angela Martinez', verified: true, message: 'Confirmed Blue Cross is accepted and benefits were explained.',     location: 'North Clinic',    assignee: 'Front desk AI', date: '09:12 AM', unread: true },
    { id: 'ins-2', name: 'Renee Ortiz',    verified: true,   message: 'Asked whether a specialist visit would be covered.',                  location: 'Downtown Clinic', assignee: 'Front desk AI', date: 'Jun 10, 2025' },
  ],
  'Treatment related': [
    { id: 'tr-1', name: 'David Kim',                         message: 'Asked about post-op care instructions after knee surgery.',          location: 'South Clinic',    assignee: 'Front desk AI', date: '08:47 AM', unread: true },
    { id: 'tr-2', name: 'Fatima Noor',                       message: 'Asked about medication instructions before a procedure.',            location: 'Downtown Clinic', assignee: 'Front desk AI', date: 'Jun 10, 2025' },
  ],
  'Referrals': [
    { id: 'ref-1', name: 'Grace Liu',                         message: 'Asked for a referral to a cardiologist in-network.',                 location: 'North Clinic',    assignee: 'Ana Reyes',    date: 'Jun 8, 2025' },
    { id: 'ref-2', name: 'Camille Ortiz',                     message: 'Requested records be sent to a specialist.',                           location: 'North Clinic',    assignee: 'Front desk AI', date: 'Jun 10, 2025' },
  ],
  'General enquiry': [
    { id: 'ge-1', name: 'Marcus Webb',                       message: 'Asked about clinic hours for the holiday weekend.',                   location: 'North Clinic',    assignee: 'Front desk AI', date: 'Jun 9, 2025' },
    { id: 'ge-2', name: 'Robert Hail',                       message: 'Phoned to ask if walk-ins are accepted on weekends.',                location: 'South Clinic',    assignee: 'Front desk AI', date: '08:40 AM' },
  ],
  'Call attended': [
    { id: 'ca-1', name: 'Nathaniel Cole',                    message: 'Transferred to billing — call was picked up by a team member.',      location: 'North Clinic',    assignee: 'Marcus Webb',  date: '09:36 AM', unread: true },
    { id: 'ca-2', name: 'Paloma Ruiz',                       message: 'Transferred to clinical staff — nurse answered.',                    location: 'South Clinic',    assignee: 'Ana Reyes',    date: 'Jun 10, 2025' },
  ],
  'Call not attended': [
    { id: 'cna-1', name: 'Elliot Gray',                      message: 'Transferred to scheduling — no one picked up, voicemail left.',    location: 'Downtown Clinic', assignee: 'Kelsy Hiltz',  date: 'Jun 9, 2025' },
    { id: 'cna-2', name: 'Tomás Rivera',                     message: 'Transfer attempted to billing — call rang out.',                     location: 'South Clinic',    assignee: 'Marcus Webb',  date: 'Jun 7, 2025', unread: true },
  ],
  'Follow up': [
    { id: 'fu-1', name: 'Sandra Lee',                        message: 'Practice needs to call back with lab results.',                        location: 'Downtown Clinic', assignee: 'Front desk AI', date: '10:20 AM', unread: true },
    { id: 'fu-2', name: 'Thomas Reyes',                      message: 'Referral status check — practice to follow up with specialist.',     location: 'South Clinic',    assignee: 'Front desk AI', date: '09:55 AM' },
  ],
  'Call disconnected': [
    { id: 'cd-1', name: 'Julian Cross',                      message: 'Call disconnected before front desk picked up.',                    location: 'South Clinic',    date: 'Jun 9, 2025' },
    { id: 'cd-2', name: 'Aditi Rao',                         message: 'Call dropped before it could be answered.',                          location: 'Downtown Clinic', date: 'Jun 7, 2025' },
  ],
  'Abandoned': [
    { id: 'ab-1', name: 'Helen Cho',                         message: 'Webchat session abandoned mid-conversation.',                        location: 'North Clinic',    date: '11:00 AM', unread: true },
    { id: 'ab-2', name: 'Isabel Marsh',                      message: 'Patient left the chat queue before an agent joined.',                location: 'North Clinic',    date: '09:58 AM', unread: true },
  ],
  'Wrong numbers': [
    { id: 'wn-1', name: 'Unknown caller',                    message: 'Wrong number — caller was looking for a different clinic.',          location: 'South Clinic',    date: 'Jun 7, 2025' },
  ],
  'Sales calls': [
    { id: 'sc-1', name: 'Vendor Rep',                        message: 'Sales call about office supplies — not a patient inquiry.',           location: 'North Clinic',    date: 'Jun 8, 2025' },
  ],
  'Human resources': [
    { id: 'hr-1', name: 'Jordan Ellis',                      message: 'HR inquiry about a job posting at the practice.',                    location: 'Downtown Clinic', date: 'Jun 6, 2025' },
  ],
}

// ─── Chat messages per conversation id ───────────────────────────────────────

interface ChatMsg { id: string; sender: 'customer' | 'agent'; text: string; time: string }

const CHAT_BY_CONVO: Record<string, ChatMsg[]> = {
  'ch-call-1': [
    { id: '1', sender: 'customer', text: "Hi, is there any same-day availability for a sick visit today?",              time: '09:02 AM' },
    { id: '2', sender: 'agent',    text: "Let me check — yes, we have an opening at 11am today.",                       time: '09:03 AM' },
    { id: '3', sender: 'customer', text: "That works, please book it.",                                                 time: '09:04 AM' },
    { id: '4', sender: 'agent',    text: "Booked! We'll see you at 11am today.",                                        time: '09:05 AM' },
  ],
  'ch-text-1': [
    { id: '1', sender: 'agent',    text: "Reminder: you have an appointment tomorrow at 2pm. Reply Y to confirm.",       time: '09:59 AM' },
    { id: '2', sender: 'customer', text: "Y",                                                                           time: '10:01 AM' },
    { id: '3', sender: 'agent',    text: "Great, see you then!",                                                        time: '10:02 AM' },
  ],
  'ch-email-1': [
    { id: '1', sender: 'customer', text: "Could you send me a copy of my visit summary from last week?",               time: '10:50 AM' },
    { id: '2', sender: 'agent',    text: "Of course — I've attached your visit summary here.",                          time: '10:58 AM' },
    { id: '3', sender: 'customer', text: "Perfect, thank you!",                                                        time: '11:00 AM' },
  ],
  'inv-myna-1': [
    { id: '1', sender: 'customer', text: "Can you confirm my appointment and whether you take Aetna?",                 time: '09:11 AM' },
    { id: '2', sender: 'agent',    text: "Yes, we're in-network with Aetna, and your appointment is confirmed for Jun 14.", time: '09:13 AM' },
    { id: '3', sender: 'customer', text: "Great, thank you!",                                                          time: '09:14 AM' },
  ],
  'inv-human-1': [
    { id: '1', sender: 'customer', text: "I was billed twice for the same visit and need this corrected.",             time: '10:10 AM' },
    { id: '2', sender: 'agent',    text: "I'm sorry about that — this needs a closer look, let me connect you with our billing manager.", time: '10:13 AM' },
    { id: '3', sender: 'customer', text: "Okay, thank you for escalating it.",                                         time: '10:15 AM' },
  ],
  'na-1': [
    { id: '1', sender: 'agent',    text: "Thanks for calling North Clinic. We're unable to take your call right now — please leave a message.", time: '09:58 AM' },
  ],
  // Extended into 3 separate sessions (different days) for the "Resolved" sessions-mode demo —
  // see SESSIONS_BY_NODE. Message ids 1-3 / 4-6 / 7-9 are each their own session.
  'res-1': [
    { id: '1', sender: 'customer', text: "Hi, I wanted to confirm my appointment and ask a quick question about prep.", time: 'Jun 5, 2025, 09:07 AM' },
    { id: '2', sender: 'agent',    text: "You're confirmed for Thursday, and no special prep is needed for this visit.", time: 'Jun 5, 2025, 09:09 AM' },
    { id: '3', sender: 'customer', text: "Great, that's all I needed. Thanks!",                                        time: 'Jun 5, 2025, 09:10 AM' },
    { id: '4', sender: 'customer', text: "Following up — can you also confirm what insurance you have on file for me?", time: 'Jun 8, 2025, 02:20 PM' },
    { id: '5', sender: 'agent',    text: "You have Blue Cross Blue Shield on file, verified as active.",                time: 'Jun 8, 2025, 02:22 PM' },
    { id: '6', sender: 'customer', text: "Perfect, thank you.",                                                        time: 'Jun 8, 2025, 02:23 PM' },
    { id: '7', sender: 'customer', text: "Last thing — can I get a copy of my visit summary emailed to me?",           time: 'Jun 11, 2025, 09:30 AM' },
    { id: '8', sender: 'agent',    text: "Sent! You should have it in your inbox now.",                                time: 'Jun 11, 2025, 09:32 AM' },
    { id: '9', sender: 'customer', text: "Got it, thanks again!",                                                      time: 'Jun 11, 2025, 09:33 AM' },
  ],
  // Fresh multi-session thread for the "AI agents involved" sessions-mode demo.
  'inv-myna-2': [
    { id: '1', sender: 'customer', text: "Hi, I'd like to book a new patient consultation for early June.",  time: 'Jun 3, 2025, 08:50 AM' },
    { id: '2', sender: 'agent',    text: "I have an opening Jun 5 at 9am — would that work?",                time: 'Jun 3, 2025, 08:52 AM' },
    { id: '3', sender: 'customer', text: "Yes, that's perfect.",                                             time: 'Jun 3, 2025, 08:53 AM' },
    { id: '4', sender: 'customer', text: "Quick follow-up — do I need to bring anything for the first visit?", time: 'Jun 6, 2025, 11:20 AM' },
    { id: '5', sender: 'agent',    text: "Just a photo ID and your insurance card, if you have one.",          time: 'Jun 6, 2025, 11:22 AM' },
    { id: '6', sender: 'customer', text: "Got it, thank you!",                                                time: 'Jun 6, 2025, 11:23 AM' },
    { id: '7', sender: 'customer', text: "Actually, can we push my visit to the afternoon instead?",           time: 'Jun 8, 2025, 03:40 PM' },
    { id: '8', sender: 'agent',    text: "Sure — I've moved it to 2pm on Jun 5.",                              time: 'Jun 8, 2025, 03:42 PM' },
    { id: '9', sender: 'customer', text: "Perfect, thanks again.",                                            time: 'Jun 8, 2025, 03:43 PM' },
  ],
  'inv-myna-4': [
    { id: '1', sender: 'customer', text: "Can you confirm my prescription refill was sent to my pharmacy?",   time: 'Jun 4, 2025, 09:38 AM' },
    { id: '2', sender: 'agent',    text: "Yes, it was sent to CVS on Main St this morning.",                  time: 'Jun 4, 2025, 09:40 AM' },
    { id: '3', sender: 'customer', text: "Great, thank you!",                                                 time: 'Jun 4, 2025, 09:41 AM' },
    { id: '4', sender: 'customer', text: "One more question — how long does a refill usually take to process?", time: 'Jun 7, 2025, 01:10 PM' },
    { id: '5', sender: 'agent',    text: "Usually same-day, but can take up to 24 hours depending on the pharmacy.", time: 'Jun 7, 2025, 01:12 PM' },
    { id: '6', sender: 'customer', text: "Understood, thanks.",                                               time: 'Jun 7, 2025, 01:13 PM' },
    { id: '7', sender: 'customer', text: "Can I also switch my pharmacy on file to Walgreens?",                time: 'Jun 9, 2025, 04:05 PM' },
    { id: '8', sender: 'agent',    text: "Done — your pharmacy on file is now Walgreens.",                    time: 'Jun 9, 2025, 04:07 PM' },
    { id: '9', sender: 'customer', text: "Appreciate it!",                                                    time: 'Jun 9, 2025, 04:08 PM' },
  ],
  'inv-myna-3': [
    { id: '1', sender: 'customer', text: "I need to reschedule my visit next week — is Thursday open?",       time: 'Jun 10, 2025, 10:05 AM' },
    { id: '2', sender: 'agent',    text: "Thursday at 10am is open — I've moved your visit there.",           time: 'Jun 10, 2025, 10:07 AM' },
    { id: '3', sender: 'customer', text: "Thank you!",                                                        time: 'Jun 10, 2025, 10:08 AM' },
  ],
  'res-2': [
    { id: '1', sender: 'customer', text: "I was charged twice for my last visit and need this corrected.",   time: 'Jun 2, 2025, 08:40 AM' },
    { id: '2', sender: 'agent',    text: "I've reviewed your account and refunded the duplicate charge.",      time: 'Jun 2, 2025, 08:44 AM' },
    { id: '3', sender: 'customer', text: "Thank you for fixing that so quickly.",                              time: 'Jun 2, 2025, 08:45 AM' },
    { id: '4', sender: 'customer', text: "Also, can you confirm my updated billing address?",                  time: 'Jun 5, 2025, 01:15 PM' },
    { id: '5', sender: 'agent',    text: "Yes, it's updated to 220 Oak Street as of last week.",               time: 'Jun 5, 2025, 01:17 PM' },
    { id: '6', sender: 'customer', text: "That's correct, thanks.",                                            time: 'Jun 5, 2025, 01:18 PM' },
    { id: '7', sender: 'customer', text: "One more thing — can I set up a payment plan for my remaining balance?", time: 'Jun 9, 2025, 03:00 PM' },
    { id: '8', sender: 'agent',    text: "Absolutely, I've set up a 3-month payment plan for you.",            time: 'Jun 9, 2025, 03:05 PM' },
    { id: '9', sender: 'customer', text: "Thank you so much for the help.",                                    time: 'Jun 9, 2025, 03:06 PM' },
  ],
  'res-3': [
    { id: '1', sender: 'customer', text: "Can you confirm my prescription refill is set?",                    time: 'Jun 10, 2025, 09:00 AM' },
    { id: '2', sender: 'agent',    text: "Yes, it's confirmed and sent to your pharmacy.",                    time: 'Jun 10, 2025, 09:02 AM' },
    { id: '3', sender: 'customer', text: "Great, thank you!",                                                 time: 'Jun 10, 2025, 09:03 AM' },
  ],
  'res-4': [
    { id: '1', sender: 'customer', text: "Can you confirm the time for my appointment tomorrow?",             time: 'Jun 4, 2025, 09:23 AM' },
    { id: '2', sender: 'agent',    text: "You're confirmed for 9:30am tomorrow.",                             time: 'Jun 4, 2025, 09:25 AM' },
    { id: '3', sender: 'customer', text: "Great, thank you!",                                                 time: 'Jun 4, 2025, 09:26 AM' },
    { id: '4', sender: 'customer', text: "Quick question — is parking available on site?",                     time: 'Jun 6, 2025, 12:40 PM' },
    { id: '5', sender: 'agent',    text: "Yes, free parking is available in the north lot.",                   time: 'Jun 6, 2025, 12:41 PM' },
    { id: '6', sender: 'customer', text: "Perfect, thanks.",                                                   time: 'Jun 6, 2025, 12:42 PM' },
    { id: '7', sender: 'customer', text: "Can you also add my spouse to the visit as an authorized contact?",  time: 'Jun 9, 2025, 10:10 AM' },
    { id: '8', sender: 'agent',    text: "Done — your spouse is now listed as an authorized contact.",         time: 'Jun 9, 2025, 10:12 AM' },
    { id: '9', sender: 'customer', text: "Thank you!",                                                        time: 'Jun 9, 2025, 10:13 AM' },
  ],
  'trf-1': [
    { id: '1', sender: 'customer', text: "I was charged for a service I don't think I received.",                     time: '09:33 AM' },
    { id: '2', sender: 'agent',    text: "I understand — let me transfer you to our billing team so they can look into this charge.", time: '09:35 AM' },
    { id: '3', sender: 'customer', text: "Okay, thank you.",                                                           time: '09:36 AM' },
  ],
  ans1: [
    { id: '1', sender: 'customer', text: "Hi, I wanted to double check which insurance plans you accept before my visit.", time: '09:08 AM' },
    { id: '2', sender: 'agent',    text: "Happy to help! We're in-network with Blue Cross, Aetna, and UnitedHealthcare.",   time: '09:09 AM' },
    { id: '3', sender: 'customer', text: "I have Blue Cross — good to know that's covered.",                                time: '09:10 AM' },
    { id: '4', sender: 'agent',    text: "Confirmed — you're all set for your appointment.",                               time: '09:12 AM' },
  ],
  pen1: [
    { id: '1', sender: 'customer', text: "I had lab work done last week and haven't heard back yet.",                     time: '10:15 AM' },
    { id: '2', sender: 'agent',    text: "Let me check — I see Dr. Patel is still reviewing your results.",                time: '10:17 AM' },
    { id: '3', sender: 'customer', text: "Okay, do you know roughly when I'll hear back?",                                 time: '10:18 AM' },
    { id: '4', sender: 'agent',    text: "You should get a callback within 1-2 business days. I've flagged it as pending.", time: '10:20 AM' },
  ],
  bkg1: [
    { id: '1', sender: 'customer', text: "I'd like to book a new patient consultation.",                                  time: '09:25 AM' },
    { id: '2', sender: 'agent',    text: "Sure thing! I have an opening Jun 14 at 10am — does that work?",                 time: '09:27 AM' },
    { id: '3', sender: 'customer', text: "Yes, that works great.",                                                        time: '09:28 AM' },
    { id: '4', sender: 'agent',    text: "Booked! You're confirmed for Jun 14 at 10am.",                                  time: '09:30 AM' },
  ],
  res1: [
    { id: '1', sender: 'customer', text: "I need to move my Thursday appointment — I'll be traveling.",                  time: '11:00 AM' },
    { id: '2', sender: 'agent',    text: "No problem. I have an opening next Monday at the same time.",                   time: '11:02 AM' },
    { id: '3', sender: 'customer', text: "Monday works for me.",                                                          time: '11:03 AM' },
    { id: '4', sender: 'agent',    text: "Done — you're rescheduled for Monday.",                                        time: '11:05 AM' },
  ],
  can1: [
    { id: '1', sender: 'customer', text: "I'd like to cancel my appointment this Friday.",                                time: '09:45 AM' },
    { id: '2', sender: 'agent',    text: "Sure — may I ask the reason, just so we can follow up if needed?",              time: '09:46 AM' },
    { id: '3', sender: 'customer', text: "I'm feeling much better, don't think I need it anymore.",                       time: '09:47 AM' },
    { id: '4', sender: 'agent',    text: "Glad to hear it! Your Friday appointment is cancelled.",                        time: '09:48 AM' },
  ],
}

const DEFAULT_CHAT: ChatMsg[] = [
  { id: '1', sender: 'customer', text: "Hi, I had a question about my appointment.",           time: '09:00 AM' },
  { id: '2', sender: 'agent',    text: "Of course! How can I help you today?",                 time: '09:01 AM' },
  { id: '3', sender: 'customer', text: "I wanted to confirm the details.",                     time: '09:02 AM' },
  { id: '4', sender: 'agent',    text: "Everything looks good on our end. You're all set!",   time: '09:03 AM' },
  { id: '5', sender: 'customer', text: "Great, thanks for confirming!",                        time: '09:04 AM' },
]

// ─── Sessions-mode demo: one conversation can hold several sessions ──────────
// A session is a single agent-message-to-resolution exchange; a conversation can hold several,
// spread across different days. Opening a session jumps straight into its parent conversation's
// full thread, scrolled to where that session starts — demoed for two nodes ("AI agents involved"
// and "Resolved") rather than rebuilding every node's data twice.
interface FunnelSession extends FunnelConversation {
  convoId: string
  anchorMsgId: string
}

const SESSIONS_BY_NODE: Partial<Record<string, FunnelSession[]>> = {
  'AI agents involved': [
    { id: 'sess-myna-1a', convoId: 'inv-myna-1', name: 'Grace Liu',    message: 'AI confirmed appointment details and answered an insurance question.', location: 'North Clinic', assignee: 'Front desk AI', date: 'Jun 5, 2025',  anchorMsgId: '1' },
    { id: 'sess-myna-1b', convoId: 'inv-myna-1', name: 'Grace Liu',    message: 'AI moved her appointment to the following week.',                      location: 'North Clinic', assignee: 'Front desk AI', date: 'Jun 8, 2025',  anchorMsgId: '4' },
    { id: 'sess-myna-1c', convoId: 'inv-myna-1', name: 'Grace Liu',    message: 'AI sent a prescription refill request to her pharmacy.',               location: 'North Clinic', assignee: 'Front desk AI', date: 'Jun 10, 2025', anchorMsgId: '7', unread: true },
    { id: 'sess-myna-2a', convoId: 'inv-myna-2', name: 'Tomás Rivera', message: 'AI booked a new patient consultation.',                                location: 'South Clinic', assignee: 'Front desk AI', date: 'Jun 3, 2025',  anchorMsgId: '1' },
    { id: 'sess-myna-2b', convoId: 'inv-myna-2', name: 'Tomás Rivera', message: 'AI answered a first-visit prep question.',                             location: 'South Clinic', assignee: 'Front desk AI', date: 'Jun 6, 2025',  anchorMsgId: '4' },
    { id: 'sess-myna-2c', convoId: 'inv-myna-2', name: 'Tomás Rivera', message: 'AI moved his visit to the afternoon.',                                 location: 'South Clinic', assignee: 'Front desk AI', date: 'Jun 8, 2025',  anchorMsgId: '7', unread: true },
    { id: 'sess-myna-4a', convoId: 'inv-myna-4', name: 'Walter Boone', message: 'AI confirmed a prescription refill was sent to the pharmacy.',         location: 'North Clinic', assignee: 'Front desk AI', date: 'Jun 4, 2025',  anchorMsgId: '1' },
    { id: 'sess-myna-4b', convoId: 'inv-myna-4', name: 'Walter Boone', message: 'AI answered a question about refill processing time.',                 location: 'North Clinic', assignee: 'Front desk AI', date: 'Jun 7, 2025',  anchorMsgId: '4' },
    { id: 'sess-myna-4c', convoId: 'inv-myna-4', name: 'Walter Boone', message: 'AI updated his pharmacy on file to Walgreens.',                        location: 'North Clinic', assignee: 'Front desk AI', date: 'Jun 9, 2025',  anchorMsgId: '7', unread: true },
    { id: 'sess-myna-3a', convoId: 'inv-myna-3', name: 'Nina Patel',   message: 'AI handled a reschedule request end-to-end.',                          location: 'Downtown Clinic', assignee: 'Front desk AI', date: 'Jun 10, 2025', anchorMsgId: '1' },
  ],
  'Resolved': [
    { id: 'sess-res-1a', convoId: 'res-1', name: 'Aditi Rao',        message: 'Appointment confirmed and a prep question answered.',       location: 'North Clinic',    assignee: 'Front desk AI', date: 'Jun 5, 2025',  anchorMsgId: '1' },
    { id: 'sess-res-1b', convoId: 'res-1', name: 'Aditi Rao',        message: 'Confirmed her insurance on file was active.',                location: 'North Clinic',    assignee: 'Front desk AI', date: 'Jun 8, 2025',  anchorMsgId: '4' },
    { id: 'sess-res-1c', convoId: 'res-1', name: 'Aditi Rao',        message: 'Emailed her a copy of the visit summary.',                    location: 'North Clinic',    assignee: 'Front desk AI', date: 'Jun 11, 2025', anchorMsgId: '7', unread: true },
    { id: 'sess-res-2a', convoId: 'res-2', name: 'Brandon Lee',      message: 'Refunded a duplicate billing charge.',                        location: 'South Clinic',    assignee: 'Kelsy Hiltz',   date: 'Jun 2, 2025',  anchorMsgId: '1' },
    { id: 'sess-res-2b', convoId: 'res-2', name: 'Brandon Lee',      message: 'Confirmed his updated billing address.',                      location: 'South Clinic',    assignee: 'Kelsy Hiltz',   date: 'Jun 5, 2025',  anchorMsgId: '4' },
    { id: 'sess-res-2c', convoId: 'res-2', name: 'Brandon Lee',      message: 'Set up a 3-month payment plan for his balance.',              location: 'South Clinic',    assignee: 'Kelsy Hiltz',   date: 'Jun 9, 2025',  anchorMsgId: '7', unread: true },
    { id: 'sess-res-4a', convoId: 'res-4', name: 'Nathaniel Cole',   message: 'Confirmed his appointment time for the next day.',            location: 'North Clinic',    assignee: 'Front desk AI', date: 'Jun 4, 2025',  anchorMsgId: '1' },
    { id: 'sess-res-4b', convoId: 'res-4', name: 'Nathaniel Cole',   message: 'Answered a question about on-site parking.',                  location: 'North Clinic',    assignee: 'Front desk AI', date: 'Jun 6, 2025',  anchorMsgId: '4' },
    { id: 'sess-res-4c', convoId: 'res-4', name: 'Nathaniel Cole',   message: 'Added his spouse as an authorized contact.',                  location: 'North Clinic',    assignee: 'Front desk AI', date: 'Jun 9, 2025',  anchorMsgId: '7', unread: true },
    { id: 'sess-res-3a', convoId: 'res-3', name: 'Fatima Noor',      message: 'Prescription refill confirmed, no further action needed.',    location: 'Downtown Clinic', assignee: 'Front desk AI', date: 'Jun 10, 2025', anchorMsgId: '1' },
  ],
}

const opts = (...labels: string[]) => labels.map((l) => ({ value: l.toLowerCase().replace(/\s+/g, '-'), label: l }))

// Collapsed filter button reads "All channels" by default (and stays that way if every option
// ends up checked), the single option's own name — pluralized — when exactly one is picked
// (e.g. "Call" -> "Calls"), or a plain count once there's more than one but not all.
function formatChannelSelectionLabel(selected: string[], options: { value: string; label: string }[]): string {
  if (selected.length === 0 || selected.length === options.length) return 'All channels'
  if (selected.length === 1) {
    const opt = options.find((o) => o.value === selected[0])
    return opt ? `${opt.label}s` : '1 selected'
  }
  return `${selected.length} selected`
}

const FILTER_FIELDS: FilterField[] = [
  { id: 'state',                  label: 'State',                  options: opts('Texas', 'California', 'Arizona', 'Colorado', 'Washington', 'Illinois') },
  { id: 'brand',                  label: 'Brand',                  options: opts('Willowbrook Health', 'Riverside Medical Group', 'Evercare Clinics', 'Northgate Health Partners') },
  { id: 'location',               label: 'Location',               options: opts('North Clinic', 'South Clinic', 'Downtown Clinic') },
  { id: 'channel',                label: 'Channel',                 options: opts('Call', 'Text', 'Webchat'), formatSelectionLabel: formatChannelSelectionLabel },
  { id: 'status',                 label: 'Status',                 options: opts('Resolved', 'Not resolved') },
  { id: 'outcome',                label: 'Outcome',                options: opts('Scheduled', 'Rescheduled', 'Cancelled', 'Information provided', 'Human transfer', 'Action pending', 'Incomplete interaction', 'Other') },
  { id: 'sub-outcomes',           label: 'Sub-outcomes',           options: opts('Payment and billing', 'Insurance coverage', 'Treatment related', 'Referrals', 'General enquiry', 'Call attended', 'Call not attended', 'Follow up', 'Call disconnected', 'Abandoned', 'Wrong numbers', 'Sales calls', 'Human resources') },
  { id: 'agents',                 label: 'Agents',                 options: opts('Front desk agent - North region', 'Front desk agent - East region', 'Front desk agent - South region', 'Front desk agent - West region') },
  { id: 'involvement',            label: 'Involvement',            options: opts('AI agents involved', 'Human involved', 'Not answered') },
  { id: 'call-timing',            label: 'Call timing',            options: opts('Office hours', 'After hours') },
  { id: 'last-incoming-message',  label: 'Last incoming message',  options: opts('Today', 'Yesterday', 'Last 7 days', 'Last 30 days', 'Last 3 months') },
  { id: 'intents',                label: 'Intents',                options: opts('General inquiry', 'Scheduling', 'Reschedule', 'Cancellation', 'Prescription', 'Lab results', 'Other') },
]

// Healthcare chart card — uses the tune icon for the left action button
function HCCard(props: React.ComponentProps<typeof ChartCard>) {
  return <ChartCard {...props} leftActionIcon="tune" />
}

const DATE_RANGE_OPTIONS = ['Last 7 days', 'Last 30 days', 'Last 3 months', 'Last 6 months', 'Last 12 months', 'Custom']

const CURRENCY_SYMBOLS: Record<string, string> = { USD: '$', EUR: '€', GBP: '£' }

// grandTotal/resolvedTotal come straight from the filtered funnel (exact). The savings tile is
// derived from the user-configured "time saved per session/conversation" (and, in cost mode, an
// hourly wage) rather than a hardcoded business-value estimate, so it already reflects channel
// filtering through grandTotal — no extra ratio needed.
function getSummaryStats(
  forms: NounForms,
  grandTotal: number,
  resolvedTotal: number,
  savings: EstimateSavingsValues,
  onConfigureSavings: () => void,
) {
  const resolutionRate = grandTotal > 0 ? Math.round((resolvedTotal / grandTotal) * 100) : 0
  const totalHours = (savings.timePerUnitMins * grandTotal) / 60
  const savingsStat = savings.mode === 'time'
    ? { id: 'savings', value: `${Math.round(totalHours).toLocaleString()} hrs`, label: 'Time saved', onConfigure: onConfigureSavings }
    : { id: 'savings', value: `${CURRENCY_SYMBOLS[savings.currency] ?? '$'}${formatCompact(Math.round(totalHours * savings.hourlyWage))}`, label: 'Cost saved', onConfigure: onConfigureSavings }
  return [
    { id: 'handled',        value: grandTotal.toLocaleString(),    label: `${forms.capPlural} involved`,  delta: '70%', trend: 'up' as const },
    { id: 'resolved',       value: resolvedTotal.toLocaleString(), label: `${forms.capPlural} resolved` },
    { id: 'resolutionRate', value: `${resolutionRate}%`,           label: 'Resolution rate' },
    savingsStat,
  ]
}

// Six-month trends, one per funnel column — vertical stacked bar charts.
// The story: six months ago humans still handled the majority of interactions; AI agents
// have steadily taken that volume over since, so "Human involved" drops sharply (480→280)
// while "AI agents involved" climbs sharply (290→700) — the roles clearly flip over the
// period. The monthly total still moves up and down rather than climbing in a straight
// line; only "Not answered" wobbles a little, since it isn't part of the handoff story.
const CHANNEL_TREND_DATA = [
  { month: 'Feb', call: 492, text: 246, webchat: 82  },
  { month: 'Mar', call: 534, text: 267, webchat: 89  },
  { month: 'Apr', call: 510, text: 255, webchat: 85  },
  { month: 'May', call: 558, text: 279, webchat: 93  },
  { month: 'Jun', call: 528, text: 264, webchat: 88  },
  { month: 'Jul', call: 600, text: 300, webchat: 100 },
]
const CHANNEL_TREND_SERIES = [
  { key: 'call',    label: 'Call',    color: '#1976d2' },
  { key: 'text',    label: 'Text',    color: '#3f51b5' },
  { key: 'webchat', label: 'Webchat', color: '#9c27b0' },
]

const INVOLVEMENT_TREND_DATA = [
  { month: 'Feb', myna: 290, human: 480, notAnswered: 50 },
  { month: 'Mar', myna: 415, human: 430, notAnswered: 45 },
  { month: 'Apr', myna: 405, human: 390, notAnswered: 55 },
  { month: 'May', myna: 545, human: 350, notAnswered: 35 },
  { month: 'Jun', myna: 530, human: 310, notAnswered: 40 },
  { month: 'Jul', myna: 700, human: 280, notAnswered: 20 },
]
const INVOLVEMENT_TREND_SERIES = [
  { key: 'myna',        label: 'AI agents involved',  color: '#7c4dff' },
  { key: 'human',       label: 'Human involved', color: '#4cae3d' },
  { key: 'notAnswered', label: 'Not answered',   color: '#de1b0c' },
]

// Transferred decreases every single month — resolution rate still climbs (75% in Feb to 85.7% by Jul).
const OUTCOME_MONTHLY_TOTALS = [
  { month: 'Feb', total: 770 },
  { month: 'Mar', total: 845 },
  { month: 'Apr', total: 795 },
  { month: 'May', total: 895 },
  { month: 'Jun', total: 840 },
  { month: 'Jul', total: 1000 },
]

// Unique patients served — fewer than session volume (patients can have multiple sessions).
const UNIQUE_PATIENTS_RATIO = 0.72
const UNIQUE_PATIENTS_TREND_DATA = CHANNEL_TREND_DATA.map((row) => ({
  month: row.month,
  call: Math.round(row.call * UNIQUE_PATIENTS_RATIO),
  text: Math.round(row.text * UNIQUE_PATIENTS_RATIO),
  webchat: Math.round(row.webchat * UNIQUE_PATIENTS_RATIO),
}))

// Average patient rating on a 1–5 scale (empty when not rated is excluded from the average).
const RATING_TREND_DATA = [
  { label: 'Feb', value: 3.9 },
  { label: 'Mar', value: 4.0 },
  { label: 'Apr', value: 4.1 },
  { label: 'May', value: 4.2 },
  { label: 'Jun', value: 4.4 },
  { label: 'Jul', value: 4.5 },
]

// Office hours / after hours split of AI agent-handled interactions only
const TIMING_TREND_DATA = [
  { month: 'Feb', office: 249, after: 41  },
  { month: 'Mar', office: 356, after: 59  },
  { month: 'Apr', office: 347, after: 58  },
  { month: 'May', office: 467, after: 78  },
  { month: 'Jun', office: 454, after: 76  },
  { month: 'Jul', office: 600, after: 100 },
]
const TIMING_TREND_SERIES = [
  { key: 'office', label: 'Office hours', color: '#7c4dff' },
  { key: 'after',  label: 'After hours',  color: '#c4b1f7' },
]

// Interactions by channel (Call/Text/Webchat) → Involvement → Status → Outcome → Sub-outcome
// 0-2: channels, 3-5: involvement, 6-7: status, 8-15: outcome, 16-28: sub-outcome.
// Scheduled, rescheduled, and cancelled terminate at Outcome (no sub-outcome column).
const FUNNEL_LINKS: SankeyLink[] = [
  // channel → involvement
  { source: 0, target: 3, value: 470 }, // Call    → AI agents involved
  { source: 0, target: 4, value: 120 }, // Call    → Human involved
  { source: 0, target: 5, value: 10  }, // Call    → Not answered
  { source: 1, target: 3, value: 192 }, // Text    → AI agents involved
  { source: 1, target: 4, value: 100 }, // Text    → Human involved
  { source: 1, target: 5, value: 8   }, // Text    → Not answered
  { source: 2, target: 3, value: 38  }, // Webchat → AI agents involved
  { source: 2, target: 4, value: 60  }, // Webchat → Human involved
  { source: 2, target: 5, value: 2   }, // Webchat → Not answered
  // involvement → status — human involvement always resolves; not-answered lands in Not resolved.
  { source: 3, target: 6, value: 390 }, // AI agents involved → Resolved
  { source: 3, target: 7, value: 310 }, // AI agents involved → Not resolved
  { source: 4, target: 6, value: 280 }, // Human involved     → Resolved
  { source: 5, target: 7, value: 20  }, // Not answered       → Not resolved
  // status → outcome
  { source: 6, target: 8,  value: 145 }, // Resolved     → Scheduled
  { source: 6, target: 9,  value: 85  }, // Resolved     → Rescheduled
  { source: 6, target: 10, value: 40  }, // Resolved     → Cancelled
  { source: 6, target: 11, value: 400 }, // Resolved     → Information provided
  { source: 7, target: 12, value: 100 }, // Not resolved → Human transfer
  { source: 7, target: 13, value: 190 }, // Not resolved → Action pending
  { source: 7, target: 14, value: 20  }, // Not resolved → Incomplete interaction
  { source: 7, target: 15, value: 20  }, // Not resolved → Other
  // outcome → sub-outcome — scheduling/rescheduling/cancellation are terminal at Outcome.
  { source: 11, target: 16, value: 80  }, // Information provided → Payment and billing
  { source: 11, target: 17, value: 90  }, // Information provided → Insurance coverage
  { source: 11, target: 18, value: 100 }, // Information provided → Treatment related
  { source: 11, target: 19, value: 60  }, // Information provided → Referrals
  { source: 11, target: 20, value: 70  }, // Information provided → General enquiry
  { source: 12, target: 21, value: 65  }, // Human transfer     → Call attended
  { source: 12, target: 22, value: 35  }, // Human transfer     → Call not attended
  { source: 13, target: 23, value: 190 }, // Action pending     → Follow up
  { source: 14, target: 24, value: 12  }, // Incomplete interaction → Call disconnected
  { source: 14, target: 25, value: 8   }, // Incomplete interaction → Abandoned
  { source: 15, target: 26, value: 8   }, // Other                → Wrong numbers
  { source: 15, target: 27, value: 6   }, // Other                → Sales calls
  { source: 15, target: 28, value: 6   }, // Other                → Human resources
]
const FUNNEL_NODE_COLORS: Record<number, string> = {
  0: '#1976d2', 1: '#3f51b5', 2: '#9c27b0',
  3: '#7c4dff', 4: '#4cae3d', 5: '#de1b0c',
  6: '#4cae3d', 7: '#de1b0c',
  8: '#e056c7', 9: '#8bc34a', 10: '#f59e0b', 11: '#00bcd4',
  12: '#f5a623', 13: '#9c27b0', 14: '#ef4444', 15: '#78909c',
  16: '#1976d2', 17: '#3f51b5', 18: '#4cae3d', 19: '#9c27b0', 20: '#00bcd4',
  21: '#4cae3d', 22: '#de1b0c', 23: '#f5a623', 24: '#ef4444', 25: '#e91e63',
  26: '#78909c', 27: '#ff9800', 28: '#607d8b',
}

// ─── Channel filter ───────────────────────────────────────────────────────────
// Every chart on this page is driven off the channel split established by the funnel
// (Call 600 / Text 300 / Webchat 100 of 1,000). Deselecting a channel in the "Channels" filter
// re-derives the whole page from there: the funnel is recomputed exactly (each downstream node
// rescaled by how much of its inflow survived the filter, preserving flow conservation column to
// column), and every other chart — which only has aggregate, not per-channel, data — scales by
// the resulting ratio of filtered-to-total volume. Only "Interaction/Conversation/Session trend
// by channel" and "Conversations by channel" are true per-channel data, so those filter exactly
// instead of scaling.
const CHANNEL_KEYS = ['call', 'text', 'webchat'] as const
type ChannelKey = typeof CHANNEL_KEYS[number]
const CHANNEL_NODE_INDEX: Record<ChannelKey, number> = { call: 0, text: 1, webchat: 2 }
const FUNNEL_NODE_BASE_NAMES = [
  'Call', 'Text', 'Webchat',
  'AI agents involved', 'Human involved', 'Not answered',
  'Resolved', 'Not resolved',
  'Scheduled', 'Rescheduled', 'Cancelled', 'Information provided',
  'Human transfer', 'Action pending', 'Incomplete interaction', 'Other',
  'Payment and billing', 'Insurance coverage', 'Treatment related', 'Referrals', 'General enquiry',
  'Call attended', 'Call not attended',
  'Follow up',
  'Call disconnected', 'Abandoned',
  'Wrong numbers', 'Sales calls', 'Human resources',
]
const FUNNEL_COLUMNS = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7],
  [8, 9, 10, 11, 12, 13, 14, 15],
  [16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28],
]

function computeFilteredFunnel(selectedChannels: ChannelKey[]) {
  const selectedIdx = new Set(selectedChannels.map((c) => CHANNEL_NODE_INDEX[c]))

  const originalIncoming: Record<number, number> = {}
  const originalChannelTotal: Record<number, number> = { 0: 0, 1: 0, 2: 0 }
  for (const l of FUNNEL_LINKS) {
    originalIncoming[l.target as number] = (originalIncoming[l.target as number] ?? 0) + l.value
    const s = l.source as number
    if (s === 0 || s === 1 || s === 2) originalChannelTotal[s] += l.value
  }

  // Walk the links in channel → involvement → status → outcome → sub-outcome order. Channel links
  // are hard-filtered; every link past that is scaled by how much of its source node's inflow
  // survived filtering, so each node's outflow always sums back to exactly its (possibly reduced)
  // inflow — real flow conservation, not a single global ratio.
  const newIncoming: Record<number, number> = {}
  const newLinks: SankeyLink[] = []
  for (const l of FUNNEL_LINKS) {
    const s = l.source as number
    if (s === 0 || s === 1 || s === 2) {
      if (selectedIdx.has(s)) {
        newLinks.push({ ...l })
        newIncoming[l.target as number] = (newIncoming[l.target as number] ?? 0) + l.value
      }
    } else {
      const orig = originalIncoming[s] ?? 0
      const now = newIncoming[s] ?? 0
      const scale = orig > 0 ? now / orig : 0
      const val = Math.round(l.value * scale)
      if (val > 0) {
        newLinks.push({ ...l, value: val })
        newIncoming[l.target as number] = (newIncoming[l.target as number] ?? 0) + val
      }
    }
  }

  const nodeTotal = (i: number) => (i <= 2 ? (selectedIdx.has(i) ? originalChannelTotal[i] : 0) : (newIncoming[i] ?? 0))

  const nodes: SankeyNode[] = FUNNEL_COLUMNS.flatMap((col) => {
    const colTotal = col.reduce((sum, i) => sum + nodeTotal(i), 0)
    return col.map((i) => {
      const pct = colTotal > 0 ? Math.round((nodeTotal(i) / colTotal) * 100) : 0
      return { name: `${FUNNEL_NODE_BASE_NAMES[i]} ${pct}%` }
    })
  })

  const grandTotal = CHANNEL_KEYS.reduce((sum, k) => sum + (selectedIdx.has(CHANNEL_NODE_INDEX[k]) ? originalChannelTotal[CHANNEL_NODE_INDEX[k]] : 0), 0)

  return { nodes, links: newLinks, grandTotal, resolvedTotal: nodeTotal(6) }
}

// Office hours vs after hours, by intent — AI agent-handled calls only (700 total)
const INTENT_DATA = [
  { intent: 'General inquiry', office: 200, after: 10 },
  { intent: 'Scheduling',     office: 300, after: 30 },
  { intent: 'Reschedule',     office: 50,  after: 20 },
  { intent: 'Cancellation',   office: 30,  after: 20 },
  { intent: 'Prescription',   office: 5,   after: 5  },
  { intent: 'Lab results',    office: 5,   after: 5  },
  { intent: 'Other',          office: 10,  after: 10 },
]
const INTENT_SERIES = [
  { key: 'office', label: 'Office hours', color: '#7c4dff' },
  { key: 'after',  label: 'After hours',  color: '#c4b1f7' },
]

// Six-month office/after-hours trend per intent — same categories as the chart above.
// July matches INTENT_DATA exactly; earlier months trend up from there.
const INTENT_TREND_MONTHS = ['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul']
const INTENT_TREND_BY_INTENT: Record<string, Array<{ office: number; after: number }>> = {
  'General inquiry': [
    { office: 140, after: 6 }, { office: 160, after: 7 }, { office: 175, after: 8 },
    { office: 185, after: 9 }, { office: 195, after: 9 }, { office: 200, after: 10 },
  ],
  'Scheduling': [
    { office: 210, after: 20 }, { office: 240, after: 23 }, { office: 265, after: 26 },
    { office: 280, after: 28 }, { office: 290, after: 29 }, { office: 300, after: 30 },
  ],
  'Reschedule': [
    { office: 35, after: 14 }, { office: 40, after: 16 }, { office: 44, after: 17 },
    { office: 47, after: 18 }, { office: 49, after: 19 }, { office: 50, after: 20 },
  ],
  'Cancellation': [
    { office: 21, after: 14 }, { office: 24, after: 16 }, { office: 26, after: 17 },
    { office: 28, after: 18 }, { office: 29, after: 19 }, { office: 30, after: 20 },
  ],
  'Prescription': [
    { office: 3, after: 3 }, { office: 4, after: 4 }, { office: 4, after: 4 },
    { office: 5, after: 4 }, { office: 5, after: 5 }, { office: 5, after: 5 },
  ],
  'Lab results': [
    { office: 3, after: 3 }, { office: 4, after: 4 }, { office: 4, after: 4 },
    { office: 5, after: 4 }, { office: 5, after: 5 }, { office: 5, after: 5 },
  ],
  'Other': [
    { office: 7, after: 7 }, { office: 8, after: 8 }, { office: 9, after: 8 },
    { office: 9, after: 9 }, { office: 10, after: 9 }, { office: 10, after: 10 },
  ],
}
const INTENT_OPTIONS = Object.keys(INTENT_TREND_BY_INTENT)

interface IntentRow {
  intent: string
  officeHours: number
  afterHours: number
  totalCalls: number
  resolvedPct: string
  notResolvedPct: string
  [key: string]: string | number
}
function getIntentColumns(): Column<IntentRow>[] {
  return [
    { key: 'intent',         label: 'Intent',            width: 180, sortable: true },
    { key: 'officeHours',    label: 'Office hours',      width: 160, sortable: true },
    { key: 'afterHours',     label: 'After hours',       width: 160, sortable: true },
    { key: 'totalCalls',     label: 'Total',              width: 130, sortable: true },
    { key: 'resolvedPct',    label: 'Resolved',           width: 130, sortable: true, render: (v) => <span className="text-chip-success-text">{v as string}</span> },
    { key: 'notResolvedPct', label: 'Not resolved',       width: 130, sortable: true, render: (v) => <span className="text-chip-warning-text">{v as string}</span> },
  ]
}

// ─── Copied from Front desk overview ─────────────────────────────────────────


const INSURANCE_DATA = [
  { month: 'Dec', verified: 464 },
  { month: 'Jan', verified: 194 },
  { month: 'Feb', verified: 288 },
  { month: 'Mar', verified: 178 },
  { month: 'Apr', verified: 461 },
  { month: 'May', verified: 297 },
]
const INSURANCE_SERIES = [{ key: 'verified', label: 'Verified', color: '#1976d2' }]

// ─── Ratio-scaled datasets ─────────────────────────────────────────────────────
// None of these have per-channel data behind them, so a channel filter scales every value by
// the funnel's filtered/full ratio — same shape, smaller volume. "Interaction trend by channel"
// and "Conversations by channel" (below) are real per-channel data and filter exactly instead.
function scaleRows<T extends Record<string, unknown>>(rows: T[], keys: (keyof T)[], ratio: number): T[] {
  return rows.map((row) => {
    const next = { ...row }
    for (const k of keys) {
      if (typeof row[k] === 'number') next[k] = Math.round((row[k] as number) * ratio) as T[keyof T]
    }
    return next
  })
}
const getInvolvementTrendData = (ratio: number) => scaleRows(INVOLVEMENT_TREND_DATA, ['myna', 'human', 'notAnswered'], ratio)
const getTimingTrendData = (ratio: number) => scaleRows(TIMING_TREND_DATA, ['office', 'after'], ratio)

const OUTCOME_TREND_SERIES = [
  { key: 'scheduled',             label: 'Scheduled',              color: '#e056c7' },
  { key: 'rescheduled',           label: 'Rescheduled',            color: '#8bc34a' },
  { key: 'cancelled',             label: 'Cancelled',              color: '#f59e0b' },
  { key: 'informationProvided',   label: 'Information provided',   color: '#00bcd4' },
  { key: 'humanTransfer',         label: 'Human transfer',         color: '#f5a623' },
  { key: 'actionPending',         label: 'Action pending',         color: '#9c27b0' },
  { key: 'incompleteInteraction', label: 'Incomplete interaction', color: '#ef4444' },
  { key: 'other',                 label: 'Other',                  color: '#78909c' },
]
const INVOLVEMENT_FILTER_OPTIONS = ['All involvements', 'AI agents involved', 'Human involved']

function getOutcomeTrendData(involvement: string, ratio: number, viewMode: ViewMode) {
  return OUTCOME_MONTHLY_TOTALS.map((row) => {
    const total = scaleForViewMode(Math.round(row.total * ratio), viewMode)
    const out: Record<string, string | number> = { month: row.month }

    const fillResolved = (bucketTotal: number) => {
      for (const key of RESOLVED_OUTCOME_KEYS) {
        out[key] = Math.round(bucketTotal * (FUNNEL_OUTCOME_VOLUMES[key] / RESOLVED_OUTCOME_TOTAL))
      }
    }
    const fillNotResolved = (bucketTotal: number) => {
      for (const key of NOT_RESOLVED_OUTCOME_KEYS) {
        out[key] = Math.round(bucketTotal * (FUNNEL_OUTCOME_VOLUMES[key] / NOT_RESOLVED_OUTCOME_TOTAL))
      }
    }
    const zeroNotResolved = () => {
      for (const key of NOT_RESOLVED_OUTCOME_KEYS) out[key] = 0
    }

    if (involvement === 'Human involved') {
      const humanTotal = Math.round(total * 0.28)
      fillResolved(humanTotal)
      zeroNotResolved()
    } else if (involvement === 'AI agents involved') {
      const aiTotal = Math.round(total * 0.70)
      const aiResolved = Math.round(aiTotal * (390 / 700))
      const aiNotResolved = aiTotal - aiResolved
      fillResolved(aiResolved)
      fillNotResolved(aiNotResolved)
    } else {
      for (const key of RESOLVED_OUTCOME_KEYS) {
        out[key] = Math.round(total * (FUNNEL_OUTCOME_VOLUMES[key] / 1000))
      }
      for (const key of NOT_RESOLVED_OUTCOME_KEYS) {
        out[key] = Math.round(total * (FUNNEL_OUTCOME_VOLUMES[key] / 1000))
      }
    }
    return out
  })
}

function getUniquePatientsTrendData(selectedChannels: ChannelKey[], viewMode: ViewMode) {
  const selected = new Set(selectedChannels)
  return UNIQUE_PATIENTS_TREND_DATA.map((row) => ({
    month: row.month,
    call: selected.has('call') ? scaleForViewMode(row.call, viewMode) : 0,
    text: selected.has('text') ? scaleForViewMode(row.text, viewMode) : 0,
    webchat: selected.has('webchat') ? scaleForViewMode(row.webchat, viewMode) : 0,
  }))
}
const getIntentData = (ratio: number) => scaleRows(INTENT_DATA, ['office', 'after'], ratio)
const INTENT_STATUS_BY_INTENT: Record<string, { resolved: number; notResolved: number }> = {
  'General inquiry': { resolved: 82, notResolved: 18 },
  'Scheduling':      { resolved: 91, notResolved: 9  },
  'Reschedule':      { resolved: 88, notResolved: 12 },
  'Cancellation':    { resolved: 86, notResolved: 14 },
  'Prescription':    { resolved: 79, notResolved: 21 },
  'Lab results':     { resolved: 84, notResolved: 16 },
  'Other':           { resolved: 75, notResolved: 25 },
}
function getIntentTableData(ratio: number): IntentRow[] {
  return getIntentData(ratio).map((d) => {
    const status = INTENT_STATUS_BY_INTENT[d.intent] ?? { resolved: 80, notResolved: 20 }
    return {
      intent: d.intent,
      officeHours: d.office,
      afterHours: d.after,
      totalCalls: d.office + d.after,
      resolvedPct: `${status.resolved}%`,
      notResolvedPct: `${status.notResolved}%`,
    }
  })
}
function getIntentTrendForIntent(intent: string, ratio: number) {
  return (INTENT_TREND_BY_INTENT[intent] ?? []).map((m) => ({
    office: Math.round(m.office * ratio),
    after: Math.round(m.after * ratio),
  }))
}
function getInsuranceData(ratio: number) {
  return scaleRows(INSURANCE_DATA, ['verified'], ratio)
}
const scaleK = (value: number, ratio: number, suffix: 'K' | 'k' = 'K') => `${(value * ratio).toFixed(1)}${suffix}`

// Real per-channel totals, unlike everything above — a channel filter here is exact, not scaled.
const CHANNEL_TOTALS: Record<ChannelKey, number> = { call: 600, text: 300, webchat: 100 }
const CHANNEL_LABELS: Record<ChannelKey, string> = { call: 'Call', text: 'Text', webchat: 'Webchat' }
const CHANNEL_COLORS: Record<ChannelKey, string> = { call: '#1976d2', text: '#3f51b5', webchat: '#9c27b0' }
const formatCompact = (n: number) => (n >= 1000 ? `${parseFloat((n / 1000).toFixed(1))}K` : `${n}`)
function getChannelStats(selectedChannels: ChannelKey[]) {
  const selected = new Set(selectedChannels)
  return CHANNEL_KEYS.map((k) => ({ value: selected.has(k) ? CHANNEL_TOTALS[k].toLocaleString() : '0', label: CHANNEL_LABELS[k] }))
}
function getChannelDonut(selectedChannels: ChannelKey[]) {
  const selected = new Set(selectedChannels)
  return CHANNEL_KEYS.filter((k) => selected.has(k)).map((k) => ({ name: CHANNEL_LABELS[k], value: CHANNEL_TOTALS[k], color: CHANNEL_COLORS[k] }))
}
function getChannelTrendData(viewMode: ViewMode) {
  return CHANNEL_TREND_DATA.map((row) => ({
    month: row.month,
    call: scaleForViewMode(row.call, viewMode),
    text: scaleForViewMode(row.text, viewMode),
    webchat: scaleForViewMode(row.webchat, viewMode),
  }))
}
function getChannelTrendSeries(selectedChannels: ChannelKey[]) {
  const selected = new Set(selectedChannels)
  return CHANNEL_TREND_SERIES.filter((s) => selected.has(s.key as ChannelKey))
}

// ─── Interactions by location ─────────────────────────────────────────────────
// Location is always the row (first column). The dropdown only picks which
// breakdown — channel, outcome, or sub-outcome — fills in the rest of the columns.
// Every column's total across locations reconciles with the totals established above.

const DIMENSION_OPTIONS = ['Channel', 'Status', 'Outcomes', 'Sub-outcomes']

const LOCATIONS = [
  { label: 'North Clinic',    total: 220 },
  { label: 'South Clinic',    total: 190 },
  { label: 'Downtown Clinic', total: 170 },
  { label: 'East Clinic',     total: 150 },
  { label: 'West Clinic',     total: 140 },
  { label: 'Uptown Clinic',   total: 130 },
]

// City/state/region roll-up for each clinic — North & Uptown share Chicago/Illinois,
// South & East share Texas (different cities), so city/state/region views genuinely
// aggregate rows together rather than just relabeling them 1:1.
const LOCATION_META: Record<string, { city: string; state: string; region: string }> = {
  'North Clinic':    { city: 'Chicago',     state: 'Illinois',   region: 'Midwest' },
  'Uptown Clinic':   { city: 'Chicago',     state: 'Illinois',   region: 'Midwest' },
  'South Clinic':    { city: 'Austin',      state: 'Texas',      region: 'South' },
  'East Clinic':     { city: 'Houston',     state: 'Texas',      region: 'South' },
  'Downtown Clinic': { city: 'New York',    state: 'New York',   region: 'Northeast' },
  'West Clinic':     { city: 'Los Angeles', state: 'California', region: 'West' },
}

const LEVEL_OPTIONS = ['By location', 'By city', 'By state', 'By region']
const LEVEL_COLUMN_LABEL: Record<string, string> = {
  'By location': 'Location',
  'By city': 'City',
  'By state': 'State',
  'By region': 'Region',
}
function getLevelTitle(forms: NounForms): Record<string, string> {
  return {
    'By location': `${forms.capPlural} by location`,
    'By city': `${forms.capPlural} by city`,
    'By state': `${forms.capPlural} by state`,
    'By region': `${forms.capPlural} by region`,
  }
}

function groupKeyOf(level: string, locationLabel: string): string {
  if (level === 'By location') return locationLabel
  const meta = LOCATION_META[locationLabel]
  return level === 'By city' ? meta.city : level === 'By state' ? meta.state : meta.region
}

// Unique group labels for a level, ordered largest total first (same convention as LOCATIONS).
function groupsForLevel(level: string): string[] {
  const totals = new Map<string, number>()
  for (const l of LOCATIONS) {
    const key = groupKeyOf(level, l.label)
    totals.set(key, (totals.get(key) ?? 0) + l.total)
  }
  return [...totals.entries()].sort((a, b) => b[1] - a[1]).map(([label]) => label)
}

function membersOfGroup(level: string, group: string): string[] {
  return LOCATIONS.filter((l) => groupKeyOf(level, l.label) === group).map((l) => l.label)
}

function sumField<T extends Record<string, number>>(breakdown: Record<string, T>, members: string[], field: keyof T): number {
  return members.reduce((sum, m) => sum + (breakdown[m]?.[field] ?? 0), 0)
}

const LOCATION_CHANNEL_BREAKDOWN: Record<string, { call: number; text: number; webchat: number }> = {
  'North Clinic':    { call: 132, text: 66, webchat: 22 },
  'South Clinic':    { call: 114, text: 57, webchat: 19 },
  'Downtown Clinic': { call: 102, text: 51, webchat: 17 },
  'East Clinic':     { call: 90,  text: 45, webchat: 15 },
  'West Clinic':     { call: 84,  text: 42, webchat: 14 },
  'Uptown Clinic':   { call: 78,  text: 39, webchat: 13 },
}

// "Pending" moved here from the sub-outcome breakdown below — each location's resolved total is
// reduced by exactly its not-resolved count so the location's overall total is unchanged.
function locationOutcomeFromShare(locationTotal: number) {
  const share = locationTotal / 1000
  return {
    scheduled: Math.round(FUNNEL_OUTCOME_VOLUMES.scheduled * share),
    rescheduled: Math.round(FUNNEL_OUTCOME_VOLUMES.rescheduled * share),
    cancelled: Math.round(FUNNEL_OUTCOME_VOLUMES.cancelled * share),
    informationProvided: Math.round(FUNNEL_OUTCOME_VOLUMES.informationProvided * share),
    humanTransfer: Math.round(FUNNEL_OUTCOME_VOLUMES.humanTransfer * share),
    actionPending: Math.round(FUNNEL_OUTCOME_VOLUMES.actionPending * share),
    incompleteInteraction: Math.round(FUNNEL_OUTCOME_VOLUMES.incompleteInteraction * share),
    other: Math.round(FUNNEL_OUTCOME_VOLUMES.other * share),
  }
}

function locationSuboutcomeFromShare(locationTotal: number) {
  const share = locationTotal / 1000
  return {
    paymentBilling: Math.round(FUNNEL_SUBOUTCOME_VOLUMES.paymentBilling * share),
    insuranceCoverage: Math.round(FUNNEL_SUBOUTCOME_VOLUMES.insuranceCoverage * share),
    treatmentRelated: Math.round(FUNNEL_SUBOUTCOME_VOLUMES.treatmentRelated * share),
    referrals: Math.round(FUNNEL_SUBOUTCOME_VOLUMES.referrals * share),
    generalEnquiry: Math.round(FUNNEL_SUBOUTCOME_VOLUMES.generalEnquiry * share),
    callAttended: Math.round(FUNNEL_SUBOUTCOME_VOLUMES.callAttended * share),
    callNotAttended: Math.round(FUNNEL_SUBOUTCOME_VOLUMES.callNotAttended * share),
    followUp: Math.round(FUNNEL_SUBOUTCOME_VOLUMES.followUp * share),
    callDisconnected: Math.round(FUNNEL_SUBOUTCOME_VOLUMES.callDisconnected * share),
    abandoned: Math.round(FUNNEL_SUBOUTCOME_VOLUMES.abandoned * share),
    wrongNumbers: Math.round(FUNNEL_SUBOUTCOME_VOLUMES.wrongNumbers * share),
    salesCalls: Math.round(FUNNEL_SUBOUTCOME_VOLUMES.salesCalls * share),
    humanResources: Math.round(FUNNEL_SUBOUTCOME_VOLUMES.humanResources * share),
  }
}

const LOCATION_OUTCOME_BREAKDOWN: Record<string, ReturnType<typeof locationOutcomeFromShare>> = Object.fromEntries(
  LOCATIONS.map((l) => [l.label, locationOutcomeFromShare(l.total)]),
)

const LOCATION_SUBOUTCOME_BREAKDOWN: Record<string, ReturnType<typeof locationSuboutcomeFromShare>> = Object.fromEntries(
  LOCATIONS.map((l) => [l.label, locationSuboutcomeFromShare(l.total)]),
)

interface LocationBreakdownRow {
  location: string
  [key: string]: string | number
}

// Single-select list panel — same visual language as DateRangeSelector's dropdown.
// "- {value} ⌄" inline next to a card title — matches the ChartCard title's own font size exactly
// (16px/24px/-0.32px), not the larger text-h3 scale, so it reads as part of the same heading.
// The panel itself is the shared SelectMenu (single-select) — same colors/fonts/checkmark as
// every other dropdown in the app.
function InlineHeadingDropdown({
  value,
  options,
  onChange,
}: {
  value: string
  options: string[]
  onChange: (next: string) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  return (
    <div ref={ref} className="relative flex items-center gap-xs">
      <span className="text-[16px] leading-6 tracking-[-0.32px] text-text-tertiary">-</span>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-xs text-[16px] leading-6 tracking-[-0.32px] text-text-action"
      >
        {value}
        <Icon name="expand_more" size={18} />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-[110] mt-xs min-w-[200px]">
          <SelectMenu
            options={options.map((opt) => ({ value: opt, label: opt }))}
            value={[value]}
            searchable={false}
            onChange={([next]) => { onChange(next); setOpen(false) }}
          />
        </div>
      )}
    </div>
  )
}

function OutcomeTrendCard({ forms, ratio, viewMode }: { forms: NounForms; ratio: number; viewMode: ViewMode }) {
  const [involvement, setInvolvement] = useState('All involvements')
  const chartData = getOutcomeTrendData(involvement, ratio, viewMode)

  return (
    <HCCard
      title="Outcome trend"
      titleSuffix={
        <>
          <InlineHeadingDropdown value={involvement} options={INVOLVEMENT_FILTER_OPTIONS} onChange={setInvolvement} />
          <InfoTooltip text={`Monthly breakdown of ${forms.lowPlural} by outcome — scheduled, rescheduled, cancelled, information provided, human transfer, action pending, incomplete interaction, and other — aligned with the funnel status model.`} />
        </>
      }
    >
      <StackedBarChart
        data={chartData}
        series={OUTCOME_TREND_SERIES}
        xKey="month"
        height={280}
        showBarLabels
      />
    </HCCard>
  )
}

// Trend of office hours vs. after hours volume for the selected intent — helps identify which
// intents are being handled after hours. Reuses the same StackedBarChart used elsewhere.
function IntentTrendCard({ forms, ratio }: { forms: NounForms; ratio: number }) {
  const [selectedIntent, setSelectedIntent] = useState('General inquiry')

  const filteredIntentTrend = getIntentTrendForIntent(selectedIntent, ratio)
  const chartData = INTENT_TREND_MONTHS.map((month, i) => ({
    month,
    office: filteredIntentTrend[i]?.office ?? 0,
    after: filteredIntentTrend[i]?.after ?? 0,
  }))

  return (
    <HCCard
      title={`${forms.capPlural} intent trend analysis`}
      titleSuffix={
        <>
          <InlineHeadingDropdown value={selectedIntent} options={INTENT_OPTIONS} onChange={setSelectedIntent} />
          <InfoTooltip text="Monthly office hours vs. after-hours trend for the selected intent, highlighting which intents are addressed after hours" />
        </>
      }
    >
      <StackedBarChart
        data={chartData}
        series={INTENT_SERIES}
        xKey="month"
        height={280}
        showBarLabels
      />
    </HCCard>
  )
}

// Same "Interactions by X" totals (1,000) reshaped by whichever dimension is selected.
// Two-segment progress bar (resolved vs. remainder) with the split called out underneath —
// same visual language as the rate bars used elsewhere in reporting tables.
function ResolutionRateBar({ rate }: { rate: number }) {
  return (
    <div className="flex w-full flex-col gap-xs py-xs">
      <div className="flex h-2 w-full overflow-hidden rounded-full bg-surface-selected">
        <div className="h-full rounded-full bg-accent-positive" style={{ width: `${rate}%` }} />
      </div>
      <div className="flex items-center justify-between text-small">
        <span className="text-chip-success-text">{rate}%</span>
        <span className="text-text-tertiary">{100 - rate}%</span>
      </div>
    </div>
  )
}

const RESOLUTION_RATE_COLUMN: Column<LocationBreakdownRow> = {
  key: 'resolutionRate',
  label: 'Resolution rate',
  width: 200,
  sortable: true,
  render: (v) => <ResolutionRateBar rate={v as number} />,
}

// Skeleton rows shown for a beat while the table reshapes around a new location-hierarchy level.
function LocationTableSkeleton({ columnCount }: { columnCount: number }) {
  return (
    <div className="flex flex-col">
      {Array.from({ length: 6 }).map((_, r) => (
        <div key={r} className="flex items-center gap-lg border-b border-border px-[10px] last:border-0" style={{ height: 64 }}>
          {Array.from({ length: columnCount }).map((_, c) => (
            <div
              key={c}
              className="h-3 flex-1 animate-pulse rounded-sm bg-surface-selected"
              style={{ animationDelay: `${(r * columnCount + c) * 25}ms` }}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

function scaleCount(value: number, viewMode: ViewMode) {
  return scaleForViewMode(value, viewMode)
}

function InteractionsByDimensionCard({ forms, selectedChannels, viewMode }: { forms: NounForms; selectedChannels: ChannelKey[]; viewMode: ViewMode }) {
  const [dimension, setDimension] = useState('Outcomes')
  const [level, setLevel] = useState('By location')
  const [loading, setLoading] = useState(false)

  // Simulate a fresh fetch whenever the location-hierarchy level changes.
  useEffect(() => {
    setLoading(true)
    const t = setTimeout(() => setLoading(false), 700)
    return () => clearTimeout(t)
  }, [level])

  // No per-location per-channel outcome/sub-outcome data exists, so — same as the rest of the
  // page — everything but the Channel columns themselves scales by this group's own channel mix
  // (exact, since LOCATION_CHANNEL_BREAKDOWN really is per-channel) rather than one flat ratio.
  const rows = groupsForLevel(level).map((group) => {
    const members = membersOfGroup(level, group)
    const fullTotal = members.reduce((sum, m) => sum + (LOCATIONS.find((l) => l.label === m)?.total ?? 0), 0)
    const rawTotal = selectedChannels.reduce((sum, ch) => sum + sumField(LOCATION_CHANNEL_BREAKDOWN, members, ch), 0)
    const channelShare = fullTotal > 0 ? rawTotal / fullTotal : 0
    const rawResolved = Math.round(
      RESOLVED_OUTCOME_KEYS.reduce((sum, k) => sum + sumField(LOCATION_OUTCOME_BREAKDOWN, members, k), 0) * channelShare,
    )
    const rawNotResolved = Math.round(
      NOT_RESOLVED_OUTCOME_KEYS.reduce((sum, k) => sum + sumField(LOCATION_OUTCOME_BREAKDOWN, members, k), 0) * channelShare,
    )
    const totalInteractions = scaleCount(rawTotal, viewMode)
    const resolved = scaleCount(rawResolved, viewMode)
    const notResolved = scaleCount(rawNotResolved, viewMode)
    const resolutionRate = rawTotal > 0 ? Math.round((rawResolved / rawTotal) * 100) : 0
    return { group, members, totalInteractions, resolved, notResolved, resolutionRate, channelShare }
  })

  let columns: Column<LocationBreakdownRow>[]
  let data: LocationBreakdownRow[]

  // Real total for the group — resolved + transferred + missed — shown right after
  // the location column in every view, so it's always clear how big a group is before
  // drilling into its channel/outcome/sub-outcome split.
  const TOTAL_INTERACTIONS_COLUMN: Column<LocationBreakdownRow> = {
    key: 'totalInteractions', label: 'Total', width: 160, sortable: true,
  }
  const LOCATION_COLUMN: Column<LocationBreakdownRow> = {
    key: 'location', label: LEVEL_COLUMN_LABEL[level], width: 180, sortable: true,
  }

  if (dimension === 'Outcomes') {
    columns = [
      LOCATION_COLUMN,
      TOTAL_INTERACTIONS_COLUMN,
      { key: 'scheduled',             label: 'Scheduled',              width: 120, sortable: true },
      { key: 'rescheduled',           label: 'Rescheduled',            width: 120, sortable: true },
      { key: 'cancelled',             label: 'Cancelled',              width: 110, sortable: true },
      { key: 'informationProvided',   label: 'Information provided',   width: 160, sortable: true },
      { key: 'humanTransfer',         label: 'Human transfer',         width: 130, sortable: true },
      { key: 'actionPending',         label: 'Action pending',         width: 130, sortable: true },
      { key: 'incompleteInteraction', label: 'Incomplete interaction', width: 160, sortable: true },
      { key: 'other',                 label: 'Other',                  width: 100, sortable: true },
    ]
    data = rows.map((r) => ({
      location: r.group,
      totalInteractions: r.totalInteractions,
      scheduled: scaleCount(Math.round(sumField(LOCATION_OUTCOME_BREAKDOWN, r.members, 'scheduled') * r.channelShare), viewMode),
      rescheduled: scaleCount(Math.round(sumField(LOCATION_OUTCOME_BREAKDOWN, r.members, 'rescheduled') * r.channelShare), viewMode),
      cancelled: scaleCount(Math.round(sumField(LOCATION_OUTCOME_BREAKDOWN, r.members, 'cancelled') * r.channelShare), viewMode),
      informationProvided: scaleCount(Math.round(sumField(LOCATION_OUTCOME_BREAKDOWN, r.members, 'informationProvided') * r.channelShare), viewMode),
      humanTransfer: scaleCount(Math.round(sumField(LOCATION_OUTCOME_BREAKDOWN, r.members, 'humanTransfer') * r.channelShare), viewMode),
      actionPending: scaleCount(Math.round(sumField(LOCATION_OUTCOME_BREAKDOWN, r.members, 'actionPending') * r.channelShare), viewMode),
      incompleteInteraction: scaleCount(Math.round(sumField(LOCATION_OUTCOME_BREAKDOWN, r.members, 'incompleteInteraction') * r.channelShare), viewMode),
      other: scaleCount(Math.round(sumField(LOCATION_OUTCOME_BREAKDOWN, r.members, 'other') * r.channelShare), viewMode),
    }))
  } else if (dimension === 'Status') {
    columns = [
      LOCATION_COLUMN,
      TOTAL_INTERACTIONS_COLUMN,
      { key: 'resolved',    label: 'Resolved',     width: 130, sortable: true },
      { key: 'notResolved', label: 'Not resolved', width: 130, sortable: true },
      RESOLUTION_RATE_COLUMN,
    ]
    data = rows.map((r) => ({
      location: r.group,
      totalInteractions: r.totalInteractions,
      resolved: r.resolved,
      notResolved: r.notResolved,
      resolutionRate: r.resolutionRate,
    }))
  } else if (dimension === 'Sub-outcomes') {
    columns = [
      LOCATION_COLUMN,
      TOTAL_INTERACTIONS_COLUMN,
      { key: 'paymentBilling',    label: 'Payment and billing',    width: 150, sortable: true },
      { key: 'insuranceCoverage', label: 'Insurance coverage',     width: 150, sortable: true },
      { key: 'treatmentRelated',  label: 'Treatment related',      width: 140, sortable: true },
      { key: 'referrals',         label: 'Referrals',              width: 110, sortable: true },
      { key: 'generalEnquiry',    label: 'General enquiry',        width: 130, sortable: true },
      { key: 'callAttended',      label: 'Call attended',          width: 120, sortable: true },
      { key: 'callNotAttended',   label: 'Call not attended',      width: 140, sortable: true },
      { key: 'followUp',          label: 'Follow up',              width: 110, sortable: true },
      { key: 'callDisconnected',  label: 'Call disconnected',      width: 140, sortable: true },
      { key: 'abandoned',         label: 'Abandoned',              width: 110, sortable: true },
      { key: 'wrongNumbers',      label: 'Wrong numbers',          width: 120, sortable: true },
      { key: 'salesCalls',        label: 'Sales calls',            width: 110, sortable: true },
      { key: 'humanResources',    label: 'Human resources',        width: 130, sortable: true },
    ]
    data = rows.map((r) => ({
      location: r.group,
      totalInteractions: r.totalInteractions,
      paymentBilling: scaleCount(Math.round(sumField(LOCATION_SUBOUTCOME_BREAKDOWN, r.members, 'paymentBilling') * r.channelShare), viewMode),
      insuranceCoverage: scaleCount(Math.round(sumField(LOCATION_SUBOUTCOME_BREAKDOWN, r.members, 'insuranceCoverage') * r.channelShare), viewMode),
      treatmentRelated: scaleCount(Math.round(sumField(LOCATION_SUBOUTCOME_BREAKDOWN, r.members, 'treatmentRelated') * r.channelShare), viewMode),
      referrals: scaleCount(Math.round(sumField(LOCATION_SUBOUTCOME_BREAKDOWN, r.members, 'referrals') * r.channelShare), viewMode),
      generalEnquiry: scaleCount(Math.round(sumField(LOCATION_SUBOUTCOME_BREAKDOWN, r.members, 'generalEnquiry') * r.channelShare), viewMode),
      callAttended: scaleCount(Math.round(sumField(LOCATION_SUBOUTCOME_BREAKDOWN, r.members, 'callAttended') * r.channelShare), viewMode),
      callNotAttended: scaleCount(Math.round(sumField(LOCATION_SUBOUTCOME_BREAKDOWN, r.members, 'callNotAttended') * r.channelShare), viewMode),
      followUp: scaleCount(Math.round(sumField(LOCATION_SUBOUTCOME_BREAKDOWN, r.members, 'followUp') * r.channelShare), viewMode),
      callDisconnected: scaleCount(Math.round(sumField(LOCATION_SUBOUTCOME_BREAKDOWN, r.members, 'callDisconnected') * r.channelShare), viewMode),
      abandoned: scaleCount(Math.round(sumField(LOCATION_SUBOUTCOME_BREAKDOWN, r.members, 'abandoned') * r.channelShare), viewMode),
      wrongNumbers: scaleCount(Math.round(sumField(LOCATION_SUBOUTCOME_BREAKDOWN, r.members, 'wrongNumbers') * r.channelShare), viewMode),
      salesCalls: scaleCount(Math.round(sumField(LOCATION_SUBOUTCOME_BREAKDOWN, r.members, 'salesCalls') * r.channelShare), viewMode),
      humanResources: scaleCount(Math.round(sumField(LOCATION_SUBOUTCOME_BREAKDOWN, r.members, 'humanResources') * r.channelShare), viewMode),
    }))
  } else {
    columns = [
      LOCATION_COLUMN,
      TOTAL_INTERACTIONS_COLUMN,
      { key: 'call',    label: 'Call',    width: 120, sortable: true },
      { key: 'text',    label: 'Text',    width: 120, sortable: true },
      { key: 'webchat', label: 'Webchat', width: 120, sortable: true },
      RESOLUTION_RATE_COLUMN,
    ]
    const isSelected = new Set(selectedChannels)
    data = rows.map((r) => ({
      location: r.group,
      totalInteractions: r.totalInteractions,
      call: isSelected.has('call') ? scaleCount(sumField(LOCATION_CHANNEL_BREAKDOWN, r.members, 'call'), viewMode) : 0,
      text: isSelected.has('text') ? scaleCount(sumField(LOCATION_CHANNEL_BREAKDOWN, r.members, 'text'), viewMode) : 0,
      webchat: isSelected.has('webchat') ? scaleCount(sumField(LOCATION_CHANNEL_BREAKDOWN, r.members, 'webchat'), viewMode) : 0,
      resolutionRate: r.resolutionRate,
    }))
  }

  return (
    <HCCard
      title={getLevelTitle(forms)[level]}
      titleSuffix={
        <>
          <InlineHeadingDropdown value={dimension} options={DIMENSION_OPTIONS} onChange={setDimension} />
          <InfoTooltip text={`Each location's ${forms.lowSingular} volume broken down by channel, status, outcome, or sub-outcome. Switch the view with the dropdown.`} />
        </>
      }
      toolbar={<DateRangeSelector value={level} options={LEVEL_OPTIONS} onChange={setLevel} />}
    >
      {loading ? (
        <LocationTableSkeleton columnCount={columns.length} />
      ) : (
        <DataTable columns={columns} data={data} rowHeight={64} stickyFirstColumn />
      )}
    </HCCard>
  )
}

// Full-page skeleton shown for a beat while filters reshape every chart on the page at once.
const SKELETON_BLOCK_HEIGHTS = [440, 280, 280, 280, 280, 280, 280, 340, 300, 260, 320, 260, 300]
function PageSkeleton() {
  return (
    <div className="flex flex-col gap-lg p-2xl">
      <div className="grid grid-cols-4 gap-lg">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-sm bg-surface-selected" style={{ animationDelay: `${i * 40}ms` }} />
        ))}
      </div>
      {SKELETON_BLOCK_HEIGHTS.map((h, i) => (
        <div key={i} className="animate-pulse rounded-sm bg-surface-selected" style={{ height: h, animationDelay: `${i * 40}ms` }} />
      ))}
    </div>
  )
}

export function HCFrontdeskOverview2Screen() {
  const [viewMode, setViewMode] = useState<ViewMode>('sessions')
  const forms = NOUN_FORMS[viewMode]
  const [dateRange, setDateRange] = useState('Last 6 months')
  const [savingsValues, setSavingsValues] = useState<EstimateSavingsValues>({ mode: 'time', timePerUnitMins: 5, currency: 'USD', hourlyWage: 40 })
  const [savingsModalOpen, setSavingsModalOpen] = useState(false)
  const [filterOpen, setFilterOpen] = useState(false)
  const [filterSelections, setFilterSelections] = useState<Record<string, string[]>>({})
  const [filtersLoading, setFiltersLoading] = useState(false)
  const isFirstFilterRender = useRef(true)

  // Simulate a fresh fetch of the whole page whenever a filter selection changes.
  useEffect(() => {
    if (isFirstFilterRender.current) {
      isFirstFilterRender.current = false
      return
    }
    setFiltersLoading(true)
    const t = setTimeout(() => setFiltersLoading(false), 700)
    return () => clearTimeout(t)
  }, [filterSelections])

  // Empty selection reads as "no filter" (show every channel) rather than "show nothing".
  const selectedChannels = ((filterSelections.channel?.length ? filterSelections.channel : CHANNEL_KEYS) as ChannelKey[])
  const filteredFunnel = computeFilteredFunnel(selectedChannels)
  const channelRatio = filteredFunnel.grandTotal / 1000
  const [nodeDrawer, setNodeDrawer] = useState<string | null>(null)
  const [listVisible, setListVisible] = useState(false)
  const [selectedConvo, setSelectedConvo] = useState<FunnelConversation | null>(null)
  const [detailVisible, setDetailVisible] = useState(false)
  const [message, setMessage] = useState('')
  const [scrollToMsgId, setScrollToMsgId] = useState<string | null>(null)
  const [highlightMsgId, setHighlightMsgId] = useState<string | null>(null)
  const chatScrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (nodeDrawer !== null) {
      requestAnimationFrame(() => setListVisible(true))
    }
  }, [nodeDrawer])

  useEffect(() => {
    if (selectedConvo) {
      requestAnimationFrame(() => setDetailVisible(true))
    }
  }, [selectedConvo])

  // Jump straight to the session's messages once its parent conversation's full thread has
  // slid into view and mounted, briefly highlighting them so it's obvious what just happened.
  useEffect(() => {
    if (!detailVisible || !scrollToMsgId) return
    const t = setTimeout(() => {
      chatScrollRef.current?.querySelector(`[data-msg-id="${scrollToMsgId}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      setHighlightMsgId(scrollToMsgId)
      setTimeout(() => setHighlightMsgId(null), 1500)
    }, 320)
    return () => clearTimeout(t)
  }, [detailVisible, scrollToMsgId])

  function openDetail(convo: FunnelConversation) {
    setScrollToMsgId(null)
    setSelectedConvo(convo)
  }

  // A session is just one exchange inside its parent conversation's full thread — open that
  // thread and scroll straight to where this session starts.
  function openSession(session: FunnelSession) {
    const { convoId, anchorMsgId, ...convo } = session
    setScrollToMsgId(anchorMsgId)
    setSelectedConvo({ ...convo, id: convoId })
  }

  function closeDetail() {
    setDetailVisible(false)
    setTimeout(() => { setSelectedConvo(null); setScrollToMsgId(null) }, 300)
  }

  function closeNodeDrawer() {
    closeDetail()
    setListVisible(false)
    setTimeout(() => setNodeDrawer(null), 300)
  }

  // In sessions mode, a couple of nodes have real per-session data (see SESSIONS_BY_NODE);
  // every other node falls back to the same conversation-level list used in conversations mode.
  const drawerItems: Array<FunnelConversation | FunnelSession> = nodeDrawer
    ? (viewMode === 'sessions' ? SESSIONS_BY_NODE[nodeDrawer] : undefined) ?? CONVERSATIONS_BY_NODE[nodeDrawer] ?? []
    : []

  return (
    <div className="flex h-full flex-col">
      <TopNav initials="S" />

      <div className="flex flex-1 overflow-hidden">
      <div className="flex flex-1 flex-col overflow-auto bg-surface">
        <ReportHeader
          title="Front desk overview 2"
          subtitle={`${filteredFunnel.grandTotal.toLocaleString()} ${forms.lowPlural} across patient inquiries, appointments, and cost savings.`}
          rightSlot={
            <div className="flex items-center gap-sm">
              <ViewModeToggle value={viewMode} onChange={setViewMode} />
              <DateRangeSelector
                value={dateRange}
                options={DATE_RANGE_OPTIONS}
                onChange={setDateRange}
              />
              <button
                type="button"
                aria-label="Filters"
                onClick={() => setFilterOpen((o) => !o)}
                className={`flex size-9 items-center justify-center rounded-sm text-text-icon ${filterOpen ? 'bg-surface-selected' : 'border border-border-selected bg-surface hover:bg-surface-l2'}`}
              >
                <Icon name="filter_list" size={20} />
              </button>
            </div>
          }
        />

        {filtersLoading ? (
          <PageSkeleton />
        ) : (
        <div className="flex flex-col gap-lg p-2xl">

          <SummaryStats stats={getSummaryStats(forms, scaleForViewMode(filteredFunnel.grandTotal, viewMode), scaleForViewMode(filteredFunnel.resolvedTotal, viewMode), savingsValues, () => setSavingsModalOpen(true))} />

          <HCCard title={`${forms.capPlural} funnel`} tooltip={`${forms.capSingular} volume by channel, through AI agent or human involvement, to the status and outcome of each ${forms.lowSingular}. Select any section to see the underlying ${forms.lowPlural}.`}>
            <SankeyChart
              nodes={filteredFunnel.nodes}
              links={filteredFunnel.links}
              height={620}
              minWidth={1320}
              minLabelHeight={16}
              nodeColors={FUNNEL_NODE_COLORS}
              terminalNodes={[8, 9, 10]}
              nodePadding={8}
              sort={false}
              iterations={0}
              stretchColumn={[16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28]}
              columnHeaders={[`${forms.capPlural} by channel`, 'Involvement', 'Status', 'Outcome', 'Sub-outcome']}
              columnHeaderTooltips={{ 1: `Outcomes for Human involved ${forms.lowPlural} are tracked across Text and Webchat only — voice call outcomes aren't included.` }}
              onNodeClick={(name) => { if (CONVERSATIONS_BY_NODE[name]) setNodeDrawer(name) }}
            />
          </HCCard>

          {viewMode === 'sessions' && (
            <HCCard title="Unique patients trend by channel" tooltip="Monthly count of unique patients served, split by call, text, and webchat — one patient may have multiple sessions in a month.">
              <StackedBarChart
                data={getUniquePatientsTrendData(selectedChannels, viewMode)}
                series={getChannelTrendSeries(selectedChannels)}
                xKey="month"
                height={280}
                showBarLabels
              />
            </HCCard>
          )}

          <div className="grid grid-cols-2 gap-lg">
            <HCCard title={`${forms.capPlural} trend by channel`} tooltip={`Monthly ${forms.lowSingular} volume by channel`}>
              <StackedBarChart
                data={getChannelTrendData(viewMode)}
                series={getChannelTrendSeries(selectedChannels)}
                xKey="month"
                height={280}
                showBarLabels
              />
            </HCCard>

            <HCCard title="Involvement trend" tooltip={`Monthly breakdown of ${forms.lowPlural} handled by AI agents, a human agent, or left unanswered`}>
              <StackedBarChart
                data={getInvolvementTrendData(channelRatio).map((row) => ({
                  ...row,
                  myna: scaleForViewMode(row.myna as number, viewMode),
                  human: scaleForViewMode(row.human as number, viewMode),
                  notAnswered: scaleForViewMode(row.notAnswered as number, viewMode),
                }))}
                series={INVOLVEMENT_TREND_SERIES}
                xKey="month"
                height={280}
                showBarLabels
              />
            </HCCard>
          </div>

          <div className="grid grid-cols-2 gap-lg">
            <OutcomeTrendCard forms={forms} ratio={channelRatio} viewMode={viewMode} />

            <HCCard title="Rating trend" tooltip="Average patient rating on a 1–5 scale when a rating is given. Unrated sessions are excluded from the average.">
              <ChartStatRow stats={[
                { value: '4.5', label: 'Average rating', icon: 'star' },
                { value: '+0.6', label: 'vs. Feb' },
              ]} />
              <TrendLineChart
                data={RATING_TREND_DATA}
                height={220}
                yDomain={[0, 5]}
                valueLabel="Average rating"
                color="#7c4dff"
              />
            </HCCard>
          </div>

          <div className="grid grid-cols-2 gap-lg">
            <HCCard title={`${forms.capPlural} timing trend`} tooltip={`Monthly split of AI agent-handled ${forms.lowPlural} during office hours and after hours`}>
              <StackedBarChart
                data={getTimingTrendData(channelRatio).map((row) => ({
                  ...row,
                  office: scaleForViewMode(row.office as number, viewMode),
                  after: scaleForViewMode(row.after as number, viewMode),
                }))}
                series={TIMING_TREND_SERIES}
                xKey="month"
                height={340}
                showBarLabels
              />
            </HCCard>

            <HCCard title={`${forms.capPlural} intent breakdown by working hours`} tooltip={`AI agent-handled ${forms.lowPlural} by intent, with the office vs. after-hours split for each category`}>
              <StackedBarChart
                data={getIntentData(channelRatio)}
                series={INTENT_SERIES}
                xKey="intent"
                height={340}
                grouped
                horizontal
                showBarLabels
              />
            </HCCard>
          </div>

          <IntentTrendCard forms={forms} ratio={channelRatio} />

          <HCCard title={`${forms.capPlural} intent breakdown by outcome`} tooltip={`AI agent-handled ${forms.lowPlural} by intent, with resolved vs. not resolved status for each category.`}>
            <DataTable columns={getIntentColumns()} data={getIntentTableData(channelRatio)} stickyFirstColumn />
          </HCCard>

          <HCCard title={`${forms.capPlural} by channel`} tooltip={`How ${forms.lowPlural} are distributed across call, text, and webchat`}>
            <ChartStatRow stats={getChannelStats(selectedChannels)} />
            <DonutChart data={getChannelDonut(selectedChannels)} centerValue={formatCompact(filteredFunnel.grandTotal)} centerLabel={`Total ${forms.lowPlural}`} />
          </HCCard>

          <HCCard title="Insurances verified" tooltip={`Monthly count of unique ${forms.lowPlural} where the agent verified the patient's insurance`}>
            <ChartStatRow stats={[
              { value: scaleK(1.2, channelRatio, 'K'),  label: 'Total verified'    },
              { value: '94.2%', label: 'Verification rate' },
            ]} />
            <StackedBarChart
              data={getInsuranceData(channelRatio)}
              series={INSURANCE_SERIES}
              xKey="month"
              height={220}
              showBarLabels
              hideLegend
            />
          </HCCard>

          <InteractionsByDimensionCard forms={forms} selectedChannels={selectedChannels} viewMode={viewMode} />

        </div>
        )}
      </div>
      <FilterPanel
        open={filterOpen}
        fields={FILTER_FIELDS}
        selections={filterSelections}
        onSelectionsChange={setFilterSelections}
        onClose={() => setFilterOpen(false)}
        onAdvancedFilters={() => {}}
      />
      </div>

      <EstimateSavingsModal
        open={savingsModalOpen}
        values={savingsValues}
        unitLabel={forms.lowSingular}
        onClose={() => setSavingsModalOpen(false)}
        onSave={(next) => { setSavingsValues(next); setSavingsModalOpen(false) }}
      />

      {/* List drawer */}
      {nodeDrawer !== null && (
        <>
          <div
            className={`fixed inset-0 z-[70] bg-black/20 transition-opacity duration-300 ease-in-out ${listVisible ? 'opacity-100' : 'opacity-0'}`}
            onClick={closeNodeDrawer}
          />
          <div className={`fixed right-0 top-0 z-[80] flex h-full w-[650px] flex-col bg-surface shadow-modal transition-transform duration-300 ease-in-out ${listVisible ? 'translate-x-0' : 'translate-x-full'}`}>
            <div className="flex items-center justify-between px-2xl py-lg">
              <div className="flex items-center gap-sm">
                <button type="button" onClick={closeNodeDrawer} className="flex size-8 items-center justify-center rounded-sm text-text-icon hover:bg-surface-hover">
                  <Icon name="arrow_back" size={18} />
                </button>
                <span className="text-h3 text-text-primary">{nodeDrawer}</span>
              </div>
              <span className="text-small text-text-tertiary">
                {drawerItems.length.toLocaleString()} {forms.lowPlural}
              </span>
            </div>
            <div className="flex-1 overflow-y-auto px-sm py-sm">
              {drawerItems.map((item) => {
                const isSession = 'anchorMsgId' in item
                const chatId = isSession ? item.convoId : item.id
                return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => isSession ? openSession(item) : openDetail(item)}
                  className={`flex w-full flex-col gap-xs rounded-md px-md py-md text-left transition-colors ${selectedConvo?.id === chatId && (!isSession || scrollToMsgId === item.anchorMsgId) ? 'bg-[#dbeafe]' : 'hover:bg-surface-hover'}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-xs">
                      {item.unread && <span className="size-[6px] shrink-0 rounded-full bg-primary" />}
                      <span className="text-body text-text-primary">{item.name}</span>
                      {item.verified && <Icon name="mode_heat" size={14} className="text-text-icon" />}
                    </div>
                    <span className="shrink-0 text-small text-text-secondary">{item.date}</span>
                  </div>
                  {isSession ? (
                    // Sessions don't have a single "last message" of their own — the underlying
                    // thread's last message may belong to a later session — so show the curated
                    // one-line summary of just this session instead.
                    <span className="truncate text-small text-text-secondary">{item.message}</span>
                  ) : (() => {
                    const msgs = CHAT_BY_CONVO[item.id] ?? DEFAULT_CHAT
                    const last = msgs[msgs.length - 1]
                    const preview = last.sender === 'agent' ? `Agent: ${last.text}` : last.text
                    return <span className="truncate text-small text-text-secondary">{preview}</span>
                  })()}
                  <div className="flex items-center gap-xs text-small text-text-tertiary">
                    <span>{item.location}</span>
                    {item.assignee && (
                      <>
                        <span>•</span>
                        <Icon name="group" size={12} />
                        <span>{item.assignee}</span>
                      </>
                    )}
                  </div>
                </button>
                )
              })}
            </div>
          </div>
        </>
      )}

      {/* Detail drawer — slides on top of list drawer */}
      {selectedConvo !== null && (
        <div className={`fixed right-0 top-0 z-[90] flex h-full w-[650px] flex-col overflow-hidden bg-surface shadow-modal transition-transform duration-300 ease-in-out ${detailVisible ? 'translate-x-0' : 'translate-x-full'}`}>
          {/* Chat header — matches list drawer header */}
          <div className="flex items-center justify-between px-2xl py-lg">
            <div className="flex items-center gap-sm">
              <button type="button" onClick={closeDetail} className="flex size-8 items-center justify-center rounded-sm text-text-icon hover:bg-surface-hover">
                <Icon name="arrow_back" size={18} />
              </button>
              <span className="text-h3 text-text-primary">{selectedConvo.name}</span>
              {selectedConvo.verified && <Icon name="mode_heat" size={16} className="text-text-icon" />}
            </div>
            <div className="flex items-center gap-md">
              <button type="button" className="flex items-center gap-sm">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-ai-summary">
                  <Icon name="auto_awesome" size={16} className="text-ai-brand" />
                </span>
                <span className="text-body text-text-primary">{selectedConvo.assignee ?? 'Front desk agent'}</span>
                <Icon name="expand_more" size={14} className="text-text-icon" />
              </button>
              <button type="button" className="flex size-8 items-center justify-center rounded-sm text-text-icon hover:bg-surface-hover">
                <Icon name="more_vert" size={18} />
              </button>
            </div>
          </div>

          {/* Chat messages — exact copy */}
          <div ref={chatScrollRef} className="flex flex-1 flex-col gap-md overflow-y-auto px-2xl py-lg">
            <div className="flex items-center justify-center">
              <span className="text-small text-text-secondary">Thu • Jun 10</span>
            </div>
            {(CHAT_BY_CONVO[selectedConvo.id] ?? DEFAULT_CHAT).map((msg) => (
              <div
                key={msg.id}
                data-msg-id={msg.id}
                className={`flex flex-col rounded-md transition-colors duration-500 ${msg.sender === 'agent' ? 'items-end' : 'items-start'} ${highlightMsgId === msg.id ? 'bg-chip-warning-bg' : ''}`}
              >
                <div className={`max-w-[70%] rounded-lg px-md py-sm ${
                  msg.sender === 'agent'
                    ? 'bg-[#dbeafe] text-body text-text-primary'
                    : 'bg-[#f0f0f0] text-body text-text-primary'
                }`}>
                  <span>{msg.text}</span>
                </div>
                <span className="mt-xs text-small text-text-secondary">{msg.time}</span>
              </div>
            ))}
          </div>

          {/* Compose box — exact copy */}
          <div className="p-2xl">
            <div className="rounded-md border border-border p-md">
              <button type="button" className="mb-sm flex items-center gap-xs text-body text-text-action">
                Text
                <Icon name="expand_more" size={16} />
              </button>
              <div className="mb-md min-h-[48px]">
                <textarea
                  rows={2}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your message or use a template"
                  className="w-full resize-none bg-transparent text-body text-text-primary outline-none placeholder:text-text-secondary"
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-md text-text-icon">
                  <button type="button" className="flex size-5 items-center justify-center hover:text-text-primary"><Icon name="table_rows" size={20} /></button>
                  <button type="button" className="flex size-5 items-center justify-center hover:text-text-primary"><Icon name="attach_money" size={20} /></button>
                  <button type="button" className="flex size-5 items-center justify-center hover:text-text-primary"><Icon name="attach_file" size={20} /></button>
                  <button type="button" className="flex size-5 items-center justify-center hover:text-text-primary"><Icon name="sentiment_satisfied" size={20} /></button>
                </div>
                <div className="flex items-center">
                  <button type="button" className="flex h-9 items-center rounded-l-sm bg-primary px-lg text-body text-white hover:bg-primary-hover">Send</button>
                  <button type="button" className="flex h-9 items-center justify-center rounded-r-sm border-l border-white/30 bg-primary px-sm text-white hover:bg-primary-hover">
                    <Icon name="expand_more" size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
