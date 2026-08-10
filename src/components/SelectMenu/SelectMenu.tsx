import { useMemo, useState } from 'react'
import { SelectMenuProps } from './SelectMenu.types'
import { Check, Search } from 'lucide-react'

function CheckBox({ checked }: { checked: boolean }) {
  return (
    <span
      className={`flex size-[18px] shrink-0 items-center justify-center rounded-[2px] border transition-colors ${
        checked ? 'border-primary bg-primary' : 'border-control-border bg-surface'
      }`}
    >
      {checked && <Check className="size-4 text-white" strokeWidth={1.6} absoluteStrokeWidth />}
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
    () => options.filter((o) => o.label.toLowerCase().includes(query.trim().toLowerCase())),
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
            <div className="flex h-[34px] shrink-0 items-center gap-sm rounded-md border border-border-selected bg-surface px-md">
              <Search className="size-5 text-text-icon" strokeWidth={1.6} absoluteStrokeWidth />
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
                  <span className="min-w-0 flex-1 truncate text-body text-text-primary">{opt.label}</span>
                  {isSel && <Check className="size-5 shrink-0 text-text-icon" strokeWidth={1.6} absoluteStrokeWidth />}
                </button>
              )
            }
            // Multi select — checkbox on the left.
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => toggle(opt.value)}
                className="flex w-full items-center gap-sm rounded-sm py-sm pr-sm text-left hover:bg-surface-hover"
              >
                <CheckBox checked={isSel} />
                <span className="min-w-0 flex-1 truncate text-body text-text-primary">{opt.label}</span>
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
              className="rounded-md bg-primary px-lg py-[7px] text-body font-medium text-white transition-colors hover:bg-primary-hover"
            >
              Apply
            </button>
          </div>
        </>
      )}
    </div>
  )
}
