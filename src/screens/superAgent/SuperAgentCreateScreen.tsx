import { useState } from 'react'
import { Icon } from '../../components'
import { HealthcareFrontdeskCreateAgentScreen } from '../AgentDetailScreen'
import { getAgentCreateInitialPrompt, getAgentCreateLandingCards } from './agentCreateScripts'
import type { SuperAgentRole } from './superAgentSeedData'

// Native "Create agent" screen for the Agents L1 module. Renders the literal, real
// Front Desk create-agent component (not a fork/lookalike) so the landing view, the
// "Thoughts" scripted narrative, the chip rendering, and the "View agent builder"
// hand-off are all pixel/behavior-identical to Front Desk's own create flow — only the
// data fed into it (which library cards show, which prompt the composer focuses on)
// varies per role.
export interface SuperAgentCreateScreenProps {
  activeRole: SuperAgentRole
  /** Returns to My agents within this same module. */
  onBack?: () => void
  /** Opens the real workflow editor for the given agent name (empty string = new/blank
   *  agent) — wired by App.tsx to a wrapper around `handleEditAgent` that also arranges
   *  for the editor to return to this module's My agents on close. */
  onEditAgent: (name: string) => void
  /** Fires when the scripted flow reaches its own "agent created" step. */
  onCreated: () => void
}

export function SuperAgentCreateScreen({ activeRole, onBack, onEditAgent, onCreated }: SuperAgentCreateScreenProps) {
  const landingCards = getAgentCreateLandingCards(activeRole)
  const initialPrompt = getAgentCreateInitialPrompt(activeRole)
  // Tracks the working title once the scripted flow produces a draft, so the header can
  // switch from "Create agent" the same way Front Desk's own ghostwriter header does.
  const [draftTitle, setDraftTitle] = useState<string | null>(null)

  return (
    <div className="flex h-full flex-col overflow-hidden bg-white">
      {/* Full-width header row, kept OUTSIDE HealthcareFrontdeskCreateAgentScreen's own
          centered hero/composer wrapper so it sits flush-left at the page edge — same
          `px-2xl py-xl` convention as SuperAgentKnowledgeScreen/SuperAgentConnectionsScreen,
          not centered relative to the hero content below it. */}
      <div className="flex h-16 shrink-0 items-center gap-sm bg-surface px-2xl py-xl">
        <button
          type="button"
          onClick={onBack}
          className="flex size-7 shrink-0 items-center justify-center rounded-sm text-text-icon hover:bg-surface-hover"
          aria-label="Back"
        >
          <Icon name="arrow_back" size={20} />
        </button>
        <h1 className="text-h3 text-text-primary">{draftTitle ?? 'Create agent'}</h1>
      </div>

      <div className="flex min-h-0 flex-1 justify-center overflow-auto">
        <HealthcareFrontdeskCreateAgentScreen
          key={activeRole.id}
          hideHeaderBack
          onBack={onBack}
          onCreateFromScratch={() => onEditAgent('')}
          onSelectFromLibrary={(templateId) => {
            const card = landingCards.find((c) => c.id === templateId)
            onEditAgent(card?.title ?? '')
          }}
          onCreateAgent={() => onCreated()}
          onViewWorkflow={() => onEditAgent('')}
          onDraftReady={setDraftTitle}
          libraryCards={landingCards}
          initialPrompt={initialPrompt}
          fromScratchLabel="Setup manually"
          variant="frontdesk"
        />
      </div>
    </div>
  )
}
