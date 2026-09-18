/** Side-nav ids for response-agent exploration chrome variants. */
export const RESPONSE_AGENTS_EXPLORATION_NAV_ID = 'response-agents-exploration'
export const RESPONSE_AGENTS_SEP1_NAV_ID = 'response-agents-sep-1'
/** Production side-nav id — shares Sep 1 list/card chrome with `RESPONSE_AGENTS_SEP1_NAV_ID`. */
export const RESPONSE_AGENTS_NAV_ID = 'response-agents'
/** Duplicate of Sep 1 — same agent, same chrome, its own nav slot. */
export const RESPONSE_AGENTS_FULL_CANVAS_NAV_ID = 'response-agents-full-canvas'
/**
 * "Response agent (simulation)" — its own nav slot, sharing the exploration nav's Ghostwriter
 * conversation. Ghostwriter tab starts populated as usual, but Workflow/Tools/Knowledge/
 * Simulation start empty. Simulation instead builds up a running set of test cases (with a
 * tab count badge) as the Ghostwriter conversation progresses. See `isResponseAgentsSimulationNav`.
 */
export const RESPONSE_AGENTS_SIMULATION_NAV_ID = 'response-agents-simulation'
/**
 * "RA sim 2" — duplicate of Response agent (simulation) that runs itself: once the Ghostwriter
 * finishes building the agent, it auto-starts "Simulate test cases" (no pill click needed), and
 * auto-runs the Fix flow on each failed case as it's revealed. See `isAutoSimulationNav`.
 */
export const RESPONSE_AGENTS_SIMULATION_2_NAV_ID = 'response-agents-simulation-2'

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
  RESPONSE_AGENTS_SIMULATION_NAV_ID,
  RESPONSE_AGENTS_SIMULATION_2_NAV_ID,
  FRONTDESK_EXPLORATION_NAV_ID,
  // Full canvas keeps the start node on canvas (unlike exploration) — see
  // isResponseAgentsExplorationNav / isLlmTaskExplorationLayout below for the other
  // exploration-style behaviors it does mirror.
])

/** Production + Sep 1 response-agent navs — same agent-list card chrome (not the exploration variant). */
export function isResponseAgentsSep1StyleNav(navId?: string | null) {
  return (
    navId === RESPONSE_AGENTS_SEP1_NAV_ID ||
    navId === RESPONSE_AGENTS_NAV_ID ||
    navId === RESPONSE_AGENTS_FULL_CANVAS_NAV_ID
  )
}

export function isResponseAgentsExplorationChrome(navId?: string | null) {
  return (
    navId === RESPONSE_AGENTS_EXPLORATION_NAV_ID ||
    navId === RESPONSE_AGENTS_SIMULATION_NAV_ID ||
    navId === RESPONSE_AGENTS_SIMULATION_2_NAV_ID ||
    isResponseAgentsSep1StyleNav(navId)
  )
}

/**
 * Response agents (exploration) — not Sep 1, not the coach-cue nav, which
 * share both the agent name and `explorationChrome` with it. Gates the
 * location-aware identity header (Add location CTA, name truncation, hover card).
 * Full canvas mirrors this too — its own design sandbox for iterating on exploration's
 * ideas without touching Sep 1/coach-cue. Response agent (simulation) and RA sim 2 mirror it
 * as well — see `isResponseAgentsSimulationNav` for the tab-shell differences specific to them,
 * and `isAutoSimulationNav` for what's specific to RA sim 2 alone.
 */
export function isResponseAgentsExplorationNav(navId?: string | null) {
  return (
    navId === RESPONSE_AGENTS_EXPLORATION_NAV_ID ||
    navId === RESPONSE_AGENTS_FULL_CANVAS_NAV_ID ||
    navId === RESPONSE_AGENTS_SIMULATION_NAV_ID ||
    navId === RESPONSE_AGENTS_SIMULATION_2_NAV_ID
  )
}

/**
 * Response agent (simulation) and RA sim 2 — gates the tab-shell differences from the original
 * exploration: Workflow starts (and stays) empty like Tools/Knowledge instead of opening
 * the canvas, and Simulation builds up test cases as the Ghostwriter conversation progresses.
 */
export function isResponseAgentsSimulationNav(navId?: string | null) {
  return navId === RESPONSE_AGENTS_SIMULATION_NAV_ID || navId === RESPONSE_AGENTS_SIMULATION_2_NAV_ID
}

/**
 * RA sim 2 only — on top of everything `isResponseAgentsSimulationNav` gates, this nav also
 * auto-starts "Simulate test cases" once the agent is built (no pill click) and auto-runs the
 * Fix flow on each failed case as it's revealed (no Fix click).
 */
export function isAutoSimulationNav(navId?: string | null) {
  return navId === RESPONSE_AGENTS_SIMULATION_2_NAV_ID
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

/** LLM task Setup/Configure layout (body tabs, Continue footer) — exploration nav ids only, not
 *  Sep 1. Full canvas follows Sep 1 here (segmented Basic/Prompts/Fields/Context tabs, no layout
 *  picker), so it is deliberately absent. Chip two-line collapse applies to all exploration
 *  chrome incl. Sep 1. */
export function isLlmTaskExplorationLayout(navId?: string | null) {
  return (
    navId === RESPONSE_AGENTS_EXPLORATION_NAV_ID ||
    navId === RESPONSE_AGENTS_SIMULATION_NAV_ID ||
    navId === RESPONSE_AGENTS_SIMULATION_2_NAV_ID ||
    navId === FRONTDESK_EXPLORATION_NAV_ID
  )
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
