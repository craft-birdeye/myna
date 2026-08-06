import { HealthcareFrontdeskCreateAgentScreen } from '../../screens/AgentDetailScreen'
import { createChatVariantForAgent } from '../../data/createAgentChatStore'
import { AgentAiChatPanelProps } from './AgentAiChatPanel.types'

/** The edit-pencil canvas's "Create with AI" panel — this is the *exact same* chat component
 *  used by the create-agent flow (`HealthcareFrontdeskCreateAgentScreen`, `AgentDetailScreen.tsx`),
 *  not a lookalike. One implementation, two call sites; nothing here can drift from flow #1
 *  because there's only one chat engine.
 *
 *  `LHSDrawer` owns the surrounding shell (docked card + tabs, or the expanded header) and
 *  renders this component as the same child either way, so its conversation state survives the
 *  dock/expand toggle instead of being lost to a remount — this component only needs to apply
 *  the width constraint that matches whichever shell it's currently sitting in. */
export function AgentAiChatPanel({ agentName, expanded = false, onCollapse }: AgentAiChatPanelProps) {
  const variant = createChatVariantForAgent(agentName) === 'reminder' ? 'reminder' : 'frontdesk'

  return (
    <div
      className={
        expanded
          ? 'flex min-h-0 w-full flex-1 justify-center overflow-hidden px-lg'
          : 'flex min-h-0 w-full flex-1 flex-col'
      }
    >
      <div className={expanded ? 'flex min-h-0 w-full max-w-[720px] flex-1 flex-col' : 'flex min-h-0 w-full flex-1 flex-col'}>
        <HealthcareFrontdeskCreateAgentScreen
          onCreateFromScratch={() => {}}
          onSelectFromLibrary={() => {}}
          onCreateAgent={() => onCollapse?.()}
          variant={variant}
          workflowVisible
          compactLanding
        />
      </div>
    </div>
  )
}
