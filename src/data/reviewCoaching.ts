/**
 * Coaching for the Review response agent (Jay & Robin / 23 Sep).
 *
 * A team member thumbs-downs an agent-written reply in Reviews and says what was wrong. That
 * becomes a coaching item (a `Recommendation` record in the shared feedback store, so it shows
 * up in the agent's Coaching list) and, when opened, a scripted copilot conversation on the
 * workflow canvas: the feedback + trace as the user message → a short "Working" pass → what
 * the copilot found → a question card asking how to fix it → the fix applied step by step →
 * "N nodes updated · Accept / Undo".
 *
 * Everything is deterministic mock, keyed by a `theme` guessed from the feedback text.
 */
import type { Recommendation } from './recommendationsData'
import type { Review } from './reviewsData'
import type { WorkPhase } from '../components/AgentActivityHeader/AgentWorkSequence'
import type { QuestionCardOption } from '../components/GhostwriterQuestionCard/GhostwriterQuestionCard.types'
import type { JrNodeUpdate } from './jayRobinCreateFlow'

export const REVIEW_COACHING_AGENT = 'Review response agent - North Region'
export const REVIEW_COACHING_ASSIGNEE = 'Robin'

export type ReviewCoachingTheme = 'spam' | 'staff-name' | 'language' | 'tone' | 'generic'

/** The bits of the flagged review a coaching item carries (stored on the record). */
export interface ReviewCoachingReview {
  id: string
  reviewerName: string
  rating: number
  source: string
  text: string
  reply: string
  date: string
  location: string
}

export interface ReviewCoachingItem {
  id: string
  theme: ReviewCoachingTheme
  feedback: string
  reportedBy: string
  review: ReviewCoachingReview
}

export function classifyReviewCoachingTheme(text: string): ReviewCoachingTheme {
  const t = text.toLowerCase()
  if (/spam|fake|bot|promo|scam|not a (real )?customer|non-customer|link/.test(t)) return 'spam'
  if (/staff|employee|name|named|dr\.|doctor|hygienist|receptionist/.test(t)) return 'staff-name'
  if (/spanish|language|english|translat|idioma|non-english/.test(t)) return 'language'
  if (/tone|rude|defensive|robotic|cold|generic|template|apolog|sorry/.test(t)) return 'tone'
  return 'generic'
}

const THEME_TITLE: Record<ReviewCoachingTheme, string> = {
  spam: 'Spam reviews are getting public replies',
  'staff-name': 'Replies name staff members',
  language: 'Reply language doesn’t match the review',
  tone: 'Replies read as generic templates',
  generic: 'Reply didn’t fit the review',
}

const THEME_SUMMARY: Record<ReviewCoachingTheme, string> = {
  spam: 'A review the team flagged as spam went down the Respond path and got a thank-you template.',
  'staff-name': 'A public reply repeated a staff member’s name from the review.',
  language: 'A Spanish review was answered in English.',
  tone: 'The reply leaned on the template and didn’t acknowledge the specific issue.',
  generic: 'A team member flagged an agent reply that missed the mark.',
}

/** Turn a flagged review + feedback into the shared `Recommendation` shape so it lists in the
 *  Coaching tab and routes like every other coaching item. The review itself rides along on
 *  the record (the type has an index signature) so the canvas conversation can quote it. */
export function buildReviewCoachingRecommendation({
  review,
  text,
  reportedBy,
  id,
  timeAgo = 'Just now',
}: {
  review: Review
  text: string
  reportedBy: string
  id?: string
  timeAgo?: string
}): Recommendation {
  const theme = classifyReviewCoachingTheme(text)
  const coachingReview: ReviewCoachingReview = {
    id: review.id,
    reviewerName: review.reviewerName,
    rating: review.rating,
    source: review.reply?.channel && review.reply.channel !== 'Birdeye' ? review.reply.channel : 'Google',
    text: review.text,
    reply: review.reply?.text ?? '',
    date: review.date,
    location: review.location,
  }
  return {
    id: id ?? `feedback-review-${review.id}-${Date.now()}`,
    gapType: theme === 'spam' ? 'procedure' : 'knowledge',
    title: THEME_TITLE[theme],
    procedureTitle: 'Review response',
    summary: THEME_SUMMARY[theme],
    priority: 'High',
    timeAgo,
    conversationCount: 1,
    isNew: true,
    whenToUse: '',
    steps: [],
    tools: [],
    rationale: '',
    changeType: '',
    conversations: [
      { name: review.reviewerName, message: text, channel: 'Text', date: review.date, location: review.location },
    ],
    source: 'feedback',
    agentName: REVIEW_COACHING_AGENT,
    feedbackKey: `review-${review.id}-${text.trim().toLowerCase().replace(/\s+/g, ' ')}`,
    sourceConversationId: review.id,
    reportedBy,
    reportedExcerpt: [{ speaker: 'Review response agent', text: review.reply?.text ?? '' }],
    reportedFeedbackText: text,
    coachingKind: 'review',
    coachingTheme: theme,
    coachingReview,
  }
}

export function isReviewCoachingRecommendation(rec: Recommendation | undefined | null): boolean {
  return rec?.coachingKind === 'review'
}

export function toReviewCoachingItem(rec: Recommendation): ReviewCoachingItem {
  return {
    id: rec.id,
    theme: (rec.coachingTheme as ReviewCoachingTheme) ?? 'generic',
    feedback: (rec.reportedFeedbackText as string) ?? rec.summary,
    reportedBy: rec.reportedBy ?? 'A team member',
    review: rec.coachingReview as ReviewCoachingReview,
  }
}

/* ─── Seeds — so the Coaching list reads like a live account on first open ─────── */

const SEED_SPAM_REVIEW: Review = {
  id: 'coach-spam-1',
  reviewerName: 'Best Deals Pro',
  rating: 5,
  date: 'Sep 22, 2026',
  reviewId: '1730511',
  location: 'Bright Smile Dental Studio',
  text: 'BEST DEALS ANYWHERE!!! Amazing dental deals and free crypto signals 🚀 — DM me on WhatsApp or click www.fastcoinprofits.biz',
  reply: {
    channel: 'Google',
    agentName: 'Review response agent',
    postedAt: 'Sep 22, 2026 09:14 AM',
    text: 'Thank you so much, Best — this made our day. We’ll pass it on to the team, and we look forward to seeing you again soon. — Robin',
  },
}

const SEED_STAFF_REVIEW: Review = {
  id: 'coach-staff-1',
  reviewerName: 'Dana Whitfield',
  rating: 1,
  date: 'Sep 21, 2026',
  reviewId: '1730498',
  location: 'Sunrise Family Medicine',
  text: 'Dr. Patel was dismissive and the receptionist, Karen, rolled her eyes when I asked about my bill. Never again.',
  reply: {
    channel: 'Facebook',
    agentName: 'Review response agent',
    postedAt: 'Sep 21, 2026 04:02 PM',
    text: 'I’m sorry, Dana. Dr. Patel and Karen shouldn’t have made you feel that way, and I understand why you’re frustrated. Please give me a chance to fix this — call me on (602) 791-9826. — Robin',
  },
}

const SEED_LANGUAGE_REVIEW: Review = {
  id: 'coach-lang-1',
  reviewerName: 'Luis Fernández',
  rating: 2,
  date: 'Sep 20, 2026',
  reviewId: '1730476',
  location: 'Cut n Looks Unisex Salon',
  text: 'Esperé más de una hora y nadie me explicó nada. Cuando finalmente me atendieron, todo fue con prisa.',
  reply: {
    channel: 'Google',
    agentName: 'Review response agent',
    postedAt: 'Sep 20, 2026 11:40 AM',
    text: 'I’m sorry, Luis. The wait ran well past your appointment time shouldn’t have happened, and I understand why you’re frustrated. Please give me a chance to fix this — call me on (602) 791-9826. — Robin',
  },
}

export const REVIEW_COACHING_SEEDS: Recommendation[] = [
  buildReviewCoachingRecommendation({
    id: 'coaching-review-seed-spam',
    review: SEED_SPAM_REVIEW,
    text: 'This is obviously spam — promo link, no visit, copy-pasted across three listings. We shouldn’t be thanking these; they should be held.',
    reportedBy: 'Akhil Sharma',
    timeAgo: '2h ago',
  }),
  buildReviewCoachingRecommendation({
    id: 'coaching-review-seed-staff',
    review: SEED_STAFF_REVIEW,
    text: 'Please don’t repeat staff names in public replies — it puts Dr. Patel and Karen on blast. Apologise without naming anyone.',
    reportedBy: 'Rupa Menon',
    timeAgo: '1d ago',
  }),
  buildReviewCoachingRecommendation({
    id: 'coaching-review-seed-language',
    review: SEED_LANGUAGE_REVIEW,
    text: 'The review is in Spanish and we answered in English. Reply in the reviewer’s language.',
    reportedBy: 'Haresh Rajamannar',
    timeAgo: '3d ago',
  }),
]

/* ─── The scripted conversation, per theme ───────────────────────────────────── */

export interface ReviewCoachingOption extends QuestionCardOption {
  /** What the copilot says when this option is picked, before it starts working. */
  ack: string
  /** The fix, as a build pass — omitted for "leave it" options (nothing changes). */
  applyPhases?: WorkPhase[]
  nodes?: JrNodeUpdate[]
  acceptedLine?: string
}

export interface ReviewCoachingScript {
  /** The feedback + trace, as the user turn that opens the conversation. */
  userMessage: string
  analysisPhases: WorkPhase[]
  /** What the copilot found — said after the analysis, before the question. */
  findingLine: string
  question: string
  options: ReviewCoachingOption[]
  /** Reply when the user types their own instruction instead of picking an option. */
  customInstructionAck: string
  customApplyPhases: WorkPhase[]
  customNodes: JrNodeUpdate[]
  customAcceptedLine: string
  undoneLine: string
  leaveLine: string
}

function trace(item: ReviewCoachingItem) {
  const r = item.review
  return (
    `Coaching from ${item.reportedBy}: “${item.feedback}”\n\n` +
    `Review by ${r.reviewerName} · ${r.rating}★ · ${r.source}: “${r.text}”\n` +
    `The agent replied: “${r.reply}”\n\n` +
    'Understand what went wrong and fix it.'
  )
}

const TRACE_PHASE = (item: ReviewCoachingItem): WorkPhase => ({
  thought: 'First the trace — what the agent saw, what it did, and where in the workflow it decided.',
  toolsLabel: 'Reading the review and the reply',
  status: 'Reading the trace',
  tools: [
    { label: `Pulled the review from ${item.review.source} (${item.review.rating}★, ${item.review.date})` },
    { label: 'Pulled the reply the agent posted and the template it came from' },
    { label: 'Traced the run: Trigger → Triage review → Respond → Generate response → Publish' },
  ],
})

const CLEANUP_STEP = (item: ReviewCoachingItem): WorkPhase => ({
  kind: 'step',
  thought: 'And the reply that prompted this.',
  toolsLabel: 'Step 2 — Cleaning up',
  status: 'Cleaning up',
  tools: [
    { label: `Took down the reply to ${item.review.reviewerName}` },
    { label: `Moved the review to today’s digest for ${REVIEW_COACHING_ASSIGNEE}` },
  ],
})

export function buildReviewCoachingScript(item: ReviewCoachingItem): ReviewCoachingScript {
  const r = item.review
  const first = r.reviewerName.split(/\s+/)[0]
  const undoneLine = 'Reverted — the workflow is back to how it was, and the reply stays up for now.'

  switch (item.theme) {
    case 'spam':
      return {
        userMessage: trace(item),
        analysisPhases: [
          TRACE_PHASE(item),
          {
            thought: 'The decision that matters is the spam gate’s. Let me see what it scored and why.',
            toolsLabel: 'Checking the spam gate',
            status: 'Checking the spam gate',
            tools: [
              { label: 'Scored the review: 0.62 — below the 0.8 threshold, so it went down Respond' },
              {
                label: 'Looked for what the model missed',
                detail: 'Promotional link · wording repeated across 2 other listings · no mention of a visit',
              },
              { label: 'Checked the last 30 days: 3 similar reviews also got public replies' },
            ],
            findings: ['The tells were all there; the score just didn’t weigh them enough.'],
          },
        ],
        findingLine:
          `I see what happened. The spam gate scored this 0.62 — under the 0.8 threshold — so it went down the Respond path and ${first} got the 5-star thank-you template. It missed three tells: a promotional link, wording repeated from two other reviews, and no mention of a visit. Three similar reviews got the same treatment this month.`,
        question: 'How do you want me to fix it?',
        options: [
          {
            id: 'guideline',
            label: 'Add these tells to the spam guideline',
            description: 'Hold any review with a promo link, repeated wording or no visit detail — whatever the score.',
            recommended: true,
            ack: 'Adding the tells to the guideline. The score still counts; these just hold on their own.',
            applyPhases: [
              {
                kind: 'step',
                thought: 'The guideline lives on Triage review.',
                toolsLabel: 'Step 1 — Updating Triage review',
                status: 'Updating Triage review',
                tools: [
                  { label: 'Added three tells to the spam guideline: promo link, repeated wording, no visit detail' },
                  { label: 'Re-scored this review: 0.91 → held' },
                  { label: 'Re-ran the 3 similar reviews: all held now' },
                ],
              },
              CLEANUP_STEP(item),
            ],
            nodes: [
              { kind: 'changed', id: 'rr-2', icon: 'shield', label: 'Triage review' },
              { kind: 'changed', id: 'rr-7', icon: 'mail', label: 'Send email alert' },
            ],
            acceptedLine: `Applied. Anything with those tells is held from now on — the reply to ${first} is down and the review is in today’s digest for ${REVIEW_COACHING_ASSIGNEE}.`,
          },
          {
            id: 'threshold',
            label: 'Lower the threshold to 0.6',
            description: 'Catches this one, but about 3 genuine reviews a week would get held too.',
            ack: 'Lowering the threshold. Expect a few more genuine reviews in the digest each week.',
            applyPhases: [
              {
                kind: 'step',
                toolsLabel: 'Step 1 — Updating Triage review',
                status: 'Updating Triage review',
                tools: [
                  { label: 'Set the spam threshold to 0.6' },
                  { label: 'Re-scored this review: 0.62 → held' },
                  { label: 'Checked last week: 3 genuine reviews would now be held' },
                ],
              },
              CLEANUP_STEP(item),
            ],
            nodes: [
              { kind: 'changed', id: 'rr-2', icon: 'shield', label: 'Triage review' },
              { kind: 'changed', id: 'rr-7', icon: 'mail', label: 'Send email alert' },
            ],
            acceptedLine: `Applied. The gate now holds anything scoring 0.6 or above — the reply to ${first} is down and the review is in today’s digest.`,
          },
          {
            id: 'leave',
            label: 'Leave the gate as it is',
            description: 'Just take down this reply and move on.',
            ack: 'Understood — I’ll leave the gate alone and only take down this reply.',
          },
        ],
        customInstructionAck: 'Got it — I’ll fold that into the spam guideline on Triage review.',
        customApplyPhases: [
          {
            kind: 'step',
            toolsLabel: 'Step 1 — Updating Triage review',
            status: 'Updating Triage review',
            tools: [
              { label: 'Added your instruction to the spam guideline' },
              { label: 'Re-scored this review: held' },
            ],
          },
          CLEANUP_STEP(item),
        ],
        customNodes: [
          { kind: 'changed', id: 'rr-2', icon: 'shield', label: 'Triage review' },
          { kind: 'changed', id: 'rr-7', icon: 'mail', label: 'Send email alert' },
        ],
        customAcceptedLine: `Applied. The guideline now carries your instruction — the reply to ${first} is down and the review is in today’s digest.`,
        undoneLine,
        leaveLine: `Done — the reply to ${first} is down and the review is in today’s digest. Nothing else changed.`,
      }

    case 'staff-name':
      return {
        userMessage: trace(item),
        analysisPhases: [
          TRACE_PHASE(item),
          {
            thought: 'The reply repeated names from the review. That comes from how Generate response uses the review text.',
            toolsLabel: 'Checking the writing rules',
            status: 'Checking the writing rules',
            tools: [
              { label: 'Found 2 staff names carried from the review into the reply' },
              { label: 'Checked the six rules: “never name a staff member in a public reply” is missing' },
              { label: 'Checked the last 30 days: 4 replies did the same' },
            ],
          },
        ],
        findingLine:
          'I see it. Generate response echoes the review to show it was read — and here that meant repeating two staff names in public. There’s no rule against it in the six the replies are written to, and four replies this month did the same.',
        question: 'How do you want me to fix it?',
        options: [
          {
            id: 'no-names',
            label: 'Never name staff in public replies',
            description: 'Acknowledge the experience, keep names out, offer the direct channel.',
            recommended: true,
            ack: 'Adding it as a seventh rule — names stay out, the acknowledgement stays in.',
            applyPhases: [
              {
                kind: 'step',
                toolsLabel: 'Step 1 — Updating Generate response',
                status: 'Updating Generate response',
                tools: [
                  { label: 'Added rule 7: never name a staff member in a public reply' },
                  { label: `Redrafted the reply to ${first} without names` },
                  { label: 'Re-checked 4 replies from this month: all would change' },
                ],
              },
              CLEANUP_STEP(item),
            ],
            nodes: [{ kind: 'changed', id: 'rr-5', icon: 'edit_note', label: 'Generate response' }],
            acceptedLine: `Applied. Replies won’t name staff from now on — ${first}’s reply is down and a redraft is waiting for ${REVIEW_COACHING_ASSIGNEE}’s approval.`,
          },
          {
            id: 'first-names',
            label: 'Allow first names only',
            description: 'Keep “Karen” out but allow “Dr. Patel” when the reviewer used the name.',
            ack: 'Allowing first names only when the reviewer used them.',
            applyPhases: [
              {
                kind: 'step',
                toolsLabel: 'Step 1 — Updating Generate response',
                status: 'Updating Generate response',
                tools: [{ label: 'Added rule 7: refer to staff by first name only, and only if the reviewer did' }, { label: `Redrafted the reply to ${first}` }],
              },
              CLEANUP_STEP(item),
            ],
            nodes: [{ kind: 'changed', id: 'rr-5', icon: 'edit_note', label: 'Generate response' }],
            acceptedLine: `Applied. ${first}’s reply is down and a redraft is waiting for approval.`,
          },
          { id: 'leave', label: 'Leave the rules as they are', description: 'Just take down this reply.', ack: 'Understood — only this reply comes down.' },
        ],
        customInstructionAck: 'Got it — I’ll add that to the writing rules on Generate response.',
        customApplyPhases: [
          { kind: 'step', toolsLabel: 'Step 1 — Updating Generate response', status: 'Updating Generate response', tools: [{ label: 'Added your instruction to the writing rules' }, { label: `Redrafted the reply to ${first}` }] },
          CLEANUP_STEP(item),
        ],
        customNodes: [{ kind: 'changed', id: 'rr-5', icon: 'edit_note', label: 'Generate response' }],
        customAcceptedLine: `Applied. The rules now carry your instruction — ${first}’s reply is down and a redraft is waiting for approval.`,
        undoneLine,
        leaveLine: `Done — the reply to ${first} is down and a redraft is waiting for approval. Nothing else changed.`,
      }

    case 'language':
      return {
        userMessage: trace(item),
        analysisPhases: [
          TRACE_PHASE(item),
          {
            thought: 'The review is Spanish and the reply is English — so language detection ran, but nothing acted on it.',
            toolsLabel: 'Checking language handling',
            status: 'Checking language handling',
            tools: [
              { label: 'Extract review details detected Spanish (confidence 0.98)' },
              { label: 'Generate response has no rule to write in the detected language' },
              { label: 'Checked templates: Spanish variants exist for all four' },
            ],
          },
        ],
        findingLine:
          'Extract review details did pick up that the review is in Spanish, but Generate response never uses that — it always writes in English. The Spanish template variants are already there; nothing tells the agent to use them.',
        question: 'How do you want me to fix it?',
        options: [
          {
            id: 'match-language',
            label: 'Reply in the reviewer’s language',
            description: 'Use the Spanish templates when the review is Spanish; hold other languages for a person.',
            recommended: true,
            ack: 'Wiring the detected language into Generate response.',
            applyPhases: [
              {
                kind: 'step',
                toolsLabel: 'Step 1 — Updating Generate response',
                status: 'Updating Generate response',
                tools: [
                  { label: 'Added rule: write in the detected language when a template exists for it' },
                  { label: `Redrafted the reply to ${first} in Spanish` },
                  { label: 'Other languages: held for a person' },
                ],
              },
              CLEANUP_STEP(item),
            ],
            nodes: [{ kind: 'changed', id: 'rr-5', icon: 'edit_note', label: 'Generate response' }],
            acceptedLine: `Applied. Spanish reviews get Spanish replies from now on — ${first}’s reply is down and a Spanish redraft is waiting for approval.`,
          },
          {
            id: 'hold',
            label: 'Hold every non-English review for a person',
            description: 'No automatic replies unless the review is in English.',
            ack: 'Holding anything that isn’t English.',
            applyPhases: [
              { kind: 'step', toolsLabel: 'Step 1 — Updating Generate response', status: 'Updating Generate response', tools: [{ label: 'Added rule: hold non-English reviews for approval' }, { label: `Moved ${first}’s review to the approval queue` }] },
              CLEANUP_STEP(item),
            ],
            nodes: [{ kind: 'changed', id: 'rr-5', icon: 'edit_note', label: 'Generate response' }],
            acceptedLine: `Applied. Non-English reviews wait for a person — ${first}’s reply is down and the review is in the approval queue.`,
          },
          { id: 'leave', label: 'Leave it as it is', description: 'Just take down this reply.', ack: 'Understood — only this reply comes down.' },
        ],
        customInstructionAck: 'Got it — I’ll add that to how Generate response handles language.',
        customApplyPhases: [
          { kind: 'step', toolsLabel: 'Step 1 — Updating Generate response', status: 'Updating Generate response', tools: [{ label: 'Added your instruction to the language handling' }, { label: `Redrafted the reply to ${first}` }] },
          CLEANUP_STEP(item),
        ],
        customNodes: [{ kind: 'changed', id: 'rr-5', icon: 'edit_note', label: 'Generate response' }],
        customAcceptedLine: `Applied — ${first}’s reply is down and a redraft is waiting for approval.`,
        undoneLine,
        leaveLine: `Done — the reply to ${first} is down. Nothing else changed.`,
      }

    case 'tone':
    case 'generic':
    default:
      return {
        userMessage: trace(item),
        analysisPhases: [
          TRACE_PHASE(item),
          {
            thought: 'The reply followed the template correctly — so the problem is in the template or the rules, not the run.',
            toolsLabel: 'Checking the writing rules',
            status: 'Checking the writing rules',
            tools: [
              { label: `Compared the reply against the six rules: named the issue ✓, one next step ✓, 60–90 words ✓` },
              { label: 'Compared it against the feedback: the template didn’t leave room for what the reviewer actually said' },
              { label: 'Checked the last 30 days: 6 replies used the same template for a similar review' },
            ],
          },
        ],
        findingLine:
          `The agent did what the rules say — it just did it with a template that doesn’t fit this review. ${first}’s specific point never made it into the reply, and six replies this month read the same way.`,
        question: 'How do you want me to fix it?',
        options: [
          {
            id: 'rule',
            label: 'Add this to the writing rules',
            description: `Turn “${item.feedback.length > 70 ? item.feedback.slice(0, 67) + '…' : item.feedback}” into a rule every reply is checked against.`,
            recommended: true,
            ack: 'Adding it to the rules Generate response writes to.',
            applyPhases: [
              {
                kind: 'step',
                toolsLabel: 'Step 1 — Updating Generate response',
                status: 'Updating Generate response',
                tools: [{ label: 'Added the feedback as rule 7' }, { label: `Redrafted the reply to ${first} against it` }, { label: 'Re-checked 6 similar replies: all would change' }],
              },
              CLEANUP_STEP(item),
            ],
            nodes: [{ kind: 'changed', id: 'rr-5', icon: 'edit_note', label: 'Generate response' }],
            acceptedLine: `Applied. Every reply is checked against it from now on — ${first}’s reply is down and a redraft is waiting for ${REVIEW_COACHING_ASSIGNEE}’s approval.`,
          },
          {
            id: 'hold-similar',
            label: 'Hold replies like this for approval',
            description: 'Keep the template, but route reviews like this one to a person first.',
            ack: 'Routing reviews like this to approval instead of posting.',
            applyPhases: [
              { kind: 'step', toolsLabel: 'Step 1 — Updating Route by rating', status: 'Updating the routing', tools: [{ label: 'Added a hold condition for reviews like this one' }, { label: `Moved ${first}’s review to the approval queue` }] },
              CLEANUP_STEP(item),
            ],
            nodes: [{ kind: 'changed', id: 'rr-3', icon: 'alt_route', label: 'Evaluate conditions' }],
            acceptedLine: `Applied. Reviews like this wait for a person — ${first}’s reply is down and the review is in the approval queue.`,
          },
          { id: 'leave', label: 'Leave the rules as they are', description: 'Just take down this reply.', ack: 'Understood — only this reply comes down.' },
        ],
        customInstructionAck: 'Got it — I’ll add that to the writing rules on Generate response.',
        customApplyPhases: [
          { kind: 'step', toolsLabel: 'Step 1 — Updating Generate response', status: 'Updating Generate response', tools: [{ label: 'Added your instruction to the writing rules' }, { label: `Redrafted the reply to ${first}` }] },
          CLEANUP_STEP(item),
        ],
        customNodes: [{ kind: 'changed', id: 'rr-5', icon: 'edit_note', label: 'Generate response' }],
        customAcceptedLine: `Applied — ${first}’s reply is down and a redraft is waiting for approval.`,
        undoneLine,
        leaveLine: `Done — the reply to ${first} is down. Nothing else changed.`,
      }
  }
}

export const REVIEW_COACHING_COPY = {
  panelTitle: 'Coaching',
  applyingSummary: 'Changes ready to review.',
  composerPlaceholder: 'Tell the agent what to do instead…',
  feedbackToast: 'Feedback submitted! The agent will be trained on your input.',
  feedbackToastAction: 'Track feedback',
  thanksToast: 'Thanks for the feedback!',
  trackLink: 'Track your feedback',
  coachLink: 'Coach agent',
} as const
