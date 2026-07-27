import { EmptyStateProps } from './EmptyState.types'

function NoResultsIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className="text-text-tertiary">
      <circle cx="8" cy="8" r="5" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2" opacity="0.5" />
      <circle cx="24" cy="8" r="5" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2" opacity="0.5" />
      <circle cx="8" cy="24" r="5" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2" opacity="0.5" />
      <circle cx="22" cy="22" r="5" stroke="currentColor" strokeWidth="2" />
      <line x1="26" y1="26" x2="30" y2="30" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

export function EmptyState({ title, description, className = '' }: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center gap-md ${className}`}>
      <NoResultsIcon />
      <p className="text-body text-text-primary">{title}</p>
      {description && <p className="text-small text-text-secondary">{description}</p>}
    </div>
  )
}
