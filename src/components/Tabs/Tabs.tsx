import { Fragment } from 'react'
import { TabCountPill } from './TabCountPill'
import { TabsProps } from './Tabs.types'

export function Tabs({ tabs, activeTab, onChange, variant = 'default', tabWidth }: TabsProps) {
  const withSubtext = variant === 'title-subtext'
  return (
    <div className={`flex gap-xs ${withSubtext ? 'h-[50px] items-center' : 'items-end'}`}>
      {tabs.map((tab, i) => {
        const active = tab.id === activeTab
        return (
          <Fragment key={tab.id}>
            {i > 0 && withSubtext && <span className="h-1/2 w-px shrink-0 bg-border" />}
            <button
              type="button"
              onClick={() => onChange(tab.id)}
              className="flex flex-col items-stretch text-left"
              style={tabWidth ? { width: tabWidth, flexShrink: 0 } : undefined}
            >
              {variant === 'title-subtext' ? (
                <span
                  className={`flex flex-col gap-[2px] rounded-sm px-lg py-xs text-left transition-colors ${
                    active ? 'text-text-primary' : 'text-text-secondary hover:bg-surface-hover'
                  }`}
                >
                  <span className="flex items-center gap-xs text-body">
                    {tab.icon}
                    {tab.label}
                    {tab.count !== undefined && <TabCountPill count={tab.count} />}
                  </span>
                  {tab.subtext && <span className="text-left text-small text-text-tertiary">{tab.subtext}</span>}
                </span>
              ) : (
                <span
                  className={`flex h-9 items-center gap-xs rounded-sm px-sm text-body transition-colors ${
                    active ? 'text-text-primary' : 'text-text-secondary hover:bg-surface-hover'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                  {tab.count !== undefined && <TabCountPill count={tab.count} />}
                </span>
              )}
              <span className={`h-[2px] w-full ${active ? 'bg-primary' : 'bg-transparent'}`} />
            </button>
          </Fragment>
        )
      })}
    </div>
  )
}
