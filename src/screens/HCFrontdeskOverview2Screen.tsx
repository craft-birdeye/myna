import React, { useEffect, useRef, useState } from 'react'
import {
  ChartCard,
  ChartStatRow,
  DataTable,
  DateRangeSelector,
  DonutChart,
  FilterPanel,
  Icon,
  InfoTooltip,
  ReportHeader,
  SankeyChart,
  SelectMenu,
  StackedBarChart,
  SummaryStats,
  TopNav,
  type Column,
  type FilterField,
  type SankeyLink,
  type SankeyNode,
} from '../components'

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
  'Email': [
    { id: 'ch-email-1', name: 'Helen Cho',                    message: 'Emailed requesting a copy of the visit summary.',                    location: 'North Clinic',    assignee: 'Front desk AI', date: '11:00 AM', unread: true },
    { id: 'ch-email-2', name: 'Victor Reyes',                  message: 'Emailed about insurance documentation needed before the visit.',     location: 'South Clinic',    assignee: 'Front desk AI', date: 'Jun 10, 2025' },
    { id: 'ch-email-3', name: 'Lauren Diaz',                   message: 'Emailed to reschedule due to a work conflict.',                      location: 'Downtown Clinic', assignee: 'Front desk AI', date: 'Jun 8, 2025' },
    { id: 'ch-email-4', name: 'Grace Liu',                     message: 'Emailed to request records be sent to a specialist.',                location: 'North Clinic',    assignee: 'Front desk AI', date: 'Jun 9, 2025' },
    { id: 'ch-email-5', name: 'Tomás Rivera',                  message: 'Emailed asking about payment plan options.',                         location: 'South Clinic',    assignee: 'Front desk AI', date: 'Jun 7, 2025', unread: true },
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
  'Bookings': [
    { id: 'bkg1', name: 'Natalie Brooks',  verified: true,   message: 'Booked new patient consult for Jun 14 at 10am.',                                      location: 'North Clinic',    assignee: 'Front desk AI', date: '09:30 AM', unread: true },
    { id: 'bkg2', name: 'Carlos Jimenez',                    message: 'Scheduled annual physical for next Tuesday.',                                        location: 'South Clinic',    assignee: 'Front desk AI', date: '08:58 AM' },
    { id: 'bkg3', name: 'Ingrid Sorensen',                   message: 'Booked follow-up visit after recent ER discharge.',                                  location: 'Downtown Clinic', assignee: 'Front desk AI', date: 'Jun 10, 2025' },
    { id: 'bkg4', name: 'Om Prakash',                         message: 'New patient intake appointment booked for Jun 16.',                                  location: 'North Clinic',    assignee: 'Front desk AI', date: 'Jun 9, 2025',  unread: true },
    { id: 'bkg5', name: 'Derek Chow',                         message: 'Booked a follow-up visit after a recent procedure.',                                 location: 'South Clinic',    assignee: 'Front desk AI', date: 'Jun 8, 2025' },
  ],
  'Rescheduled': [
    { id: 'res1', name: 'Bethany Coleman',                   message: 'Moved Thursday visit to next Monday due to travel.',                                 location: 'South Clinic',    assignee: 'Front desk AI', date: '11:05 AM', unread: true },
    { id: 'res2', name: 'Frank Delgado',                     message: 'Rescheduled physical therapy session to Friday afternoon.',                          location: 'North Clinic',    assignee: 'Front desk AI', date: '10:40 AM' },
    { id: 'res3', name: 'Yuki Tanaka',     verified: true,   message: 'Pushed dermatology follow-up back two weeks.',                                       location: 'Downtown Clinic', assignee: 'Front desk AI', date: 'Jun 10, 2025' },
    { id: 'res4', name: 'Harold Simmons',                    message: 'Moved appointment earlier due to a schedule conflict.',                              location: 'South Clinic',    assignee: 'Front desk AI', date: 'Jun 9, 2025' },
    { id: 'res5', name: 'Isabel Marsh',                      message: 'Rescheduled due to a transportation conflict.',                                       location: 'Downtown Clinic', assignee: 'Front desk AI', date: 'Jun 8, 2025' },
  ],
  'Cancellations': [
    { id: 'can1', name: 'Gabriela Nunez',                    message: 'Cancelled Friday appointment — feeling better, no longer needed.',                    location: 'North Clinic',    assignee: 'Front desk AI', date: '09:48 AM', unread: true },
    { id: 'can2', name: 'Trevor Adams',                      message: 'Cancelled follow-up — switched to a different provider.',                            location: 'South Clinic',    assignee: 'Front desk AI', date: 'Jun 10, 2025' },
    { id: 'can3', name: 'Monica Silva',    verified: true,   message: 'Cancelled annual checkup — will rebook next quarter.',                                location: 'Downtown Clinic', assignee: 'Front desk AI', date: 'Jun 9, 2025' },
    { id: 'can4', name: 'Julian Cross',                      message: 'Cancelled follow-up — resolved without needing the visit.',                          location: 'North Clinic',    assignee: 'Front desk AI', date: 'Jun 8, 2025', unread: true },
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
    { id: '2', sender: 'agent',    text: "Of course — I've attached your visit summary to this email.",                time: '10:58 AM' },
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
  'res-1': [
    { id: '1', sender: 'customer', text: "Hi, I wanted to confirm my appointment and ask a quick question about prep.", time: '09:07 AM' },
    { id: '2', sender: 'agent',    text: "You're confirmed for Thursday, and no special prep is needed for this visit.", time: '09:09 AM' },
    { id: '3', sender: 'customer', text: "Great, that's all I needed. Thanks!",                                        time: '09:10 AM' },
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

const opts = (...labels: string[]) => labels.map((l) => ({ value: l.toLowerCase().replace(/\s+/g, '-'), label: l }))

const FILTER_FIELDS: FilterField[] = [
  { id: 'region',          label: 'Region',              options: opts('Northeast', 'Southeast', 'Midwest', 'Southwest', 'West Coast', 'Pacific Northwest') },
  { id: 'division',        label: 'Division',            options: opts('Division A', 'Division B', 'Division C', 'Division D', 'Division E') },
  { id: 'city',            label: 'City',                options: opts('Austin', 'San Francisco', 'Phoenix', 'Denver', 'Seattle', 'Dallas', 'Houston', 'Chicago') },
  { id: 'zip',             label: 'Zip',                 options: opts('78701', '78702', '94102', '85001', '80201', '98101', '75201', '60601') },
  { id: 'outcome',         label: 'Outcome',             options: opts('Resolved', 'Transferred', 'Missed') },
  { id: 'content-manager', label: 'Content manager',     options: opts('Kelsy Hiltz', 'Marcus Webb', 'Priya Nair', 'Sofia Mendez', 'Derek Okafor') },
  { id: 'social-manager',  label: 'Social manager',      options: opts('Tasha Winters', 'Omar Farouk', 'Brianna Cole', 'Nathan Cruz', 'Linda Hargrove') },
  { id: 'area-code',       label: 'Area code',           options: opts('512', '415', '602', '303', '206', '214', '713', '312') },
  { id: 'region-manager',  label: 'Region manager',      options: opts('James Whitfield', 'Ray Castellano', 'Ana Reyes', 'David Park', 'Michelle Torres') },
  { id: 'room-custom',     label: 'Room custom',         options: opts('Exam Room 1', 'Exam Room 2', 'Consultation A', 'Consultation B', 'Waiting Bay') },
  { id: 'new-alpha-beta',  label: 'New alpha beta test', options: opts('Alpha Group', 'Beta Group', 'Control Group', 'Pilot A', 'Pilot B') },
  { id: 'custom-test',     label: 'Custom test',         options: opts('Test Group A', 'Test Group B', 'Cohort 1', 'Cohort 2', 'Cohort 3') },
  { id: 'location',              label: 'Location',                        options: opts('North Austin', 'South Austin', 'San Francisco', 'Phoenix, AZ', 'Denver, CO', 'Seattle, WA') },
  { id: 'call-status',           label: 'Call status',                     options: opts('Resolved', 'Transferred', 'Missed', 'Pending') },
  { id: 'answered-by',           label: 'Answered by',                     options: opts('AI agents', 'Human agent', 'Not answered') },
  { id: 'time-period',           label: 'Time period',                     options: opts('Today', 'Yesterday', 'Last 7 days', 'Last 30 days', 'Last 3 months', 'Last 6 months', 'Last 12 months') },
  { id: 'call-timing',           label: 'Call timing',                     options: opts('Office hours', 'After hours') },
]

// Healthcare chart card — uses the tune icon for the left action button
function HCCard(props: React.ComponentProps<typeof ChartCard>) {
  return <ChartCard {...props} leftActionIcon="tune" />
}

const DATE_RANGE_OPTIONS = ['Last 7 days', 'Last 30 days', 'Last 3 months', 'Last 6 months', 'Last 12 months', 'Custom']

const SUMMARY_STATS = [
  { id: 'handled',        value: '700',    label: 'Interactions involved',  delta: '70%', trend: 'up' as const },
  { id: 'resolved',       value: '560',    label: 'Interactions resolved' },
  { id: 'resolutionRate', value: '80%',    label: 'Resolution rate' },
  { id: 'hours',          value: '37 hrs', label: 'Staff hours saved' },
  { id: 'savings',        value: '$521',   label: 'Monthly savings',        delta: '36%', trend: 'up' as const },
]

// Six-month trends, one per funnel column — vertical stacked bar charts.
// The story: six months ago humans still handled the majority of interactions; AI agents
// have steadily taken that volume over since, so "Human involved" drops sharply (480→280)
// while "AI agents involved" climbs sharply (290→700) — the roles clearly flip over the
// period. The monthly total still moves up and down rather than climbing in a straight
// line; only "Not answered" wobbles a little, since it isn't part of the handoff story.
const CHANNEL_TREND_DATA = [
  { month: 'Feb', call: 492, text: 246, email: 82  },
  { month: 'Mar', call: 534, text: 267, email: 89  },
  { month: 'Apr', call: 510, text: 255, email: 85  },
  { month: 'May', call: 558, text: 279, email: 93  },
  { month: 'Jun', call: 528, text: 264, email: 88  },
  { month: 'Jul', call: 600, text: 300, email: 100 },
]
const CHANNEL_TREND_SERIES = [
  { key: 'call',  label: 'Call',  color: '#1976d2' },
  { key: 'text',  label: 'Text',  color: '#3f51b5' },
  { key: 'email', label: 'Email', color: '#9c27b0' },
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

// Resolution rate (resolved ÷ (resolved + transferred)) improves steadily each month —
// 80% in Feb up to 85.7% by Jul — even though raw volume still moves up and down.
const OUTCOME_TREND_DATA = [
  { month: 'Feb', resolved: 616, transferred: 154 },
  { month: 'Mar', resolved: 684, transferred: 161 },
  { month: 'Apr', resolved: 652, transferred: 143 },
  { month: 'May', resolved: 747, transferred: 148 },
  { month: 'Jun', resolved: 706, transferred: 134 },
  { month: 'Jul', resolved: 840, transferred: 140 },
]
const OUTCOME_TREND_SERIES = [
  { key: 'resolved',    label: 'Resolved',    color: '#4cae3d' },
  { key: 'transferred', label: 'Transferred', color: '#f59e0b' },
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

// Interactions by channel (Call/Text/Email) → Involvement → Outcome → Sub-outcome
// 0-2: channels, 3-5: involvement, 6-8: outcome, 9-13: sub-outcome.
// Nodes are ordered largest-first within each column so the dominant flow stays flush
// along the top of the diagram instead of sweeping diagonally between columns.
// Every unit of volume carries all the way through the Outcome column (Resolved + Transferred +
// Missed sum to the full 1,000) so that column isn't vertically centered shorter than the rest —
// only "Missed" (8) terminates there instead of continuing into Sub-outcome.
const FUNNEL_NODES: SankeyNode[] = [
  { name: 'Call 60%' },
  { name: 'Text 30%' },
  { name: 'Email 10%' },
  { name: 'AI agents involved 70%' },
  { name: 'Human involved 28%' },
  { name: 'Not answered 2%' },
  { name: 'Resolved 84%' },
  { name: 'Transferred 14%' },
  { name: 'Missed 2%' },
  { name: 'Answered 46%' },
  { name: 'Pending 21%' },
  { name: 'Bookings 18%' },
  { name: 'Rescheduled 10%' },
  { name: 'Cancellations 4%' },
]
const FUNNEL_LINKS: SankeyLink[] = [
  // channel → involvement (real per-channel splits, not an even proportion of the channel total)
  { source: 0, target: 3, value: 470 }, // Call    → AI agents involved
  { source: 0, target: 4, value: 120 }, // Call    → Human involved
  { source: 0, target: 5, value: 10  }, // Call    → Not answered
  { source: 1, target: 3, value: 192 }, // Text    → AI agents involved
  { source: 1, target: 4, value: 100 }, // Text    → Human involved
  { source: 1, target: 5, value: 8   }, // Text    → Not answered
  { source: 2, target: 3, value: 38  }, // Email   → AI agents involved
  { source: 2, target: 4, value: 60  }, // Email   → Human involved
  { source: 2, target: 5, value: 2   }, // Email   → Not answered
  // involvement → outcome — human involvement resolves, but never "transfers" (it's already a human);
  // not-answered interactions land in Missed instead of dropping out of the diagram.
  { source: 3, target: 6, value: 560 }, // AI agents involved  → Resolved
  { source: 3, target: 7, value: 140 }, // AI agents involved  → Transferred
  { source: 4, target: 6, value: 280 }, // Human involved → Resolved
  { source: 5, target: 8, value: 20  }, // Not answered   → Missed
  // outcome → sub-outcome — Resolved spreads across all five; Transferred only into the first four
  { source: 6, target: 9,  value: 400 }, // Resolved    → Answered
  { source: 6, target: 10, value: 170 }, // Resolved    → Pending
  { source: 6, target: 11, value: 145 }, // Resolved    → Bookings
  { source: 6, target: 12, value: 85  }, // Resolved    → Rescheduled
  { source: 6, target: 13, value: 40  }, // Resolved    → Cancellations
  { source: 7, target: 9,  value: 60  }, // Transferred → Answered
  { source: 7, target: 10, value: 40  }, // Transferred → Pending
  { source: 7, target: 11, value: 30  }, // Transferred → Bookings
  { source: 7, target: 12, value: 10  }, // Transferred → Rescheduled
]
const FUNNEL_NODE_COLORS: Record<number, string> = {
  0: '#1976d2', 1: '#3f51b5', 2: '#9c27b0',
  3: '#7c4dff', 4: '#4cae3d', 5: '#de1b0c', 6: '#4cae3d', 7: '#f59e0b', 8: '#de1b0c',
  9: '#00bcd4', 10: '#f5a623', 11: '#e056c7', 12: '#8bc34a', 13: '#4cae3d',
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
  transferredPct: string
  [key: string]: string | number
}
const INTENT_TABLE_DATA: IntentRow[] = INTENT_DATA.map((d) => ({
  intent: d.intent,
  officeHours: d.office,
  afterHours: d.after,
  totalCalls: d.office + d.after,
  resolvedPct: '80%',
  transferredPct: '20%',
}))
const INTENT_COLUMNS: Column<IntentRow>[] = [
  { key: 'intent',         label: 'Intent',            width: 180, sortable: true },
  { key: 'officeHours',    label: 'Office hours calls', width: 160, sortable: true },
  { key: 'afterHours',     label: 'After hours calls',  width: 160, sortable: true },
  { key: 'totalCalls',     label: 'Total calls',        width: 130, sortable: true },
  { key: 'resolvedPct',    label: 'Resolved',           width: 130, sortable: true, render: (v) => <span className="text-chip-success-text">{v as string}</span> },
  { key: 'transferredPct', label: 'Transferred',        width: 130, sortable: true, render: (v) => <span className="text-chip-warning-text">{v as string}</span> },
]

// ─── Copied from Front desk overview ─────────────────────────────────────────

const SOURCE_DONUT = [
  { name: 'Link', value: 41.2, color: '#9c27b0' },
  { name: 'FAQ',  value: 32.5, color: '#f59e0b' },
  { name: 'File', value: 26.3, color: '#4cae3d' },
]

// Matches the channels used throughout this page's funnel (Call/Text/Email), not the
// Webchat/Voice/Text set from the original Front desk overview.
const CHANNEL_DONUT = [
  { name: 'Call',  value: 60.0, color: '#1976d2' },
  { name: 'Text',  value: 30.0, color: '#3f51b5' },
  { name: 'Email', value: 10.0, color: '#9c27b0' },
]

const INSURANCE_DATA = [
  { month: 'Dec', verified: 464 },
  { month: 'Jan', verified: 194 },
  { month: 'Feb', verified: 288 },
  { month: 'Mar', verified: 178 },
  { month: 'Apr', verified: 461 },
  { month: 'May', verified: 297 },
]
const INSURANCE_SERIES = [{ key: 'verified', label: 'Verified', color: '#1976d2' }]

// ─── Interactions by location ─────────────────────────────────────────────────
// Location is always the row (first column). The dropdown only picks which
// breakdown — channel, outcome, or sub-outcome — fills in the rest of the columns.
// Every column's total across locations reconciles with the totals established above.

const DIMENSION_OPTIONS = ['Channel', 'Outcomes', 'Sub-outcomes']

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
const LEVEL_TITLE: Record<string, string> = {
  'By location': 'Interactions by location',
  'By city': 'Interactions by city',
  'By state': 'Interactions by state',
  'By region': 'Interactions by region',
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

const LOCATION_CHANNEL_BREAKDOWN: Record<string, { call: number; text: number; email: number }> = {
  'North Clinic':    { call: 132, text: 66, email: 22 },
  'South Clinic':    { call: 114, text: 57, email: 19 },
  'Downtown Clinic': { call: 102, text: 51, email: 17 },
  'East Clinic':     { call: 90,  text: 45, email: 15 },
  'West Clinic':     { call: 84,  text: 42, email: 14 },
  'Uptown Clinic':   { call: 78,  text: 39, email: 13 },
}

const LOCATION_OUTCOME_BREAKDOWN: Record<string, { resolved: number; transferred: number; missed: number }> = {
  'North Clinic':    { resolved: 187, transferred: 29, missed: 4 },
  'South Clinic':    { resolved: 156, transferred: 30, missed: 4 },
  'Downtown Clinic': { resolved: 150, transferred: 17, missed: 3 },
  'East Clinic':     { resolved: 120, transferred: 27, missed: 3 },
  'West Clinic':     { resolved: 126, transferred: 11, missed: 3 },
  'Uptown Clinic':   { resolved: 108, transferred: 19, missed: 3 },
}

const LOCATION_SUBOUTCOME_BREAKDOWN: Record<string, {
  answered: number; pending: number; bookings: number; rescheduled: number; cancellations: number; transferred: number
}> = {
  'North Clinic':    { answered: 101, pending: 46, bookings: 39, rescheduled: 21, cancellations: 9, transferred: 31 },
  'South Clinic':    { answered: 87,  pending: 40, bookings: 33, rescheduled: 18, cancellations: 8, transferred: 27 },
  'Downtown Clinic': { answered: 78,  pending: 36, bookings: 30, rescheduled: 16, cancellations: 7, transferred: 24 },
  'East Clinic':     { answered: 69,  pending: 32, bookings: 26, rescheduled: 14, cancellations: 6, transferred: 21 },
  'West Clinic':     { answered: 64,  pending: 29, bookings: 25, rescheduled: 13, cancellations: 6, transferred: 20 },
  'Uptown Clinic':   { answered: 60,  pending: 27, bookings: 23, rescheduled: 12, cancellations: 5, transferred: 18 },
}

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

// Trend of office hours vs. after hours volume for the selected intent — helps identify which
// intents are being handled after hours. Reuses the same StackedBarChart used elsewhere.
function IntentTrendCard() {
  const [selectedIntent, setSelectedIntent] = useState('General inquiry')

  const chartData = INTENT_TREND_MONTHS.map((month, i) => ({
    month,
    office: INTENT_TREND_BY_INTENT[selectedIntent]?.[i]?.office ?? 0,
    after: INTENT_TREND_BY_INTENT[selectedIntent]?.[i]?.after ?? 0,
  }))

  return (
    <HCCard
      title="Intent trend analysis"
      titleSuffix={
        <>
          <InlineHeadingDropdown value={selectedIntent} options={INTENT_OPTIONS} onChange={setSelectedIntent} />
          <InfoTooltip text="Monthly office hours vs. after hours trend for the selected intent — see which intents are being addressed after hours." />
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

function InteractionsByDimensionCard() {
  const [dimension, setDimension] = useState('Outcomes')
  const [level, setLevel] = useState('By location')
  const [loading, setLoading] = useState(false)

  // Simulate a fresh fetch whenever the location-hierarchy level changes.
  useEffect(() => {
    setLoading(true)
    const t = setTimeout(() => setLoading(false), 700)
    return () => clearTimeout(t)
  }, [level])

  const rows = groupsForLevel(level).map((group) => {
    const members = membersOfGroup(level, group)
    const totalInteractions = members.reduce((sum, m) => sum + (LOCATIONS.find((l) => l.label === m)?.total ?? 0), 0)
    const resolved = sumField(LOCATION_OUTCOME_BREAKDOWN, members, 'resolved')
    const resolutionRate = Math.round((resolved / totalInteractions) * 100)
    return { group, members, totalInteractions, resolved, resolutionRate }
  })

  let columns: Column<LocationBreakdownRow>[]
  let data: LocationBreakdownRow[]

  // Real total for the group — resolved + transferred + missed — shown right after
  // the location column in every view, so it's always clear how big a group is before
  // drilling into its channel/outcome/sub-outcome split.
  const TOTAL_INTERACTIONS_COLUMN: Column<LocationBreakdownRow> = {
    key: 'totalInteractions', label: 'Total interactions', width: 160, sortable: true,
  }
  const LOCATION_COLUMN: Column<LocationBreakdownRow> = {
    key: 'location', label: LEVEL_COLUMN_LABEL[level], width: 180, sortable: true,
  }

  if (dimension === 'Outcomes') {
    columns = [
      LOCATION_COLUMN,
      TOTAL_INTERACTIONS_COLUMN,
      { key: 'resolved',    label: 'Resolved',    width: 130, sortable: true },
      { key: 'transferred', label: 'Transferred', width: 130, sortable: true },
      { key: 'missed',      label: 'Missed',      width: 130, sortable: true },
      RESOLUTION_RATE_COLUMN,
    ]
    data = rows.map((r) => ({
      location: r.group,
      totalInteractions: r.totalInteractions,
      resolved: r.resolved,
      transferred: sumField(LOCATION_OUTCOME_BREAKDOWN, r.members, 'transferred'),
      missed: sumField(LOCATION_OUTCOME_BREAKDOWN, r.members, 'missed'),
      resolutionRate: r.resolutionRate,
    }))
  } else if (dimension === 'Sub-outcomes') {
    columns = [
      LOCATION_COLUMN,
      TOTAL_INTERACTIONS_COLUMN,
      { key: 'answered',      label: 'Answered',      width: 120, sortable: true },
      { key: 'pending',       label: 'Pending',       width: 120, sortable: true },
      { key: 'bookings',      label: 'Bookings',      width: 120, sortable: true },
      { key: 'rescheduled',   label: 'Rescheduled',   width: 120, sortable: true },
      { key: 'cancellations', label: 'Cancellations', width: 130, sortable: true },
      { key: 'transferred',   label: 'Transferred',   width: 120, sortable: true },
      RESOLUTION_RATE_COLUMN,
    ]
    data = rows.map((r) => ({
      location: r.group,
      totalInteractions: r.totalInteractions,
      answered: sumField(LOCATION_SUBOUTCOME_BREAKDOWN, r.members, 'answered'),
      pending: sumField(LOCATION_SUBOUTCOME_BREAKDOWN, r.members, 'pending'),
      bookings: sumField(LOCATION_SUBOUTCOME_BREAKDOWN, r.members, 'bookings'),
      rescheduled: sumField(LOCATION_SUBOUTCOME_BREAKDOWN, r.members, 'rescheduled'),
      cancellations: sumField(LOCATION_SUBOUTCOME_BREAKDOWN, r.members, 'cancellations'),
      transferred: sumField(LOCATION_SUBOUTCOME_BREAKDOWN, r.members, 'transferred'),
      resolutionRate: r.resolutionRate,
    }))
  } else {
    columns = [
      LOCATION_COLUMN,
      TOTAL_INTERACTIONS_COLUMN,
      { key: 'call',  label: 'Call',  width: 120, sortable: true },
      { key: 'text',  label: 'Text',  width: 120, sortable: true },
      { key: 'email', label: 'Email', width: 120, sortable: true },
      RESOLUTION_RATE_COLUMN,
    ]
    data = rows.map((r) => ({
      location: r.group,
      totalInteractions: r.totalInteractions,
      call: sumField(LOCATION_CHANNEL_BREAKDOWN, r.members, 'call'),
      text: sumField(LOCATION_CHANNEL_BREAKDOWN, r.members, 'text'),
      email: sumField(LOCATION_CHANNEL_BREAKDOWN, r.members, 'email'),
      resolutionRate: r.resolutionRate,
    }))
  }

  return (
    <HCCard
      title={LEVEL_TITLE[level]}
      titleSuffix={
        <>
          <InlineHeadingDropdown value={dimension} options={DIMENSION_OPTIONS} onChange={setDimension} />
          <InfoTooltip text="Breaks down each location's interaction volume by channel, outcome, or sub-outcome — switch the view with the dropdown." />
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

export function HCFrontdeskOverview2Screen() {
  const [dateRange, setDateRange] = useState('Last 6 months')
  const [filterOpen, setFilterOpen] = useState(false)
  const [nodeDrawer, setNodeDrawer] = useState<string | null>(null)
  const [listVisible, setListVisible] = useState(false)
  const [selectedConvo, setSelectedConvo] = useState<FunnelConversation | null>(null)
  const [detailVisible, setDetailVisible] = useState(false)
  const [message, setMessage] = useState('')

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

  function openDetail(convo: FunnelConversation) {
    setSelectedConvo(convo)
  }

  function closeDetail() {
    setDetailVisible(false)
    setTimeout(() => setSelectedConvo(null), 300)
  }

  function closeNodeDrawer() {
    closeDetail()
    setListVisible(false)
    setTimeout(() => setNodeDrawer(null), 300)
  }

  return (
    <div className="flex h-full flex-col">
      <TopNav initials="S" />

      <div className="flex flex-1 overflow-hidden">
      <div className="flex flex-1 flex-col overflow-auto bg-surface">
        <ReportHeader
          title="Front desk overview 2"
          subtitle="Frontdesk agent outcomes of addressing patient inquiries, managing appointments, and achieving cost savings by AI agents"
          rightSlot={
            <div className="flex items-center gap-sm">
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

        <div className="flex flex-col gap-lg p-2xl">

          <SummaryStats stats={SUMMARY_STATS} />

          <HCCard title="Interactions funnel" tooltip="Traces interaction volume by channel (call, text, email), through AI agent/human involvement, to the outcome and sub-outcome of each interaction. Click any section to see the underlying conversations.">
            <SankeyChart
              nodes={FUNNEL_NODES}
              links={FUNNEL_LINKS}
              height={440}
              nodeColors={FUNNEL_NODE_COLORS}
              terminalNodes={[8]}
              // A hidden phantom node anchors "Missed" (terminalNodes) into the Sub-outcome
              // column, adding one extra gap there — a smaller nodePadding keeps that column's
              // scale close enough to the others that all four read as equally full.
              nodePadding={4}
              columnHeaders={['Interactions by channel', 'Involvement', 'Outcome', 'Sub-outcome']}
              onNodeClick={(name) => { if (CONVERSATIONS_BY_NODE[name]) setNodeDrawer(name) }}
            />
          </HCCard>

          <div className="grid grid-cols-2 gap-lg">
            <HCCard title="Interaction trend by channel" tooltip="Monthly interaction volume by channel — call, text, and email.">
              <StackedBarChart
                data={CHANNEL_TREND_DATA}
                series={CHANNEL_TREND_SERIES}
                xKey="month"
                height={280}
                showBarLabels
              />
            </HCCard>

            <HCCard title="Involvement trend" tooltip="Monthly breakdown of interactions by who was involved — AI agents, a human agent, or not answered.">
              <StackedBarChart
                data={INVOLVEMENT_TREND_DATA}
                series={INVOLVEMENT_TREND_SERIES}
                xKey="month"
                height={280}
                showBarLabels
              />
            </HCCard>
          </div>

          <div className="grid grid-cols-2 gap-lg">
            <HCCard title="Outcome trend" tooltip="Monthly breakdown of resolved vs. transferred interactions.">
              <StackedBarChart
                data={OUTCOME_TREND_DATA}
                series={OUTCOME_TREND_SERIES}
                xKey="month"
                height={280}
                showBarLabels
              />
            </HCCard>

            <HCCard title="Interaction timing trend" tooltip="Monthly office hours vs. after hours split of AI agent-handled interactions.">
              <StackedBarChart
                data={TIMING_TREND_DATA}
                series={TIMING_TREND_SERIES}
                xKey="month"
                height={280}
                showBarLabels
              />
            </HCCard>
          </div>

          <HCCard title="Interaction intent breakdown by working hours" tooltip="AI agent-handled calls by intent, comparing office hours volume to after-hours volume for each category.">
            <StackedBarChart
              data={INTENT_DATA}
              series={INTENT_SERIES}
              xKey="intent"
              height={340}
              grouped
              horizontal
              showBarLabels
            />
          </HCCard>

          <IntentTrendCard />

          <HCCard title="Interaction intent breakdown by outcome" tooltip="AI agent-handled calls by intent, with the office/after-hours split and resolution outcome for each category.">
            <DataTable columns={INTENT_COLUMNS} data={INTENT_TABLE_DATA} stickyFirstColumn />
          </HCCard>

          <div className="grid grid-cols-2 gap-lg">
            <HCCard title="Answers from source" tooltip="Shows the last source used to respond in each unique conversation, broken down by source type.">
              <ChartStatRow stats={[
                { value: '4.4K', label: 'Link' },
                { value: '2.4K', label: 'FAQ'  },
                { value: '1.6K', label: 'File' },
              ]} />
              <DonutChart data={SOURCE_DONUT} centerValue="6.8k" centerLabel="Total responses" />
            </HCCard>

            <HCCard title="Conversations by channel" tooltip="Shows the channel used for each interaction — call, text, or email.">
              <ChartStatRow stats={[
                { value: '600', label: 'Call'  },
                { value: '300', label: 'Text'  },
                { value: '100', label: 'Email' },
              ]} />
              <DonutChart data={CHANNEL_DONUT} centerValue="1K" centerLabel="Total interactions" />
            </HCCard>
          </div>

          <HCCard title="Insurances verified" tooltip="Monthly view of unique conversations where the patient's insurance was successfully verified by the agent.">
            <ChartStatRow stats={[
              { value: '1.2K',  label: 'Total verified'    },
              { value: '94.2%', label: 'Verification rate' },
            ]} />
            <StackedBarChart
              data={INSURANCE_DATA}
              series={INSURANCE_SERIES}
              xKey="month"
              height={220}
              showBarLabels
              hideLegend
            />
          </HCCard>

          <InteractionsByDimensionCard />

        </div>
      </div>
      <FilterPanel
        open={filterOpen}
        fields={FILTER_FIELDS}
        onClose={() => setFilterOpen(false)}
        onAdvancedFilters={() => {}}
      />
      </div>

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
                {(CONVERSATIONS_BY_NODE[nodeDrawer]?.length ?? 0).toLocaleString()} conversations
              </span>
            </div>
            <div className="flex-1 overflow-y-auto px-sm py-sm">
              {(CONVERSATIONS_BY_NODE[nodeDrawer] ?? []).map((convo) => (
                <button
                  key={convo.id}
                  type="button"
                  onClick={() => openDetail(convo)}
                  className={`flex w-full flex-col gap-xs rounded-md px-md py-md text-left transition-colors ${selectedConvo?.id === convo.id ? 'bg-[#dbeafe]' : 'hover:bg-surface-hover'}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-xs">
                      {convo.unread && <span className="size-[6px] shrink-0 rounded-full bg-primary" />}
                      <span className="text-body text-text-primary">{convo.name}</span>
                      {convo.verified && <Icon name="mode_heat" size={14} className="text-text-icon" />}
                    </div>
                    <span className="shrink-0 text-small text-text-secondary">{convo.date}</span>
                  </div>
                  {(() => {
                    const msgs = CHAT_BY_CONVO[convo.id] ?? DEFAULT_CHAT
                    const last = msgs[msgs.length - 1]
                    const preview = last.sender === 'agent' ? `Agent: ${last.text}` : last.text
                    return <span className="truncate text-small text-text-secondary">{preview}</span>
                  })()}
                  <div className="flex items-center gap-xs text-small text-text-tertiary">
                    <span>{convo.location}</span>
                    {convo.assignee && (
                      <>
                        <span>•</span>
                        <Icon name="group" size={12} />
                        <span>{convo.assignee}</span>
                      </>
                    )}
                  </div>
                </button>
              ))}
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
          <div className="flex flex-1 flex-col gap-md overflow-y-auto px-2xl py-lg">
            <div className="flex items-center justify-center">
              <span className="text-small text-text-secondary">Thu • Jun 10</span>
            </div>
            {(CHAT_BY_CONVO[selectedConvo.id] ?? DEFAULT_CHAT).map((msg) => (
              <div key={msg.id} className={`flex flex-col ${msg.sender === 'agent' ? 'items-end' : 'items-start'}`}>
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
