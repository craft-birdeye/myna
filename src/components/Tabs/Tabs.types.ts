import React from 'react'

export interface Tab {
  id: string
  label: string
  count?: number
  icon?: React.ReactNode
  /** Second line shown under the label in the `'title-subtext'` variant. */
  subtext?: string
}

export interface TabsProps {
  tabs: Tab[]
  activeTab: string
  onChange: (tabId: string) => void
  /** `'default'` (single line, 14px) or `'title-subtext'` (14px title + 12px `subtext` line). Default `'default'`. */
  variant?: 'default' | 'title-subtext'
  /** Fixed width (px) applied to every tab button. Default: content-sized. */
  tabWidth?: number
}
