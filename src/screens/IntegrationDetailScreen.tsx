import { Link, TopNav } from '../components'
import { ChevronRight } from 'lucide-react'
import { getHealthcareIntegration } from '../data/healthcareIntegrations'

interface IntegrationDetailScreenProps {
  integrationId: string
  onBack: () => void
}

export function IntegrationDetailScreen({ integrationId, onBack }: IntegrationDetailScreenProps) {
  const integration = getHealthcareIntegration(integrationId)
  const title = integration?.name ?? integrationId

  return (
    <div className="flex h-full flex-col">
      <TopNav initials="S" />
      <div className="flex shrink-0 items-center gap-xs border-b border-border px-2xl py-md">
        <Link
          as="button"
          onClick={onBack}
          className="text-body"
        >
          Settings
        </Link>
        <ChevronRight className="size-4 text-text-icon" strokeWidth={1.6} absoluteStrokeWidth />
        <Link
          as="button"
          onClick={onBack}
          className="text-body"
        >
          Integrations
        </Link>
        <ChevronRight className="size-4 text-text-icon" strokeWidth={1.6} absoluteStrokeWidth />
        <span className="text-body text-text-primary">{title}</span>
      </div>
      <div className="flex flex-1 items-center justify-center px-2xl text-body text-text-secondary">
        {title} integration settings coming soon.
      </div>
    </div>
  )
}
