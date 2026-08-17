import { useRef, useState } from 'react'
import { BackArrowIcon } from '../assets/BackArrowIcon'
import { ChevronDown, Plus, Sparkles } from 'lucide-react'
import { InfoCard, Link, TopNav } from '../components'
import { NewFrontdeskAgentSetupScreen } from './NewFrontdeskAgentSetupScreen'

interface CreateFrontdeskAgentScreenProps {
  onBack: () => void
  onUseTemplate?: (templateTitle: string) => void
}

const TEMPLATES = [
  {
    title: 'Routing and triage',
    description:
      'Handles inbound calls, identifies intent, routes urgent symptoms, and transfers to the right team with context',
  },
  {
    title: 'New patient intake',
    description:
      'Guides new patients through intake, verifies their insurance, and books the right appointment',
  },
  {
    title: 'Established patient scheduling',
    description:
      'Validates existing records, checks coverage, and books or reschedules follow-up visits with preferred providers',
  },
  {
    title: 'Urgent escalations',
    description:
      'Detects high-risk symptoms, follows escalation policy, and hands off immediately to clinical staff or emergency guidance',
  },
]

function AgentSetupIllustration() {
  return (
    <div className="relative">
      <div className="flex w-[168px] flex-col items-center rounded-sm bg-surface p-lg shadow-dropdown">
        <div className="flex h-[23px] w-[76px] items-center rounded-sm bg-surface-l2 pl-sm">
          <div className="h-1 w-[51px] rounded-full bg-border-strong" />
        </div>

        <div className="mt-xs flex gap-xs">
          {[0, 1].map((i) => (
            <div key={i} className="relative flex size-9 items-center justify-center">
              <svg width="36" height="31" viewBox="0 0 36 31" fill="none" className="absolute" aria-hidden>
                <path d="M18 0 L18 12 M18 12 L6 24 M18 12 L30 24" stroke="#afbcdf" strokeWidth="1" />
              </svg>
              <div className="relative z-[1] flex size-5 items-center justify-center rounded-full bg-surface-l2">
                <Plus className="size-4 text-text-icon" strokeWidth={1.6} absoluteStrokeWidth />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-xs flex w-full gap-xs">
          <div className="flex h-[23px] w-[72px] shrink-0 items-center justify-center rounded-sm border border-dashed border-text-icon bg-surface-l2">
            <Plus className="size-4 text-text-icon" strokeWidth={1.6} absoluteStrokeWidth />
          </div>
          <div className="flex h-[23px] flex-1 items-center rounded-sm bg-surface-l2 pl-sm">
            <div className="h-1 w-[80%] rounded-full bg-border-strong" />
          </div>
        </div>
      </div>

      <div className="absolute -right-[62px] -top-[23px] flex w-[116px] items-end gap-xs rounded-sm border border-[#6834b7] bg-[#ecf5fd] px-sm py-md">
        <Sparkles className="size-5 text-[#6834b7]" strokeWidth={1.6} absoluteStrokeWidth />
        <div className="flex flex-1 flex-col gap-xs">
          <div className="h-1 w-full rounded-full bg-primary" />
          <div className="h-1 w-[60%] rounded-full bg-[#9aceff]" />
        </div>
      </div>
    </div>
  )
}

export function CreateFrontdeskAgentScreen({
  onBack,
  onUseTemplate,
}: CreateFrontdeskAgentScreenProps) {
  const libraryRef = useRef<HTMLDivElement>(null)
  const [showSetupWizard, setShowSetupWizard] = useState(false)

  const scrollToLibrary = () => {
    libraryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  if (showSetupWizard) {
    return (
      <NewFrontdeskAgentSetupScreen
        onBack={() => setShowSetupWizard(false)}
        onCancel={onBack}
        onComplete={(draft) => onUseTemplate?.(draft.agentName)}
      />
    )
  }

  return (
    <div className="flex h-full flex-col">
      <TopNav initials="S" />

      <div className="sticky top-0 z-10 flex shrink-0 items-center gap-sm bg-surface px-2xl py-xl">
        <button
          type="button"
          aria-label="Back"
          onClick={onBack}
          className="flex size-8 items-center justify-center rounded-md text-text-icon hover:bg-surface-hover"
        >
          <BackArrowIcon />
        </button>
        <h1 className="text-h3 text-text-primary">Front desk agents</h1>
      </div>

      <div className="flex flex-1 flex-col overflow-auto px-2xl pb-2xl">
        <div className="flex flex-1 flex-col items-center justify-center gap-lg py-2xl">
          <AgentSetupIllustration />

          <div className="flex flex-col items-center gap-sm text-center">
            <p className="text-body text-text-primary">
              Build your agent.{' '}
              <Link
                as="button"
                onClick={() => setShowSetupWizard(true)}
                className="text-body"
              >
                Set up a new agent
              </Link>
            </p>
            <p className="text-body text-text-primary">or</p>
            <button
              type="button"
              onClick={scrollToLibrary}
              className="flex items-center gap-xs text-body text-text-primary"
            >
              Select from <span className="text-text-action">library</span>
              <ChevronDown className="size-4 text-text-action" strokeWidth={1.6} absoluteStrokeWidth />
            </button>
          </div>
        </div>

        <div ref={libraryRef} className="grid grid-cols-1 gap-lg md:grid-cols-2 xl:grid-cols-4">
          {TEMPLATES.map((template) => (
            <InfoCard
              key={template.title}
              title={template.title}
              description={template.description}
              onAction={() => onUseTemplate?.(template.title)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
