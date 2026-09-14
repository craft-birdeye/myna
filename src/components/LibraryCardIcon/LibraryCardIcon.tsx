/** Library-card icons for create-agent flows (review / front desk / reminder). */

import iconApproval from '../../assets/library-cards/icon-approval.svg'
import iconFrontDesk from '../../assets/library-cards/icon-front-desk.svg'
import iconAutonomous from '../../assets/library-cards/icon-autonomous.svg'
import iconDashboard from '../../assets/library-cards/icon-dashboard.svg'
import iconGeneration from '../../assets/library-cards/icon-generation.svg'
import iconGenerationAb from '../../assets/library-cards/icon-generation-ab.svg'
import iconIntake from '../../assets/library-cards/icon-intake.svg'
import iconMedication from '../../assets/library-cards/icon-medication.svg'
import iconNoshow from '../../assets/library-cards/icon-noshow.svg'
import iconPrep from '../../assets/library-cards/icon-prep.svg'
import iconReminder from '../../assets/library-cards/icon-reminder.svg'
import iconRouting from '../../assets/library-cards/icon-routing.svg'
import iconScheduling from '../../assets/library-cards/icon-scheduling.svg'
import iconSmsWebchat from '../../assets/library-cards/icon-sms-webchat.svg'
import iconTagging from '../../assets/library-cards/icon-tagging.svg'
import iconTaggingRisk from '../../assets/library-cards/icon-tagging-risk.svg'
import iconTemplates from '../../assets/library-cards/icon-templates.svg'
import iconFrontdeskAgents from '../../assets/library-cards/icon-frontdesk-agents.svg'
import iconFrontdeskAgents2 from '../../assets/library-cards/icon-frontdesk-agents-2.svg'
import iconReviewAgents from '../../assets/library-cards/icon-review-agents.svg'
import iconReviewAgents2 from '../../assets/library-cards/icon-review-agents-2.svg'
import iconReviewAgents3 from '../../assets/library-cards/icon-review-agents-3.svg'
import iconSocialAgents from '../../assets/library-cards/icon-social-agents.svg'
import iconSocialAgents2 from '../../assets/library-cards/icon-social-agents-2.svg'
import iconSocialAgents3 from '../../assets/library-cards/icon-social-agents-3.svg'
import iconSurveyAgents from '../../assets/library-cards/icon-survey-agents.svg'
import iconSurveyAgents2 from '../../assets/library-cards/icon-survey-agents-2.svg'
import iconSurveyAgents3 from '../../assets/library-cards/icon-survey-agents-3.svg'
import iconTicketingAgents from '../../assets/library-cards/icon-ticketing-agents.svg'
import iconTicketingAgents2 from '../../assets/library-cards/icon-ticketing-agents-2.svg'
import iconTicketingAgents3 from '../../assets/library-cards/icon-ticketing-agents-3.svg'

export type LibraryCardTone = 'info' | 'danger' | 'success' | 'ai' | 'warning'

export type LibraryCardGlyph =
  | 'templates'
  | 'front-desk'
  | 'autonomous'
  | 'approval'
  | 'dashboard'
  | 'generation'
  | 'generation-ab'
  | 'tagging'
  | 'tagging-risk'
  | 'routing'
  | 'sms-webchat'
  | 'intake'
  | 'scheduling'
  | 'reminder'
  | 'noshow'
  | 'prep'
  | 'medication'
  | 'frontdesk-agents'
  | 'frontdesk-agents-2'
  | 'review-agents'
  | 'review-agents-2'
  | 'review-agents-3'
  | 'social-agents'
  | 'social-agents-2'
  | 'social-agents-3'
  | 'survey-agents'
  | 'survey-agents-2'
  | 'survey-agents-3'
  | 'ticketing-agents'
  | 'ticketing-agents-2'
  | 'ticketing-agents-3'

const ICONS: Record<LibraryCardGlyph, string> = {
  templates: iconTemplates,
  'front-desk': iconFrontDesk,
  autonomous: iconAutonomous,
  approval: iconApproval,
  dashboard: iconDashboard,
  generation: iconGeneration,
  'generation-ab': iconGenerationAb,
  tagging: iconTagging,
  'tagging-risk': iconTaggingRisk,
  routing: iconRouting,
  'sms-webchat': iconSmsWebchat,
  intake: iconIntake,
  scheduling: iconScheduling,
  reminder: iconReminder,
  noshow: iconNoshow,
  prep: iconPrep,
  medication: iconMedication,
  'frontdesk-agents': iconFrontdeskAgents,
  'frontdesk-agents-2': iconFrontdeskAgents2,
  'review-agents': iconReviewAgents,
  'review-agents-2': iconReviewAgents2,
  'review-agents-3': iconReviewAgents3,
  'social-agents': iconSocialAgents,
  'social-agents-2': iconSocialAgents2,
  'social-agents-3': iconSocialAgents3,
  'survey-agents': iconSurveyAgents,
  'survey-agents-2': iconSurveyAgents2,
  'survey-agents-3': iconSurveyAgents3,
  'ticketing-agents': iconTicketingAgents,
  'ticketing-agents-2': iconTicketingAgents2,
  'ticketing-agents-3': iconTicketingAgents3,
}

export function LibraryCardIcon({
  glyph,
  size = 'md',
}: {
  glyph: LibraryCardGlyph
  /** Kept for call-site compatibility; color lives in the SVG. */
  tone?: LibraryCardTone
  /** `md` = 44px (default), `sm` = 32px. */
  size?: 'sm' | 'md'
}) {
  const px = size === 'sm' ? 32 : 44
  const src = ICONS[glyph] ?? ICONS.templates
  return (
    <img
      src={src}
      alt=""
      width={px}
      height={px}
      className={`shrink-0 ${size === 'sm' ? 'size-8' : 'size-11'}`}
      aria-hidden
    />
  )
}
