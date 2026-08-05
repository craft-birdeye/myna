import { useState } from 'react'
import { Tabs, TopNav, type Tab } from '../components'
import { AgentDirectoryScreen } from './AgentDirectoryScreen'
import { OverviewScreen } from './OverviewScreen'

const AI_OVERVIEW_TABS: Tab[] = [
  { id: 'coworker', label: 'AI Co-worker' },
  { id: 'business', label: 'Business metrics' },
]

interface AIOverviewScreenProps {
  product?: string
  onOpenAgent?: (navId: string) => void
}

export function AIOverviewScreen({ product, onOpenAgent }: AIOverviewScreenProps) {
  const [activeTab, setActiveTab] = useState('coworker')

  return (
    <div className="flex h-full flex-col">
      <TopNav title="Overview" initials="S" />
      <div className="shrink-0 border-b border-border px-2xl">
        <Tabs tabs={AI_OVERVIEW_TABS} activeTab={activeTab} onChange={setActiveTab} />
      </div>
      <div className="flex-1 overflow-hidden">
        {activeTab === 'coworker' ? (
          <AgentDirectoryScreen
            product={product}
            onOpenAgent={onOpenAgent}
            headingOverride="AI co-worker performance"
            coworkerTabsWithSubtext
            hideTopNav
          />
        ) : (
          <OverviewScreen hideTopNav hideWelcomeHeader />
        )}
      </div>
    </div>
  )
}
