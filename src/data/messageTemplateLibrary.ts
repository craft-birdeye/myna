/**
 * Text / email template library shown by `TemplatePickerModal`.
 *
 * Category counts are the real library sizes from the design (All 274, Reviews 96, …); the
 * rows below are a representative sample, so a count won't match the number of visible rows.
 * Template names are user-authored data, so they keep their original casing rather than the
 * product's sentence-case rule.
 */

export type TemplateKind = 'text' | 'email'

export interface MessageTemplate {
  id: string
  title: string
  /** Message body, shown as the row preview and inside the thumbnail. */
  body: string
  categoryId: string
}

export interface TemplateCategory {
  id: string
  label: string
  count?: number
}

export const TEXT_TEMPLATE_CATEGORIES: TemplateCategory[] = [
  { id: 'all', label: 'All', count: 274 },
  { id: 'reviews', label: 'Reviews', count: 96 },
  { id: 'customer-experience', label: 'Customer experience', count: 20 },
  { id: 'custom', label: 'Custom', count: 90 },
  { id: 'surveys', label: 'Surveys', count: 68 },
  { id: 'referrals', label: 'Referrals' },
]

export const TEXT_TEMPLATES: MessageTemplate[] = [
  {
    id: 'survey-pulse-test',
    title: 'Survey pulse survey test',
    body: 'Hi [Contact first name], Thanks for choosing [Business Name]. Please take the below survey. Reply STOP to unsub from feedback messages',
    categoryId: 'surveys',
  },
  {
    id: 'survey-text-sms-check',
    title: 'Survey Text Sms Check',
    body: 'Hi [Contact first name], Thanks for choosing [Business Name]. Please take the below survey. Reply STOP to unsub.',
    categoryId: 'surveys',
  },
  {
    id: 'testing-token-migrate',
    title: 'testing token migrate',
    body: 'Hii[Location alias] [Business Name] Testing Token : Contact first name. https://www.google.com/ Txt NOMKT to unsub from Marketing messages',
    categoryId: 'custom',
  },
  {
    id: 'review-request',
    title: 'Review request',
    body: 'Hi [Contact first name], thanks for visiting [Business Name]. Would you mind sharing a quick review? [Review link]',
    categoryId: 'reviews',
  },
  {
    id: 'review-reminder',
    title: 'Review reminder',
    body: 'Hi [Contact first name], just a reminder — your feedback on [Business Name] helps others choose. [Review link]',
    categoryId: 'reviews',
  },
  {
    id: 'appointment-reminder',
    title: 'Appointment reminder',
    body: 'Hi [Contact first name], this is a reminder of your appointment with [Business Name] on [Appointment date] at [Appointment time].',
    categoryId: 'customer-experience',
  },
  {
    id: 'nps-follow-up',
    title: 'NPS follow-up',
    body: 'Hi [Contact first name], you rated us [NPS score]. We would love to hear what would make it a 10. [Survey link]',
    categoryId: 'surveys',
  },
  {
    id: 'referral-invite',
    title: 'Referral invite',
    body: 'Hi [Contact first name], know someone who would love [Business Name]? Share this link and you both get a reward: [Referral link]',
    categoryId: 'referrals',
  },
]

export const EMAIL_TEMPLATE_CATEGORIES: TemplateCategory[] = [
  { id: 'all', label: 'All', count: 186 },
  { id: 'reviews', label: 'Reviews', count: 54 },
  { id: 'customer-experience', label: 'Customer experience', count: 32 },
  { id: 'custom', label: 'Custom', count: 61 },
  { id: 'surveys', label: 'Surveys', count: 39 },
  { id: 'referrals', label: 'Referrals' },
]

export const EMAIL_TEMPLATES: MessageTemplate[] = [
  {
    id: 'email-review-request',
    title: 'Review request',
    body: 'Hi [Contact first name], thank you for choosing [Business Name]. Tell us how we did — it only takes a minute. [Review link]',
    categoryId: 'reviews',
  },
  {
    id: 'email-review-reminder',
    title: 'Review reminder',
    body: 'Hi [Contact first name], we noticed you have not left a review yet. Your feedback helps [Business Name] improve. [Review link]',
    categoryId: 'reviews',
  },
  {
    id: 'email-appointment-confirmation',
    title: 'Appointment confirmation',
    body: 'Hi [Contact first name], your appointment with [Business Name] is confirmed for [Appointment date] at [Appointment time].',
    categoryId: 'customer-experience',
  },
  {
    id: 'email-appointment-reminder',
    title: 'Appointment reminder',
    body: 'Hi [Contact first name], this is a reminder of your upcoming appointment on [Appointment date] at [Appointment time].',
    categoryId: 'customer-experience',
  },
  {
    id: 'email-survey-invitation',
    title: 'Survey invitation',
    body: 'Hi [Contact first name], we would love your feedback on your recent visit to [Business Name]. [Survey link]',
    categoryId: 'surveys',
  },
  {
    id: 'email-nps-follow-up',
    title: 'NPS follow-up',
    body: 'Hi [Contact first name], thanks for scoring us [NPS score]. What would make your next visit better? [Survey link]',
    categoryId: 'surveys',
  },
  {
    id: 'email-follow-up-outreach',
    title: 'Follow-up outreach',
    body: 'Hi [Contact first name], following up on your enquiry with [Business Name]. Reply here and we will pick it up right away.',
    categoryId: 'custom',
  },
  {
    id: 'email-referral-invite',
    title: 'Referral invite',
    body: 'Hi [Contact first name], refer a friend to [Business Name] and you both get a reward. [Referral link]',
    categoryId: 'referrals',
  },
]

export function getTemplateLibrary(kind: TemplateKind) {
  return kind === 'email'
    ? { categories: EMAIL_TEMPLATE_CATEGORIES, templates: EMAIL_TEMPLATES }
    : { categories: TEXT_TEMPLATE_CATEGORIES, templates: TEXT_TEMPLATES }
}

/** Resolves a saved template id back to its name, for a field that stores only the id. */
export function getTemplateTitle(kind: TemplateKind, id?: string): string {
  if (!id) return ''
  return getTemplateLibrary(kind).templates.find((t) => t.id === id)?.title ?? ''
}

/**
 * Field label for a multi-select of templates: one pick reads by name, the whole library
 * reads "All selected", anything else counts.
 */
export function formatTemplateSelection(kind: TemplateKind, ids: string[] = []): string {
  if (ids.length === 0) return ''
  const { templates } = getTemplateLibrary(kind)
  if (ids.length >= templates.length) return 'All selected'
  if (ids.length === 1) return getTemplateTitle(kind, ids[0]) || '1 template'
  return `${ids.length} templates`
}

/**
 * Review-response templates offered by the "Select template" action's Templates dropdown.
 * Seeded sample data — the real list comes from the account's own response templates — but
 * named and written the way a live library reads, by rating and by the concern being answered.
 */
export const REVIEW_RESPONSE_TEMPLATES: MessageTemplate[] = [
  {
    id: 'five-star-thanks',
    title: '5 star thank you',
    body: "Thank you for the kind words, [Reviewer first name]! We're glad your visit to [Business Name] went well, and we hope to see you again soon.",
    categoryId: 'reviews',
  },
  {
    id: 'four-star-thanks',
    title: '4 star thank you',
    body: "Thanks for the review, [Reviewer first name]. We're happy you had a good experience — tell us what would have made it a five-star visit at [Location phone/Business phone].",
    categoryId: 'reviews',
  },
  {
    id: 'three-star-follow-up',
    title: '3 star follow-up',
    body: "Thank you for the honest feedback, [Reviewer first name]. We'd like to understand what fell short — please reach us at [Location phone/Business phone].",
    categoryId: 'reviews',
  },
  {
    id: 'low-rating-apology',
    title: '1-2 star apology',
    body: "We're sorry your experience didn't meet expectations, [Reviewer first name]. Please contact us at [Location phone/Business phone] so we can put things right.",
    categoryId: 'reviews',
  },
  {
    id: 'no-comment-rating',
    title: 'Rating with no comment',
    body: "Thank you for taking the time to rate [Business Name], [Reviewer first name]. If there is anything we could do better, we would love to hear from you.",
    categoryId: 'reviews',
  },
  {
    id: 'staff-praise',
    title: 'Staff praise',
    body: "Thank you, [Reviewer first name]! We will pass your kind words on to the team at [Business Name] — it means a lot to them.",
    categoryId: 'reviews',
  },
  {
    id: 'wait-time-apology',
    title: 'Wait time apology',
    body: "We are sorry about the wait, [Reviewer first name]. We are adjusting how we schedule appointments so your next visit at [Business Name] is quicker.",
    categoryId: 'reviews',
  },
  {
    id: 'billing-concern',
    title: 'Billing concern',
    body: "Thank you for flagging this, [Reviewer first name]. Our billing team is reviewing your account and will reach out on [Location phone/Business phone].",
    categoryId: 'reviews',
  },
  {
    id: 'service-recovery',
    title: 'Service recovery',
    body: "We appreciate you giving us another chance, [Reviewer first name]. Ask for our manager on your next visit and we will make sure everything goes smoothly.",
    categoryId: 'reviews',
  },
  {
    id: 'recommendation-thanks',
    title: 'Recommendation thank you',
    body: "Thanks for recommending [Business Name], [Reviewer first name]. Referrals from customers like you mean everything to our team.",
    categoryId: 'reviews',
  },
]
