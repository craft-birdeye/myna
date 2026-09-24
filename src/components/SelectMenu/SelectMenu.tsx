import { useMemo, useState } from 'react'
import { Icon } from '../Icon/Icon'
import { SelectMenuProps } from './SelectMenu.types'

function CheckBox({ checked }: { checked: boolean }) {
  return (
    <span
      className={`flex size-[18px] shrink-0 items-center justify-center rounded-[2px] border transition-colors ${
        checked ? 'border-primary bg-primary' : 'border-control-border bg-surface'
      }`}
    >
      {checked && <Icon name="check" size={14} weight={500} className="text-white" />}
    </span>
  )
}

export function SelectMenu({
  options,
  value,
  title,
  multi = false,
  searchable = true,
  onChange,
  onApply,
}: SelectMenuProps) {
  const [query, setQuery] = useState('')
  const selected = new Set(value)

  const filtered = useMemo(
    () => options.filter((o) => {
      const q = query.trim().toLowerCase()
      if (!q) return true
      return o.label.toLowerCase().includes(q) || (o.description?.toLowerCase().includes(q) ?? false)
    }),
    [options, query],
  )
  const allSelected = options.length > 0 && options.every((o) => selected.has(o.value))

  function toggle(val: string) {
    if (multi) {
      onChange(selected.has(val) ? value.filter((v) => v !== val) : [...value, val])
    } else {
      onChange([val])
    }
  }

  function toggleAll() {
    onChange(allSelected ? [] : options.map((o) => o.value))
  }

  return (
    <div
      className={`flex max-h-[360px] flex-col overflow-hidden rounded-sm bg-surface shadow-dropdown ${
        title ? 'border border-border' : ''
      }`}
    >
      {title && (
        <div className="px-lg pb-sm pt-md">
          <span className="text-small text-text-tertiary">{title}</span>
        </div>
      )}
      <div className={`flex flex-1 flex-col gap-xs overflow-hidden ${title ? '' : 'pt-md'}`}>
        <div className={`flex flex-1 flex-col gap-xs overflow-y-auto px-lg ${multi && !onApply ? 'pb-md' : 'pb-xs'}`}>
          {searchable && (
            <div className="flex h-9 shrink-0 items-center gap-sm rounded-sm border border-border-selected bg-surface px-md">
              <Icon name="search" size={20} className="text-text-icon" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search"
                className="min-w-0 flex-1 bg-transparent text-body text-text-primary outline-none placeholder:text-text-tertiary"
              />
            </div>
          )}

          {multi && (
            <button
              type="button"
              onClick={toggleAll}
              className="flex w-full items-center gap-sm rounded-sm py-sm pr-sm text-left hover:bg-surface-hover"
            >
              <CheckBox checked={allSelected} />
              <span className="min-w-0 flex-1 truncate text-body text-text-primary">All</span>
            </button>
          )}

          {filtered.map((opt) => {
            const isSel = selected.has(opt.value)
            // Single select — label left, gray tick on the right, gray selected row.
            const labelBlock = (
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-body text-text-primary">{opt.label}</span>
                {opt.description && (
                  <span className="truncate text-xs text-text-tertiary">{opt.description}</span>
                )}
              </span>
            )
            if (!multi) {
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => toggle(opt.value)}
                  className={`flex w-full items-center gap-sm rounded-sm py-sm pl-md pr-sm text-left ${
                    isSel ? 'bg-surface-selected' : 'hover:bg-surface-hover'
                  }`}
                >
                  {labelBlock}
                  {isSel && <Icon name="check" size={20} className="shrink-0 text-text-icon" />}
                </button>
              )
            }
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => toggle(opt.value)}
                className={`flex w-full gap-sm rounded-sm py-sm pr-sm text-left hover:bg-surface-hover ${opt.description ? 'items-start' : 'items-center'}`}
              >
                <span className={opt.description ? 'mt-xs' : ''}>
                  <CheckBox checked={isSel} />
                </span>
                {labelBlock}
              </button>
            )
          })}

          {filtered.length === 0 && (
            <p className="py-sm text-body text-text-tertiary">No results.</p>
          )}
        </div>
      </div>

      {multi && onApply && (
        <>
          <span className="h-px w-full bg-border" />
          <div className="flex justify-end p-xl">
            <button
              type="button"
              onClick={onApply}
              className="rounded-sm bg-primary px-lg py-[7px] text-body font-medium text-white transition-colors hover:bg-primary-hover"
            >
              Apply
            </button>
          </div>
        </>
      )}
    </div>
  )
}
