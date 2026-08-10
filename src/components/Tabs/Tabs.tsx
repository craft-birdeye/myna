import { TabCountPill } from './TabCountPill'
import { TabsProps } from './Tabs.types'

export function Tabs({ tabs, activeTab, onChange }: TabsProps) {
  return (
    <div className="flex items-end gap-xs">
      {tabs.map((tab) => {
        const active = tab.id === activeTab
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className="flex flex-col items-stretch"
          >
            <span
              className={`flex h-[34px] items-center gap-xs rounded-md px-sm text-body transition-colors ${
                active ? 'text-text-primary' : 'text-text-secondary hover:bg-surface-hover'
              }`}
            >
              {tab.icon}
              {tab.label}
              {tab.count !== undefined && <TabCountPill count={tab.count} />}
            </span>
            <span className={`h-[2px] w-full ${active ? 'bg-primary' : 'bg-transparent'}`} />
          </button>
        )
      })}
    </div>
  )
}
