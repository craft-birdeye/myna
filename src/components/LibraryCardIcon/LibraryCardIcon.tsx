/** Library-card icons for create-agent flows (review / front desk / reminder). */

import iconApproval from '../../assets/library-cards/icon-approval.svg'
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

export type LibraryCardTone = 'info' | 'danger' | 'success' | 'ai' | 'warning'

export type LibraryCardGlyph =
  | 'templates'
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

const ICONS: Record<LibraryCardGlyph, string> = {
  templates: iconTemplates,
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
  return (
    <img
      src={ICONS[glyph]}
      alt=""
      width={px}
      height={px}
      className={`shrink-0 ${size === 'sm' ? 'size-8' : 'size-11'}`}
      aria-hidden
    />
  )
}
