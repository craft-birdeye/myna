// Hand-authored "Coaching" recommendations for the four PDF examples (C1–C4) — created when a
// user thumbs-downs one of those Inbox transcripts and submits feedback. Unlike the generic
// heuristic-classified feedback recommendation (see `submitFeedback`), these reuse the same
// scripted-chat pattern as the AI-detected recommendations (`introBlocks` + `introApprovalPrompt`),
// since the exact "Chat transcript" for each is already fully scripted in the source PDF.

import {
  COACHING_C1_CONVERSATION_ID,
  COACHING_C2_CONVERSATION_ID,
  COACHING_C3_CONVERSATION_ID,
  COACHING_C4_CONVERSATION_ID,
} from './coachingCallConversations'
import { impactSummary, type ConversationItem, type Recommendation } from './recommendationsData'

// `Recommendation` carries a `[key: string]: unknown` index signature (for other loosely-typed
// call sites), which makes `Omit<Recommendation, ...>` collapse to `{ [x: string]: unknown }` —
// TS widens `keyof Recommendation` to `string` because of it, so `Exclude<keyof T, K>` can't
// actually remove the listed keys. Picking the fields we use directly sidesteps that.
type CoachingTemplate = Pick<
  Recommendation,
  | 'gapType'
  | 'title'
  | 'procedureTitle'
  | 'summary'
  | 'priority'
  | 'conversationCount'
  | 'isNew'
  | 'whenToUse'
  | 'exitCriteria'
  | 'steps'
  | 'tools'
  | 'thoughts'
  | 'rationale'
  | 'introBlocks'
  | 'introApprovalPrompt'
  | 'approvedReply'
  | 'changeType'
>

const APPROVAL_PROMPT = 'Do you accept these changes? Accept to submit them for review, or reject to discard them.'

const COACHING_TEMPLATES: Record<string, CoachingTemplate> = {
  [COACHING_C1_CONVERSATION_ID]: {
    gapType: 'procedure',
    title: 'Make the tone more casual',
    procedureTitle: 'Tone & Style procedure',
    summary: impactSummary(1, 'chat replies read too stiff and formal'),
    priority: 'Medium',
    conversationCount: 1,
    isNew: false,
    whenToUse: 'Whenever Myna replies on chat or text — match the short, casual register customers use there. Voice keeps its existing tone.',
    exitCriteria: 'N/A — this is a standing tone rule, not a step-by-step task with an end point.',
    steps: [
      { title: 'Chat & text tone', bullets: ['Short sentences, plain words, match the customer\'s casual register — no "duly noted," "kindly provide," or "so that I may proceed."'] },
      { title: 'Voice tone (unchanged)', bullets: ['Voice-channel tone stays exactly as configured today.'] },
    ],
    tools: [],
    thoughts: 'The feedback is about tone, and it\'s complete on its own — let me check what the tone rules say today.',
    rationale: 'A team member flagged a webchat conversation as too stiff and formal while reviewing it in the Inbox.',
    introBlocks: [
      {
        kind: 'collapsible',
        label: 'Read the reported conversation',
        meta: 'Previously',
        defaultExpanded: true,
        reportedExcerpt: [
          { speaker: 'Myna', text: 'Thank you. Your request has been duly noted. Kindly hold while I retrieve the relevant appointment details.' },
          { speaker: 'Customer', text: 'ok this is a lot of words lol' },
        ],
        feedback: 'This reply is way too stiff and formal for chat — reads like a form letter, not a conversation.',
        children: [
          { kind: 'transcript', lines: [
            { speaker: 'Customer', text: "hey can i move my son's appt from thursday to next week" },
            { speaker: 'Myna', text: "Certainly. I have noted your request. Kindly provide the patient's first and last name so that I may proceed with the rescheduling process." },
            { speaker: 'Customer', text: 'leo martin' },
            { speaker: 'Myna', text: 'Thank you. Your request has been duly noted. Kindly hold while I retrieve the relevant appointment details.' },
            { speaker: 'Customer', text: 'ok this is a lot of words lol' },
          ] },
        ],
      },
      { kind: 'thought', text: "The feedback is about tone, and it's complete on its own — I don't need any business facts to act on it. Let me read the reported chat and check what the tone rules say today." },
      { kind: 'thought', label: 'Searched procedures', text: 'The Tone & Style section already bans over-formal fillers like "duly noted" — but it was written for voice. There\'s no separate guidance for chat and text, so the agent carries phone-style formality into a channel where people write "can i move my son\'s appt."' },
      { kind: 'thought', text: "Clear direct fix: add channel-specific tone rules — chat and text get short, plain, casual; voice stays as configured. I'll make the change, then test with the exact message from the reported chat." },
      {
        kind: 'collapsible',
        label: 'Procedure updated: Tone & Style',
        meta: '+3 additions, 1 change',
        children: [
          { kind: 'list', items: [
            { label: 'Chat & text tone', text: 'short sentences, plain words, match the customer\'s casual register' },
            { label: 'Voice tone', text: 'stays exactly as configured today' },
          ] },
        ],
      },
      { kind: 'thought', text: "Testing with the customer's real opening message." },
      {
        kind: 'collapsible',
        label: 'Current agent response',
        meta: 'Before this update',
        defaultExpanded: true,
        children: [
          { kind: 'transcript', lines: [
            { speaker: 'Test — customer', text: "hey can i move my son's appt from thursday to next week" },
            { speaker: 'Myna', text: "Certainly. I have noted your request. Kindly provide the patient's first and last name so that I may proceed with the rescheduling process." },
          ] },
        ],
      },
      {
        kind: 'collapsible',
        label: 'Testing agent response',
        meta: '14.2s · Now',
        defaultExpanded: true,
        children: [
          { kind: 'transcript', lines: [
            { speaker: 'Test — customer', text: "hey can i move my son's appt from thursday to next week" },
            { speaker: 'Myna', text: "Sure — what's his first and last name? I'll pull up the appointment." },
          ] },
        ],
      },
      { kind: 'text', text: "Done — I updated the tone rules so chat and text replies are short and casual, while voice keeps its current style. If you want it even more casual (or a bit less), just say so and I'll adjust and re-test." },
    ],
    introApprovalPrompt: APPROVAL_PROMPT,
    approvedReply: 'The updated Tone & Style rules are live for chat and text.',
    changeType: 'Procedure updated: Tone & Style — added channel-specific tone rules for chat and text.',
  },

  [COACHING_C2_CONVERSATION_ID]: {
    gapType: 'procedure',
    title: 'Shorten the after-hours greeting',
    procedureTitle: 'After-Hours Greeting procedure',
    summary: impactSummary(1, 'after-hours greeting too long'),
    priority: 'Medium',
    conversationCount: 1,
    isNew: false,
    whenToUse: 'Every after-hours call, before Myna takes the reason for calling.',
    exitCriteria: "The greeting has finished and Myna moves on to the caller's actual reason for calling.",
    steps: [
      { title: 'Required lines (unchanged)', bullets: ['Always state the emergency instruction ("If this is an emergency, please hang up and dial nine one one") and the recording notice, word-for-word.'] },
      { title: 'Shortened greeting', bullets: ["Don't read the on-call doctor's number to every caller up front — mention it's available and give the full number only when the caller asks for the doctor."] },
    ],
    tools: [],
    thoughts: 'The feedback asks to shorten the greeting — let me check what parts of it are actually required before changing anything.',
    rationale: 'A team member flagged an after-hours call as too long — callers kept talking over the greeting and had to repeat themselves.',
    introBlocks: [
      {
        kind: 'collapsible',
        label: 'Read the reported conversation',
        meta: 'Previously',
        defaultExpanded: true,
        reportedExcerpt: [
          { speaker: 'Myna', text: 'If this is an emergency, please hang up and dial nine one one. The office is currently closed. If you need to speak with the doctor on call, please hang up and dial three zero five… nine six seven… two six one five, and your call will be returned promptly. Please note that this call may be recorded for quality and training purposes. My name is Myna, your virtual assistant. I can help you with your appointments or take a message and have the practice—' },
          { speaker: 'Caller (talking over)', text: "—hi, hi, I just need to cancel tomorrow's appointment." },
        ],
        feedback: 'The after-hours greeting is way too long — callers keep talking over it and having to repeat themselves.',
        children: [
          { kind: 'transcript', lines: [
            { speaker: 'Myna', text: 'If this is an emergency, please hang up and dial nine one one. The office is currently closed. If you need to speak with the doctor on call, please hang up and dial three zero five… nine six seven… two six one five, and your call will be returned promptly. Please note that this call may be recorded for quality and training purposes. My name is Myna, your virtual assistant. I can help you with your appointments or take a message and have the practice—' },
            { speaker: 'Caller (talking over)', text: "—hi, hi, I just need to cancel tomorrow's appointment." },
            { speaker: 'Myna', text: '—return your call in the morning. How can I help you today?' },
            { speaker: 'Caller', text: "…I need to cancel tomorrow's appointment." },
          ] },
        ],
      },
      { kind: 'thought', text: 'The feedback asks to shorten the greeting. Before touching anything I need to check what\'s required in it — greetings often carry compliance lines that must stay.' },
      { kind: 'thought', label: 'Searched procedures', text: 'The greeting procedure marks two parts as mandatory: the emergency instruction ("If this is an emergency, please hang up and dial nine one one") and the recording notice. The on-call doctor\'s number and the message-taking offer are content choices, not requirements.' },
      { kind: 'thought', text: "So I can't cut the emergency line or the recording notice — those stay word-for-word. But I can stop reading a ten-digit number to every caller up front. The on-call number moves to a follow-up: mentioned briefly, offered in full only when the caller wants the doctor. That should roughly halve the greeting." },
      {
        kind: 'collapsible',
        label: 'Procedure updated: After-Hours Greeting',
        meta: '1 change, 1 addition',
        children: [
          { kind: 'list', items: [
            { label: 'Emergency line & recording notice', text: 'unchanged, word-for-word' },
            { label: 'On-call number', text: 'no longer read up front — offered in full only when a caller asks for the doctor' },
          ] },
        ],
      },
      { kind: 'thought', text: 'Testing the new greeting length and that both required lines are intact.' },
      {
        kind: 'collapsible',
        label: 'Current agent response',
        meta: 'Before this update',
        defaultExpanded: true,
        children: [
          { kind: 'transcript', lines: [
            { speaker: 'Test — current greeting', text: 'If this is an emergency, please hang up and dial nine one one. The office is currently closed. If you need to speak with the doctor on call, please hang up and dial three zero five… nine six seven… two six one five, and your call will be returned promptly. Please note that this call may be recorded for quality and training purposes. My name is Myna, your virtual assistant. I can help you with your appointments or take a message and have the practice—' },
          ] },
        ],
      },
      {
        kind: 'collapsible',
        label: 'Testing agent response',
        meta: '17.8s · Now',
        defaultExpanded: true,
        children: [
          { kind: 'transcript', lines: [
            { speaker: 'Test — new greeting', text: 'If this is an emergency, please hang up and dial nine one one. This call may be recorded for quality and training purposes. My name is Myna — the office is currently closed, but I can help with appointments, take a message, or connect you with the doctor on call. How can I help you today?' },
            { speaker: 'Caller', text: "I need to cancel tomorrow's appointment." },
            { speaker: 'Myna', text: "Sure — may I have the patient's first and last name?" },
          ] },
        ],
      },
      { kind: 'text', text: 'The greeting is now about half as long. Both required parts — the emergency line and the recording notice — are unchanged word-for-word, and the on-call number is offered in full only when a caller asks for the doctor.' },
    ],
    introApprovalPrompt: APPROVAL_PROMPT,
    approvedReply: 'The shortened after-hours greeting is live.',
    changeType: 'Procedure updated: After-Hours Greeting — shortened while keeping both required lines intact.',
  },

  [COACHING_C3_CONVERSATION_ID]: {
    gapType: 'knowledge',
    title: 'Add Saturday booking hours',
    procedureTitle: 'Visit Info & Booking Hours procedure',
    summary: impactSummary(1, "agent didn't know about Saturday hours"),
    priority: 'Medium',
    conversationCount: 1,
    isNew: false,
    whenToUse: 'When a caller asks about appointment availability, including weekend requests.',
    exitCriteria: 'The caller has an accurate answer about Saturday availability, booked or not.',
    steps: [
      { title: 'Saturday hours', bullets: ['Use {{Check Business Hours}} to confirm the clinic is open Saturdays, 9am–1pm.'] },
      { title: 'Saturday provider', bullets: ['Only Dr. Alvarez sees patients on Saturdays — never offer a Saturday slot with another provider.'] },
    ],
    tools: [{ label: 'Check Business Hours', icon: 'schedule' }],
    thoughts: "The user says Saturday hours exist. The agent clearly doesn't know them — let me confirm what the procedures say before asking for anything.",
    rationale: 'A team member flagged a text conversation where the agent said it had no weekend availability, even though the practice is open Saturday mornings.',
    introBlocks: [
      {
        kind: 'collapsible',
        label: 'Read the reported conversation',
        meta: 'Previously',
        defaultExpanded: true,
        reportedExcerpt: [
          { speaker: 'Myna', text: "I'm sorry, I don't have information about weekend availability. Let me have someone from our team follow up with you." },
          { speaker: 'Customer', text: 'ok' },
        ],
        feedback: 'We ARE open Saturday mornings — the agent told this customer we have zero weekend availability.',
        children: [
          { kind: 'transcript', lines: [
            { speaker: 'Customer', text: 'Hi, do you have any Saturday appointments? Weekdays are impossible for us.' },
            { speaker: 'Myna', text: 'We schedule appointments during our regular business hours. Would you like me to check availability on a weekday?' },
            { speaker: 'Customer', text: 'So no weekends at all?' },
            { speaker: 'Myna', text: "I'm sorry, I don't have information about weekend availability. Let me have someone from our team follow up with you." },
            { speaker: 'Customer', text: 'ok' },
          ] },
        ],
      },
      { kind: 'thought', text: "The user says Saturday hours exist. The agent clearly doesn't know them — let me confirm what the procedures say before asking for anything." },
      { kind: 'thought', label: 'Searched procedures', text: "The hours in the agent's setup list Monday to Friday only. Nothing anywhere mentions Saturday. The agent answered exactly what it was given — the configuration is what's wrong, not the behavior." },
      { kind: 'thought', text: "I believe the user, but I can't write \"Saturday hours\" into a procedure without the actual hours — and Saturday scheduling often differs from weekdays. I need two facts before I build: the exact Saturday hours, and whether all providers or only some see patients on Saturdays." },
      { kind: 'divider', text: 'User replies' },
      { kind: 'text', text: '"Saturdays 9 to 1. Only Dr. Alvarez sees patients on Saturdays."' },
      { kind: 'divider', text: 'The system builds and tests' },
      { kind: 'thought', text: "Now I have both facts. Update the hours to include Saturday 9–1, and restrict Saturday booking to Dr. Alvarez so the agent never offers a Saturday slot with a provider who isn't in." },
      {
        kind: 'collapsible',
        label: 'Procedure updated: Visit Info & Booking Hours',
        meta: '+2 additions, 1 change',
        children: [
          { kind: 'list', items: [
            { label: 'Saturday hours', text: '9am–1pm' },
            { label: 'Saturday provider', text: 'Dr. Alvarez only' },
          ] },
        ],
      },
      { kind: 'thought', text: 'Testing with the exact question from the reported thread.' },
      {
        kind: 'collapsible',
        label: 'Current agent response',
        meta: 'Before this update',
        defaultExpanded: true,
        children: [
          { kind: 'transcript', lines: [
            { speaker: 'Test — customer', text: 'Hi, do you have any Saturday appointments? Weekdays are impossible for us.' },
            { speaker: 'Myna', text: "I'm sorry, I don't have information about weekend availability. Let me have someone from our team follow up with you." },
          ] },
        ],
      },
      {
        kind: 'collapsible',
        label: 'Testing agent response',
        meta: '15.6s · Now',
        defaultExpanded: true,
        children: [
          { kind: 'transcript', lines: [
            { speaker: 'Test — customer', text: 'Hi, do you have any Saturday appointments? Weekdays are impossible for us.' },
            { speaker: 'Myna', text: "Yes — we're open Saturdays from 9am to 1pm, with Dr. Alvarez. Would you like me to check the next available Saturday?" },
          ] },
        ],
      },
      { kind: 'text', text: 'Saturday hours are in, and Saturday slots are limited to Dr. Alvarez.' },
    ],
    introApprovalPrompt: APPROVAL_PROMPT,
    approvedReply: 'Saturday hours and the Dr. Alvarez restriction are live in Visit Info & Booking Hours.',
    changeType: 'Procedure updated: Visit Info & Booking Hours — added Saturday hours and provider restriction.',
  },

  [COACHING_C4_CONVERSATION_ID]: {
    gapType: 'knowledge',
    title: 'Add a helpful results-status reply',
    procedureTitle: 'Results Status procedure',
    summary: impactSummary(1, 'refused with no explanation'),
    priority: 'Medium',
    conversationCount: 1,
    isNew: true,
    whenToUse: 'When a caller asks about test results, on any channel.',
    exitCriteria: 'The caller has a timeline and, if overdue, a follow-up note has been filed — no medical detail was shared.',
    steps: [
      { title: 'Share status and process only', bullets: ['Never read out results, values, or medical detail — explain that results come through the patient portal within the usual timeline.'] },
      { title: 'Offer a follow-up', bullets: ["If it's been longer than the usual timeline, use {{Trigger Escalation}} to leave a note for the team to follow up that day."] },
    ],
    tools: [{ label: 'Trigger Escalation', icon: 'priority_high' }],
    thoughts: "The feedback asks me to have the agent read out medical results — that's a fixed rule I can't change. But the user is right that the call went badly.",
    rationale: 'A team member flagged a call where a parent asking about her daughter\'s test results was refused twice with no explanation and no next step.',
    introBlocks: [
      {
        kind: 'collapsible',
        label: 'Read the reported conversation',
        meta: 'Previously',
        defaultExpanded: true,
        reportedExcerpt: [
          { speaker: 'Myna', text: "I understand, but I can't provide results information. Let me connect you with someone." },
          { speaker: 'Caller', text: 'Unbelievable.' },
        ],
        feedback: 'The agent just kept refusing with zero explanation or next step — not okay for a call like this.',
        children: [
          { kind: 'transcript', lines: [
            { speaker: 'Caller', text: "I'm calling about my daughter's breathing test from last week. Can you just tell me the results?" },
            { speaker: 'Myna', text: "I'm not able to share medical results." },
            { speaker: 'Caller', text: "You're her doctor's office. I'm her mother. Just read me what it says." },
            { speaker: 'Myna', text: "I understand, but I can't provide results information. Let me connect you with someone." },
            { speaker: 'Caller', text: 'Unbelievable.' },
          ] },
        ],
      },
      { kind: 'thought', text: "The feedback asks me to have the agent read out medical results. That's a fixed rule I can't change — results and any medical detail never go out over a call or chat, regardless of who's asking. But the user is right that the conversation went badly. The real failure isn't the refusal; it's that the refusal came with nothing — no explanation, no timeline, no next step." },
      { kind: 'thought', label: 'Searched procedures', text: 'The guardrail blocking results is working as intended. What\'s missing is everything around it: no timeline to give, no portal to point to, no follow-up option. The agent has nothing helpful it\'s allowed to say, so the caller hears only "no."' },
      { kind: 'text', text: "I can't make the agent read out results — that's a fixed privacy rule, and it protects your patients and your practice, so it stays even with identity verified. But you're right that this call went badly, and the part I can fix is real: right now the agent refuses and offers nothing. Here's what I'd change — when someone asks about results, the agent explains they come through the patient portal within your usual timeline, offers the portal link, and if it's been longer than expected, leaves a note for your team to follow up that day. To build it, I need your patient portal link and the usual results timeline." },
      { kind: 'divider', text: 'User replies' },
      { kind: 'text', text: '"Okay, that\'s fair. Portal is portal.kidzpulm.com, results usually take 3 to 5 business days."' },
      { kind: 'divider', text: 'The system builds and tests' },
      { kind: 'thought', text: 'Building the Results Status content: portal link, 3–5 business day timeline, follow-up note when overdue. The boundary is written into the procedure itself: status and process only — never a value, a number, or a medical detail.' },
      {
        kind: 'collapsible',
        label: 'Procedure created: Results Status',
        meta: '+4 additions',
        children: [
          { kind: 'list', items: [
            { label: 'Portal link', text: 'portal.kidzpulm.com' },
            { label: 'Usual timeline', text: '3–5 business days after the test' },
            { label: 'Follow-up', text: 'leaves a note for the team when results are overdue' },
            { label: 'Boundary', text: 'status and process only — never a value, a number, or a medical detail' },
          ] },
        ],
      },
      { kind: 'thought', text: 'Testing with the exact request from the reported call — the answer must be helpful and must not include any medical content.' },
      {
        kind: 'collapsible',
        label: 'Current agent response',
        meta: 'Before this update',
        defaultExpanded: true,
        children: [
          { kind: 'transcript', lines: [
            { speaker: 'Test — caller', text: "Can you just tell me my daughter's breathing test results?" },
            { speaker: 'Myna', text: "I'm not able to share medical results." },
          ] },
        ],
      },
      {
        kind: 'collapsible',
        label: 'Testing agent response',
        meta: '19.1s · Now',
        defaultExpanded: true,
        children: [
          { kind: 'transcript', lines: [
            { speaker: 'Test — caller', text: "Can you just tell me my daughter's breathing test results?" },
            { speaker: 'Myna', text: "I'm not able to read results out over the phone — they're shared through our patient portal, usually within three to five business days after the test. Since it's been about a week, I can leave a note for our team to follow up with you today. Would you like me to do that? The portal is portal dot kidzpulm dot com, and if you have trouble logging in, our front desk can help." },
          ] },
        ],
      },
      { kind: 'text', text: 'The rule stays — no results over the phone — but now a caller gets the timeline, the portal, and a same-day follow-up instead of a dead end.' },
    ],
    introApprovalPrompt: APPROVAL_PROMPT,
    approvedReply: 'The Results Status procedure has been added to the workflow and saved to your procedure library.',
    changeType: 'New procedure added to the library.',
  },
}

/** Builds the fully-scripted Recommendation for a coaching example (C1–C4), or `null` if the
 *  given conversation id isn't one of them — the caller falls back to the generic heuristic path. */
export function buildCoachingFeedbackRecommendation(
  conversationId: string | undefined,
  agentName: string,
  conversation: ConversationItem,
  messageId?: string,
): Recommendation | null {
  if (!conversationId) return null
  const template = COACHING_TEMPLATES[conversationId]
  if (!template) return null

  return {
    ...template,
    id: `feedback-coaching-${conversationId}`,
    conversations: [conversation],
    timeAgo: 'Just now',
    source: 'feedback',
    agentName,
    feedbackKey: `coaching-${conversationId}`,
    sourceConversationId: conversationId,
    sourceMessageId: messageId,
  }
}
