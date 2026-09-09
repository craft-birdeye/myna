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
