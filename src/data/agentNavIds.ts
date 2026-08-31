/** Side-nav ids for response-agent exploration chrome variants. */
export const RESPONSE_AGENTS_EXPLORATION_NAV_ID = 'response-agents-exploration'
export const RESPONSE_AGENTS_SEP1_NAV_ID = 'response-agents-sep-1'
/** Production side-nav id — shares Sep 1 list/card chrome with `RESPONSE_AGENTS_SEP1_NAV_ID`. */
export const RESPONSE_AGENTS_NAV_ID = 'response-agents'

/** Coach-cue prototype nav — auto-opens the workflow builder tour on canvas land. */
export function isResponseAgentsCoachCueNav(navId?: string | null) {
  return navId === RESPONSE_AGENTS_NAV_ID
}

export function isFrontdeskCoachCueNav(navId?: string | null) {
  return navId === FRONTDESK_NAV_ID
}

/** Response or Front desk production coach navs — auto tour + deferred trigger palette. */
export function isAgentCoachCueNav(navId?: string | null) {
  return isResponseAgentsCoachCueNav(navId) || isFrontdeskCoachCueNav(navId)
}

export const FRONTDESK_EXPLORATION_NAV_ID = 'frontdesk-agent-exploration'
export const FRONTDESK_SEP1_NAV_ID = 'frontdesk-agent-sep-1'
/** Production side-nav id — shares Sep 1 list/card chrome with `FRONTDESK_SEP1_NAV_ID`. */
export const FRONTDESK_NAV_ID = 'frontdesk-agent'
export const REMINDER_SEP1_NAV_ID = 'reminder-agent-sep-1'

const EXPLORATION_HIDE_TOP_IDENTITY_NAV_IDS = new Set([
  RESPONSE_AGENTS_EXPLORATION_NAV_ID,
  FRONTDESK_EXPLORATION_NAV_ID,
])

/** Production + Sep 1 response-agent navs — same agent-list card chrome (not the exploration variant). */
export function isResponseAgentsSep1StyleNav(navId?: string | null) {
  return navId === RESPONSE_AGENTS_SEP1_NAV_ID || navId === RESPONSE_AGENTS_NAV_ID
}

export function isResponseAgentsExplorationChrome(navId?: string | null) {
  return navId === RESPONSE_AGENTS_EXPLORATION_NAV_ID || isResponseAgentsSep1StyleNav(navId)
}

/** Production + Sep 1 front desk navs — same agent-list card chrome (not the exploration variant). */
export function isFrontdeskSep1StyleNav(navId?: string | null) {
  return navId === FRONTDESK_SEP1_NAV_ID || navId === FRONTDESK_NAV_ID
}

export function isFrontdeskExplorationChrome(navId?: string | null) {
  return navId === FRONTDESK_EXPLORATION_NAV_ID || isFrontdeskSep1StyleNav(navId)
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

/** Sep 1 side-nav ids (response / front desk / reminder). */
export function isSep1Nav(navId?: string | null) {
  return Boolean(navId?.includes('sep-1'))
}

/** Agent list uses Sep 1 card/grid chrome — includes production front desk + response navs. */
export function isSep1StyleAgentListNav(navId?: string | null) {
  return isSep1Nav(navId) || isFrontdeskSep1StyleNav(navId) || isResponseAgentsSep1StyleNav(navId)
}

function explorationHidesCanvasStartNode(navId?: string | null) {
  return Boolean(navId && EXPLORATION_HIDE_TOP_IDENTITY_NAV_IDS.has(navId))
}

/** Hides the canvas agent-details start node (exploration only — Sep 1 keeps it on canvas). */
export function isExplorationHideCanvasStartNode(navId?: string | null) {
  return explorationHidesCanvasStartNode(navId)
}
