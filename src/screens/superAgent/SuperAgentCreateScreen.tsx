import { useState } from 'react'
import { CreateAiGhostwriterShellHeader, HealthcareFrontdeskCreateAgentScreen } from '../AgentDetailScreen'
import { getAgentCreateInitialPrompt, getAgentCreateLandingCards } from './agentCreateScripts'
import {
  AGENT_CREATE_SCRIPTS,
  familyForLibraryKey,
  type Family,
} from '../../data/agentCreateFamilyScripts'
import { buildDraftWorkflow } from '../../data/draftWorkflowBuilder'
import type { AgentWorkflow } from '../../data/agentWorkflows'
import type { SuperAgentRole, SuperAgentPillar } from './superAgentSeedData'

// Per-pillar default family — mirrors `getAgentCreateInitialPrompt`'s own per-pillar
// framing (myna = front desk/booking, jay = reviews & listings, robin = follow-up/CX).
const DEFAULT_FAMILY_BY_PILLAR: Record<SuperAgentPillar, Family> = {
  myna: 'front-desk',
  jay: 'review-response',
  robin: 'general',
}

function defaultFamilyForRole(role: SuperAgentRole): Family {
  const primaryPillar = role.pillars[0] ?? 'myna'
  return DEFAULT_FAMILY_BY_PILLAR[primaryPillar]
}

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
   *  for the editor to return to this module's My agents on close. `initialWorkflow` seeds
   *  the canvas with demo-plausible nodes built from this screen's own chat script/jobs
   *  (see `buildDraftWorkflow`) instead of opening genuinely empty. */
  onEditAgent: (name: string, initialWorkflow?: AgentWorkflow) => void
  /** Fires when the scripted flow reaches its own "agent created" step. */
  onCreated: () => void
}

export function SuperAgentCreateScreen({ activeRole, onBack, onEditAgent, onCreated }: SuperAgentCreateScreenProps) {
  const landingCards = getAgentCreateLandingCards(activeRole)
  const initialPrompt = getAgentCreateInitialPrompt(activeRole)
  // Tracks the working title once the scripted flow produces a draft, so the header can
  // switch from "Create agent" the same way Front Desk's own ghostwriter header does.
  const [draftTitle, setDraftTitle] = useState<string | null>(null)
  // Which family of agent the chat is currently narrating — starts at the role's own
  // default and can change mid-conversation (see `onCreateScriptChange` below).
  const [family, setFamily] = useState<Family>(() => defaultFamilyForRole(activeRole))
  const createScript = AGENT_CREATE_SCRIPTS[family]

  const draftAgentName = draftTitle ?? 'Create agent'
  const draftWorkflowForEditor = (name: string): AgentWorkflow =>
    buildDraftWorkflow(createScript, createScript.jobs, name || draftAgentName)

  return (
    <div className="flex h-full flex-col overflow-hidden bg-white">
      <CreateAiGhostwriterShellHeader
        title={draftAgentName}
        onBack={onBack ?? (() => {})}
        onViewAgentBuilder={() => onEditAgent(draftTitle ?? '', draftWorkflowForEditor(draftTitle ?? ''))}
        viewAgentBuilderDisabled={!draftTitle}
        showDraftBadge={Boolean(draftTitle)}
      />

      <div className="flex min-h-0 flex-1 justify-center overflow-auto">
        <HealthcareFrontdeskCreateAgentScreen
          key={activeRole.id}
          activeRole={activeRole}
          hideHeaderBack
          onBack={onBack}
          onCreateFromScratch={() => onEditAgent('', draftWorkflowForEditor(''))}
          onSelectFromLibrary={(templateId) => {
            const card = landingCards.find((c) => c.id === templateId)
            const cardFamily = familyForLibraryKey(templateId)
            setFamily(cardFamily)
            onEditAgent(card?.title ?? '', buildDraftWorkflow(AGENT_CREATE_SCRIPTS[cardFamily], AGENT_CREATE_SCRIPTS[cardFamily].jobs, card?.title ?? ''))
          }}
          onCreateAgent={() => onCreated()}
          onViewWorkflow={() => onEditAgent(draftTitle ?? '', draftWorkflowForEditor(draftTitle ?? ''))}
          onDraftReady={setDraftTitle}
          libraryCards={landingCards}
          initialPrompt={initialPrompt}
          fromScratchLabel="Setup manually"
          variant="frontdesk"
          createScript={createScript}
          onCreateScriptChange={setFamily}
        />
      </div>
    </div>
  )
}
