export interface TopNavProps {
  /** Module / section name shown on the left of the bar. */
  title?: string
  /** Avatar image URL; falls back to an initials circle when omitted. */
  avatarUrl?: string
  initials?: string
  onAdd?: () => void
  onAskBirdGPT?: () => void
  onMenu?: () => void
}
