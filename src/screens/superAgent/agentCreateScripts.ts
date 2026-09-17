// Per-role landing content for the Agents module's "Create agent" screen, which renders
// the real `HealthcareFrontdeskCreateAgentScreen`/`HealthcareFrontdeskCreateAgentLive`
// (src/screens/AgentDetailScreen.tsx) instead of a lookalike fork — see that component's
// `libraryCards`/`initialPrompt`/`fromScratchLabel` props, which are the only pieces of the
// landing view that vary per caller. Everything past the first submitted message (the
// scripted "Thoughts" → jobs checklist → docs-ask narrative) is the existing generic
// Front Desk script — there's no per-family version of that deeper narrative today.

import type { LibraryCardGlyph, LibraryCardTone } from '../../components'
import {
  isLibraryAgentVisibleForRole,
  SUPER_AGENT_LIBRARY_AGENTS,
  type SuperAgentPillar,
  type SuperAgentRole,
} from './superAgentSeedData'

export interface AgentCreateLandingCard {
  id: string
  title: string
  description: string
  glyph?: LibraryCardGlyph
  tone?: LibraryCardTone
}

const TONE_CYCLE: LibraryCardTone[] = ['info', 'success', 'ai']

/** Role-visible Library agents, recommended first — reused as the landing's template
 *  cards so "Use agent" always points at a real, existing Library entry. */
export function getAgentCreateLandingCards(role: SuperAgentRole, limit = 3): AgentCreateLandingCard[] {
  const visible = SUPER_AGENT_LIBRARY_AGENTS.filter((agent) => isLibraryAgentVisibleForRole(agent, role))
  const ranked = [...visible].sort((a, b) => (b.recommended ? 1 : 0) - (a.recommended ? 1 : 0))
  return ranked.slice(0, limit).map((agent, i) => ({
    id: agent.key,
    title: agent.name,
    description: agent.description,
    glyph: agent.glyph as LibraryCardGlyph,
    tone: TONE_CYCLE[i % TONE_CYCLE.length],
  }))
}

// Focuses the composer on a prompt matching the role's primary pillar, mirroring how
// `JOHN_CREATE_PROMPT` focuses Front Desk's own composer.
const PILLAR_PROMPT_HINT: Record<SuperAgentPillar, string> = {
  myna: 'Build me an agent that answers calls and chats, qualifies the visitor, and books the appointment automatically.',
  jay: 'Build me an agent that watches my reviews and listings, and keeps my online presence accurate and on-brand.',
  robin: 'Build me an agent that follows up on customer feedback and flags anything that needs a human before it becomes a bigger problem.',
}

export function getAgentCreateInitialPrompt(role: SuperAgentRole): string {
  const primaryPillar = role.pillars[0] ?? 'myna'
  return PILLAR_PROMPT_HINT[primaryPillar]
}
