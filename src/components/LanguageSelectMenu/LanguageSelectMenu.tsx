import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { languageFlagSrc } from '../../data/agentLanguages'
import { Icon } from '../Icon/Icon'
import type { LanguageSelectMenuProps } from './LanguageSelectMenu.types'

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

export function LanguageFlag({
  countryCode,
  label,
  size = 'md',
}: {
  countryCode: string
  label: string
  size?: 'sm' | 'md'
}) {
  const dim = size === 'sm' ? 20 : 24
  return (
    <span
      className={`inline-flex shrink-0 overflow-hidden rounded-full bg-surface-l2 ${
        size === 'sm' ? 'size-5' : 'size-6'
      }`}
      aria-hidden
    >
      <img
        src={languageFlagSrc(countryCode)}
        alt=""
        width={dim}
        height={dim}
        className="size-full object-cover"
        loading="lazy"
        title={label}
      />
    </span>
  )
}

export function LanguageSelectMenu({
  options,
  value,
  values = [],
  multi = false,
  onSelect,
  onChange,
  className = '',
}: LanguageSelectMenuProps) {
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const selected = new Set(multi ? values : value ? [value] : [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return options
    return options.filter((o) => o.label.toLowerCase().includes(q))
  }, [options, query])

  useLayoutEffect(() => {
    inputRef.current?.focus({ preventScroll: true })
  }, [])

  function toggle(id: string) {
    if (multi) {
      const next = selected.has(id) ? values.filter((v) => v !== id) : [...values, id]
      onChange?.(next)
      return
    }
    onSelect?.(id)
  }

  return (
    <div
      className={`absolute left-0 right-0 top-full z-20 mt-xs flex max-h-[320px] flex-col overflow-hidden rounded-sm border border-border bg-surface p-md shadow-dropdown ${className}`}
      role="listbox"
      aria-multiselectable={multi || undefined}
    >
      <div className="flex h-9 shrink-0 items-center gap-sm rounded-sm border border-border-selected bg-surface px-md">
        <Icon name="search" size={20} className="text-text-icon" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search"
          className="min-w-0 flex-1 bg-transparent text-body text-text-primary outline-none placeholder:text-text-tertiary"
        />
      </div>

      <div className="mt-sm min-h-0 flex-1 overflow-y-auto">
        {filtered.map((lang) => {
          const isSelected = selected.has(lang.id)
          return (
            <button
              key={lang.id}
              type="button"
              role="option"
              aria-selected={isSelected}
              onClick={() => toggle(lang.id)}
              className={`flex w-full items-center gap-sm rounded-sm px-sm py-sm text-left hover:bg-surface-hover ${
                !multi && isSelected ? 'bg-surface-selected' : ''
              }`}
            >
              {multi && <CheckBox checked={isSelected} />}
              <LanguageFlag countryCode={lang.countryCode} label={lang.label} />
              <span className="min-w-0 flex-1 truncate text-body text-text-primary">
                {lang.label}
              </span>
            </button>
          )
        })}

        {filtered.length === 0 && (
          <p className="px-sm py-sm text-body text-text-tertiary">No results.</p>
        )}
      </div>
    </div>
  )
}
