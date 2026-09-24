import { Suspense, useEffect, useRef, type ComponentType } from 'react'
import { createPortal } from 'react-dom'
import { getAgentWorkflows } from '../../data/agentWorkflows'
import { useProcedureStore } from '../../data/ProcedureStoreContext'
import { Icon } from '../Icon/Icon'
import type { AgentLibraryPreviewModalProps } from './AgentLibraryPreviewModal.types'
import { isFrontDeskCanvasAgent } from '../../workflow/LHSDrawer/LHSDrawer'

// @ts-ignore
import AgentBuilderRaw from '../../workflow/AgentBuilder/AgentBuilder'
const AgentBuilder = AgentBuilderRaw as unknown as ComponentType<Record<string, unknown>>

const EMPTY_WORKFLOW = {
  nodes: [],
  nodeDetails: { '__start__': { agentName: '', goals: '', outcomes: '', locations: [] } },
}

export function AgentLibraryPreviewModal({
  open,
  data,
  onClose,
  onUseAgent,
}: AgentLibraryPreviewModalProps) {
  const dialogRef = useRef<HTMLDivElement | null>(null)
  const { procedures } = useProcedureStore()

  useEffect(() => {
    if (!open) return
    const id = window.requestAnimationFrame(() => dialogRef.current?.focus())
    return () => window.cancelAnimationFrame(id)
  }, [open])

  if (!open || !data) return null

  const product = data.product ?? 'healthcare'
  const isHCProduct = product === 'healthcare' || product === 'dental'
  const agentKey = data.workflowAgentName ?? 'Front desk agent'
  const base = getAgentWorkflows(product)[agentKey] ?? EMPTY_WORKFLOW
  const workflow = {
    nodes: base.nodes,
    nodeDetails: {
      ...base.nodeDetails,
      '__start__': {
        ...(base.nodeDetails?.['__start__'] ?? {}),
        agentName: data.name,
        goals: data.goal,
        outcomes: data.outcome,
      },
    },
  }
  const filteredProcedures = procedures.filter((p) =>
    isHCProduct ? p.category === 'Healthcare Frontdesk' : p.category !== 'Healthcare Frontdesk',
  )

  return createPortal(
    <div
      ref={dialogRef}
      tabIndex={-1}
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-lg outline-none"
      role="dialog"
      aria-modal
      aria-label="Preview"
    >
      <div className="flex h-[min(720px,90vh)] w-full max-w-[1100px] flex-col overflow-hidden rounded-lg border border-border bg-surface shadow-modal">
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-border px-lg">
          <h2 className="text-h3 text-text-primary">Preview</h2>
          <div className="flex items-center gap-sm">
            <button
              type="button"
              onClick={onUseAgent}
              className="flex h-9 items-center rounded-sm bg-primary px-lg text-body text-white transition-colors hover:bg-primary-hover"
            >
              Use agent
            </button>
            <button
              type="button"
              aria-label="Close"
              onClick={onClose}
              className="flex size-8 items-center justify-center rounded-sm text-text-icon hover:bg-surface-hover"
            >
              <Icon name="close" size={20} />
            </button>
          </div>
        </div>

        <div className="flex min-h-0 flex-1">
          <aside className="flex w-[300px] shrink-0 flex-col gap-xl overflow-y-auto border-r border-border py-xl pl-lg pr-xl">
            <div className="flex flex-col gap-xs">
              <span className="text-small text-text-secondary">Name</span>
              <p className="text-body text-text-primary">{data.name}</p>
            </div>
            <div className="flex flex-col gap-xs">
              <span className="text-small text-text-secondary">Goal</span>
              <p className="text-body text-text-primary">{data.goal}</p>
            </div>
            <div className="flex flex-col gap-xs">
              <span className="text-small text-text-secondary">Outcome</span>
              <p className="text-body text-text-primary">{data.outcome}</p>
            </div>
          </aside>

          <div className="relative min-h-0 min-w-0 flex-1 overflow-hidden">
            <style>{`
              .library-preview-wf { height: 100%; }
              .library-preview-wf .faq-ab-embedded { height: 100% !important; }
              .library-preview-wf .faq-ab-embedded--rr-chrome .agent-builder-wrapper,
              .library-preview-wf .agent-builder--rr-chrome,
              .library-preview-wf .agent-builder-wrapper,
              .library-preview-wf .agent-builder__canvas,
              .library-preview-wf .flow-canvas,
              .library-preview-wf .flow-canvas .react-flow,
              .library-preview-wf .flow-canvas .react-flow__renderer,
              .library-preview-wf .flow-canvas .react-flow__pane {
                background-color: #f2f4f7 !important;
                background-image: none !important;
              }
              .library-preview-wf .agent-builder-wrapper { margin: 0 !important; border-radius: 0 !important; overflow: hidden !important; }
              .library-preview-wf .agent-builder { border-radius: 0 !important; overflow: hidden !important; padding: 0 !important; gap: 0 !important; }
              .library-preview-wf .flow-canvas { border-radius: 0 !important; }
              .library-preview-wf .flow-canvas__toolbar-anchor--rr-chrome { top: auto !important; bottom: 16px !important; left: 16px !important; right: auto !important; }
              .library-preview-wf .graph-controls__toggle,
              .library-preview-wf .rr-chrome-top,
              .library-preview-wf .rr-chrome-help-wrap,
              .library-preview-wf .ab-view-badge { display: none !important; }
              .library-preview-wf .cnh__toggle, .library-preview-wf .cnh__toggle * { cursor: default !important; }
              .library-preview-wf .cnh__toggle { opacity: 0.75; }
            `}</style>
            <div className="library-preview-wf">
              <Suspense
                fallback={
                  <div className="flex h-full items-center justify-center text-sm text-text-tertiary">
                    Loading workflow…
                  </div>
                }
              >
                <AgentBuilder
                  key={`${agentKey}::${data.id}::${product}`}
                  pageTitle={data.name}
                  appTitle={data.name}
                  viewOnly
                  hideLhs
                  product={product}
                  moduleSlug="myna"
                  moduleContext="myna"
                  sectionContext="workflow"
                  navItems={[]}
                  initialNodes={workflow.nodes}
                  initialNodeDetails={workflow.nodeDetails}
                  procedures={filteredProcedures}
                  showProceduresPalette={isFrontDeskCanvasAgent(agentKey, data.name)}
                  defaultOpenSection="Tasks"
                />
              </Suspense>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
