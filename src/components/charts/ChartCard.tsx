import { useEffect, useRef, useState, type ReactNode } from 'react'
import { MoreVertical } from 'lucide-react'
import { ChartCardButton } from './ChartCardButton'
import { InfoTooltip } from '../InfoTooltip/InfoTooltip'

export interface ChartCardProps {
  title: string
  /** When provided, renders an info icon next to the title that shows this text on hover. */
  tooltip?: string
  /** Renders inline immediately after the title text. */
  titleSuffix?: ReactNode
  /** Optional content shown between the title and the menu (e.g. mini KPIs). */
  toolbar?: ReactNode
  /** Show the trailing customize/menu icons (decorative on the prototype). */
  showActions?: boolean
  /** Override the left action icon (defaults to 'table_rows'). */
  leftActionIcon?: string
  className?: string
  children: ReactNode
}

function ChartCardTitle({ title, tooltip }: { title: string; tooltip?: string }) {
  return (
    <div className="flex items-center gap-xs">
      <h3 className="text-[16px] leading-6 tracking-[-0.32px] text-text-primary">{title}</h3>
      {tooltip && <InfoTooltip text={tooltip} />}
    </div>
  )
}

function MoreMenu() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div ref={ref} className="relative">
      <ChartCardButton icon={MoreVertical} label="More" onClick={() => setOpen((v) => !v)} />
      {open && (
        <div className="absolute right-0 top-full z-50 mt-xs w-48 rounded-sm bg-surface p-md shadow-dropdown">
          {['Download', 'Email'].map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setOpen(false)}
              className="flex w-full items-center rounded-sm px-sm py-sm text-left text-body text-text-primary transition-colors hover:bg-surface-hover"
            >
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export function ChartCard({ title, tooltip, titleSuffix, toolbar, showActions = true, className = '', children }: ChartCardProps) {
  return (
    <section className={`flex min-h-[400px] flex-col rounded-md border border-border bg-surface p-2xl ${className}`}>
      <header className="mb-2xl flex shrink-0 items-center justify-between gap-md">
        <div className="flex items-center gap-xs">
          <ChartCardTitle title={title} tooltip={tooltip} />
          {titleSuffix}
        </div>
        <div className="flex items-center gap-sm">
          {toolbar}
          {showActions && (
            <div className="flex items-center gap-xs">
              <MoreMenu />
            </div>
          )}
        </div>
      </header>
      {children}
    </section>
  )
}
