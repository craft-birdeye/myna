/** Side-nav ids for response-agent exploration chrome variants. */
export const RESPONSE_AGENTS_EXPLORATION_NAV_ID = 'response-agents-exploration'
export const RESPONSE_AGENTS_SEP1_NAV_ID = 'response-agents-sep-1'
export const FRONTDESK_EXPLORATION_NAV_ID = 'frontdesk-agent-exploration'
export const FRONTDESK_SEP1_NAV_ID = 'frontdesk-agent-sep-1'
export const REMINDER_SEP1_NAV_ID = 'reminder-agent-sep-1'

const EXPLORATION_HIDE_TOP_IDENTITY_NAV_IDS = new Set([
  RESPONSE_AGENTS_EXPLORATION_NAV_ID,
  FRONTDESK_EXPLORATION_NAV_ID,
])

/** Exploration editor chrome (help RHS, version history, pause/resume, instance Workflow CTA, etc.). */
export function isResponseAgentsExplorationChrome(navId?: string | null) {
  return navId === RESPONSE_AGENTS_EXPLORATION_NAV_ID || navId === RESPONSE_AGENTS_SEP1_NAV_ID
}

export function isFrontdeskExplorationChrome(navId?: string | null) {
  return navId === FRONTDESK_EXPLORATION_NAV_ID || navId === FRONTDESK_SEP1_NAV_ID
}

export function isReminderExplorationChrome(navId?: string | null) {
  return navId === REMINDER_SEP1_NAV_ID
}

export function isAgentExplorationChrome(navId?: string | null) {
  return (
    isResponseAgentsExplorationChrome(navId) ||
    isFrontdeskExplorationChrome(navId) ||
    isReminderExplorationChrome(navId)
  )
}

/** Labelled LHS stack, single add-step search, SVG floater icons — all exploration-family canvases (exploration + Sep 1). */
export function isSep1Chrome(navId?: string | null) {
  return isAgentExplorationChrome(navId)
}

/** LLM task Setup/Configure layout (body tabs, Continue footer) — exploration nav ids only, not Sep 1. Chip two-line collapse applies to all exploration chrome incl. Sep 1. */
export function isLlmTaskExplorationLayout(navId?: string | null) {
  return navId === RESPONSE_AGENTS_EXPLORATION_NAV_ID || navId === FRONTDESK_EXPLORATION_NAV_ID
}

function explorationHidesCanvasStartNode(navId?: string | null) {
  return Boolean(navId && EXPLORATION_HIDE_TOP_IDENTITY_NAV_IDS.has(navId))
}

/** Hides the canvas agent-details start node (exploration only — Sep 1 keeps it on canvas). */
export function isExplorationHideCanvasStartNode(navId?: string | null) {
  return explorationHidesCanvasStartNode(navId)
}
