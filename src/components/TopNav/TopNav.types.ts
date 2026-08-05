import type { ReactNode } from 'react'

export interface TopNavProps {
  /** Module / section name shown on the left of the bar. */
  title?: string
  /** Avatar image URL; falls back to an initials circle when omitted. */
  avatarUrl?: string
  initials?: string
  onAdd?: () => void
  onHelp?: () => void
  onMenu?: () => void
  /** Extra content rendered between Help and the avatar (e.g. a settings icon button). */
  beforeAvatar?: ReactNode
  /** Extra content rendered between the avatar and the Menu button (e.g. an AI-assist pill). */
  afterAvatar?: ReactNode
}
