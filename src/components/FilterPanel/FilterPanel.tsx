import { useState } from 'react'
import { Icon } from '../Icon/Icon'
import { Link } from '../Link/Link'
import { SelectMenu } from '../SelectMenu/SelectMenu'
import { FilterField, FilterPanelProps } from './FilterPanel.types'

export function FilterPanel({
  open,
  fields,
  selections: controlledSelections,
  onSelectionsChange,
  onClose,
  onAdvancedFilters,
  onSelectionChange,
}: FilterPanelProps) {
  const [openId, setOpenId] = useState<string | null>(null)
  const [anchor, setAnchor] = useState<{ top: number; left: number; width: number } | null>(null)
  const [internalSelections, setInternalSelections] = useState<Record<string, string[]>>({})
  const selections = controlledSelections ?? internalSelections

  function updateSelections(next: Record<string, string[]>) {
    if (onSelectionsChange) onSelectionsChange(next)
    else setInternalSelections(next)
    onSelectionChange?.(next)
  }

  function openField(field: FilterField, e: React.MouseEvent<HTMLButtonElement>) {
    if (openId === field.id) {
      setOpenId(null)
      return
    }
    const r = e.currentTarget.getBoundingClientRect()
    setAnchor({ top: r.bottom + 4, left: r.left, width: r.width })
    setOpenId(field.id)
  }

  const activeField = fields.find((f) => f.id === openId)

  return (
    <div
      className={`flex h-full min-h-0 shrink-0 flex-col self-stretch overflow-hidden border-l border-border bg-surface transition-[width] duration-200 ${
        open ? 'w-[280px]' : 'w-0 border-l-0'
      }`}
      aria-hidden={!open}
    >
      <div className="flex h-full w-[280px] flex-col">
        {/* Header */}
        <div className="flex h-[68px] shrink-0 items-center justify-between px-xl py-lg">
          <h2 className="text-h3 text-text-primary">Filter</h2>
          {onClose && (
            <button
              type="button"
              aria-label="Close filter"
              onClick={onClose}
              className="flex size-7 items-center justify-center rounded-sm text-text-icon hover:bg-surface-hover"
            >
              <Icon name="close" size={20} />
            </button>
          )}
        </div>

        {/* Fields — scrollable */}
        <div className="flex flex-1 flex-col gap-sm overflow-y-auto px-xl pb-xl">
          <div className="flex flex-col gap-sm">
            {fields.map((field) => {
              const count = selections[field.id]?.length ?? 0
              return (
                <button
                  key={field.id}
                  type="button"
                  onClick={(e) => openField(field, e)}
                  className={`flex h-9 w-full items-center gap-sm rounded-sm border bg-surface pl-md pr-sm hover:bg-surface-l2 ${
                    openId === field.id ? 'border-primary' : 'border-border-input'
                  }`}
                >
                  <span
                    className={`min-w-0 flex-1 truncate text-left text-body ${
                      count > 0 ? 'text-text-primary' : 'text-text-secondary'
                    }`}
                  >
                    {field.label}
                    {count > 0 && ` (${count})`}
                  </span>
                  <Icon name="expand_more" size={20} className="shrink-0 text-text-icon" />
                </button>
              )
            })}
          </div>

          {onAdvancedFilters && (
            <Link
              as="button"
              onClick={onAdvancedFilters}
              className="self-start rounded-sm py-xs text-body font-normal text-primary"
            >
              Advanced filters
            </Link>
          )}
        </div>
      </div>

      {/* Select menu popover */}
      {activeField && anchor && (
        <>
          <div className="fixed inset-0 z-[105]" onClick={() => setOpenId(null)} />
          <div
            className="fixed z-[110] w-[232px]"
            style={{ top: anchor.top, left: anchor.left }}
          >
            <SelectMenu
              key={activeField.id}
              title={activeField.label}
              options={activeField.options ?? []}
              value={selections[activeField.id] ?? []}
              multi={activeField.multi ?? true}
              searchable={false}
              onChange={(val) => updateSelections({ ...selections, [activeField.id]: val })}
            />
          </div>
        </>
      )}
    </div>
  )
}
