/** Library-card icons for create-agent flows (review / front desk / reminder). */

import iconApproval from '../../assets/library-cards/icon-approval.svg'
import iconAutonomous from '../../assets/library-cards/icon-autonomous.svg'
import iconDashboard from '../../assets/library-cards/icon-dashboard.svg'
import iconIntake from '../../assets/library-cards/icon-intake.svg'
import iconMedication from '../../assets/library-cards/icon-medication.svg'
import iconNoshow from '../../assets/library-cards/icon-noshow.svg'
import iconPrep from '../../assets/library-cards/icon-prep.svg'
import iconReminder from '../../assets/library-cards/icon-reminder.svg'
import iconRouting from '../../assets/library-cards/icon-routing.svg'
import iconScheduling from '../../assets/library-cards/icon-scheduling.svg'
import iconTemplates from '../../assets/library-cards/icon-templates.svg'

export type LibraryCardTone = 'info' | 'danger' | 'success' | 'ai' | 'warning'

export type LibraryCardGlyph =
  | 'templates'
  | 'autonomous'
  | 'approval'
  | 'dashboard'
  | 'routing'
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
  routing: iconRouting,
  intake: iconIntake,
  scheduling: iconScheduling,
  reminder: iconReminder,
  noshow: iconNoshow,
  prep: iconPrep,
  medication: iconMedication,
}

export function LibraryCardIcon({
  glyph,
}: {
  glyph: LibraryCardGlyph
  /** Kept for call-site compatibility; color lives in the SVG. */
  tone?: LibraryCardTone
}) {
  return (
    <img
      src={ICONS[glyph]}
      alt=""
      width={44}
      height={44}
      className="size-11 shrink-0"
      aria-hidden
    />
  )
}
