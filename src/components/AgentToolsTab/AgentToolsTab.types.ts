export type AgentToolsVariant = 'review' | 'frontdesk'

export interface AgentToolsTabProps {
  /** Review response uses the review catalog. Front desk (Sep 23) uses the front-desk catalog. */
  variant: AgentToolsVariant
}
