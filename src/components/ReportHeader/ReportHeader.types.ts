import type { ReactNode } from 'react'

export interface ReportHeaderProps {
  title: string
  subtitle?: string
  rightSlot?: ReactNode
  /** `display` matches Classic overview welcome (text-display + text-body). Default is report chrome (text-h3 + text-small). */
  size?: 'default' | 'display'
}
