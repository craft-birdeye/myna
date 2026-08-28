import React from 'react'

export interface Tab {
  id: string
  label: string
  count?: number
  icon?: React.ReactNode
}

export interface TabsProps {
  tabs: Tab[]
  activeTab: string
  onChange: (tabId: string) => void
  /** Full-width grey baseline under the tab row — off for agent instance header tabs. */
  showBaseline?: boolean
}
