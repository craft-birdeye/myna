/**
 * WorkflowViewerTab
 * View-only workflow canvas on the Workflow tab of AgentInstanceScreen.
 * - No LHS drawer, no yellow banner, no editing
 * - Floating top chrome shows only Edit workflow (pencil, via onEdit) + Run test (play)
 * - Canvas has left/right padding and rounded corners
 */
import React, { Suspense } from 'react'
import {
  AUTOMOTIVE_AGENT_WORKFLOWS,
  DENTAL_AGENT_WORKFLOWS,
  HEALTHCARE_AGENT_WORKFLOWS,
  HEALTHCARE_REMINDER_NORTH_WORKFLOW,
} from '../data/agentWorkflows'
import { useProcedureStore } from '../data/ProcedureStoreContext'

// @ts-ignore
import AgentBuilderRaw from '../workflow/AgentBuilder/AgentBuilder'
import { isFrontDeskCanvasAgent } from '../workflow/LHSDrawer/LHSDrawer'
const AgentBuilder = AgentBuilderRaw as unknown as React.ComponentType<any>

const EMPTY_WORKFLOW = {
  nodes: [],
  nodeDetails: { '__start__': { agentName: '', goals: '', outcomes: '', locations: [] } },
}

interface WorkflowViewerTabProps {
  instanceName: string
  /** Overrides the start-node / page title (e.g. newly created draft name). */
  displayName?: string
  onEdit: () => void
  product?: string
}

export function WorkflowViewerTab({ instanceName, displayName, onEdit, product }: WorkflowViewerTabProps) {
  const { procedures } = useProcedureStore()
  // instanceName is e.g. "Frontdesk agent - North region"; extract the agent name prefix
  const agentName = instanceName.replace(/ - .+$/, '')
  const shownName = displayName ?? instanceName
  const isHCProduct = product === 'healthcare' || product === 'dental'

  const filteredProcedures = procedures.filter((p) =>
    isHCProduct ? p.category === 'Healthcare Frontdesk' : p.category !== 'Healthcare Frontdesk'
  )
  const workflowMap =
    product === 'healthcare' ? HEALTHCARE_AGENT_WORKFLOWS :
    product === 'dental'     ? DENTAL_AGENT_WORKFLOWS     :
                               AUTOMOTIVE_AGENT_WORKFLOWS
  const baseWorkflow =
    product === 'healthcare' && instanceName === 'Reminder agent - North region'
      ? HEALTHCARE_REMINDER_NORTH_WORKFLOW
      : workflowMap[agentName] ?? EMPTY_WORKFLOW

  // Patch the start-node label so newly created drafts show their draft name on the canvas.
  const workflow = {
    nodes: baseWorkflow.nodes,
    nodeDetails: {
      ...baseWorkflow.nodeDetails,
      '__start__': {
        ...(baseWorkflow.nodeDetails?.['__start__'] ?? {}),
        agentName: shownName,
      },
    },
  }

  return (
    <div className="relative flex-1 overflow-hidden" style={{ height: '100%' }}>
      {/* Scoped CSS overrides */}
      <style>{`
        .wf-viewer .faq-ab-embedded       { height: 100% !important; }
        /* Flat, slightly darker than the page — matches the log detail canvas. */
        .wf-viewer .agent-builder-wrapper { background-color: #eef0f4 !important; background-image: none !important; margin: 0 20px 20px !important; border-radius: 12px !important; overflow: hidden !important; }
        .wf-viewer .flow-canvas { background-color: #eef0f4 !important; background-image: none !important; }
        .wf-viewer .agent-builder         { border-radius: 12px !important; overflow: hidden !important; padding: 0 !important; gap: 0 !important; }
        .wf-viewer .flow-canvas           { border-radius: 12px !important; }
        .wf-viewer .flow-canvas__toolbar-anchor--rr-chrome { top: auto !important; bottom: 16px !important; left: 16px !important; right: 16px !important; }
        .wf-viewer .graph-controls__toggle { display: none !important; }
        /* Node toggles are disabled here (state display, not a control) — don't invite clicks. */
        .wf-viewer .cnh__toggle, .wf-viewer .cnh__toggle * { cursor: default !important; }
        .wf-viewer .cnh__toggle { opacity: 0.75; }
      `}</style>

      <div className="wf-viewer" style={{ height: '100%' }}>
        <Suspense fallback={
          <div className="flex h-full items-center justify-center text-sm" style={{ color: '#9e9e9e' }}>
            Loading workflow…
          </div>
        }>
          <AgentBuilder
            key={`${agentName}::${shownName}::${product ?? 'automotive'}`}
            pageTitle={shownName}
            appTitle={shownName}
            viewOnly={true}
            viewChromeActions
            onEdit={onEdit}
            product={product ?? 'automotive'}
            moduleSlug="myna"
            moduleContext="myna"
            sectionContext="workflow"
            navItems={[]}
            initialNodes={workflow.nodes}
            initialNodeDetails={workflow.nodeDetails}
            procedures={filteredProcedures}
            showProceduresPalette={isFrontDeskCanvasAgent(agentName, shownName)}
            defaultOpenSection="Tasks"
          />
        </Suspense>
      </div>
    </div>
  )
}
