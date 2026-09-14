import { useEffect, useRef, useState } from 'react'
import birdeyeLogo from '../../assets/birdeye-logo.svg'
import { FigmaIconSuperAgent } from '../l1Icons'
import { Icon } from '../Icon/Icon'
import { AppSwitcherProps } from './AppSwitcher.types'

// Global TopBar app switcher — sits where the plain module-name text used to live.
// Styled to match the standalone Super Agent prototype's own two switchers so the
// experience feels the same on both sides of the overlay: its BirdeyeSwitcher (the
// "Super Agent  BIRDEYE ⌄" control inside the Super agent app's own left nav) and
// its AppLauncher (the "Birdeye ⌄" hotspot on the Birdeye dashboard mockup) share
// this same shape — icon + title (+ a small-caps tag) + chevron trigger, a promoted
// row linking to the other app, a divider, then a quiet "You are on X · Current" row.
// (Regular font weight throughout per CLAUDE.md §6.6 — hierarchy comes from size/color,
// not the prototype's own font-semibold classes.)
export function AppSwitcher({ onSuperAgent, onSelectBirdeye, onSelectSuperAgent }: AppSwitcherProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-label="Switch product"
        onClick={() => setOpen((v) => !v)}
        className={`flex h-9 items-center gap-xs rounded-md px-sm text-left transition-colors hover:bg-surface-l2 ${open ? 'bg-surface-l2' : ''}`}
      >
        {onSuperAgent ? (
          <FigmaIconSuperAgent size={20} className="shrink-0 text-text-primary" />
        ) : (
          <img src={birdeyeLogo} alt="" width={20} height={20} className="shrink-0" />
        )}
        <span className="truncate text-base text-text-primary">{onSuperAgent ? 'Super agent' : 'Birdeye'}</span>
        {onSuperAgent && (
          <span className="text-small uppercase tracking-wide text-text-tertiary">Birdeye</span>
        )}
        <Icon
          name="expand_more"
          size={16}
          className={`shrink-0 text-text-icon transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute left-0 top-[calc(100%+8px)] z-50 w-[300px] rounded-sm border border-border bg-surface p-xs shadow-dropdown">
          {onSuperAgent ? (
            <button
              type="button"
              onClick={() => {
                setOpen(false)
                onSelectBirdeye()
              }}
              className="flex w-full items-start gap-md rounded-sm p-sm text-left hover:bg-surface-hover"
            >
              <img src={birdeyeLogo} alt="" width={30} height={30} className="shrink-0" />
              <span className="min-w-0 flex-1">
                <span className="block text-body text-text-primary">Birdeye</span>
                <span className="mt-xs block text-small text-text-secondary">Back to your dashboard</span>
              </span>
              <Icon name="chevron_right" size={16} className="mt-xs shrink-0 text-text-icon" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setOpen(false)
                onSelectSuperAgent()
              }}
              className="flex w-full items-start gap-md rounded-sm p-sm text-left hover:bg-surface-hover"
            >
              <FigmaIconSuperAgent size={30} className="shrink-0 text-text-primary" />
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-xs">
                  <span className="text-body text-text-primary">Super agent</span>
                  <span className="rounded-full bg-surface-selected px-xs py-0.5 text-small text-text-action">New</span>
                </span>
                <span className="mt-xs block text-small text-text-secondary">
                  Build agents that do the work across every product
                </span>
              </span>
              <Icon name="chevron_right" size={16} className="mt-xs shrink-0 text-text-icon" />
            </button>
          )}

          <div className="my-xs h-px bg-border" />

          <div className="flex items-center gap-sm rounded-sm bg-surface-l2 px-sm py-sm">
            {onSuperAgent ? (
              <FigmaIconSuperAgent size={18} className="shrink-0 text-text-icon" />
            ) : (
              <img src={birdeyeLogo} alt="" width={18} height={18} className="shrink-0" />
            )}
            <span className="text-small text-text-secondary">
              {onSuperAgent ? 'You are in Super agent' : 'You are on Birdeye'}
            </span>
            <span className="ml-auto text-small text-text-tertiary">Current</span>
          </div>
        </div>
      )}
    </div>
  )
}
