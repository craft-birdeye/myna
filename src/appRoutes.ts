/** Instance-level tabs on AgentInstanceScreen. */
export const INSTANCE_TABS = new Set(['outcomes', 'workflow', 'logs', 'recommendation', 'settings'])

/** Agent-list tabs on AgentDetailScreen (no instance selected). */
export const AGENT_LIST_TABS = new Set(['agents', 'outcomes'])

export const DEFAULT_INSTANCE_SLUG = 'north-region'

export type DeepRoute = {
  /** Agent directory tab when no instance is open. */
  listTab?: string
  instanceSlug?: string
  tab?: string
  logSlug?: string
  panel?: string
  recId?: string
}

export type AppRoute = {
  railId: string
  navId?: string
  deep: DeepRoute
}

export function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** "Front desk agent - North region" → "north-region". */
export function instanceSlugFromName(instanceName: string): string {
  const idx = instanceName.indexOf(' - ')
  const region = idx >= 0 ? instanceName.slice(idx + 3) : instanceName
  return slugify(region)
}

export function logSlugFromTimestamp(timestamp: string): string {
  return slugify(timestamp)
}

export function parseDeepSegments(rest: string[]): DeepRoute {
  const deep: DeepRoute = {}
  if (rest.length === 0) return deep

  if (rest[0] === 'agents' && rest.length === 1) {
    deep.listTab = 'agents'
    return deep
  }
  if (rest[0] === 'outcomes' && rest.length === 1) {
    deep.listTab = 'outcomes'
    return deep
  }

  let i = 0
  if (INSTANCE_TABS.has(rest[0]) && rest[0] !== 'outcomes') {
    deep.instanceSlug = DEFAULT_INSTANCE_SLUG
    deep.tab = rest[0]
    i = 1
  } else {
    deep.instanceSlug = rest[0]
    i = 1
    if (rest[i] && INSTANCE_TABS.has(rest[i])) {
      deep.tab = rest[i]
      i += 1
    } else {
      deep.tab = 'outcomes'
    }
  }

  if (deep.tab === 'logs' && rest[i]) {
    deep.logSlug = rest[i]
    i += 1
    if (rest[i]) deep.panel = rest[i]
  } else if (deep.tab === 'recommendation' && rest[i]) {
    deep.recId = rest[i]
  }

  return deep
}

export function serializeDeep(deep: DeepRoute): string {
  const parts: string[] = []
  if (!deep.instanceSlug) {
    if (deep.listTab && deep.listTab !== 'agents') parts.push(deep.listTab)
    return parts.length ? `/${parts.join('/')}` : ''
  }
  parts.push(deep.instanceSlug)
  const tab = deep.tab ?? 'outcomes'
  if (tab !== 'outcomes' || deep.logSlug || deep.recId) parts.push(tab)
  if (tab === 'logs' && deep.logSlug) {
    parts.push(deep.logSlug)
    if (deep.panel) parts.push(deep.panel)
  }
  if (tab === 'recommendation' && deep.recId) parts.push(deep.recId)
  return `/${parts.join('/')}`
}
