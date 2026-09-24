import { ReportHeaderProps } from './ReportHeader.types'

export function ReportHeader({ title, subtitle, rightSlot, size = 'default' }: ReportHeaderProps) {
  const isDisplay = size === 'display'
  return (
    <div className="sticky top-0 z-10 flex items-start justify-between bg-surface px-2xl py-xl">
      <div className={isDisplay ? 'flex flex-col' : 'flex flex-col gap-xs'}>
        <h1 className={`m-0 ${isDisplay ? 'text-display' : 'text-h3'} text-text-primary`}>{title}</h1>
        {subtitle && (
          <p className={`m-0 ${isDisplay ? 'mt-xs text-body' : 'text-small'} text-text-secondary`}>
            {subtitle}
          </p>
        )}
      </div>
      {rightSlot}
    </div>
  )
}
