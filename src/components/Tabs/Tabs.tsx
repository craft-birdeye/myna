import { TabCountPill } from './TabCountPill'
import { TabsProps } from './Tabs.types'

/**
 * Aero underline text tabs: full-width `border-b` baseline; each tab uses a 2px bottom
 * border (primary or transparent) with `-mb-px` so the active indicator stacks on the baseline.
 */
export function Tabs({ tabs, activeTab, onChange, showBaseline = true }: TabsProps) {
  return (
    <div
      role="tablist"
      className={`flex flex-wrap items-end gap-x-sm gap-y-sm${showBaseline ? ' border-b border-border' : ''}`}
    >
      {tabs.map((tab) => {
        const active = tab.id === activeTab
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.id)}
            className={`inline-flex -mb-px items-center gap-xs border-b-2 px-sm pb-sm pt-xs text-body transition-colors ${
              active
                ? 'border-primary text-primary'
                : 'border-transparent text-text-secondary hover:border-border hover:text-text-primary'
            }`}
          >
            {tab.icon}
            {tab.label}
            {tab.count !== undefined && <TabCountPill count={tab.count} />}
          </button>
        )
      })}
    </div>
  )
}
